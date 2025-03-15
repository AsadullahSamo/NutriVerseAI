import { model, safeJsonParse } from './gemini-client';

export async function assessCookingSkills(skills: any[]) {
  try {
    const prompt = `Assess these cooking skills and provide guidance:
    Skills: ${JSON.stringify(skills)}
    
    Return EXACTLY this JSON structure with no additional text:
    {
      "skillLevels": [
        {
          "skill": "string",
          "level": "beginner|intermediate|advanced",
          "strengths": ["string"],
          "areasToImprove": ["string"]
        }
      ],
      "overallAssessment": "string",
      "recommendedFocus": ["string"],
      "suggestedPractice": [
        {
          "skill": "string",
          "exercises": ["string"],
          "recipes": ["string"]
        }
      ]
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    return await safeJsonParse(response);
  } catch (error) {
    console.error('Error assessing cooking skills:', error);
    throw error;
  }
}

export async function getSkillBasedRecipes(skillLevel: string, focusAreas: string[]) {
  try {
    const prompt = `Suggest recipes for skill development:
    Skill Level: ${skillLevel}
    Focus Areas: ${JSON.stringify(focusAreas)}
    
    Return EXACTLY this JSON structure with no additional text:
    {
      "recipes": [
        {
          "name": "string",
          "difficulty": "string",
          "skillsFeatured": ["string"],
          "learningPoints": ["string"],
          "commonMistakes": ["string"]
        }
      ],
      "progressionPath": ["string"],
      "techniques": [
        {
          "name": "string",
          "description": "string",
          "tips": ["string"]
        }
      ]
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    return await safeJsonParse(response);
  } catch (error) {
    console.error('Error getting skill-based recipes:', error);
    throw error;
  }
}

export async function getTechniqueGuidance(technique: string) {
  try {
    const prompt = `Provide detailed guidance for this cooking technique:
    Technique: ${technique}
    
    Return EXACTLY this JSON structure with no additional text:
    {
      "technique": "string",
      "description": "string",
      "steps": ["string"],
      "tips": ["string"],
      "commonMistakes": ["string"],
      "equipment": ["string"],
      "practiceExercises": [
        {
          "name": "string",
          "steps": ["string"],
          "difficulty": "string"
        }
      ]
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    return await safeJsonParse(response);
  } catch (error) {
    console.error('Error getting technique guidance:', error);
    throw error;
  }
}

export async function getProgressFeedback(progress: any) {
  try {
    const prompt = `Analyze this cooking progress and provide feedback:
    Progress Data: ${JSON.stringify(progress)}
    
    Return EXACTLY this JSON structure with no additional text:
    {
      "overview": "string",
      "improvements": ["string"],
      "challengeAreas": ["string"],
      "nextSteps": ["string"],
      "recommendations": {
        "techniques": ["string"],
        "recipes": ["string"],
        "focusAreas": ["string"]
      }
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    return await safeJsonParse(response);
  } catch (error) {
    console.error('Error getting progress feedback:', error);
    throw error;
  }
}