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

export async function generateAIMealPlan(
  preferences: string[],
  days: number = 7,
  dietaryRestrictions?: string[],
  calorieTarget?: number
): Promise<MealPlan[]> {
  const prompt = `Create a detailed ${days}-day meal plan with the following requirements:
    - Consider these preferences: ${preferences.join(', ')}
    ${dietaryRestrictions ? `- Must follow these dietary restrictions: ${dietaryRestrictions.join(', ')}` : ''}
    ${calorieTarget ? `- Target daily calories: ${calorieTarget}` : ''}
    - Each day should include breakfast, lunch, dinner, and snacks
    - Include preparation time estimates
    - Include nutritional information
    - Ensure variety and balanced nutrition
    
    Respond with a JSON array of ${days} day objects. Each day should follow this exact structure:
    {
      "day": number,
      "meals": {
        "breakfast": { "title": string, "description": string, "nutritionalInfo": string, "preparationTime": string },
        "lunch": { "title": string, "description": string, "nutritionalInfo": string, "preparationTime": string },
        "dinner": { "title": string, "description": string, "nutritionalInfo": string, "preparationTime": string },
        "snacks": [{ "title": string, "description": string, "nutritionalInfo": string }]
      },
      "totalCalories": number,
      "nutritionSummary": string
    }`;

  const response = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a professional nutritionist and meal planning expert. Always respond with valid JSON that matches the requested structure exactly."
      },
      { role: "user", content: prompt }
    ],
    model: "mixtral-8x7b-32768",
    temperature: 0.7,
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from meal plan generation');
  }

  try {
    const mealPlan = JSON.parse(content) as MealPlan[];
    return mealPlan;
  } catch (error) {
    console.error('Failed to parse meal plan:', error);
    throw new Error('Invalid meal plan format received');
  }
}

export async function analyzeMoodSentiment(entry: string) {
  const response = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a mood analysis expert. Analyze the sentiment of cooking experiences and return a JSON response with sentiment analysis and emotions detected. Be specific about cooking-related emotions."
      },
      {
        role: "user",
        content: `Analyze the mood and sentiment in this cooking experience entry: "${entry}". Return a JSON object with 'sentiment' and 'emotions' fields.`
      }
    ],
    model: "mixtral-8x7b-32768",
    temperature: 0.3,
    max_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from mood analysis');
  }

  try {
    const result = JSON.parse(content);
    return {
      sentiment: result.sentiment,
      emotions: result.emotions || extractEmotions(result.sentiment)
    };
  } catch (error) {
    console.error('Failed to parse mood analysis:', error);
    return {
      sentiment: content,
      emotions: extractEmotions(content)
    };
  }
}

export async function generateMoodInsights(entries: Array<{ entry: string; timestamp: string }>) {
  const entriesText = entries.map(e => `${e.timestamp}: ${e.entry}`).join('\n');
  
  const response = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a mood analysis expert. Analyze patterns in cooking experiences and provide structured insights. Focus on cooking-related patterns, skill development, and emotional growth in the kitchen."
      },
      {
        role: "user",
        content: `Analyze these cooking experience entries and provide insights about mood patterns:\n${entriesText}`
      }
    ],
    model: "mixtral-8x7b-32768",
    temperature: 0.5,
    max_tokens: 1500,
  });

  const insights = response.choices[0]?.message?.content;
  if (!insights) {
    throw new Error('No response from insights generation');
  }

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
  const prompt = `As a professional nutritionist, analyze these nutrition goals and progress:
    Current Goals:
    - Calories: ${currentGoals.calories}
    - Protein: ${currentGoals.protein}g
    - Carbs: ${currentGoals.carbs}g
    - Fat: ${currentGoals.fat}g

    Recent Progress (last ${progress.length} days):
    ${progress.map(p => `${p.date}: ${p.calories}cal, ${p.protein}g protein, ${p.carbs}g carbs, ${p.fat}g fat`).join('\n')}

    ${preferences ? `Dietary Preferences: ${preferences.join(', ')}` : ''}

    Provide nutrition recommendations in this JSON format:
    {
      "suggestedGoals": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number
      },
      "reasoning": "Explanation of the suggested changes",
      "mealSuggestions": [
        {
          "type": "breakfast/lunch/dinner/snack",
          "suggestions": ["meal suggestion 1", "meal suggestion 2"]
        }
      ],
      "improvements": ["specific improvement suggestion 1", "specific improvement suggestion 2"]
    }`;

  const response = await groq.chat.completions.create({
    messages: [
      { 
        role: "system", 
        content: "You are a professional nutritionist providing personalized nutrition recommendations. Always respond with valid JSON."
      },
      { role: "user", content: prompt }
    ],
    model: "mixtral-8x7b-32768",
    temperature: 0.7,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from nutrition recommendation API');
  }

  return JSON.parse(content);
}

function extractEmotions(sentiment: string): string[] {
  const cookingEmotions = [
    'happy', 'satisfied', 'proud', 'excited', 'relaxed',
    'stressed', 'frustrated', 'disappointed', 'anxious',
    'confident', 'creative', 'accomplished', 'inspired',
    'curious', 'determined', 'adventurous', 'patient',
    'overwhelmed', 'grateful', 'energized'
  ];
  
  return cookingEmotions.filter(emotion => 
    sentiment.toLowerCase().includes(emotion)
  );
}
