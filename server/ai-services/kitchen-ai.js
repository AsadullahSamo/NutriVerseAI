import { model, safeJsonParse } from "./gemini-client.js";

export async function getRecipesByEquipment(equipment, userPreferences) {
    console.log('[AI Service] Analyzing recipes for current equipment:', equipment.length, 'items');

    // Extract equipment names for analysis
    const availableEquipment = equipment.map(item => item.name.toLowerCase());
    console.log('[AI Service] Available equipment:', availableEquipment);

    const prompt = `You are a culinary expert analyzing what recipes can be made with ONLY the current kitchen equipment.

CURRENT EQUIPMENT: ${JSON.stringify(equipment)}
USER PREFERENCES: ${userPreferences ? userPreferences.join(", ") : "None"}

IMPORTANT RULES:
1. ONLY suggest recipes that can be made with the EXACT equipment listed above
2. If equipment is missing for a recipe, clearly indicate what's missing
3. Categorize recipes as "canMake" (with current equipment) or "needsEquipment" (missing equipment)
4. Be strict about equipment requirements - don't assume equipment that's not listed

Return EXACTLY this JSON structure with no additional text:
{
  "canMake": [
    {
      "id": number,
      "title": "string",
      "description": "Brief description",
      "ingredients": ["string"],
      "instructions": ["string"],
      "prepTime": number,
      "difficulty": "Easy|Medium|Hard",
      "requiredEquipment": ["equipment1", "equipment2"],
      "nutritionInfo": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number,
        "sustainabilityScore": number
      }
    }
  ],
  "needsEquipment": [
    {
      "id": number,
      "title": "string",
      "description": "Brief description",
      "ingredients": ["string"],
      "instructions": ["string"],
      "prepTime": number,
      "difficulty": "Easy|Medium|Hard",
      "requiredEquipment": ["equipment1", "equipment2"],
      "missingEquipment": ["missing1", "missing2"],
      "nutritionInfo": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number,
        "sustainabilityScore": number
      }
    }
  ]
}

Focus on practical, achievable recipes. Be very strict about equipment requirements.`
  
    try {
      const result = await model.generateContent(prompt)
      const response = await result.response.text()
      const parsedResponse = await safeJsonParse(response)
      console.log("[AI Service] Raw AI response:", response.substring(0, 200) + "...")
      console.log("[AI Service] Recipe analysis complete:", {
        canMake: parsedResponse?.canMake?.length || 0,
        needsEquipment: parsedResponse?.needsEquipment?.length || 0
      });

      // Ensure the response has the expected structure
      if (parsedResponse && (parsedResponse.canMake || parsedResponse.needsEquipment)) {
        return parsedResponse;
      } else {
        throw new Error("Invalid AI response structure");
      }
    } catch (error) {
      console.error("[AI Service] Error getting recipes by equipment:", error)
      const mockData = getMockRecipeMatches(equipment, userPreferences)
      console.log("[AI Service] Using mock data:", mockData)
      return mockData
    }
  }
  
  function getMockRecipeMatches(equipment, userPreferences) {
    console.log("[AI Service] Generating mock recipe matches for equipment:", equipment.length);

    const hasProcessor = equipment.some(e =>
      e.name.toLowerCase().includes("food processor")
    )
    const hasMixer = equipment.some(e => e.name.toLowerCase().includes("mixer"))
    const hasSkillet = equipment.some(e =>
      e.name.toLowerCase().includes("skillet") || e.name.toLowerCase().includes("pan")
    )
    const hasKnife = equipment.some(e => e.name.toLowerCase().includes("knife"))
    const hasPot = equipment.some(e => e.name.toLowerCase().includes("pot"))
    const hasOven = equipment.some(e => e.name.toLowerCase().includes("oven"))

    const canMake = []
    const needsEquipment = []
  
    if (hasProcessor) {
      canMake.push({
        id: 3,
        title: "Homemade Hummus",
        description: "Creamy, authentic hummus made from scratch with your food processor.",
        ingredients: [
          "chickpeas",
          "tahini",
          "lemon juice",
          "garlic",
          "olive oil",
          "cumin"
        ],
        instructions: [
          "Drain and rinse chickpeas",
          "Add all ingredients to food processor",
          "Process until smooth and creamy",
          "Season to taste"
        ],
        prepTime: 15,
        difficulty: "Easy",
        nutritionInfo: {
          calories: 250,
          protein: 8,
          carbs: 25,
          fat: 15,
          sustainabilityScore: 85
        },
        requiredEquipment: ["Food Processor"],
      })
    }

    if (hasSkillet && hasKnife) {
      canMake.push({
        id: 4,
        title: "Stir-Fried Vegetables",
        description: "Quick and healthy stir-fry using seasonal vegetables.",
        ingredients: [
          "mixed vegetables",
          "garlic",
          "ginger",
          "soy sauce",
          "sesame oil"
        ],
        instructions: [
          "Chop all vegetables uniformly",
          "Heat skillet over high heat",
          "Stir-fry vegetables in batches",
          "Add sauce and combine"
        ],
        prepTime: 25,
        difficulty: "Easy",
        nutritionInfo: {
          calories: 180,
          protein: 5,
          carbs: 20,
          fat: 10,
          sustainabilityScore: 90
        },
        requiredEquipment: ["Skillet", "Knife"]
      })
    }
  
    if (hasMixer && hasOven) {
      canMake.push({
        id: 5,
        title: "Artisan Bread",
        description: "Classic artisan bread with a crispy crust and soft interior.",
        ingredients: ["bread flour", "yeast", "salt", "water"],
        instructions: [
          "Mix ingredients in stand mixer",
          "Knead with dough hook for 10 minutes",
          "Let rise for 2 hours",
          "Shape and bake"
        ],
        prepTime: 180,
        difficulty: "Medium",
        nutritionInfo: {
          calories: 120,
          protein: 4,
          carbs: 23,
          fat: 0.5,
          sustainabilityScore: 75
        },
        requiredEquipment: ["Stand Mixer", "Oven"]
      })
    }

    // Add recipes that need equipment
    if (!hasPot) {
      needsEquipment.push({
        id: 6,
        title: "Pasta with Marinara",
        description: "Classic pasta dish with homemade tomato sauce.",
        ingredients: ["pasta", "tomatoes", "garlic", "basil", "olive oil"],
        instructions: [
          "Boil water in large pot",
          "Cook pasta according to package directions",
          "Make sauce in separate pan",
          "Combine and serve"
        ],
        prepTime: 30,
        difficulty: "Easy",
        nutritionInfo: {
          calories: 350,
          protein: 12,
          carbs: 65,
          fat: 8,
          sustainabilityScore: 70
        },
        requiredEquipment: ["Large Pot", "Strainer", "Pan"],
        missingEquipment: ["Large Pot", "Strainer"]
      })
    }

    if (!hasOven) {
      needsEquipment.push({
        id: 7,
        title: "Roasted Chicken",
        description: "Perfectly roasted whole chicken with herbs.",
        ingredients: ["whole chicken", "herbs", "lemon", "olive oil", "salt"],
        instructions: [
          "Preheat oven to 425°F",
          "Season chicken inside and out",
          "Roast for 60-75 minutes",
          "Rest before carving"
        ],
        prepTime: 90,
        difficulty: "Medium",
        nutritionInfo: {
          calories: 450,
          protein: 35,
          carbs: 2,
          fat: 25,
          sustainabilityScore: 60
        },
        requiredEquipment: ["Oven", "Roasting Pan"],
        missingEquipment: ["Oven", "Roasting Pan"]
      })
    }

    console.log("[AI Service] Mock data generated:", {
      canMake: canMake.length,
      needsEquipment: needsEquipment.length
    });

    return { canMake, needsEquipment }
  }
  
  // ...existing code...
  