// filepath: d:\NutriVerseAI\server\ai-services\recipe-recommendation-ai.js
import { model, safeJsonParse, generateContent } from "./gemini-client"
import { db } from "../db"
import { 
  recipeRecommendations, 
  recommendationFeedback, 
  recommendationTriggers,
  seasonalIngredients,
  recipes,
  pantryItems,
  nutritionGoals,
  recipeConsumption
} from "../shared/schema"
import { eq, and, desc, sql, notInArray } from "drizzle-orm"

// Helper function to get current season
function getCurrentSeason() {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "fall";
  return "winter";
}

// Helper function to get seasonal ingredients
async function getSeasonalIngredients() {
  const currentSeason = getCurrentSeason();
  return await db.select()
    .from(seasonalIngredients)
    .where(eq(seasonalIngredients.season, currentSeason));
}

// Helper function to get user's cooking history
async function getUserCookingHistory(userId) {
  return await db.select()
    .from(recipeConsumption)
    .where(eq(recipeConsumption.userId, userId))
    .orderBy(desc(recipeConsumption.consumedAt))
    .limit(10);
}

// Helper function to get user's feedback on recommendations
async function getUserRecommendationFeedback(userId) {
  return await db.select()
    .from(recommendationFeedback)
    .where(eq(recommendationFeedback.userId, userId))
    .orderBy(desc(recommendationFeedback.createdAt))
    .limit(20);
}

// Helper function to create a recommendation trigger
async function createRecommendationTrigger(userId, triggerType, triggerData) {
  return await db.insert(recommendationTriggers)
    .values({
      userId,
      triggerType,
      triggerData,
      affectedRecommendations: [],
      status: "pending"
    });
}

// Helper function to process recommendation triggers
async function processRecommendationTriggers(userId) {
  const triggers = await db.select()
    .from(recommendationTriggers)
    .where(
      and(
        eq(recommendationTriggers.userId, userId),
        eq(recommendationTriggers.status, "pending")
      )
    );
  
  for (const trigger of triggers) {
    // Mark trigger as processed
    await db.update(recommendationTriggers)
      .set({
        status: "processed",
        processedAt: new Date()
      })
      .where(eq(recommendationTriggers.id, trigger.id));
    
    // Regenerate recommendations if needed
    await getPersonalizedRecipeRecommendations({
      userId,
      triggerType: trigger.triggerType,
      triggerData: trigger.triggerData
    });
  }
}

/**
 * Generate personalized recipe recommendations based on user preferences, past recipes,
 * dietary preferences, cooking skills, and available ingredients.
 *
 * @param {Object} options - Recommendation options
 * @param {number} options.userId - User ID
 * @param {Array} options.userRecipes - User's previously created recipes
 * @param {Object} options.nutritionGoals - User's nutrition goals
 * @param {Array} options.dietaryPreferences - User's dietary preferences
 * @param {Array} options.pantryItems - User's available pantry items
 * @param {Object} options.cookingSkills - User's cooking skill levels
 * @param {Array} options.userPreferences - User's food preferences
 * @param {string} options.triggerType - Type of trigger that caused this generation
 * @param {Object} options.triggerData - Data about the trigger
 * @returns {Promise<Array>} - Array of personalized recipe recommendations
 */
