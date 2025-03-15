import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI client
export const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "AIzaSyDKcf0RjTq9yT4kXv4ANfT1ZB4Y6SQDKwc");

// Get the generative model
export const model = genAI.getGenerativeModel({ model: "gemini-2.0-pro-exp-02-05" });

// Helper function to clean potential JSON string
function cleanJsonString(str: string): string {
  // Remove any leading/trailing whitespace
  str = str.trim();
  
  // Remove any markdown code block syntax
  str = str.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
  
  // Handle potential line breaks and indentation issues
  str = str.replace(/\\n/g, '\n').replace(/\t/g, '  ');
  
  return str;
}

// Helper function to parse JSON response safely
export async function safeJsonParse(response: string) {
  try {
    // Clean the response first
    const cleaned = cleanJsonString(response);
    
    // Try to parse the cleaned response directly
    return JSON.parse(cleaned);
  } catch (firstError) {
    try {
      // Look for JSON-like content in the response
      const patterns = [
        /\{[\s\S]*\}/, // Object pattern
        /\[[\s\S]*\]/, // Array pattern
        /```json\n?([\s\S]*?)\n?```/, // JSON code block
        /```\n?([\s\S]*?)\n?```/ // Generic code block
      ];

      for (const pattern of patterns) {
        const match = response.match(pattern);
        if (match) {
          const jsonContent = cleanJsonString(match[1] || match[0]);
          try {
            return JSON.parse(jsonContent);
          } catch {
            continue; // Try next pattern if this one fails
          }
        }
      }

      // If we get here, no patterns worked
      console.error('Original response:', response);
      console.error('First parse error:', firstError);
      throw new Error('Could not extract valid JSON from response. The AI response may be malformed.');
    } catch (e) {
      console.error('Original response:', response);
      console.error('Parse error:', e);
      throw new Error('Failed to parse JSON response: ' + (e instanceof Error ? e.message : 'Unknown error'));
    }
  }
}