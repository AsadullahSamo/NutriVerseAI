import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@/lib/auth';
import { db } from '@/server/db';
import { culturalRecipes } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { isContentVisibleForUser } from '@/lib/content-visibility';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getAuth(req);
    const recipeId = parseInt(req.query.id as string);

    if (isNaN(recipeId)) {
      return res.status(400).json({ message: 'Invalid recipe ID' });
    }

    // Get the recipe
    const recipe = await db
      .select()
      .from(culturalRecipes)
      .where(eq(culturalRecipes.id, recipeId))
      .limit(1)
      .then(rows => rows[0]);

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // For DELETE requests, verify creator
    if (req.method === 'DELETE') {
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      if (recipe.createdBy !== user.id) {
        return res.status(403).json({ 
          message: 'Permission denied',
          details: 'You can only delete recipes that you created'
        });
      }

      // Proceed with deletion
      await db.delete(culturalRecipes)
        .where(eq(culturalRecipes.id, recipeId));
      
      return res.status(200).json({ message: 'Recipe deleted successfully' });
    }

    // If user is logged in, check visibility for GET requests
    if (req.method === 'GET' && user) {
      const isVisible = await isContentVisibleForUser(user.id, 'recipe', recipeId);
      if (!isVisible) {
        return res.status(404).json({ message: 'Recipe not found' });
      }
    }

    res.status(200).json(recipe);
  } catch (error) {
    console.error('Error handling recipe:', error);
    res.status(500).json({ message: 'Failed to process recipe request' });
  }
}