export async function getPersonalizedRecipeRecommendations(options) {
  try {
    // Extract all options with default values
    const {
      userId,
      userRecipes = [],
      nutritionGoals = null,
      dietaryPreferences = [],
      pantryItems = [],
      cookingSkills = { level: "intermediate" },
      userPreferences = [],
      triggerType = "manual",
      triggerData = {}
    } = options;

    if (!userId) {
      throw new Error("userId is required");
    }

    console.log("Starting personalized recipe recommendations for user:", userId);

    // Get additional data for personalization
    let seasonalIngredientsList = [];
    let cookingHistory = [];
    let recommendationFeedback = [];

    try {
      seasonalIngredientsList = await getSeasonalIngredients();
      console.log("Retrieved seasonal ingredients:", seasonalIngredientsList.length);
    } catch (error) {
      console.error("Error getting seasonal ingredients:", error);
      // Continue with empty list
    }

    try {
      cookingHistory = await getUserCookingHistory(userId);
      console.log("Retrieved cooking history:", cookingHistory.length);
    } catch (error) {
      console.error("Error getting cooking history:", error);
      // Continue with empty list
    }

    try {
      recommendationFeedback = await getUserRecommendationFeedback(userId);
      console.log("Retrieved recommendation feedback:", recommendationFeedback.length);
    } catch (error) {
      console.error("Error getting recommendation feedback:", error);
      // Continue with empty list
    }
    
    // Create a snapshot of user data for comparison
    const userDataSnapshot = {
      recipes: userRecipes,
      nutritionGoals,
      dietaryPreferences,
      pantryItems,
      cookingSkills,
      userPreferences,
      seasonalIngredients: seasonalIngredientsList,
      cookingHistory,
      recommendationFeedback
    };

    // Fetch all available recipes from the database
    let availableRecipes = [];
    try {
      // Only fetch recipes created by the current user instead of all recipes in the database
      availableRecipes = userRecipes;
      
      console.log(`Using ${availableRecipes.length} user-created recipes for recommendations`);
    } catch (error) {
      console.error("Error using user recipes:", error);
      return [];
    }

    if (!availableRecipes || availableRecipes.length === 0) {
      console.log("No available recipes found for recommendations");
      return [];
    }

    // Prepare the prompt for Gemini to generate new recipes based on available ones
    const prompt = `You are a creative recipe recommendation system. Your task is to generate NEW, UNIQUE recipes based on the user's preferences and the available recipes in our system.

User Profile:
- Dietary preferences: ${dietaryPreferences.join(", ") || "none specified"}
- Nutrition goals: ${JSON.stringify(nutritionGoals) || "none specified"}
- Cooking skill level: ${cookingSkills.level}
- Available pantry items: ${pantryItems.join(", ") || "none specified"}
- Seasonal ingredients: ${seasonalIngredientsList.map(i => i.name).join(", ") || "none specified"}

AVAILABLE RECIPES IN OUR SYSTEM (for reference and inspiration):
${availableRecipes.map(recipe => `Title: "${recipe.title}", Description: "${recipe.description}"`).join('\n')}

REQUIREMENTS:
1. Generate 3 NEW, UNIQUE recipes that would be a good match for this user
2. These should be COMPLETELY NEW recipes, not just modifications of existing ones
3. Each recipe should be inspired by the available recipes but tailored to the user's specific needs
4. For each recipe, provide:
   - A unique, creative title
   - A detailed description
   - A list of ingredients with quantities (each ingredient must be a separate string in the array)
   - Step-by-step cooking instructions (each step must be a separate string in the array)
   - Nutrition information (calories, protein, carbs, fat)
   - Prep time in minutes
   - A detailed explanation of why this recipe is a good match for this user
   - A priority score (1-10) based on how well it matches the user's preferences

IMPORTANT: Your response must be a valid JSON array with proper formatting. Each ingredient and instruction must be a separate string in their respective arrays. Do not combine multiple ingredients or instructions into a single string. Use regular quotes (") instead of smart quotes ("). DO NOT include any markdown formatting like \`\`\`json or \`\`\` in your response.

Your response must be a JSON array:
[
  {
    "title": string,
    "description": string,
    "ingredients": string[],
    "instructions": string[],
    "nutritionInfo": {
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number
    },
    "prepTime": number,
    "explanation": string,
    "priority": number
  }
]`;

    let response;
    try {
      console.log("Sending request to Gemini API for personalized recommendations");
      const result = await model.generateContent(prompt);
      response = await result.response.text();
      console.log("Raw AI response:", response);
      
      // Clean the response by removing markdown code block formatting and replacing smart quotes
      let cleanedResponse = response
        .replace(/```json\s*/g, '')  // Remove ```json
        .replace(/```\s*$/g, '')     // Remove trailing ```
        .replace(/[""]/g, '"')       // Replace smart quotes with regular quotes
        .replace(/[""]/g, '"')       // Replace other smart quotes with regular quotes
        .replace(/['']/g, "'")       // Replace smart single quotes with regular single quotes
        .replace(/['']/g, "'");      // Replace other smart single quotes with regular single quotes
      
      console.log("Cleaned Gemini response:", cleanedResponse);
      
      let newRecipes;
      try {
        newRecipes = JSON.parse(cleanedResponse);
      } catch (error) {
        console.error("Initial JSON parse failed:", error);
        
        // Try to fix common JSON issues
        let fixedResponse = cleanedResponse;
        
        // Fix issues with ingredients arrays that have multiple items in a single string
        fixedResponse = fixedResponse.replace(/"ingredients": \[([^\]]+)\]/g, (match, ingredients) => {
          // Split ingredients by commas and wrap each in quotes
          const ingredientsList = ingredients.split(',').map(ing => {
            // Clean up the ingredient string
            const cleanIng = ing.trim().replace(/^"|"$/g, '');
            return `"${cleanIng}"`;
          });
          return `"ingredients": [${ingredientsList.join(', ')}]`;
        });
        
        // Fix issues with instructions arrays that have multiple items in a single string
        fixedResponse = fixedResponse.replace(/"instructions": \[([^\]]+)\]/g, (match, instructions) => {
          // Split instructions by periods and wrap each in quotes
          const instructionsList = instructions.split('.').map(inst => {
            // Clean up the instruction string
            const cleanInst = inst.trim().replace(/^"|"$/g, '');
            return cleanInst ? `"${cleanInst}."` : null;
          }).filter(Boolean);
          return `"instructions": [${instructionsList.join(', ')}]`;
        });
        
        // Try parsing again with the fixed response
        try {
          newRecipes = JSON.parse(fixedResponse);
        } catch (parseError) {
          console.error("Second JSON parse attempt failed:", parseError);
          
          // Last resort: try to extract the JSON array using regex
          try {
            const jsonMatch = fixedResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (jsonMatch) {
              const extractedJson = jsonMatch[0];
              console.log("Extracted JSON using regex:", extractedJson);
              newRecipes = JSON.parse(extractedJson);
            } else {
              throw new Error("Could not extract valid JSON from response");
            }
          } catch (extractError) {
            console.error("Failed to extract JSON using regex:", extractError);
            throw new Error("Failed to parse AI response as JSON after all attempts");
          }
        }
      }
      
      // Validate each recipe
      newRecipes.forEach((recipe, index) => {
        if (!recipe.title || !recipe.description || !Array.isArray(recipe.ingredients) || 
            !Array.isArray(recipe.instructions) || !recipe.nutritionInfo || 
            !recipe.prepTime || !recipe.explanation || typeof recipe.priority !== 'number') {
          console.error(`Invalid recipe format at index ${index}:`, recipe);
          throw new Error(`Invalid recipe format at index ${index}`);
        }
      });
      
      // Sort by priority
      newRecipes.sort((a, b) => b.priority - a.priority);
      
      // Format recipes for direct return
      const formattedRecipes = newRecipes.map((recipe, index) => ({
        id: -1000 - index, // Use negative IDs for AI-generated recipes
        recommendationId: -1000 - index, // Use negative IDs for AI-generated recipes
        matchScore: recipe.priority * 10,
        reasonForRecommendation: recipe.explanation,
        seasonalRelevance: false,
        recipeData: recipe,
        isAiGenerated: true // Flag to indicate this is an AI-generated recipe
      }));
      
      console.log("Generated new recipe recommendations:", formattedRecipes.length);
      return formattedRecipes;
    } catch (error) {
      console.error('Error processing recipe recommendations:', error);
      console.error('Raw response:', response);
      throw new Error('Failed to generate valid recipe recommendations');
    }
  } catch (error) {
    console.error('Error in getPersonalizedRecipeRecommendations:', error);
    throw error; // Re-throw the error instead of using fallback
  }
}

