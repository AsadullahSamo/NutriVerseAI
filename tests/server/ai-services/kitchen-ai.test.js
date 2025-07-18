import { getRecipesByEquipment } from '../../../server/ai-services/kitchen-ai';
import { model, safeJsonParse } from '../../../server/ai-services/gemini-client';

// Mock the Gemini client
jest.mock('../../../server/ai-services/gemini-client', () => {
  return {
    model: {
      generateContent: jest.fn()
    },
    safeJsonParse: jest.fn()
  };
});

describe('Kitchen AI Service', () => {
  // Sample test data
  const mockEquipment = [
    { id: 1, name: "Food Processor", type: "appliance" },
    { id: 2, name: "Cast Iron Skillet", type: "cookware" },
    { id: 3, name: "Chef's Knife", type: "utensil" }
  ];
  
  const mockUserPreferences = ["vegetarian", "low-carb"];
  
  const mockRecipes = {
    possibleRecipes: [
      {
        id: 3,
        title: "Homemade Hummus",
        description: "Creamy, authentic hummus made from scratch with your food processor.",
        ingredients: ["chickpeas", "tahini", "lemon juice", "garlic"],
        instructions: ["Drain and rinse chickpeas", "Process until smooth"],
        prepTime: 15,
        nutritionInfo: {
          calories: 250,
          protein: 8,
          carbs: 25,
          fat: 15,
          sustainabilityScore: 85
        },
        requiredEquipment: ["Food Processor"]
      }
    ],
    recommendedPurchases: [
      {
        equipment: "Blender",
        enabledRecipes: ["Smoothie Bowl", "Pureed Soup"],
        reason: "Versatile for many healthy recipes",
        priority: "medium",
        estimatedPrice: "$50-100"
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock behavior
    model.generateContent.mockResolvedValue({
      response: {
        text: jest.fn().mockResolvedValue(JSON.stringify(mockRecipes))
      }
    });
    safeJsonParse.mockResolvedValue(mockRecipes);
  });

  describe('getRecipesByEquipment', () => {
    test('should return recipes based on available equipment', async () => {
      const result = await getRecipesByEquipment(mockEquipment, mockUserPreferences);
      
      expect(model.generateContent).toHaveBeenCalledWith(expect.stringContaining(JSON.stringify(mockEquipment)));
      expect(model.generateContent).toHaveBeenCalledWith(expect.stringContaining(mockUserPreferences.join(", ")));
      expect(result).toEqual(mockRecipes);
    });
    
    test('should handle request without user preferences', async () => {
      await getRecipesByEquipment(mockEquipment);
      
      expect(model.generateContent).toHaveBeenCalledWith(expect.stringContaining(JSON.stringify(mockEquipment)));
      expect(model.generateContent).toHaveBeenCalledWith(expect.not.stringContaining("User Preferences"));
    });
    
    test('should fall back to mock data when AI service fails', async () => {
      // Simulate API error
      model.generateContent.mockRejectedValueOnce(new Error('API Error'));
      
      const result = await getRecipesByEquipment(mockEquipment, mockUserPreferences);
      
      // Verify we fall back to the mock data
      expect(result).toHaveProperty('possibleRecipes');
      // The mock data should include recipes that match the equipment
      expect(result.possibleRecipes.some(recipe => 
        recipe.requiredEquipment.includes('Food Processor')
      )).toBe(true);
    });
    
    test('should generate mock recipes based on available equipment', async () => {
      // Simulate API error to trigger mock data
      model.generateContent.mockRejectedValueOnce(new Error('API Error'));
      
      // Test with just a mixer
      const mixerEquipment = [{ id: 4, name: "Stand Mixer", type: "appliance" }];
      const result = await getRecipesByEquipment(mixerEquipment);
      
      // Should include mixer recipes but not processor recipes
      const hasMixerRecipe = result.possibleRecipes.some(recipe => 
        recipe.title.includes("Artisan Bread")
      );
      const hasProcessorRecipe = result.possibleRecipes.some(recipe => 
        recipe.title.includes("Homemade Hummus")
      );
      
      expect(hasMixerRecipe).toBe(true);
      expect(hasProcessorRecipe).toBe(false);
    });
    
    test('should combine equipment to suggest recipes requiring multiple tools', async () => {
      // Simulate API error to trigger mock data
      model.generateContent.mockRejectedValueOnce(new Error('API Error'));
      
      const skilletAndKnife = [
        { id: 2, name: "Cast Iron Skillet", type: "cookware" },
        { id: 3, name: "Chef's Knife", type: "utensil" }
      ];
      
      const result = await getRecipesByEquipment(skilletAndKnife);
      
      // Should include stir fry recipe which requires both skillet and knife
      const hasStirFryRecipe = result.possibleRecipes.some(recipe => 
        recipe.title.includes("Stir-Fried Vegetables")
      );
      
      expect(hasStirFryRecipe).toBe(true);
    });
  });
});
