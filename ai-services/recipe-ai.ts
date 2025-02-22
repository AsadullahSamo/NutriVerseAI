import Groq from "groq-sdk";
import config from "../client/src/lib/config";

const groq = new Groq({
  apiKey: config.groqApiKey,
  dangerouslyAllowBrowser: true
});

export interface RecipeRecommendation {
  title: string;
  ingredients: string[];
  instructions: string[];
  nutritionalValue: string;
}

export interface NutritionalAnalysis {
  calories: number;
  protein: string;
  carbs: string;
  fats: string;
  vitamins: string[];
  recommendations: string[];
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
}

DO NOT include any text outside the JSON array. The response should start with [ and end with ].`;

  try {
    console.log('Sending request to Groq API with ingredients:', ingredients);
    
    const response = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a professional chef API that ONLY returns valid JSON arrays containing exactly 3 recipes. Never include any text outside the JSON." 
        },
        { role: "user", content: prompt }
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.5,
      max_tokens: 2000,
    });

    console.log('Raw API Response:', response);
    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      console.error('Empty response from API');
      throw new Error('No response from recipe generation API');
    }

    // Clean the response to ensure it's valid JSON
    const cleanedContent = content.trim().replace(/```json\n?|\n?```/g, '');
    console.log('Cleaned content:', cleanedContent);

    try {
      const parsed = JSON.parse(cleanedContent);
      if (!Array.isArray(parsed) || parsed.length !== 3) {
        console.error('Invalid response structure:', parsed);
        throw new Error('Invalid recipe format received');
      }
      
      // Validate each recipe has required fields
      const isValidRecipe = (recipe: any) => 
        recipe.title && 
        Array.isArray(recipe.ingredients) && 
        Array.isArray(recipe.instructions) && 
        typeof recipe.nutritionalValue === 'string';

      if (!parsed.every(isValidRecipe)) {
        console.error('Invalid recipe format in:', parsed);
        throw new Error('One or more recipes are missing required fields');
      }

      return parsed;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.log('Failed to parse content:', cleanedContent);
      throw new Error('Failed to parse recipe data');
    }
  } catch (error) {
    console.error('Groq API Error:', error);
    throw error;
  }
}

export async function analyzeNutritionalValue(
  ingredients: string[],
  portions: number = 1
): Promise<NutritionalAnalysis> {
  const prompt = `Analyze the nutritional value of these ingredients for ${portions} portion(s): ${ingredients.join(', ')}. 
    Provide detailed breakdown including calories, protein, carbs, fats, main vitamins, and health recommendations. Format as JSON.`;

  const response = await groq.chat.completions.create({
    messages: [
      { role: "system", content: "You are a professional nutritionist providing accurate nutritional analysis. Always respond in valid JSON format." },
      { role: "user", content: prompt }
    ],
    model: "mixtral-8x7b-32768",
    temperature: 0.3,
    max_tokens: 1000,
  });

  return JSON.parse(response.choices[0]?.message?.content || '{}');
}

export async function getMealPlanSuggestions(
  preferences: string[],
  days: number = 7
): Promise<string> {
  const prompt = `Create a ${days}-day meal plan considering these preferences: ${preferences.join(', ')}. 
    Include balanced nutrition, variety, and practical cooking suggestions.`;

  const response = await groq.chat.completions.create({
    messages: [
      { role: "system", content: "You are a professional nutritionist and meal planning expert." },
      { role: "user", content: prompt }
    ],
    model: "mixtral-8x7b-32768",
    temperature: 0.7,
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content || '';
}
