import { Groq } from "@/lib/groq";
import type { StorageItem, KitchenStorageLocation } from "@shared/schema";

const groq = new Groq(process.env.GROQ_API_KEY);

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

  const response = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "mixtral-8x7b-32768",
    temperature: 0.3,
    max_tokens: 100,
  });

  const locationId = parseInt(response.choices[0].message.content);
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
    Return a JSON array of objects with name and reason fields, like:
    [{ "name": "Milk", "reason": "Current stock low and high usage frequency" }]
  `;

  const response = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "mixtral-8x7b-32768",
    temperature: 0.4,
    max_tokens: 500,
  });

  return JSON.parse(response.choices[0].message.content);
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
    Return a JSON array of objects with itemId, daysUntilSpoilage, and recommendation fields.
  `;

  const response = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "mixtral-8x7b-32768",
    temperature: 0.3,
    max_tokens: 500,
  });

  return JSON.parse(response.choices[0].message.content);
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
    Return a JSON object with a moves array containing itemId, newLocationId, and reason for each suggested move.
  `;

  const response = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "mixtral-8x7b-32768",
    temperature: 0.3,
    max_tokens: 800,
  });

  return JSON.parse(response.choices[0].message.content);
}

/**
 * Analyzes kitchen storage items and locations to suggest optimal organization
 */
export function optimizeKitchenLayout(
  items: StorageItem[],
  locations: KitchenStorageLocation[]
): { moves: StorageOptimizationMove[] } {
  const moves: StorageOptimizationMove[] = [];
  
  // Group items by type
  const itemsByType: Record<string, StorageItem[]> = {};
  items.forEach(item => {
    const type = getItemType(item.name);
    if (!itemsByType[type]) itemsByType[type] = [];
    itemsByType[type].push(item);
  });
  
  // Find optimal locations for each type
  const optimalLocationByType: Record<string, number> = {
    'spice': getLocationIdByType(locations, 'cabinet'),
    'perishable': getLocationIdByType(locations, 'refrigerator'),
    'frozen': getLocationIdByType(locations, 'freezer'),
    'grain': getLocationIdByType(locations, 'pantry'),
    'canned': getLocationIdByType(locations, 'pantry'),
    'snack': getLocationIdByType(locations, 'pantry'),
    'condiment': getLocationIdByType(locations, 'refrigerator'),
    'vegetable': getLocationIdByType(locations, 'refrigerator'),
    'fruit': getLocationIdByType(locations, 'counter'),
    'beverage': getLocationIdByType(locations, 'refrigerator'),
  };
  
  // Check each item and suggest moves if not in optimal location
  Object.entries(itemsByType).forEach(([type, typeItems]) => {
    const optimalLocationId = optimalLocationByType[type];
    if (!optimalLocationId) return;
    
    typeItems.forEach(item => {
      if (item.locationId !== optimalLocationId) {
        moves.push({
          itemId: item.id,
          newLocationId: optimalLocationId,
          reason: getReasonForMove(type, item.name)
        });
      }
    });
  });
  
  return { moves };
}

/**
 * Predicts potential food spoilage based on food types and estimated shelf life
 */
export function predictFoodSpoilage(
  items: StorageItem[],
  locations: KitchenStorageLocation[]
): SpoilagePrediction[] {
  const predictions: SpoilagePrediction[] = [];
  
  // Define estimated shelf life in days for different food items
  const shelfLife: Record<string, number> = {
    // Refrigerated items
    'milk': 7,
    'yogurt': 14,
    'cheese': 21,
    'butter': 30,
    'eggs': 28,
    'ground meat': 2,
    'poultry': 3,
    'fish': 2,
    'deli meat': 5,
    'berries': 5,
    'leafy greens': 7,
    'apples': 30,
    'citrus': 21,
    'bread': 7,
    'cooked leftovers': 4,
    
    // Pantry items have longer shelf life
    'pasta': 730, // ~2 years
    'rice': 730,
    'flour': 365,
    'sugar': 730,
    'canned goods': 1095, // ~3 years
    'cereal': 180,
    'chips': 30,
    'crackers': 90,
    'nuts': 180,
    'dried fruits': 180,
    'spices': 730,
    'oils': 365,
  };
  
  // Check each item against shelf life
  items.forEach(item => {
    const foodType = Object.keys(shelfLife).find(type => 
      item.name.toLowerCase().includes(type.toLowerCase())
    );
    
    if (foodType) {
      const itemShelfLife = shelfLife[foodType];
      // Simulate a random age for the item (in real app, would use actual purchase date)
      const simulatedAgeDays = Math.floor(Math.random() * (itemShelfLife * 1.2));
      const daysUntilSpoilage = itemShelfLife - simulatedAgeDays;
      
      if (daysUntilSpoilage <= 14) { // Only show items that will spoil within 2 weeks
        predictions.push({
          itemId: item.id,
          daysUntilSpoilage,
          recommendation: getRecommendationForSpoilage(foodType, daysUntilSpoilage)
        });
      }
    }
  });
  
  // Sort by most urgent (lowest days until spoilage)
  return predictions.sort((a, b) => a.daysUntilSpoilage - b.daysUntilSpoilage);
}

/**
 * Generates smart shopping recommendations based on current inventory
 */
export function generateSmartShoppingList(
  items: StorageItem[]
): ShoppingRecommendation[] {
  const recommendations: ShoppingRecommendation[] = [];
  
  // Basic essentials that should always be in stock
  const essentials = [
    'milk', 'eggs', 'bread', 'rice', 'pasta', 'onions', 
    'garlic', 'salt', 'pepper', 'olive oil', 'butter'
  ];
  
  // Check if essentials are missing
  essentials.forEach(essential => {
    const found = items.some(item => 
      item.name.toLowerCase().includes(essential.toLowerCase()) && 
      item.quantity > 0
    );
    
    if (!found) {
      recommendations.push({
        name: essential,
        reason: 'Basic cooking essential not in inventory'
      });
    }
  });
  
  // Check low quantities (simulated)
  items.forEach(item => {
    if (item.quantity <= 1) {
      recommendations.push({
        name: item.name,
        reason: 'Current supply is running low'
      });
    }
  });
  
  // Add complementary ingredients (simulated)
  const itemNames = items.map(item => item.name.toLowerCase());
  
  if (itemNames.includes('pasta') && !itemNames.includes('tomato sauce')) {
    recommendations.push({
      name: 'Tomato Sauce',
      reason: 'Complements pasta in your inventory'
    });
  }
  
  if (itemNames.includes('bread') && !itemNames.includes('jam') && !itemNames.includes('peanut butter')) {
    recommendations.push({
      name: 'Jam or Peanut Butter',
      reason: 'Goes well with bread in your inventory'
    });
  }
  
  if (itemNames.includes('rice') && !itemNames.includes('beans')) {
    recommendations.push({
      name: 'Beans',
      reason: 'Makes complete protein with rice'
    });
  }
  
  return recommendations;
}

// Helper functions
function getItemType(itemName: string): string {
  itemName = itemName.toLowerCase();
  if (itemName.includes('spice') || itemName.includes('herb') || 
      itemName.includes('salt') || itemName.includes('pepper')) return 'spice';
  if (itemName.includes('milk') || itemName.includes('yogurt') || 
      itemName.includes('cheese') || itemName.includes('meat') || 
      itemName.includes('fish') || itemName.includes('egg')) return 'perishable';
  if (itemName.includes('frozen') || itemName.includes('ice cream')) return 'frozen';
  if (itemName.includes('rice') || itemName.includes('pasta') || 
      itemName.includes('flour') || itemName.includes('cereal')) return 'grain';
  if (itemName.includes('can') || itemName.includes('jar')) return 'canned';
  if (itemName.includes('chip') || itemName.includes('cookie') || 
      itemName.includes('cracker') || itemName.includes('nuts')) return 'snack';
  if (itemName.includes('sauce') || itemName.includes('ketchup') || 
      itemName.includes('mustard') || itemName.includes('dressing')) return 'condiment';
  if (itemName.includes('apple') || itemName.includes('orange') || 
      itemName.includes('banana') || itemName.includes('berry')) return 'fruit';
  if (itemName.includes('carrot') || itemName.includes('onion') || 
      itemName.includes('potato') || itemName.includes('tomato') || 
      itemName.includes('lettuce')) return 'vegetable';
  if (itemName.includes('juice') || itemName.includes('soda') || 
      itemName.includes('water') || itemName.includes('beer') || 
      itemName.includes('wine')) return 'beverage';
  
  return 'other';
}

function getLocationIdByType(locations: KitchenStorageLocation[], type: string): number {
  const location = locations.find(loc => loc.type === type);
  return location ? location.id : 0;
}

function getReasonForMove(itemType: string, itemName: string): string {
  switch (itemType) {
    case 'spice':
      return `${itemName} should be stored in a cabinet away from heat and light`;
    case 'perishable':
      return `${itemName} needs refrigeration to maximize freshness`;
    case 'frozen':
      return `${itemName} requires freezing to prevent spoilage`;
    case 'grain':
      return `${itemName} stays fresher in cool, dry storage`;
    case 'canned':
      return `${itemName} is best stored in a pantry for easy access`;
    case 'snack':
      return `${itemName} should be stored in a dry place`;
    case 'condiment':
      return `${itemName} lasts longer when refrigerated after opening`;
    case 'vegetable':
      return `${itemName} stays fresh longer in the refrigerator`;
    case 'fruit':
      return `${itemName} ripens better at room temperature`;
    case 'beverage':
      return `${itemName} is best served chilled`;
    default:
      return `${itemName} would be better organized in this location`;
  }
}

function getRecommendationForSpoilage(foodType: string, daysUntilSpoilage: number): string {
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