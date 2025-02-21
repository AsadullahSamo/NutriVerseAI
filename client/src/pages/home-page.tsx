import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { GroceryList as GroceryListType, Recipe } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, ShoppingCart, Utensils, Clock, Users } from "lucide-react";
import { GroceryList } from "@/components/grocery-list";
import { Link } from "wouter";
import { RecipeCard } from "@/components/recipe-card";
import { CreateGroceryListDialog } from "@/components/create-grocery-list-dialog";

export default function HomePage() {
  const { user } = useAuth();

  const { data: groceryLists, isLoading: listsLoading } = useQuery<GroceryListType[]>({
    queryKey: ["/api/grocery-lists"],
  });

  const { data: recommendedRecipes, isLoading: recipesLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  if (listsLoading || recipesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.username}!</h1>
          <p className="text-muted-foreground mt-2">Your personalized nutrition dashboard</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <section>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Grocery Lists
                </CardTitle>
                <CreateGroceryListDialog />
              </CardHeader>
              <CardContent>
                {groceryLists?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No grocery lists yet. Create one to get started!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {groceryLists?.map((list) => (
                      <GroceryList key={list.id} list={list} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Recommended Recipes
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/recipes">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {recommendedRecipes && recommendedRecipes.length > 0 ? (
                    recommendedRecipes.slice(0, 3).map((recipe) => (
                      <Link key={recipe.id} href={`/recipes?id=${recipe.id}`}>
                        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-0 bg-muted/30 hover:bg-muted/50 cursor-pointer group">
                          <CardHeader className="p-4">
                            <div>
                              <h3 className="font-medium text-lg group-hover:text-primary transition-colors">
                                {recipe.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                                {recipe.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                              <span className="flex items-center gap-2">
                                <Clock className="h-4 w-4 flex-shrink-0" />
                                {recipe.prepTime} mins
                              </span>
                              <span className="flex items-center gap-2">
                                <Users className="h-4 w-4 flex-shrink-0" />
                                {Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0} ingredients
                              </span>
                            </div>
                          </CardHeader>
                        </Card>
                      </Link>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No recipes available yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}