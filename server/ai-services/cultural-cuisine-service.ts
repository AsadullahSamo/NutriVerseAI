import { generateContent, safeJsonParse } from "./gemini-client"

export async function generateCuisineDetailsFromName(name, region) {
  try {
    console.log(`[Server] Generating cuisine details for ${name} cuisine from ${region} using Gemini`);
    const prompt = `Generate detailed information about ${name} cuisine from ${region}.

For key ingredients and cooking techniques, put each item on a separate line WITHOUT any numbering, bullets, or other markers.

Include:
1. A detailed description (2-3 paragraphs) of ${name} cuisine
2. List of at least 6 key ingredients used in ${name} cuisine
3. List of at least 4 common cooking techniques used in ${name} cuisine
4. Cultural context including history, traditions, festivals, and influences
5. Serving etiquette including table settings, dining customs, serving order, and taboos

Your response MUST be structured exactly like this JSON:
{
  "description": "Comprehensive description of the cuisine covering its characteristics, flavors, and significance",
  "keyIngredients": "Ingredient 1\\nIngredient 2\\nIngredient 3\\nIngredient 4\\nIngredient 5\\nIngredient 6",
  "cookingTechniques": "Technique 1\\nTechnique 2\\nTechnique 3\\nTechnique 4",
  "culturalContext": {
    "history": "Detailed historical background",
    "traditions": "Main culinary traditions",
    "festivals": "Important food-related festivals",
    "influences": "Major cultural influences"
  },
  "servingEtiquette": {
    "tableSettings": "Table arrangement guidelines",
    "diningCustoms": "Dining rules",
    "servingOrder": "Course sequence",
    "taboos": "Things to avoid",
    "summary": "Overall dining etiquette summary"
  }
}

For keyIngredients and cookingTechniques, make sure they are plain strings with ONLY newline (\\n) separators between items, not arrays.
Do NOT use bullet points, numbers or any prefixes for the ingredients or techniques.
STRICTLY FOLLOW THE EXACT FORMAT SHOWN ABOVE for keyIngredients and cookingTechniques.`;

    console.log("[Server] Sending prompt to Gemini:", prompt);
    const result = await generateContent(prompt)
    
    // Handle the result properly
    if (!result || !result.response) {
      console.error("[Server] Invalid Gemini response structure:", result);
      throw new Error("Invalid response from Gemini API");
    }
    
    // Safely extract text content
    let responseText;
    try {
      responseText = await result.response.text();
    } catch (error) {
      console.error("[Server] Error extracting text from Gemini response:", error);
      throw new Error("Failed to extract text from AI response");
    }
    
    if (!responseText) {
      console.error("[Server] Empty response text from Gemini");
      throw new Error("Received empty response from AI service");
    }
    
    console.log("[Server] Raw Gemini response:", responseText);
    
    const parsedResponse = await safeJsonParse(responseText)
    console.log("[Server] Parsed Gemini response:", parsedResponse);
    
    // Validate the response structure and ensure formatting
    if (!parsedResponse || !parsedResponse.description) {
      console.error("[Server] Invalid Gemini response structure:", parsedResponse);
      throw new Error("Invalid response from AI service - missing required fields");
    }
    
    // Make sure keyIngredients and cookingTechniques are formatted as newline-separated strings
    const formattedResponse = {
      ...parsedResponse,
      keyIngredients: typeof parsedResponse.keyIngredients === 'string' 
        ? parsedResponse.keyIngredients.replace(/^\d+\.\s+|^-\s+|^\*\s+/gm, '') // Remove bullets/numbers
        : Array.isArray(parsedResponse.keyIngredients)
          ? parsedResponse.keyIngredients.join('\n')
          : "Ingredient 1\nIngredient 2\nIngredient 3\nIngredient 4\nIngredient 5",
          
      cookingTechniques: typeof parsedResponse.cookingTechniques === 'string'
        ? parsedResponse.cookingTechniques.replace(/^\d+\.\s+|^-\s+|^\*\s+/gm, '') // Remove bullets/numbers
        : Array.isArray(parsedResponse.cookingTechniques)
          ? parsedResponse.cookingTechniques.join('\n')
          : "Technique 1\nTechnique 2\nTechnique 3"
    };
    
    console.log("[Server] Final formatted response:", formattedResponse);
    return formattedResponse;
  } catch (error) {
    console.error("[Error] Failed to generate cuisine details:", error);
    throw new Error("Failed to generate cuisine details: " + (error.message || "Unknown error"));
  }
}

