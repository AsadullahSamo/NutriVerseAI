
import React from "react";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRecipeSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface CreateRecipeDialogProps {
  trigger?: React.ReactNode;
}

export function CreateRecipeDialog({ trigger }: CreateRecipeDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertRecipeSchema),
    defaultValues: {
      title: "",
      description: "",
      ingredients: [],
      instructions: [],
      nutritionInfo: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      },
      prepTime: 0,
      createdBy: user?.id,
      likes: 0,
      imageUrl: "",
      sustainabilityScore: 50,
      wastageReduction: {}
    },
    mode: "onChange"
  });

  // Watch for changes in ingredients and nutrition info
  const ingredients = form.watch("ingredients");
  const nutritionInfo = form.watch("nutritionInfo");
  
  // Calculate sustainability score whenever ingredients or nutrition info changes
  const currentSustainabilityScore = useMemo(() => {
    let score = 50;
    let modifiers = 0;

    // Check for sustainable ingredients
    if (Array.isArray(ingredients)) {
      const sustainableKeywords = ['organic', 'local', 'seasonal', 'plant-based', 'sustainable'];
      ingredients.forEach(ingredient => {
        const lowerIngredient = ingredient.toLowerCase();
        sustainableKeywords.forEach(keyword => {
          if (lowerIngredient.includes(keyword)) {
            modifiers += 5;
          }
        });
      });
    }

    // Calculate nutrition-based modifiers
    if (nutritionInfo) {
      const calories = Number(nutritionInfo.calories) || 0;
      const protein = Number(nutritionInfo.protein) || 0;
      const carbs = Number(nutritionInfo.carbs) || 0;
      const fat = Number(nutritionInfo.fat) || 0;

      const totalMacros = protein + carbs + fat;
      if (totalMacros > 0) {
        // Calculate macronutrient ratios
        const proteinRatio = protein / totalMacros;
        const carbsRatio = carbs / totalMacros;
        const fatRatio = fat / totalMacros;

        // Award points for balanced macros
        if (proteinRatio >= 0.25 && proteinRatio <= 0.35) modifiers += 5;
        if (carbsRatio >= 0.45 && carbsRatio <= 0.55) modifiers += 5;
        if (fatRatio >= 0.15 && fatRatio <= 0.25) modifiers += 5;

        // Bonus for including all macros
        if (protein > 0 && carbs > 0 && fat > 0) {
          modifiers += 5;
        }
      }

      // Award points for reasonable portions
      if (calories > 0) {
        if (calories <= 400) modifiers += 10;
        else if (calories <= 600) modifiers += 5;
      }

      // Award points for good protein content
      if (protein >= 15 && protein <= 30) modifiers += 5;
    }

    // Calculate final score
    const finalScore = Math.min(100, Math.max(0, score + modifiers));
    
    // Update the form value
    form.setValue("sustainabilityScore", finalScore);
    
    return finalScore;
  }, [ingredients, nutritionInfo, form]);

  // Track the latest calculated score in a ref to ensure it's available during form submission
  const latestScoreRef = React.useRef(currentSustainabilityScore);
  React.useEffect(() => {
    latestScoreRef.current = currentSustainabilityScore;
  }, [currentSustainabilityScore]);

  const createRecipeMutation = useMutation({
    mutationFn: async (data: any) => {
      // Always use the latest calculated score
      const payload = {
        ...data,
        sustainabilityScore: latestScoreRef.current
      };
      
      const res = await apiRequest("POST", "/api/recipes", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Recipe created!",
        description: "Your recipe has been added successfully.",
      });
    },
  });

  // Modify the form submit handler to ensure the latest score is used
  const onSubmit = (data: any) => {
    createRecipeMutation.mutate({
      ...data,
      sustainabilityScore: latestScoreRef.current
    });
  };

  const { data: currentGoal } = useQuery({
    queryKey: ["/api/nutrition-goals/current"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/nutrition-goals/current");
      return res.json();
    },
  });

  const validateAgainstGoals = (nutritionInfo: any) => {
    if (!currentGoal) return { valid: true };

    const exceeds = {
      calories: nutritionInfo.calories > currentGoal.dailyCalories,
      protein: nutritionInfo.protein > currentGoal.dailyProtein,
      carbs: nutritionInfo.carbs > currentGoal.dailyCarbs,
      fat: nutritionInfo.fat > currentGoal.dailyFat,
    };

    return {
      valid: !Object.values(exceeds).some(v => v),
      exceeds,
      percentages: {
        calories: Math.round((nutritionInfo.calories / currentGoal.dailyCalories) * 100),
        protein: Math.round((nutritionInfo.protein / currentGoal.dailyProtein) * 100),
        carbs: Math.round((nutritionInfo.carbs / currentGoal.dailyCarbs) * 100),
        fat: Math.round((nutritionInfo.fat / currentGoal.dailyFat) * 100),
      }
    };
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Recipe
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-background pb-4 mb-4">
          <DialogTitle>Create New Recipe</DialogTitle>
        </DialogHeader>
        <div className="px-1 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ingredients"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ingredients (one per line)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={Array.isArray(field.value) ? field.value.join('\n') : ''} 
                        onChange={e => field.onChange(e.target.value.split('\n').filter(Boolean))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions (one per line)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={Array.isArray(field.value) ? field.value.join('\n') : ''} 
                        onChange={e => field.onChange(e.target.value.split('\n').filter(Boolean))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prepTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preparation Time (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nutritionInfo.calories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calories</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nutritionInfo.protein"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Protein (g)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nutritionInfo.carbs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carbs (g)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nutritionInfo.fat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fat (g)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Alert variant="default">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <div className="flex justify-between items-center">
                      <span>Sustainability Score</span>
                      <div className={`px-2 py-0.5 rounded ${
                        currentSustainabilityScore >= 70 ? 'bg-green-500/10 text-green-600' :
                        currentSustainabilityScore >= 40 ? 'bg-yellow-500/10 text-yellow-600' :
                        'bg-red-500/10 text-red-600'
                      }`}>
                        <span className="font-medium">{currentSustainabilityScore}/100</span>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <p>Score is calculated based on:</p>
                      <ul className="list-disc pl-4">
                        <li>Use of sustainable ingredients (organic, local, seasonal)</li>
                        <li>Balanced macronutrient ratios</li>
                        <li>Appropriate portion sizes</li>
                        <li>Overall nutritional balance</li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
              {currentGoal && (
                <div className="mt-2">
                  {(() => {
                    const validation = validateAgainstGoals(form.getValues("nutritionInfo"));
                    if (!validation.valid) {
                      return (
                        <Alert variant="default">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <span className="font-medium">High nutritional values:</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {validation.percentages && Object.entries(validation.percentages).map(([key, value]) => (
                                validation.exceeds && validation.exceeds[key as keyof typeof validation.exceeds] && (
                                  <Badge key={key} variant="outline" className="text-yellow-500">
                                    {key.charAt(0).toUpperCase() + key.slice(1)} {value}% of daily goal
                                  </Badge>
                                )
                              ))}
                            </div>
                            <p className="text-sm mt-2">
                              Consider adjusting portion sizes or ingredients to better align with your daily goals.
                            </p>
                          </AlertDescription>
                        </Alert>
                      );
                    }
                    return (
                      <div className="flex flex-wrap gap-2">
                        {validation.percentages && Object.entries(validation.percentages).map(([key, value]) => (
                          <Badge key={key} variant="outline" className="text-green-500">
                            {key.charAt(0).toUpperCase() + key.slice(1)} {value}% of daily goal
                          </Badge>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={createRecipeMutation.isPending}>
                {createRecipeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Recipe
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
