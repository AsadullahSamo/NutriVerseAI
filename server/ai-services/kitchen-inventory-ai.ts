import { model, safeJsonParse } from "./gemini-client"

export async function analyzeKitchenInventory(
  equipment,
  userCookingPreferences
) {
  const prompt = `Analyze this kitchen equipment inventory and provide maintenance recommendations, shopping suggestions, and recipe possibilities:
    Equipment: ${JSON.stringify(equipment)}
    Cooking Preferences: ${userCookingPreferences?.join(", ") ||
      "None specified"}
    
    Return analysis in JSON format with maintenanceRecommendations, shoppingRecommendations, and recipeRecommendations.`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response.text()
    return await safeJsonParse(response)
  } catch (error) {
    console.error("Failed to analyze kitchen inventory:", error)
    throw error
  }
}

export async function getMaintenanceTips(equipment) {
  console.log('[AI Service] Getting maintenance tips for:', equipment.name, 'Condition:', equipment.condition)

  const conditionContext = getConditionContext(equipment.condition);

  const prompt = `You are a kitchen equipment maintenance expert. Provide 4-5 specific maintenance tips for this equipment:

Equipment: ${equipment.name}
Category: ${equipment.category || 'General'}
Current Condition: ${equipment.condition || 'Unknown'}

${conditionContext}

Return ONLY a JSON array of strings. Each string should be a specific, actionable maintenance tip.
Example: ["Clean after each use", "Check for wear monthly", "Store in dry place"]

Focus on practical, equipment-specific advice tailored to the current condition. No explanations, just the JSON array.`

  try {
    console.log('[AI Service] Sending prompt to Gemini...')
    const result = await model.generateContent(prompt)
    const response = await result.response.text()
    console.log('[AI Service] Raw response:', response)

    const tips = await safeJsonParse(response)
    console.log('[AI Service] Parsed tips:', tips)

    // Ensure we return an array of strings
    if (Array.isArray(tips) && tips.length > 0) {
      const validTips = tips
        .filter(tip => tip && typeof tip === 'string' && tip.trim().length > 0)
        .map(tip => tip.trim())

      if (validTips.length > 0) {
        console.log('[AI Service] Returning valid AI tips:', validTips.length)
        return validTips
      }
    }

    // If we get here, AI didn't return valid tips
    console.log('[AI Service] AI response invalid, using fallback')
    throw new Error('Invalid AI response format')

  } catch (error) {
    console.error("[AI Service] Failed to get maintenance tips:", error.message)

    // Generate contextual fallback tips based on equipment and condition
    const equipmentName = equipment.name?.toLowerCase() || 'equipment'
    const category = equipment.category?.toLowerCase() || ''
    const condition = equipment.condition?.toLowerCase() || 'unknown'

    let fallbackTips = []

    if (equipmentName.includes('knife') || category.includes('cutlery')) {
      fallbackTips = getKnifeTips(equipment.name, condition)
    } else if (equipmentName.includes('pan') || equipmentName.includes('pot') || category.includes('cookware')) {
      fallbackTips = getCookwareTips(equipment.name, condition)
    } else if (category.includes('appliance')) {
      fallbackTips = getApplianceTips(equipment.name, condition)
    } else {
      fallbackTips = getGeneralTips(equipment.name, condition)
    }

    console.log('[AI Service] Returning fallback tips:', fallbackTips.length)
    return fallbackTips
  }
}

// Helper function to provide condition-specific context
function getConditionContext(condition) {
  switch (condition?.toLowerCase()) {
    case 'excellent':
      return 'CONDITION FOCUS: Equipment is in excellent condition. Provide preventive maintenance tips to keep it that way.';

    case 'good':
      return 'CONDITION FOCUS: Equipment is in good condition. Provide maintenance tips to prevent deterioration and maintain performance.';

    case 'fair':
      return 'CONDITION FOCUS: Equipment is in fair condition with some wear. Provide maintenance tips to prevent further deterioration and restore performance where possible.';

    case 'needs-maintenance':
      return 'CONDITION FOCUS: Equipment needs maintenance. Provide specific repair and restoration tips to improve its condition.';

    case 'replace':
      return 'CONDITION FOCUS: Equipment is in poor condition and may need replacement. Provide tips for safe usage until replacement and signs to watch for immediate replacement.';

    default:
      return 'CONDITION FOCUS: Equipment condition is unknown. Provide general maintenance tips covering inspection, cleaning, and preventive care.';
  }
}

// Condition-specific fallback tip generators
function getKnifeTips(name, condition) {
  const baseTips = [
    `Keep your ${name} sharp with regular honing`,
    `Hand wash immediately after use and dry thoroughly`,
    `Store in a knife block or magnetic strip to protect the blade`,
    `Never put in dishwasher as it can damage the blade`
  ];

  switch (condition) {
    case 'excellent':
      return [...baseTips, `Maintain the excellent condition with weekly honing`];
    case 'good':
      return [...baseTips, `Check blade alignment and handle tightness monthly`];
    case 'fair':
      return [...baseTips, `Consider professional sharpening to restore performance`];
    case 'needs-maintenance':
      return [
        `Professional sharpening needed to restore cutting performance`,
        `Check for loose handle or damaged blade`,
        `Clean thoroughly and oil if carbon steel`,
        `Store properly to prevent further damage`
      ];
    case 'replace':
      return [
        `Use with extreme caution - blade may be damaged`,
        `Consider immediate replacement for safety`,
        `Do not use if handle is loose or blade is chipped`,
        `Keep away from children until replaced`
      ];
    default:
      return baseTips;
  }
}

