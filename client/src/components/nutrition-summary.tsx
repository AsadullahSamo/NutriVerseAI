import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart } from "@/components/ui/chart";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format, startOfWeek, startOfMonth, eachDayOfInterval } from "date-fns";
import { Loader2, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type TimePeriod = "week" | "month";
type MealType = "all" | "breakfast" | "lunch" | "dinner" | "snack";

export function NutritionSummary() {
  const [period, setPeriod] = React.useState<TimePeriod>("week");
  const [mealType, setMealType] = React.useState<MealType>("all");

  const { data: currentGoal, isLoading: goalsLoading } = useQuery({
    queryKey: ["/api/nutrition-goals/current"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/nutrition-goals/current");
      return res.json();
    },
  });

  const { data: consumptionHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/recipes/consumption-history", period],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: getDateRange().start.toISOString(),
        endDate: getDateRange().end.toISOString(),
      });
      const res = await apiRequest("GET", `/api/recipes/consumption-history?${params}`);
      return res.json();
    },
  });

  const isLoading = goalsLoading || historyLoading;

  const getDateRange = () => {
    const today = new Date();
    if (period === "week") {
      return {
        start: startOfWeek(today),
        end: today
      };
    }
    return {
      start: startOfMonth(today),
      end: today
    };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!currentGoal?.progress) return null;

  const { start, end } = getDateRange();
  const dateRange = eachDayOfInterval({ start, end });
  
  // Filter and aggregate data by meal type
  const filteredProgressData = dateRange.map(date => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayProgress = currentGoal.progress.find((p: any) => p.date === dateStr);
    
    // Get consumption for this date filtered by meal type
    const dayConsumption = (consumptionHistory || [])
      .filter(c => {
        const consumed = new Date(c.consumedAt).toDateString() === date.toDateString();
        return mealType === "all" ? consumed : consumed && c.mealType === mealType;
      })
      .reduce((acc, curr) => {
        const recipe = curr.recipe?.nutritionInfo || { calories: 0, protein: 0, carbs: 0, fat: 0 };
        return {
          calories: acc.calories + (recipe.calories * curr.servings),
          protein: acc.protein + (recipe.protein * curr.servings),
          carbs: acc.carbs + (recipe.carbs * curr.servings),
          fat: acc.fat + (recipe.fat * curr.servings),
        };
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    return {
      date: format(date, "MMM dd"),
      calories: dayConsumption.calories || dayProgress?.calories || 0,
      protein: dayConsumption.protein || dayProgress?.protein || 0,
      carbs: dayConsumption.carbs || dayProgress?.carbs || 0,
      fat: dayConsumption.fat || dayProgress?.fat || 0,
      targetCalories: currentGoal.dailyCalories,
      targetProtein: currentGoal.dailyProtein,
      targetCarbs: currentGoal.dailyCarbs,
      targetFat: currentGoal.dailyFat,
    };
  });

  // Calculate averages
  const averages = filteredProgressData.reduce((acc, day) => ({
    calories: acc.calories + day.calories,
    protein: acc.protein + day.protein,
    carbs: acc.carbs + day.carbs,
    fat: acc.fat + day.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const days = filteredProgressData.length;
  Object.keys(averages).forEach(key => {
    averages[key as keyof typeof averages] = Math.round(averages[key as keyof typeof averages] / days);
  });

  // Calculate meal type distribution
  const mealDistribution = (consumptionHistory || []).reduce((acc, curr) => {
    acc[curr.mealType] = (acc[curr.mealType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">
          {period === "week" ? "Weekly" : "Monthly"} Summary
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={mealType} onValueChange={(value) => setMealType(value as MealType)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Meals</SelectItem>
              <SelectItem value="breakfast">Breakfast</SelectItem>
              <SelectItem value="lunch">Lunch</SelectItem>
              <SelectItem value="dinner">Dinner</SelectItem>
              <SelectItem value="snack">Snacks</SelectItem>
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={(value) => setPeriod(value as TimePeriod)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{averages.calories}</div>
              <p className="text-xs text-muted-foreground">Avg. Calories</p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((averages.calories / currentGoal.dailyCalories) * 100)}% of goal
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{averages.protein}g</div>
              <p className="text-xs text-muted-foreground">Avg. Protein</p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((averages.protein / currentGoal.dailyProtein) * 100)}% of goal
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{averages.carbs}g</div>
              <p className="text-xs text-muted-foreground">Avg. Carbs</p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((averages.carbs / currentGoal.dailyCarbs) * 100)}% of goal
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{averages.fat}g</div>
              <p className="text-xs text-muted-foreground">Avg. Fat</p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((averages.fat / currentGoal.dailyFat) * 100)}% of goal
              </p>
            </CardContent>
          </Card>
        </div>

        {consumptionHistory && consumptionHistory.length > 0 ? (
          <Card className="p-4">
            <h4 className="text-sm font-medium mb-3">Meal Distribution</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(mealDistribution).map(([type, count]) => (
                <Button
                  key={type}
                  variant={mealType === type ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setMealType(type as MealType)}
                >
                  <span className="capitalize">{type}</span>
                  <Badge variant="secondary">{count}</Badge>
                </Button>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No meal consumption data available for this period.</p>
          </Card>
        )}

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-3">Calories Trend</h4>
            <LineChart
              data={filteredProgressData}
              categories={["calories", "targetCalories"]}
              index="date"
              colors={["#f97316", "#94a3b8"]}
              valueFormatter={(value: number) => `${value} kcal`}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-3">Protein</h4>
              <LineChart
                data={filteredProgressData}
                categories={["protein", "targetProtein"]}
                index="date"
                colors={["#22c55e", "#94a3b8"]}
                valueFormatter={(value: number) => `${value}g`}
              />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3">Carbs</h4>
              <LineChart
                data={filteredProgressData}
                categories={["carbs", "targetCarbs"]}
                index="date"
                colors={["#3b82f6", "#94a3b8"]}
                valueFormatter={(value: number) => `${value}g`}
              />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3">Fat</h4>
              <LineChart
                data={filteredProgressData}
                categories={["fat", "targetFat"]}
                index="date"
                colors={["#8b5cf6", "#94a3b8"]}
                valueFormatter={(value: number) => `${value}g`}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}