export const getCulturalContext = async (recipe, cuisine) => {
  const prompt = `You are a cultural cuisine expert. Please provide detailed cultural context for the ${recipe.name} recipe from ${cuisine.name} cuisine.
  Include:
  1. Historical Background: Origins and development of the dish
  2. Cultural Significance: Its role in ${cuisine.name} culture, festivals, or occasions
  3. Regional Variations: How the dish varies across different regions

  Return EXACTLY this JSON structure with no additional text:
  {
    "history": "Historical background and origins of the dish",
    "significance": "Cultural importance and role in society",
    "variations": "Regional variations and adaptations"
  }`

  try {
    const result = await generateContent(prompt)
    
    // Handle the result properly
    if (!result || !result.response) {
      console.error("[Server] Invalid Gemini response structure:", result);
      throw new Error("Invalid response from Gemini API");
    }
    
    // Safely extract text content
    let responseText;
    try {
      responseText = await result.response.text();
    } catch (error) {
      console.error("[Server] Error extracting text from Gemini response:", error);
      throw new Error("Failed to extract text from AI response");
    }
    
    if (!responseText) {
      console.error("[Server] Empty response text from Gemini");
      throw new Error("Received empty response from AI service");
    }
    
    const context = await safeJsonParse(responseText)

    return {
      history: context.history || "",
      significance: context.significance || "",
      variations: context.variations || ""
    }
  } catch (error) {
    console.error("Error getting cultural context:", error)
    throw new Error("Failed to get cultural context")
  }
}

export async function analyzeCulturalCuisine(cuisine) {
  const prompt = `Analyze this cultural cuisine and provide detailed cultural insights:
    ${JSON.stringify(cuisine)}
    
    Provide a comprehensive analysis in JSON format including:
    - Historical context
    - Cultural significance
    - Traditional occasions
    - Modern adaptations
    - Regional variations`

  try {
    const result = await generateContent(prompt)
    
    // Handle the result properly
    if (!result || !result.response) {
      console.error("[Server] Invalid Gemini response structure:", result);
      throw new Error("Invalid response from Gemini API");
    }
    
    // Safely extract text content
    let responseText;
    try {
      responseText = await result.response.text();
    } catch (error) {
      console.error("[Server] Error extracting text from Gemini response:", error);
      throw new Error("Failed to extract text from AI response");
    }
    
    if (!responseText) {
      console.error("[Server] Empty response text from Gemini");
      throw new Error("Received empty response from AI service");
    }
    
    return await safeJsonParse(responseText)
  } catch (error) {
    console.error("Error analyzing cultural cuisine:", error)
    throw new Error("Failed to analyze cultural cuisine")
  }
}

export async function getRecipeAuthenticityScore(recipe, substitutions) {
  const ingredients = Array.isArray(recipe.authenticIngredients)
    ? recipe.authenticIngredients
    : []

  return {
    authenticityScore:
      100 -
      substitutions.filter(s => s.flavorImpact === "significant").length * 20,
    feedback: ["Based on ingredient substitutions"],
    traditionalElements: ingredients,
    modernAdaptations: substitutions.map(s => s.substitute),
    culturalAccuracy: "moderate",
    suggestions: ["Consider using traditional ingredients when possible"]
  }
}

export async function getTechniqueTips(technique, cuisine) {
  const prompt = `Provide detailed tips for this cultural cooking technique:
    Technique: ${JSON.stringify(technique)}
    Cuisine: ${JSON.stringify(cuisine)}`

  try {
    const result = await generateContent(prompt)
    
    // Handle the result properly
    if (!result || !result.response) {
      console.error("[Server] Invalid Gemini response structure:", result);
      throw new Error("Invalid response from Gemini API");
    }
    
    // Safely extract text content
    let responseText;
    try {
      responseText = await result.response.text();
    } catch (error) {
      console.error("[Server] Error extracting text from Gemini response:", error);
      throw new Error("Failed to extract text from AI response");
    }
    
    if (!responseText) {
      console.error("[Server] Empty response text from Gemini");
      throw new Error("Received empty response from AI service");
    }
    
    return await safeJsonParse(responseText)
  } catch (error) {
    console.error("Error getting technique tips:", error)
    throw new Error("Failed to get technique tips")
  }
}

