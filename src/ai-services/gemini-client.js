import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "@/lib/config";

const genAI = new GoogleGenerativeAI(config.geminiApiKey);
export const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function safeJsonParse(text) {
  try {
    // Try to find JSON content within markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonContent = jsonMatch ? jsonMatch[1] : text;
    
    // Clean the content
    const cleanedContent = jsonContent
      .replace(/[\u0000-\u001F]+/g, "") // Remove control characters
      .replace(/\\n/g, " ") // Replace newlines with spaces
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/"\s*([{[])\s*/g, '"$1') // Remove spaces after quotes before brackets
      .replace(/\s*([}\]])\s*"/g, '$1"') // Remove spaces before brackets after quotes
      .trim();

    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    throw new Error("Invalid JSON format received");
  }
} 