import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { sql } from "drizzle-orm";
import { 
  insertRecipeSchema, 
  insertGroceryListSchema, 
  insertPantryItemSchema, 
  insertCommunityPostSchema,
  moodEntrySchema, 
  type MoodEntry,
  insertNutritionGoalSchema,
  culturalCuisines,
  culturalRecipes,
  culturalTechniques,
  pantryItems,
  kitchenEquipment
} from "@shared/schema";
import { 
  analyzeMoodSentiment, 
  generateMoodInsights, 
  generateAIMealPlan,
  getNutritionRecommendations,
} from "../ai-services/recipe-ai";
import {
  findIngredientSubstitutes,
  analyzeAuthenticityScore,
  findComplementaryDishes,
  getServingEtiquetteGuide
} from "../ai-services/cultural-cuisine-service";
import type { User } from "@shared/schema";
import { desc, eq, and, count } from "drizzle-orm";
import { db } from "./db";

// Add type declaration extension
declare global {
  namespace Express {
    interface User extends Omit<User, "password"> {}
  }
}

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Middleware to check if user is authenticated and owns the resource
const isResourceOwner = (resourceType: 'recipe' | 'post') => async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    let resource;
    const userId = req.user!.id;

    if (resourceType === 'recipe') {
      resource = await storage.getRecipe(parseInt(req.params.id));
      if (resource && resource.createdBy !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
    } else if (resourceType === 'post') {
      resource = await storage.getCommunityPost(parseInt(req.params.id));
      if (resource && resource.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Async handler to catch errors in async routes
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Add a helper function for database operations with retries
const withDbRetry = async <T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.error(`Database operation failed (attempt ${i + 1}/${maxRetries}):`, error);
      
      // Check if it's a connection error
      if (error.message?.includes('fetch failed') && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // Setup authentication middleware and routes first
  setupAuth(app);

  // ----------------- Recipes Routes -----------------
  app.get(
    "/api/recipes",
    asyncHandler(async (_req, res) => {
      const recipes = await storage.getRecipes();
      res.json(recipes);
    })
  );

  app.post(
    "/api/recipes",
    asyncHandler(async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const validated = insertRecipeSchema.parse(req.body);
      
      // Use the client-calculated sustainability score directly
      const sustainabilityScore = validated.sustainabilityScore || 50;

      const recipe = await storage.createRecipe({
        ...validated,
        createdBy: req.user!.id,
        createdAt: new Date(),
        nutritionInfo: validated.nutritionInfo,
        title: typeof validated.title === "string" ? validated.title : "",
        description: typeof validated.description === "string" ? validated.description : "",
        ingredients: validated.ingredients,
        instructions: validated.instructions,
        imageUrl: typeof validated.imageUrl === "string" ? validated.imageUrl : "",
        prepTime: typeof validated.prepTime === "number" ? validated.prepTime : 0,
        likes: 0,
        forkedFrom: null,
        sustainabilityScore,
        wastageReduction: validated.wastageReduction,
      });
      res.status(201).json(recipe);
    })
  );

  app.patch(
    "/api/recipes/:id",
    isResourceOwner("recipe"),
    asyncHandler(async (req, res) => {
      const recipe = await storage.updateRecipe(parseInt(req.params.id), req.body);
      res.json(recipe);
    })
  );

  app.delete(
    "/api/recipes/:id",
    isResourceOwner("recipe"),
    asyncHandler(async (req, res) => {
      try {
        const recipeId = parseInt(req.params.id);
        const forceDelete = req.query.force === 'true';

        if (forceDelete) {
          await storage.deleteRecipeConsumption(recipeId);
        }

        // Check if the recipe has likes before deleting
        const recipe = await storage.getRecipe(recipeId);
        if (recipe && recipe.likes > 0) {
          return res.status(403).json({ 
            message: "Cannot delete recipe that has likes",
            details: "This recipe has been liked by others in the community. As it's valuable to them, it cannot be deleted."
          });
        }
        await storage.deleteRecipe(recipeId);
        res.sendStatus(204);
      } catch (error: any) {
        console.error("Error deleting recipe:", error);
        if (error.message?.includes("consumption records")) {
          return res.status(409).json({ 
            message: "Recipe has consumption records",
            details: "This recipe has consumption records. Delete them first using the 'Delete History' button or use force delete.",
            hasConsumptionRecords: true
          });
        }
        res.status(500).json({ message: "Failed to delete recipe" });
      }
    })
  );

  app.delete(
    "/api/recipes/:id/consumption",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      const recipeId = parseInt(req.params.id);
      await storage.deleteRecipeConsumption(recipeId);
      res.sendStatus(204);
    })
  );

  app.post(
    "/api/recipes/:id/like",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const recipeId = parseInt(req.params.id);
      // Check if recipe exists
      const recipe = await storage.getRecipe(recipeId);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      const updatedRecipe = await storage.likeRecipe(recipeId, req.user.id);
      res.json(updatedRecipe);
    })
  );

  app.get(
    "/api/recipes/:id/liked",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const hasLiked = await storage.hasUserLikedRecipe(parseInt(req.params.id), req.user.id);
      res.json({ hasLiked });
    })
  );

  app.post(
    "/api/recipes/:id/fork",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const recipe = await storage.forkRecipe(parseInt(req.params.id), req.user.id);
      res.json(recipe);
    })
  );

  app.post(
    "/api/recipes/:id/consume",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const recipeId = parseInt(req.params.id);
      const { servings = 1, mealType = "snack" } = req.body;

      // Track recipe consumption
      const consumption = await storage.trackRecipeConsumption({
        userId: req.user.id,
        recipeId,
        servings,
        mealType,
        consumedAt: new Date()
      });

      // Get recipe details for nutrition tracking
      const recipe = await storage.getRecipe(recipeId);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }

      // Get current nutrition goal
      const currentGoal = await storage.getCurrentNutritionGoal(req.user.id);
      if (currentGoal) {
        const today = new Date().toISOString().split('T')[0];
        const existingProgress = currentGoal.progress || [];
        const todayEntry = existingProgress.find((p: any) => p.date === today);
        
        const nutritionInfo = recipe.nutritionInfo as any;
        const scaledNutrition = {
          calories: nutritionInfo.calories * servings,
          protein: nutritionInfo.protein * servings,
          carbs: nutritionInfo.carbs * servings,
          fat: nutritionInfo.fat * servings,
        };

        const newProgress = todayEntry
          ? existingProgress.map((p: any) => p.date === today ? {
              ...p,
              calories: p.calories + scaledNutrition.calories,
              protein: p.protein + scaledNutrition.protein,
              carbs: p.carbs + scaledNutrition.carbs,
              fat: p.fat + scaledNutrition.fat,
            } : p)
          : [...existingProgress, {
              date: today,
              ...scaledNutrition,
              completed: false,
            }];

        await storage.updateNutritionProgress(currentGoal.id, newProgress);
      }

      res.json(consumption);
    })
  );

  app.get(
    "/api/recipes/consumption-history",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const history = await storage.getRecipeConsumptionWithDetails(
        req.user.id,
        startDate,
        endDate
      );

      res.json(history);
    })
  );

  // ----------------- Grocery Lists Routes -----------------
  app.get(
    "/api/grocery-lists",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const lists = await storage.getGroceryListsByUser(req.user.id);
      res.json(lists);
    })
  );

  app.post(
    "/api/grocery-lists",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      const validated = insertGroceryListSchema.parse(req.body);
      const list = await storage.createGroceryList({
        ...validated,
        userId: req.user.id,
        completed: validated.completed ?? false,
        expiryDates: validated.expiryDates ?? null,
        smartSubstitutions: validated.smartSubstitutions ?? null,
      });
      res.status(201).json(list);
    })
  );

  app.patch(
    "/api/grocery-lists/:id",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      const list = await storage.updateGroceryList(parseInt(req.params.id), req.body);
      res.json(list);
    })
  );

  app.delete(
    "/api/grocery-lists/:id",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      await storage.deleteGroceryList(parseInt(req.params.id));
      res.sendStatus(204);
    })
  );

  // ----------------- Pantry Items Routes -----------------
  app.get(
    "/api/pantry",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const items = await storage.getPantryItemsByUser(req.user.id);
      res.json(items);
    })
  );

  app.post(
    "/api/pantry",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const data = {
        ...req.body,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
      };
      const validated = insertPantryItemSchema.parse(data);
      const item = await storage.createPantryItem({
        ...validated,
        userId: req.user.id,
        expiryDate: validated.expiryDate ?? null,
        category: validated.category ?? null,
      });
      res.status(201).json(item);
    })
  );

  app.patch(
    "/api/pantry/:id",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      const itemId = parseInt(req.params.id);
      const data = {
        ...req.body,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
      };
      const item = await storage.updatePantryItem(itemId, data);
      res.json(item);
    })
  );

  app.delete(
    "/api/pantry/:id",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      const itemId = parseInt(req.params.id);
      if (isNaN(itemId)) {
        res.status(400).json({ error: "Invalid item ID" });
        return;
      }
      await storage.deletePantryItem(itemId);
      res.status(204).send();
    })
  );

  // ----------------- Community Posts Routes -----------------
  app.get(
    "/api/community",
    asyncHandler(async (_req, res) => {
      const posts = await storage.getCommunityPosts();
      const postsWithRecipes = await Promise.all(
        posts.map(async (post) => {
          if (post.type === "RECIPE_SHARE" && post.recipeId) {
            const recipe = await storage.getRecipe(post.recipeId);
            return { ...post, recipe };
          }
          return post;
        })
      );
      res.json(postsWithRecipes);
    })
  );

  app.post(
    "/api/community",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      const validated = insertCommunityPostSchema.parse(req.body);
      const post = await storage.createCommunityPost({
        ...validated,
        userId: req.user!.id,
        createdAt: new Date(),
        recipeId: validated.recipeId ?? null,
        location: validated.location ?? null,
      });
      res.status(201).json(post);
    })
  );

  app.patch(
    "/api/community/:id",
    isResourceOwner("post"),
    asyncHandler(async (req, res) => {
      const post = await storage.updateCommunityPost(parseInt(req.params.id), req.body);
      res.json(post);
    })
  );

  app.delete(
    "/api/community/:id",
    isResourceOwner("post"),
    asyncHandler(async (req, res) => {
      await storage.deleteCommunityPost(parseInt(req.params.id));
      res.sendStatus(204);
    })
  );

  app.post(
    "/api/pantryItems",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const validated = insertPantryItemSchema.parse(req.body);
      const item = await storage.createPantryItem({
        ...validated,
        userId: user.id,
      });
      res.status(201).json(item);
    })
  );

  // ----------------- Mood Journal Routes -----------------
  app.post(
    "/api/mood-journal",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      const { recipeId, entry } = req.body;
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(req.user.id);
      if (!user) return res.sendStatus(404);

      // Analyze sentiment using AI
      const { sentiment, emotions } = await analyzeMoodSentiment(entry);

      const moodJournal = (user.moodJournal || []) as MoodEntry[];
      moodJournal.push({
        recipeId,
        entry,
        timestamp: new Date().toISOString(),
        sentiment,
        emotions
      });

      const updatedUser = await storage.updateUser(user.id, {
        ...user,
        moodJournal,
      });

      res.json(updatedUser);
    })
  );

  app.get(
    "/api/mood-journal/:recipeId",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(req.user.id);
      if (!user) return res.sendStatus(404);

      const recipeEntries = ((user.moodJournal || []) as MoodEntry[]).filter(
        entry => entry.recipeId === parseInt(req.params.recipeId)
      );

      res.json(recipeEntries);
    })
  );

  app.get(
    "/api/mood-journal/:recipeId/insights",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(req.user.id);
      if (!user) return res.sendStatus(404);

      const recipeEntries = ((user.moodJournal || []) as MoodEntry[]).filter(
        entry => entry.recipeId === parseInt(req.params.recipeId)
      );

      if (recipeEntries.length === 0) {
        return res.json({ insights: "Not enough entries to generate insights yet." });
      }

      const { insights } = await generateMoodInsights(recipeEntries);
      res.json({ insights });
    })
  );

  app.delete(
    "/api/mood-journal/:recipeId/:timestamp",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(req.user.id);
      if (!user) return res.sendStatus(404);

      const timestamp = decodeURIComponent(req.params.timestamp);
      const moodJournal = (user.moodJournal || []) as MoodEntry[];
      const updatedJournal = moodJournal.filter(entry => 
        entry.recipeId !== parseInt(req.params.recipeId) || entry.timestamp !== timestamp
      );

      await storage.updateUser(user.id, {
        ...user,
        moodJournal: updatedJournal,
      });

      res.json({ message: "Entry deleted successfully" });
    })
  );

  // ----------------- Nutrition Goals Routes -----------------
  app.get(
    "/api/nutrition-goals/current",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const goal = await storage.getCurrentNutritionGoal(req.user.id);
      res.json(goal);
    })
  );

  app.post(
    "/api/nutrition-goals",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Date coercion is now handled by the schema
      const validated = insertNutritionGoalSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      // Deactivate any existing active goals
      await storage.deactivateNutritionGoals(user.id);
      
      // Create new goal
      const goal = await storage.createNutritionGoal(validated);
      res.status(201).json(goal);
    })
  );

  app.post(
    "/api/nutrition-goals/progress",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { goalId, progress } = req.body;
      const updatedGoal = await storage.updateNutritionProgress(goalId, progress);
      res.json(updatedGoal);
    })
  );

  app.get(
    "/api/nutrition-goals/progress/today",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const currentGoal = await storage.getCurrentNutritionGoal(req.user.id);
      if (!currentGoal) {
        return res.status(404).json({ message: "No active nutrition goal" });
      }

      const today = new Date().toISOString().split('T')[0];
      const todayProgress = currentGoal.progress?.find((p: any) => p.date === today) || {
        date: today,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        completed: false,
      };

      res.json(todayProgress);
    })
  );

  app.get(
    "/api/nutrition-goals/insights",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get current goal and progress
      const currentGoal = await storage.getCurrentNutritionGoal(req.user.id);
      if (!currentGoal) {
        return res.status(404).json({ message: "No active nutrition goal" });
      }

      // Get user preferences - fixed to use correct method name
      const user = await storage.getUser(req.user.id);
      const preferences = user?.preferences?.dietaryPreferences || [];

      // Get AI recommendations
      const recommendations = await getNutritionRecommendations(
        {
          calories: currentGoal.dailyCalories,
          protein: currentGoal.dailyProtein,
          carbs: currentGoal.dailyCarbs,
          fat: currentGoal.dailyFat,
        },
        currentGoal.progress || [],
        preferences
      );

      res.json(recommendations);
    })
  );

  // ----------------- Meal Plan Routes -----------------
  app.get(
    "/api/meal-plans",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const plans = await storage.getMealPlansByUser(req.user.id);
      res.json(plans);
    })
  );

  app.post(
    "/api/meal-plans",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { title, startDate, endDate, preferences, dietaryRestrictions, calorieTarget, days } = req.body;

      // Generate AI meal plan
      const generatedPlan = await generateAIMealPlan(
        preferences,
        days,
        dietaryRestrictions,
        calorieTarget
      );

      // Create meal plan in database
      const plan = await storage.createMealPlan({
        userId: req.user.id,
        title,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        preferences,
        meals: generatedPlan,
        createdAt: new Date(),
        isActive: true
      });

      res.status(201).json(plan);
    })
  );

  app.patch(
    "/api/meal-plans/:id",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      const plan = await storage.updateMealPlan(parseInt(req.params.id), req.body);
      res.json(plan);
    })
  );

  app.delete(
    "/api/meal-plans/:id",
    isAuthenticated,
    asyncHandler(async (req, res) => {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const planId = parseInt(req.params.id);
      await storage.deleteMealPlan(planId);
      res.sendStatus(204);
    })
  );

  // Kitchen Equipment Routes
  app.get('/api/kitchen-equipment', async (req, res) => {
    try {
      const equipment = await db.select().from(kitchenEquipment)
        .where(eq(kitchenEquipment.userId, req.user.id));
      res.json(equipment);
    } catch (error) {
      console.error('Error fetching kitchen equipment:', error);
      res.status(500).json({ error: 'Failed to fetch kitchen equipment' });
    }
  });

  app.post('/api/kitchen-equipment', async (req, res) => {
    try {
      const data = {
        ...req.body,
        userId: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const [equipment] = await db.insert(kitchenEquipment).values(data).returning();
      res.json(equipment);
    } catch (error) {
      console.error('Error adding kitchen equipment:', error);
      res.status(500).json({ error: 'Failed to add kitchen equipment' });
    }
  });

  app.delete('/api/kitchen-equipment/:id', async (req, res) => {
    try {
      await db.delete(kitchenEquipment)
        .where(and(
          eq(kitchenEquipment.id, parseInt(req.params.id)),
          eq(kitchenEquipment.userId, req.user.id)
        ));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting kitchen equipment:', error);
      res.status(500).json({ error: 'Failed to delete kitchen equipment' });
    }
  });

  app.post('/api/kitchen-equipment/:id/maintenance', async (req, res) => {
    try {
      const [equipment] = await db.update(kitchenEquipment)
        .set({
          lastMaintenanceDate: req.body.maintenanceDate,
          maintenanceNotes: req.body.notes,
          updatedAt: new Date(),
        })
        .where(and(
          eq(kitchenEquipment.id, parseInt(req.params.id)),
          eq(kitchenEquipment.userId, req.user.id)
        ))
        .returning();
      res.json(equipment);
    } catch (error) {
      console.error('Error updating maintenance:', error);
      res.status(500).json({ error: 'Failed to update maintenance' });
    }
  });

  // ----------------- Cultural Cuisine Routes -----------------
  app.get('/api/cultural-cuisines', async (req, res) => {
    try {
      console.log('Fetching cultural cuisines...');
      
      const cuisines = await withDbRetry(async () => {
        const result = await db.select().from(culturalCuisines);
        return result;
      });

      if (!cuisines || !Array.isArray(cuisines)) {
        console.error('Invalid cuisines data structure:', cuisines);
        throw new Error('Invalid data structure returned from database');
      }

      // Process each cuisine carefully with error handling
      const processedCuisines = cuisines.map(cuisine => {
        try {
          return {
            ...cuisine,
            keyIngredients: Array.isArray(cuisine.keyIngredients) 
              ? cuisine.keyIngredients 
              : typeof cuisine.keyIngredients === 'string'
                ? JSON.parse(cuisine.keyIngredients)
                : [],
            cookingTechniques: Array.isArray(cuisine.cookingTechniques)
              ? cuisine.cookingTechniques
              : typeof cuisine.cookingTechniques === 'string'
                ? JSON.parse(cuisine.cookingTechniques)
                : [],
            culturalContext: typeof cuisine.culturalContext === 'object' && cuisine.culturalContext !== null
              ? cuisine.culturalContext
              : typeof cuisine.culturalContext === 'string'
                ? JSON.parse(cuisine.culturalContext)
                : {},
            servingEtiquette: typeof cuisine.servingEtiquette === 'object' && cuisine.servingEtiquette !== null
              ? cuisine.servingEtiquette
              : typeof cuisine.servingEtiquette === 'string'
                ? JSON.parse(cuisine.servingEtiquette)
                : {}
          };
        } catch (parseError) {
          console.error('Error processing cuisine:', cuisine, parseError);
          return cuisine;
        }
      });

      res.json(processedCuisines);
    } catch (error) {
      console.error('Error fetching cuisines:', error);
      if (error instanceof Error) {
        console.error('Full error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        });
      }
      res.status(500).json({ 
        error: 'Failed to fetch cuisines',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  app.post('/api/cultural-cuisines', async (req, res) => {
    try {
      const { name, region, description, imageUrl, bannerUrl, keyIngredients, cookingTechniques, culturalContext, servingEtiquette } = req.body;

      const [cuisine] = await db.insert(culturalCuisines).values({
        name,
        region,
        description,
        imageUrl,
        bannerUrl,
        keyIngredients,
        cookingTechniques,
        culturalContext,
        servingEtiquette,
        createdAt: new Date()
      }).returning();

      res.status(201).json(cuisine);
    } catch (error) {
      console.error('Error adding cuisine:', error);
      res.status(500).json({ error: 'Failed to add cuisine' });
    }
  });

  app.get('/api/cultural-cuisines/:id', async (req, res) => {
    try {
      const [cuisine] = await db.select()
        .from(culturalCuisines)
        .where(eq(culturalCuisines.id, parseInt(req.params.id)));
      
      if (!cuisine) {
        return res.status(404).json({ error: 'Cuisine not found' });
      }

      // Get all recipes for this cuisine
      const recipes = await db.select()
        .from(culturalRecipes)
        .where(eq(culturalRecipes.cuisineId, cuisine.id));

      // Get all techniques for this cuisine
      const techniques = await db.select()
        .from(culturalTechniques)
        .where(eq(culturalTechniques.cuisineId, cuisine.id));

      res.json({
        ...cuisine,
        recipes,
        techniques
      });
    } catch (error) {
      console.error('Error fetching cuisine details:', error);
      res.status(500).json({ error: 'Failed to fetch cuisine details' });
    }
  });

  app.patch('/api/cultural-cuisines/:id', async (req, res) => {
    try {
      const { imageUrl, bannerUrl } = req.body;
      
      const [updatedCuisine] = await db.update(culturalCuisines)
        .set({
          imageUrl,
          bannerUrl,
          updatedAt: new Date()
        })
        .where(eq(culturalCuisines.id, parseInt(req.params.id)))
        .returning();

      if (!updatedCuisine) {
        return res.status(404).json({ error: 'Cuisine not found' });
      }

      res.json(updatedCuisine);
    } catch (error) {
      console.error('Error updating cuisine:', error);
      res.status(500).json({ error: 'Failed to update cuisine' });
    }
  });

  app.post('/api/cultural-recipes', isAuthenticated, async (req, res) => {
    try {
      const { name, description, cuisineId, difficulty = 'beginner', authenticIngredients = [], localSubstitutes = {}, instructions = [], culturalNotes = {}, servingSuggestions = [] } = req.body;

      if (!name || !description || !cuisineId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const [recipe] = await db.insert(culturalRecipes).values({
        name,
        description,
        cuisineId,
        difficulty,
        authenticIngredients,
        localSubstitutes,
        instructions,
        culturalNotes,
        servingSuggestions,
      }).returning();

      res.status(201).json(recipe);
    } catch (error) {
      console.error('Error adding recipe:', error);
      res.status(500).json({ error: 'Failed to add recipe' });
    }
  });

  app.get('/api/cultural-recipes/:id/substitutions', isAuthenticated, async (req, res) => {
    try {
      const [recipe] = await db.select()
        .from(culturalRecipes)
        .where(eq(culturalRecipes.id, parseInt(req.params.id)));

      if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
      }

      // Get user's pantry items
      const userPantry = await db.select()
        .from(pantryItems)
        .where(eq(pantryItems.userId, req.user!.id));

      // Get user's region from preferences
      const user = await storage.getUser(req.user!.id);
      const userRegion = user?.preferences?.region || 'unknown';

      // Find ingredient substitutions
      const substitutions = findIngredientSubstitutes(recipe, userPantry, userRegion);
      const authenticity = analyzeAuthenticityScore(recipe, substitutions);

      res.json({
        substitutions,
        authenticityScore: authenticity.score,
        authenticityFeedback: authenticity.feedback
      });
    } catch (error) {
      console.error('Error finding substitutions:', error);
      res.status(500).json({ error: 'Failed to find substitutions' });
    }
  });

  app.get('/api/cultural-recipes/:id/pairings', async (req, res) => {
    try {
      const [recipe] = await db.select()
        .from(culturalRecipes)
        .where(eq(culturalRecipes.id, parseInt(req.params.id)));

      if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
      }

      const [cuisine] = await db.select()
        .from(culturalCuisines)
        .where(eq(culturalCuisines.id, recipe.cuisineId));

      const pairings = findComplementaryDishes(recipe, {
        region: cuisine.region,
        keyIngredients: cuisine.keyIngredients as string[]
      });

      res.json(pairings);
    } catch (error) {
      console.error('Error finding pairings:', error);
      res.status(500).json({ error: 'Failed to find pairings' });
    }
  });

  app.get('/api/cultural-recipes/:id/etiquette', async (req, res) => {
    try {
      const [recipe] = await db.select()
        .from(culturalRecipes)
        .where(eq(culturalRecipes.id, parseInt(req.params.id)));

      if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
      }

      const [cuisine] = await db.select()
        .from(culturalCuisines)
        .where(eq(culturalCuisines.id, recipe.cuisineId));

      const etiquette = getServingEtiquetteGuide(recipe, cuisine.region);
      res.json(etiquette);
    } catch (error) {
      console.error('Error getting etiquette guide:', error);
      res.status(500).json({ error: 'Failed to get etiquette guide' });
    }
  });

  // ----------------- Error Handling Middleware -----------------
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  return httpServer;
}
