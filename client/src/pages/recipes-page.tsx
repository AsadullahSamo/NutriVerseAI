import { useQuery } from "@tanstack/react-query";
import { Recipe } from "@shared/schema";
import { RecipeCard } from "@/components/recipe-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, Loader2, Utensils } from "lucide-react";
import { useState } from "react";
import { CreateRecipeDialog } from "@/components/create-recipe-dialog";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecipeRecommendations } from "@/components/recipe-recommendations";

export default function RecipesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const { data: recipes, isLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  const filteredRecipes = recipes?.filter((recipe) =>
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Recipes</h1>
              <p className="text-muted-foreground mt-2">
                Discover healthy and delicious meals
              </p>
            </div>
            <CreateRecipeDialog />
          </div>
        </header>

        <Tabs defaultValue="my-recipes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="my-recipes">My Recipes</TabsTrigger>
            <TabsTrigger value="ai-recommendations">AI Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="my-recipes">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRecipes?.map((recipe) => (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe}
                  showDelete={recipe.createdBy === user?.id}
                  hideEditDelete={false}
                />
              ))}
            </div>
            {filteredRecipes?.length === 0 && (
              <div className="text-center py-12">
                <Utensils className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No recipes found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or create a new recipe
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai-recommendations">
            <RecipeRecommendations />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}