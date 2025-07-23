import Groq from "groq-sdk"
import config from "@/lib/config"

const groq = new Groq({
  apiKey: config.groqApiKey,
  dangerouslyAllowBrowser: true
})

export async function generateAIMealPlan(
  preferences,
  days = 7,
  dietaryRestrictions,
  calorieTarget
) {
  // Enforce 7-day limit
  if (days > 7) {
    throw new Error("Meal plans cannot exceed 7 days")
  }

  const prompt = `Create a detailed ${days}-day meal plan with the following requirements:
    - Consider these preferences: ${preferences.join(", ")}
    ${
      dietaryRestrictions
        ? `- Must follow these dietary restrictions: ${dietaryRestrictions.join(
            ", "
          )}`
        : ""
    }
    ${calorieTarget ? `- Target daily calories: ${calorieTarget}` : ""}
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
    }`

  try {
    console.log("Sending meal plan generation request to Groq API...")
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a professional nutritionist and meal planning expert. Always respond with valid JSON that matches the requested structure exactly."
        },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 4000
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No response from meal plan generation")
    }

    try {
      // Improved JSON cleaning and extraction
      const cleanedContent = content
        .replace(/```json\n?|\n?```/g, "") // Remove code blocks
        .replace(/^[^[]*(\[[\s\S]*\])[^]]*$/, "$1") // Extract just the JSON array
        .replace(/,\s*]/g, "]") // Fix trailing commas in arrays
        .replace(/,\s*}/g, "}") // Fix trailing commas in objects
        .trim()

      console.log("Cleaned JSON content length:", cleanedContent.length)

      let mealPlan
      try {
        mealPlan = JSON.parse(cleanedContent)
      } catch (jsonError) {
        console.error("Initial JSON parse failed:", jsonError)
        console.log("Attempting additional cleaning...")

        // More aggressive cleaning if initial parsing fails
        const strictlyCleanedContent = cleanedContent
          .replace(/[\u0000-\u001F]+/g, "") // Remove control characters
          .replace(/\\n/g, " ") // Replace newlines with spaces
          .replace(/\s+/g, " ") // Normalize whitespace
          .replace(/"\s*([{[])\s*/g, '"$1') // Remove spaces after quotes before brackets
          .replace(/\s*([}\]])\s*"/g, '$1"') // Remove spaces before brackets after quotes

        mealPlan = JSON.parse(strictlyCleanedContent)
      }

      // Validate the structure
      mealPlan.forEach((day, index) => {
        if (
          !day.meals?.breakfast ||
          !day.meals?.lunch ||
          !day.meals?.dinner ||
          !Array.isArray(day.meals?.snacks)
        ) {
          console.error(
            `Invalid meal plan structure for day ${index + 1}:`,
            day
          )
          throw new Error(`Invalid meal plan structure for day ${index + 1}`)
        }
      })

      return mealPlan
    } catch (error) {
      console.error("Failed to parse meal plan:", error)
      console.log("Raw content sample:", content.substring(0, 200) + "...")
      throw new Error("Invalid meal plan format received - please try again")
    }
  } catch (error) {
    console.error("Error with Groq API:", error)
    throw new Error("Failed to generate meal plan - please try again")
  }
}

export async function generateRecipeDetails(recipeName, cuisine, preferences) {
  try {
    console.log("[Client] Generating recipe details for:", { recipeName, cuisine, preferences });
    const apiUrl = `${config.apiBaseUrl}/api/ai/generate-recipe`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        title: recipeName,
        cuisine,
        preferences
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || "Failed to generate recipe details");
    }

    const result = await response.json();
    console.log("[Client] Generated recipe details:", result);
    return result;
  } catch (error) {
    console.error("[Client] Error generating recipe details:", error);
    throw error;
  }
}

export async function getRecipeRecommendations(ingredients, dietaryPreferences) {
  try {
    console.log("[Client] Getting recipe recommendations for:", { ingredients, dietaryPreferences });
    const apiUrl = `${config.apiBaseUrl}/api/ai/recipe-recommendations`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        ingredients,
        dietaryPreferences
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || "Failed to get recipe recommendations");
    }

    const result = await response.json();
    console.log("[Client] Generated recipe recommendations:", result);
    return result;
  } catch (error) {
    console.error("[Client] Error getting recipe recommendations:", error);
    throw error;
  }
}

export async function generatePantryItemDetails(itemName, category) {
  try {
    console.log("[Client] Generating pantry item details for:", { itemName, category });
    const apiUrl = `${config.apiBaseUrl}/api/ai/generate-pantry-item`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        itemName,
        category
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || "Failed to generate pantry item details");
    }

    const result = await response.json();
    console.log("[Client] Generated pantry item details:", result);
    return result;
  } catch (error) {
    console.error("[Client] Error generating pantry item details:", error);
    throw error;
  }
}

// ...rest of existing functions...
