import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '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',
  dangerouslyAllowBrowser: true
});

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
    Provide analysis in JSON format with maintenanceRecommendations, shoppingRecommendations, and recipeRecommendations.`;

  const response = await groq.chat.completions.create({
    messages: [
      { 
        role: "system", 
        content: "You are a professional kitchen equipment expert and chef. Provide detailed analysis in JSON format only." 
      },
      { role: "user", content: prompt }
    ],
    model: "mixtral-8x7b-32768",
    temperature: 0.4,
    max_tokens: 1500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from kitchen analysis API');
  }

  try {
    const cleanedContent = content.trim().replace(/```json\n?|\n?```/g, '');
    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error('Failed to parse kitchen analysis:', error);
    throw new Error('Invalid kitchen analysis format received');
  }
}

export async function getMaintenanceTips(
  equipment: KitchenEquipment
): Promise<string[]> {
  const prompt = `Provide maintenance tips for this kitchen equipment:
    ${JSON.stringify(equipment)}
    Return an array of specific, actionable maintenance tips.`;

  const response = await groq.chat.completions.create({
    messages: [
      { 
        role: "system", 
        content: "You are a kitchen equipment maintenance expert. Provide specific, practical tips in JSON array format." 
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
    const cleanedContent = content.trim().replace(/```json\n?|\n?```/g, '');
    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error('Failed to parse maintenance tips:', error);
    throw new Error('Invalid maintenance tips format received');
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
    
    Return recommendations in JSON array format with name, category, reason, priority, and estimated price.`;

  const response = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a professional chef and kitchen equipment expert. Provide practical equipment recommendations in JSON format only."
      },
      { role: "user", content: prompt }
    ],
    model: "mixtral-8x7b-32768",
    temperature: 0.4,
    max_tokens: 1500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from equipment recommendations API');
  }

  try {
    const cleanedContent = content.trim().replace(/```json\n?|\n?```/g, '');
    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error('Failed to parse equipment recommendations:', error);
    throw new Error('Invalid equipment recommendations format received');
  }
}

export async function generateMaintenanceSchedule(
  equipment: KitchenEquipment[],
  startDate: string,
  endDate: string
): Promise<MaintenanceSchedule[]> {
  const prompt = `Create a maintenance schedule for these kitchen equipment items from ${startDate} to ${endDate}:
    Equipment: ${JSON.stringify(equipment)}
    
    Return a schedule in JSON array format with equipmentId, nextMaintenanceDate, tasks, estimatedDuration, and priority.
    Consider the current condition and last maintenance date of each item.`;

  const response = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a kitchen equipment maintenance expert. Create practical maintenance schedules in JSON format only."
      },
      { role: "user", content: prompt }
    ],
    model: "mixtral-8x7b-32768",
    temperature: 0.3,
    max_tokens: 1500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from maintenance schedule API');
  }

  try {
    const cleanedContent = content.trim().replace(/```json\n?|\n?```/g, '');
    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error('Failed to parse maintenance schedule:', error);
    throw new Error('Invalid maintenance schedule format received');
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

  const response = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a professional chef. Suggest recipes based on available equipment and recommend strategic equipment purchases in JSON format only."
      },
      { role: "user", content: prompt }
    ],
    model: "mixtral-8x7b-32768",
    temperature: 0.5,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from recipe suggestions API');
  }

  try {
    const cleanedContent = content.trim().replace(/```json\n?|\n?```/g, '');
    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error('Failed to parse recipe suggestions:', error);
    throw new Error('Invalid recipe suggestions format received');
  }
}

export { analyzeKitchenInventory, getMaintenanceTips, getEquipmentRecommendations, generateMaintenanceSchedule, getRecipesByEquipment };