import type { KitchenEquipment, EquipmentRecommendation, MaintenanceSchedule } from '@shared/schema';
import { model, safeJsonParse } from "../../../ai-services/gemini-client";

export async function getEquipmentRecommendations(
  currentEquipment: KitchenEquipment[],
  cookingPreferences: string[],
  budget?: number
): Promise<EquipmentRecommendation[]> {
  const prompt = `You are a JSON API that must return a valid JSON array of kitchen equipment recommendations.
  Current Equipment: ${JSON.stringify(currentEquipment)}
  Cooking Preferences: ${cookingPreferences.join(', ')}
  ${budget ? `Budget: $${budget}` : ''}
  
  Return EXACTLY this JSON structure with no additional text:
  [
    {
      "name": "string",
      "reason": "string",
      "priority": "high|medium|low",
      "estimatedCost": "string",
      "alternativeOptions": ["string"]
    }
  ]`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    return await safeJsonParse(response);
  } catch (error) {
    console.error('Error getting equipment recommendations:', error);
    return getMockRecommendations(currentEquipment, cookingPreferences);
  }
}

async function fallbackToBackendRecommendations(
  currentEquipment: KitchenEquipment[],
  cookingPreferences: string[],
  budget?: number
): Promise<EquipmentRecommendation[]> {
  try {
    const response = await fetch('/api/kitchen-equipment/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentEquipment, cookingPreferences, budget }),
    });
    
    if (!response.ok) throw new Error('Failed to get equipment recommendations');
    return response.json();
  } catch (error) {
    console.error('Backend API failed for recommendations:', error);
    // Return mock data as last resort
    return getMockRecommendations(currentEquipment, cookingPreferences);
  }
}

