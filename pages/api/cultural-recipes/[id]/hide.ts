import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@/lib/auth';
import { hideContentForUser, VisibilityError } from '@/lib/content-visibility';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed', type: 'error' });
  }

  try {
    const user = await getAuth(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized', type: 'error' });
    }

    const recipeId = parseInt(req.query.id as string);
    if (isNaN(recipeId)) {
      return res.status(400).json({ message: 'Invalid recipe ID', type: 'error' });
    }

    const result = await hideContentForUser(user.id, 'recipe', recipeId);
    return res.status(200).json(result); // This will include the 'type' property
  } catch (error) {
    console.error('Error handling recipe hide/delete:', error);
    
    if (error instanceof VisibilityError) {
      const statusCode = error.code === 'NOT_FOUND' ? 404 :
                        error.code === 'UNAUTHORIZED' ? 401 :
                        error.code === 'ALREADY_HIDDEN' ? 400 : 500;
      
      return res.status(statusCode).json({ 
        message: error.message,
        code: error.code,
        type: 'error'
      });
    }
    
    return res.status(500).json({ 
      message: 'Internal server error', 
      type: 'error' 
    });
  }
}