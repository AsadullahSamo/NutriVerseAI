import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateCulturalCuisineDialog } from '../../../client/src/components/create-cultural-cuisine-dialog';
import * as ToastHook from '../../../client/src/hooks/use-toast';
import * as CulturalCuisineService from '../../../client/src/ai-services/cultural-cuisine-service';
import { Alert, AlertDescription } from '../../../client/src/components/ui/alert';
import { Info, Sparkles } from 'lucide-react';

// Mock the dependencies
jest.mock('../../../client/src/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

jest.mock('../../../client/src/ai-services/cultural-cuisine-service', () => ({
  generateCuisineDetailsFromName: jest.fn(),
}));

jest.mock('../../../client/src/lib/config', () => ({
  __esModule: true,
  default: { apiBaseUrl: 'http://test-api.example.com' }
}));

// Mock fetch API
global.fetch = jest.fn();

// Mock the UI components
jest.mock('../../../client/src/components/ui/alert', () => ({
  Alert: jest.fn(({ children, className }) => (
    <div data-testid="alert" className={className}>{children}</div>
  )),
  AlertDescription: jest.fn(({ children, className }) => (
    <div data-testid="alert-description" className={className}>{children}</div>
  )),
}));

jest.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon">Plus Icon</div>,
  Wand2: () => <div data-testid="wand-icon">Wand Icon</div>,
  Loader2: () => <div data-testid="loader-icon">Loader Icon</div>,
  Info: () => <div data-testid="info-icon">Info Icon</div>,
  Sparkles: () => <div data-testid="sparkles-icon">Sparkles Icon</div>,
}));

// Mock the zod resolver and schema
jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: jest.fn(() => (data) => ({ values: data })),
}));