export async function generateCulturalDetails(cuisine) {
  try {
    console.log("[Server] Generating cultural details for cuisine:", cuisine);
    const prompt = `Generate detailed cultural information about ${cuisine.name} cuisine.
    
    Include:
    1. A comprehensive description
    2. Key ingredients commonly used
    3. Traditional cooking techniques
    4. Cultural context and history
    5. Serving etiquette and customs
    
    Return the information in this exact JSON format:
    {
      "description": "Detailed description",
      "keyIngredients": "Ingredient 1\\nIngredient 2\\nIngredient 3",
      "cookingTechniques": "Technique 1\\nTechnique 2\\nTechnique 3",
      "culturalContext": {
        "history": "Brief Historical background",
        "traditions": "key culinary traditions",
        "festivals": "celebrations and Related Food festivals",
        "influences": "Cultural and historical influences"
      },
      "servingEtiquette": {
        "tableSettings": "table arrangement guidelines as bullet points. Do not use numbers or other markers",
        "diningCustoms": "dining rules as bullet points. Do not use numbers or other markers",
        "servingOrder": "Course sequence as bullet points. Do not use numbers or other markers",
        "taboos": "Things to avoid as bullet points. Do not use numbers or other markers",
        "general": "overall dining etiquette summary. Do not use numbers or other markers"
      }
    }`;

    const result = await generateContent(prompt);
    
    // Handle the result properly
    if (!result || !result.response) {
      console.error("[Server] Invalid Gemini response structure:", result);
      throw new Error("Invalid response from Gemini API");
    }
    
    // Safely extract text content
    let responseText;
    try {
      responseText = await result.response.text();
    } catch (error) {
      console.error("[Server] Error extracting text from Gemini response:", error);
      throw new Error("Failed to extract text from AI response");
    }
    
    if (!responseText) {
      console.error("[Server] Empty response text from Gemini");
      throw new Error("Received empty response from AI service");
    }
    
    const parsedResponse = await safeJsonParse(responseText);

    if (!parsedResponse || !parsedResponse.description) {
      console.error("[Server] Invalid response structure:", parsedResponse);
      throw new Error("Invalid response from AI service");
    }

    return parsedResponse;
  } catch (error) {
    console.error("[Server] Error generating cultural details:", error);
    throw error;
  }
}

export async function getPairings(recipe, cuisine) {
  console.log("Fetching pairings for:", {
    recipeName: recipe.name,
    cuisine: cuisine.name
  })

  const traditionalPairings = getTraditionalPairings(
    cuisine.region.toLowerCase()
  )

  const prompt = `Suggest specific food pairings for this ${
    cuisine.name
  } recipe:
    Recipe: ${JSON.stringify({
      name: recipe.name,
      ingredients: recipe.authenticIngredients
    })}
    
    Return JSON with these categories:
    {
      "mainDishes": string[] (dishes that complement this recipe),
      "sideDishes": string[] (appropriate side dishes),
      "desserts": string[] (dessert pairings),
      "beverages": string[] (drink pairings)
    }`

  try {
    const result = await generateContent(prompt)
    const response = await result.response.text()
    console.log("Pairings response:", response)

    const aiPairings = await safeJsonParse(response)

    return {
      mainDishes: Array.from(
        new Set([
          ...traditionalPairings.mainDishes,
          ...(aiPairings.mainDishes || [])
        ])
      ),
      sideDishes: Array.from(
        new Set([
          ...traditionalPairings.sideDishes,
          ...(aiPairings.sideDishes || [])
        ])
      ),
      desserts: Array.from(
        new Set([
          ...traditionalPairings.desserts,
          ...(aiPairings.desserts || [])
        ])
      ),
      beverages: Array.from(
        new Set([
          ...traditionalPairings.beverages,
          ...(aiPairings.beverages || [])
        ])
      )
    }
  } catch (error) {
    console.error("Error generating pairings:", error)
    return traditionalPairings
  }
}

export async function getEtiquette(recipe, cuisine) {
  console.log("Fetching etiquette for:", {
    recipeName: recipe.name,
    cuisine: cuisine.name
  })

  const regionalEtiquette = getRegionalEtiquette(cuisine.region.toLowerCase())

  const prompt = `Provide specific serving etiquette for this ${
    cuisine.name
  } dish:
    Recipe: ${JSON.stringify({
      name: recipe.name,
      culturalNotes: recipe.culturalNotes,
      servingSuggestions: recipe.servingSuggestions
    })}
    
    Return JSON with these categories:
    {
      "presentation": string[] (visual presentation guidelines),
      "customs": string[] (dining customs to observe),
      "taboos": string[] (practices to avoid),
      "servingOrder": string[] (proper serving sequence)
    }`

  try {
    const result = await generateContent(prompt)
    const response = await result.response.text()
    const aiEtiquette = await safeJsonParse(response)

    return {
      presentation: Array.from(
        new Set([
          ...regionalEtiquette.presentation,
          ...(aiEtiquette.presentation || [])
        ])
      ),
      customs: Array.from(
        new Set([...regionalEtiquette.customs, ...(aiEtiquette.customs || [])])
      ),
      taboos: Array.from(
        new Set([...regionalEtiquette.taboos, ...(aiEtiquette.taboos || [])])
      ),
      servingOrder: Array.from(
        new Set([
          ...regionalEtiquette.servingOrder,
          ...(aiEtiquette.servingOrder || [])
        ])
      )
    }
  } catch (error) {
    console.error("Error generating etiquette:", error)
    return regionalEtiquette
  }
}

