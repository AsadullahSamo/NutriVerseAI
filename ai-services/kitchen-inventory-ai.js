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
  const prompt = `Provide maintenance tips for this kitchen equipment:
    ${JSON.stringify(equipment)}
    Return an array of specific, actionable maintenance tips.`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response.text()
    return await safeJsonParse(response)
  } catch (error) {
    console.error("Failed to get maintenance tips:", error)
    throw error
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
