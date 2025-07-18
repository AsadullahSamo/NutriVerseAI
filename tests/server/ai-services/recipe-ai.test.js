import * as recipeAI from '../../../server/ai-services/recipe-ai';
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

describe('Recipe AI Service', () => {
  // Sample test data
  const mockRecipe = {
    title: 'Pasta Primavera',
    ingredients: ['pasta', 'vegetables', 'olive oil'],
    instructions: ['Cook pasta', 'Sauté vegetables', 'Combine and serve'],
    nutritionalValue: 'Calories: 400, Protein: 12g, Carbs: 65g, Fat: 10g'
  };
  
  const mockResponse = {
    response: {
      text: jest.fn(() => JSON.stringify([mockRecipe, mockRecipe, mockRecipe]))
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock behavior
    model.generateContent.mockResolvedValue(mockResponse);
    safeJsonParse.mockImplementation((str) => JSON.parse(str));
  });

  describe('getRecipeRecommendations', () => {
    test('should return recipe recommendations based on ingredients', async () => {
      const ingredients = ['pasta', 'tomatoes', 'basil'];
      const dietaryPreferences = ['vegetarian'];
      
      const result = await recipeAI.getRecipeRecommendations(ingredients, dietaryPreferences);
      
      expect(model.generateContent).toHaveBeenCalledWith(expect.stringContaining(ingredients.join(', ')));
      expect(model.generateContent).toHaveBeenCalledWith(expect.stringContaining(dietaryPreferences.join(', ')));
      expect(result).toEqual([mockRecipe, mockRecipe, mockRecipe]);
    });
    
    test('should handle request without dietary preferences', async () => {
      const ingredients = ['chicken', 'rice', 'broccoli'];
      
      await recipeAI.getRecipeRecommendations(ingredients);
      
      expect(model.generateContent).toHaveBeenCalledWith(expect.stringContaining(ingredients.join(', ')));
      expect(model.generateContent).toHaveBeenCalledWith(expect.not.stringContaining('dietary preferences'));
    });
    
    test('should handle API errors', async () => {
      const error = new Error('API Error');
      model.generateContent.mockRejectedValueOnce(error);
      
      await expect(recipeAI.getRecipeRecommendations(['apple'])).rejects.toThrow('API Error');
    });
  });

  describe('analyzeNutritionalValue', () => {
    test('should analyze nutritional value of ingredients', async () => {
      const ingredients = ['chicken breast', 'rice', 'olive oil'];
      const portions = 2;
      const expectedNutritionalData = {
        calories: 500,
        protein: 30,
        carbs: 45,
        fat: 15,
        recommendations: ['Increase fiber intake']
      };

      mockResponse.response.text.mockResolvedValueOnce(JSON.stringify(expectedNutritionalData));
      
      const result = await recipeAI.analyzeNutritionalValue(ingredients, portions);
      
      expect(model.generateContent).toHaveBeenCalledWith(expect.stringContaining(`${portions} portion(s)`));
      expect(model.generateContent).toHaveBeenCalledWith(expect.stringContaining(ingredients.join(', ')));
      expect(safeJsonParse).toHaveBeenCalled();
    });
  });

  describe('getMealPlanSuggestions', () => {
    test('should return meal plan suggestions based on preferences', async () => {
      const preferences = ['low-carb', 'high-protein'];
      const days = 5;
      const expectedResult = 'Here is your 5-day meal plan...';
      
      mockResponse.response.text.mockReturnValueOnce(expectedResult);
      
      const result = await recipeAI.getMealPlanSuggestions(preferences, days);
      
      expect(model.generateContent).toHaveBeenCalledWith(expect.stringContaining(`${days}-day meal plan`));
      expect(model.generateContent).toHaveBeenCalledWith(expect.stringContaining(preferences.join(', ')));
      expect(result).toBe(expectedResult);
    });
  });

  describe('generateAIMealPlan', () => {
    test('should generate detailed meal plan with specified parameters', async () => {
      const preferences = ['Mediterranean'];
      const days = 3;
      const dietaryRestrictions = ['gluten-free'];
      const calorieTarget = 2000;
      
      const mockMealPlanData = {
        days: [{
          day: 1,
          meals: {
            breakfast: { title: 'Greek Yogurt Bowl' },
            lunch: { title: 'Mediterranean Salad' },
            dinner: { title: 'Grilled Fish' }
          }
        }]
      };

      mockResponse.response.text.mockResolvedValueOnce(JSON.stringify(mockMealPlanData));
      safeJsonParse.mockResolvedValueOnce(mockMealPlanData);
      
      const result = await recipeAI.generateAIMealPlan(preferences, days, dietaryRestrictions, calorieTarget);
      
      expect(model.generateContent).toHaveBeenCalledWith(expect.stringContaining(`${days}-day meal plan`));
      expect(model.generateContent).toHaveBeenCalledWith(expect.stringContaining(`${calorieTarget} calories`));
      expect(result).toEqual(mockMealPlanData);
    });
  });

  describe('analyzeMoodSentiment', () => {
    test('should analyze mood from a cooking experience entry', async () => {
      const entry = 'I felt really accomplished after making this soufflé!';
      const mockSentimentData = {
        sentiment: 'positive',
        emotions: ['pride', 'accomplishment', 'joy']
      };
      
      mockResponse.response.text.mockResolvedValueOnce(JSON.stringify(mockSentimentData));
      safeJsonParse.mockResolvedValueOnce(mockSentimentData);
      
      const result = await recipeAI.analyzeMoodSentiment(entry);
      
      expect(model.generateContent).toHaveBeenCalledWith(expect.stringContaining(entry));
      expect(result).toEqual(mockSentimentData);
    });
  });

  describe('generateMoodInsights', () => {
    test('should generate insights from multiple cooking experience entries', async () => {
      const entries = [
        { timestamp: '2023-01-01', entry: 'Made pasta for the first time' },
        { timestamp: '2023-01-02', entry: 'Tried a new recipe and it worked!' }
      ];
      
      const mockInsightsData = {
        summary: 'You are showing progress in your cooking journey',
        patterns: [{ category: 'Skills', title: 'Cooking Skill Development', insights: [] }],
        recommendations: { title: 'Recommendations', items: [] }
      };
      
      mockResponse.response.text.mockResolvedValueOnce(JSON.stringify(mockInsightsData));
      safeJsonParse.mockResolvedValueOnce(mockInsightsData);
      
      const result = await recipeAI.generateMoodInsights(entries);
      
      expect(model.generateContent).toHaveBeenCalledWith(expect.stringContaining('Made pasta for the first time'));
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('patterns');
      expect(result).toHaveProperty('recommendations');
    });
  });

  describe('getNutritionRecommendations', () => {
    test('should provide nutrition recommendations based on goals and progress', async () => {
      const currentGoals = { calories: 2000, protein: 120 };
      const progress = { avgCalories: 1800, avgProtein: 100 };
      const preferences = ['low-sugar', 'high-protein'];
      
      const mockRecommendationsData = {
        analysis: 'You are making good progress',
        suggestedGoals: { calories: 2100, protein: 130, carbs: 200, fat: 70 },
        reasoning: 'Based on your activity level',
        mealSuggestions: [{ type: 'breakfast', suggestions: ['Greek yogurt with berries'] }],
        improvements: ['Increase protein intake at breakfast']
      };
      
      mockResponse.response.text.mockResolvedValueOnce(JSON.stringify(mockRecommendationsData));
      safeJsonParse.mockResolvedValueOnce(mockRecommendationsData);
      
      const result = await recipeAI.getNutritionRecommendations(currentGoals, progress, preferences);
      
      expect(model.generateContent).toHaveBeenCalledWith(expect.stringContaining(JSON.stringify(currentGoals)));
      expect(result).toEqual(mockRecommendationsData);
    });
  });

  describe('generateRecipe', () => {
    test('should generate a recipe based on ingredients and preferences', async () => {
      const ingredients = ['chicken', 'spinach', 'garlic'];
      const preferences = ['healthy', 'quick'];
      const dietaryRestrictions = ['low-carb'];
      
      const mockGeneratedRecipe = {
        title: 'Garlic Chicken with Spinach',
        servings: 2,
        prepTime: '10 minutes',
        cookTime: '20 minutes',
        ingredients: [
          { item: 'chicken breast', amount: '2', notes: 'sliced' }
        ],
        instructions: ['Heat pan', 'Cook chicken']
      };
      
      mockResponse.response.text.mockResolvedValueOnce(JSON.stringify(mockGeneratedRecipe));
      safeJsonParse.mockResolvedValueOnce(mockGeneratedRecipe);
      
      const result = await recipeAI.generateRecipe(ingredients, preferences, dietaryRestrictions);
      
      expect(model.generateContent).toHaveBeenCalledWith(expect.stringContaining(JSON.stringify(ingredients)));
      expect(result).toEqual(mockGeneratedRecipe);
    });
  });

  describe('modifyRecipe', () => {
    test('should modify a recipe according to provided modifications', async () => {
      const recipe = {
        title: 'Spaghetti Carbonara',
        ingredients: ['pasta', 'eggs', 'pancetta']
      };
      
      const modifications = {
        substitute: { 'pancetta': 'bacon' },
        addIngredients: ['cream']
      };
      
      const modifiedRecipe = {
        title: 'Creamy Spaghetti Carbonara',
        ingredients: ['pasta', 'eggs', 'bacon', 'cream']
      };
      
      mockResponse.response.text.mockResolvedValueOnce(JSON.stringify(modifiedRecipe));
      safeJsonParse.mockResolvedValueOnce(modifiedRecipe);
      
      const result = await recipeAI.modifyRecipe(recipe, modifications);
      
      expect(model.generateContent).toHaveBeenCalledWith(expect.stringContaining(JSON.stringify(recipe)));
      expect(model.generateContent).toHaveBeenCalledWith(expect.stringContaining(JSON.stringify(modifications)));
      expect(result).toEqual(modifiedRecipe);
    });
  });

  describe('getPersonalizedRecipeRecommendations', () => {
    test('should return personalized recommendations based on user data', async () => {
      const userRecipes = [
        { title: 'Spaghetti Bolognese', ingredients: ['pasta', 'beef', 'tomatoes'] }
      ];
      const nutritionGoals = { calories: 2000, protein: 100 };
      const dietaryPreferences = ['gluten-free'];
      
      const recommendationsData = [
        {
          title: 'Zucchini Pasta with Turkey Bolognese',
          matchScore: 85
        }
      ];
      
      mockResponse.response.text.mockResolvedValueOnce(JSON.stringify(recommendationsData));
      safeJsonParse.mockResolvedValueOnce(recommendationsData);
      
      const result = await recipeAI.getPersonalizedRecipeRecommendations(
        userRecipes, 
        nutritionGoals, 
        dietaryPreferences
      );
      
      expect(model.generateContent).toHaveBeenCalledWith(expect.stringContaining(JSON.stringify(userRecipes)));
      expect(model.generateContent).toHaveBeenCalledWith(expect.stringContaining(JSON.stringify(nutritionGoals)));
      expect(model.generateContent).toHaveBeenCalledWith(expect.stringContaining(dietaryPreferences.join(', ')));
      expect(result).toEqual(recommendationsData);
    });
  });
});
