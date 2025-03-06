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

  try {
    console.log("Sending meal plan generation request to Groq API...");
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a professional nutritionist and meal planning expert. Always respond with valid JSON that matches the requested structure exactly."
        },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from meal plan generation');
    }

    try {
      // Improved JSON cleaning and extraction
      const cleanedContent = content
        .replace(/```json\n?|\n?```/g, '') // Remove code blocks
        .replace(/^[^[]*(\[[\s\S]*\])[^]]*$/, '$1') // Extract just the JSON array
        .replace(/,\s*]/g, ']') // Fix trailing commas in arrays
        .replace(/,\s*}/g, '}') // Fix trailing commas in objects
        .trim();
      
      console.log("Cleaned JSON content length:", cleanedContent.length);
      
      let mealPlan: MealPlan[];
      try {
        mealPlan = JSON.parse(cleanedContent) as MealPlan[];
      } catch (jsonError) {
        console.error("Initial JSON parse failed:", jsonError);
        console.log("Attempting additional cleaning...");
        
        // More aggressive cleaning if initial parsing fails
        const strictlyCleanedContent = cleanedContent
          .replace(/[\u0000-\u001F]+/g, '') // Remove control characters
          .replace(/\\n/g, ' ') // Replace newlines with spaces
          .replace(/\s+/g, ' ') // Normalize whitespace
          .replace(/"\s*([{[])\s*/g, '"$1') // Remove spaces after quotes before brackets
          .replace(/\s*([}\]])\s*"/g, '$1"'); // Remove spaces before brackets after quotes
        
        mealPlan = JSON.parse(strictlyCleanedContent) as MealPlan[];
      }
      
      // Validate the structure
      mealPlan.forEach((day, index) => {
        if (!day.meals?.breakfast || !day.meals?.lunch || !day.meals?.dinner || !Array.isArray(day.meals?.snacks)) {
          console.error(`Invalid meal plan structure for day ${index + 1}:`, day);
          throw new Error(`Invalid meal plan structure for day ${index + 1}`);
        }
      });

      return mealPlan;
    } catch (error) {
      console.error('Failed to parse meal plan:', error);
      console.log('Raw content sample:', content.substring(0, 200) + '...');
      throw new Error('Invalid meal plan format received - please try again');
    }
  } catch (error) {
    console.error('Error with Groq API:', error);
    throw new Error('Failed to generate meal plan - please try again');
  }
}

// ...rest of existing functions...