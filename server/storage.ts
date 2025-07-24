// Import external dependencies first
import session from "express-session";
import MemoryStore from "memorystore";
import { eq, and, gte, lte, desc, count } from "drizzle-orm";

// Import local modules after
import { db, sql, pool } from "./db";  // sql is exported from db now
import {
  users,
  recipes,
  groceryLists,
  pantryItems,
  communityPosts,
  recipe_likes,
  mealPlans,
  nutritionGoals,
  recipeConsumption,
  kitchenEquipment,
  culturalRecipes,
  culturalCuisines,
  insertUserSchema,
  userPreferences,
  kitchenStorageLocations
} from "./shared/schema";  // Remove .js extension for TypeScript

const MemorySessionStore = MemoryStore(session);

class DatabaseStorage {
  sessionStore: any;
  constructor() {
    this.sessionStore = new MemorySessionStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });
  }

  convertDatesToISOString(data) {
    if (data && data.expiryDate) {
      return {
        ...data,
        expiryDate: new Date(data.expiryDate)
      };
    }
    return data;
  }

  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user) {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id, data) {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id) {
    try {
      // Order matters - delete dependent tables first before their references
      
      // 1. Delete recipe consumption history
      await db.delete(recipeConsumption)
        .where(eq(recipeConsumption.userId, id));
      
      // 2. Delete recipe likes by user
      await db.delete(recipe_likes)
        .where(eq(recipe_likes.userId, id));
      
      // 3. Update community posts to remove references to user's recipes
      const userRecipes = await db.select({ id: recipes.id })
        .from(recipes)
        .where(eq(recipes.createdBy, id));
      
      const recipeIds = userRecipes.map(recipe => recipe.id);
      
      if (recipeIds.length > 0) {
        for (const recipeId of recipeIds) {
          await db.update(communityPosts)
            .set({ recipeId: null })
            .where(eq(communityPosts.recipeId, recipeId));
        }
      }
      
      // 4. Delete community posts by user
      await db.delete(communityPosts)
        .where(eq(communityPosts.userId, id));
      
      // 5. Now we can delete user recipes safely
      await db.delete(recipes)
        .where(eq(recipes.createdBy, id));
      
      // 6. Delete grocery lists
      await db.delete(groceryLists)
        .where(eq(groceryLists.userId, id));
      
      // 7. Delete pantry items
      await db.delete(pantryItems)
        .where(eq(pantryItems.userId, id));
      
      // 8. Delete meal plans
      await db.delete(mealPlans)
        .where(eq(mealPlans.userId, id));
      
      // 9. Delete nutrition goals
      await db.delete(nutritionGoals)
        .where(eq(nutritionGoals.userId, id));
      
      // 10. Delete kitchen equipment
      await db.delete(kitchenEquipment)
        .where(eq(kitchenEquipment.userId, id));
      
      // 11. Delete kitchen storage locations if they exist in schema
      try {
        await db.delete(kitchenStorageLocations)
          .where(eq(kitchenStorageLocations.userId, id));
      } catch (error) {
        console.log("Note: Skip kitchenStorageLocations if table doesn't exist");
      }
      
      // 12. Delete cultural recipes and cuisines
      await db.delete(culturalRecipes)
        .where(eq(culturalRecipes.createdBy, id));

      await db.delete(culturalCuisines)
        .where(eq(culturalCuisines.createdBy, id));

      // 13. Delete user preferences
      await db.delete(userPreferences)
        .where(eq(userPreferences.userId, id));

      // 14. Finally, delete the user account
      await db.delete(users)
        .where(eq(users.id, id));
    } catch (error) {
      console.error("Error in deleteUser:", error);
      throw error;
    }
  }

  async getRecipes() {
    const recipesList = await db.select().from(recipes);

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

    return recipesWithLikes;
  }

  async getRecipe(id) {
    const [recipe] = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, id));

    if (recipe) {
      const likeCount = await this.getRecipeLikesCount(id);
      return {
        ...recipe,
        createdAt: new Date(recipe.createdAt),
        likes: likeCount // Add likes count to the recipe
      };
    }
    return undefined;
  }

  async getRecipeLikesCount(recipeId) {
    const result = await db
      .select({ count: count() })
      .from(recipe_likes)
      .where(eq(recipe_likes.recipeId, recipeId));
    
    return result[0]?.count || 0;
  }

  async createRecipe(recipe) {
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
    };
  }

  async likeRecipe(recipeId, userId) {
    try {
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
        await db
          .delete(recipe_likes)
          .where(
            and(
              eq(recipe_likes.recipeId, recipeId),
              eq(recipe_likes.userId, userId)
            )
          );
      } else {
        await db
          .insert(recipe_likes)
          .values({
            recipeId,
            userId
          });
      }

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

  async hasUserLikedRecipe(recipeId, userId) {
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

  async forkRecipe(id, userId) {
    const originalRecipe = await this.getRecipe(id);

    if (!originalRecipe) throw new Error("Recipe not found");

    // Remove likes and other fields we don't want to copy
    const { id: _, likes: __, ...recipeToCopy } = originalRecipe;

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
    };
  }

  async updateRecipe(id, data) {
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

    const likeCount = await this.getRecipeLikesCount(id);

    return {
      ...recipe,
      createdAt: new Date(recipe.createdAt),
      likes: likeCount
    };
  }

  async getGroceryListsByUser(userId) {
    return db.select().from(groceryLists).where(eq(groceryLists.userId, userId));
  }

  async createGroceryList(list) {
    const [newList] = await db.insert(groceryLists).values(list).returning();
    return newList;
  }

  async updateGroceryList(id, data) {
    const [list] = await db
      .update(groceryLists)
      .set(data)
      .where(eq(groceryLists.id, id))
      .returning();
    return list;
  }

  async getPantryItemsByUser(userId) {
    return db.select().from(pantryItems).where(eq(pantryItems.userId, userId));
  }

  async createPantryItem(item) {
    const [newItem] = await db.insert(pantryItems).values(item).returning();
    return newItem;
  }

  async updatePantryItem(id, data) {
    const [item] = await db
      .update(pantryItems)
      .set(data)
      .where(eq(pantryItems.id, id))
      .returning();
    return item;
  }

  async deletePantryItem(id) {
    await db.delete(pantryItems).where(eq(pantryItems.id, id));
  }

  async getCommunityPosts(userId) {
    const posts = await db.select().from(communityPosts);
    
    const filteredPosts = userId 
      ? posts.filter(post => {
          const hiddenFor = Array.isArray(post.hiddenFor) ? post.hiddenFor : [];
          return !hiddenFor.includes(userId);
        })
      : posts;

    return filteredPosts;
  }

  async createCommunityPost(post) {
    // Ensure id field is not included to avoid constraint violations
    const { id, ...postData } = post;
    console.log('[Storage] Creating community post with data:', postData);

    const [newPost] = await db.insert(communityPosts).values(postData).returning();
    console.log('[Storage] Created community post successfully:', newPost);
    return newPost;
  }

  async getCommunityPost(id) {
    const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, id));
    return post;
  }

  async updateCommunityPost(id, data) {
    const [post] = await db
      .update(communityPosts)
      .set(data)
      .where(eq(communityPosts.id, id))
      .returning();
    return post;
  }

  async deleteGroceryList(id) {
    await db.delete(groceryLists).where(eq(groceryLists.id, id));
  }

  async deleteCommunityPost(id) {
    await db.delete(communityPosts).where(eq(communityPosts.id, id));
  }

  async deleteRecipeConsumption(recipeId) {
    await db.delete(recipeConsumption)
      .where(eq(recipeConsumption.recipeId, recipeId));
  }

  async deleteRecipe(id) {
    try {
      // Sequential cleanup operations
      await db
        .update(recipes)
        .set({ forkedFrom: null })
        .where(eq(recipes.forkedFrom, id));

      await db
        .update(communityPosts)
        .set({ recipeId: null })
        .where(eq(communityPosts.recipeId, id));

      await db
        .delete(recipeConsumption)
        .where(eq(recipeConsumption.recipeId, id));

      await db
        .delete(recipe_likes)
        .where(eq(recipe_likes.recipeId, id));

      await db
        .delete(recipes)
        .where(eq(recipes.id, id));
    } catch (error) {
      console.error("Error in deleteRecipe:", error);
      throw error;
    }
  }

  async getMealPlansByUser(userId) {
    return db
      .select()
      .from(mealPlans)
      .where(eq(mealPlans.userId, userId))
      .orderBy(desc(mealPlans.createdAt));
  }

  async createMealPlan(plan) {
    const [newPlan] = await db
      .insert(mealPlans)
      .values(plan)
      .returning();
    return newPlan;
  }

  async updateMealPlan(id, data) {
    const [plan] = await db
      .update(mealPlans)
      .set(data)
      .where(eq(mealPlans.id, id))
      .returning();
    return plan;
  }

  async deleteMealPlan(id) {
    await db.delete(mealPlans).where(eq(mealPlans.id, id));
  }

  async getCurrentNutritionGoal(userId) {
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

  async createNutritionGoal(goal) {
    const [newGoal] = await db
      .insert(nutritionGoals)
      .values(goal)
      .returning();
    return newGoal;
  }

  async deactivateNutritionGoals(userId) {
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

  async updateNutritionProgress(goalId, progress) {
    const [updated] = await db
      .update(nutritionGoals)
      .set({ progress })
      .where(eq(nutritionGoals.id, goalId))
      .returning();
    return updated;
  }

  async trackRecipeConsumption(data) {
    const [consumption] = await db
      .insert(recipeConsumption)
      .values(data)
      .returning();
    return consumption;
  }

  async getRecipeConsumptionHistory(userId, startDate, endDate) {
    let conditions = [eq(recipeConsumption.userId, userId)];

    if (startDate) {
      conditions.push(gte(recipeConsumption.consumedAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(recipeConsumption.consumedAt, endDate));
    }

    return db
      .select()
      .from(recipeConsumption)
      .where(and(...conditions))
      .orderBy(desc(recipeConsumption.consumedAt));
  }

  async getRecipeConsumptionWithDetails(userId, startDate, endDate, mealType) {
    let conditions = [eq(recipeConsumption.userId, userId)];

    if (startDate) {
      conditions.push(gte(recipeConsumption.consumedAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(recipeConsumption.consumedAt, endDate));
    }
    if (mealType && mealType !== 'all') {
      conditions.push(eq(recipeConsumption.mealType, mealType));
    }

    const results = await db
      .select({
        consumption: recipeConsumption,
        recipe: recipes
      })
      .from(recipeConsumption)
      .leftJoin(recipes, eq(recipeConsumption.recipeId, recipes.id))
      .where(and(...conditions))
      .orderBy(desc(recipeConsumption.consumedAt));

    return results.map(r => ({
      ...r.consumption,
      recipe: r.recipe
    }));
  }

  async hidePostForUser(postId, userId) {
    const post = await this.getCommunityPost(postId);
    if (!post) {
      throw new Error("Post not found");
    }

    const hiddenFor = Array.isArray(post.hiddenFor) ? [...post.hiddenFor] : [];
    if (!hiddenFor.includes(userId)) {
      hiddenFor.push(userId);
    }

    await db.update(communityPosts)
      .set({ hiddenFor: hiddenFor })
      .where(eq(communityPosts.id, postId));
  }

  async addCulturalRecipe(recipe) {
    const now = new Date();
    const [newRecipe] = await db
      .insert(culturalRecipes)
      .values({
        ...recipe,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return newRecipe;
  }

  async updateCulturalRecipe(id, updates) {
    const now = new Date();
    const [updatedRecipe] = await db
      .update(culturalRecipes)
      .set({
        ...updates,
        updatedAt: now
      })
      .where(eq(culturalRecipes.id, id))
      .returning();
    return updatedRecipe;
  }
}

// Create and export a singleton instance
export const storage = new DatabaseStorage();
  