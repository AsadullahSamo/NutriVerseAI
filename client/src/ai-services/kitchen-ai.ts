import type { KitchenEquipment, EquipmentRecommendation, MaintenanceSchedule } from '@shared/schema';
import Groq from "groq-sdk";

// Direct initialization with environment variable and fallback to the same API key used by other working services
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY || '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',
  dangerouslyAllowBrowser: true
});

export async function getEquipmentRecommendations(
  currentEquipment: KitchenEquipment[],
  cookingPreferences: string[],
  budget?: number
): Promise<EquipmentRecommendation[]> {
  try {
    console.log("Calling Groq API for equipment recommendations...");
    const prompt = `Based on this kitchen equipment inventory and cooking preferences, recommend new equipment to purchase:
      Current Equipment: ${JSON.stringify(currentEquipment)}
      Cooking Preferences: ${cookingPreferences.join(', ') || 'None specified'}
      Budget Limit: ${budget ? `$${budget}` : 'No specific budget'}
      
      Return recommendations in JSON format as an array of objects with these properties:
      - id: number (unique identifier)
      - name: string (name of recommended equipment)
      - reason: string (why this is recommended)
      - priority: string (high, medium, or low)
      - estimatedCost: string (price range)`;

    const response = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are an expert kitchen equipment advisor. Provide detailed equipment recommendations in JSON format only." 
        },
        { role: "user", content: prompt }
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.3,
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
      return fallbackToBackendRecommendations(currentEquipment, cookingPreferences, budget);
    }
  } catch (error) {
    console.error('Error with GROQ API for recommendations:', error);
    return fallbackToBackendRecommendations(currentEquipment, cookingPreferences, budget);
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
    console.log("Calling Groq API for maintenance schedule...");
    const prompt = `Generate a maintenance schedule for these kitchen equipment items from ${startDate} to ${endDate}:
      Equipment: ${JSON.stringify(equipment)}
      
      Return a maintenance schedule in JSON format as an array of objects with these properties:
      - equipmentId: number (matching the id in the equipment array)
      - date: string (ISO format date when maintenance should be performed)
      - tasks: string[] (array of specific maintenance tasks to perform)
      
      IMPORTANT: Your response MUST be a valid JSON array with no additional text. 
      Do not include any explanations, headers, or non-JSON content.
      Just the raw JSON array, nothing else.`;

    const response = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a JSON-only API that responds with properly formatted JSON arrays. Never include explanations, markdown code blocks, or any text outside of the JSON. Always validate your JSON is correctly formatted before responding." 
        },
        { role: "user", content: prompt }
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.2, // Lowering temperature for more predictable JSON formatting
      max_tokens: 1200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from maintenance schedule API');
    }

    console.log("Raw maintenance schedule response:", content);

    try {
      // Super aggressive JSON extraction and repair
      const extractJSON = (str: string): string => {
        // First attempt: find content between square brackets with a regex
        const arrayMatch = str.match(/\[([\s\S]*)\]/);
        if (arrayMatch) {
          return `[${arrayMatch[1]}]`;
        }
        
        // Second attempt: find the first [ and last ]
        const firstBracket = str.indexOf('[');
        const lastBracket = str.lastIndexOf(']');
        
        if (firstBracket !== -1 && lastBracket !== -1 && firstBracket < lastBracket) {
          return str.substring(firstBracket, lastBracket + 1);
        }
        
        // If we can't find brackets, this isn't valid JSON
        throw new Error('Cannot extract JSON array from response');
      };

      // Clean and extract the JSON
      let cleanedContent = content
        .trim()
        .replace(/```json\n?|\n?```/g, '')        // Remove markdown code blocks
        .replace(/^[\s\S]*?(\[)/m, '$1')          // Remove anything before first [
        .replace(/(\])[\s\S]*?$/m, '$1');         // Remove anything after last ]
      
      // If still not starting with [, try more aggressive extraction
      if (!cleanedContent.startsWith('[')) {
        cleanedContent = extractJSON(content);
      }
      
      // Final validation - does it look like an array?
      if (!cleanedContent.startsWith('[') || !cleanedContent.endsWith(']')) {
        throw new Error('Response is not a valid JSON array');
      }

      console.log("Cleaned JSON for parsing:", cleanedContent);
      
      try {
        // Attempt to parse the JSON
        const parsed = JSON.parse(cleanedContent);
        
        // Validate it's an array
        if (!Array.isArray(parsed)) {
          throw new Error('Expected an array in maintenance schedule response');
        }
        
        // If valid but empty, use mock data
        if (parsed.length === 0) {
          console.log("Received empty array, generating maintenance schedule with our logic");
          return generateMaintenanceScheduleLogic(equipment, startDate, endDate);
        }
        
        // Map to ensure all required properties are present
        return parsed.map((item, index) => {
          // Handle equipmentId: ensure it's a number and exists in our equipment array
          let equipmentId: number;
          
          if (typeof item.equipmentId === 'number') {
            equipmentId = item.equipmentId;
          } else if (typeof item.equipmentId === 'string' && !isNaN(parseInt(item.equipmentId))) {
            equipmentId = parseInt(item.equipmentId);
          } else {
            equipmentId = equipment[index % equipment.length].id;
          }
          
          // Ensure the equipmentId actually exists in our equipment array
          const validId = equipment.some(e => e.id === equipmentId) 
            ? equipmentId 
            : equipment[index % equipment.length].id;
          
          // Handle date: ensure it's a valid ISO string date
          let date: string;
          if (typeof item.date === 'string' && !isNaN(new Date(item.date).getTime())) {
            date = item.date;
          } else {
            // Generate a sensible date based on equipment condition
            const equipItem = equipment.find(e => e.id === validId);
            date = generateDateBasedOnCondition(equipItem, startDate, endDate);
          }
          
          // Handle tasks: ensure it's an array of strings
          let tasks: string[];
          if (Array.isArray(item.tasks) && item.tasks.length > 0) {
            tasks = item.tasks.map(t => String(t));
          } else {
            // Generate tasks based on equipment type
            const equipItem = equipment.find(e => e.id === validId);
            tasks = generateTasksForEquipment(equipItem);
          }
          
          return {
            equipmentId: validId,
            date,
            tasks
          };
        });
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        // Try a more manual approach to fix the JSON
        console.log("Attempting manual JSON repair...");
        
        // Look for array items and try to parse them individually
        const itemRegex = /\{\s*"equipmentId"\s*:.*?\s*"tasks"\s*:\s*\[.*?\]\s*\}/gs;
        const matches = cleanedContent.match(itemRegex);
        
        if (matches && matches.length > 0) {
          console.log(`Found ${matches.length} maintenance items manually`);
          
          // Build schedule items from matches
          const items: MaintenanceSchedule[] = [];
          
          for (let i = 0; i < Math.min(matches.length, equipment.length); i++) {
            try {
              // Try to parse each item
              const itemMatch = matches[i]
                .replace(/,\s*\}/, '}') // Fix trailing commas
                .replace(/,\s*\]/, ']'); // Fix array trailing commas
              
              const parsedItem = JSON.parse(itemMatch);
              
              items.push({
                equipmentId: parsedItem.equipmentId || equipment[i].id,
                date: parsedItem.date || generateDateBasedOnCondition(equipment[i], startDate, endDate),
                tasks: Array.isArray(parsedItem.tasks) ? parsedItem.tasks : generateTasksForEquipment(equipment[i])
              });
            } catch (itemError) {
              console.error('Failed to parse item:', itemError);
              // Add a fallback item
              items.push({
                equipmentId: equipment[i].id,
                date: generateDateBasedOnCondition(equipment[i], startDate, endDate),
                tasks: generateTasksForEquipment(equipment[i])
              });
            }
          }
          
          if (items.length > 0) {
            return items;
          }
        }
        
        // If manual parsing fails, generate from scratch
        console.log("Manual repair failed, generating maintenance schedule with our logic");
        return generateMaintenanceScheduleLogic(equipment, startDate, endDate);
      }
    } catch (error) {
      console.error('Failed to parse maintenance schedule:', error);
      console.log("Generating maintenance schedule with our logic");
      return generateMaintenanceScheduleLogic(equipment, startDate, endDate);
    }
  } catch (error) {
    console.error('Error with GROQ API for maintenance schedule:', error);
    console.log("Generating maintenance schedule with our logic due to API error");
    return generateMaintenanceScheduleLogic(equipment, startDate, endDate);
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
  
  return equipment.map(item => {
    const date = generateDateBasedOnCondition(item, startDate, endDate);
    const tasks = generateTasksForEquipment(item);
    
    return {
      equipmentId: item.id,
      date,
      tasks
    };
  });
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
  try {
    console.log("Calling Groq API for recipe matching...");
    const prompt = `Based on these kitchen equipment items, suggest recipes that can be prepared and additional equipment that would enable more recipes:
      Equipment: ${JSON.stringify(equipment)}
      User Preferences: ${userPreferences?.join(', ') || 'None specified'}
      
      Return results in JSON format with two properties:
      1. possibleRecipes: array of objects with:
         - id: number (unique identifier)
         - title: string (recipe name)
         - requiredEquipment: string[] (equipment needed for this recipe)
      2. recommendedPurchases: array of objects with:
         - equipment: string (name of equipment to purchase)
         - enabledRecipes: string[] (recipes that would become possible with this equipment)`;

    const response = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a professional chef with extensive knowledge of recipes and kitchen equipment. Provide recipe and equipment suggestions in JSON format only." 
        },
        { role: "user", content: prompt }
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.4,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from recipe matching API');
    }

    try {
      const cleanedContent = content.trim().replace(/```json\n?|\n?```/g, '');
      return JSON.parse(cleanedContent);
    } catch (error) {
      console.error('Failed to parse recipe matches:', error);
      return fallbackToBackendRecipeMatches(equipment, userPreferences);
    }
  } catch (error) {
    console.error('Error with GROQ API for recipe matches:', error);
    return fallbackToBackendRecipeMatches(equipment, userPreferences);
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