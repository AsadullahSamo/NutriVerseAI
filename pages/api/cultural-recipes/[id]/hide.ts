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

    const recipeId = parseInt(req.query.id as string);
    if (isNaN(recipeId)) {
      return res.status(400).json({ message: 'Invalid recipe ID' });
    }

    const result = await hideContentForUser(user.id, 'recipe', recipeId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error hiding recipe:', error);
    res.status(500).json({ message: 'Failed to hide recipe' });
  }
}