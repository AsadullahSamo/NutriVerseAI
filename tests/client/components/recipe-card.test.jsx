import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecipeCard } from '../../../client/src/components/recipe-card';
import * as QueryHooks from '@tanstack/react-query';
import * as AuthHook from '../../../client/src/hooks/use-auth';
import * as ToastHook from '../../../client/src/hooks/use-toast';

// Mock the dependencies
jest.mock('@tanstack/react-query', () => {
  const originalModule = jest.requireActual('@tanstack/react-query');
  return {
    ...originalModule,
    useMutation: jest.fn(),
    useQuery: jest.fn(),
    useQueryClient: jest.fn(),
  };
});

jest.mock('../../../client/src/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../client/src/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

jest.mock('../../../client/src/components/nutrition-display', () => ({
  NutritionDisplay: jest.fn(() => <div data-testid="nutrition-display">Nutrition Display</div>),
}));

jest.mock('../../../client/src/components/mood-tracker', () => ({
  MoodTracker: jest.fn(() => <div data-testid="mood-tracker">Mood Tracker</div>),
}));

jest.mock('../../../client/src/components/recipe-actions', () => ({
  RecipeActions: jest.fn(() => <div data-testid="recipe-actions">Recipe Actions</div>),
}));

describe('RecipeCard Component', () => {
  // Sample recipe data for testing
  const mockRecipe = {
    id: 123,
    title: 'Test Recipe',
    description: 'A test recipe description',
    prepTime: 30,
    ingredients: ['Ingredient 1', 'Ingredient 2'],
    instructions: ['Step 1', 'Step 2'],
    nutritionInfo: {
      calories: 300,
      protein: 20,
      carbs: 40,
      fat: 10
    },
    sustainabilityScore: 75,
    imageUrl: 'https://example.com/image.jpg',
  };

  // Mock hooks setup
  const mockQueryClient = { invalidateQueries: jest.fn() };
  const mockToast = { toast: jest.fn() };
  const mockUser = { id: 1, username: 'testuser' };
  const mockConsumeMutation = { mutate: jest.fn(), isPending: false };
  const mockDeleteMutation = { mutate: jest.fn() };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup useQuery mocks
    QueryHooks.useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === '/api/nutrition-goals/current') {
        return { data: { dailyCalories: 2000, dailyProtein: 100, dailyCarbs: 200, dailyFat: 50 } };
      }
      if (queryKey[0] === 'nutrition-progress') {
        return { data: { calories: 1500, protein: 80, carbs: 150, fat: 40 } };
      }
      return { data: null };
    });
    
    // Setup other mocks
    QueryHooks.useMutation.mockImplementation(({ mutationFn }) => {
      if (String(mutationFn).includes('consume')) {
        return mockConsumeMutation;
      }
      if (String(mutationFn).includes('DELETE')) {
        return mockDeleteMutation;
      }
      return { mutate: jest.fn() };
    });
    
    QueryHooks.useQueryClient.mockReturnValue(mockQueryClient);
    AuthHook.useAuth.mockReturnValue({ user: mockUser });
    ToastHook.useToast.mockReturnValue(mockToast);
    
    // Mock localStorage
    const mockLocalStorage = {
      getItem: jest.fn().mockImplementation((key) => {
        if (key === `recipe-image-${mockRecipe.id}`) {
          return 'https://example.com/local-image.jpg';
        }
        return null;
      }),
      setItem: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
  });

  test('renders recipe title and description', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    expect(screen.getByText(mockRecipe.title)).toBeInTheDocument();
    expect(screen.getByText(mockRecipe.description)).toBeInTheDocument();
  });

  test('displays recipe image from local storage if available', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    const image = screen.getByAltText(mockRecipe.title);
    expect(image).toBeInTheDocument();
    expect(image.src).toContain('local-image.jpg');
  });

  test('shows sustainability score with correct styling', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    const sustainabilityElement = screen.getByText('75/100');
    expect(sustainabilityElement).toBeInTheDocument();
    // Green color for high sustainability
    expect(sustainabilityElement.parentElement).toHaveClass('bg-green-500/10');
  });

  test('displays recipe prep time', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    expect(screen.getByText(`${mockRecipe.prepTime} min`)).toBeInTheDocument();
  });

  test('shows ingredient count', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    expect(screen.getByText(`${mockRecipe.ingredients.length} items`)).toBeInTheDocument();
  });

  test('shows steps count', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    expect(screen.getByText(`${mockRecipe.instructions.length} steps`)).toBeInTheDocument();
  });

  test('includes NutritionDisplay component', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    expect(screen.getByTestId('nutrition-display')).toBeInTheDocument();
  });

  test('includes MoodTracker component when not in compact mode', () => {
    render(<RecipeCard recipe={mockRecipe} compact={false} />);
    expect(screen.getByTestId('mood-tracker')).toBeInTheDocument();
  });

  test('does not show MoodTracker in compact mode', () => {
    render(<RecipeCard recipe={mockRecipe} compact={true} />);
    expect(screen.queryByTestId('mood-tracker')).not.toBeInTheDocument();
  });

  test('shows RecipeActions when not in compact mode and not hiding edit/delete', () => {
    render(<RecipeCard recipe={mockRecipe} compact={false} hideEditDelete={false} />);
    expect(screen.getByTestId('recipe-actions')).toBeInTheDocument();
  });

  test('hides RecipeActions when hideEditDelete is true', () => {
    render(<RecipeCard recipe={mockRecipe} hideEditDelete={true} />);
    expect(screen.queryByTestId('recipe-actions')).not.toBeInTheDocument();
  });

  test('opens consume dialog when "Consume" button is clicked', async () => {
    const user = userEvent.setup();
    render(<RecipeCard recipe={mockRecipe} />);
    
    const consumeBtn = screen.getByText('Consume');
    await user.click(consumeBtn);
    
    expect(screen.getByText('Log Meal')).toBeInTheDocument();
  });

  test('allows changing meal type in consume dialog', async () => {
    const user = userEvent.setup();
    render(<RecipeCard recipe={mockRecipe} />);
    
    // Open consume dialog
    const consumeBtn = screen.getByText('Consume');
    await user.click(consumeBtn);
    
    // Change meal type
    const mealTypeBtn = screen.getByText('snack'); // Default value
    await user.click(mealTypeBtn);
    
    const lunchOption = screen.getByText('lunch');
    await user.click(lunchOption);
    
    expect(screen.getByText('lunch')).toBeInTheDocument();
  });

  test('allows changing servings in consume dialog', async () => {
    const user = userEvent.setup();
    render(<RecipeCard recipe={mockRecipe} />);
    
    // Open consume dialog
    const consumeBtn = screen.getByText('Consume');
    await user.click(consumeBtn);
    
    // Change servings
    const servingsInput = screen.getByRole('spinbutton');
    await user.clear(servingsInput);
    await user.type(servingsInput, '3');
    
    expect(servingsInput).toHaveValue(3);
  });

  test('submits consumption when "Log Meal" button is clicked', async () => {
    const user = userEvent.setup();
    render(<RecipeCard recipe={mockRecipe} />);
    
    // Open consume dialog
    const consumeBtn = screen.getByText('Consume');
    await user.click(consumeBtn);
    
    // Submit form
    const submitBtn = screen.getByText('Log Meal');
    await user.click(submitBtn);
    
    expect(mockConsumeMutation.mutate).toHaveBeenCalled();
  });

  test('shows nutrition warning when exceeding daily limits', async () => {
    // Override progress data to be near the limit
    QueryHooks.useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === '/api/nutrition-goals/current') {
        return { data: { dailyCalories: 2000, dailyProtein: 100, dailyCarbs: 200, dailyFat: 50 } };
      }
      if (queryKey[0] === 'nutrition-progress') {
        return { data: { calories: 1900, protein: 90, carbs: 190, fat: 45 } };
      }
      return { data: null };
    });

    const user = userEvent.setup();
    render(<RecipeCard recipe={mockRecipe} />);
    
    // Open consume dialog
    const consumeBtn = screen.getByText('Consume');
    await user.click(consumeBtn);
    
    // Change servings to exceed limits
    const servingsInput = screen.getByRole('spinbutton');
    await user.clear(servingsInput);
    await user.type(servingsInput, '3');
    
    // Submit form
    const submitBtn = screen.getByText('Log Meal');
    await user.click(submitBtn);
    
    // Warning should appear
    expect(screen.getByText('Exceeds Daily Goals')).toBeInTheDocument();
  });

  test('can delete a recipe', async () => {
    const user = userEvent.setup();
    // Mock the RecipeActions component to simulate the delete function being called
    const { RecipeActions } = jest.requireMock('../../../client/src/components/recipe-actions');
    RecipeActions.mockImplementation(({ recipe }) => (
      <button 
        data-testid="delete-button" 
        onClick={() => mockDeleteMutation.mutate()}
      >
        Delete Recipe
      </button>
    ));
    
    render(<RecipeCard recipe={mockRecipe} showDelete={true} />);
    
    const deleteBtn = screen.getByTestId('delete-button');
    await user.click(deleteBtn);
    
    expect(mockDeleteMutation.mutate).toHaveBeenCalled();
  });
});
