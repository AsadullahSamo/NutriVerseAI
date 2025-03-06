import Groq from "groq-sdk";
import { type Recipe, type CookingSkillLevel, type SkillProgress } from "@shared/schema";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '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',
  dangerouslyAllowBrowser: true
});

export interface SkillAssessment {
  skillGain: {
    skillName: string;
    experienceGained: number;
    newTechniquesLearned: string[];
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  }[];
  overallFeedback: string;
  nextStepRecommendations: {
    recipeId?: number;
    technique: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  }[];
}

export async function assessRecipeSkills(
  recipe: Recipe,
  currentSkillLevel: CookingSkillLevel
): Promise<SkillAssessment> {
  const prompt = `As a professional cooking coach, analyze this recipe and the user's current skill level to provide learning insights:
    Recipe: ${JSON.stringify(recipe)}
    Current Skill Level: ${JSON.stringify(currentSkillLevel)}
    
    Provide a detailed analysis in JSON format with:
    1. Skills gained from this recipe
    2. Overall feedback
    3. Next step recommendations for skill improvement`;

  const response = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are an expert cooking coach AI that analyzes recipes and provides detailed skill progression insights. Always return valid JSON only."
      },
      { role: "user", content: prompt }
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.4,
    max_tokens: 1500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from skill assessment API');
  }

  try {
    const cleanedContent = content.trim().replace(/```json\n?|\n?```/g, '');
    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error('Failed to parse skill assessment:', error);
    throw new Error('Invalid skill assessment format received');
  }
}

export async function getSkillProgressInsights(
  skillLevel: CookingSkillLevel,
  recentRecipes: Recipe[]
): Promise<{
  insights: string;
  recommendedSkills: string[];
  suggestedRecipes: Array<{ recipeId: number; reason: string }>;
}> {
  const prompt = `Analyze the user's cooking skill progress and recent recipe history:
    Skill Level: ${JSON.stringify(skillLevel)}
    Recent Recipes: ${JSON.stringify(recentRecipes)}
    
    Provide insights about their progress, skill recommendations, and suggested recipes in JSON format.`;

  const response = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are an expert cooking coach AI that analyzes skill progression and provides personalized recommendations. Return only valid JSON."
      },
      { role: "user", content: prompt }
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.5,
    max_tokens: 1500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from progress insights API');
  }

  try {
    const cleanedContent = content.trim().replace(/```json\n?|\n?```/g, '');
    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error('Failed to parse progress insights:', error);
    throw new Error('Invalid progress insights format received');
  }
}

export async function generateLearningPath(
  currentSkillLevel: CookingSkillLevel,
  goals: string[],
  preferredCuisines?: string[]
): Promise<{
  path: Array<{
    stage: number;
    focus: string;
    techniques: string[];
    suggestedRecipes: Array<{ recipeId: number; difficulty: string }>;
    estimatedTimeToMaster: string;
  }>;
  tips: string[];
}> {
  const prompt = `Create a personalized cooking skill learning path:
    Current Skill Level: ${JSON.stringify(currentSkillLevel)}
    Learning Goals: ${goals.join(', ')}
    ${preferredCuisines ? `Preferred Cuisines: ${preferredCuisines.join(', ')}` : ''}
    
    Provide a structured learning path in JSON format with stages, techniques, and recipe suggestions.`;

  const response = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are an expert cooking coach AI that creates personalized learning paths. Return only valid JSON."
      },
      { role: "user", content: prompt }
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.5,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from learning path generation API');
  }

  try {
    const cleanedContent = content.trim().replace(/```json\n?|\n?```/g, '');
    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error('Failed to parse learning path:', error);
    throw new Error('Invalid learning path format received');
  }
}