import { createServer } from "http";
import { setupAuth } from "./auth.js";
import { storage } from "./storage.js";
import { recipes, insertRecipeSchema } from "@shared/schema.js";
import recipeAI from "./ai-services/recipe-ai.js";
import culturalCuisineService from "./ai-services/cultural-cuisine-service.js";
import { eq } from "drizzle-orm";
import { db } from "./db.js";

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    next();
};

// Middleware to check if user is authenticated and owns the resource
const isResourceOwner = (resourceType) => async (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        let resource;
        const userId = req.user.id;
        
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
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const withDbRetry = async (operation, maxRetries = 3) => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            console.error(`Database operation failed (attempt ${i + 1}/${maxRetries}):`, error);
            if (error?.message?.includes('fetch failed') && i < maxRetries - 1) {
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
    
    // Setup authentication middleware and routes first
    setupAuth(app);
    
    // Add health check endpoint
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // ----------------- Recipes Routes -----------------
    app.get("/api/recipes", isAuthenticated, asyncHandler(async (req, res) => {
        const userRecipes = await db.select()
            .from(recipes)
            .where(eq(recipes.createdBy, req.user.id));
        res.json(userRecipes);
    }));

    app.post("/api/recipes", asyncHandler(async (req, res) => {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const validated = insertRecipeSchema.parse(req.body);
        const sustainabilityScore = validated.sustainabilityScore || 50;
        const recipe = await storage.createRecipe({
            ...validated,
            createdBy: req.user.id,
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
            sustainabilityScore: sustainabilityScore,
            wastageReduction: validated.wastageReduction
        });
        res.status(201).json(recipe);
    }));

    // ... rest of the routes ...

    // ----------------- Error Handling Middleware -----------------
    app.use((err, _req, res, _next) => {
        console.error(err);
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
    });

    return httpServer;
} 