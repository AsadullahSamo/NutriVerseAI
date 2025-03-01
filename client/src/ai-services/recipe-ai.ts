import Groq from "groq-sdk";
import config from "@/lib/config";

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
    - Include nutritional information (MUST include calories, protein, carbs, and fat)
    - Ensure variety and balanced nutrition
    
    Respond with a JSON array of ${days} day objects. Each day should follow this exact structure:
    {
      "day": number,
      "meals": {
        "breakfast": { 
          "title": string, 
          "description": string, 
          "nutritionalInfo": string (format: "X kcal, Xg protein, Xg carbs, Xg fat"), 
          "preparationTime": string 
        },
        "lunch": { same structure as breakfast },
        "dinner": { same structure as breakfast },
        "snacks": [{ 
          "title": string, 
          "description": string, 
          "nutritionalInfo": string (same format as above)
        }]
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
    const cleanedContent = content
      .replace(/```json\n?|\n?```/g, '') // Remove code blocks
      .replace(/^[^[]*(\[[\s\S]*\])[^]]*$/, '$1') // Extract just the JSON array
      .trim();

    const mealPlan = JSON.parse(cleanedContent) as MealPlan[];
    
    // Validate the structure
    mealPlan.forEach((day, index) => {
      if (!day.meals?.breakfast || !day.meals?.lunch || !day.meals?.dinner || !Array.isArray(day.meals?.snacks)) {
        throw new Error(`Invalid meal plan structure for day ${index + 1}`);
      }
    });

    return mealPlan;
  } catch (error) {
    console.error('Failed to parse meal plan:', error);
    throw new Error('Invalid meal plan format received');
  }
}

// ...rest of existing functions...