/**
 * Record user feedback on a recommendation
 * 
 * @param {Object} options - Feedback options
 * @param {number} options.userId - User ID
 * @param {number} options.recommendationId - Recommendation ID
 * @param {number} options.rating - Rating (1-5)
 * @param {string} options.feedback - Optional text feedback
 * @param {boolean} options.wasCooked - Whether the recipe was cooked
 * @param {boolean} options.wasSaved - Whether the recipe was saved
 * @param {boolean} options.wasShared - Whether the recipe was shared
 * @param {string} options.cookingNotes - Notes from when the user cooked this recipe
 * @param {Object} options.modifications - Any modifications the user made to the recipe
 * @param {number} options.difficultyRating - How difficult the user found the recipe
 * @param {number} options.timeAccuracy - How accurate the prep time was (1-5)
 * @param {number} options.tasteRating - How much the user enjoyed the taste (1-5)
 * @param {number} options.healthinessRating - How healthy the user found the recipe (1-5)
 * @returns {Promise<Object>} - The created feedback record
 */
export async function recordRecommendationFeedback(options) {
  const {
    userId,
    recommendationId,
    rating,
    feedback,
    wasCooked,
    wasSaved,
    wasShared,
    cookingNotes,
    modifications,
    difficultyRating,
    timeAccuracy,
    tasteRating,
    healthinessRating
  } = options;
  
  // Create the feedback record
  const [feedbackRecord] = await db.insert(recommendationFeedback)
    .values({
      userId,
      recommendationId,
      rating,
      feedback,
      wasCooked,
      wasSaved,
      wasShared,
      cookingNotes,
      modifications,
      difficultyRating,
      timeAccuracy,
      tasteRating,
      healthinessRating
    })
    .returning();
  
  // Create a trigger to update recommendations based on this feedback
  await createRecommendationTrigger(userId, "feedback_received", {
    recommendationId,
    rating,
    wasCooked,
    wasSaved,
    wasShared
  });
  
  return feedbackRecord;
}

/**
 * Update a recommendation's display status
 * 
 * @param {number} recommendationId - Recommendation ID
 * @param {boolean} wasShown - Whether the recommendation was shown to the user
 * @returns {Promise<Object>} - The updated recommendation
 */
export async function updateRecommendationDisplayStatus(recommendationId, wasShown) {
  // Check if this is an AI-generated recommendation (negative ID)
  if (recommendationId < 0) {
    console.log(`Skipping display status update for AI-generated recommendation: ${recommendationId}`);
    return null; // Return null for AI-generated recommendations
  }
  
  if (wasShown) {
    // Update the last shown time and increment the times shown counter
    const [updatedRecommendation] = await db.update(recipeRecommendations)
      .set({
        lastShown: new Date(),
        timesShown: sql`${recipeRecommendations.timesShown} + 1`
      })
      .where(eq(recipeRecommendations.id, recommendationId))
      .returning();
    
    return updatedRecommendation;
  }
  
  return null;
}

export default {
  getPersonalizedRecipeRecommendations,
  recordRecommendationFeedback,
  updateRecommendationDisplayStatus,
  processRecommendationTriggers
};
