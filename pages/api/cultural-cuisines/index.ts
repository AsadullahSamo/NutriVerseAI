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

    // Get all cuisines first
    let cuisines = await db
      .select()
      .from(culturalCuisines)
      .orderBy(culturalCuisines.name);

    // If user is logged in, filter out hidden cuisines
    if (userId) {
      const visibilityChecks = await Promise.all(
        cuisines.map(async cuisine => {
          const isVisible = await isContentVisibleForUser(userId, 'cuisine', cuisine.id);
          return { cuisine, isVisible };
        })
      );

      // Only return visible cuisines
      cuisines = visibilityChecks
        .filter(({ isVisible }) => isVisible)
        .map(({ cuisine }) => cuisine);

      // Additional filter to ensure no hidden cuisines slip through
      cuisines = cuisines.filter(cuisine => 
        !cuisine.hiddenFor || 
        !Array.isArray(cuisine.hiddenFor) || 
        !cuisine.hiddenFor.includes(userId)
      );
    }

    // Set cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.status(200).json(cuisines);
  } catch (error) {
    console.error('Error fetching cuisines:', error);
    res.status(500).json({ message: 'Failed to fetch cuisines' });
  }
}