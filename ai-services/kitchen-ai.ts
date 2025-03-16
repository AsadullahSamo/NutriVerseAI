// ...existing code...

export async function getRecipesByEquipment(
  equipment: KitchenEquipment[],
  userPreferences?: string[]
): Promise<{ possibleRecipes: Recipe[] }> {
  try {
    // Create prompt to generate detailed recipes based on available equipment
    const prompt = `Given this kitchen equipment and preferences, generate detailed recipes that can be made:
    Equipment: ${JSON.stringify(equipment.map(e => ({ name: e.name, category: e.category })))}
    Preferences: ${userPreferences ? JSON.stringify(userPreferences) : 'None'}

    Return a JSON object with an array of 'possibleRecipes'. Each recipe must have:
    {
      "id": number,
      "title": string,
      "description": string,
      "ingredients": string[],
      "instructions": string[],
      "prepTime": number,
      "nutritionInfo": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number
      },
      "sustainabilityScore": number,
      "requiredEquipment": string[],
      "imageUrl": string (optional)
    }

    Focus on recipes that maximize the use of available equipment while considering user preferences.
    Calculate sustainability scores based on:
    - Equipment energy efficiency (modern appliances score higher)
    - Cooking method sustainability
    - Overall resource usage
    Score from 0-100.`;

    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    return await safeJsonParse(response);

  } catch (error) {
    console.error('Error getting recipe matches:', error);
    // Return mock data as fallback
    return getMockRecipeMatches(equipment, userPreferences);
  }
}

function getMockRecipeMatches(
  equipment: KitchenEquipment[],
  userPreferences?: string[]
): { possibleRecipes: Recipe[] } {
  const hasProcessor = equipment.some(e => e.name.toLowerCase().includes('food processor'));
  const hasMixer = equipment.some(e => e.name.toLowerCase().includes('mixer'));
  const hasSkillet = equipment.some(e => e.name.toLowerCase().includes('skillet'));
  const hasKnife = equipment.some(e => e.name.toLowerCase().includes('knife'));

  const possibleRecipes: Recipe[] = [];

  if (hasProcessor) {
    possibleRecipes.push({
      id: 3,
      title: 'Homemade Hummus',
      description: 'Creamy, authentic hummus made from scratch with your food processor.',
      ingredients: [
        'chickpeas',
        'tahini',
        'lemon juice',
        'garlic',
        'olive oil',
        'cumin'
      ],
      instructions: [
        'Drain and rinse chickpeas',
        'Add all ingredients to food processor',
        'Process until smooth and creamy',
        'Season to taste'
      ],
      prepTime: 15,
      nutritionInfo: {
        calories: 250,
        protein: 8,
        carbs: 25,
        fat: 15
      },
      sustainabilityScore: 85,
      requiredEquipment: ['Food Processor'],
      createdBy: 1,
      createdAt: new Date().toISOString(),
      imageUrl: 'https://source.unsplash.com/featured/?hummus'
    });
  }
  
  if (hasSkillet && hasKnife) {
    possibleRecipes.push({
      id: 4,
      title: 'Stir-Fried Vegetables',
      description: 'Quick and healthy stir-fry using seasonal vegetables.',
      ingredients: [
        'mixed vegetables',
        'garlic',
        'ginger',
        'soy sauce',
        'sesame oil'
      ],
      instructions: [
        'Chop all vegetables uniformly',
        'Heat skillet over high heat',
        'Stir-fry vegetables in batches',
        'Add sauce and combine'
      ],
      prepTime: 25,
      nutritionInfo: {
        calories: 180,
        protein: 5,
        carbs: 20,
        fat: 10
      },
      sustainabilityScore: 90,
      requiredEquipment: ['Cast Iron Skillet', 'Chef\'s Knife'],
      createdBy: 1,
      createdAt: new Date().toISOString(),
      imageUrl: 'https://source.unsplash.com/featured/?stirfry'
    });
  }
  
  if (hasMixer) {
    possibleRecipes.push({
      id: 5,
      title: 'Artisan Bread',
      description: 'Classic artisan bread with a crispy crust and soft interior.',
      ingredients: [
        'bread flour',
        'yeast',
        'salt',
        'water'
      ],
      instructions: [
        'Mix ingredients in stand mixer',
        'Knead with dough hook for 10 minutes',
        'Let rise for 2 hours',
        'Shape and bake'
      ],
      prepTime: 180,
      nutritionInfo: {
        calories: 120,
        protein: 4,
        carbs: 23,
        fat: 0.5
      },
      sustainabilityScore: 75,
      requiredEquipment: ['Stand Mixer', 'Baking Sheet'],
      createdBy: 1,
      createdAt: new Date().toISOString(),
      imageUrl: 'https://source.unsplash.com/featured/?bread'
    });
  }

  return { possibleRecipes };
}

// ...existing code...