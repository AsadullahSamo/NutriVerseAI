import { model, safeJsonParse } from "./gemini-client"

export async function getRecipeRecommendations(
  ingredients,
  dietaryPreferences
) {
  const prompt = `You are a professional chef creating recipes. Please create 3 recipes using some or all of these ingredients: ${ingredients.join(
    ", "
  )}
${
  dietaryPreferences
    ? `Consider these dietary preferences: ${dietaryPreferences.join(", ")}\n`
    : ""
}

IMPORTANT: Your response must be a valid JSON array containing EXACTLY 3 recipes. Each recipe must follow this format exactly:
{
  "title": "Recipe Name",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "instructions": ["step 1", "step 2", ...],
  "nutritionalValue": "Calories: X, Protein: Xg, Carbs: Xg, Fat: Xg"
}`

  try {
    console.log("Sending request to Gemini API with ingredients:", ingredients)
    const result = await model.generateContent(prompt)
    const response = await result.response.text()
    return await safeJsonParse(response)
  } catch (error) {
    console.error("Gemini API Error:", error)
    throw error
  }
}

export async function analyzeNutritionalValue(ingredients, portions = 1) {
  const prompt = `Analyze the nutritional value of these ingredients for ${portions} portion(s): ${ingredients.join(
    ", "
  )}

Return the analysis in this JSON format:
{
  "calories": number,
  "protein": number (in grams),
  "carbs": number (in grams),
  "fat": number (in grams),
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}`

  const result = await model.generateContent(prompt)
  const response = await result.response.text()
  return await safeJsonParse(response)
}

export async function getMealPlanSuggestions(preferences, days = 7) {
  const prompt = `Create a ${days}-day meal plan considering these preferences: ${preferences.join(
    ", "
  )}
Focus on balanced nutrition and variety. Include breakfast, lunch, dinner, and snacks for each day.`

  const result = await model.generateContent(prompt)
  return result.response.text()
}

export async function generateAIMealPlan(
  preferences,
  days = 7,
  dietaryRestrictions,
  calorieTarget
) {
  const prompt = `Create a detailed ${days}-day meal plan with these specifications:
Preferences: ${preferences.join(", ")}
${
  dietaryRestrictions
    ? `Dietary Restrictions: ${dietaryRestrictions.join(", ")}`
    : ""
}
${calorieTarget ? `Daily Calorie Target: ${calorieTarget} calories` : ""}

Return the meal plan as a JSON array where each day object has this structure:
{
  "day": number,
  "meals": {
    "breakfast": {
      "title": string,
      "description": string,
      "nutritionalInfo": string (format: "X kcal, Xg protein, Xg carbs, Xg fat"),
      "preparationTime": string
    },
    "lunch": { same as breakfast },
    "dinner": { same as breakfast },
    "snacks": [{
      "title": string,
      "description": string,
      "nutritionalInfo": string
    }]
  },
  "totalCalories": number,
  "nutritionSummary": string
}`

  const result = await model.generateContent(prompt)
  const response = await result.response.text()
  return await safeJsonParse(response)
}

export async function analyzeMoodSentiment(entry) {
  const prompt = `Analyze the mood and sentiment in this cooking experience entry: "${entry}". 
Return a JSON object with 'sentiment' (positive/negative/neutral) and 'emotions' (array of specific emotions detected) fields.`

  const result = await model.generateContent(prompt)
  const response = await result.response.text()
  const parsedResult = await safeJsonParse(response)

  return {
    sentiment: parsedResult.sentiment,
    emotions: parsedResult.emotions || []
  }
}

export async function generateMoodInsights(entries) {
  const entriesText = entries.map(e => `${e.timestamp}: ${e.entry}`).join("\n")

  const prompt = `Analyze these cooking experience entries and provide detailed insights about mood patterns, focusing on cooking-related patterns, skill development, and emotional growth in the kitchen. 
  
Ensure your response is in this EXACT JSON format without any additional text:
{
  "summary": "A concise overview paragraph highlighting the key patterns and insights found in the cooking experiences.",
  "patterns": [
    {
      "category": "Skills",
      "title": "Cooking Skill Development",
      "insights": [
        {
          "type": "highlight",
          "content": "Key improvements or achievements in cooking abilities"
        },
        {
          "type": "observation",
          "content": "Patterns in technique application or learning"
        },
        {
          "type": "tip",
          "content": "Suggestion for further skill development"
        }
      ]
    },
    {
      "category": "Emotions",
      "title": "Emotional Journey",
      "insights": [
        {
          "type": "highlight",
          "content": "Notable emotional experiences or breakthroughs"
        },
        {
          "type": "observation",
          "content": "Recurring emotional patterns during cooking"
        },
        {
          "type": "tip",
          "content": "Ways to enhance positive emotional experiences"
        }
      ]
    },
    {
      "category": "Growth",
      "title": "Overall Progress",
      "insights": [
        {
          "type": "highlight",
          "content": "Major milestones or transformations"
        },
        {
          "type": "observation",
          "content": "General growth patterns"
        },
        {
          "type": "tip",
          "content": "Next steps for continued development"
        }
      ]
    }
  ],
  "recommendations": {
    "title": "Personalized Growth Recommendations",
    "items": [
      {
        "focus": "Next Challenge",
        "suggestion": "Specific suggestion for next cooking goal"
      },
      {
        "focus": "Skill Focus",
        "suggestion": "Area of cooking skill to concentrate on"
      },
      {
        "focus": "Emotional Growth",
        "suggestion": "Way to enhance enjoyment and confidence"
      }
    ]
  }
}

Entries to analyze:
${entriesText}`

  const result = await model.generateContent(prompt)
  const response = await result.response.text()
  const parsedData = await safeJsonParse(response)

  // Ensure the response has the correct structure
  return {
    summary: parsedData.summary || "No insights available yet.",
    patterns: parsedData.patterns || [],
    recommendations: parsedData.recommendations || {
      title: "Getting Started",
      items: [
        {
          focus: "Begin Your Journey",
          suggestion: "Start by recording your cooking experiences regularly."
        }
      ]
    }
  }
}

