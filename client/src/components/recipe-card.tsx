import React from "react";
import { Recipe } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Clock, Users, GitFork, ListOrdered, Check, Utensils, Loader2, MoreHorizontal, Trash2, Leaf } from "lucide-react";
import { NutritionDisplay } from "@/components/nutrition-display";
import { RecipeActions } from "./recipe-actions";
import { MoodTracker } from "./mood-tracker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface RecipeCardProps {
  recipe: Recipe & { 
    postId?: number;
    ingredients: string[];
    instructions: string[];
  };
  compact?: boolean;
  showDelete?: boolean;
  hideEditDelete?: boolean;
}

export function RecipeCard({ recipe, compact = false, showDelete = false, hideEditDelete = false }: RecipeCardProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showConsumeDialog, setShowConsumeDialog] = React.useState(false);
  const [servings, setServings] = React.useState(1);
  const [mealType, setMealType] = React.useState<string>("snack");
  const [showNutritionWarning, setShowNutritionWarning] = React.useState(false);
  const [exceededNutrients, setExceededNutrients] = React.useState<any>(null);

  // Ensure sustainabilityScore always has a value, defaulting to 50 if not set
  const sustainabilityScore = recipe.sustainabilityScore ?? 50;

  const { data: currentGoal } = useQuery({
    queryKey: ["/api/nutrition-goals/current"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/nutrition-goals/current");
      return res.json();
    },
  });

  const { data: todayProgress } = useQuery({
    queryKey: ["nutrition-progress", new Date().toISOString().split('T')[0]],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/nutrition-goals/progress/today");
      return res.json();
    },
    enabled: !!currentGoal,
  });

  const checkNutritionLimits = () => {
    if (!currentGoal || !todayProgress) return { exceedsLimits: false };

    const nutritionInfo = recipe.nutritionInfo as any;
    const totalNutrition = {
      calories: todayProgress.calories + (nutritionInfo.calories * servings),
      protein: todayProgress.protein + (nutritionInfo.protein * servings),
      carbs: todayProgress.carbs + (nutritionInfo.carbs * servings),
      fat: todayProgress.fat + (nutritionInfo.fat * servings),
    };

    const exceedances = {
      calories: totalNutrition.calories > currentGoal.dailyCalories,
      protein: totalNutrition.protein > currentGoal.dailyProtein,
      carbs: totalNutrition.carbs > currentGoal.dailyCarbs,
      fat: totalNutrition.fat > currentGoal.dailyFat,
    };

    return {
      exceedsLimits: Object.values(exceedances).some(v => v),
      exceededNutrients: Object.entries(exceedances)
        .filter(([_, exceeds]) => exceeds)
        .map(([nutrient]) => ({
          name: nutrient,
          current: totalNutrition[nutrient as keyof typeof totalNutrition],
          limit: currentGoal[`daily${nutrient.charAt(0).toUpperCase() + nutrient.slice(1)}` as keyof typeof currentGoal],
        })),
    };
  };

  const handleConsume = () => {
    const { exceedsLimits, exceededNutrients } = checkNutritionLimits();
    if (exceedsLimits) {
      setExceededNutrients(exceededNutrients);
      setShowNutritionWarning(true);
    } else {
      consumeMutation.mutate();
    }
  };

  const consumeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/recipes/${recipe.id}/consume`, {
        servings,
        mealType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition-goals/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes/consumption-history"] });
      setShowConsumeDialog(false);
      toast({
        title: "Recipe consumed!",
        description: "Your nutrition progress has been updated.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/recipes/${recipe.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Recipe deleted",
        description: "Recipe has been deleted successfully.",
      });
    },
  });

  const onDelete = () => {
    deleteMutation.mutate();
  };

  // Helper function to get sustainability color
  const getSustainabilityColor = (score: number) => {
    if (score >= 70) return 'bg-green-500/10 text-green-600 dark:text-green-400';
    if (score >= 40) return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
    return 'bg-red-500/10 text-red-600 dark:text-red-400';
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
        <div className="relative flex flex-col flex-grow">
          {!hideEditDelete && (
            <div className="border-b bg-secondary/10">
              <div className="px-2 py-1">
                <RecipeActions 
                  recipe={recipe} 
                  size="sm" 
                  showDelete={showDelete}
                  hideEditDelete={hideEditDelete}
                />
              </div>
            </div>
          )}
          <CardHeader className="p-5">
            {recipe.imageUrl && !compact && (
              <div className="relative aspect-[16/9] -mx-5 -mt-5 mb-5">
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-lg tracking-tight">
                  {recipe.title}
                </h3>
                {recipe.forkedFrom && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1.5">
                    <GitFork className="h-3 w-3 flex-shrink-0" />
                    Forked recipe
                  </p>
                )}
              </div>
              {!compact && recipe.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {recipe.description}
                </p>
              )}
            </div>
          </CardHeader>
          <div className="mt-auto">
            <div className="px-4 py-2.5 border-t bg-muted/5">
              <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs">{recipe.prepTime} {recipe.prepTime === 1 ? 'min' : 'mins'}</span>
                    </div>
                  </div>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4 flex-shrink-0" />
                          <span>{recipe.ingredients.length} {recipe.ingredients.length === 1 ? 'ingredient' : 'ingredients'}</span>
                        </span>
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80 bg-card border-border shadow-lg">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-primary border-b pb-2">Ingredients</h4>
                        <ul className="list-disc pl-4 space-y-1.5 max-h-[200px] overflow-y-auto pr-2">
                          {recipe.ingredients.map((ingredient: string, index: number) => (
                            <li key={index} className="text-sm text-muted-foreground">{ingredient}</li>
                          ))}
                        </ul>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                  {!compact && recipe.instructions && recipe.instructions.length > 0 && (
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
                          <span className="flex items-center gap-2">
                            <ListOrdered className="h-4 w-4 flex-shrink-0" />
                            <span>{recipe.instructions.length} {recipe.instructions.length === 1 ? 'step' : 'steps'}</span>
                          </span>
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80 bg-card border-border shadow-lg">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-primary border-b pb-2">Instructions</h4>
                          <ol className="list-decimal pl-4 space-y-1.5 max-h-[250px] overflow-y-auto pr-2">
                            {recipe.instructions.map((instruction: string, index: number) => (
                              <li key={index} className="text-sm text-muted-foreground">{instruction}</li>
                            ))}
                          </ol>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  )}
                </div>

                {/* Always show sustainability score */}
                <div className="flex items-center gap-2 ml-auto">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-medium text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Leaf className="h-3 w-3" />
                        Sustainability
                      </span>
                    </span>
                    <div className={`px-2 py-0.5 rounded ${getSustainabilityColor(recipe.sustainabilityScore || 50)}`}>
                      <span className="font-medium">{recipe.sustainabilityScore || 50}/100</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {!compact && (
              <>
                <div className="p-4 border-t">
                  <NutritionDisplay nutrition={recipe.nutritionInfo as any} />
                </div>
                <div className="p-4 border-t">
                  <MoodTracker recipeId={recipe.id} />
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Footer with actions */}
        <CardContent className="p-4 border-t flex justify-end items-center">
          {/* Right-aligned consume button with text */}
          <Button 
            variant="ghost"
            onClick={() => setShowConsumeDialog(true)}
            className="hover:bg-primary/10 text-muted-foreground"
            title="Log this meal"
          >
            <Utensils className="h-4 w-4 mr-2" />
            Consume
          </Button>
        </CardContent>
        
        <Dialog open={showConsumeDialog} onOpenChange={setShowConsumeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Meal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Meal Type</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <span className="capitalize">{mealType}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    {["breakfast", "lunch", "dinner", "snack"].map((type) => (
                      <DropdownMenuItem
                        key={type}
                        onSelect={() => setMealType(type)}
                        className="capitalize"
                      >
                        {type}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="space-y-2">
                <Label>Servings</Label>
                <Input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                />
              </div>
              <div className="pt-4">
                <Button 
                  className="w-full" 
                  onClick={handleConsume}
                  disabled={consumeMutation.isPending}
                >
                  {consumeMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Log Meal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <AlertDialog open={showNutritionWarning} onOpenChange={setShowNutritionWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <AlertDialogTitle>Exceeds Daily Goals</AlertDialogTitle>
              </div>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  <div>
                    Adding this meal will exceed your daily nutrition goals:
                  </div>
                  <div className="space-y-2">
                    {exceededNutrients?.map((nutrient: any) => (
                      <div key={nutrient.name} className="flex justify-between text-sm">
                        <span className="capitalize">{nutrient.name}</span>
                        <span className="text-yellow-500">
                          {nutrient.current} / {nutrient.limit} 
                          {nutrient.name === 'calories' ? ' kcal' : 'g'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="font-medium">
                    Would you like to proceed anyway?
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowNutritionWarning(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setShowNutritionWarning(false);
                  consumeMutation.mutate();
                }}
              >
                Log Anyway
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </>
  );
}