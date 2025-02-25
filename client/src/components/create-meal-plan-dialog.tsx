import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { addDays } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateMealPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateMealPlanDialog({ open, onOpenChange }: CreateMealPlanDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [preferences, setPreferences] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [calorieTarget, setCalorieTarget] = useState("");
  const [days, setDays] = useState("7");
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  const { data: currentGoal } = useQuery({
    queryKey: ["/api/nutrition-goals/current"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/nutrition-goals/current");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!startDate) throw new Error("Start date is required");
      
      const response = await apiRequest("POST", "/api/meal-plans", {
        title,
        startDate,
        endDate: addDays(startDate, parseInt(days) - 1),
        preferences: preferences.split(',').map(p => p.trim()),
        dietaryRestrictions: dietaryRestrictions ? dietaryRestrictions.split(',').map(r => r.trim()) : undefined,
        calorieTarget: calorieTarget ? parseInt(calorieTarget) : undefined,
        days: parseInt(days)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      toast({
        title: "Success",
        description: "Your meal plan has been created.",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create meal plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setStartDate(undefined);
    setPreferences("");
    setDietaryRestrictions("");
    setCalorieTarget("");
    setDays("7");
  };

  const validateNutrition = (meals: any) => {
    if (!currentGoal) return { valid: true };

    const dailyTotals = Object.values(meals).reduce((acc: any, meal: any) => {
      if (Array.isArray(meal)) {
        meal.forEach((snack: any) => {
          const nutrition = parseNutritionString(snack.nutritionalInfo);
          acc.calories += nutrition.calories;
          acc.protein += nutrition.protein;
          acc.carbs += nutrition.carbs;
          acc.fat += nutrition.fat;
        });
      } else {
        const nutrition = parseNutritionString(meal.nutritionalInfo);
        acc.calories += nutrition.calories;
        acc.protein += nutrition.protein;
        acc.carbs += nutrition.carbs;
        acc.fat += nutrition.fat;
      }
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const exceedances = {
      calories: dailyTotals.calories > currentGoal.dailyCalories,
      protein: dailyTotals.protein > currentGoal.dailyProtein,
      carbs: dailyTotals.carbs > currentGoal.dailyCarbs,
      fat: dailyTotals.fat > currentGoal.dailyFat,
    };

    return {
      valid: !Object.values(exceedances).some(v => v),
      exceedances,
      totals: dailyTotals
    };
  };

  const parseNutritionString = (nutritionStr: string) => {
    const defaults = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    try {
      const matches = {
        calories: nutritionStr.match(/(\d+)\s*kcal/),
        protein: nutritionStr.match(/(\d+)g\s*protein/),
        carbs: nutritionStr.match(/(\d+)g\s*carbs/),
        fat: nutritionStr.match(/(\d+)g\s*fat/),
      };

      return {
        calories: matches.calories ? parseInt(matches.calories[1]) : defaults.calories,
        protein: matches.protein ? parseInt(matches.protein[1]) : defaults.protein,
        carbs: matches.carbs ? parseInt(matches.carbs[1]) : defaults.carbs,
        fat: matches.fat ? parseInt(matches.fat[1]) : defaults.fat,
      };
    } catch (e) {
      return defaults;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Meal Plan</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="My Meal Plan"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Start Date</Label>
            <div className="flex justify-center p-2 border rounded-lg bg-card">
              <div className="w-full max-w-sm">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  className="mx-auto rounded-md shadow-sm"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="days">Number of Days</Label>
            <Input
              id="days"
              type="number"
              min="1"
              max="30"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferences">Preferences</Label>
            <Input
              id="preferences"
              placeholder="healthy, quick meals, vegetarian"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dietaryRestrictions">Dietary Restrictions</Label>
            <Input
              id="dietaryRestrictions"
              placeholder="gluten-free, dairy-free"
              value={dietaryRestrictions}
              onChange={(e) => setDietaryRestrictions(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="calorieTarget">Daily Calorie Target</Label>
            <Input
              id="calorieTarget"
              type="number"
              placeholder="2000"
              value={calorieTarget}
              onChange={(e) => setCalorieTarget(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-primary"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Create Plan
            </Button>
          </div>
        </form>

        {generatedPlan && currentGoal && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Nutrition Analysis</h3>
            {generatedPlan.meals.map((day: any, index: number) => {
              const validation = validateNutrition(day.meals);
              return (
                <div key={index} className="space-y-2">
                  <p className="text-sm font-medium">Day {day.day}</p>
                  {!validation.valid && (
                    <Alert variant="warning">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <span className="font-medium">Exceeds daily goals:</span>
                        <div className="flex gap-2 mt-2">
                          {validation.exceedances.calories && (
                            <Badge variant="outline" className="text-yellow-500">
                              Calories +{validation.totals.calories - currentGoal.dailyCalories}
                            </Badge>
                          )}
                          {validation.exceedances.protein && (
                            <Badge variant="outline" className="text-yellow-500">
                              Protein +{validation.totals.protein - currentGoal.dailyProtein}g
                            </Badge>
                          )}
                          {validation.exceedances.carbs && (
                            <Badge variant="outline" className="text-yellow-500">
                              Carbs +{validation.totals.carbs - currentGoal.dailyCarbs}g
                            </Badge>
                          )}
                          {validation.exceedances.fat && (
                            <Badge variant="outline" className="text-yellow-500">
                              Fat +{validation.totals.fat - currentGoal.dailyFat}g
                            </Badge>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}