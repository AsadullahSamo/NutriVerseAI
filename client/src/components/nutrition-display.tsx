import { Progress } from "@/components/ui/progress";

interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutritionDisplayProps {
  nutrition: NutritionInfo;
}

export function NutritionDisplay({ nutrition }: NutritionDisplayProps) {
  const maxValues = {
    calories: 800,
    protein: 50,
    carbs: 100,
    fat: 35,
  };

  const getPercentage = (value: number, max: number) => 
    Math.min(Math.round((value / max) * 100), 100);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Nutrition Information</h4>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Calories</span>
          <span className="text-muted-foreground">{nutrition.calories} kcal</span>
        </div>
        <Progress value={getPercentage(nutrition.calories, maxValues.calories)} className="h-2" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Protein</span>
            <span className="text-muted-foreground">{nutrition.protein}g</span>
          </div>
          <Progress value={getPercentage(nutrition.protein, maxValues.protein)} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Carbs</span>
            <span className="text-muted-foreground">{nutrition.carbs}g</span>
          </div>
          <Progress value={getPercentage(nutrition.carbs, maxValues.carbs)} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Fat</span>
            <span className="text-muted-foreground">{nutrition.fat}g</span>
          </div>
          <Progress value={getPercentage(nutrition.fat, maxValues.fat)} className="h-2" />
        </div>
      </div>
    </div>
  );
}
