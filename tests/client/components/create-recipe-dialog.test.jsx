import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateRecipeDialog } from '../../../client/src/components/create-recipe-dialog';
import * as QueryHooks from '@tanstack/react-query';
import * as AuthHook from '../../../client/src/hooks/use-auth';
import * as ToastHook from '../../../client/src/hooks/use-toast';
import * as RecipeAI from '../../../client/src/ai-services/recipe-ai';

// Mock the dependencies
jest.mock('@tanstack/react-query', () => {
  const originalModule = jest.requireActual('@tanstack/react-query');
  return {
    ...originalModule,
    useMutation: jest.fn(),
    useQuery: jest.fn(),
  };
});

jest.mock('../../../client/src/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../client/src/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

jest.mock('../../../client/src/lib/queryClient', () => ({
  queryClient: { invalidateQueries: jest.fn() },
  apiRequest: jest.fn(),
}));

jest.mock('../../../client/src/ai-services/recipe-ai', () => ({
  generateRecipeDetails: jest.fn(),
}));

// Mock the zod resolver and schema
jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: jest.fn(() => (data) => ({ values: data })),
}));

describe('CreateRecipeDialog Component', () => {
  // Mock data
  const mockUser = { id: 1, username: 'testuser' };
  const mockToast = { toast: jest.fn() };
  const mockNutritionGoals = {
    dailyCalories: 2000,
    dailyProtein: 100,
    dailyCarbs: 200,
    dailyFat: 50,
  };
  
  const mockCreateMutation = {
    mutate: jest.fn(),
    isPending: false
  };

  const mockGeneratedRecipeDetails = {
    description: "A traditional Italian pasta dish with fresh tomatoes and basil",
    ingredients: [
      { amount: "200g", item: "spaghetti", notes: "dried" },
      { amount: "3 tbsp", item: "olive oil", notes: "extra virgin" },
      { amount: "2 cloves", item: "garlic", notes: "minced" }
    ],
    instructions: [
      "Boil water and cook pasta according to package directions",
      "Heat olive oil in a pan and sauté garlic until fragrant",
      "Add tomatoes and cook for 5 minutes"
    ],
    nutritionInfo: {
      calories: 450,
      protein: 12,
      carbs: 65,
      fat: 15
    },
    prepTime: 20
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup useQuery mocks
    QueryHooks.useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === '/api/nutrition-goals/current') {
        return { data: mockNutritionGoals, isLoading: false };
      }
      return { data: null, isLoading: false };
    });
    
    // Setup useMutation mock
    QueryHooks.useMutation.mockReturnValue(mockCreateMutation);
    
    // Setup other mocks
    AuthHook.useAuth.mockReturnValue({ user: mockUser });
    ToastHook.useToast.mockReturnValue(mockToast);
    
    // Setup AI mock
    RecipeAI.generateRecipeDetails.mockResolvedValue(mockGeneratedRecipeDetails);
    
    // Mock global browser APIs used in the component
    Object.defineProperty(window, 'HTMLDialogElement', {
      writable: true,
      value: class {},
    });
  });

  test('renders dialog when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<CreateRecipeDialog />);
    
    // Click the trigger button to open the dialog
    await user.click(screen.getByText('Add Recipe'));
    
    // Dialog should be open with title visible
    expect(screen.getByText('Create New Recipe')).toBeInTheDocument();
  });

  test('renders form with all required fields', async () => {
    const user = userEvent.setup();
    render(<CreateRecipeDialog />);
    
    // Click to open dialog
    await user.click(screen.getByText('Add Recipe'));
    
    // Check that all form fields are present
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Ingredients (one per line)')).toBeInTheDocument();
    expect(screen.getByLabelText('Instructions (one per line)')).toBeInTheDocument();
    expect(screen.getByLabelText('Preparation Time (minutes)')).toBeInTheDocument();
    expect(screen.getByLabelText('Image URL')).toBeInTheDocument();
    expect(screen.getByLabelText('Calories')).toBeInTheDocument();
    expect(screen.getByLabelText('Protein (g)')).toBeInTheDocument();
    expect(screen.getByLabelText('Carbs (g)')).toBeInTheDocument();
    expect(screen.getByLabelText('Fat (g)')).toBeInTheDocument();
    
    // Check that Generate button is present
    expect(screen.getByText('Generate')).toBeInTheDocument();
  });

  test('generates recipe details with AI when "Generate" button is clicked', async () => {
    const user = userEvent.setup();
    render(<CreateRecipeDialog />);
    
    // Open dialog
    await user.click(screen.getByText('Add Recipe'));
    
    // Fill in recipe title
    await user.type(screen.getByLabelText('Title'), 'Spaghetti Marinara');
    
    // Click Generate button
    await user.click(screen.getByText('Generate'));
    
    // Check that generateRecipeDetails was called with correct title
    expect(RecipeAI.generateRecipeDetails).toHaveBeenCalledWith('Spaghetti Marinara');
    
    // Wait for generated details to appear
    await waitFor(() => {
      // Description should be filled in
      expect(screen.getByLabelText('Description')).toHaveValue(
        'A traditional Italian pasta dish with fresh tomatoes and basil'
      );
    });
    
    // Check that ingredients were filled in correctly
    const ingredientsTextarea = screen.getByLabelText('Ingredients (one per line)');
    expect(ingredientsTextarea).toHaveValue(
      '200g spaghetti (dried)\n3 tbsp olive oil (extra virgin)\n2 cloves garlic (minced)'
    );
    
    // Check that instructions were filled in correctly
    const instructionsTextarea = screen.getByLabelText('Instructions (one per line)');
    expect(instructionsTextarea).toHaveValue(
      'Boil water and cook pasta according to package directions\nHeat olive oil in a pan and sauté garlic until fragrant\nAdd tomatoes and cook for 5 minutes'
    );
    
    // Check that nutrition info was filled in correctly
    expect(screen.getByLabelText('Calories')).toHaveValue(450);
    expect(screen.getByLabelText('Protein (g)')).toHaveValue(12);
    expect(screen.getByLabelText('Carbs (g)')).toHaveValue(65);
    expect(screen.getByLabelText('Fat (g)')).toHaveValue(15);
    
    // Check that prep time was filled in correctly
    expect(screen.getByLabelText('Preparation Time (minutes)')).toHaveValue(20);
    
    // Check that success toast was shown
    expect(mockToast.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Recipe Details Generated'
      })
    );
  });

  test('shows error when trying to generate details without a title', async () => {
    const user = userEvent.setup();
    render(<CreateRecipeDialog />);
    
    // Open dialog
    await user.click(screen.getByText('Add Recipe'));
    
    // Click Generate button without entering a title
    await user.click(screen.getByText('Generate'));
    
    // Check that error toast was shown
    expect(mockToast.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Recipe Title Required',
        variant: 'destructive'
      })
    );
    
    // AI generation should not have been called
    expect(RecipeAI.generateRecipeDetails).not.toHaveBeenCalled();
  });

  test('handles AI generation errors gracefully', async () => {
    // Setup AI mock to reject
    RecipeAI.generateRecipeDetails.mockRejectedValueOnce(new Error('AI service unavailable'));
    
    const user = userEvent.setup();
    render(<CreateRecipeDialog />);
    
    // Open dialog
    await user.click(screen.getByText('Add Recipe'));
    
    // Fill in recipe title
    await user.type(screen.getByLabelText('Title'), 'Chocolate Cake');
    
    // Click Generate button
    await user.click(screen.getByText('Generate'));
    
    // Wait for error toast
    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Generation Failed',
          variant: 'destructive'
        })
      );
    });
  });

  test('calculates sustainability score based on nutritional values', async () => {
    const user = userEvent.setup();
    render(<CreateRecipeDialog />);
    
    // Open dialog
    await user.click(screen.getByText('Add Recipe'));
    
    // Enter nutrition values that would result in a good sustainability score
    await user.type(screen.getByLabelText('Calories'), '350');
    await user.type(screen.getByLabelText('Protein (g)'), '30');
    await user.type(screen.getByLabelText('Carbs (g)'), '45');
    await user.type(screen.getByLabelText('Fat (g)'), '15');
    
    // Sustainability score should be visible and high (due to good macro balance and low calories)
    // Note: The exact score depends on the algorithm in the component
    // We're looking for the presence of the score indicator
    expect(document.querySelector('.bg-green-500\\/10')).toBeInTheDocument();
  });

  test('submits form with all entered data', async () => {
    const user = userEvent.setup();
    render(<CreateRecipeDialog />);
    
    // Open dialog
    await user.click(screen.getByText('Add Recipe'));
    
    // Fill out the form
    await user.type(screen.getByLabelText('Title'), 'Test Recipe');
    await user.type(screen.getByLabelText('Description'), 'A test recipe description');
    await user.type(screen.getByLabelText('Ingredients (one per line)'), 'Ingredient 1\nIngredient 2');
    await user.type(screen.getByLabelText('Instructions (one per line)'), 'Step 1\nStep 2');
    await user.type(screen.getByLabelText('Preparation Time (minutes)'), '15');
    await user.type(screen.getByLabelText('Image URL'), 'https://example.com/image.jpg');
    await user.type(screen.getByLabelText('Calories'), '400');
    await user.type(screen.getByLabelText('Protein (g)'), '20');
    await user.type(screen.getByLabelText('Carbs (g)'), '50');
    await user.type(screen.getByLabelText('Fat (g)'), '10');
    
    // Submit the form
    await user.click(screen.getByText('Create Recipe'));
    
    // Check that mutation was called with correct data
    expect(mockCreateMutation.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Recipe',
        description: 'A test recipe description',
        ingredients: ['Ingredient 1', 'Ingredient 2'],
        instructions: ['Step 1', 'Step 2'],
        prepTime: 15,
        imageUrl: 'https://example.com/image.jpg',
        nutritionInfo: {
          calories: 400,
          protein: 20,
          carbs: 50,
          fat: 10
        }
      })
    );
  });

  test('warns when recipe nutritional values exceed daily goals', async () => {
    const user = userEvent.setup();
    render(<CreateRecipeDialog />);
    
    // Open dialog
    await user.click(screen.getByText('Add Recipe'));
    
    // Fill in nutrition values that exceed goals
    await user.type(screen.getByLabelText('Calories'), '2500'); // Exceeds 2000
    await user.type(screen.getByLabelText('Protein (g)'), '120'); // Exceeds 100
    await user.type(screen.getByLabelText('Carbs (g)'), '250'); // Exceeds 200
    await user.type(screen.getByLabelText('Fat (g)'), '60'); // Exceeds 50
    
    // Warning about exceeding nutritional values should appear
    expect(screen.getByText('High nutritional values:')).toBeInTheDocument();
    
    // Badge showing calories percent of daily goal should appear
    expect(screen.getByText('Calories 125% of daily goal')).toBeInTheDocument();
  });
});
