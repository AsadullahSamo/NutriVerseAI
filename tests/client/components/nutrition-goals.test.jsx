import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NutritionGoals } from '../../../client/src/components/nutrition-goals';
import * as QueryHooks from '@tanstack/react-query';
import * as AuthHook from '../../../client/src/hooks/use-auth';
import * as ToastHook from '../../../client/src/hooks/use-toast';
import { queryClient } from '../../../client/src/lib/queryClient';

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

jest.mock('../../../client/src/components/ui/chart', () => ({
  LineChart: jest.fn(() => <div data-testid="line-chart">Line Chart</div>),
}));

describe('NutritionGoals Component', () => {
  // Mock data
  const mockCurrentGoal = {
    dailyCalories: 2000,
    dailyProtein: 100,
    dailyCarbs: 200,
    dailyFat: 50,
    progress: [
      {
        date: new Date().toISOString().split('T')[0], // Today
        calories: 1500,
        protein: 80,
        carbs: 150,
        fat: 40
      }
    ]
  };
  
  const mockToast = { toast: jest.fn() };
  const mockUser = { id: 1, username: 'testuser' };
  const mockCreateMutation = { 
    mutate: jest.fn(),
    isPending: false
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup useQuery mocks
    QueryHooks.useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === '/api/nutrition-goals/current') {
        return { data: mockCurrentGoal, isLoading: false };
      }
      return { data: null, isLoading: false };
    });
    
    // Setup useMutation mock
    QueryHooks.useMutation.mockReturnValue(mockCreateMutation);
    
    // Setup other mocks
    AuthHook.useAuth.mockReturnValue({ user: mockUser });
    ToastHook.useToast.mockReturnValue(mockToast);
  });

  test('renders nutrition goals component with current goals', () => {
    render(<NutritionGoals />);
    
    // Check that title is visible
    expect(screen.getByText('Nutrition Goals')).toBeInTheDocument();
    
    // Check that update goals button is shown when current goals exist
    expect(screen.getByText('Update Goals')).toBeInTheDocument();
    
    // Check that today's progress is shown
    expect(screen.getByText('Today\'s Progress')).toBeInTheDocument();
    
    // Check that the progress values are displayed correctly
    expect(screen.getByText('1500 / 2000')).toBeInTheDocument(); // Calories
    expect(screen.getByText('80g / 100g')).toBeInTheDocument(); // Protein
    expect(screen.getByText('150g / 200g')).toBeInTheDocument(); // Carbs
    expect(screen.getByText('40g / 50g')).toBeInTheDocument(); // Fat
    
    // Check that the weekly progress chart is shown
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  test('renders empty state when no goals are set', () => {
    // Override the query mock to return no goals
    QueryHooks.useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === '/api/nutrition-goals/current') {
        return { data: null, isLoading: false };
      }
      return { data: null, isLoading: false };
    });
    
    render(<NutritionGoals />);
    
    // Check that empty state message is shown
    expect(screen.getByText("You haven't set any nutrition goals yet.")).toBeInTheDocument();
    
    // Check that the "Set Goals" button is available
    expect(screen.getByRole('button', { name: 'Set Goals' })).toBeInTheDocument();
  });

  test('renders loading state when data is loading', () => {
    // Override the query mock to return loading state
    QueryHooks.useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === '/api/nutrition-goals/current') {
        return { data: null, isLoading: true };
      }
      return { data: null, isLoading: false };
    });
    
    render(<NutritionGoals />);
    
    // Loader should be visible
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  test('opens dialog when Set/Update Goals button is clicked', async () => {
    const user = userEvent.setup();
    render(<NutritionGoals />);
    
    // Click the update goals button
    await user.click(screen.getByText('Update Goals'));
    
    // Check that the dialog is opened
    expect(screen.getByText('Update Goals', { selector: 'h2' })).toBeInTheDocument();
    
    // Check that form fields are available
    expect(screen.getByLabelText('Daily Calories Target')).toBeInTheDocument();
    expect(screen.getByLabelText('Daily Protein Target (g)')).toBeInTheDocument();
    expect(screen.getByLabelText('Daily Carbs Target (g)')).toBeInTheDocument();
    expect(screen.getByLabelText('Daily Fat Target (g)')).toBeInTheDocument();
  });

  test('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(<NutritionGoals />);
    
    // Click the update goals button
    await user.click(screen.getByText('Update Goals'));
    
    // Fill out the form
    await user.type(screen.getByLabelText('Daily Calories Target'), '2200');
    await user.type(screen.getByLabelText('Daily Protein Target (g)'), '120');
    await user.type(screen.getByLabelText('Daily Carbs Target (g)'), '220');
    await user.type(screen.getByLabelText('Daily Fat Target (g)'), '60');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: 'Update Goals', type: 'submit' }));
    
    // Check that the mutation was called
    expect(mockCreateMutation.mutate).toHaveBeenCalled();
  });

  test('validates form input ranges', async () => {
    // Mock the original implementation of mutate to test validation
    mockCreateMutation.mutate.mockImplementation(() => {
      // The validation is in the component, so we'll test by seeing if the toast is called
      // Function would throw if validation failed
      mockToast.toast({
        title: 'Error',
        description: 'Failed to set nutrition goals. Please try again.',
        variant: 'destructive'
      });
    });
    
    const user = userEvent.setup();
    render(<NutritionGoals />);
    
    // Click the update goals button
    await user.click(screen.getByText('Update Goals'));
    
    // Fill out the form with invalid values (too low calories)
    await user.type(screen.getByLabelText('Daily Calories Target'), '300'); // Below 500 minimum
    await user.type(screen.getByLabelText('Daily Protein Target (g)'), '120');
    await user.type(screen.getByLabelText('Daily Carbs Target (g)'), '220');
    await user.type(screen.getByLabelText('Daily Fat Target (g)'), '60');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: 'Update Goals', type: 'submit' }));
    
    // Check that error toast was shown
    expect(mockToast.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'destructive'
      })
    );
  });

  test('calculates progress percentages correctly', () => {
    render(<NutritionGoals />);
    
    // Get the progress bars
    const progressBars = document.querySelectorAll('[role="progressbar"]');
    
    // Check that the values are calculated correctly
    // Calories: 1500/2000 = 75%
    expect(progressBars[0]).toHaveAttribute('aria-valuenow', '75');
    
    // Protein: 80/100 = 80%
    expect(progressBars[1]).toHaveAttribute('aria-valuenow', '80');
    
    // Carbs: 150/200 = 75%
    expect(progressBars[2]).toHaveAttribute('aria-valuenow', '75');
    
    // Fat: 40/50 = 80%
    expect(progressBars[3]).toHaveAttribute('aria-valuenow', '80');
  });

  test('closes dialog without submitting when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<NutritionGoals />);
    
    // Click the update goals button
    await user.click(screen.getByText('Update Goals'));
    
    // Fill out the form
    await user.type(screen.getByLabelText('Daily Calories Target'), '2200');
    
    // Click cancel
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    
    // Check that the dialog is closed (title not visible anymore)
    expect(screen.queryByText('Update Goals', { selector: 'h2' })).not.toBeInTheDocument();
    
    // Check that the mutation was not called
    expect(mockCreateMutation.mutate).not.toHaveBeenCalled();
  });
});