describe('CreateCulturalCuisineDialog Component', () => {
  // Mock data
  const mockToast = { toast: jest.fn() };
  
  const mockGeneratedCuisineDetails = {
    description: "Japanese cuisine emphasizes fresh, seasonal ingredients prepared with minimal seasoning to highlight natural flavors. Known for its artistic presentation and precise preparation techniques.",
    keyIngredients: ["rice", "seafood", "soy sauce", "miso", "nori"],
    cookingTechniques: ["sushi making", "tempura", "grilling", "steaming"],
    culturalContext: {
      history: "Developed over centuries with strong influence from Chinese cuisine followed by periods of isolation.",
      traditions: "Strong emphasis on seasonality and regional specialties.",
      festivals: "Seasonal festivals like Obon and New Year feature special dishes.",
      influences: "Initially influenced by Chinese cuisine, later by Western techniques after opening to trade."
    },
    servingEtiquette: {
      tableSettings: "Traditional settings include individual lacquerware trays with multiple small dishes.",
      diningCustoms: "Say 'itadakimasu' before eating and 'gochisōsama deshita' after meals to express gratitude.",
      servingOrder: "Meals typically include rice, soup, and several small side dishes served simultaneously.",
      taboos: "Avoid sticking chopsticks vertically in rice, which resembles funeral rituals.",
      summary: "Japanese dining etiquette emphasizes respect, gratitude, and mindfulness while eating."
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup toast mock
    ToastHook.useToast.mockReturnValue(mockToast);
    
    // Setup AI service mock
    CulturalCuisineService.generateCuisineDetailsFromName.mockResolvedValue(mockGeneratedCuisineDetails);
    
    // Setup fetch mock for successful response
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 1, name: 'Japanese Cuisine' })
    });
    
    // Mock global browser APIs used in the component
    Object.defineProperty(window, 'HTMLDialogElement', {
      writable: true,
      value: class {},
    });
  });

  test('renders dialog when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<CreateCulturalCuisineDialog />);
    
    // Click the trigger button to open the dialog
    await user.click(screen.getByText('Add Cultural Cuisine'));
    
    // Dialog should be open with title visible
    expect(screen.getByText('Create Cultural Cuisine')).toBeInTheDocument();
  });

  test('renders form with all required fields', async () => {
    const user = userEvent.setup();
    render(<CreateCulturalCuisineDialog />);
    
    // Click to open dialog
    await user.click(screen.getByText('Add Cultural Cuisine'));
    
    // Check that all basic form fields are present
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Region')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    
    // Check cultural context section
    expect(screen.getByText('Cultural Context')).toBeInTheDocument();
    expect(screen.getByLabelText('History')).toBeInTheDocument();
    expect(screen.getByLabelText('Traditions')).toBeInTheDocument();
    expect(screen.getByLabelText('Festivals')).toBeInTheDocument();
    expect(screen.getByLabelText('Influences')).toBeInTheDocument();
    
    // Check serving etiquette section
    expect(screen.getByText('Serving Etiquette')).toBeInTheDocument();
    expect(screen.getByLabelText('Table Settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Dining Customs')).toBeInTheDocument();
    expect(screen.getByLabelText('Serving Order')).toBeInTheDocument();
    expect(screen.getByLabelText('Taboos')).toBeInTheDocument();
    expect(screen.getByLabelText('General Summary')).toBeInTheDocument();
    
    // Check that Generate button is present
    expect(screen.getByText('Generate Details with AI')).toBeInTheDocument();
  });

  test('generates cuisine details with AI when "Generate Details with AI" button is clicked', async () => {
    const user = userEvent.setup();
    render(<CreateCulturalCuisineDialog />);
    
    // Open dialog
    await user.click(screen.getByText('Add Cultural Cuisine'));
    
    // Fill in required fields
    await user.type(screen.getByLabelText('Name'), 'Japanese Cuisine');
    await user.type(screen.getByLabelText('Region'), 'East Asia');
    
    // Click Generate button
    await user.click(screen.getByText('Generate Details with AI'));
    
    // Check that generateCuisineDetailsFromName was called with correct parameters
    expect(CulturalCuisineService.generateCuisineDetailsFromName).toHaveBeenCalledWith(
      'Japanese Cuisine',
      'East Asia'
    );
    
    // Wait for generated details to appear
    await waitFor(() => {
      // Description should be filled in
      expect(screen.getByLabelText('Description')).toHaveValue(
        'Japanese cuisine emphasizes fresh, seasonal ingredients prepared with minimal seasoning to highlight natural flavors. Known for its artistic presentation and precise preparation techniques.'
      );
    });
    
    // Check that cultural context fields were filled in correctly
    expect(screen.getByLabelText('History')).toHaveValue(
      'Developed over centuries with strong influence from Chinese cuisine followed by periods of isolation.'
    );
    expect(screen.getByLabelText('Traditions')).toHaveValue(
      'Strong emphasis on seasonality and regional specialties.'
    );
    
    // Check that serving etiquette fields were filled in correctly
    expect(screen.getByLabelText('Table Settings')).toHaveValue(
      'Traditional settings include individual lacquerware trays with multiple small dishes.'
    );
    expect(screen.getByLabelText('Dining Customs')).toHaveValue(
      'Say \'itadakimasu\' before eating and \'gochisōsama deshita\' after meals to express gratitude.'
    );
    
    // Check that success toast was shown
    expect(mockToast.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Details Generated'
      })
    );
  });

  test('shows error when trying to generate details without name and region', async () => {
    const user = userEvent.setup();
    render(<CreateCulturalCuisineDialog />);
    
    // Open dialog
    await user.click(screen.getByText('Add Cultural Cuisine'));
    
    // Click Generate button without entering name and region
    await user.click(screen.getByText('Generate Details with AI'));
    
    // Check that error toast was shown
    expect(mockToast.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Missing Information',
        variant: 'destructive'
      })
    );
    
    // AI generation should not have been called
    expect(CulturalCuisineService.generateCuisineDetailsFromName).not.toHaveBeenCalled();
  });

  test('handles AI generation errors gracefully', async () => {
    // Setup AI mock to reject
    CulturalCuisineService.generateCuisineDetailsFromName.mockRejectedValueOnce(new Error('AI service unavailable'));
    
    const user = userEvent.setup();
    render(<CreateCulturalCuisineDialog />);
    
    // Open dialog
    await user.click(screen.getByText('Add Cultural Cuisine'));
    
    // Fill in required fields
    await user.type(screen.getByLabelText('Name'), 'Thai Cuisine');
    await user.type(screen.getByLabelText('Region'), 'Southeast Asia');
    
    // Click Generate button
    await user.click(screen.getByText('Generate Details with AI'));
    
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

  test('submits form with all entered data', async () => {
    const user = userEvent.setup();
    render(<CreateCulturalCuisineDialog />);
    
    // Open dialog
    await user.click(screen.getByText('Add Cultural Cuisine'));
    
    // Fill out the form
    await user.type(screen.getByLabelText('Name'), 'Italian Cuisine');
    await user.type(screen.getByLabelText('Region'), 'Southern Europe');
    await user.type(screen.getByLabelText('Description'), 'Known for pasta, pizza, and regional diversity');
    await user.type(screen.getByLabelText('History'), 'Rich history dating back to ancient Rome');
    await user.type(screen.getByLabelText('Table Settings'), 'Multiple courses served separately');
    
    // Submit the form
    await user.click(screen.getByText('Create Cuisine'));
    
    // Check that fetch was called with correct data
    expect(global.fetch).toHaveBeenCalledWith(
      'http://test-api.example.com/api/cultural-cuisines',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: expect.any(String)
      })
    );
    
    // Verify the body content
    const calledWith = global.fetch.mock.calls[0][1];
    const parsedBody = JSON.parse(calledWith.body);
    
    expect(parsedBody).toEqual(
      expect.objectContaining({
        name: 'Italian Cuisine',
        region: 'Southern Europe',
        description: 'Known for pasta, pizza, and regional diversity',
        culturalContext: expect.objectContaining({
          history: 'Rich history dating back to ancient Rome'
        }),
        servingEtiquette: expect.objectContaining({
          tableSettings: 'Multiple courses served separately'
        })
      })
    );
    
    // Success toast should be displayed
    expect(mockToast.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Cultural Cuisine Created'
      })
    );
  });

  test('handles form submission errors gracefully', async () => {
    // Mock fetch to return error
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({ 
        message: 'Validation failed', 
        error: 'Required fields missing' 
      })
    });
    
    const user = userEvent.setup();
    render(<CreateCulturalCuisineDialog />);
    
    // Open dialog
    await user.click(screen.getByText('Add Cultural Cuisine'));
    
    // Fill minimal required fields
    await user.type(screen.getByLabelText('Name'), 'French Cuisine');
    await user.type(screen.getByLabelText('Region'), 'Western Europe');
    await user.type(screen.getByLabelText('Description'), 'Renowned for fine dining');
    
    // Submit the form
    await user.click(screen.getByText('Create Cuisine'));
    
    // Error toast should be displayed
    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Creation Failed',
          variant: 'destructive'
        })
      );
    });
  });
});
