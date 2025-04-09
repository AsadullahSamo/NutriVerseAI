import { useAuth } from "@/hooks/use-auth"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Loader2,
  Sparkles,
  ShoppingBasket,
  Flame,
  Beef,
  Wheat,
  Droplet,
  ChefHat,
  ListChecks,
  Scale
} from "lucide-react"
import { useEffect } from "react"
import { apiRequest } from "@/lib/queryClient"

export function PersonalizedRecommendations() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: recipes } = useQuery({
    queryKey: ["/api/recipes"]
  })

  const { data: recommendedRecipes, isLoading: isLoadingRecipes, refetch: refetchRecommendations } = useQuery({
    queryKey: ["/api/recipes/personalized", user?.id, recipes?.length],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/recipes/personalized")
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      } catch (error) {
        console.error("Error fetching personalized recommendations:", error)
        return [] // Return empty array on error
      }
    },
    enabled: !!user && recipes?.length > 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 0,
    cacheTime: 0,
    refetchInterval: 0, // Disable automatic refetching
    onSuccess: data => {
      console.log("Received personalized recommendations:", data)
    },
    onError: error => {
      console.error("Error fetching personalized recommendations:", error)
    }
  })

  // Listen for recipe changes and refresh recommendations
  useEffect(() => {
    if (!user || !recipes?.length) return;

    // Setup an event listener for the recipes query changes
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // If the recipes query is invalidated or updated, refresh recommendations
      if (event?.query?.queryKey?.[0] === "/api/recipes") {
        console.log("Recipe change detected, refreshing recommendations");
        // Mark the personalized recommendations as stale
        queryClient.invalidateQueries({ queryKey: ["/api/recipes/personalized"] });
        // Trigger a refetch
        refetchRecommendations();
      }
    });

    // Return cleanup function
    return () => {
      unsubscribe();
    };
  }, [queryClient, user, recipes?.length, refetchRecommendations]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Personalized Recipe Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoadingRecipes ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-primary/10 animate-pulse"></div>
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-primary font-medium">Generating personalized recommendations...</p>
              <p className="text-muted-foreground text-sm">This may take a few moments</p>
            </div>
            <div className="w-full max-w-xs h-1 bg-primary/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-[progress_2s_ease-in-out_infinite]"></div>
            </div>
          </div>
        ) : !recipes?.length ? (
          <p className="text-muted-foreground text-center py-8">
            No personalized recommendations available yet. Create a recipe in Recipes tab to get started!
          </p>
        ) : recommendedRecipes?.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No personalized recommendations available yet. Create a recipe in Recipes tab to get started!
          </p>
        ) : (
          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4 
            [&::-webkit-scrollbar]:w-2
            [&::-webkit-scrollbar-track]:bg-background/50
            [&::-webkit-scrollbar-thumb]:bg-primary/20
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb:hover]:bg-primary/30
            [&::-webkit-scrollbar-thumb]:transition-colors">
            {recommendedRecipes?.map((recipe, index) => (
              <Card key={index} className="overflow-hidden border border-primary/10 hover:border-primary/20 transition-colors bg-gradient-to-br from-background to-primary/5">
                <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl text-foreground">
                    <ChefHat className="h-5 w-5 text-primary" />
                        {recipe.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <h4 className="font-medium text-lg flex items-center gap-2 text-foreground">
                      <ShoppingBasket className="h-5 w-5 text-primary" />
                      Ingredients
                    </h4>
                    <ul className="list-disc pl-4 space-y-1.5">
                      {recipe.ingredients?.map((ing, i) => (
                        <li key={i} className="text-muted-foreground hover:text-foreground transition-colors">
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-lg flex items-center gap-2 text-foreground">
                      <ListChecks className="h-5 w-5 text-primary" />
                      Instructions
                    </h4>
                    <ol className="list-decimal pl-4 space-y-3">
                      {recipe.instructions?.map((step, i) => (
                        <li key={i} className="text-muted-foreground hover:text-foreground transition-colors">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-lg flex items-center gap-2 text-foreground">
                      <Scale className="h-5 w-5 text-primary" />
                      Nutrition Info
                    </h4>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/10">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Flame className="h-4 w-4 text-orange-500" />
                          Calories
                        </p>
                        <p className="font-medium text-lg text-primary">
                          {recipe.nutritionInfo?.calories || 0}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Beef className="h-4 w-4 text-red-500" />
                          Protein
                        </p>
                        <p className="font-medium text-lg text-primary">
                          {recipe.nutritionInfo?.protein || 0}g
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Wheat className="h-4 w-4 text-amber-500" />
                          Carbs
                        </p>
                        <p className="font-medium text-lg text-primary">
                          {recipe.nutritionInfo?.carbs || 0}g
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Droplet className="h-4 w-4 text-blue-500" />
                          Fat
                        </p>
                        <p className="font-medium text-lg text-primary">
                          {recipe.nutritionInfo?.fat || 0}g
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 