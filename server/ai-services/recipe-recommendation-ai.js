// filepath: d:\NutriVerseAI\server\ai-services\recipe-recommendation-ai.js
import { model, safeJsonParse, generateContent } from "./gemini-client.js"

/**
 * Generate personalized recipe recommendations based on user preferences, past recipes,
 * dietary preferences, cooking skills, and available ingredients.
 *
 * @param {Object} options - Recommendation options
 * @param {Array} options.userRecipes - User's previously created recipes
 * @param {Object} options.nutritionGoals - User's nutrition goals
 * @param {Array} options.dietaryPreferences - User's dietary preferences
 * @param {Array} options.pantryItems - User's available pantry items
 * @param {Object} options.cookingSkills - User's cooking skill levels
 * @param {Array} options.userPreferences - User's food preferences
 * @returns {Promise<Array>} - Array of personalized recipe recommendations
 */
export async function getPersonalizedRecipeRecommendations(options) {
  // Extract all options with default values
  const {
    userRecipes = [],
    nutritionGoals = null,
    dietaryPreferences = [],
    pantryItems = [],
    cookingSkills = { level: "intermediate" },
    userPreferences = []
  } = options;

  console.log("Generating personalized recipe recommendations with:", {
    userRecipesCount: userRecipes?.length || 0,
    hasNutritionGoals: !!nutritionGoals,
    dietaryPreferencesCount: dietaryPreferences?.length || 0,
    pantryItemsCount: pantryItems?.length || 0,
    cookingSkillLevel: cookingSkills?.level,
    userPreferencesCount: userPreferences?.length || 0
  });

  // Define our prompt
  const prompt = `As a professional chef and nutritionist, analyze this user's data and provide personalized recipe recommendations. Focus on making recipes that match their preferences, skills, and nutritional needs.

${userRecipes && userRecipes.length > 0 ? `User's Past Recipes: ${JSON.stringify(userRecipes.slice(0, 3))}` : "User is new and hasn't created any recipes yet."}
${nutritionGoals ? `Nutrition Goals: ${JSON.stringify(nutritionGoals)}` : "No specific nutrition goals set."}
${dietaryPreferences && dietaryPreferences.length > 0 ? `Dietary Preferences: ${dietaryPreferences.join(", ")}` : "No specific dietary preferences."}
${pantryItems && pantryItems.length > 0 ? `Available Ingredients: ${pantryItems.map(item => item.name).join(", ")}` : "Pantry information not available."}
${cookingSkills ? `Cooking Skills: ${cookingSkills.level}` : "Cooking skill level unknown."}
${userPreferences && userPreferences.length > 0 ? `Food Preferences: ${userPreferences.join(", ")}` : "No specific food preferences."}

IMPORTANT GUIDELINES:
1. Analyze the user's past recipes to understand their cooking style, preferred ingredients, and flavor profiles
2. Create recommendations that build upon their existing recipes while introducing new variations
3. Match the complexity level to their cooking skills
4. Consider their dietary preferences and restrictions
5. Align with their nutrition goals
6. Use ingredients they typically cook with
7. Avoid generic recommendations like "honey oats" or "stir-fry" unless they match the user's style
8. Each recommendation should be unique and distinct from the others
9. Include a detailed explanation of why each recipe is recommended for this specific user

Your response must be a valid JSON array containing EXACTLY 3 recipe recommendations. Each recipe must follow this format exactly:
{
  "id": number (unique identifier for the recipe),
  "title": "Recipe Name",
  "description": "A detailed explanation of why this recipe is recommended for this user, based on their preferences and past recipes",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "instructions": ["step 1", "step 2", ...],
  "nutritionInfo": {
    "calories": number,
    "protein": number (in grams),
    "carbs": number (in grams),
    "fat": number (in grams)
  },
  "prepTime": "X mins",
  "imageUrl": null,
  "matchScore": number (0-100, indicating how well it matches user's preferences and goals)
}`

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
    
    // Enhance recommendations with image URLs
    const enhancedRecommendations = recommendations.map(recipe => ({
      ...recipe,
      imageUrl: recipe.imageUrl || `https://source.unsplash.com/1200x800/?${encodeURIComponent(recipe.title.toLowerCase() + " food")}`
    }));
    
    console.log(`Generated ${enhancedRecommendations.length} personalized recommendations`);
    return enhancedRecommendations;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export default {
  getPersonalizedRecipeRecommendations
};
