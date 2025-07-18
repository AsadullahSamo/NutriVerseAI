// ...existing code...

export async function getRecipesByEquipment(equipment, userPreferences) {
    const prompt = `You are a JSON API that must return recipe recommendations based on available kitchen equipment.
    Equipment: ${JSON.stringify(equipment)}
    ${userPreferences ? `User Preferences: ${userPreferences.join(", ")}` : ""}
    
    Return EXACTLY this JSON structure with no additional text:
    {
      "possibleRecipes": [
        {
          "id": number,
          "title": "string",
          "description": "A detailed description of the recipe",
          "ingredients": ["string"],
          "instructions": ["string"],
          "prepTime": number,
          "nutritionInfo": {
            "calories": number,
            "protein": number,
            "carbs": number,
            "fat": number,
            "sustainabilityScore": number
          },
          "requiredEquipment": ["string"]
        }
      ],
      "recommendedPurchases": [
        {
          "equipment": "string",
          "enabledRecipes": ["string"],
          "reason": "string",
          "priority": "high|medium|low",
          "estimatedPrice": "string"
        }
      ]
    }`
  
    try {
      const result = await model.generateContent(prompt)
      const response = await result.response.text()
      const parsedResponse = await safeJsonParse(response)
      console.log("Raw AI response:", response)
      console.log("Parsed AI response:", parsedResponse)
      return parsedResponse
    } catch (error) {
      console.error("Error getting recipes by equipment:", error)
      const mockData = getMockRecipeMatches(equipment, userPreferences)
      console.log("Using mock data:", mockData)
      return mockData
    }
  }
  
  function getMockRecipeMatches(equipment, userPreferences) {
    const hasProcessor = equipment.some(e =>
      e.name.toLowerCase().includes("food processor")
    )
    const hasMixer = equipment.some(e => e.name.toLowerCase().includes("mixer"))
    const hasSkillet = equipment.some(e =>
      e.name.toLowerCase().includes("skillet")
    )
    const hasKnife = equipment.some(e => e.name.toLowerCase().includes("knife"))
  
    const possibleRecipes = []
  
    if (hasProcessor) {
      possibleRecipes.push({
        id: 3,
        title: "Homemade Hummus",
        description:
          "Creamy, authentic hummus made from scratch with your food processor.",
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
        nutritionInfo: {
          calories: 250,
          protein: 8,
          carbs: 25,
          fat: 15,
          sustainabilityScore: 85
        },
        requiredEquipment: ["Food Processor"],
        createdBy: 1,
        createdAt: new Date().toISOString(),
        imageUrl: "https://source.unsplash.com/featured/?hummus"
      })
    }
  
    if (hasSkillet && hasKnife) {
      possibleRecipes.push({
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
        nutritionInfo: {
          calories: 180,
          protein: 5,
          carbs: 20,
          fat: 10,
          sustainabilityScore: 90
        },
        requiredEquipment: ["Cast Iron Skillet", "Chef's Knife"],
        createdBy: 1,
        createdAt: new Date().toISOString(),
        imageUrl: "https://source.unsplash.com/featured/?stirfry"
      })
    }
  
    if (hasMixer) {
      possibleRecipes.push({
        id: 5,
        title: "Artisan Bread",
        description:
          "Classic artisan bread with a crispy crust and soft interior.",
        ingredients: ["bread flour", "yeast", "salt", "water"],
        instructions: [
          "Mix ingredients in stand mixer",
          "Knead with dough hook for 10 minutes",
          "Let rise for 2 hours",
          "Shape and bake"
        ],
        prepTime: 180,
        nutritionInfo: {
          calories: 120,
          protein: 4,
          carbs: 23,
          fat: 0.5,
          sustainabilityScore: 75
        },
        requiredEquipment: ["Stand Mixer", "Baking Sheet"],
        createdBy: 1,
        createdAt: new Date().toISOString(),
        imageUrl: "https://source.unsplash.com/featured/?bread"
      })
    }
  
    return { possibleRecipes }
  }
  
  // ...existing code...
  