export async function getSubstitutions(recipe, pantryItems, region) {
  const ingredients = Array.isArray(recipe.authenticIngredients)
    ? recipe.authenticIngredients
    : Object.keys(recipe.authenticIngredients || {})

  const substitutionsPrompt = `You are a JSON API that must return a valid JSON array. For these ingredients, provide substitution options:
    Ingredients: ${JSON.stringify(ingredients)}
    Available pantry items: ${JSON.stringify(pantryItems)}
    Region: ${region}
    
    Return EXACTLY this JSON structure with no additional text or explanation:
    [
      {
        "original": "ingredient name",
        "substitute": "best substitute",
        "notes": "usage notes",
        "flavorImpact": "minimal/moderate/significant"
      }
    ]`

  try {
    const result = await generateContent(substitutionsPrompt)
    const response = await result.response.text()

    let parsedContent = await safeJsonParse(response)
    if (!Array.isArray(parsedContent)) {
      parsedContent = [parsedContent]
    }

    // Merge AI suggestions with predefined rules
    const substitutions = ingredients.map(ingredient => {
      const rule = getSubstitutionRules()[ingredient.toLowerCase()]
      const aiSuggestion = parsedContent.find(
        s => s.original?.toLowerCase() === ingredient.toLowerCase()
      )

      return {
        original: ingredient,
        substitute:
          rule?.substitutes[0] ||
          aiSuggestion?.substitute ||
          "No direct substitute available",
        notes:
          rule?.notes ||
          aiSuggestion?.notes ||
          "Use with caution as flavor profile may differ",
        flavorImpact:
          rule?.flavorImpact || aiSuggestion?.flavorImpact || "significant"
      }
    })

    return {
      substitutions,
      authenticityScore:
        100 -
        substitutions.filter(s => s.flavorImpact === "significant").length * 20,
      authenticityFeedback: [
        "Substitutions may affect the authentic taste of the dish"
      ]
    }
  } catch (error) {
    console.error("Error generating substitutions:", error)
    return {
      substitutions: [],
      authenticityScore: 0,
      authenticityFeedback: ["Error generating substitutions"]
    }
  }
}

export async function getCulturalCuisineInfo(
  cuisine,
  includeImagePrompts = false
) {
  try {
    const prompt = `Provide detailed information about ${cuisine} cuisine as a JSON object with the following structure:
    {
      "overview": "Brief overview of the cuisine",
      "keyIngredients": ["list of essential ingredients"],
      "commonDishes": ["list of popular dishes"],
      "cookingTechniques": ["list of cooking techniques"],
      "culturalSignificance": "Cultural importance and history",
      ${
        includeImagePrompts
          ? '"imagePrompts": ["list of detailed image generation prompts for dishes"],'
          : ""
      }
      "dietaryConsiderations": ["list of dietary considerations"]
    }`

    const result = await generateContent(prompt)
    const response = await result.response.text()
    return await safeJsonParse(response)
  } catch (error) {
    console.error("Error getting cuisine information:", error)
    throw error
  }
}

export async function getAuthenticRecipeAdaptation(
  recipe,
  cuisine,
  dietaryRestrictions
) {
  try {
    const prompt = `Adapt this recipe "${recipe}" to be more authentic to ${cuisine} cuisine.
    ${
      dietaryRestrictions
        ? `Consider these dietary restrictions: ${dietaryRestrictions.join(
            ", "
          )}`
        : ""
    }
    
    Return a JSON object with:
    {
      "originalDish": "Name of original dish",
      "adaptedDish": "Name of adapted dish",
      "changes": ["list of major changes"],
      "ingredients": ["list of ingredients"],
      "instructions": ["step by step instructions"],
      "culturalNotes": "Cultural context and authenticity notes"
    }`

    const result = await generateContent(prompt)
    const response = await result.response.text()
    return await safeJsonParse(response)
  } catch (error) {
    console.error("Error adapting recipe:", error)
    throw error
  }
}

