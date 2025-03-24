import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@/lib/auth';
import { db } from '@/server/db';
import { culturalRecipes } from '@shared/schema';
import { isContentVisibleForUser } from '@/lib/content-visibility';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getAuth(req);
    const userId = user?.id;

    let recipes = await db.select().from(culturalRecipes).orderBy(culturalRecipes.name);
    
    // If user is logged in, filter out hidden recipes
    if (userId) {
      recipes = recipes.filter(async recipe => 
        await isContentVisibleForUser(userId, 'recipe', recipe.id)
      );
    }

    res.status(200).json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ message: 'Failed to fetch recipes' });
  }
}