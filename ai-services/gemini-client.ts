import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI client
export const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "AIzaSyDKcf0RjTq9yT4kXv4ANfT1ZB4Y6SQDKwc");

// Get the generative model
export const model = genAI.getGenerativeModel({ model: "gemini-2.0-pro-exp-02-05" });

// Helper function to parse JSON response safely
export async function safeJsonParse(response: string) {
  try {
    // Try to parse the response directly
    return JSON.parse(response);
  } catch (e) {
    // If direct parsing fails, try to extract JSON from the response
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) || 
                     response.match(/```\n?([\s\S]*?)\n?```/) ||
                     response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (e) {
        throw new Error('Failed to parse JSON from response');
      }
    }
    throw new Error('No valid JSON found in response');
  }
}