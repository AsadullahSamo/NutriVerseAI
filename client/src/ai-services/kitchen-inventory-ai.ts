import Groq from "groq-sdk";

// Direct initialization with environment variable and fallback to the same API key used by other working services
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY || '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',
  dangerouslyAllowBrowser: true
});

export interface KitchenEquipment {
  id: number;
  name: string;
  category: string;
  condition: 'excellent' | 'good' | 'fair' | 'needs-maintenance' | 'replace';
  lastMaintenanceDate?: string;
  purchaseDate?: string;
  maintenanceInterval?: number; // in days
}

export interface EquipmentAnalysis {
  maintenanceRecommendations: {
    equipmentId: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
    suggestedAction: string;
  }[];
  shoppingRecommendations: {
    itemName: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    estimatedPrice?: string;
  }[];
  recipeRecommendations: {
    recipeName: string;
    possibleWithCurrent: boolean;
    requiredEquipment: string[];
  }[];
}

export async function analyzeKitchenInventory(
  equipment: KitchenEquipment[],
  userCookingPreferences?: string[]
): Promise<EquipmentAnalysis> {
  try {
    console.log("Calling Groq API for kitchen inventory analysis...");
    const prompt = `You are a JSON API that must only return a valid JSON object without any explanation or additional text. Analyze this kitchen equipment inventory and provide maintenance recommendations, shopping suggestions, and recipe possibilities.

Equipment: ${JSON.stringify(equipment)}
Cooking Preferences: ${userCookingPreferences?.join(', ') || 'None specified'}

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
      "estimatedPrice": "string"
    }
  ],
  "recipeRecommendations": [
    {
      "recipeName": "string",
      "possibleWithCurrent": true|false,
      "requiredEquipment": ["string"]
    }
  ]
}`;

    const response = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a strict JSON API that only returns valid JSON objects without any explanation, markdown formatting, or additional text." 
        },
        { role: "user", content: prompt }
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.3,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from kitchen analysis API');
    }

    try {
      // Clean the response to ensure valid JSON
      const cleanedContent = content
        .trim()
        .replace(/```json\n?|\n?```/g, '')           // Remove code blocks
        .replace(/^[^{]*({[\s\S]*})[^}]*$/, '$1')    // Extract only the JSON object
        .replace(/\s+/g, ' ')                        // Normalize whitespace
        .replace(/\\n/g, ' ')                       // Remove newlines
        .replace(/,(\s*[}\]])/g, '$1');             // Remove trailing commas
      
      const result = JSON.parse(cleanedContent);
      
      // Validate the structure
      if (!result.maintenanceRecommendations || !result.shoppingRecommendations || !result.recipeRecommendations) {
        throw new Error('Invalid response structure');
      }

      return result;
    } catch (error) {
      console.error('Failed to parse kitchen analysis:', error);
      return getMockAnalysis(equipment, userCookingPreferences);
    }
  } catch (error) {
    console.error('Error with GROQ API for kitchen analysis:', error);
    return getMockAnalysis(equipment, userCookingPreferences);
  }
}

export async function getMaintenanceTips(
  equipment: KitchenEquipment
): Promise<string[]> {
  try {
    console.log("Calling Groq API for maintenance tips...");
    const prompt = `You are a JSON API that must return only a JSON array of maintenance tips for this kitchen equipment. No explanation text, no formatting, just the raw JSON array.

Equipment: ${JSON.stringify(equipment)}

RESPOND WITH EXACTLY THIS FORMAT AND NOTHING ELSE (no explanation, no markdown):
["tip 1", "tip 2", "tip 3"]`;

    const response = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a strict JSON API that only returns a valid JSON array of strings. No explanations, no markdown, no additional text." 
        },
        { role: "user", content: prompt }
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.3,
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from maintenance tips API');
    }

    try {
      // Clean the response to ensure valid JSON array
      const cleanedContent = content
        .trim()
        .replace(/```json\n?|\n?```/g, '')           // Remove code blocks
        .replace(/^[^[]*(\[[\s\S]*\])[^]]*$/, '$1')  // Extract only the JSON array
        .replace(/\s+/g, ' ')                        // Normalize whitespace
        .replace(/\\n/g, ' ')                       // Remove newlines
        .replace(/,(\s*\])/g, ']');                // Remove trailing commas

      const tips = JSON.parse(cleanedContent);
      
      if (!Array.isArray(tips)) {
        throw new Error('Response is not an array');
      }

      return tips.length > 0 ? tips : generateTasksForEquipment(equipment);
    } catch (error) {
      console.error('Failed to parse maintenance tips:', error);
      return generateTasksForEquipment(equipment);
    }
  } catch (error) {
    console.error('Error with GROQ API for maintenance tips:', error);
    return generateTasksForEquipment(equipment);
  }
}

// Mock data functions for fallback when API is not available
function getMockAnalysis(
  equipment: KitchenEquipment[], 
  userCookingPreferences?: string[]
): EquipmentAnalysis {
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

function getMockMaintenanceTips(equipment: KitchenEquipment): string[] {
  const tips: Record<string, string[]> = {
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