export async function getCrossCulturalFusion(cuisine1, cuisine2, preferences) {
  try {
    const prompt = `Create a fusion recipe combining elements from ${cuisine1} and ${cuisine2} cuisines.
    ${
      preferences ? `Consider these preferences: ${preferences.join(", ")}` : ""
    }
    
    Return a JSON object with:
    {
      "dishName": "Name of fusion dish",
      "description": "Description of the fusion concept",
      "elements": {
        "${cuisine1}": ["elements from first cuisine"],
        "${cuisine2}": ["elements from second cuisine"]
      },
      "ingredients": ["list of ingredients"],
      "instructions": ["step by step instructions"],
      "culturalNotes": "Notes about the fusion approach"
    }`

    const result = await generateContent(prompt)
    const response = await result.response.text()
    return await safeJsonParse(response)
  } catch (error) {
    console.error("Error creating fusion recipe:", error)
    throw error
  }
}

export async function getCuisineInsights(cuisine) {
  try {
    const prompt = `Provide detailed insights about this cuisine:
    Cuisine: ${cuisine}
    
    Return EXACTLY this JSON structure with no additional text:
    {
      "cuisine": "string",
      "overview": "string",
      "keyIngredients": ["string"],
      "commonDishes": [
        {
          "name": "string",
          "description": "string",
          "significance": "string"
        }
      ],
      "cookingTechniques": [
        {
          "name": "string",
          "description": "string",
          "commonUses": ["string"]
        }
      ],
      "culturalContext": {
        "history": "string",
        "traditions": ["string"],
        "regionalVariations": ["string"]
      }
    }`

    const result = await generateContent(prompt)
    const response = await result.response.text()
    return await safeJsonParse(response)
  } catch (error) {
    console.error("Error getting cuisine insights:", error)
    throw error
  }
}

export async function getAuthenticRecipe(dish, cuisine) {
  try {
    const prompt = `Provide an authentic recipe for this cultural dish:
    Dish: ${dish}
    Cuisine: ${cuisine}
    
    Return EXACTLY this JSON structure with no additional text:
    {
      "recipe": {
        "name": "string",
        "description": "string",
        "authenticity": {
          "origin": "string",
          "variations": ["string"],
          "culturalNotes": "string"
        },
        "ingredients": [
          {
            "item": "string",
            "amount": "string",
            "traditional": boolean,
            "substitutes": ["string"]
          }
        ],
        "instructions": ["string"],
        "techniques": [
          {
            "name": "string",
            "description": "string",
            "tips": ["string"]
          }
        ]
      }
    }`

    const result = await generateContent(prompt)
    const response = await result.response.text()
    return await safeJsonParse(response)
  } catch (error) {
    console.error("Error getting authentic recipe:", error)
    throw error
  }
}

export async function getCulturalCookingTips(cuisine) {
  try {
    const prompt = `Provide cultural cooking tips for this cuisine:
    Cuisine: ${cuisine}
    
    Return EXACTLY this JSON structure with no additional text:
    {
      "cuisine": "string",
      "essentialTips": ["string"],
      "ingredients": {
        "staples": ["string"],
        "handling": ["string"],
        "substitutes": [
          {
            "original": "string",
            "alternatives": ["string"],
            "notes": "string"
          }
        ]
      },
      "techniques": [
        {
          "name": "string",
          "description": "string",
          "tips": ["string"]
        }
      ],
      "etiquette": ["string"]
    }`

    const result = await generateContent(prompt)
    const response = await result.response.text()
    return await safeJsonParse(response)
  } catch (error) {
    console.error("Error getting cultural cooking tips:", error)
    throw error
  }
}