export async function generateMaintenanceSchedule(
  equipment: KitchenEquipment[],
  startDate: string,
  endDate: string
): Promise<MaintenanceSchedule[]> {
  try {
    console.log("Calling Gemini API for maintenance schedule...");
    const prompt = `Generate a maintenance schedule for these kitchen equipment items from ${startDate} to ${endDate}:
      Equipment: ${JSON.stringify(equipment)}
      
      Return a maintenance schedule in JSON format as an array of objects with these properties:
      - equipmentId: number (matching the id in the equipment array)
      - date: string (ISO format date when maintenance should be performed)
      - tasks: string[] (array of specific maintenance tasks to perform)
      
      IMPORTANT: Your response MUST be a valid JSON array with no additional text. 
      Do not include any explanations, headers, or non-JSON content.
      Just the raw JSON array, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    return await safeJsonParse(response);
  } catch (error) {
    console.error('Error with Gemini API for maintenance schedule:', error);
    throw error;
  }
}

// Generate a date based on equipment condition
function generateDateBasedOnCondition(
  equipment: KitchenEquipment | undefined, 
  startDate: string, 
  endDate: string
): string {
  if (!equipment) {
    // Generate random date if equipment not found
    const start = new Date(startDate);
    const end = new Date(endDate);
    const randomDate = new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime())
    );
    return randomDate.toISOString().split('T')[0];
  }
  
  // Generate date based on condition
  const today = new Date();
  const scheduledDate = new Date(today);
  let maintenanceDelay = 0;
  
  switch (equipment.condition) {
    case 'excellent': maintenanceDelay = 90; break; // 3 months
    case 'good': maintenanceDelay = 45; break;      // 1.5 months
    case 'fair': maintenanceDelay = 21; break;      // 3 weeks
    case 'needs-maintenance': maintenanceDelay = 3; break; // 3 days
    case 'replace': maintenanceDelay = 0; break;    // immediately
    default: maintenanceDelay = 30;                 // 1 month default
  }
  
  scheduledDate.setDate(today.getDate() + maintenanceDelay);
  
  // Make sure the date is within our range
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const finalDate = new Date(Math.max(
    Math.min(scheduledDate.getTime(), end.getTime()), 
    start.getTime()
  ));
  
  return finalDate.toISOString().split('T')[0];
}

// Generate tasks based on equipment type
function generateTasksForEquipment(equipment: KitchenEquipment | undefined): string[] {
  if (!equipment) {
    return [
      'Check condition',
      'Clean thoroughly',
      'Test functionality',
      'Document any issues'
    ];
  }
  
  const name = equipment.name.toLowerCase();
  
  if (name.includes('processor')) {
    return [
      'Clean blades thoroughly after each use',
      'Check all connections and attachments',
      'Test all speed settings',
      'Verify lid seal is intact and functional'
    ];
  } else if (name.includes('knife')) {
    return [
      'Sharpen the blade',
      'Check handle for cracks or looseness',
      'Clean thoroughly and dry completely',
      'Store in a protective sheath or block'
    ];
  } else if (name.includes('skillet') || name.includes('pan')) {
    return [
      'Re-season the cooking surface',
      'Check for rust spots',
      'Ensure handle is securely attached',
      'Clean without abrasive cleaners'
    ];
  } else if (name.includes('mixer')) {
    return [
      'Clean all attachments and mixing bowl',
      'Check power cord for damage',
      'Test all speed settings',
      'Lubricate moving parts if needed'
    ];
  } else {
    return [
      `Clean ${equipment.name} thoroughly`,
      `Inspect ${equipment.name} for wear and damage`,
      `Test all functions of ${equipment.name}`,
      `Store ${equipment.name} properly when not in use`
    ];
  }
}

// Our own logic for generating a maintenance schedule
function generateMaintenanceScheduleLogic(
  equipment: KitchenEquipment[],
  startDate: string,
  endDate: string
): MaintenanceSchedule[] {
  console.log("Generating intelligent maintenance schedule based on equipment data");
  
  // Create a set to track equipment IDs we've already scheduled
  const processedIds = new Set<number>();
  const schedules: MaintenanceSchedule[] = [];
  
  // Process each equipment item once
  equipment.forEach(item => {
    // Skip if we already created a schedule for this equipment
    if (processedIds.has(item.id)) {
      return;
    }
    
    // Mark this equipment as processed
    processedIds.add(item.id);
    
    // Generate the schedule for this equipment
    const date = generateDateBasedOnCondition(item, startDate, endDate);
    const tasks = generateTasksForEquipment(item);
    
    schedules.push({
      equipmentId: item.id,
      date,
      tasks
    });
  });
  
  return schedules;
}

// Skip trying to use the backend since the endpoint doesn't exist
async function fallbackToBackendMaintenanceSchedule(
  equipment: KitchenEquipment[],
  startDate: string,
  endDate: string
): Promise<MaintenanceSchedule[]> {
  // Use our own intelligent schedule generation instead of mock data
  return generateMaintenanceScheduleLogic(equipment, startDate, endDate);
}

export async function getRecipesByEquipment(
  equipment: KitchenEquipment[],
  userPreferences?: string[]
): Promise<{
  possibleRecipes: { id: number; title: string; requiredEquipment: string[] }[];
  recommendedPurchases: { equipment: string; enabledRecipes: string[] }[];
}> {
  const prompt = `You are a JSON API that must return recipe recommendations based on available kitchen equipment.
  Equipment: ${JSON.stringify(equipment)}
  ${userPreferences ? `User Preferences: ${userPreferences.join(', ')}` : ''}
  
  Return EXACTLY this JSON structure with no additional text:
  {
    "possibleRecipes": [
      {
        "id": number,
        "title": "string",
        "requiredEquipment": ["string"]
      }
    ],
    "recommendedPurchases": [
      {
        "equipment": "string",
        "enabledRecipes": ["string"]
      }
    ]
  }`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    return await safeJsonParse(response);
  } catch (error) {
    console.error('Error getting recipes by equipment:', error);
    return getMockRecipeMatches(equipment, userPreferences);
  }
}

async function fallbackToBackendRecipeMatches(
  equipment: KitchenEquipment[],
  userPreferences?: string[]
): Promise<{
  possibleRecipes: { id: number; title: string; requiredEquipment: string[] }[];
  recommendedPurchases: { equipment: string; enabledRecipes: string[] }[];
}> {
  try {
    const response = await fetch('/api/kitchen-equipment/recipe-matches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ equipment, userPreferences }),
    });

    if (!response.ok) throw new Error('Failed to get recipe matches');
    return response.json();
  } catch (error) {
    console.error('Backend API failed for recipe matches:', error);
    // Return mock data as last resort
    return getMockRecipeMatches(equipment, userPreferences);
  }
}

// Mock data functions for fallback when both APIs fail
function getMockRecommendations(
  currentEquipment: KitchenEquipment[],
  cookingPreferences: string[]
): EquipmentRecommendation[] {
  const hasProcessor = currentEquipment.some(e => e.name.toLowerCase().includes('processor'));
  const hasSkillet = currentEquipment.some(e => e.name.toLowerCase().includes('skillet'));
  
  return [
    {
      id: 1,
      name: hasProcessor ? 'High-Quality Chef\'s Knife' : 'Food Processor',
      reason: hasProcessor 
        ? 'A quality chef\'s knife is essential for precise cutting and food preparation' 
        : 'Would greatly speed up food preparation and enable more complex recipes',
      priority: 'high',
      estimatedCost: hasProcessor ? '$80-150' : '$100-250'
    },
    {
      id: 2,
      name: hasSkillet ? 'Dutch Oven' : 'Cast Iron Skillet',
      reason: hasSkillet 
        ? 'Perfect for slow cooking stews, soups, and braising' 
        : 'Versatile cookware for searing, baking, and stovetop cooking',
      priority: 'medium',
      estimatedCost: hasSkillet ? '$70-200' : '$30-100'
    },
    {
      id: 3, 
      name: 'Digital Kitchen Scale',
      reason: 'Essential for precise measurements in baking and portion control',
      priority: 'medium',
      estimatedCost: '$15-30'
    }
  ];
}

// Replace the mock function with our intelligent schedule generator
function getMockMaintenanceSchedule(
  equipment: KitchenEquipment[],
  startDate: string,
  endDate: string
): MaintenanceSchedule[] {
  return generateMaintenanceScheduleLogic(equipment, startDate, endDate);
}

function getMockRecipeMatches(
  equipment: KitchenEquipment[],
  userPreferences?: string[]
): {
  possibleRecipes: { id: number; title: string; requiredEquipment: string[] }[];
  recommendedPurchases: { equipment: string; enabledRecipes: string[] }[];
} {
  const hasProcessor = equipment.some(e => e.name.toLowerCase().includes('processor'));
  const hasSkillet = equipment.some(e => e.name.toLowerCase().includes('skillet'));
  const hasMixer = equipment.some(e => e.name.toLowerCase().includes('mixer'));
  const hasKnife = equipment.some(e => e.name.toLowerCase().includes('knife'));
  
  const possibleRecipes = [
    {
      id: 1,
      title: 'Simple Pasta with Tomato Sauce',
      requiredEquipment: ['Chef\'s Knife', 'Large Pot']
    },
    {
      id: 2,
      title: 'Pan-Seared Steak',
      requiredEquipment: ['Cast Iron Skillet', 'Chef\'s Knife']
    }
  ];
  
  // Add conditional recipes based on available equipment
  if (hasProcessor) {
    possibleRecipes.push({
      id: 3,
      title: 'Homemade Hummus',
      requiredEquipment: ['Food Processor']
    });
  }
  
  if (hasSkillet && hasKnife) {
    possibleRecipes.push({
      id: 4,
      title: 'Stir-Fried Vegetables',
      requiredEquipment: ['Cast Iron Skillet', 'Chef\'s Knife']
    });
  }
  
  if (hasMixer) {
    possibleRecipes.push({
      id: 5,
      title: 'Artisan Bread',
      requiredEquipment: ['Stand Mixer', 'Baking Sheet']
    });
  }
  
  const recommendedPurchases = [
    {
      equipment: hasProcessor ? 'Immersion Blender' : 'Food Processor',
      enabledRecipes: ['Creamy Soups', 'Homemade Hummus', 'Pesto Sauce']
    },
    {
      equipment: hasMixer ? 'Dutch Oven' : 'Stand Mixer',
      enabledRecipes: hasMixer 
        ? ['No-Knead Bread', 'Braised Short Ribs', 'French Onion Soup']
        : ['Homemade Bread', 'Cake Batter', 'Cookie Dough']
    }
  ];
  
  return { possibleRecipes, recommendedPurchases };
}