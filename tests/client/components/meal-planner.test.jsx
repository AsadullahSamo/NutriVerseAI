import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MealPlanner } from '../../../client/src/components/meal-planner';
import * as QueryHooks from '@tanstack/react-query';
import * as ToastHook from '../../../client/src/hooks/use-toast';
import { format } from 'date-fns';

// Mock the dependencies
jest.mock('@tanstack/react-query', () => {
  const originalModule = jest.requireActual('@tanstack/react-query');
  return {
    ...originalModule,
    useMutation: jest.fn(),
    useQuery: jest.fn(),
  };
});

jest.mock('../../../client/src/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

jest.mock('../../../client/src/lib/queryClient', () => ({
  queryClient: { invalidateQueries: jest.fn() },
  apiRequest: jest.fn(),
}));

jest.mock('date-fns', () => {
  const originalModule = jest.requireActual('date-fns');
  return {
    ...originalModule,
    format: jest.fn(),
  };
});

jest.mock('../../../client/src/components/create-meal-plan-dialog', () => ({
  CreateMealPlanDialog: jest.fn(({ open }) => open ? <div data-testid="create-meal-plan-dialog">Create Meal Plan Dialog</div> : null),
}));

describe('MealPlanner Component', () => {
  // Mock data
  const today = new Date();
  const mockMealPlans = [
    {
      id: 1,
      title: 'Weekly Plan',
      startDate: today.toISOString().split('T')[0],
      endDate: new Date(today.setDate(today.getDate() + 6)).toISOString().split('T')[0],
      meals: [
        {
          day: 1,
          totalCalories: 2100,
          nutritionSummary: 'Balanced macros with emphasis on protein',
          meals: {
            breakfast: {
              title: 'Greek Yogurt Bowl',
              description: 'Greek yogurt with berries and honey',
              nutritionalInfo: '350 kcal, 20g protein, 40g carbs, 10g fat',
              preparationTime: '5 minutes'
            },
            lunch: {
              title: 'Mediterranean Salad',
              description: 'Fresh salad with feta cheese and olives',
              nutritionalInfo: '450 kcal, 15g protein, 30g carbs, 30g fat',
              preparationTime: '15 minutes'
            },
            dinner: {
              title: 'Grilled Salmon',
              description: 'Salmon with steamed vegetables and quinoa',
              nutritionalInfo: '650 kcal, 40g protein, 50g carbs, 25g fat',
              preparationTime: '25 minutes'
            },
            snacks: [
              {
                title: 'Apple with Almond Butter',
                description: 'Fresh apple slices with natural almond butter',
                nutritionalInfo: '250 kcal, 8g protein, 25g carbs, 15g fat',
                preparationTime: '3 minutes'
              },
              {
                title: 'Protein Shake',
                description: 'Whey protein with banana and milk',
                nutritionalInfo: '400 kcal, 30g protein, 40g carbs, 5g fat',
                preparationTime: '2 minutes'
              }
            ]
          }
        }
      ]
    }
  ];
  
  const mockNutritionGoals = {
    dailyCalories: 2000,
    dailyProtein: 100,
    dailyCarbs: 200,
    dailyFat: 50,
  };
  
  const mockToast = { toast: jest.fn() };
  const mockDeleteMutation = { mutate: jest.fn() };
  const mockCreateMutation = { mutate: jest.fn() };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset date to avoid test flakiness
    format.mockImplementation((date, formatStr) => {
      return `April 9, 2025`;
    });
    
    // Setup useQuery mocks
    QueryHooks.useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === '/api/meal-plans') {
        return { data: mockMealPlans, isLoading: false };
      }
      if (queryKey[0] === '/api/nutrition-goals/current') {
        return { data: mockNutritionGoals, isLoading: false };
      }
      return { data: null, isLoading: false };
    });
    
    // Setup useMutation mock
    QueryHooks.useMutation.mockImplementation(({ mutationFn }) => {
      if (String(mutationFn).includes('DELETE')) {
        return mockDeleteMutation;
      }
      if (String(mutationFn).includes('POST')) {
        return mockCreateMutation;
      }
      return { mutate: jest.fn() };
    });
    
    // Setup other mocks
    ToastHook.useToast.mockReturnValue(mockToast);
  });

  test('renders meal planner with calendar and meal sections', () => {
    render(<MealPlanner />);
    
    // Check that title is visible
    expect(screen.getByText('Meal Planner')).toBeInTheDocument();
    
    // Check that Create Meal Plan button is shown
    expect(screen.getByText('Create Meal Plan')).toBeInTheDocument();
    
    // Check that calendar is displayed
    expect(document.querySelector('.react-calendar')).toBeInTheDocument();
    
    // Check that meal display area shows the selected day's meals
    expect(screen.getByText('April 9, 2025')).toBeInTheDocument();
    expect(screen.getByText('Greek Yogurt Bowl')).toBeInTheDocument();
    expect(screen.getByText('Mediterranean Salad')).toBeInTheDocument();
    expect(screen.getByText('Grilled Salmon')).toBeInTheDocument();
  });

  test('renders loading skeleton when data is loading', () => {
    // Override the query mock to return loading state
    QueryHooks.useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === '/api/meal-plans') {
        return { data: null, isLoading: true };
      }
      if (queryKey[0] === '/api/nutrition-goals/current') {
        return { data: mockNutritionGoals, isLoading: false };
      }
      return { data: null, isLoading: false };
    });
    
    render(<MealPlanner />);
    
    // Check that skeletons are displayed
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test('shows empty state when no meal plan exists for selected date', () => {
    // Override the query mock to return empty meal plans
    QueryHooks.useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === '/api/meal-plans') {
        return { data: [], isLoading: false };
      }
      if (queryKey[0] === '/api/nutrition-goals/current') {
        return { data: mockNutritionGoals, isLoading: false };
      }
      return { data: null, isLoading: false };
    });
    
    render(<MealPlanner />);
    
    // Check for empty state message
    expect(screen.getByText('No meal plan for this date.')).toBeInTheDocument();
    expect(screen.getByText('Create New Plan')).toBeInTheDocument();
  });

  test('opens create meal plan dialog when button is clicked', async () => {
    const user = userEvent.setup();
    render(<MealPlanner />);
    
    // Click the create meal plan button
    await user.click(screen.getByText('Create Meal Plan'));
    
    // Check that dialog is opened
    expect(screen.getByTestId('create-meal-plan-dialog')).toBeInTheDocument();
  });

  test('shows nutrition warnings when meals exceed nutrition goals', () => {
    // Modify the meal plan to exceed nutrition goals
    const mealPlansWithExcessCalories = [{
      ...mockMealPlans[0],
      meals: [
        {
          ...mockMealPlans[0].meals[0],
          meals: {
            ...mockMealPlans[0].meals[0].meals,
            breakfast: {
              ...mockMealPlans[0].meals[0].meals.breakfast,
              nutritionalInfo: '1500 kcal, 20g protein, 40g carbs, 10g fat', // Much higher calories
            }
          }
        }
      ]
    }];
    
    QueryHooks.useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === '/api/meal-plans') {
        return { data: mealPlansWithExcessCalories, isLoading: false };
      }
      if (queryKey[0] === '/api/nutrition-goals/current') {
        return { data: mockNutritionGoals, isLoading: false };
      }
      return { data: null, isLoading: false };
    });
    
    render(<MealPlanner />);
    
    // Check that warning is shown
    expect(screen.getByText('Exceeds daily goals:')).toBeInTheDocument();
    expect(screen.getByText('Calories +')).toBeInTheDocument();
  });

  test('confirms before deleting a meal plan', async () => {
    const user = userEvent.setup();
    render(<MealPlanner />);
    
    // Click the delete button (trash icon)
    const deleteButton = document.querySelector('button[class*="text-destructive"]');
    await user.click(deleteButton);
    
    // Check that confirmation dialog is shown
    expect(screen.getByText('Delete Meal Plan')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    
    // Confirm deletion
    await user.click(screen.getByText('Delete'));
    
    // Check that mutation was called with correct id
    expect(mockDeleteMutation.mutate).toHaveBeenCalledWith(1);
  });

  test('cancels meal plan deletion', async () => {
    const user = userEvent.setup();
    render(<MealPlanner />);
    
    // Click the delete button (trash icon)
    const deleteButton = document.querySelector('button[class*="text-destructive"]');
    await user.click(deleteButton);
    
    // Click cancel
    await user.click(screen.getByText('Cancel'));
    
    // Check that mutation was not called
    expect(mockDeleteMutation.mutate).not.toHaveBeenCalled();
  });

  test('displays meal details correctly', () => {
    render(<MealPlanner />);
    
    // Check breakfast details
    expect(screen.getByText('Breakfast')).toBeInTheDocument();
    expect(screen.getByText('Greek Yogurt Bowl')).toBeInTheDocument();
    expect(screen.getByText('Greek yogurt with berries and honey')).toBeInTheDocument();
    expect(screen.getByText('350 kcal, 20g protein, 40g carbs, 10g fat')).toBeInTheDocument();
    expect(screen.getByText('5 minutes')).toBeInTheDocument();
    
    // Check snacks
    expect(screen.getByText('Snacks')).toBeInTheDocument();
    expect(screen.getByText('Apple with Almond Butter')).toBeInTheDocument();
    expect(screen.getByText('Protein Shake')).toBeInTheDocument();
    
    // Check daily summary
    expect(screen.getByText('Daily Summary')).toBeInTheDocument();
    expect(screen.getByText('2100 calories')).toBeInTheDocument();
    expect(screen.getByText('Balanced macros with emphasis on protein')).toBeInTheDocument();
  });

  test('handles nutrition parsing edge cases', () => {
    // Modify the meal plan to have invalid nutrition info
    const mealPlansWithInvalidNutrition = [{
      ...mockMealPlans[0],
      meals: [
        {
          ...mockMealPlans[0].meals[0],
          meals: {
            ...mockMealPlans[0].meals[0].meals,
            breakfast: {
              ...mockMealPlans[0].meals[0].meals.breakfast,
              nutritionalInfo: '', // Empty nutrition info
              preparationTime: '' // Empty prep time
            }
          }
        }
      ]
    }];
    
    QueryHooks.useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === '/api/meal-plans') {
        return { data: mealPlansWithInvalidNutrition, isLoading: false };
      }
      if (queryKey[0] === '/api/nutrition-goals/current') {
        return { data: mockNutritionGoals, isLoading: false };
      }
      return { data: null, isLoading: false };
    });
    
    render(<MealPlanner />);
    
    // Check that default message is shown for empty nutrition info
    expect(screen.getByText('No detailed nutritional info')).toBeInTheDocument();
    
    // Prep time should not appear
    const breakfastCard = screen.getByText('Greek Yogurt Bowl').closest('.card');
    const prepTimeInBreakfast = breakfastCard.textContent.includes('minutes');
    expect(prepTimeInBreakfast).toBe(false);
  });
});
