import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChefHat, Loader2, AlertTriangle, Info, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/queryClient";
import { KitchenEquipment, EquipmentRecipeCompatibility, getRecipesForEquipment } from "../../../ai-services/kitchen-inventory-ai";

interface EquipmentRecipeCompatibilityCardProps {
  equipment: KitchenEquipment[];
}

export function EquipmentRecipeCompatibilityCard({ equipment }: EquipmentRecipeCompatibilityCardProps) {
  const [activeTab, setActiveTab] = useState("compatible");
  const { toast } = useToast();
  
  // Query popular recipes from the API
  const { data: recipes, isLoading: recipesLoading } = useQuery({
    queryKey: ["/api/recipes/popular"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/recipes/popular");
        return response;
      } catch (error) {
        console.error("Error fetching popular recipes:", error);
        // Return some fake recipes for demo purposes
        return [
          { id: "1", name: "Spaghetti Carbonara" },
          { id: "2", name: "Beef Wellington" },
          { id: "3", name: "French Onion Soup" },
          { id: "4", name: "Chicken Tikka Masala" },
          { id: "5", name: "Eggs Benedict" },
          { id: "6", name: "Lobster Thermidor" },
          { id: "7", name: "Ratatouille" },
          { id: "8", name: "Beef Bourguignon" }
        ];
      }
    }
  });
  
  // Query recipe-equipment compatibility (if we have equipment and recipes)
  const { data: compatibility, isLoading: compatibilityLoading } = useQuery({
    queryKey: ["/api/equipment-recipe-compatibility", equipment.length, recipes?.length],
    queryFn: async () => {
      if (!equipment.length || !recipes?.length) {
        return null;
      }
      
      try {
        // First try the API endpoint
        const response = await apiRequest("GET", "/api/equipment-recipe-compatibility");
        return response;
      } catch (error) {
        // Fall back to the AI service
        return await getRecipesForEquipment(
          equipment, 
          recipes.map(r => r.id),
          ["Italian", "French", "Indian", "American"] // Example preferences
        );
      }
    },
    enabled: equipment.length > 0 && !!recipes?.length
  });
  
  const isLoading = recipesLoading || compatibilityLoading;
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recipe Compatibility</CardTitle>
          <CardDescription>
            Analyzing which recipes you can make with your current equipment
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Analyzing your kitchen equipment...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!compatibility || !recipes || equipment.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recipe Compatibility</CardTitle>
          <CardDescription>
            Add kitchen equipment to see compatible recipes
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center gap-4">
            <ChefHat className="h-16 w-16 text-muted-foreground/30" />
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                No equipment or recipes found
              </p>
              <p className="text-sm text-muted-foreground">
                Add kitchen equipment to your inventory to see recipe compatibility
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Filter recipes by compatibility for each tab
  const compatibleRecipes = compatibility.compatibleRecipes.filter(r => r.compatibility >= 80);
  const adaptableRecipes = compatibility.compatibleRecipes.filter(r => r.compatibility >= 50 && r.compatibility < 80);
  const challengingRecipes = compatibility.compatibleRecipes.filter(r => r.compatibility < 50);
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Recipe Compatibility</CardTitle>
            <CardDescription>
              See which recipes you can make with your current equipment
            </CardDescription>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <span className="text-sm">Kitchen Capability:</span>
              <Badge 
                className={
                  compatibility.kitchenCapabilityScore >= 75
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : compatibility.kitchenCapabilityScore >= 50
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }
              >
                {compatibility.kitchenCapabilityScore}/100
              </Badge>
            </div>
            <Progress 
              value={compatibility.kitchenCapabilityScore} 
              className="w-40 h-2 mt-1"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="compatible" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="compatible" className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              <span>Ready to Cook</span>
              {compatibleRecipes.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {compatibleRecipes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="adaptable" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>Adaptable</span>
              {adaptableRecipes.length > 0 && (
                <Badge variant="outline" className="ml-1">
                  {adaptableRecipes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="challenging" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Challenging</span>
              {challengingRecipes.length > 0 && (
                <Badge variant="outline" className="ml-1 text-red-500">
                  {challengingRecipes.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="compatible" className="space-y-4">
            {compatibleRecipes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <ChefHat className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No fully compatible recipes found</p>
                <p className="text-sm text-muted-foreground mt-2">Add more equipment to your inventory to unlock recipes</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {compatibleRecipes.map((recipe) => (
                  <Card key={recipe.recipeId} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg">{recipe.recipeName}</h3>
                          <div className="flex items-center mt-1">
                            <Progress 
                              value={recipe.compatibility} 
                              className="w-24 h-2 mr-2 [&>div]:bg-green-500"
                            />
                            <span className="text-sm text-green-600">{recipe.compatibility}% compatible</span>
                          </div>
                        </div>
                        <Button variant="secondary" size="sm" className="text-xs">
                          View Recipe
                        </Button>
                      </div>
                      
                      {recipe.possibleSubstitutions.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-medium mb-2">Possible Substitutions:</h4>
                          <ul className="text-xs space-y-1">
                            {recipe.possibleSubstitutions.map((sub, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-muted-foreground">{sub.needed}:</span>
                                <span>{sub.substitute}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="adaptable" className="space-y-4">
            {adaptableRecipes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Info className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No adaptable recipes found</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {adaptableRecipes.map((recipe) => (
                  <Card key={recipe.recipeId} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg">{recipe.recipeName}</h3>
                          <div className="flex items-center mt-1">
                            <Progress 
                              value={recipe.compatibility} 
                              className="w-24 h-2 mr-2 [&>div]:bg-yellow-500"
                            />
                            <span className="text-sm text-yellow-600">{recipe.compatibility}% compatible</span>
                          </div>
                        </div>
                        <Button variant="secondary" size="sm" className="text-xs">
                          View Recipe
                        </Button>
                      </div>
                      
                      {recipe.missingEquipment.length > 0 && (
                        <div className="mt-4 pt-4 border-t space-y-2">
                          <h4 className="text-sm font-medium">Missing Equipment:</h4>
                          <div className="flex flex-wrap gap-2">
                            {recipe.missingEquipment.map((item, index) => (
                              <Badge key={index} variant="outline">{item}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {recipe.possibleSubstitutions.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Possible Substitutions:</h4>
                          <ul className="text-xs space-y-1">
                            {recipe.possibleSubstitutions.map((sub, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-muted-foreground">{sub.needed}:</span>
                                <span>{sub.substitute}</span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="h-3 w-3 text-muted-foreground ml-1" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="w-56">{sub.effectivenessNote}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="challenging" className="space-y-4">
            {challengingRecipes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No challenging recipes found</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {challengingRecipes.map((recipe) => (
                  <Card key={recipe.recipeId} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg">{recipe.recipeName}</h3>
                          <div className="flex items-center mt-1">
                            <Progress 
                              value={recipe.compatibility} 
                              className="w-24 h-2 mr-2 [&>div]:bg-red-500"
                            />
                            <span className="text-sm text-red-600">{recipe.compatibility}% compatible</span>
                          </div>
                        </div>
                        <Button variant="secondary" size="sm" className="text-xs">
                          View Recipe
                        </Button>
                      </div>
                      
                      {recipe.missingEquipment.length > 0 && (
                        <div className="mt-4 pt-4 border-t space-y-2">
                          <h4 className="text-sm font-medium">Missing Equipment:</h4>
                          <div className="flex flex-wrap gap-2">
                            {recipe.missingEquipment.map((item, index) => (
                              <Badge key={index} variant="outline" className="text-red-500 border-red-200">{item}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {compatibility.suggestedUpgrades.length > 0 && (
          <div className="mt-8 pt-6 border-t">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-lg">Suggested Equipment Upgrades</h3>
              <Button variant="outline" size="sm" className="text-xs flex gap-1">
                <ShoppingCart className="h-3 w-3" /> View All Recommendations
              </Button>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-3">
              {compatibility.suggestedUpgrades.slice(0, 3).map((upgrade, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-2">
                      <h4 className="font-medium">{upgrade.itemName}</h4>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Impact:</span>
                        <div className="flex items-center">
                          <Progress 
                            value={upgrade.improvementImpact} 
                            className="w-16 h-2 mr-2 [&>div]:bg-blue-500" 
                          />
                          <span>{upgrade.improvementImpact}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Versatility:</span>
                        <div className="flex items-center">
                          <Progress 
                            value={upgrade.versatility} 
                            className="w-16 h-2 mr-2 [&>div]:bg-purple-500" 
                          />
                          <span>{upgrade.versatility}%</span>
                        </div>
                      </div>
                      {upgrade.estimatedPrice && (
                        <div className="flex justify-between items-center text-xs mt-1">
                          <span className="text-muted-foreground">Est. Price:</span>
                          <span className="font-medium">{upgrade.estimatedPrice}</span>
                        </div>
                      )}
                      {upgrade.recipeUnlocks.length > 0 && (
                        <div className="text-xs mt-2">
                          <span className="text-muted-foreground">Unlocks:</span>
                          <div className="mt-1">
                            {upgrade.recipeUnlocks.slice(0, 2).map((recipe, i) => (
                              <Badge key={i} variant="secondary" className="mr-1 mb-1">
                                {recipe}
                              </Badge>
                            ))}
                            {upgrade.recipeUnlocks.length > 2 && (
                              <Badge variant="outline" className="mr-1 mb-1">
                                +{upgrade.recipeUnlocks.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}