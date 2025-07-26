import { model, safeJsonParse, generateContent } from "./gemini-client.js"
import { db } from "../db.js"
import { 
  recipeRecommendations, 
  recommendationFeedback, 
  recommendationTriggers,
  seasonalIngredients,
  recipes,
  pantryItems,
  nutritionGoals,
  recipeConsumption
} from "../shared/schema.js"
import { eq, and, desc, sql, notInArray } from "drizzle-orm"

// Helper function to get current season
function getCurrentSeason() {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "fall";
  return "winter";
}

// Helper function to check if recommendations need to be regenerated
async function shouldRegenerateRecommendations(userId, userDataSnapshot) {
  // Check if there are any pending triggers
  const pendingTriggers = await db.select()
    .from(recommendationTriggers)
    .where(
      and(
        eq(recommendationTriggers.userId, userId),
        eq(recommendationTriggers.status, "pending")
      )
    );
  
  if (pendingTriggers.length > 0) {
    return true;
  }
  
  // Check if user data has changed significantly
  const currentUserData = JSON.stringify(userDataSnapshot);
  const lastRecommendation = await db.select()
    .from(recipeRecommendations)
    .where(
      and(
        eq(recipeRecommendations.userId, userId),
        eq(recipeRecommendations.isActive, true)
      )
    )
    .orderBy(desc(recipeRecommendations.createdAt))
    .limit(1);
  
  if (lastRecommendation.length === 0) {
    return true;
  }
  
  const lastUserData = JSON.stringify(lastRecommendation[0].userDataSnapshot);
  return currentUserData !== lastUserData;
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

// Helper function to validate recipe IDs
async function validateRecipeIds(recipeIds) {
  const existingRecipes = await db.select({ id: recipes.id })
    .from(recipes)
    .where(sql`${recipes.id} = ANY(${recipeIds})`);
  
  const validIds = new Set(existingRecipes.map(r => r.id));
  return recipeIds.filter(id => validIds.has(id));
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
    
    // Check if we need to regenerate recommendations
    const shouldRegenerate = await shouldRegenerateRecommendations(userId, userDataSnapshot);
    console.log("Should regenerate recommendations:", shouldRegenerate);
    
    if (!shouldRegenerate) {
      // Return existing recommendations
      const existingRecommendations = await db.select()
        .from(recipeRecommendations)
        .where(
          and(
            eq(recipeRecommendations.userId, userId),
            eq(recipeRecommendations.isActive, true)
          )
        )
        .orderBy(desc(recipeRecommendations.priority));
      
      console.log("Returning existing recommendations:", existingRecommendations.length);
      return existingRecommendations;
    }

    // Fetch all available recipes from the database
    let availableRecipes = [];
    try {
      // Simply get all recipes without any filtering
      availableRecipes = await db.select()
        .from(recipes);
      
      console.log(`Fetched ${availableRecipes.length} recipes from database`);
      
      // Log the recipes for debugging
      console.log("AVAILABLE RECIPES FOR RECOMMENDATIONS:");
      availableRecipes.forEach((recipe, index) => {
        console.log(`Recipe ${index + 1}: ID=${recipe.id}, Title="${recipe.title}"`);
        console.log(`  Description: ${recipe.description}`);
        console.log(`  Ingredients: ${recipe.ingredients ? recipe.ingredients.length : 0} items`);
        console.log(`  Nutrition Info: ${recipe.nutritionInfo ? JSON.stringify(recipe.nutritionInfo) : "Not available"}`);
        console.log(`  Prep Time: ${recipe.prepTime || "Not specified"}`);
        console.log("---");
      });
      
    } catch (error) {
      console.error("Error fetching available recipes:", error);
      return [];
    }

    if (!availableRecipes || availableRecipes.length === 0) {
      console.log("No available recipes found for recommendations");
      return [];
    }

    console.log("Found available recipes:", availableRecipes.length);

    // PRE-FILTER: Apply basic filtering to reduce the number of recipes sent to AI
    let filteredRecipes = [...availableRecipes];
    
    // 1. Filter by dietary preferences if they exist
    if (dietaryPreferences && dietaryPreferences.length > 0) {
      // Create a regex pattern to check for dietary restriction words
      const dietaryRestrictionPatterns = dietaryPreferences.map(pref => 
        new RegExp(`\\b${pref.toLowerCase()}\\b`, 'i')
      );
      
      // Filter out recipes that explicitly mention restricted items
      filteredRecipes = filteredRecipes.filter(recipe => {
        const recipeText = `${recipe.title} ${recipe.description} ${JSON.stringify(recipe.ingredients)}`.toLowerCase();
        
        // Check if any dietary restriction is mentioned
        for (const restrictionPattern of dietaryRestrictionPatterns) {
          if (restrictionPattern.test(recipeText)) {
            return false; // Filter out recipes that mention restrictions
          }
        }
        return true;
      });
      
      console.log("After dietary preference filtering:", filteredRecipes.length);
    }
    
    // 2. Filter by cooking skill level if available
    if (cookingSkills && cookingSkills.level) {
      const skillLevels = {
        "beginner": 1,
        "intermediate": 2,
        "advanced": 3
      };
      
      const userSkillLevel = skillLevels[cookingSkills.level.toLowerCase()] || 2;
      
      // Don't show advanced recipes to beginners
      if (userSkillLevel === 1) {
        filteredRecipes = filteredRecipes.filter(recipe => 
          !recipe.difficulty || 
          recipe.difficulty.toLowerCase() !== "advanced"
        );
        console.log("After skill level filtering:", filteredRecipes.length);
      }
    }
    
    // 3. Prioritize recipes with available pantry items
    if (pantryItems && pantryItems.length > 0) {
      const pantryIngredients = pantryItems.map(item => item.name.toLowerCase());
      
      // Add a score for each recipe based on pantry match
      filteredRecipes = filteredRecipes.map(recipe => {
        const ingredientList = Array.isArray(recipe.ingredients) 
          ? recipe.ingredients.map(ing => ing.toLowerCase())
          : (typeof recipe.ingredients === 'string' 
              ? recipe.ingredients.toLowerCase().split(',')
              : []);
        
        let pantryMatchCount = 0;
        for (const ingredient of ingredientList) {
          if (pantryIngredients.some(pantryItem => ingredient.includes(pantryItem))) {
            pantryMatchCount++;
          }
        }
        
        return {
          ...recipe,
          _pantryMatchScore: ingredientList.length > 0 
            ? (pantryMatchCount / ingredientList.length) * 100 
            : 0
        };
      });
      
      // Sort by pantry match score
      filteredRecipes.sort((a, b) => b._pantryMatchScore - a._pantryMatchScore);
      
      console.log("Recipes scored by pantry matches");
    }
    
    // Limit to top 20 recipes after filtering to avoid overwhelming the AI
    const topRecipes = filteredRecipes.slice(0, 20);
    console.log("Sending top recipes to AI:", topRecipes.length);

    // Prepare the prompt for Gemini
    const prompt = `You are a recipe recommendation system. Your task is to suggest personalized recipes from our available recipes.

User Profile:
- Dietary preferences: ${dietaryPreferences.join(", ") || "none specified"}
- Nutrition goals: ${JSON.stringify(nutritionGoals) || "none specified"}
- Cooking skill level: ${cookingSkills.level}
- Available pantry items: ${pantryItems.join(", ") || "none specified"}
- Seasonal ingredients: ${seasonalIngredientsList.map(i => i.name).join(", ") || "none specified"}

AVAILABLE RECIPES (select from these):
${availableRecipes.map(recipe => `ID: ${recipe.id}, Title: "${recipe.title}"`).join('\n')}

CRITICAL INSTRUCTIONS:
1. Select recipes from the list above that best match the user's preferences
2. DO NOT recommend recipes that don't match the user's dietary preferences
3. For each recommendation, provide:
   - A recipe ID (must be one of: ${availableRecipes.map(r => r.id).join(', ')})
   - A detailed explanation of why this recipe is a good match for this user
   - A priority score (1-10) based on how well it matches the user's preferences

Your response must be a JSON array:
[
  {
    "recipeId": number (must be one of: ${availableRecipes.map(r => r.id).join(', ')}),
    "explanation": string,
    "priority": number
  }
]`;

    try {
      console.log("Sending request to Gemini API for personalized recommendations");
      const result = await generateContent(prompt);
      const response = await result.response.text();
      console.log("Raw AI response received, parsing...");
      const recommendations = await safeJsonParse(response);
      
      // Validate recommendations format
      if (!Array.isArray(recommendations) || recommendations.length === 0) {
        throw new Error("Invalid recommendations format returned from AI");
      }

      // Validate that all recommended recipe IDs exist in availableRecipes
      const validRecipeIds = new Set(availableRecipes.map(r => r.id));
      const invalidRecipes = recommendations.filter(r => !validRecipeIds.has(r.recipeId));
      if (invalidRecipes.length > 0) {
        console.error("AI returned recommendations for non-existent recipes:", invalidRecipes);
        throw new Error("Invalid recipe IDs in AI recommendations");
      }
      
      // Generate a unique group ID for this batch of recommendations
      const recommendationGroup = `batch_${Date.now()}`;
      
      // Store recommendations in the database
      const storedRecommendations = await Promise.all(
        recommendations.map(async (recommendation) => {
          try {
            // Set expiration date to 7 days from now
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            
            // Calculate priority based on match score and seasonal relevance
            const priority = recommendation.priority;
            
            // Store the recommendation
            const [storedRecipe] = await db.insert(recipeRecommendations)
              .values({
                userId,
                recipeId: recommendation.recipeId,
                matchScore: recommendation.priority,
                reasonForRecommendation: recommendation.explanation,
                seasonalRelevance: seasonalIngredientsList.some(i => i.name.toLowerCase() === recommendation.explanation.toLowerCase()),
                expiresAt,
                userDataSnapshot,
                recommendationGroup,
                priority,
                isActive: true
              })
              .returning();
            
            return storedRecipe;
          } catch (error) {
            console.error("Error storing recommendation:", error);
            return null;
          }
        })
      );
        
      // Filter out any null values from storedRecommendations
      const validStoredRecommendations = storedRecommendations.filter(rec => rec !== null);
      
      if (validStoredRecommendations.length === 0) {
        throw new Error("Failed to store any recommendations");
      }
      
      // Mark any existing recommendations as inactive
      await db.update(recipeRecommendations)
        .set({ isActive: false })
        .where(
          and(
            eq(recipeRecommendations.userId, userId),
            eq(recipeRecommendations.isActive, true),
            sql`${recipeRecommendations.recommendationGroup} != ${recommendationGroup}`
          )
        );
      
      console.log("Successfully generated and stored recommendations:", validStoredRecommendations.length);
      return validStoredRecommendations;
    } catch (error) {
      console.error("Error generating recommendations:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in getPersonalizedRecipeRecommendations:", error);
    throw error;
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