function getCookwareTips(name, condition) {
  const baseTips = [
    `Clean while still warm but not hot to prevent warping`,
    `Avoid using metal utensils on non-stick surfaces`,
    `Store with pan protectors to prevent scratching`,
    `Check handles and rivets regularly for looseness`
  ];

  switch (condition) {
    case 'excellent':
      return [...baseTips, `Season regularly if cast iron to maintain excellent condition`];
    case 'good':
      return [...baseTips, `Inspect non-stick coating for any wear spots`];
    case 'fair':
      return [...baseTips, `Re-season if cast iron, or consider replacing if non-stick coating is worn`];
    case 'needs-maintenance':
      return [
        `Re-season cast iron cookware or replace if non-stick coating is damaged`,
        `Tighten loose handles or rivets if possible`,
        `Clean thoroughly to remove any buildup`,
        `Check for warping by placing on flat surface`
      ];
    case 'replace':
      return [
        `Use with caution - may have loose handles or damaged coating`,
        `Consider immediate replacement for safety and performance`,
        `Do not use if handle is very loose or coating is flaking`,
        `Avoid high heat until replaced`
      ];
    default:
      return baseTips;
  }
}

function getApplianceTips(name, condition) {
  const baseTips = [
    `Clean regularly according to manufacturer instructions`,
    `Check power cord and plug for damage monthly`,
    `Keep vents and air passages clear of debris`,
    `Store in a dry location when not in use`
  ];

  switch (condition) {
    case 'excellent':
      return [...baseTips, `Schedule annual professional maintenance to keep in excellent condition`];
    case 'good':
      return [...baseTips, `Monitor performance and clean filters regularly`];
    case 'fair':
      return [...baseTips, `Consider professional servicing to restore optimal performance`];
    case 'needs-maintenance':
      return [
        `Schedule professional maintenance or repair immediately`,
        `Check all electrical connections and cords`,
        `Clean thoroughly including internal components if accessible`,
        `Replace worn parts like filters or gaskets`
      ];
    case 'replace':
      return [
        `Use with extreme caution - may have electrical or mechanical issues`,
        `Consider immediate replacement for safety`,
        `Do not use if making unusual noises or sparking`,
        `Unplug when not in use until replaced`
      ];
    default:
      return baseTips;
  }
}

function getGeneralTips(name, condition) {
  const baseTips = [
    `Clean your ${name} thoroughly after each use`,
    `Store in a clean, dry place to prevent deterioration`,
    `Follow manufacturer's care instructions when available`,
    `Inspect for wear and damage regularly`
  ];

  switch (condition) {
    case 'excellent':
      return [...baseTips, `Continue current maintenance routine to preserve excellent condition`];
    case 'good':
      return [...baseTips, `Increase inspection frequency to maintain good condition`];
    case 'fair':
      return [...baseTips, `Address any visible wear or damage promptly`];
    case 'needs-maintenance':
      return [
        `Perform thorough cleaning and inspection`,
        `Address any visible damage or wear immediately`,
        `Consider professional repair if applicable`,
        `Replace worn components if possible`
      ];
    case 'replace':
      return [
        `Use with caution - equipment may be unsafe or ineffective`,
        `Plan for immediate replacement`,
        `Monitor closely for any safety issues`,
        `Consider temporary alternatives until replacement`
      ];
    default:
      return baseTips;
  }
}

export async function getEquipmentRecommendations(
  currentEquipment,
  cookingPreferences,
  budget
) {
  const prompt = `Based on this kitchen equipment inventory and cooking preferences, recommend essential equipment additions:
    Current Equipment: ${JSON.stringify(currentEquipment)}
    Cooking Preferences: ${cookingPreferences.join(", ")}
    ${budget ? `Budget Limit: $${budget}` : ""}
    
    Return recommendations in JSON array format with name, category, reason, priority, estimatedPrice, and optional alternativeOptions fields.`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response.text()
    return await safeJsonParse(response)
  } catch (error) {
    console.error("Failed to get equipment recommendations:", error)
    throw error
  }
}

export async function generateMaintenanceSchedule(
  equipment,
  startDate,
  endDate
) {
  const prompt = `Create a maintenance schedule for these kitchen equipment items from ${startDate} to ${endDate}:
    Equipment: ${JSON.stringify(equipment)}
    
    Return a schedule in JSON array format with equipmentId, nextMaintenanceDate, tasks, estimatedDuration, and priority fields.
    Consider the current condition and last maintenance date of each item.`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response.text()
    return await safeJsonParse(response)
  } catch (error) {
    console.error("Failed to generate maintenance schedule:", error)
    throw error
  }
}