export async function getNutritionRecommendations(
  currentGoals,
  progress,
  preferences
) {
  const prompt = `Based on these nutrition goals and progress, provide personalized recommendations:

Current Goals:
${JSON.stringify(currentGoals, null, 2)}

Progress:
${JSON.stringify(progress, null, 2)}

${preferences ? `Preferences: ${preferences.join(", ")}` : ""}

Return recommendations in this JSON format:
{
  "analysis": string (overall analysis of progress),
  "suggestedGoals": {"calories": number, "protein": number, "carbs": number, "fat": number},
  "reasoning": string (explanation for suggested goals),
  "mealSuggestions": [{"type": string, "suggestions": [string]}],
  "improvements": [string] (specific areas to improve)
}`

  const result = await model.generateContent(prompt)
  const response = await result.response.text()
  return await safeJsonParse(response)
}

export async function generateRecipe(
  ingredients,
  preferences = [],
  dietaryRestrictions = []
) {
  try {
    const prompt = `Create a recipe using these ingredients and constraints:
    Ingredients: ${JSON.stringify(ingredients)}
    Preferences: ${JSON.stringify(preferences)}
    Dietary Restrictions: ${JSON.stringify(dietaryRestrictions)}
    
    Return EXACTLY this JSON structure with no additional text:
    {
      "title": "string",
      "servings": number,
      "prepTime": "string",
      "cookTime": "string",
      "ingredients": [
        { "item": "string", "amount": "string", "notes": "string" }
      ],
      "instructions": ["string"],
      "nutritionInfo": {
        "calories": number,
        "protein": "string",
        "carbs": "string",
        "fat": "string"
      },
      "tips": ["string"]
    }`

    const result = await model.generateContent(prompt)
    const response = await result.response.text()
    return await safeJsonParse(response)
  } catch (error) {
    console.error("Error generating recipe:", error)
    throw error
  }
}

export async function modifyRecipe(recipe, modifications) {
  try {
    const prompt = `Modify this recipe according to these requirements:
    Original Recipe: ${JSON.stringify(recipe)}
    Modifications: ${JSON.stringify(modifications)}
    
    Return the modified recipe in the same JSON structure as the original recipe.`

    const result = await model.generateContent(prompt)
    const response = await result.response.text()
    return await safeJsonParse(response)
  } catch (error) {
    console.error("Error modifying recipe:", error)
    throw error
  }
}

export async function getRecipeVariations(recipe, variationType) {
  try {
    const prompt = `Create a ${variationType} variation of this recipe:
    Original Recipe: ${JSON.stringify(recipe)}
    
    Return the variation in the same JSON structure as the original recipe.`

    const result = await model.generateContent(prompt)
    const response = await result.response.text()
    return await safeJsonParse(response)
  } catch (error) {
    console.error("Error generating recipe variation:", error)
    throw error
  }
}

export async function getMealPlan(preferences, dietaryRestrictions, days) {
  try {
    const prompt = `Create a ${days}-day meal plan considering:
    Preferences: ${JSON.stringify(preferences)}
    Dietary Restrictions: ${JSON.stringify(dietaryRestrictions)}
    
    Return EXACTLY this JSON structure with no additional text:
    {
      "days": [
        {
          "date": "string",
          "meals": {
            "breakfast": { "recipe": "string", "prepNotes": "string" },
            "lunch": { "recipe": "string", "prepNotes": "string" },
            "dinner": { "recipe": "string", "prepNotes": "string" }
          },
          "shoppingList": ["string"],
          "prepTips": ["string"]
        }
      ],
      "weeklyShoppingList": ["string"],
      "nutritionSummary": {
        "averageCalories": number,
        "macroBalance": "string",
        "notes": ["string"]
      }
    }`

    const result = await model.generateContent(prompt)
    const response = await result.response.text()
    return await safeJsonParse(response)
  } catch (error) {
    console.error("Error generating meal plan:", error)
    throw error
  }
}

