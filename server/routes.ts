import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { 
  insertRecipeSchema, 
  insertGroceryListSchema, 
  insertPantryItemSchema, 
  insertCommunityPostSchema,
  moodEntrySchema, 
  type MoodEntry 
} from "@shared/schema";
import { 
  analyzeMoodSentiment, 
  generateMoodInsights, 
  generateAIMealPlan 
} from "../ai-services/recipe-ai";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Middleware to check if user is authenticated and owns the resource
const isResourceOwner = (resourceType: 'recipe' | 'post' | 'meal-plan') => async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    let resource;
    if (resourceType === 'recipe') {
      resource = await storage.getRecipe(parseInt(req.params.id));
    } else if (resourceType === 'post') {
      resource = await storage.getCommunityPost(parseInt(req.params.id));
    } else if (resourceType === 'meal-plan') {
      const plan = await storage.getMealPlansByUser(req.user.id);
      resource = plan.find(p => p.id === parseInt(req.params.id));
    }

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const userId = req.user.id;
    if (
      (resourceType === 'recipe' && 'createdBy' in resource && resource.createdBy !== userId) ||
      (resourceType === 'post' && 'userId' in resource && resource.userId !== userId) ||
      (resourceType === 'meal-plan' && resource.userId !== userId)
    ) {
      return res.status(403).json({ message: "Forbidden" });
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication middleware
  setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);

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
        sustainabilityScore: null,
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
      await storage.deleteRecipe(parseInt(req.params.id));
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
    asyncHandler(async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const validated = insertPantryItemSchema.parse(req.body);
      const item = await storage.createPantryItem({
        ...validated,
        userId: req.user!.id,
      });
      res.status(201).json(item);
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

      const mealPlan = await generateAIMealPlan(
        req.body.preferences,
        req.body.days,
        req.body.dietaryRestrictions,
        req.body.calorieTarget
      );

      const plan = await storage.createMealPlan({
        userId: req.user.id,
        title: req.body.title,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        preferences: req.body.preferences,
        meals: mealPlan,
        isActive: true,
      });

      res.json(plan);
    })
  );

  app.put(
    "/api/meal-plans/:id",
    isAuthenticated,
    isResourceOwner('meal-plan'),
    asyncHandler(async (req, res) => {
      const plan = await storage.updateMealPlan(parseInt(req.params.id), req.body);
      res.json(plan);
    })
  );

  app.delete(
    "/api/meal-plans/:id",
    isAuthenticated,
    isResourceOwner('meal-plan'),
    asyncHandler(async (req, res) => {
      await storage.deleteMealPlan(parseInt(req.params.id));
      res.json({ message: "Meal plan deleted successfully" });
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

  // ----------------- Error Handling Middleware -----------------
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  return httpServer;
}
