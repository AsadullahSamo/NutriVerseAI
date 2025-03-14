import { model, safeJsonParse } from "./gemini-client";

export interface KitchenEquipment {
  id: number;  // Changed from string to number to match database
  name: string;
  category: string;
  condition: 'excellent' | 'good' | 'fair' | 'needs-maintenance' | 'replace';
  lastMaintenanceDate?: string;
  purchaseDate?: string;
  maintenanceInterval?: number; // in days
  maintenanceNotes?: string;
  purchasePrice?: number;
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

export interface EquipmentRecommendation {
  name: string;
  category: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedPrice: string;
  alternativeOptions?: string[];
}

export interface MaintenanceSchedule {
  equipmentId: string;
  nextMaintenanceDate: string;
  tasks: string[];
  estimatedDuration: string;
  priority: 'high' | 'medium' | 'low';
}

export async function analyzeKitchenInventory(
  equipment: KitchenEquipment[],
  userCookingPreferences?: string[]
): Promise<EquipmentAnalysis> {
  const prompt = `Analyze this kitchen equipment inventory and provide maintenance recommendations, shopping suggestions, and recipe possibilities:
    Equipment: ${JSON.stringify(equipment)}
    Cooking Preferences: ${userCookingPreferences?.join(', ') || 'None specified'}
    
    Return analysis in JSON format with maintenanceRecommendations, shoppingRecommendations, and recipeRecommendations.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    return await safeJsonParse(response);
  } catch (error) {
    console.error('Failed to analyze kitchen inventory:', error);
    throw error;
  }
}

export async function getMaintenanceTips(
  equipment: KitchenEquipment
): Promise<string[]> {
  const prompt = `Provide maintenance tips for this kitchen equipment:
    ${JSON.stringify(equipment)}
    Return an array of specific, actionable maintenance tips.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    return await safeJsonParse(response);
  } catch (error) {
    console.error('Failed to get maintenance tips:', error);
    throw error;
  }
}

export async function getEquipmentRecommendations(
  currentEquipment: KitchenEquipment[],
  cookingPreferences: string[],
  budget?: number
): Promise<EquipmentRecommendation[]> {
  const prompt = `Based on this kitchen equipment inventory and cooking preferences, recommend essential equipment additions:
    Current Equipment: ${JSON.stringify(currentEquipment)}
    Cooking Preferences: ${cookingPreferences.join(', ')}
    ${budget ? `Budget Limit: $${budget}` : ''}
    
    Return recommendations in JSON array format with name, category, reason, priority, estimatedPrice, and optional alternativeOptions fields.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    return await safeJsonParse(response);
  } catch (error) {
    console.error('Failed to get equipment recommendations:', error);
    throw error;
  }
}

export async function generateMaintenanceSchedule(
  equipment: KitchenEquipment[],
  startDate: string,
  endDate: string
): Promise<MaintenanceSchedule[]> {
  const prompt = `Create a maintenance schedule for these kitchen equipment items from ${startDate} to ${endDate}:
    Equipment: ${JSON.stringify(equipment)}
    
    Return a schedule in JSON array format with equipmentId, nextMaintenanceDate, tasks, estimatedDuration, and priority fields.
    Consider the current condition and last maintenance date of each item.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    return await safeJsonParse(response);
  } catch (error) {
    console.error('Failed to generate maintenance schedule:', error);
    throw error;
  }
}

export async function getRecipesByEquipment(
  equipment: KitchenEquipment[],
  userPreferences?: string[]
): Promise<{
  possibleRecipes: { id: number; title: string; requiredEquipment: string[] }[];
  recommendedPurchases: { equipment: string; enabledRecipes: string[] }[];
}> {
  const prompt = `Suggest recipes possible with this kitchen equipment and recommend equipment purchases to enable more recipes:
    Equipment: ${JSON.stringify(equipment)}
    ${userPreferences ? `User Preferences: ${userPreferences.join(', ')}` : ''}
    
    Return JSON with possibleRecipes (recipes possible with current equipment) and recommendedPurchases (equipment that would enable new recipes).`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    return await safeJsonParse(response);
  } catch (error) {
    console.error('Failed to get recipes by equipment:', error);
    throw error;
  }
}

export async function getEquipmentUsageGuide(
  equipment: string,
  skillLevel: string
): Promise<{
  basicUse: string[];
  advancedTechniques: string[];
  maintenanceTips: string[];
  safetyNotes: string[];
}> {
  const prompt = `Create a comprehensive usage guide for ${equipment} appropriate for ${skillLevel} skill level.
  Return the guide in JSON format with basicUse, advancedTechniques, maintenanceTips, and safetyNotes arrays.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    return await safeJsonParse(response);
  } catch (error) {
    console.error('Failed to get equipment usage guide:', error);
    throw error;
  }
}

export async function getEquipmentCompatibility(
  newItem: string,
  currentEquipment: { name: string; type: string }[]
): Promise<{
  isCompatible: boolean;
  compatibilityScore: number;
  reasons: string[];
  suggestions: string[];
}> {
  const prompt = `Analyze compatibility between ${newItem} and the current kitchen equipment:
    Current Equipment: ${JSON.stringify(currentEquipment)}
    
    Return analysis in JSON format with isCompatible (boolean), compatibilityScore (0-100), reasons array, and suggestions array.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    return await safeJsonParse(response);
  } catch (error) {
    console.error('Failed to get equipment compatibility:', error);
    throw error;
  }
}

export async function getUpgradeRecommendations(
  equipment: { name: string; condition: string; purchaseDate?: string }[]
): Promise<{
  urgentUpgrades: string[];
  plannedUpgrades: string[];
  reasonings: Record<string, string>;
}> {
  const prompt = `Recommend equipment upgrades based on this inventory:
    Equipment: ${JSON.stringify(equipment)}
    
    Return recommendations in JSON format with urgentUpgrades array, plannedUpgrades array, and reasonings object.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    return await safeJsonParse(response);
  } catch (error) {
    console.error('Failed to get upgrade recommendations:', error);
    throw error;
  }
}

// Mock data functions for fallback when API is not available
function getMockAnalysis(
  equipment: KitchenEquipment[], 
  userCookingPreferences?: string[]
): EquipmentAnalysis {
  return {
    maintenanceRecommendations: [{
      equipmentId: "1",
      recommendation: "Regular cleaning needed",
      priority: "medium",
      suggestedAction: "Clean after each use"
    }],
    shoppingRecommendations: [{
      itemName: "Chef's Knife",
      reason: "Essential tool for meal preparation",
      priority: "high",
      estimatedPrice: "$50-100"
    }],
    recipeRecommendations: [{
      recipeName: "Simple Pasta",
      possibleWithCurrent: true,
      requiredEquipment: ["pot", "strainer"]
    }]
  };
}