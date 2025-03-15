import { IStorage } from "./types";
import { User, Recipe, GroceryList, PantryItem, CommunityPost } from "@shared/schema";
import { users, recipes, groceryLists, pantryItems, communityPosts, recipe_likes, mealPlans, nutritionGoals, type NutritionGoal, recipeConsumption, type RecipeConsumption } from "@shared/schema";
import { db, sql, pool } from "./db";
import { eq, and, gte, lte, desc, count } from "drizzle-orm";
import session from "express-session";
import MemoryStore from "memorystore";

const MemorySessionStore = MemoryStore(session);

export class DatabaseStorage implements IStorage {
  readonly sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemorySessionStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
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
    const recipesList = await db
      .select()
      .from(recipes);

    // For each recipe, get the likes count
    const recipesWithLikes = await Promise.all(
      recipesList.map(async (recipe) => {
        const likeCount = await this.getRecipeLikesCount(recipe.id);
        return {
          ...recipe,
          createdAt: new Date(recipe.createdAt),
          likes: likeCount // Add likes count to the recipe
        };
      })
    );

    return recipesWithLikes as Recipe[];
  }

  async getRecipe(id: number): Promise<Recipe | undefined> {
    const [recipe] = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, id));

    if (recipe) {
      // Get the likes count
      const likeCount = await this.getRecipeLikesCount(id);
      return {
        ...recipe,
        createdAt: new Date(recipe.createdAt),
        likes: likeCount // Add likes count to the recipe
      } as Recipe;
    }
    return undefined;
  }

  async getRecipeLikesCount(recipeId: number): Promise<number> {
    // Get count of likes for a recipe
    const result = await db
      .select({ count: count() })
      .from(recipe_likes)
      .where(eq(recipe_likes.recipeId, recipeId));
    
    return result[0]?.count || 0;
  }

  async createRecipe(recipe: Omit<Recipe, "id">): Promise<Recipe> {
    const [newRecipe] = await db
      .insert(recipes)
      .values(recipe)
      .returning({
        id: recipes.id,
        title: recipes.title,
        description: recipes.description,
        ingredients: recipes.ingredients,
        instructions: recipes.instructions,
        nutritionInfo: recipes.nutritionInfo,
        prepTime: recipes.prepTime,
        imageUrl: recipes.imageUrl,
        createdBy: recipes.createdBy,
        createdAt: recipes.createdAt,
        forkedFrom: recipes.forkedFrom,
        sustainabilityScore: recipes.sustainabilityScore,
        wastageReduction: recipes.wastageReduction
      });

    return {
      ...newRecipe,
      createdAt: new Date(newRecipe.createdAt),
      likes: 0 // New recipes start with 0 likes
    } as Recipe;
  }

  async likeRecipe(recipeId: number, userId: number): Promise<Recipe> {
    try {
      // Check if user has already liked this recipe
      const existingLikes = await db
        .select()
        .from(recipe_likes)
        .where(
          and(
            eq(recipe_likes.recipeId, recipeId),
            eq(recipe_likes.userId, userId)
          )
        );

      if (existingLikes.length > 0) {
        // Unlike: Remove the like
        await db
          .delete(recipe_likes)
          .where(
            and(
              eq(recipe_likes.recipeId, recipeId),
              eq(recipe_likes.userId, userId)
            )
          );
      } else {
        // Add like
        await db
          .insert(recipe_likes)
          .values({
            recipeId,
            userId
          });
      }

      // Get updated recipe with like count
      const recipe = await this.getRecipe(recipeId);

      if (!recipe) {
        throw new Error("Recipe not found after updating");
      }

      return recipe;
    } catch (error) {
      console.error("Error in likeRecipe:", error);
      throw error;
    }
  }

  async hasUserLikedRecipe(recipeId: number, userId: number): Promise<boolean> {
    const likes = await db
      .select()
      .from(recipe_likes)
      .where(
        and(
          eq(recipe_likes.recipeId, recipeId),
          eq(recipe_likes.userId, userId)
        )
      );
    return likes.length > 0;
  }

  async forkRecipe(id: number, userId: number): Promise<Recipe> {
    // Get original recipe
    const originalRecipe = await this.getRecipe(id);

    if (!originalRecipe) throw new Error("Recipe not found");

    // Remove likes and other fields we don't want to copy
    const { id: _, likes: __, ...recipeToCopy } = originalRecipe;

    // Insert forked recipe
    const forkedRecipe = await db
      .insert(recipes)
      .values({
        ...recipeToCopy,
        createdBy: userId,
        forkedFrom: id,
        createdAt: new Date()
      })
      .returning();

    return {
      ...forkedRecipe[0],
      createdAt: new Date(forkedRecipe[0].createdAt),
      likes: 0 // New forked recipe starts with 0 likes
    } as Recipe;
  }

  async updateRecipe(id: number, data: Partial<Recipe>): Promise<Recipe> {
    // Remove likes field if it exists in data to prevent issues
    const { likes, ...updateData } = data;

    const [recipe] = await db
      .update(recipes)
      .set(updateData)
      .where(eq(recipes.id, id))
      .returning({
        id: recipes.id,
        title: recipes.title,
        description: recipes.description,
        ingredients: recipes.ingredients,
        instructions: recipes.instructions,
        nutritionInfo: recipes.nutritionInfo,
        prepTime: recipes.prepTime,
        imageUrl: recipes.imageUrl,
        createdBy: recipes.createdBy,
        createdAt: recipes.createdAt,
        forkedFrom: recipes.forkedFrom,
        sustainabilityScore: recipes.sustainabilityScore,
        wastageReduction: recipes.wastageReduction
      });

    // Get the likes count
    const likeCount = await this.getRecipeLikesCount(id);

    return {
      ...recipe,
      createdAt: new Date(recipe.createdAt),
      likes: likeCount
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

  async deleteRecipeConsumption(recipeId: number): Promise<void> {
    await db.delete(recipeConsumption)
      .where(eq(recipeConsumption.recipeId, recipeId));
  }

  async deleteRecipe(id: number): Promise<void> {
    try {
      // Sequential cleanup operations
      // 1. Update any recipes that were forked from this one to remove the reference
      await db
        .update(recipes)
        .set({ forkedFrom: null })
        .where(eq(recipes.forkedFrom, id));

      // 2. Update any community posts that reference this recipe to mark it as deleted
      await db
        .update(communityPosts)
        .set({ recipeId: null })
        .where(eq(communityPosts.recipeId, id));

      // 3. Clean up any consumption records for this recipe
      await db
        .delete(recipeConsumption)
        .where(eq(recipeConsumption.recipeId, id));

      // 4. Clean up any likes for this recipe
      await db
        .delete(recipe_likes)
        .where(eq(recipe_likes.recipeId, id));

      // 5. Finally delete the recipe
      await db
        .delete(recipes)
        .where(eq(recipes.id, id));
    } catch (error) {
      console.error("Error in deleteRecipe:", error);
      throw error;
    }
  }

  async getMealPlansByUser(userId: number) {
    return db
      .select()
      .from(mealPlans)
      .where(eq(mealPlans.userId, userId))
      .orderBy(desc(mealPlans.createdAt));
  }

  async createMealPlan(plan: Omit<typeof mealPlans.$inferInsert, "id">) {
    const [newPlan] = await db
      .insert(mealPlans)
      .values(plan)
      .returning();
    return newPlan;
  }

  async updateMealPlan(id: number, data: Partial<typeof mealPlans.$inferSelect>) {
    const [plan] = await db
      .update(mealPlans)
      .set(data)
      .where(eq(mealPlans.id, id))
      .returning();
    return plan;
  }

  async deleteMealPlan(id: number): Promise<void> {
    await db.delete(mealPlans).where(eq(mealPlans.id, id));
  }

  async getCurrentNutritionGoal(userId: number): Promise<NutritionGoal | null> {
    const [goal] = await db
      .select()
      .from(nutritionGoals)
      .where(
        and(
          eq(nutritionGoals.userId, userId),
          eq(nutritionGoals.isActive, true)
        )
      );
    return goal || null;
  }

  async createNutritionGoal(goal: Omit<NutritionGoal, "id">): Promise<NutritionGoal> {
    const [newGoal] = await db
      .insert(nutritionGoals)
      .values(goal)
      .returning();
    return newGoal;
  }

  async deactivateNutritionGoals(userId: number): Promise<void> {
    await db
      .update(nutritionGoals)
      .set({ isActive: false })
      .where(
        and(
          eq(nutritionGoals.userId, userId),
          eq(nutritionGoals.isActive, true)
        )
      );
  }

  async updateNutritionProgress(
    goalId: number, 
    progress: NutritionGoal["progress"]
  ): Promise<NutritionGoal> {
    const [updated] = await db
      .update(nutritionGoals)
      .set({ progress })
      .where(eq(nutritionGoals.id, goalId))
      .returning();
    return updated;
  }

  async trackRecipeConsumption(data: Omit<RecipeConsumption, "id">): Promise<RecipeConsumption> {
    const [consumption] = await db
      .insert(recipeConsumption)
      .values(data)
      .returning();
    return consumption;
  }

  async getRecipeConsumptionHistory(
    userId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<RecipeConsumption[]> {
    let query = db
      .select()
      .from(recipeConsumption)
      .where(eq(recipeConsumption.userId, userId));

    if (startDate) {
      query = query.and(gte(recipeConsumption.consumedAt, startDate));
    }
    if (endDate) {
      query = query.and(lte(recipeConsumption.consumedAt, endDate));
    }

    return query.orderBy(desc(recipeConsumption.consumedAt));
  }

  async getRecipeConsumptionWithDetails(
    userId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]> {
    let query = db
      .select({
        consumption: recipeConsumption,
        recipe: recipes
      })
      .from(recipeConsumption)
      .leftJoin(recipes, eq(recipeConsumption.recipeId, recipes.id))
      .where(eq(recipeConsumption.userId, userId));

    if (startDate) {
      query = query.and(gte(recipeConsumption.consumedAt, startDate));
    }
    if (endDate) {
      query = query.and(lte(recipeConsumption.consumedAt, endDate));
    }

    const results = await query.orderBy(desc(recipeConsumption.consumedAt));

    return results.map(r => ({
      ...r.consumption,
      recipe: r.recipe
    }));
  }
}

export const storage = new DatabaseStorage();