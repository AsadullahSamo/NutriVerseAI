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
  // Enforce 7-day limit
  if (days > 7) {
    throw new Error("Meal plans cannot exceed 7 days");
  }

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

export async function generateRecipeDetails(
  recipeName: string
): Promise<any> {
  try {
    const prompt = `Generate detailed recipe information for "${recipeName}".

    Return EXACTLY this JSON structure with no additional text:
    {
      "description": "string (a short description of the recipe)",
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
      "prepTime": number (in minutes)
    }`;

    console.log("Sending recipe generation request to Groq API...");
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a professional chef. Always provide accurate nutritional information and detailed recipes."
        },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from recipe generation');
    }

    try {
      // Clean JSON content
      const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
      const data = JSON.parse(jsonStr);
      return data;
    } catch (error) {
      console.error('Failed to parse recipe details:', error);
      throw new Error('Invalid recipe format received');
    }
  } catch (error) {
    console.error('Error with Groq API:', error);
    throw new Error('Failed to generate recipe details');
  }
}

export async function generatePantryItemDetails(
  itemName: string,
  category?: string
): Promise<any> {
  try {
    const prompt = `Generate detailed pantry item information for "${itemName}"${category ? ` in the category ${category}` : ''}.

    IMPORTANT: Include accurate sustainability information with realistic packaging type and carbon footprint data based on real-world food products.

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
        "packaging": "string (MUST be one of these exact values: 'recyclable', 'biodegradable', 'reusable', 'non-recyclable')",
        "carbonFootprint": "string (MUST be one of these exact values: 'low', 'medium', 'high')"
      }
    }

    For packaging type:
    - 'recyclable': For items packaged in paper, cardboard, glass, or most plastics with recycling symbols
    - 'biodegradable': For items with minimal packaging or compostable packaging
    - 'reusable': For items in containers designed to be reused (glass jars, sturdy containers)
    - 'non-recyclable': For items in multi-layer packaging, certain plastics, or complex packaging

    For carbon footprint:
    - 'low': Local produce, plant-based items, minimally processed foods
    - 'medium': Moderately processed foods, dairy products, items with some transportation impact
    - 'high': Highly processed foods, red meat, imported exotic items, frozen products requiring constant refrigeration
    `;

    console.log("Sending pantry item generation request to Groq API...");
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a nutritionist and sustainability expert specializing in food packaging and environmental impact. Always provide accurate nutritional information and detailed sustainability assessments."
        },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from pantry item generation');
    }

    try {
      // Clean JSON content
      const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
      const data = JSON.parse(jsonStr);
      
      // Validate sustainability info has correct values
      if (!data.sustainabilityInfo) {
        data.sustainabilityInfo = {
          packaging: 'recyclable',
          carbonFootprint: 'low'
        };
      }
      
      // Ensure packaging has a valid value
      const validPackaging = ['recyclable', 'biodegradable', 'reusable', 'non-recyclable'];
      if (!validPackaging.includes(data.sustainabilityInfo.packaging)) {
        data.sustainabilityInfo.packaging = 'recyclable';
      }
      
      // Ensure carbon footprint has a valid value
      const validFootprint = ['low', 'medium', 'high'];
      if (!validFootprint.includes(data.sustainabilityInfo.carbonFootprint)) {
        data.sustainabilityInfo.carbonFootprint = 'low';
      }
      
      return data;
    } catch (error) {
      console.error('Failed to parse pantry item details:', error);
      throw new Error('Invalid pantry item format received');
    }
  } catch (error) {
    console.error('Error with Groq API:', error);
    throw new Error('Failed to generate pantry item details');
  }
}

// ...rest of existing functions...