// Helper functions with embedded cultural knowledge data
function getSubstitutionRules() {
  return {
    "kaffir lime leaves": {
      substitutes: ["lime zest", "bay leaves with lime zest"],
      notes: "Use lime zest for citrus notes, bay leaf adds aromatic element",
      flavorImpact: "moderate"
    },
    "fish sauce": {
      substitutes: ["soy sauce with salt", "worcestershire sauce"],
      notes:
        "Add a pinch of salt and a drop of vinegar to better mimic umami flavor",
      flavorImpact: "significant"
    },
    gochujang: {
      substitutes: ["sriracha with miso paste", "red pepper flakes with honey"],
      notes:
        "Mix 2 parts sriracha with 1 part miso for similar fermented spicy flavor",
      flavorImpact: "moderate"
    },
    lemongrass: {
      substitutes: ["lemon zest with ginger", "lemon verbena"],
      notes: "Combine 1 tablespoon lemon zest with 1/4 teaspoon ginger powder",
      flavorImpact: "moderate"
    },
    tahini: {
      substitutes: ["smooth peanut butter", "sunflower seed butter"],
      notes: "Thin with sesame oil if available for closer flavor profile",
      flavorImpact: "minimal"
    },
    ghee: {
      substitutes: ["clarified butter", "butter", "coconut oil"],
      notes:
        "Unsalted butter is your best alternative, coconut oil changes flavor profile",
      flavorImpact: "minimal"
    },
    sumac: {
      substitutes: ["lemon zest", "amchoor powder", "tamarind"],
      notes: "Add a touch of salt to lemon zest for similar tanginess",
      flavorImpact: "moderate"
    },
    "oyster sauce": {
      substitutes: ["hoisin sauce", "soy sauce with sugar"],
      notes:
        "Mix 1 tablespoon soy sauce with 1/2 teaspoon sugar and 1/2 teaspoon Worcestershire sauce",
      flavorImpact: "moderate"
    },
    galangal: {
      substitutes: ["ginger", "ginger with lemon zest"],
      notes: "True galangal has a sharper, citrusy flavor than ginger",
      flavorImpact: "moderate"
    },
    "tamarind paste": {
      substitutes: [
        "lime juice with brown sugar",
        "pomegranate molasses",
        "vinegar with dates"
      ],
      notes:
        "Mix 1 part lime juice with 1 part brown sugar for similar sweet-sour profile",
      flavorImpact: "moderate"
    },
    "shiso leaves": {
      substitutes: ["mint with basil", "thai basil"],
      notes: "Equal parts mint and basil can approximate the complex flavor",
      flavorImpact: "moderate"
    },
    "miso paste": {
      substitutes: ["tahini with soy sauce", "vegetable bouillon"],
      notes: "Lacks fermented quality but provides umami base",
      flavorImpact: "significant"
    },
    "za'atar": {
      substitutes: [
        "thyme with sesame seeds and sumac",
        "thyme with lemon zest"
      ],
      notes:
        "Mix 1 tbsp thyme, 1 tsp sesame seeds, pinch of salt and lemon zest",
      flavorImpact: "moderate"
    },
    plantains: {
      substitutes: ["green bananas", "potatoes for savory dishes"],
      notes: "Texture will differ; use less cooking time",
      flavorImpact: "significant"
    },
    paneer: {
      substitutes: ["firm tofu", "halloumi", "queso fresco"],
      notes: "Drain tofu well and press before using",
      flavorImpact: "moderate"
    }
  }
}

function getTraditionalPairings(region) {
  const pairings = {
    east_asia: {
      mainDishes: ["Steamed Fish", "Stir-fried Vegetables", "Clay Pot Rice"],
      sideDishes: ["Pickled Vegetables", "Cold Salad", "Steamed Eggs"],
      desserts: ["Red Bean Soup", "Mango Pudding", "Egg Tarts"],
      beverages: ["Jasmine Tea", "Oolong Tea", "Rice Wine"]
    },
    southeast_asia: {
      mainDishes: ["Green Curry", "Pad Thai", "Beef Rendang"],
      sideDishes: ["Som Tam", "Sticky Rice", "Roti Canai"],
      desserts: ["Mango Sticky Rice", "Thai Tea Ice Cream", "Kuih"],
      beverages: ["Thai Iced Tea", "Coconut Water", "Sugarcane Juice"]
    },
    south_asia: {
      mainDishes: ["Butter Chicken", "Biryani", "Dal Makhani"],
      sideDishes: ["Naan", "Raita", "Chutney"],
      desserts: ["Gulab Jamun", "Kheer", "Jalebi"],
      beverages: ["Lassi", "Masala Chai", "Rooh Afza"]
    },
    middle_east: {
      mainDishes: ["Lamb Shawarma", "Falafel", "Kebabs"],
      sideDishes: ["Hummus", "Tabbouleh", "Baba Ganoush"],
      desserts: ["Baklava", "Kunafa", "Turkish Delight"],
      beverages: ["Mint Tea", "Turkish Coffee", "Ayran"]
    },
    mediterranean: {
      mainDishes: ["Paella", "Moussaka", "Risotto"],
      sideDishes: ["Greek Salad", "Bruschetta", "Dolmas"],
      desserts: ["Tiramisu", "Baklava", "Panna Cotta"],
      beverages: ["Wine", "Limoncello", "Ouzo"]
    },
    latin_america: {
      mainDishes: ["Tacos", "Mole Poblano", "Feijoada"],
      sideDishes: ["Guacamole", "Elote", "Black Beans"],
      desserts: ["Tres Leches Cake", "Churros", "Flan"],
      beverages: ["Horchata", "Margarita", "Agua Fresca"]
    },
    caribbean: {
      mainDishes: ["Jerk Chicken", "Curry Goat", "Ackee and Saltfish"],
      sideDishes: ["Rice and Peas", "Festival", "Plantains"],
      desserts: ["Rum Cake", "Sweet Potato Pudding", "Coconut Drops"],
      beverages: ["Rum Punch", "Sorrel Drink", "Ginger Beer"]
    },
    west_africa: {
      mainDishes: ["Jollof Rice", "Egusi Soup", "Peanut Stew"],
      sideDishes: ["Fufu", "Fried Plantains", "Moin Moin"],
      desserts: ["Chin Chin", "Puff Puff", "Coconut Candy"],
      beverages: ["Palm Wine", "Bissap", "Ginger Drink"]
    },
    east_africa: {
      mainDishes: ["Injera with Wat", "Nyama Choma", "Pilau Rice"],
      sideDishes: ["Chapati", "Sukuma Wiki", "Ugali"],
      desserts: ["Mandazi", "Kashata", "Maandazi"],
      beverages: ["Ethiopian Coffee", "Tangawizi", "Urwaga"]
    },
    north_africa: {
      mainDishes: ["Couscous", "Tagine", "Shakshuka"],
      sideDishes: ["Harissa", "Zaalouk", "Batbout"],
      desserts: ["Makroud", "Msemen", "Basbousa"],
      beverages: ["Mint Tea", "Almond Milk", "Hibiscus Tea"]
    }
  }

  return (
    pairings[region] || {
      mainDishes: [],
      sideDishes: [],
      desserts: [],
      beverages: []
    }
  )
}