export async function getRecipesByEquipment(equipment, userPreferences) {
  const prompt = `Suggest recipes possible with this kitchen equipment and recommend equipment purchases to enable more recipes:
    Equipment: ${JSON.stringify(equipment)}
    ${userPreferences ? `User Preferences: ${userPreferences.join(", ")}` : ""}
    
    Return JSON with:
    - possibleRecipes array containing recipes with:
      - id (number)
      - title (string)
      - description (string) 
      - requiredEquipment (string array)
      - prepTime (number in minutes)
      - nutritionInfo object containing:
        - calories (number)
        - protein (number in grams)
        - carbs (number in grams)
        - fat (number in grams)
        - sustainabilityScore (number 0-100)
    - recommendedPurchases array with equipment and enabledRecipes`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response.text()
    return await safeJsonParse(response)
  } catch (error) {
    console.error("Failed to get recipes by equipment:", error)
    throw error
  }
}

export async function getEquipmentUsageGuide(equipment, skillLevel) {
  const prompt = `Create a comprehensive usage guide for ${equipment} appropriate for ${skillLevel} skill level.
  Return the guide in JSON format with basicUse, advancedTechniques, maintenanceTips, and safetyNotes arrays.`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response.text()
    return await safeJsonParse(response)
  } catch (error) {
    console.error("Failed to get equipment usage guide:", error)
    throw error
  }
}

export async function getEquipmentCompatibility(newItem, currentEquipment) {
  const prompt = `Analyze compatibility between ${newItem} and the current kitchen equipment:
    Current Equipment: ${JSON.stringify(currentEquipment)}
    
    Return analysis in JSON format with isCompatible (boolean), compatibilityScore (0-100), reasons array, and suggestions array.`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response.text()
    return await safeJsonParse(response)
  } catch (error) {
    console.error("Failed to get equipment compatibility:", error)
    throw error
  }
}

export async function getUpgradeRecommendations(equipment) {
  const prompt = `Recommend equipment upgrades based on this inventory:
    Equipment: ${JSON.stringify(equipment)}
    
    Return recommendations in JSON format with urgentUpgrades array, plannedUpgrades array, and reasonings object.`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response.text()
    return await safeJsonParse(response)
  } catch (error) {
    console.error("Failed to get upgrade recommendations:", error)
    throw error
  }
}

// Mock data functions for fallback when API is not available
function getMockAnalysis(equipment, userCookingPreferences) {
  return {
    maintenanceRecommendations: [
      {
        equipmentId: "1",
        recommendation: "Regular cleaning needed",
        priority: "medium",
        suggestedAction: "Clean after each use"
      }
    ],
    shoppingRecommendations: [
      {
        itemName: "Chef's Knife",
        reason: "Essential tool for meal preparation",
        priority: "high",
        estimatedPrice: "$50-100"
      }
    ],
    recipeRecommendations: [
      {
        recipeName: "Simple Pasta",
        possibleWithCurrent: true,
        requiredEquipment: ["pot", "strainer"]
      }
    ]
  }
}

export async function analyzeInventory(items) {
  try {
    const prompt = `Analyze this kitchen inventory and provide insights:
    Items: ${JSON.stringify(items)}
    
    Return EXACTLY this JSON structure with no additional text:
    {
      "stapleItems": ["string"],
      "lowStock": ["string"],
      "expiringItems": ["string"],
      "recommendations": ["string"],
      "shoppingList": ["string"],
      "inventoryScore": number
    }`

    const result = await model.generateContent(prompt)
    const response = await result.response.text()
    return await safeJsonParse(response)
  } catch (error) {
    console.error("Error analyzing inventory:", error)
    throw error
  }
}

export async function getMealSuggestions(inventory) {
  try {
    const prompt = `Suggest meals based on these available ingredients:
    Inventory: ${JSON.stringify(inventory)}
    
    Return EXACTLY this JSON structure with no additional text:
    {
      "quickMeals": [
        {
          "name": "string",
          "ingredients": ["string"],
          "missing": ["string"]
        }
      ],
      "plannedMeals": [
        {
          "name": "string",
          "ingredients": ["string"],
          "preparation": "string"
        }
      ],
      "shoppingNeeded": ["string"]
    }`

    const result = await model.generateContent(prompt)
    const response = await result.response.text()
    return await safeJsonParse(response)
  } catch (error) {
    console.error("Error getting meal suggestions:", error)
    throw error
  }
}

export async function getStorageRecommendations(items) {
  try {
    const prompt = `Provide storage recommendations for these items:
    Items: ${JSON.stringify(items)}
    
    Return EXACTLY this JSON structure with no additional text:
    {
      "recommendations": [
        {
          "item": "string",
          "storage": "string",
          "duration": "string",
          "tips": ["string"]
        }
      ],
      "generalTips": ["string"],
      "organizationSuggestions": ["string"]
    }`

    const result = await model.generateContent(prompt)
    const response = await result.response.text()
    return await safeJsonParse(response)
  } catch (error) {
    console.error("Error getting storage recommendations:", error)
    throw error
  }
}
