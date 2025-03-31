import { pgTable, text, serial, integer, boolean, jsonb, timestamp, primaryKey, varchar, json, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    preferences: jsonb("preferences").default({}).notNull(),
    dnaProfile: jsonb("dna_profile"),
    moodJournal: jsonb("mood_journal").array(),
    secretKey: text("secret_key").unique(),
});
// Define recipes table with explicit type annotation
export const recipes = pgTable("recipes", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    ingredients: jsonb("ingredients").notNull(),
    instructions: jsonb("instructions").notNull(),
    nutritionInfo: jsonb("nutrition_info").notNull(),
    imageUrl: text("image_url"),
    prepTime: integer("prep_time").notNull(),
    createdBy: integer("created_by").references(() => users.id),
    forkedFrom: integer("forked_from").references(() => recipes.id),
    sustainabilityScore: integer("sustainability_score"),
    wastageReduction: jsonb("wastage_reduction"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const groceryLists = pgTable("grocery_lists", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    items: jsonb("items").notNull(),
    completed: boolean("completed").default(false).notNull(),
    expiryDates: jsonb("expiry_dates"),
    smartSubstitutions: jsonb("smart_substitutions"),
});
export const pantryItems = pgTable("pantry_items", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    name: text("name").notNull(),
    quantity: text("quantity").notNull(),
    expiryDate: timestamp("expiry_date"),
    category: text("category"),
    nutritionInfo: jsonb("nutrition_info").notNull(),
    sustainabilityInfo: jsonb("sustainability_info").notNull(),
});
export const communityPosts = pgTable("community_posts", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    username: text("username").notNull(),
    recipeId: integer("recipe_id").references(() => recipes.id),
    content: text("content").notNull(),
    type: text("type").notNull(), // 'RECIPE_SHARE', 'FOOD_RESCUE', 'COOKING_TIP'
    location: jsonb("location"),
    hiddenFor: jsonb("hidden_for").default('[]').notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const recipe_likes = pgTable("recipe_likes", {
    recipeId: integer("recipe_id").references(() => recipes.id).notNull(),
    userId: integer("user_id").references(() => users.id).notNull(),
}, (table) => ({
    pk: primaryKey(table.recipeId, table.userId),
}));
export const mealPlans = pgTable("meal_plans", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    title: text("title").notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    preferences: jsonb("preferences").notNull(),
    meals: jsonb("meals").notNull(), // Array of meals with recipes and schedules
    createdAt: timestamp("created_at").defaultNow().notNull(),
    isActive: boolean("is_active").default(true).notNull(),
});
export const nutritionGoals = pgTable("nutrition_goals", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    dailyCalories: integer("daily_calories").notNull(),
    dailyProtein: integer("daily_protein").notNull(),
    dailyCarbs: integer("daily_carbs").notNull(),
    dailyFat: integer("daily_fat").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    progress: jsonb("progress").default([]).notNull(), // Array of daily progress entries
});
export const recipeConsumption = pgTable("recipe_consumption", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    recipeId: integer("recipe_id").references(() => recipes.id).notNull(),
    consumedAt: timestamp("consumed_at").defaultNow().notNull(),
    servings: integer("servings").default(1).notNull(),
    mealType: text("meal_type").notNull(), // breakfast, lunch, dinner, snack
});
export const kitchenEquipment = pgTable("kitchen_equipment", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    condition: text("condition").$type().notNull(),
    lastMaintenanceDate: text("last_maintenance_date"),
    purchaseDate: text("purchase_date"),
    maintenanceInterval: integer("maintenance_interval"),
    maintenanceNotes: text("maintenance_notes"),
    purchasePrice: integer("purchase_price"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});
