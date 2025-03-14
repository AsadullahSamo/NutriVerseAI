import { model, safeJsonParse } from "./gemini-client";

export interface RecipeRecommendation {
  title: string;
  ingredients: string[];
  instructions: string[];
  nutritionalValue: string;
}

export interface NutritionalAnalysis {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  recommendations: string[];
}

export interface MealPlan {
  day: number;
  meals: {
    breakfast: {
      title: string;
      description: string;
      nutritionalInfo: string;
      preparationTime: string;
    };
    lunch: {
      title: string;
      description: string;
      nutritionalInfo: string;
      preparationTime: string;
    };
    dinner: {
      title: string;
      description: string;
      nutritionalInfo: string;
      preparationTime: string;
    };
    snacks: Array<{
      title: string;
      description: string;
      nutritionalInfo: string;
    }>;
  };
  totalCalories: number;
  nutritionSummary: string;
}

export interface NutritionRecommendation {
  analysis: string;
  suggestedGoals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  reasoning: string;
  mealSuggestions: Array<{
    type: string;
    suggestions: string[];
  }>;
  improvements: string[];
}

export async function getRecipeRecommendations(
  ingredients: string[],
  dietaryPreferences?: string[]
): Promise<RecipeRecommendation[]> {
  const prompt = `You are a professional chef creating recipes. Please create 3 recipes using some or all of these ingredients: ${ingredients.join(', ')}
${dietaryPreferences ? `Consider these dietary preferences: ${dietaryPreferences.join(', ')}\n` : ''}

IMPORTANT: Your response must be a valid JSON array containing EXACTLY 3 recipes. Each recipe must follow this format exactly:
{
  "title": "Recipe Name",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "instructions": ["step 1", "step 2", ...],
  "nutritionalValue": "Calories: X, Protein: Xg, Carbs: Xg, Fat: Xg"
}`;

  try {
    console.log('Sending request to Gemini API with ingredients:', ingredients);
    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    return await safeJsonParse(response);
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}

export async function analyzeNutritionalValue(
  ingredients: string[],
  portions: number = 1
): Promise<NutritionalAnalysis> {
  const prompt = `Analyze the nutritional value of these ingredients for ${portions} portion(s): ${ingredients.join(', ')}

Return the analysis in this JSON format:
{
  "calories": number,
  "protein": number (in grams),
  "carbs": number (in grams),
  "fat": number (in grams),
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}`;

  const result = await model.generateContent(prompt);
  const response = await result.response.text();
  return await safeJsonParse(response);
}

export async function getMealPlanSuggestions(
  preferences: string[],
  days: number = 7
): Promise<string> {
  const prompt = `Create a ${days}-day meal plan considering these preferences: ${preferences.join(', ')}
Focus on balanced nutrition and variety. Include breakfast, lunch, dinner, and snacks for each day.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateAIMealPlan(
  preferences: string[],
  days: number = 7,
  dietaryRestrictions?: string[],
  calorieTarget?: number
): Promise<MealPlan[]> {
  const prompt = `Create a detailed ${days}-day meal plan with these specifications:
Preferences: ${preferences.join(', ')}
${dietaryRestrictions ? `Dietary Restrictions: ${dietaryRestrictions.join(', ')}` : ''}
${calorieTarget ? `Daily Calorie Target: ${calorieTarget} calories` : ''}

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
}`;

  const result = await model.generateContent(prompt);
  const response = await result.response.text();
  return await safeJsonParse(response);
}

export async function analyzeMoodSentiment(entry: string) {
  const prompt = `Analyze the mood and sentiment in this cooking experience entry: "${entry}". 
Return a JSON object with 'sentiment' (positive/negative/neutral) and 'emotions' (array of specific emotions detected) fields.`;

  const result = await model.generateContent(prompt);
  const response = await result.response.text();
  const parsedResult = await safeJsonParse(response);

  return {
    sentiment: parsedResult.sentiment,
    emotions: parsedResult.emotions || []
  };
}

export async function generateMoodInsights(entries: Array<{ entry: string; timestamp: string }>) {
  const entriesText = entries.map(e => `${e.timestamp}: ${e.entry}`).join('\n');
  
  const prompt = `Analyze these cooking experience entries and provide insights about mood patterns, focusing on cooking-related patterns, skill development, and emotional growth in the kitchen:
${entriesText}`;

  const result = await model.generateContent(prompt);
  const insights = await result.response.text();
  return { insights };
}

export async function getNutritionRecommendations(
  currentGoals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  },
  progress: Array<{
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>,
  preferences?: string[]
): Promise<NutritionRecommendation> {
  const prompt = `Based on these nutrition goals and progress, provide personalized recommendations:

Current Goals:
${JSON.stringify(currentGoals, null, 2)}

Progress:
${JSON.stringify(progress, null, 2)}

${preferences ? `Preferences: ${preferences.join(', ')}` : ''}

Return recommendations in this JSON format:
{
  "analysis": string (overall analysis of progress),
  "suggestedGoals": {"calories": number, "protein": number, "carbs": number, "fat": number},
  "reasoning": string (explanation for suggested goals),
  "mealSuggestions": [{"type": string, "suggestions": [string]}],
  "improvements": [string] (specific areas to improve)
}`;

  const result = await model.generateContent(prompt);
  const response = await result.response.text();
  return await safeJsonParse(response);
}
