import { model, safeJsonParse } from "../../../ai-services/gemini-client";
export async function analyzeKitchenInventory(equipment, userCookingPreferences) {
    try {
        console.log("Calling Gemini API for kitchen inventory analysis...");
        const prompt = `You are a JSON API that must only return a valid JSON object without any explanation or additional text. Analyze this kitchen equipment inventory and provide maintenance recommendations, shopping suggestions, and recipe possibilities.

    Equipment: ${JSON.stringify(equipment)}
    Cooking Preferences: ${(userCookingPreferences === null || userCookingPreferences === void 0 ? void 0 : userCookingPreferences.join(', ')) || 'None specified'}

    RESPOND WITH EXACTLY THIS JSON STRUCTURE AND NOTHING ELSE (no explanation, no markdown):
    {
      "maintenanceRecommendations": [
        {
          "equipmentId": "string",
          "recommendation": "string",
          "priority": "high|medium|low",
          "suggestedAction": "string"
        }
      ],
      "shoppingRecommendations": [
        {
          "itemName": "string",
          "reason": "string",
          "priority": "high|medium|low",
          "estimatedCost": "string"
        }
      ],
      "recipeRecommendations": [
        {
          "recipeName": "string",
          "possibleWithCurrentEquipment": boolean,
          "requiredEquipment": ["string"],
          "difficulty": "easy|medium|hard"
        }
      ]
    }`;
        const result = await model.generateContent(prompt);
        const response = await result.response.text();
        return await safeJsonParse(response);
    }
    catch (error) {
        console.error('Error with Gemini API:', error);
        return getMockAnalysis(equipment, userCookingPreferences);
    }
}
export async function getMaintenanceTips(equipment) {
    try {
        console.log("Calling Gemini API for maintenance tips...");
        const prompt = `Provide maintenance tips for this kitchen equipment:
    ${JSON.stringify(equipment)}
    
    Return an array of strings, each containing a specific maintenance tip.
    The response should be a valid JSON array of strings with no additional text or explanation.`;
        const result = await model.generateContent(prompt);
        const response = await result.response.text();
        return await safeJsonParse(response);
    }
    catch (error) {
        console.error('Error with Gemini API for maintenance tips:', error);
        return getMockMaintenanceTips(equipment);
    }
}
// Mock data functions for fallback when API is not available
function getMockAnalysis(equipment, userCookingPreferences) {
    const needsMaintenance = equipment.filter(e => e.condition === 'fair' || e.condition === 'needs-maintenance');
    return {
        maintenanceRecommendations: needsMaintenance.map(item => ({
            equipmentId: item.id.toString(),
            recommendation: `Your ${item.name} could use some maintenance soon.`,
            priority: item.condition === 'needs-maintenance' ? 'high' : 'medium',
            suggestedAction: item.condition === 'needs-maintenance'
                ? `Schedule professional maintenance for your ${item.name}`
                : `Clean and check your ${item.name} for any issues`
        })),
        shoppingRecommendations: [
            {
                itemName: "Immersion Blender",
                reason: "Would complement your soup recipes and sauces",
                priority: "medium",
                estimatedPrice: "$40-60"
            },
            {
                itemName: "Quality Cutting Board",
                reason: "Essential for food preparation and protects your knives",
                priority: "high",
                estimatedPrice: "$25-35"
            }
        ],
        recipeRecommendations: [
            {
                recipeName: "Classic Pasta Primavera",
                possibleWithCurrent: true,
                requiredEquipment: ["Chef's Knife", "Cast Iron Skillet"]
            },
            {
                recipeName: "Homemade Artisan Bread",
                possibleWithCurrent: equipment.some(e => e.name.toLowerCase().includes("mixer")),
                requiredEquipment: ["Stand Mixer", "Baking Sheet"]
            },
            {
                recipeName: "Creamy Soup",
                possibleWithCurrent: equipment.some(e => e.name.toLowerCase().includes("processor")),
                requiredEquipment: ["Food Processor"]
            }
        ]
    };
}
function getMockMaintenanceTips(equipment) {
    const tips = {
        "Food Processor": [
            "Clean blades thoroughly after each use to prevent food buildup",
            "Check the rubber gaskets regularly for wear and replace if needed",
            "Sharpen blades every 6 months for optimal performance",
            "Lubricate moving parts annually with food-grade lubricant"
        ],
        "Stand Mixer": [
            "Wipe down after each use with a damp cloth",
            "Check beaters and attachments for wear",
            "Tighten any loose screws in the body",
            "Clean the head attachment point to ensure smooth operation"
        ],
        "Chef's Knife": [
            "Sharpen regularly using a whetstone or professional service",
            "Hand wash only - dishwashers can damage the blade and handle",
            "Store in a knife block or with a blade guard",
            "Hone the edge before each use with a honing steel"
        ],
        "Cast Iron Skillet": [
            "Re-season every 3-6 months with a thin layer of oil",
            "Never soak in water or use harsh detergents",
            "Dry completely after washing to prevent rust",
            "Store in a dry place with a paper towel to absorb moisture"
        ]
    };
    // Return tips for the specific equipment or generic tips if not found
    return tips[equipment.name] || [
        `Clean your ${equipment.name} after each use`,
        `Check for signs of wear regularly`,
        `Store properly to extend the life of your ${equipment.name}`,
        `Follow manufacturer's maintenance guidelines`
    ];
}