export const culturalCuisines = pgTable("cultural_cuisines", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    region: text("region").notNull(),
    description: text("description").notNull(),
    keyIngredients: jsonb("key_ingredients").notNull(),
    cookingTechniques: jsonb("cooking_techniques").notNull(),
    culturalContext: jsonb("cultural_context").notNull(), // History, significance, traditions
    servingEtiquette: jsonb("serving_etiquette").notNull(),
    imageUrl: text("image_url"),
    bannerUrl: text("banner_url"),
    color: text("color"),
    tags: jsonb("tags").array(),
    visual: jsonb("visual").default({
        primaryColor: '#E2E8F0',
        textColor: '#1A202C',
        accentColor: '#4A5568'
    }),
    createdBy: integer("created_by").references(() => users.id),
    hiddenFor: jsonb("hidden_for").default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const culturalRecipes = pgTable("cultural_recipes", {
    id: serial("id").primaryKey(),
    cuisineId: integer("cuisine_id").references(() => culturalCuisines.id).notNull(),
    name: text("name").notNull(),
    localName: text("local_name"),
    description: text("description").notNull(),
    difficulty: text("difficulty").$type().notNull(),
    authenticIngredients: jsonb("authentic_ingredients").notNull(),
    localSubstitutes: jsonb("local_substitutes"), // Mapping of authentic ingredients to local alternatives
    instructions: jsonb("instructions").notNull(),
    culturalNotes: jsonb("cultural_notes").notNull(), // Significance, occasions, history
    servingSuggestions: jsonb("serving_suggestions").notNull(),
    complementaryDishes: jsonb("complementary_dishes"),
    image_url: text("image_url"),
    createdBy: integer("created_by").references(() => users.id),
    hiddenFor: jsonb("hidden_for").default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const culturalTechniques = pgTable("cultural_techniques", {
    id: serial("id").primaryKey(),
    cuisineId: integer("cuisine_id").references(() => culturalCuisines.id).notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    difficulty: text("difficulty").$type().notNull(),
    steps: jsonb("steps").notNull(),
    tips: jsonb("tips").notNull(),
    commonUses: jsonb("common_uses").notNull(),
    videoUrl: text("video_url"), // Optional URL to free YouTube videos demonstrating the technique
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const kitchenStorageLocations = pgTable("kitchen_storage_locations", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 50 }).notNull(), // pantry, refrigerator, freezer, cabinet, etc.
    temperature: real("temperature"),
    humidity: real("humidity"),
    capacity: integer("capacity").notNull(),
    currentItems: integer("current_items").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const storageItems = pgTable("storage_items", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    locationId: integer("location_id").references(() => kitchenStorageLocations.id, { onDelete: "cascade" }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    quantity: integer("quantity").default(1),
    unit: varchar("unit", { length: 50 }),
    category: varchar("category", { length: 100 }),
    expiryDate: date("expiry_date"),
    usageFrequency: varchar("usage_frequency", { length: 50 }), // high, medium, low
    storageRequirements: json("storage_requirements"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
// Schema definitions - ordering matters!
export const nutritionProgressSchema = z.object({
    date: z.string(),
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
    completed: z.boolean(),
});
// Remove meal prep schema and update exports
export const insertUserSchema = createInsertSchema(users)
    .pick({
    username: true,
    password: true,
    preferences: true,
})
    .extend({
    username: z.string()
        .min(3, "Username must be at least 3 characters long")
        .max(30, "Username cannot exceed 30 characters"),
    password: z.string()
        .min(6, "Password must be at least 6 characters long")
        .max(100, "Password cannot exceed 100 characters"),
});
export const insertRecipeSchema = createInsertSchema(recipes)
    .extend({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    ingredients: z.array(z.string()).min(1, "At least one ingredient is required"),
    instructions: z.array(z.string()).min(1, "At least one instruction step is required"),
    nutritionInfo: z.object({
        calories: z.number().min(0, "Calories must be positive").max(5000, "Calories cannot exceed 5000"),
        protein: z.number().min(0, "Protein must be positive").max(500, "Protein cannot exceed 500g"),
        carbs: z.number().min(0, "Carbs must be positive").max(500, "Carbs cannot exceed 500g"),
        fat: z.number().min(0, "Fat must be positive").max(200, "Fat cannot exceed 200g")
    }),
    prepTime: z.number().min(1, "Preparation time must be at least 1 minute"),
    imageUrl: z.string().url("Please enter a valid image URL").optional().or(z.literal("")),
    sustainabilityScore: z.number().min(0).max(100).optional(),
});
export const insertGroceryListSchema = createInsertSchema(groceryLists);
export const insertPantryItemSchema = createInsertSchema(pantryItems)
    .extend({
    name: z.string().min(1, "Name is required"),
    quantity: z.string().min(1, "Quantity is required"),
    category: z.string().min(1, "Category is required"),
    expiryDate: z.date().optional(),
    nutritionInfo: z.object({
        calories: z.number().min(0, "Calories must be positive"),
        protein: z.number().min(0, "Protein must be positive"),
        carbs: z.number().min(0, "Carbs must be positive"),
        fat: z.number().min(0, "Fat must be positive")
    }),
    sustainabilityInfo: z.object({
        score: z.number().min(0).max(100),
        packaging: z.enum(["recyclable", "biodegradable", "reusable", "non-recyclable"]),
        carbonFootprint: z.enum(["low", "medium", "high"])
    })
});
export const insertCommunityPostSchema = createInsertSchema(communityPosts);
export const insertNutritionGoalSchema = createInsertSchema(nutritionGoals)
    .extend({
    dailyCalories: z.number().min(500, "Daily calories must be at least 500").max(5000, "Daily calories cannot exceed 5000"),
    dailyProtein: z.number().min(10, "Daily protein must be at least 10g").max(500, "Daily protein cannot exceed 500g"),
    dailyCarbs: z.number().min(0, "Daily carbs must be non-negative").max(500, "Daily carbs cannot exceed 500g"),
    dailyFat: z.number().min(0, "Daily fat must be non-negative").max(200, "Daily fat cannot exceed 200g"),
    progress: z.array(z.object({
        date: z.string(),
        calories: z.number(),
        protein: z.number(),
        carbs: z.number(),
        fat: z.number(),
        completed: z.boolean()
    })).default([])
});
export const insertKitchenEquipmentSchema = createInsertSchema(kitchenEquipment);
export const insertCulturalCuisineSchema = createInsertSchema(culturalCuisines);
export const insertCulturalRecipeSchema = createInsertSchema(culturalRecipes);
export const insertCulturalTechniqueSchema = createInsertSchema(culturalTechniques);
// Fix the validation approach for kitchen storage schemas by using zod's refine methods
export const insertKitchenStorageLocationSchema = createInsertSchema(kitchenStorageLocations)
    .refine(data => data.name && data.name.length > 0, {
    message: "Name is required",
    path: ["name"]
})
    .refine(data => data.type && data.type.length > 0, {
    message: "Type is required",
    path: ["type"]
})
    .refine(data => data.capacity && data.capacity > 0, {
    message: "Capacity must be positive",
    path: ["capacity"]
});
// Updated validation with proper null checks
export const insertStorageItemSchema = createInsertSchema(storageItems)
    .refine(data => {
    const name = data.name;
    return name != null && name.length > 0;
}, {
    message: "Name is required",
    path: ["name"]
})
    .refine(data => {
    const quantity = data.quantity;
    return quantity == null || quantity >= 0;
}, {
    message: "Quantity must be non-negative",
    path: ["quantity"]
});
export const insertMealPlanSchema = createInsertSchema(mealPlans)
    .extend({
    title: z.string().min(1, "Title is required"),
    startDate: z.date(),
    endDate: z.date(),
    preferences: z.array(z.string()).optional(),
    meals: z.array(z.object({
        day: z.number().min(1).max(7, "Meal plan cannot exceed 7 days"),
        meals: z.object({
            breakfast: z.object({
                title: z.string(),
                description: z.string(),
                nutritionalInfo: z.string(),
                preparationTime: z.string().optional()
            }),
            lunch: z.object({
                title: z.string(),
                description: z.string(),
                nutritionalInfo: z.string(),
                preparationTime: z.string().optional()
            }),
            dinner: z.object({
                title: z.string(),
                description: z.string(),
                nutritionalInfo: z.string(),
                preparationTime: z.string().optional()
            }),
            snacks: z.array(z.object({
                title: z.string(),
                description: z.string(),
                nutritionalInfo: z.string()
            })).optional()
        })
    }))
})
    .refine((data) => {
    if (data.endDate && data.startDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
    }
    return true;
}, {
    message: "Meal plan duration cannot exceed 7 days",
    path: ["endDate"],
});
export const moodEntrySchema = z.object({
    recipeId: z.number(),
    entry: z.string(),
    timestamp: z.string(),
    sentiment: z.string().optional(),
    emotions: z.array(z.string()).optional(),
});
// Update user schema to include mood journal
export const userSchema = z.object({
    // ...existing user fields...
    moodJournal: z.array(moodEntrySchema).optional(),
});