function getRegionalEtiquette(region) {
  const etiquette = {
    east_asia: {
      presentation: [
        "Serve rice in individual bowls",
        "Place shared dishes in the center",
        "Arrange food to highlight colors and textures",
        "Use small plates for individual portions"
      ],
      customs: [
        "Hold rice bowl close to mouth",
        "Use chopsticks correctly",
        "Pour tea for others before yourself",
        "Tap fingers as thanks when someone pours tea for you"
      ],
      taboos: [
        "Don't stick chopsticks vertically in rice",
        "Don't pass food directly from chopsticks to chopsticks",
        "Don't point with chopsticks",
        "Don't flip fish over on the plate"
      ],
      servingOrder: [
        "Soup first",
        "Rice and main dishes together",
        "Fruit or light dessert last",
        "Tea throughout the meal"
      ]
    },
    southeast_asia: {
      presentation: [
        "Serve food family-style on a raised platform",
        "Arrange dishes by spice level",
        "Include contrasting textures and flavors",
        "Garnish with fresh herbs and lime wedges"
      ],
      customs: [
        "Eat with right hand in some regions",
        "Use fork and spoon (fork to push, spoon to eat)",
        "Take small portions to sample everything",
        "Cool spicy dishes with plain rice"
      ],
      taboos: [
        "Don't use left hand for eating",
        "Don't place serving spoons in your mouth",
        "Don't leave chopsticks crossed",
        "Don't waste rice"
      ],
      servingOrder: [
        "All dishes served simultaneously",
        "Rice as the foundation",
        "Balance between spicy, sour, sweet and savory in one meal",
        "Fresh fruit for dessert"
      ]
    },
    south_asia: {
      presentation: [
        "Serve on thali plates with small compartments",
        "Balance colors and textures across the plate",
        "Place bread and rice separately",
        "Arrange accompaniments in small bowls"
      ],
      customs: [
        "Traditionally eat with right hand fingers",
        "Tear bread with fingers, not cutlery",
        "Share food and offer to others first",
        "Mix rice with curry using fingertips"
      ],
      taboos: [
        "Don't use left hand for eating or passing food",
        "Don't waste food on your plate",
        "Don't start eating before elders or guests",
        "Don't lick fingers in formal settings"
      ],
      servingOrder: [
        "Begin with something sweet in some regions",
        "Serve bread and rice with main dishes",
        "Sweet dish or paan to conclude the meal",
        "Yogurt or raita to balance spice"
      ]
    },
    middle_east: {
      presentation: [
        "Large central platters for sharing",
        "Multiple small mezze dishes",
        "Vibrant colors and garnishes",
        "Arrange bread in cloth-lined baskets"
      ],
      customs: [
        "Break bread with hands, never cut with knife",
        "Dip bread in shared dishes",
        "Serve elders and guests first",
        "Use right hand for eating"
      ],
      taboos: [
        "Don't refuse offered food (take at least a small portion)",
        "Don't eat with left hand",
        "Don't rush through meals",
        "Don't blow on hot food"
      ],
      servingOrder: [
        "Mezze (small appetizers) first",
        "Main dishes with bread",
        "Sweet tea and desserts after the meal",
        "Coffee to conclude"
      ]
    },
    mediterranean: {
      presentation: [
        "Simple, rustic presentation",
        "Fresh herbs as garnish",
        "Olive oil drizzled as finishing touch",
        "Colorful vegetable arrangements"
      ],
      customs: [
        "Bread accompanies the entire meal",
        "Share multiple dishes family-style",
        "Use bread to soak up sauces",
        "Leisurely pace with conversation"
      ],
      taboos: [
        "Don't rush the meal",
        "Don't waste bread",
        "Don't add cheese to seafood pasta in Italy",
        "Don't ask for additional seasoning before tasting"
      ],
      servingOrder: [
        "Antipasti/appetizers",
        "Pasta or rice dish",
        "Main protein dish",
        "Salad course",
        "Cheese and fruit",
        "Dessert and coffee"
      ]
    },
    latin_america: {
      presentation: [
        "Colorful arrangements",
        "Fresh garnishes like cilantro and lime",
        "Serve with traditional salsas on the side",
        "Family-style large platters"
      ],
      customs: [
        "Wait for eldest to begin eating",
        "Keep hands visible on table, not in lap",
        "Use tortillas or bread to scoop food",
        "Express appreciation for the food"
      ],
      taboos: [
        "Don't eat tacos with fork and knife",
        "Don't add hot sauce before tasting",
        "Don't refuse offered food in someone's home",
        "Don't leave the table until everyone is finished"
      ],
      servingOrder: [
        "Soup or light appetizer",
        "Main course with sides",
        "Dessert",
        "Coffee or digestif"
      ]
    }
  }

  return (
    etiquette[region] || {
      presentation: [],
      customs: [],
      taboos: [],
      servingOrder: []
    }
  )
}

