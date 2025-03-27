export interface CulturalCuisineDetails {
  name: string;
  region: string;
  description: string;
  keyIngredients: string[];
  cookingTechniques: string[];
  culturalContext: {
    history: string;
    traditions: string;
    festivals: string;
    influences: string;
  };
  servingEtiquette: {
    tableSettings: string;
    diningCustoms: string;
    servingOrder: string;
    taboos: string;
    summary: string;
  };
}

export interface CreateCulturalRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (recipe: any) => void;
  cuisine: string;
} 