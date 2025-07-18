import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MoodTracker } from '../../../client/src/components/mood-tracker';
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

jest.mock('../../../client/src/lib/queryClient', () => ({
  apiRequest: jest.fn(),
}));

describe('MoodTracker Component', () => {
  // Mock data
  const recipeId = 123;
  const mockUser = { id: 1, username: 'testuser' };
  const mockToast = { toast: jest.fn() };
  const mockQueryClient = { 
    invalidateQueries: jest.fn(),
    getQueryData: jest.fn()
  };
  
  const mockMoodEntries = [
    {
      timestamp: '2023-01-01T12:00:00Z',
      entry: 'I felt really accomplished making this dish!',
      emotions: ['proud', 'satisfied', 'creative'],
      userId: 1,
      recipeId: 123
    },
    {
      timestamp: '2023-01-02T14:30:00Z',
      entry: 'The recipe was challenging but the results were worth it.',
      emotions: ['challenged', 'rewarded', 'focused'],
      userId: 1,
      recipeId: 123
    }
  ];
  
  const mockInsights = {
    summary: "You're showing great progress in your culinary journey with increasing confidence and creativity.",
    patterns: [
      {
        category: 'Skills',
        title: 'Cooking Skill Development',
        insights: [
          { type: 'highlight', content: 'Your knife skills have improved significantly.' },
          { type: 'observation', content: 'You show confidence with complex recipes.' },
          { type: 'tip', content: 'Try more advanced techniques like flambéing next.' }
        ]
      },
      {
        category: 'Emotions',
        title: 'Emotional Journey',
        insights: [
          { type: 'highlight', content: 'You experience strong feelings of accomplishment.' },
          { type: 'observation', content: 'Challenges bring you satisfaction rather than frustration.' },
          { type: 'tip', content: 'Continue to embrace challenging recipes for growth.' }
        ]
      }
    ],
    recommendations: {
      title: 'Personalized Growth Recommendations',
      items: [
        { focus: 'Next Challenge', suggestion: 'Try a multi-component dish that requires timing coordination.' },
        { focus: 'Skill Focus', suggestion: 'Work on mastering sauce consistency and flavor balance.' }
      ]
    }
  };
  
  const mockMoodMutation = { mutate: jest.fn(), isPending: false };
  const mockDeleteMoodEntryMutation = { mutate: jest.fn() };
  const mockInsightsQuery = { 
    refetch: jest.fn(),
    isLoading: false,
    error: null,
    data: mockInsights,
    isFetching: false
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup useQuery mocks
    QueryHooks.useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'moodEntries') {
        return { data: mockMoodEntries, refetch: jest.fn() };
      }
      if (queryKey[0] === 'moodInsights') {
        return mockInsightsQuery;
      }
      return { data: null };
    });
    
    // Setup useMutation mock
    QueryHooks.useMutation.mockImplementation(({ mutationFn }) => {
      if (String(mutationFn).includes('POST')) {
        return mockMoodMutation;
      }
      if (String(mutationFn).includes('DELETE')) {
        return mockDeleteMoodEntryMutation;
      }
      return { mutate: jest.fn() };
    });
    
    // Setup other mocks
    QueryHooks.useQueryClient.mockReturnValue(mockQueryClient);
    AuthHook.useAuth.mockReturnValue({ user: mockUser });
    ToastHook.useToast.mockReturnValue(mockToast);
  });

  test('renders mood tracker with journal entry form', () => {
    render(<MoodTracker recipeId={recipeId} />);
    
    // Check that the title is displayed
    expect(screen.getByText('Cooking Experience Journal')).toBeInTheDocument();
    
    // Check that the textarea is present
    expect(screen.getByPlaceholderText('Share your cooking experience, emotions, and any challenges or triumphs...')).toBeInTheDocument();
    
    // Check that the submit button is present
    expect(screen.getByText('Track Mood')).toBeInTheDocument();
  });

  test('submits mood entry when Track Mood button is clicked', async () => {
    const user = userEvent.setup();
    render(<MoodTracker recipeId={recipeId} />);
    
    // Type in the textarea
    await user.type(
      screen.getByPlaceholderText('Share your cooking experience, emotions, and any challenges or triumphs...'),
      'Today I tried a new technique and it worked great!'
    );
    
    // Click the track mood button
    await user.click(screen.getByText('Track Mood'));
    
    // Check that the mutation was called with the right data
    expect(mockMoodMutation.mutate).toHaveBeenCalled();
    
    // Check that success toast was shown
    expect(mockToast.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Mood tracked!'
      })
    );
  });

  test('displays existing mood entries', () => {
    render(<MoodTracker recipeId={recipeId} />);
    
    // Check that both entries are displayed
    expect(screen.getByText('I felt really accomplished making this dish!')).toBeInTheDocument();
    expect(screen.getByText('The recipe was challenging but the results were worth it.')).toBeInTheDocument();
    
    // Check that emotions are displayed as badges
    expect(screen.getByText('proud')).toBeInTheDocument();
    expect(screen.getByText('challenged')).toBeInTheDocument();
  });

  test('confirms before deleting a mood entry', async () => {
    const user = userEvent.setup();
    render(<MoodTracker recipeId={recipeId} />);
    
    // Get all delete buttons (trash icons)
    const deleteButtons = screen.getAllByRole('button', { name: '' });
    const firstDeleteButton = deleteButtons[0]; // First entry's delete button
    
    // Click the delete button
    await user.click(firstDeleteButton);
    
    // Check that confirmation dialog is shown
    expect(screen.getByText('Delete Entry')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    
    // Confirm deletion
    await user.click(screen.getByText('Delete'));
    
    // Check that mutation was called with correct timestamp
    expect(mockDeleteMoodEntryMutation.mutate).toHaveBeenCalledWith(mockMoodEntries[0].timestamp);
    
    // Check that cache was invalidated
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['moodEntries', recipeId]
      })
    );
  });

  test('shows View Insights button when entries exist', () => {
    render(<MoodTracker recipeId={recipeId} />);
    
    // Check that the View Insights button is present
    expect(screen.getByText('View Insights')).toBeInTheDocument();
  });

  test('opens insights dialog when View Insights button is clicked', async () => {
    const user = userEvent.setup();
    render(<MoodTracker recipeId={recipeId} />);
    
    // Click View Insights button
    await user.click(screen.getByText('View Insights'));
    
    // Check that insights dialog is opened
    expect(screen.getByText('Mood Insights & Patterns')).toBeInTheDocument();
    
    // Check that insights data is displayed
    expect(screen.getByText("You're showing great progress in your culinary journey with increasing confidence and creativity.")).toBeInTheDocument();
    
    // Check that pattern categories are displayed
    expect(screen.getByText('Cooking Skill Development')).toBeInTheDocument();
    expect(screen.getByText('Emotional Journey')).toBeInTheDocument();
    
    // Check that recommendations are displayed
    expect(screen.getByText('Personalized Growth Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Try a multi-component dish that requires timing coordination.')).toBeInTheDocument();
  });

  test('handles loading state for insights', async () => {
    // Override the insights query to show loading state
    mockInsightsQuery.isLoading = true;
    mockInsightsQuery.data = null;
    
    const user = userEvent.setup();
    render(<MoodTracker recipeId={recipeId} />);
    
    // Click View Insights button
    await user.click(screen.getByText('View Insights'));
    
    // Check that loading message is displayed
    expect(screen.getByText('Analyzing your mood patterns...')).toBeInTheDocument();
  });

  test('handles error state for insights', async () => {
    // Override the insights query to show error state
    mockInsightsQuery.isLoading = false;
    mockInsightsQuery.error = new Error('Failed to load insights');
    mockInsightsQuery.data = null;
    
    const user = userEvent.setup();
    render(<MoodTracker recipeId={recipeId} />);
    
    // Click View Insights button
    await user.click(screen.getByText('View Insights'));
    
    // Check that error message is displayed
    expect(screen.getByText('Failed to load insights. Please try again.')).toBeInTheDocument();
    
    // Check that retry button is present
    expect(screen.getByText('Retry')).toBeInTheDocument();
    
    // Click retry button
    await user.click(screen.getByText('Retry'));
    
    // Check that refetch was called
    expect(mockInsightsQuery.refetch).toHaveBeenCalled();
  });

  test('refreshes insights when Refresh Insights button is clicked', async () => {
    const user = userEvent.setup();
    render(<MoodTracker recipeId={recipeId} />);
    
    // Click View Insights button
    await user.click(screen.getByText('View Insights'));
    
    // Click Refresh Insights button
    await user.click(screen.getByText('Refresh Insights'));
    
    // Check that refetch was called
    expect(mockInsightsQuery.refetch).toHaveBeenCalled();
  });

  test('shows feedback when there are no entries to analyze', async () => {
    // Override the moodEntries query to return empty array
    QueryHooks.useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'moodEntries') {
        return { data: [], refetch: jest.fn() };
      }
      if (queryKey[0] === 'moodInsights') {
        return mockInsightsQuery;
      }
      return { data: null };
    });
    
    const user = userEvent.setup();
    render(<MoodTracker recipeId={recipeId} />);
    
    // View Insights button shouldn't be present
    expect(screen.queryByText('View Insights')).not.toBeInTheDocument();
    
    // Use toast message to test that analyzing without entries shows feedback
    mockQueryClient.getQueryData.mockReturnValue(null);
    await user.click(screen.getByText('Track Mood'));
    
    // An entry should be required
    expect(mockMoodMutation.mutate).not.toHaveBeenCalled();
  });

  test('disables Track Mood button when text area is empty', () => {
    render(<MoodTracker recipeId={recipeId} />);
    
    // Track Mood button should be disabled initially
    expect(screen.getByText('Track Mood').closest('button')).toBeDisabled();
  });
});
