import { safeJsonParse, generateContent } from '../../../server/ai-services/gemini-client';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Mock the Google Generative AI library
jest.mock("@google/generative-ai", () => {
  const mockGenerateContent = jest.fn();
  const mockGetGenerativeModel = jest.fn(() => ({
    generateContent: mockGenerateContent
  }));
  
  return {
    GoogleGenerativeAI: jest.fn(() => ({
      getGenerativeModel: mockGetGenerativeModel
    }))
  };
});

describe('Gemini Client', () => {
  let mockModel;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Get a reference to the mocked generate content function
    mockModel = new GoogleGenerativeAI().getGenerativeModel();
  });
  
  describe('safeJsonParse', () => {
    test('should parse a clean JSON string', async () => {
      const jsonStr = '{"key": "value"}';
      const result = await safeJsonParse(jsonStr);
      expect(result).toEqual({ key: 'value' });
    });
    
    test('should handle JSON strings with markdown code block syntax', async () => {
      const jsonStr = '```json\n{"key": "value"}\n```';
      const result = await safeJsonParse(jsonStr);
      expect(result).toEqual({ key: 'value' });
    });
    
    test('should extract JSON content from text with extra content', async () => {
      const jsonStr = 'Here is your result: {"key": "value"} Hope this helps!';
      const result = await safeJsonParse(jsonStr);
      expect(result).toEqual({ key: 'value' });
    });
    
    test('should throw an error for invalid JSON', async () => {
      const invalidJson = 'Not valid JSON at all';
      await expect(safeJsonParse(invalidJson)).rejects.toThrow('Could not extract valid JSON');
    });
  });
  
  describe('generateContent', () => {
    test('should call the model generateContent with the provided prompt', async () => {
      // Setup the mock return value
      const mockResponse = {
        response: {
          text: () => '{"result": "success"}'
        }
      };
      mockModel.generateContent.mockResolvedValueOnce(mockResponse);
      
      // Call the function
      const prompt = 'Test prompt';
      await generateContent(prompt);
      
      // Check that the model was called with the correct prompt
      expect(mockModel.generateContent).toHaveBeenCalledWith(prompt);
    });
    
    test('should handle rate limiting by waiting between requests', async () => {
      jest.useFakeTimers();
      
      // Setup mock responses
      mockModel.generateContent.mockResolvedValueOnce({});
      mockModel.generateContent.mockResolvedValueOnce({});
      
      // Make two requests
      const promise1 = generateContent('Prompt 1');
      jest.advanceTimersByTime(10); // Some small time advancement
      const promise2 = generateContent('Prompt 2');
      
      // Fast-forward time to allow both requests to complete
      jest.advanceTimersByTime(3000); 
      
      await Promise.all([promise1, promise2]);
      
      // Verify both requests were made
      expect(mockModel.generateContent).toHaveBeenCalledTimes(2);
      
      jest.useRealTimers();
    });
    
    test('should retry on rate limit errors', async () => {
      jest.useFakeTimers();
      
      // Setup mock to fail once then succeed
      const error = new Error('Resource has been exhausted');
      error.status = 429;
      
      mockModel.generateContent
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({});
      
      // Start the request
      const promise = generateContent('Test prompt');
      
      // Advance time to allow for retry
      jest.advanceTimersByTime(1000);
      
      await promise;
      
      // Verify it was called twice (initial + retry)
      expect(mockModel.generateContent).toHaveBeenCalledTimes(2);
      
      jest.useRealTimers();
    });
  });
});
