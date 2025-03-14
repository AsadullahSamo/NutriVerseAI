import { model, safeJsonParse } from "./gemini-client";
import type { StorageItem, KitchenStorageLocation } from "@shared/schema";

interface StorageOptimizationMove {
  itemId: number;
  newLocationId: number;
  reason: string;
}

interface SpoilagePrediction {
  itemId: number;
  daysUntilSpoilage: number;
  recommendation: string;
}

interface ShoppingRecommendation {
  name: string;
  reason: string;
}

export async function getOptimalStorageLocation(
  item: Partial<StorageItem>,
  locations: KitchenStorageLocation[]
): Promise<KitchenStorageLocation> {
  const prompt = `
    As a kitchen organization expert, analyze this item and available storage locations to suggest the optimal storage location.
    Item: ${JSON.stringify(item)}
    Available Locations: ${JSON.stringify(locations)}
    Consider:
    1. Temperature requirements
    2. Humidity needs
    3. Available capacity
    4. Item usage frequency
    Return only the ID of the best location.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response.text();
  const locationId = parseInt(response);
  return locations.find(loc => loc.id === locationId) || locations[0];
}

export async function generateSmartShoppingList(
  items: StorageItem[],
  locations: KitchenStorageLocation[]
): Promise<{ name: string; reason: string }[]> {
  const prompt = `
    Analyze current inventory and storage capacity to suggest items for shopping.
    Current Items: ${JSON.stringify(items)}
    Storage Locations: ${JSON.stringify(locations)}
    Consider:
    1. Items running low based on usage frequency
    2. Available storage capacity
    3. Items nearing expiry that need replacement
    Return a JSON array of objects with name and reason fields.`;

  const result = await model.generateContent(prompt);
  const response = await result.response.text();
  return await safeJsonParse(response);
}

export async function predictSpoilage(
  items: StorageItem[],
  locations: KitchenStorageLocation[]
): Promise<{ itemId: number; daysUntilSpoilage: number; recommendation: string }[]> {
  const prompt = `
    Predict potential spoilage for these items based on their storage conditions.
    Items: ${JSON.stringify(items)}
    Storage Locations: ${JSON.stringify(locations)}
    Consider:
    1. Current storage conditions (temperature, humidity)
    2. Item expiry dates
    3. Optimal storage requirements
    4. Usage patterns
    Return a JSON array of objects with itemId, daysUntilSpoilage, and recommendation fields.`;

  const result = await model.generateContent(prompt);
  const response = await result.response.text();
  return await safeJsonParse(response);
}

export async function optimizeStorageLayout(
  items: StorageItem[],
  locations: KitchenStorageLocation[]
): Promise<{ moves: { itemId: number; newLocationId: number; reason: string }[] }> {
  const prompt = `
    Analyze current kitchen storage layout and suggest optimizations.
    Current Items: ${JSON.stringify(items)}
    Storage Locations: ${JSON.stringify(locations)}
    Consider:
    1. Usage frequency patterns
    2. Item relationships (commonly used together)
    3. Storage conditions requirements
    4. Accessibility needs
    Return a JSON object with a moves array containing itemId, newLocationId, and reason for each suggested move.`;

  const result = await model.generateContent(prompt);
  const response = await result.response.text();
  return await safeJsonParse(response);
}

export async function analyzeKitchenLayout(layout: string): Promise<{
  flowAnalysis: string;
  suggestions: string[];
  efficiencyScore: number;
}> {
  const prompt = `Analyze this kitchen layout and provide suggestions for improvement:
    Layout: ${layout}
    Return response in JSON format with flowAnalysis, suggestions array, and efficiencyScore (0-100).`;

  const result = await model.generateContent(prompt);
  const response = await result.response.text();
  return await safeJsonParse(response);
}

export async function getOrganizationRecommendations(
  items: { name: string; category: string }[],
  spaces: { name: string; type: string }[]
): Promise<{
  itemPlacements: { item: string; space: string; reason: string }[];
  generalTips: string[];
}> {
  const prompt = `Suggest organization for these items in the available spaces:
    Items: ${JSON.stringify(items)}
    Spaces: ${JSON.stringify(spaces)}
    Return recommendations in JSON format with itemPlacements array and generalTips array.`;

  const result = await model.generateContent(prompt);
  const response = await result.response.text();
  return await safeJsonParse(response);
}

export async function generateCleaningSchedule(
  equipment: { name: string; lastCleaning?: string }[]
): Promise<{
  dailyTasks: string[];
  weeklyTasks: string[];
  monthlyTasks: string[];
  schedule: { item: string; frequency: string; nextDate: string }[];
}> {
  const prompt = `Create a cleaning schedule for these kitchen items:
    Equipment: ${JSON.stringify(equipment)}
    Return schedule in JSON format with dailyTasks, weeklyTasks, monthlyTasks arrays and schedule array.`;

  const result = await model.generateContent(prompt);
  const response = await result.response.text();
  return await safeJsonParse(response);
}

export async function getStorageOptimization(
  items: { name: string; quantity: number; expiryDate?: string }[],
  spaces: { name: string; capacity: number; currentItems: number }[]
): Promise<{
  placements: { item: string; space: string; quantity: number }[];
  warnings: string[];
  suggestions: string[];
}> {
  const prompt = `Optimize storage for these items in available spaces:
    Items: ${JSON.stringify(items)}
    Spaces: ${JSON.stringify(spaces)}
    Return optimization in JSON format with placements array, warnings array, and suggestions array.`;

  const result = await model.generateContent(prompt);
  const response = await result.response.text();
  return await safeJsonParse(response);
}

// Helper functions with embedded knowledge
function getItemType(itemName: string): string {
  // ... existing helper function implementation ...
  return 'other';
}

function getLocationIdByType(locations: KitchenStorageLocation[], type: string): number {
  const location = locations.find(loc => loc.type === type);
  return location ? location.id : 0;
}

function getReasonForMove(itemType: string, itemName: string): string {
  // ... existing helper function implementation ...
  return `${itemName} would be better organized in this location`;
}

function getRecommendationForSpoilage(foodType: string, daysUntilSpoilage: number): string {
  // ... existing helper function implementation ...
  if (daysUntilSpoilage <= 0) {
    return `Your ${foodType} should be used immediately or discarded`;
  } else if (daysUntilSpoilage <= 3) {
    return `Use your ${foodType} within the next ${daysUntilSpoilage} days`;
  } else if (daysUntilSpoilage <= 7) {
    return `Plan to use your ${foodType} this week`;
  } else {
    return `Your ${foodType} should be used within ${daysUntilSpoilage} days`;
  }
}