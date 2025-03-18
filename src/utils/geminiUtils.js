import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

export async function generateRecipeDescription(recipe) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    const prompt = `Write a compelling and concise 1.5-line description for this recipe: "${recipe.title}". Consider its main ingredients: ${recipe.extendedIngredients?.map(i => i.name).join(', ')}`;
    
    const result = await model.generateContent(prompt);
    const description = result.response.text();
    return description.trim();
  } catch (error) {
    console.error('Error generating recipe description:', error);
    return recipe.summary ? recipe.summary.substring(0, 150).replace(/<[^>]*>?/gm, '') + '...' : 'No description available';
  }
}
