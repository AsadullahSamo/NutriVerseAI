import { db } from "@/server/db";
import { sql } from "drizzle-orm";
import { culturalCuisines, culturalRecipes } from "@shared/schema";
import { eq } from "drizzle-orm";

export class VisibilityError extends Error {
  constructor(message: string, public code: 'NOT_FOUND' | 'UNAUTHORIZED' | 'ALREADY_HIDDEN' | 'DATABASE_ERROR') {
    super(message);
    this.name = 'VisibilityError';
  }
}

export async function hideContentForUser(
  userId: number,
  contentType: 'cuisine' | 'recipe',
  contentId: number
) {
  const table = contentType === 'cuisine' ? culturalCuisines : culturalRecipes;
  
  try {
    // First check if the user is the creator
    const content = await db
      .select({ createdBy: table.createdBy, hiddenFor: table.hiddenFor })
      .from(table)
      .where(eq(table.id, contentId))
      .limit(1);

    if (!content.length) {
      throw new VisibilityError('Content not found', 'NOT_FOUND');
    }

    const hiddenFor = content[0].hiddenFor as number[] || [];
    
    // Check if already hidden for this user
    if (hiddenFor.includes(userId)) {
      throw new VisibilityError('Content is already hidden for this user', 'ALREADY_HIDDEN');
    }

    // If user is creator, do a hard delete
    if (content[0].createdBy === userId) {
      await db.delete(table).where(eq(table.id, contentId));
      return { type: 'deleted' };
    }

    // Otherwise, add user to hiddenFor array
    await db
      .update(table)
      .set({
        hiddenFor: sql`COALESCE(${table.hiddenFor}, '[]'::jsonb) || ${sql.json([userId])}::jsonb`
      })
      .where(eq(table.id, contentId));

    return { type: 'hidden' };
  } catch (error) {
    if (error instanceof VisibilityError) {
      throw error;
    }
    throw new VisibilityError(
      'Failed to update content visibility',
      'DATABASE_ERROR'
    );
  }
}

export async function isContentVisibleForUser(
  userId: number,
  contentType: 'cuisine' | 'recipe',
  contentId: number
): Promise<boolean> {
  try {
    const table = contentType === 'cuisine' ? culturalCuisines : culturalRecipes;
    
    const content = await db
      .select({ hiddenFor: table.hiddenFor })
      .from(table)
      .where(eq(table.id, contentId))
      .limit(1);

    if (!content.length) return false;
    
    const hiddenFor = content[0].hiddenFor as number[] || [];
    return !hiddenFor.includes(userId);
  } catch (error) {
    console.error('Error checking content visibility:', error);
    return false;
  }
}

export async function unhideContentForUser(
  userId: number,
  contentType: 'cuisine' | 'recipe',
  contentId: number
) {
  const table = contentType === 'cuisine' ? culturalCuisines : culturalRecipes;
  
  try {
    // Get current hidden users
    const content = await db
      .select({ hiddenFor: table.hiddenFor })
      .from(table)
      .where(eq(table.id, contentId))
      .limit(1);

    if (!content.length) {
      throw new VisibilityError('Content not found', 'NOT_FOUND');
    }

    const hiddenFor = content[0].hiddenFor as number[] || [];
    
    // Remove user from hiddenFor array
    const updatedHiddenFor = hiddenFor.filter(id => id !== userId);

    await db
      .update(table)
      .set({ hiddenFor: updatedHiddenFor })
      .where(eq(table.id, contentId));

    return { success: true };
  } catch (error) {
    if (error instanceof VisibilityError) {
      throw error;
    }
    throw new VisibilityError(
      'Failed to update content visibility',
      'DATABASE_ERROR'
    );
  }
}