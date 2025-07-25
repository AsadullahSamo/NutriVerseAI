import { createServer } from "http";
import { setupAuth } from "./auth.js";
import { storage } from "./storage.js";
import { users, recipes, groceryLists, pantryItems, communityPosts, mealPlans, nutritionGoals, recipeConsumption, kitchenEquipment, recipe_likes } from "../../shared/schema.js";
import { analyzeMoodSentiment, generateMoodInsights, generateAIMealPlan, getNutritionRecommendations, } from "../../ai-services/recipe-ai.js";
import { getRecipeAuthenticityScore, getEtiquette, getPairings, getSubstitutions, generateCulturalRecipeDetails } from "../../ai-services/cultural-cuisine-service.js";
import { desc, eq, and } from "drizzle-orm";
import { db } from "./db.js";
// Middleware to check if user is authenticated (session OR token)
const isAuthenticated = async (req, res, next) => {
    try {
        // Try session authentication first
        if (req.isAuthenticated && req.isAuthenticated()) {
            return next();
        }

        // Fallback to token authentication
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const user = await storage.getUser(token);
                if (user) {
                    const { password, dnaProfile, moodJournal, secretKey, ...safeUser } = user;
                    req.user = safeUser;
                    return next();
                }
            } catch (error) {
                console.error('Token validation error:', error);
            }
        }

        return res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
        console.error('Authentication middleware error:', error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
// Middleware to check if user is authenticated and owns the resource
const isResourceOwner = (resourceType) => async (req, res, next) => {
    // Check authentication first (session OR token)
    if (!req.isAuthenticated()) {
        // Try token authentication
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const user = await storage.getUser(token);
                if (user) {
                    const { password, dnaProfile, moodJournal, secretKey, ...safeUser } = user;
                    req.user = safeUser;
                } else {
                    return res.status(401).json({ message: "Unauthorized" });
                }
            } catch (error) {
                return res.status(401).json({ message: "Unauthorized" });
            }
        } else {
            return res.status(401).json({ message: "Unauthorized" });
        }
    }
    try {
        let resource;
        const userId = req.user.id;
        if (resourceType === 'recipe') {
            resource = await storage.getRecipe(parseInt(req.params.id));
            if (resource && resource.createdBy !== userId) {
                return res.status(403).json({ message: "Forbidden" });
            }
        }
        else if (resourceType === 'post') {
            resource = await storage.getCommunityPost(parseInt(req.params.id));
            if (resource && resource.userId !== userId) {
                return res.status(403).json({ message: "Forbidden" });
            }
        }
        if (!resource) {
            return res.status(404).json({ message: "Resource not found" });
        }
        next();
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
// Async handler to catch errors in async routes
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
// Add a helper function for database operations with retries
const withDbRetry = async (operation, maxRetries = 3) => {
    var _a;
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error;
            console.error(`Database operation failed (attempt ${i + 1}/${maxRetries}):`, error);
            // Check if it's a connection error
            if (((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('fetch failed')) && i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }
            throw error;
        }
    }
    throw lastError;
};
export async function registerRoutes(app) {
    const httpServer = createServer(app);
    setupAuth(app);
    // Simple health check endpoint that doesn't depend on database
    app.get('/api/health', (_req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString()
        });
    });
    // ----------------- Recipes Routes -----------------
    app.get("/api/recipes", isAuthenticated, asyncHandler(async (req, res) => {
        // Only return recipes created by the current user or shared with them
        const recipesTable = recipes; // Assign to new variable to avoid naming conflict
        const userRecipes = await db.select()
            .from(recipesTable)
            .where(eq(recipesTable.createdBy, req.user.id));
        res.json(userRecipes);
    }));
    app.post("/api/recipes", isAuthenticated, asyncHandler(async (req, res) => {
        const validated = insertRecipeSchema.parse(req.body);
        // Use the client-calculated sustainability score directly
        const sustainabilityScore = validated.sustainabilityScore || 50;
        const recipe = await storage.createRecipe(Object.assign(Object.assign({}, validated), { createdBy: req.user.id, createdAt: new Date(), nutritionInfo: validated.nutritionInfo, title: typeof validated.title === "string" ? validated.title : "", description: typeof validated.description === "string" ? validated.description : "", ingredients: validated.ingredients, instructions: validated.instructions, imageUrl: typeof validated.imageUrl === "string" ? validated.imageUrl : "", prepTime: typeof validated.prepTime === "number" ? validated.prepTime : 0, likes: 0, forkedFrom: null, sustainabilityScore, wastageReduction: validated.wastageReduction }));
        res.status(201).json(recipe);
    }));
    app.patch("/api/recipes/:id", isResourceOwner("recipe"), asyncHandler(async (req, res) => {
        const recipe = await storage.updateRecipe(parseInt(req.params.id), req.body);
        res.json(recipe);
    }));
    app.delete("/api/recipes/:id", isResourceOwner("recipe"), asyncHandler(async (req, res) => {
        var _a;
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
        }
        catch (error) {
            console.error("Error deleting recipe:", error);
            if ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes("consumption records")) {
                return res.status(409).json({
                    message: "Recipe has consumption records",
                    details: "This recipe has consumption records. Delete them first using the 'Delete History' button or use force delete.",
                    hasConsumptionRecords: true
                });
            }
            res.status(500).json({ message: "Failed to delete recipe" });
        }
    }));
    app.delete("/api/recipes/:id/consumption", isAuthenticated, asyncHandler(async (req, res) => {
        const recipeId = parseInt(req.params.id);
        await storage.deleteRecipeConsumption(recipeId);
        res.sendStatus(204);
    }));
    app.post("/api/recipes/:id/like", isAuthenticated, asyncHandler(async (req, res) => {
        var _a;
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const recipeId = parseInt(req.params.id);
        // Check if recipe exists
        const recipe = await storage.getRecipe(recipeId);
        if (!recipe) {
            return res.status(404).json({ message: "Recipe not found" });
        }
        const updatedRecipe = await storage.likeRecipe(recipeId, (_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        res.json(updatedRecipe);
    }));
    app.get("/api/recipes/:id/liked", isAuthenticated, asyncHandler(async (req, res) => {
        var _a;
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const hasLiked = await storage.hasUserLikedRecipe(parseInt(req.params.id), (_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        res.json({ hasLiked });
    }));
    app.post("/api/recipes/:id/fork", isAuthenticated, asyncHandler(async (req, res) => {
        var _a;
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const recipe = await storage.forkRecipe(parseInt(req.params.id), (_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        res.json(recipe);
    }));
    app.post("/api/recipes/:id/consume", isAuthenticated, asyncHandler(async (req, res) => {
        var _a, _b;
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const recipeId = parseInt(req.params.id);
        const { servings = 1, mealType = "snack" } = req.body;
        // Track recipe consumption
        const consumption = await storage.trackRecipeConsumption({
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
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
        const currentGoal = await storage.getCurrentNutritionGoal((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        if (currentGoal) {
            const today = new Date().toISOString().split('T')[0];
            const existingProgress = currentGoal.progress || [];
            const todayEntry = existingProgress.find((p) => p.date === today);
            const nutritionInfo = recipe.nutritionInfo;
            const scaledNutrition = {
                calories: nutritionInfo.calories * servings,
                protein: nutritionInfo.protein * servings,
                carbs: nutritionInfo.carbs * servings,
                fat: nutritionInfo.fat * servings,
            };
            const newProgress = todayEntry
                ? existingProgress.map((p) => p.date === today ? Object.assign(Object.assign({}, p), { calories: p.calories + scaledNutrition.calories, protein: p.protein + scaledNutrition.protein, carbs: p.carbs + scaledNutrition.carbs, fat: p.fat + scaledNutrition.fat }) : p)
                : [...existingProgress, Object.assign(Object.assign({ date: today }, scaledNutrition), { completed: false })];
            await storage.updateNutritionProgress(currentGoal.id, newProgress);
        }
        res.json(consumption);
    }));
    app.get("/api/recipes/consumption-history", isAuthenticated, asyncHandler(async (req, res) => {
        var _a;
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
        const mealType = req.query.mealType;
        const history = await storage.getRecipeConsumptionWithDetails((_a = req.user) === null || _a === void 0 ? void 0 : _a.id, startDate, endDate, mealType);
        res.json(history);
    }));
    // ----------------- Grocery Lists Routes -----------------
    app.get("/api/grocery-lists", isAuthenticated, asyncHandler(async (req, res) => {
        var _a;
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const lists = await storage.getGroceryListsByUser((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        res.json(lists);
    }));
    app.post("/api/grocery-lists", isAuthenticated, asyncHandler(async (req, res) => {
        var _a, _b, _c, _d;
        const validated = insertGroceryListSchema.parse(req.body);
        const list = await storage.createGroceryList(Object.assign(Object.assign({}, validated), { userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id, completed: (_b = validated.completed) !== null && _b !== void 0 ? _b : false, expiryDates: (_c = validated.expiryDates) !== null && _c !== void 0 ? _c : null, smartSubstitutions: (_d = validated.smartSubstitutions) !== null && _d !== void 0 ? _d : null }));
        res.status(201).json(list);
    }));
    app.patch("/api/grocery-lists/:id", isAuthenticated, asyncHandler(async (req, res) => {
        const list = await storage.updateGroceryList(parseInt(req.params.id), req.body);
        res.json(list);
    }));
    app.delete("/api/grocery-lists/:id", isAuthenticated, asyncHandler(async (req, res) => {
        await storage.deleteGroceryList(parseInt(req.params.id));
        res.sendStatus(204);
    }));
    // ----------------- Pantry Items Routes -----------------
    app.get("/api/pantry", isAuthenticated, asyncHandler(async (req, res) => {
        var _a;
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const items = await storage.getPantryItemsByUser((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        res.json(items);
    }));
    app.post("/api/pantry", isAuthenticated, asyncHandler(async (req, res) => {
        var _a, _b, _c;
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const data = Object.assign(Object.assign({}, req.body), { expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null });
        const validated = insertPantryItemSchema.parse(data);
        const item = await storage.createPantryItem(Object.assign(Object.assign({}, validated), { userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id, expiryDate: (_b = validated.expiryDate) !== null && _b !== void 0 ? _b : null, category: (_c = validated.category) !== null && _c !== void 0 ? _c : null }));
        res.status(201).json(item);
    }));
    app.patch("/api/pantry/:id", isAuthenticated, asyncHandler(async (req, res) => {
        const itemId = parseInt(req.params.id);
        const data = Object.assign(Object.assign({}, req.body), { expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null });
        const item = await storage.updatePantryItem(itemId, data);
        res.json(item);
    }));
    app.delete("/api/pantry/:id", isAuthenticated, asyncHandler(async (req, res) => {
        const itemId = parseInt(req.params.id);
        if (isNaN(itemId)) {
            res.status(400).json({ error: "Invalid item ID" });
            return;
        }
        await storage.deletePantryItem(itemId);
        res.status(204).send();
    }));
    // ----------------- Community Posts Routes -----------------
    app.get("/api/community", asyncHandler(async (req, res) => {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const posts = await storage.getCommunityPosts(userId);
        const postsWithRecipes = await Promise.all(posts.map(async (post) => {
            if (post.type === "RECIPE_SHARE" && post.recipeId) {
                const recipe = await storage.getRecipe(post.recipeId);
                return Object.assign(Object.assign({}, post), { recipe });
            }
            return post;
        }));
        res.json(postsWithRecipes);
    }));
    app.post("/api/community", isAuthenticated, asyncHandler(async (req, res) => {
        var _a, _b;
        const validated = insertCommunityPostSchema.parse(req.body);
        const post = await storage.createCommunityPost(Object.assign(Object.assign({}, validated), { userId: req.user.id, createdAt: new Date(), recipeId: (_a = validated.recipeId) !== null && _a !== void 0 ? _a : null, location: (_b = validated.location) !== null && _b !== void 0 ? _b : null }));
        res.status(201).json(post);
    }));
    app.patch("/api/community/:id", isResourceOwner("post"), asyncHandler(async (req, res) => {
        const post = await storage.updateCommunityPost(parseInt(req.params.id), req.body);
        res.json(post);
    }));
    app.delete("/api/community/:id", isAuthenticated, asyncHandler(async (req, res) => {
        const postId = parseInt(req.params.id);
        const userId = req.user.id;
        // Get the post
        const post = await storage.getCommunityPost(postId);
        if (!post) {
            return res.status(404).json({ type: 'error', message: 'Post not found' });
        }
        // Check if user is the creator
        if (post.userId === userId) {
            // Creator can delete the post for everyone
            await storage.deleteCommunityPost(postId);
            return res.json({ type: 'deleted' });
        }
        else {
            // Non-creators can only delete the post for themselves
            await storage.hidePostForUser(postId, userId);
            return res.json({ type: 'hidden' });
        }
    }));
    app.post("/api/pantryItems", isAuthenticated, asyncHandler(async (req, res) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const validated = insertPantryItemSchema.parse(req.body);
        const item = await storage.createPantryItem(Object.assign(Object.assign({}, validated), { userId: user.id }));
        res.status(201).json(item);
    }));
    // ----------------- Mood Journal Routes -----------------
    app.post("/api/mood-journal", isAuthenticated, asyncHandler(async (req, res) => {
        var _a, _b;
        const { recipeId, entry } = req.body;
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await storage.getUser((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        if (!user)
            return res.sendStatus(404);
        // Analyze sentiment using AI
        const { sentiment, emotions } = await analyzeMoodSentiment(entry);
        const moodJournal = (user.moodJournal || []);
        moodJournal.push({
            recipeId,
            entry,
            timestamp: new Date().toISOString(),
            sentiment,
            emotions
        });
        const updatedUser = await storage.updateUser(user.id, Object.assign(Object.assign({}, user), { moodJournal }));
        res.json(updatedUser);
    }));
    app.get("/api/mood-journal/:recipeId", isAuthenticated, asyncHandler(async (req, res) => {
        var _a, _b;
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await storage.getUser((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        if (!user)
            return res.sendStatus(404);
        const recipeEntries = (user.moodJournal || []).filter(entry => entry.recipeId === parseInt(req.params.recipeId));
        res.json(recipeEntries);
    }));
    app.get("/api/mood-journal/:recipeId/insights", isAuthenticated, asyncHandler(async (req, res) => {
        var _a, _b;
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await storage.getUser((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        if (!user)
            return res.sendStatus(404);
        const recipeEntries = (user.moodJournal || []).filter(entry => entry.recipeId === parseInt(req.params.recipeId));
        if (recipeEntries.length === 0) {
            return res.json({
                summary: "Not enough entries to generate insights yet.",
                patterns: [],
                recommendations: {
                    title: "Get Started",
                    items: [{
                            focus: "First Entry",
                            suggestion: "Add your first cooking experience to begin tracking your journey."
                        }]
                }
            });
        }
        const insights = await generateMoodInsights(recipeEntries);
        res.json(insights);
    }));
    app.delete("/api/mood-journal/:recipeId/:timestamp", isAuthenticated, asyncHandler(async (req, res) => {
        var _a, _b;
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await storage.getUser((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        if (!user)
            return res.sendStatus(404);
        const timestamp = decodeURIComponent(req.params.timestamp);
        const moodJournal = (user.moodJournal || []);
        const updatedJournal = moodJournal.filter(entry => entry.recipeId !== parseInt(req.params.recipeId) || entry.timestamp !== timestamp);
        await storage.updateUser(user.id, Object.assign(Object.assign({}, user), { moodJournal: updatedJournal }));
        res.json({ message: "Entry deleted successfully" });
    }));
    // ----------------- Nutrition Goals Routes -----------------
    app.get("/api/nutrition-goals/current", isAuthenticated, asyncHandler(async (req, res) => {
        var _a;
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const goal = await storage.getCurrentNutritionGoal((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        res.json(goal);
    }));
    app.post("/api/nutrition-goals", isAuthenticated, asyncHandler(async (req, res) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // Date coercion is now handled by the schema
        const validated = insertNutritionGoalSchema.parse(Object.assign(Object.assign({}, req.body), { userId: user.id }));
        // Deactivate any existing active goals
        await storage.deactivateNutritionGoals(user.id);
        // Create new goal
        const goal = await storage.createNutritionGoal(validated);
        res.status(201).json(goal);
    }));
    app.post("/api/nutrition-goals/progress", isAuthenticated, asyncHandler(async (req, res) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { goalId, progress } = req.body;
        const updatedGoal = await storage.updateNutritionProgress(goalId, progress);
        res.json(updatedGoal);
    }));
    app.get("/api/nutrition-goals/progress/today", isAuthenticated, asyncHandler(async (req, res) => {
        var _a, _b;
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const currentGoal = await storage.getCurrentNutritionGoal((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        if (!currentGoal) {
            return res.status(404).json({ message: "No active nutrition goal" });
        }
        const today = new Date().toISOString().split('T')[0];
        const todayProgress = ((_b = currentGoal.progress) === null || _b === void 0 ? void 0 : _b.find((p) => p.date === today)) || {
            date: today,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            completed: false,
        };
        res.json(todayProgress);
    }));
    app.get("/api/nutrition-goals/insights", isAuthenticated, asyncHandler(async (req, res) => {
        var _a, _b, _c;
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // Get current goal and progress
        const currentGoal = await storage.getCurrentNutritionGoal((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        if (!currentGoal) {
            return res.status(404).json({ message: "No active nutrition goal" });
        }
        // Get user preferences - fixed to use correct method name
        const user = await storage.getUser((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        const preferences = ((_c = user === null || user === void 0 ? void 0 : user.preferences) === null || _c === void 0 ? void 0 : _c.dietaryPreferences) || [];
        // Get AI recommendations
        const recommendations = await getNutritionRecommendations({
            calories: currentGoal.dailyCalories,
            protein: currentGoal.dailyProtein,
            carbs: currentGoal.dailyCarbs,
            fat: currentGoal.dailyFat,
        }, Array.isArray(currentGoal.progress) ? currentGoal.progress : [], preferences);
        res.json(recommendations);
    }));
    // ----------------- Meal Plan Routes -----------------
    app.get("/api/meal-plans", isAuthenticated, asyncHandler(async (req, res) => {
        var _a;
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const plans = await storage.getMealPlansByUser((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        res.json(plans);
    }));
    app.post("/api/meal-plans", isAuthenticated, asyncHandler(async (req, res) => {
        var _a;
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { title, startDate, endDate, preferences, dietaryRestrictions, calorieTarget, days } = req.body;
        // Generate AI meal plan
        const generatedPlan = await generateAIMealPlan(preferences, days, dietaryRestrictions, calorieTarget);
        // Create meal plan in database
        const plan = await storage.createMealPlan({
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            title,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            preferences,
            meals: generatedPlan,
            createdAt: new Date(),
            isActive: true
        });
        res.status(201).json(plan);
    }));
    app.patch("/api/meal-plans/:id", isAuthenticated, asyncHandler(async (req, res) => {
        const plan = await storage.updateMealPlan(parseInt(req.params.id), req.body);
        res.json(plan);
    }));
    app.delete("/api/meal-plans/:id", isAuthenticated, asyncHandler(async (req, res) => {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const planId = parseInt(req.params.id);
        await storage.deleteMealPlan(planId);
        res.sendStatus(204);
    }));
    // Kitchen Equipment Routes
    app.get('/api/kitchen-equipment', isAuthenticated, async (req, res) => {
        var _a;
        try {
            const equipment = await db.select().from(kitchenEquipment)
                .where(eq(kitchenEquipment.userId, (_a = req.user) === null || _a === void 0 ? void 0 : _a.id));
            res.json(equipment);
        }
        catch (error) {
            console.error('Error fetching kitchen equipment:', error);
            res.status(500).json({ error: 'Failed to fetch kitchen equipment' });
        }
    });
    app.post('/api/kitchen-equipment', isAuthenticated, async (req, res) => {
        var _a;
        try {
            const data = Object.assign(Object.assign({}, req.body), { userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id, createdAt: new Date(), updatedAt: new Date() });
            const [equipment] = await db.insert(kitchenEquipment).values(data).returning();
            res.json(equipment);
        }
        catch (error) {
            console.error('Error adding kitchen equipment:', error);
            res.status(500).json({ error: 'Failed to add kitchen equipment' });
        }
    });
    app.delete('/api/kitchen-equipment/:id', isAuthenticated, async (req, res) => {
        var _a;
        try {
            await db.delete(kitchenEquipment)
                .where(and(eq(kitchenEquipment.id, parseInt(req.params.id)), eq(kitchenEquipment.userId, (_a = req.user) === null || _a === void 0 ? void 0 : _a.id)));
            res.json({ success: true });
        }
        catch (error) {
            console.error('Error deleting kitchen equipment:', error);
            res.status(500).json({ error: 'Failed to delete kitchen equipment' });
        }
    });
    app.post('/api/kitchen-equipment/:id/maintenance', isAuthenticated, async (req, res) => {
        var _a;
        try {
            const [equipment] = await db.update(kitchenEquipment)
                .set({
                lastMaintenanceDate: req.body.maintenanceDate,
                maintenanceNotes: req.body.notes,
                updatedAt: new Date(),
            })
                .where(and(eq(kitchenEquipment.id, parseInt(req.params.id)), eq(kitchenEquipment.userId, (_a = req.user) === null || _a === void 0 ? void 0 : _a.id)))
                .returning();
            res.json(equipment);
        }
        catch (error) {
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
                    return Object.assign(Object.assign({}, cuisine), { keyIngredients: Array.isArray(cuisine.keyIngredients)
                            ? cuisine.keyIngredients
                            : typeof cuisine.keyIngredients === 'string'
                                ? JSON.parse(cuisine.keyIngredients)
                                : [], cookingTechniques: Array.isArray(cuisine.cookingTechniques)
                            ? cuisine.cookingTechniques
                            : typeof cuisine.cookingTechniques === 'string'
                                ? JSON.parse(cuisine.cookingTechniques)
                                : [], culturalContext: typeof cuisine.culturalContext === 'object' && cuisine.culturalContext !== null
                            ? cuisine.culturalContext
                            : typeof cuisine.culturalContext === 'string'
                                ? JSON.parse(cuisine.culturalContext)
                                : {}, servingEtiquette: typeof cuisine.servingEtiquette === 'object' && cuisine.servingEtiquette !== null
                            ? cuisine.servingEtiquette
                            : typeof cuisine.servingEtiquette === 'string'
                                ? JSON.parse(cuisine.servingEtiquette)
                                : {} });
                }
                catch (parseError) {
                    console.error('Error processing cuisine:', cuisine, parseError);
                    return cuisine;
                }
            });
            // Set explicit content-type to ensure client receives JSON
            res.setHeader('Content-Type', 'application/json');
            res.json(processedCuisines);
        }
        catch (error) {
            console.error('Error fetching cuisines:', error);
            if (error instanceof Error) {
                console.error('Full error details:', {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                    cause: error.cause
                });
            }
            // Set explicit content-type for error responses too
            res.setHeader('Content-Type', 'application/json');
            res.status(500).json({
                error: 'Failed to fetch cuisines',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    });
    app.post('/api/cultural-cuisines', isAuthenticated, async (req, res) => {
        var _a;
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
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
                createdBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id, // Set creator to current user
                createdAt: new Date()
            }).returning();
            res.status(201).json(cuisine);
        }
        catch (error) {
            console.error('Error adding cuisine:', error);
            res.status(500).json({ error: 'Failed to add cuisine' });
        }
    });
    app.get('/api/cultural-cuisines/:id', async (req, res) => {
        try {
            const cuisineId = parseInt(req.params.id);
            if (isNaN(cuisineId)) {
                return res.status(400).json({ error: 'Invalid cuisine ID' });
            }
            const [cuisine] = await db.select()
                .from(culturalCuisines)
                .where(eq(culturalCuisines.id, cuisineId));
            if (!cuisine) {
                return res.status(404).json({ error: 'Cuisine not found' });
            }
            // Get all recipes for this cuisine with proper error handling
            const recipes = await db.select()
                .from(culturalRecipes)
                .where(eq(culturalRecipes.cuisineId, cuisineId))
                .execute()
                .catch(err => {
                console.error('Error fetching recipes:', err);
                return [];
            });
            // Get all techniques for this cuisine with proper error handling
            const techniques = await db.select()
                .from(culturalTechniques)
                .where(eq(culturalTechniques.cuisineId, cuisineId))
                .execute()
                .catch(err => {
                console.error('Error fetching techniques:', err);
                return [];
            });
            // Process the cuisine data to ensure proper structure
            const processedCuisine = Object.assign(Object.assign({}, cuisine), { recipes: recipes || [], techniques: techniques || [], keyIngredients: Array.isArray(cuisine.keyIngredients)
                    ? cuisine.keyIngredients
                    : typeof cuisine.keyIngredients === 'string'
                        ? JSON.parse(cuisine.keyIngredients)
                        : [], cookingTechniques: Array.isArray(cuisine.cookingTechniques)
                    ? cuisine.cookingTechniques
                    : typeof cuisine.cookingTechniques === 'string'
                        ? JSON.parse(cuisine.cookingTechniques)
                        : [], culturalContext: typeof cuisine.culturalContext === 'object' && cuisine.culturalContext !== null
                    ? cuisine.culturalContext
                    : typeof cuisine.culturalContext === 'string'
                        ? JSON.parse(cuisine.culturalContext)
                        : {}, servingEtiquette: typeof cuisine.servingEtiquette === 'object' && cuisine.servingEtiquette !== null
                    ? cuisine.servingEtiquette
                    : typeof cuisine.servingEtiquette === 'string'
                        ? JSON.parse(cuisine.servingEtiquette)
                        : {} });
            res.json(processedCuisine);
        }
        catch (error) {
            console.error('Error fetching cuisine details:', error);
            res.status(500).json({
                error: 'Failed to fetch cuisine details',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    app.patch('/api/cultural-cuisines/:id', async (req, res) => {
        try {
            const { imageUrl, bannerUrl, culturalContext, servingEtiquette } = req.body;
            let updateData = {};
            // Only include fields that are provided
            if (imageUrl !== undefined)
                updateData.imageUrl = imageUrl;
            if (bannerUrl !== undefined)
                updateData.bannerUrl = bannerUrl;
            // Cultural context and etiquette need special handling to avoid "WHERE" syntax errors
            if (culturalContext !== undefined) {
                // Ensure it's an object, even if empty
                updateData.culturalContext = typeof culturalContext === 'object' ?
                    culturalContext : {};
            }
            if (servingEtiquette !== undefined) {
                // Ensure it's an object, even if empty
                updateData.servingEtiquette = typeof servingEtiquette === 'object' ?
                    servingEtiquette : {};
            }
            // Only proceed with update if we have data to update
            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ error: 'No valid update data provided' });
            }
            // Add updated timestamp
            updateData.updatedAt = new Date();
            const [updatedCuisine] = await db.update(culturalCuisines)
                .set(updateData)
                .where(eq(culturalCuisines.id, parseInt(req.params.id)))
                .returning();
            if (!updatedCuisine) {
                return res.status(404).json({ error: 'Cuisine not found' });
            }
            res.json(updatedCuisine);
        }
        catch (error) {
            console.error('Error updating cuisine:', error);
            res.status(500).json({
                error: 'Failed to update cuisine',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    app.delete('/api/cultural-cuisines/:id', isAuthenticated, async (req, res) => {
        var _a, _b, _c;
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const cuisineId = parseInt(req.params.id);
            // First get the cuisine to check ownership
            const [cuisine] = await db.select()
                .from(culturalCuisines)
                .where(eq(culturalCuisines.id, cuisineId));
            if (!cuisine) {
                return res.status(404).json({ error: 'Cuisine not found' });
            }
            if (cuisine.createdBy === ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
                // Creator can delete the cuisine entirely
                const [deletedCuisine] = await db.delete(culturalCuisines)
                    .where(eq(culturalCuisines.id, cuisineId))
                    .returning();
                return res.json(deletedCuisine);
            }
            else {
                // Non-creator just hides it for themselves
                const hiddenFor = (cuisine.hiddenFor || []);
                if (!hiddenFor.includes((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)) {
                    hiddenFor.push((_c = req.user) === null || _c === void 0 ? void 0 : _c.id);
                }
                const [updatedCuisine] = await db.update(culturalCuisines)
                    .set({ hiddenFor })
                    .where(eq(culturalCuisines.id, cuisineId))
                    .returning();
                return res.json(updatedCuisine);
            }
        }
        catch (error) {
            console.error('Error deleting cuisine:', error);
            res.status(500).json({ error: 'Failed to delete cuisine' });
        }
    });
    app.post('/api/cultural-cuisines/:id/hide', isAuthenticated, async (req, res) => {
        var _a, _b, _c, _d, _e;
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Unauthorized', type: 'error' });
            }
            const cuisineId = parseInt(req.params.id);
            if (isNaN(cuisineId)) {
                return res.status(400).json({ message: 'Invalid cuisine ID', type: 'error' });
            }
            console.log('Processing hide request for cuisine ID:', cuisineId, 'by user:', (_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
            // First check if the cuisine exists directly in this route
            const [cuisine] = await db
                .select({
                id: culturalCuisines.id,
                createdBy: culturalCuisines.createdBy,
                hiddenFor: culturalCuisines.hiddenFor
            })
                .from(culturalCuisines)
                .where(eq(culturalCuisines.id, cuisineId));
            if (!cuisine) {
                return res.status(404).json({
                    message: 'Cuisine not found',
                    type: 'error'
                });
            }
            console.log('Found cuisine:', cuisine);
            // Check if already hidden
            const hiddenFor = Array.isArray(cuisine.hiddenFor) ? cuisine.hiddenFor : [];
            if (hiddenFor.includes((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)) {
                console.log('Content is already hidden for user', (_c = req.user) === null || _c === void 0 ? void 0 : _c.id);
                return res.status(400).json({
                    message: 'Content is already hidden for this user',
                    type: 'error'
                });
            }
            // If user is creator, do a hard delete
            if (cuisine.createdBy === ((_d = req.user) === null || _d === void 0 ? void 0 : _d.id)) {
                console.log('User is creator - performing hard delete');
                await db.delete(culturalCuisines)
                    .where(eq(culturalCuisines.id, cuisineId));
                return res.json({ type: 'deleted' });
            }
            // For non-creators, update hiddenFor array
            console.log('User is not creator - updating hiddenFor array');
            const [updatedCuisine] = await db
                .update(culturalCuisines)
                .set({
                hiddenFor: [...hiddenFor, (_e = req.user) === null || _e === void 0 ? void 0 : _e.id]
            })
                .where(eq(culturalCuisines.id, cuisineId))
                .returning();
            console.log('Successfully added user to hiddenFor array:', updatedCuisine.hiddenFor);
            return res.json({
                type: 'hidden',
                cuisine: updatedCuisine
            });
        }
        catch (error) {
            console.error('Error processing hide request:', error);
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
                message: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
                type: 'error'
            });
        }
    });
    app.post('/api/cultural-recipes', isAuthenticated, async (req, res) => {
        var _a;
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const { name, description, cuisineId, difficulty = 'beginner', authenticIngredients = [], localSubstitutes = {}, instructions = [], culturalNotes = {}, servingSuggestions = [], imageUrl = '' // Add imageUrl to destructured parameters
             } = req.body;
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
                imageUrl, // Add imageUrl to inserted values
                createdBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id, // Set creator to current user
                updatedAt: new Date(),
                createdAt: new Date()
            }).returning();
            res.status(201).json(recipe);
        }
        catch (error) {
            console.error('Error adding recipe:', error);
            res.status(500).json({ error: 'Failed to add recipe' });
        }
    });
    app.get('/api/cultural-recipes/:id/substitutions', isAuthenticated, async (req, res) => {
        var _a;
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
                .where(eq(pantryItems.userId, req.user.id));
            // Get user's region from preferences
            const user = await storage.getUser(req.user.id);
            const userRegion = ((_a = user === null || user === void 0 ? void 0 : user.preferences) === null || _a === void 0 ? void 0 : _a.region) || 'unknown';
            // Find ingredient substitutions
            const result = await getSubstitutions(recipe, userPantry, userRegion);
            const authenticity = await getRecipeAuthenticityScore(recipe, result.substitutions);
            res.json({
                substitutions: result.substitutions,
                authenticityScore: result.authenticityScore,
                authenticityFeedback: result.authenticityFeedback
            });
        }
        catch (error) {
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
            const pairings = await getPairings(recipe, cuisine);
            res.json(pairings);
        }
        catch (error) {
            console.error('Error finding pairings:', error);
            res.status(500).json({ error: 'Failed to find complementary dishes' });
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
            const etiquette = await getEtiquette(recipe, cuisine);
            res.json(etiquette);
        }
        catch (error) {
            console.error('Error getting etiquette guide:', error);
            res.status(500).json({ error: 'Failed to get etiquette guide' });
        }
    });
    // Add DELETE endpoint for cultural recipes
    app.delete('/api/cultural-recipes/:id', isAuthenticated, async (req, res) => {
        var _a, _b, _c;
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const recipeId = parseInt(req.params.id);
            // First get the recipe to check ownership
            const [recipe] = await db.select()
                .from(culturalRecipes)
                .where(eq(culturalRecipes.id, recipeId));
            if (!recipe) {
                return res.status(404).json({ error: 'Recipe not found' });
            }
            if (recipe.createdBy === ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
                // Creator can delete the recipe entirely
                const [deletedRecipe] = await db.delete(culturalRecipes)
                    .where(eq(culturalRecipes.id, recipeId))
                    .returning();
                return res.json(deletedRecipe);
            }
            else {
                // Non-creator just hides it for themselves
                const hiddenFor = (recipe.hiddenFor || []);
                if (!hiddenFor.includes((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)) {
                    hiddenFor.push((_c = req.user) === null || _c === void 0 ? void 0 : _c.id);
                }
                const [updatedRecipe] = await db.update(culturalRecipes)
                    .set({ hiddenFor })
                    .where(eq(culturalRecipes.id, recipeId))
                    .returning();
                return res.json(updatedRecipe);
            }
        }
        catch (error) {
            console.error('Error deleting recipe:', error);
            res.status(500).json({ error: 'Failed to delete recipe' });
        }
    });
    app.post('/api/cultural-recipes/:id/substitutions', isAuthenticated, async (req, res) => {
        try {
            const [recipe] = await db.select()
                .from(culturalRecipes)
                .where(eq(culturalRecipes.id, parseInt(req.params.id)));
            if (!recipe) {
                return res.status(404).json({ error: 'Recipe not found' });
            }
            // Update the recipe's localSubstitutes
            const currentSubstitutes = recipe.localSubstitutes || {};
            const { original, substitute, notes, flavorImpact } = req.body;
            currentSubstitutes[original] = substitute;
            const [updatedRecipe] = await db.update(culturalRecipes)
                .set({
                localSubstitutes: currentSubstitutes,
                updatedAt: new Date()
            })
                .where(eq(culturalRecipes.id, recipe.id))
                .returning();
            // Return both the updated recipe and the full substitution details
            res.json({
                recipe: updatedRecipe,
                substitution: { original, substitute, notes, flavorImpact }
            });
        }
        catch (error) {
            console.error('Error adding substitution:', error);
            res.status(500).json({ error: 'Failed to add substitution' });
        }
    });
    app.patch('/api/cultural-recipes/:id', asyncHandler(async (req, res) => {
        const { id } = req.params;
        const recipeData = req.body;
        try {
            const recipe = await storage.updateCulturalRecipe(parseInt(id), Object.assign(Object.assign({}, recipeData), { image_url: recipeData.image_url || null }));
            res.json(recipe);
        }
        catch (error) {
            console.error('Error updating recipe:', error);
            res.status(500).json({ error: 'Failed to update recipe' });
        }
    }));
    // ----------------- User Recipes Routes -----------------
    app.get("/api/user-recipes", isAuthenticated, asyncHandler(async (req, res) => {
        try {
            const userRecipes = await db.select()
                .from(recipes)
                .where(eq(recipes.createdBy, req.user.id))
                .orderBy(desc(recipes.createdAt));
            const processedRecipes = userRecipes.map(recipe => ({
                id: recipe.id,
                title: recipe.title,
                description: recipe.description,
                ingredients: recipe.ingredients,
                instructions: recipe.instructions,
                nutritionInfo: recipe.nutritionInfo,
                imageUrl: recipe.imageUrl,
                prepTime: recipe.prepTime,
                createdBy: recipe.createdBy,
                forkedFrom: recipe.forkedFrom,
                sustainabilityScore: recipe.sustainabilityScore,
                wastageReduction: recipe.wastageReduction,
                createdAt: recipe.createdAt
            }));
            res.json(processedRecipes);
        }
        catch (error) {
            console.error('Error fetching user recipes:', error);
            res.status(500).json({ error: 'Failed to fetch recipes' });
        }
    }));
    // Update the cultural recipes endpoint to handle image URLs
    app.post('/api/cultural-cuisines/:cuisineId/recipes', asyncHandler(async (req, res) => {
        const { cuisineId } = req.params;
        const recipeData = req.body;
        try {
            const recipe = await storage.addCulturalRecipe(Object.assign(Object.assign({}, recipeData), { cuisineId: parseInt(cuisineId), image_url: recipeData.image_url || null, createdAt: new Date(), updatedAt: new Date() }));
            res.json(recipe);
        }
        catch (error) {
            console.error('Error adding recipe:', error);
            res.status(500).json({ error: 'Failed to add recipe' });
        }
    }));
    // Update the recipe update endpoint
    app.patch('/api/cultural-recipes/:id', asyncHandler(async (req, res) => {
        const { id } = req.params;
        const recipeData = req.body;
        try {
            const recipe = await storage.updateCulturalRecipe(parseInt(id), Object.assign(Object.assign({}, recipeData), { image_url: recipeData.image_url || null }));
            res.json(recipe);
        }
        catch (error) {
            console.error('Error updating recipe:', error);
            res.status(500).json({ error: 'Failed to update recipe' });
        }
    }));
    // Add the generate-cultural-recipe endpoint
    app.post('/api/ai/generate-cultural-recipe', async (req, res) => {
        try {
            const { recipeName, cuisineName } = req.body;
            console.log('[Server] Received request for:', { recipeName, cuisineName });
            if (!recipeName || !cuisineName) {
                console.error('[Server] Missing required fields:', { recipeName, cuisineName });
                return res.status(400).json({ error: 'Missing required fields' });
            }
            console.log('[Server] Calling generateCulturalRecipeDetails...');
            const details = await generateCulturalRecipeDetails(recipeName, cuisineName);
            console.log('[Server] Generated details:', details);
            res.json(details);
        }
        catch (error) {
            console.error('[Server] Error generating recipe details:', error);
            res.status(500).json({ error: 'Failed to generate recipe details' });
        }
    });
    // ----------------- Error Handling Middleware -----------------
    app.use((err, _req, res, _next) => {
        console.error(err);
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
    });
    return httpServer;
}
//# sourceMappingURL=routes.js.map