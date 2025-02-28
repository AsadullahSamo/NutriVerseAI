import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreateMealPrepPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateMealPrepPlanDialog({ open, onOpenChange }: CreateMealPrepPlanDialogProps) {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState("");
  const [servingsNeeded, setServingsNeeded] = useState("4");
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [timeAvailable, setTimeAvailable] = useState("2 hours");

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/meal-prep", {
        preferences: preferences.split(',').map(p => p.trim()),
        servingsNeeded: parseInt(servingsNeeded),
        dietaryRestrictions: dietaryRestrictions ? dietaryRestrictions.split(',').map(r => r.trim()) : undefined,
        timeAvailable
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-prep"] });
      toast({
        title: "Success",
        description: "Your meal prep plan has been created.",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create meal prep plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setPreferences("");
    setServingsNeeded("4");
    setDietaryRestrictions("");
    setTimeAvailable("2 hours");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Meal Prep Plan</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-6"
        >
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
            <Label htmlFor="servingsNeeded">Servings Per Meal</Label>
            <Select
              value={servingsNeeded}
              onValueChange={(value) => setServingsNeeded(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select servings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 serving</SelectItem>
                <SelectItem value="2">2 servings</SelectItem>
                <SelectItem value="4">4 servings</SelectItem>
                <SelectItem value="6">6 servings</SelectItem>
                <SelectItem value="8">8 servings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeAvailable">Available Prep Time</Label>
            <Select
              value={timeAvailable}
              onValueChange={(value) => setTimeAvailable(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1 hour">1 hour</SelectItem>
                <SelectItem value="2 hours">2 hours</SelectItem>
                <SelectItem value="3 hours">3 hours</SelectItem>
                <SelectItem value="4 hours">4 hours</SelectItem>
                <SelectItem value="5 hours">5 hours</SelectItem>
              </SelectContent>
            </Select>
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

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Plan"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}