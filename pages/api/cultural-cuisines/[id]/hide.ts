import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@/lib/auth';
import { hideContentForUser } from '@/lib/content-visibility';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = await getAuth(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const cuisineId = parseInt(req.query.id as string);
    if (isNaN(cuisineId)) {
      return res.status(400).json({ message: 'Invalid cuisine ID' });
    }

    const result = await hideContentForUser(user.id, 'cuisine', cuisineId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error hiding cuisine:', error);
    res.status(500).json({ message: 'Failed to hide cuisine' });
  }
}