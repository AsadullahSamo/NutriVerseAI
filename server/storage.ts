import { IStorage } from "./types";
import { User, Recipe, GroceryList, PantryItem, CommunityPost } from "@shared/schema";
import { users, recipes, groceryLists, pantryItems, communityPosts, recipe_likes } from "@shared/schema";
import { db, sql, pool } from "./db";
import { eq, and } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  readonly sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session', 
      schemaName: 'public',
      pruneSessionInterval: false 
    });
  }

  private convertDatesToISOString(data: any) {
    if (data && data.expiryDate) {
      return {
        ...data,
        expiryDate: new Date(data.expiryDate)
      };
    }
    return data;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: { username: string; password: string; preferences?: unknown }): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getRecipes(): Promise<Recipe[]> {
    const recipesList = await db.select().from(recipes);
    return recipesList.map(recipe => ({
      ...recipe,
      createdAt: new Date(recipe.createdAt)
    })) as Recipe[];
  }

  async getRecipe(id: number): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    if (recipe) {
      return {
        ...recipe,
        createdAt: new Date(recipe.createdAt)
      } as Recipe;
    }
    return undefined;
  }

  async createRecipe(recipe: Omit<Recipe, "id">): Promise<Recipe> {
    const [newRecipe] = (await db.insert(recipes).values(recipe).returning()) as Recipe[];
    return newRecipe;
  }

  async likeRecipe(recipeId: number, userId: number): Promise<Recipe> {
    // Start a transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // Check if user has already liked this recipe
      const [existingLike] = await tx
        .select()
        .from(recipe_likes)
        .where(and(
          eq(recipe_likes.recipeId, recipeId),
          eq(recipe_likes.userId, userId)
        ));

      if (existingLike) {
        // Unlike: Remove the like and decrement count
        await tx.delete(recipe_likes)
          .where(and(
            eq(recipe_likes.recipeId, recipeId),
            eq(recipe_likes.userId, userId)
          ));

        const [recipe] = await tx
          .update(recipes)
          .set({ likes: sql`${recipes.likes} - 1` })
          .where(eq(recipes.id, recipeId))
          .returning();

        return {
          ...recipe,
          createdAt: new Date(recipe.createdAt)
        } as Recipe;
      } else {
        // Add like and increment count
        await tx.insert(recipe_likes).values({
          recipeId,
          userId
        });

        const [recipe] = await tx
          .update(recipes)
          .set({ likes: sql`${recipes.likes} + 1` })
          .where(eq(recipes.id, recipeId))
          .returning();

        return {
          ...recipe,
          createdAt: new Date(recipe.createdAt)
        } as Recipe;
      }
    });
  }

  async hasUserLikedRecipe(recipeId: number, userId: number): Promise<boolean> {
    const [like] = await db
      .select()
      .from(recipe_likes)
      .where(and(
        eq(recipe_likes.recipeId, recipeId),
        eq(recipe_likes.userId, userId)
      ));
    
    return !!like;
  }

  async forkRecipe(id: number, userId: number): Promise<Recipe> {
    const [originalRecipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    if (!originalRecipe) throw new Error("Recipe not found");

    const [forkedRecipe] = (await db.insert(recipes).values({
      ...originalRecipe,
      id: undefined,
      createdBy: userId,
      forkedFrom: id,
      likes: 0,
      createdAt: new Date()
    }).returning()) as Recipe[];

    return forkedRecipe;
  }

  async updateRecipe(id: number, data: Partial<Recipe>): Promise<Recipe> {
    const [recipe] = await db
      .update(recipes)
      .set(data)
      .where(eq(recipes.id, id))
      .returning();
    return {
      ...recipe,
      createdAt: new Date(recipe.createdAt)
    } as Recipe;
  }

  async getGroceryListsByUser(userId: number): Promise<GroceryList[]> {
    return db.select().from(groceryLists).where(eq(groceryLists.userId, userId));
  }

  async createGroceryList(list: Omit<GroceryList, "id">): Promise<GroceryList> {
    const [newList] = await db.insert(groceryLists).values(list).returning();
    return newList;
  }

  async updateGroceryList(id: number, data: Partial<GroceryList>): Promise<GroceryList> {
    const [list] = await db
      .update(groceryLists)
      .set(data)
      .where(eq(groceryLists.id, id))
      .returning();
    return list;
  }

  async getPantryItemsByUser(userId: number): Promise<PantryItem[]> {
    return db.select().from(pantryItems).where(eq(pantryItems.userId, userId));
  }

  async createPantryItem(item: Omit<PantryItem, "id">): Promise<PantryItem> {
    const [newItem] = await db.insert(pantryItems).values(item).returning();
    return newItem;
  }

  async updatePantryItem(id: number, data: Partial<PantryItem>): Promise<PantryItem> {
    const [item] = await db
      .update(pantryItems)
      .set(data)
      .where(eq(pantryItems.id, id))
      .returning();
    return item;
  }

  async deletePantryItem(id: number): Promise<void> {
    await db.delete(pantryItems).where(eq(pantryItems.id, id));
  }

  async getCommunityPosts(): Promise<CommunityPost[]> {
    return db.select().from(communityPosts);
  }

  async createCommunityPost(post: Omit<CommunityPost, "id">): Promise<CommunityPost> {
    const [newPost] = await db.insert(communityPosts).values(post).returning();
    return newPost;
  }

  async getCommunityPost(id: number): Promise<CommunityPost | undefined> {
    const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, id));
    return post;
  }

  async updateCommunityPost(id: number, data: Partial<CommunityPost>): Promise<CommunityPost> {
    const [post] = await db
      .update(communityPosts)
      .set(data)
      .where(eq(communityPosts.id, id))
      .returning();
    return post;
  }

  async deleteGroceryList(id: number): Promise<void> {
    await db.delete(groceryLists).where(eq(groceryLists.id, id));
  }

  async deleteCommunityPost(id: number): Promise<void> {
    await db.delete(communityPosts).where(eq(communityPosts.id, id));
  }

  async deleteRecipe(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      // First, update any recipes that were forked from this one to remove the reference
      await tx
        .update(recipes)
        .set({ forkedFrom: null })
        .where(eq(recipes.forkedFrom, id));

      // Update any community posts that reference this recipe to mark it as deleted
      await tx
        .update(communityPosts)
        .set({ recipeId: null })
        .where(eq(communityPosts.recipeId, id));

      // Finally delete the recipe
      await tx.delete(recipes).where(eq(recipes.id, id));
    });
  }
}

export const storage = new DatabaseStorage();