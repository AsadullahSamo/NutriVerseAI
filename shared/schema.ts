import { pgTable, text, serial, integer, boolean, jsonb, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  preferences: jsonb("preferences").default({}).notNull(),
  dnaProfile: jsonb("dna_profile"),
  moodJournal: jsonb("mood_journal").array(),
});

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
  likes: integer("likes").default(0).notNull(),
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

// Schema exports
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  preferences: true,
});

export const insertRecipeSchema = createInsertSchema(recipes);
export const insertGroceryListSchema = createInsertSchema(groceryLists);
export const insertPantryItemSchema = createInsertSchema(pantryItems);
export const insertCommunityPostSchema = createInsertSchema(communityPosts);

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

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Recipe = typeof recipes.$inferSelect;
export type GroceryList = typeof groceryLists.$inferSelect;
export type PantryItem = typeof pantryItems.$inferSelect;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type RecipeLike = typeof recipe_likes.$inferSelect;