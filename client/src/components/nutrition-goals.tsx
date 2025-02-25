import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { LineChart } from "@/components/ui/chart";
import type { NutritionGoal, NutritionProgress } from "@shared/schema";

export function NutritionGoals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [formData, setFormData] = React.useState({
    dailyCalories: "",
    dailyProtein: "",
    dailyCarbs: "",
    dailyFat: "",
  });

  const { data: currentGoal, isLoading } = useQuery<NutritionGoal>({
    queryKey: ["/api/nutrition-goals/current"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/nutrition-goals/current");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/nutrition-goals", {
        dailyCalories: parseInt(formData.dailyCalories),
        dailyProtein: parseInt(formData.dailyProtein),
        dailyCarbs: parseInt(formData.dailyCarbs),
        dailyFat: parseInt(formData.dailyFat),
        startDate: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition-goals/current"] });
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "Success",
        description: "Nutrition goals have been set!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to set nutrition goals. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      dailyCalories: "",
      dailyProtein: "",
      dailyCarbs: "",
      dailyFat: "",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const todayProgress = currentGoal?.progress?.find(
    (p: NutritionProgress) => p.date === today
  );

  const getProgressPercent = (current: number, target: number) =>
    Math.min(Math.round((current / target) * 100), 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Nutrition Goals</h2>
        <Button onClick={() => setShowCreateDialog(true)}>
          {currentGoal ? (
            <>
              <Edit2 className="w-4 h-4 mr-2" />
              Update Goals
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Set Goals
            </>
          )}
        </Button>
      </div>

      {currentGoal ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Calories</span>
                  <span className="text-muted-foreground">
                    {todayProgress?.calories || 0} / {currentGoal.dailyCalories}
                  </span>
                </div>
                <Progress
                  value={getProgressPercent(
                    todayProgress?.calories || 0,
                    currentGoal.dailyCalories
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Protein</span>
                    <span className="text-muted-foreground">
                      {todayProgress?.protein || 0}g / {currentGoal.dailyProtein}g
                    </span>
                  </div>
                  <Progress
                    value={getProgressPercent(
                      todayProgress?.protein || 0,
                      currentGoal.dailyProtein
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Carbs</span>
                    <span className="text-muted-foreground">
                      {todayProgress?.carbs || 0}g / {currentGoal.dailyCarbs}g
                    </span>
                  </div>
                  <Progress
                    value={getProgressPercent(
                      todayProgress?.carbs || 0,
                      currentGoal.dailyCarbs
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Fat</span>
                    <span className="text-muted-foreground">
                      {todayProgress?.fat || 0}g / {currentGoal.dailyFat}g
                    </span>
                  </div>
                  <Progress
                    value={getProgressPercent(
                      todayProgress?.fat || 0,
                      currentGoal.dailyFat
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weekly Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart
                data={currentGoal.progress.slice(-7)}
                categories={["calories", "protein", "carbs", "fat"]}
                index="date"
                colors={["#f97316", "#22c55e", "#3b82f6", "#8b5cf6"]}
                valueFormatter={(value: number) => `${value}${value > 100 ? "cal" : "g"}`}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
            <p className="text-muted-foreground">
              You haven't set any nutrition goals yet.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Set Goals
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {currentGoal ? "Update Goals" : "Set Nutrition Goals"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="dailyCalories">Daily Calories Target</Label>
              <Input
                id="dailyCalories"
                type="number"
                placeholder="e.g., 2000"
                value={formData.dailyCalories}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dailyCalories: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dailyProtein">Daily Protein Target (g)</Label>
              <Input
                id="dailyProtein"
                type="number"
                placeholder="e.g., 50"
                value={formData.dailyProtein}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dailyProtein: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dailyCarbs">Daily Carbs Target (g)</Label>
              <Input
                id="dailyCarbs"
                type="number"
                placeholder="e.g., 250"
                value={formData.dailyCarbs}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dailyCarbs: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dailyFat">Daily Fat Target (g)</Label>
              <Input
                id="dailyFat"
                type="number"
                placeholder="e.g., 70"
                value={formData.dailyFat}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dailyFat: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {currentGoal ? "Update Goals" : "Set Goals"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}