export async function analyzeRecipe(recipe) {
  try {
    const prompt = `Analyze this recipe and provide insights:
    Recipe: ${JSON.stringify(recipe)}
    
    Return EXACTLY this JSON structure with no additional text:
    {
      "difficulty": "string",
      "costEstimate": "string",
      "timeBreakdown": {
        "prep": "string",
        "cooking": "string",
        "total": "string"
      },
      "nutritionAnalysis": {
        "healthScore": number,
        "macroRatio": "string",
        "keyNutrients": ["string"]
      },
      "substituteIngredients": [
        { "original": "string", "alternatives": ["string"] }
      ],
      "cookingTips": ["string"],
      "commonMistakes": ["string"]
    }`

    const result = await model.generateContent(prompt)
    const response = await result.response.text()
    return await safeJsonParse(response)
  } catch (error) {
    console.error("Error analyzing recipe:", error)
    throw error
  }
}

export async function generateRecipeDetails(recipeName, cuisine, preferences) {
  try {
    const prompt = `Generate detailed recipe information for "${recipeName}"${
      cuisine ? ` from ${cuisine} cuisine` : ""
    }.
    ${
      preferences ? `Consider these preferences: ${preferences.join(", ")}` : ""
    }

    Return EXACTLY this JSON structure with no additional text:
    {
      "description": "string (a short description of the recipe maybe 2 - 3 lines)",
      "ingredients": [
        {
          "item": "string",
          "amount": "string",
          "notes": "string (optional)"
        }
      ],
      "instructions": ["string"],
      "nutritionInfo": {
        "calories": number,
        "protein": number (in grams),
        "carbs": number (in grams),
        "fat": number (in grams)
      },
      "prepTime": number (in minutes),
      "cookingTips": ["string"],
      "substitutes": [
        {
          "ingredient": "string",
          "alternatives": ["string"]
        }
      ]
    }`

    const result = await model.generateContent(prompt)
    const response = await result.response.text()
    return await safeJsonParse(response)
  } catch (error) {
    console.error("Error generating recipe details:", error)
    throw error
  }
}

export async function generatePantryItemDetails(itemName, category) {
  try {
    const prompt = `Generate detailed pantry item information for "${itemName}"${
      category ? ` in the category ${category}` : ""
    }.

    Return EXACTLY this JSON structure with no additional text:
    {
      "name": "string (just the item name)",
      "category": "string (e.g., Dairy, Produce, Grains, etc.)",
      "quantity": "string (standard quantity unit e.g., '1 lb', '500g', '1 container')",
      "expiryDays": number (typical shelf life in days from purchase),
      "nutritionInfo": {
        "calories": number,
        "protein": number (in grams),
        "carbs": number (in grams),
        "fat": number (in grams)
      },
      "sustainabilityInfo": {
        "packaging": "string (one of: 'recyclable', 'biodegradable', 'reusable', 'non-recyclable')",
        "carbonFootprint": "string (one of: 'low', 'medium', 'high')"
      }
    }`

    const result = await model.generateContent(prompt)
    const response = await result.response.text()
    return await safeJsonParse(response)
  } catch (error) {
    console.error("Error generating pantry item details:", error)
    throw error
  }
}

export async function getPersonalizedRecipeRecommendations(
  userRecipes,
  nutritionGoals,
  dietaryPreferences
) {
  console.log("Generating personalized recommendations with:", {
    userRecipesCount: userRecipes?.length || 0,
    hasNutritionGoals: !!nutritionGoals,
    dietaryPreferences: dietaryPreferences
  });

  const prompt = `As a professional chef and nutritionist, analyze these user recipes and provide personalized recommendations that align with their nutrition goals.

User's Current Recipes: ${JSON.stringify(userRecipes)}
${nutritionGoals ? `Nutrition Goals: ${JSON.stringify(nutritionGoals)}` : ""}
${dietaryPreferences ? `Dietary Preferences: ${dietaryPreferences.join(", ")}` : ""}

IMPORTANT: Your response must be a valid JSON array containing EXACTLY 3 recipe recommendations. Each recipe must follow this format exactly:
{
  "title": "Recipe Name",
  "description": "A brief description of the recipe and why it's recommended",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "instructions": ["step 1", "step 2", ...],
  "nutritionalValue": "Calories: X, Protein: Xg, Carbs: Xg, Fat: Xg",
  "prepTime": "X mins",
  "matchScore": number (0-100, indicating how well it matches user's goals)
}`

  try {
    console.log("Sending request to Gemini API for personalized recommendations");
    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    console.log("Raw AI response:", response);
    const recommendations = await safeJsonParse(response);
    console.log("Generated recommendations:", recommendations);
    return recommendations;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

// Create a service object with all the functions
const recipeAI = {
  getRecipeRecommendations,
  getPersonalizedRecipeRecommendations,
  analyzeNutritionalValue,
  getMealPlanSuggestions,
  generateAIMealPlan,
  analyzeMoodSentiment,
  generateMoodInsights,
  getNutritionRecommendations,
  generateRecipe,
  modifyRecipe,
  getRecipeVariations,
  getMealPlan,
  analyzeRecipe,
  generateRecipeDetails,
  generatePantryItemDetails
};

export default recipeAI;