export async function generateCulturalRecipeDetails(recipeName, cuisineName) {
  try {
    console.log("Generating recipe details for:", { recipeName, cuisineName })

    const prompt = `Generate detailed cultural recipe information for "${recipeName}" from ${cuisineName} cuisine.

    Return EXACTLY this JSON structure with no additional text:
    {
      "description": "string (a short description of the recipe and its cultural significance)",
      "difficulty": "beginner" | "intermediate" | "advanced",
      "authenticIngredients": [
        "2 cups rice",
        "1 pound chicken",
        "3 tablespoons oil",
        "2 cloves garlic",
        "1 teaspoon salt"
      ],
      "instructions": [
        "Step 1: Prepare ingredients",
        "Step 2: Cook rice",
        "Step 3: Cook chicken",
        "Step 4: Combine and serve"
      ]
    }

    Important:
    - Each ingredient must include both the amount and the ingredient name
    - Use standard measurements (cups, tablespoons, teaspoons, pounds, ounces, etc.)
    - Include all essential ingredients for an authentic recipe
    - Instructions should be clear, numbered steps`

    console.log("Sending prompt to AI:", prompt)

    const result = await generateContent(prompt)
    
    // Handle the result properly
    if (!result || !result.response) {
      console.error("[Server] Invalid Gemini response structure:", result);
      throw new Error("Invalid response from Gemini API");
    }
    
    // Safely extract text content
    let responseText;
    try {
      responseText = await result.response.text();
    } catch (error) {
      console.error("[Server] Error extracting text from Gemini response:", error);
      throw new Error("Failed to extract text from AI response");
    }
    
    if (!responseText) {
      console.error("[Server] Empty response text from Gemini");
      throw new Error("Received empty response from AI service");
    }
    
    console.log("Raw AI response:", responseText)

    const data = await safeJsonParse(responseText)
    console.log("Parsed AI response:", data)

    // Ensure the response matches our expected format
    const formattedData = {
      description: data.description || "",
      difficulty: data.difficulty || "intermediate",
      authenticIngredients: Array.isArray(data.authenticIngredients)
        ? data.authenticIngredients
        : [],
      instructions: Array.isArray(data.instructions) ? data.instructions : []
    }

    console.log("Final formatted data:", formattedData)
    return formattedData
  } catch (error) {
    console.error("Error generating cultural recipe details:", error)
    throw error
  }
}

export default {
  generateCuisineDetailsFromName,
  getCulturalContext,
  analyzeCulturalCuisine,
  getRecipeAuthenticityScore,
  getTechniqueTips,
  generateCulturalDetails,
  getPairings,
  getEtiquette,
  getSubstitutions,
  getCulturalCuisineInfo,
  getAuthenticRecipeAdaptation,
  getCrossCulturalFusion,
  getCuisineInsights,
  getAuthenticRecipe,
  getCulturalCookingTips,
  generateCulturalRecipeDetails
};
