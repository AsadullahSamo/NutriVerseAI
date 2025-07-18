import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize the Google Generative AI client
export const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || "your_gemini_api_key_here"
)

// Get the generative model with retry configuration
export const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-lite",
  safetySettings: [
    {
      category: "HARM_CATEGORY_HARASSMENT" as any,
      threshold: "BLOCK_MEDIUM_AND_ABOVE" as any
    }
  ]
})

// Queue management for rate limiting
let requestQueue = []
const MIN_DELAY_BETWEEN_REQUESTS = 2000 // Increase to 2 seconds between requests
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000
let lastRequestTime = 0

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function retryWithExponentialBackoff(operation, retryCount = 0) {
  try {
    return await operation()
  } catch (error) {
    if (retryCount >= MAX_RETRIES) {
      throw error
    }

    // Check if it's a rate limit error
    if (
      error?.status === 429 ||
      error?.message?.includes("Resource has been exhausted")
    ) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount)
      console.log(`Rate limit hit, retrying in ${delay}ms...`)
      await wait(delay)
      return retryWithExponentialBackoff(operation, retryCount + 1)
    }

    throw error
  }
}

// Helper function to clean potential JSON string
function cleanJsonString(str) {
  // Remove any leading/trailing whitespace
  str = str.trim()

  // Remove any markdown code block syntax
  str = str.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "")

  // Handle potential line breaks and indentation issues
  str = str.replace(/\\n/g, "\n").replace(/\t/g, "  ")

  return str
}

// Helper function to parse JSON response safely
export async function safeJsonParse(response) {
  try {
    // Print debug info
    console.log("Attempting to parse response:", response)

    // If response is already an object, return it
    if (typeof response === 'object' && response !== null) {
      return response;
    }

    // Clean the response first
    const cleaned = cleanJsonString(response)
    console.log("Cleaned response:", cleaned)

    // Try to parse the cleaned response directly
    return JSON.parse(cleaned)
  } catch (firstError) {
    try {
      // Extract the JSON content if it's wrapped in a code block or has extra text
      const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
      if (jsonMatch) {
        const jsonContent = jsonMatch[0]
        console.log("Extracted JSON content:", jsonContent)
        return JSON.parse(jsonContent)
      }

      // If no JSON object/array found, try other patterns
      const patterns = [
        /```json\n?([\s\S]*?)\n?```/, // JSON code block
        /```\n?([\s\S]*?)\n?```/ // Generic code block
      ]

      for (const pattern of patterns) {
        const match = response.match(pattern)
        if (match) {
          const jsonContent = cleanJsonString(match[1] || match[0])
          console.log("Matched pattern, attempting to parse:", jsonContent)
          try {
            return JSON.parse(jsonContent)
          } catch {
            continue // Try next pattern if this one fails
          }
        }
      }

      // If we get here, no patterns worked
      console.error("Original response:", response)
      console.error("First parse error:", firstError)
      throw new Error(
        "Could not extract valid JSON from response. The AI response may be malformed."
      )
    } catch (e) {
      console.error("Original response:", response)
      console.error("Parse error:", e)
      throw new Error(
        "Failed to parse JSON response: " +
          (e instanceof Error ? e.message : "Unknown error")
      )
    }
  }
}

export async function generateContent(prompt) {
  const now = Date.now()
  const timeToWait = Math.max(
    0,
    MIN_DELAY_BETWEEN_REQUESTS - (now - lastRequestTime)
  )

  if (timeToWait > 0) {
    await wait(timeToWait)
  }

  return retryWithExponentialBackoff(async () => {
    try {
      const result = await model.generateContent(prompt)
      lastRequestTime = Date.now()
      
      // Check if result exists and has a response property
      if (!result || !result.response) {
        console.error("Invalid Gemini response structure:", result);
        throw new Error("Invalid response from Gemini API");
      }
      
      return result;
    } catch (error) {
      console.error("Error generating content:", error);
      throw error;
    }
  })
}
