import { InsertUser, User, Recipe, GroceryList, PantryItem, CommunityPost, NutritionGoal, RecipeConsumption } from "@shared/schema";
import { Store } from "express-session";

export interface IStorage {
  sessionStore: Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  
  // Recipe operations
  getRecipes(): Promise<Recipe[]>;
  getRecipe(id: number): Promise<Recipe | undefined>;
  createRecipe(recipe: Omit<Recipe, "id">): Promise<Recipe>;
  likeRecipe(recipeId: number, userId: number): Promise<Recipe>;
  forkRecipe(id: number, userId: number): Promise<Recipe>;
  hasUserLikedRecipe(recipeId: number, userId: number): Promise<boolean>;
  updateRecipe(id: number, data: Partial<Recipe>): Promise<Recipe>;
  
  // Grocery list operations
  getGroceryListsByUser(userId: number): Promise<GroceryList[]>;
  createGroceryList(list: Omit<GroceryList, "id">): Promise<GroceryList>;
  updateGroceryList(id: number, data: Partial<GroceryList>): Promise<GroceryList>;
  
  // Pantry operations
  getPantryItemsByUser(userId: number): Promise<PantryItem[]>;
  createPantryItem(item: Omit<PantryItem, "id">): Promise<PantryItem>;
  deletePantryItem(id: number): Promise<void>;
  updatePantryItem(id: number, data: Partial<PantryItem>): Promise<PantryItem>;
  
  // Community operations
  getCommunityPosts(): Promise<CommunityPost[]>;
  getCommunityPost(id: number): Promise<CommunityPost | undefined>;
  createCommunityPost(post: Omit<CommunityPost, "id">): Promise<CommunityPost>;
  deleteGroceryList(id: number): Promise<void>;
  deleteRecipe(id: number): Promise<void>;
  deleteCommunityPost(id: number): Promise<void>;
  updateCommunityPost(id: number, data: Partial<CommunityPost>): Promise<CommunityPost>;

  // Nutrition goals operations
  getCurrentNutritionGoal(userId: number): Promise<NutritionGoal | null>;
  createNutritionGoal(goal: Omit<NutritionGoal, "id">): Promise<NutritionGoal>;
  deactivateNutritionGoals(userId: number): Promise<void>;
  updateNutritionProgress(goalId: number, progress: NutritionGoal["progress"]): Promise<NutritionGoal>;
  trackRecipeConsumption(data: Omit<RecipeConsumption, "id">): Promise<RecipeConsumption>;
  getRecipeConsumptionWithDetails(userId: number, startDate?: Date, endDate?: Date): Promise<Array<RecipeConsumption & { recipe: Recipe }>>;
}