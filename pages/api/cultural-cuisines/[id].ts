import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@/lib/auth';
import { db } from '@/server/db';
import { culturalCuisines } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { isContentVisibleForUser } from '@/lib/content-visibility';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getAuth(req);
    const cuisineId = parseInt(req.query.id as string);

    if (isNaN(cuisineId)) {
      return res.status(400).json({ message: 'Invalid cuisine ID' });
    }

    // Get the cuisine
    const cuisine = await db
      .select()
      .from(culturalCuisines)
      .where(eq(culturalCuisines.id, cuisineId))
      .limit(1)
      .then(rows => rows[0]);

    if (!cuisine) {
      return res.status(404).json({ message: 'Cuisine not found' });
    }

    // If user is logged in, check visibility
    if (user) {
      const isVisible = await isContentVisibleForUser(user.id, 'cuisine', cuisineId);
      if (!isVisible) {
        return res.status(404).json({ message: 'Cuisine not found' });
      }
    }

    res.status(200).json(cuisine);
  } catch (error) {
    console.error('Error fetching cuisine:', error);
    res.status(500).json({ message: 'Failed to fetch cuisine' });
  }
}