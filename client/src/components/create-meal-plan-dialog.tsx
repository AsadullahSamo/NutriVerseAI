import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { addDays } from "date-fns";

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
            <div className="w-full flex justify-center border rounded-lg p-3">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                className="w-full"
                required
              />
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
      </DialogContent>
    </Dialog>
  );
}