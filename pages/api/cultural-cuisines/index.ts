import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@/lib/auth';
import { db } from '@/server/db';
import { culturalCuisines } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { isContentVisibleForUser } from '@/lib/content-visibility';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getAuth(req);
    const userId = user?.id;

    let cuisines = await db.select().from(culturalCuisines).orderBy(culturalCuisines.name);
    
    // If user is logged in, filter out hidden cuisines
    if (userId) {
      cuisines = cuisines.filter(async cuisine => 
        await isContentVisibleForUser(userId, 'cuisine', cuisine.id)
      );
    }

    res.status(200).json(cuisines);
  } catch (error) {
    console.error('Error fetching cuisines:', error);
    res.status(500).json({ message: 'Failed to fetch cuisines' });
  }
}