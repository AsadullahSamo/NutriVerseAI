import { pgTable, text, serial, integer, boolean, jsonb, timestamp, primaryKey, varchar, json, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import type { PgTableWithColumns } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  preferences: jsonb("preferences").default({}).notNull(),
  dnaProfile: jsonb("dna_profile"),
  moodJournal: jsonb("mood_journal").array(),
});

// Define recipes table with explicit type annotation
export const recipes: PgTableWithColumns<any> = pgTable("recipes", {
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
  recipeId: integer("recipe_id").references(() => recipes.id),
  content: text("content").notNull(),
  type: text("type").notNull(), // 'RECIPE_SHARE', 'FOOD_RESCUE', 'COOKING_TIP'
  location: jsonb("location"),
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
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
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
  condition: text("condition").$type<'excellent' | 'good' | 'fair' | 'needs-maintenance' | 'replace'>().notNull(),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const culturalRecipes = pgTable("cultural_recipes", {
  id: serial("id").primaryKey(),
  cuisineId: integer("cuisine_id").references(() => culturalCuisines.id).notNull(),
  name: text("name").notNull(),
  localName: text("local_name"),
  description: text("description").notNull(),
  difficulty: text("difficulty").$type<'beginner' | 'intermediate' | 'advanced'>().notNull(),
  authenticIngredients: jsonb("authentic_ingredients").notNull(),
  localSubstitutes: jsonb("local_substitutes"), // Mapping of authentic ingredients to local alternatives
  instructions: jsonb("instructions").notNull(),
  culturalNotes: jsonb("cultural_notes").notNull(), // Significance, occasions, history
  servingSuggestions: jsonb("serving_suggestions").notNull(),
  complementaryDishes: jsonb("complementary_dishes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const culturalTechniques = pgTable("cultural_techniques", {
  id: serial("id").primaryKey(),
  cuisineId: integer("cuisine_id").references(() => culturalCuisines.id).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").$type<'beginner' | 'intermediate' | 'advanced'>().notNull(),
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
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  preferences: true,
});

export const insertRecipeSchema = createInsertSchema(recipes);
export const insertGroceryListSchema = createInsertSchema(groceryLists);
export const insertPantryItemSchema = createInsertSchema(pantryItems);
export const insertCommunityPostSchema = createInsertSchema(communityPosts);
export const insertNutritionGoalSchema = createInsertSchema(nutritionGoals);
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

export const moodEntrySchema = z.object({
  recipeId: z.number(),
  entry: z.string(),
  timestamp: z.string(),
  sentiment: z.string().optional(),
  emotions: z.array(z.string()).optional(),
});

export type MoodEntry = z.infer<typeof moodEntrySchema>;

// Update user schema to include mood journal
export const userSchema = z.object({
  // ...existing user fields...
  moodJournal: z.array(moodEntrySchema).optional(),
});

// Add nutrition goal progress type
export type NutritionProgress = z.infer<typeof nutritionProgressSchema>;

// Add interface exports from kitchen-inventory-ai
export interface EquipmentRecommendation {
  name: string;
  category: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedPrice: string;
  alternativeOptions?: string[];
}

export interface MaintenanceSchedule {
  equipmentId: string;
  nextMaintenanceDate: string;
  tasks: string[];
  estimatedDuration: string;
  priority: 'high' | 'medium' | 'low';
}

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Recipe = typeof recipes.$inferSelect;
export type GroceryList = typeof groceryLists.$inferSelect;
export type PantryItem = typeof pantryItems.$inferSelect;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type RecipeLike = typeof recipe_likes.$inferSelect;
export type NutritionGoal = typeof nutritionGoals.$inferSelect;
export type RecipeConsumption = typeof recipeConsumption.$inferSelect;
export type KitchenEquipment = typeof kitchenEquipment.$inferSelect;
export type CulturalCuisine = typeof culturalCuisines.$inferSelect;
export type CulturalRecipe = typeof culturalRecipes.$inferSelect;
export type CulturalTechnique = typeof culturalTechniques.$inferSelect;
export type KitchenStorageLocation = typeof kitchenStorageLocations.$inferSelect;
export type InsertKitchenStorageLocation = typeof kitchenStorageLocations.$inferInsert;
export type StorageItem = typeof storageItems.$inferSelect;
export type InsertStorageItem = typeof storageItems.$inferInsert;