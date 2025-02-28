import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Plus, Timer, Package, UtensilsCrossed } from "lucide-react";
import { CreateMealPrepPlanDialog } from "./create-meal-prep-plan-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface RecipeInstructions {
  title: string;
  servings: number;
  ingredients: Array<{
    item: string;
    amount: string;
    storageMethod: string;
    shelfLife: string;
  }>;
  instructions: string;
  prepTime: string;
  storageInstructions: Array<{
    container: string;
    portion: string;
    method: string;
    duration: string;
  }>;
  reheatingInstructions: string;
  nutritionPerServing: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface GroceryCategory {
  category: string;
  items: Array<{
    name: string;
    amount: string;
    note?: string;
  }>;
}

interface PrepStep {
  step: number;
  description: string;
  duration: string;
}

interface MealPrepPlan {
  weeklyPlan: {
    recipes: RecipeInstructions[];
    groceryList: GroceryCategory[];
    prepSchedule: {
      totalTime: string;
      steps: PrepStep[];
    };
  };
}

export function MealPrepPlanner() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: mealPrepPlan, isLoading } = useQuery<MealPrepPlan>({
    queryKey: ["/api/meal-prep/current"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/meal-prep/current");
      return res.json();
    },
  });

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Meal Prep Planner</h1>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-primary">
          <Plus className="w-4 h-4 mr-2" />
          Create Prep Plan
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : mealPrepPlan ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recipes Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5" />
                Batch Cooking Recipes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {mealPrepPlan.weeklyPlan.recipes.map((recipe, index) => (
                  <AccordionItem key={index} value={`recipe-${index}`}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-4">
                        <span>{recipe.title}</span>
                        <Badge variant="secondary">{recipe.servings} servings</Badge>
                        <Badge variant="outline">{recipe.prepTime}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        <div>
                          <h4 className="font-semibold mb-2">Ingredients</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {recipe.ingredients.map((ingredient, idx) => (
                              <li key={idx} className="text-sm">
                                {ingredient.amount} {ingredient.item}
                                <span className="text-muted-foreground ml-2">
                                  (Store: {ingredient.storageMethod}, Shelf life: {ingredient.shelfLife})
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Instructions</h4>
                          <p className="text-sm whitespace-pre-line">{recipe.instructions}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Storage Instructions</h4>
                          <ul className="space-y-2">
                            {recipe.storageInstructions.map((instruction, idx) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <Package className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>
                                  {instruction.portion} in {instruction.container} - 
                                  {instruction.method} for {instruction.duration}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Reheating Instructions</h4>
                          <p className="text-sm">{recipe.reheatingInstructions}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Nutrition (per serving)</h4>
                          <div className="flex gap-4">
                            <Badge variant="secondary">
                              {recipe.nutritionPerServing.calories} calories
                            </Badge>
                            <Badge variant="secondary">
                              {recipe.nutritionPerServing.protein}g protein
                            </Badge>
                            <Badge variant="secondary">
                              {recipe.nutritionPerServing.carbs}g carbs
                            </Badge>
                            <Badge variant="secondary">
                              {recipe.nutritionPerServing.fat}g fat
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Prep Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5" />
                  Prep Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <Badge variant="outline" className="mb-4">
                    Total Time: {mealPrepPlan.weeklyPlan.prepSchedule.totalTime}
                  </Badge>
                </div>
                <ScrollArea className="h-[300px] pr-4">
                  <ol className="space-y-4">
                    {mealPrepPlan.weeklyPlan.prepSchedule.steps.map((step) => (
                      <li key={step.step} className="flex gap-4">
                        <Badge variant="outline" className="flex-shrink-0">
                          {step.duration}
                        </Badge>
                        <p className="text-sm">{step.description}</p>
                      </li>
                    ))}
                  </ol>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Shopping List */}
            <Card>
              <CardHeader>
                <CardTitle>Shopping List</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <Accordion type="single" collapsible className="w-full">
                    {mealPrepPlan.weeklyPlan.groceryList.map((category, index) => (
                      <AccordionItem key={index} value={`category-${index}`}>
                        <AccordionTrigger>{category.category}</AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2">
                            {category.items.map((item, idx) => (
                              <li key={idx} className="text-sm flex justify-between">
                                <span>{item.name}</span>
                                <span className="text-muted-foreground">{item.amount}</span>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
          <p className="text-muted-foreground">
            No meal prep plan created yet.
          </p>
          <Button
            variant="outline"
            onClick={() => setShowCreateDialog(true)}
          >
            Create New Plan
          </Button>
        </div>
      )}

      <CreateMealPrepPlanDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}