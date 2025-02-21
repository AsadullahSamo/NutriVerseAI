import { Recipe } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Clock, Users, GitFork } from "lucide-react";
import { NutritionDisplay } from "@/components/nutrition-display";
import { RecipeActions } from "./recipe-actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RecipeCardProps {
  recipe: Recipe & { postId?: number };
  compact?: boolean;
  showDelete?: boolean;
}

export function RecipeCard({ recipe, compact = false, showDelete = false }: RecipeCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {recipe.imageUrl && !compact && (
        <div className="relative aspect-[16/9]">
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="object-cover w-full h-full"
          />
        </div>
      )}
      <CardHeader className="p-4 relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold leading-none tracking-tight">
              {recipe.title}
            </h3>
            {recipe.forkedFrom && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <GitFork className="h-3 w-3" />
                Forked recipe
              </p>
            )}
            {!compact && (
              <p className="text-sm text-muted-foreground mt-2">
                {recipe.description}
              </p>
            )}
          </div>
          <RecipeActions recipe={recipe} size="sm" showDelete={showDelete} />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {recipe.prepTime} mins
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0} ingredients
          </span>
        </div>

        {!compact && (
          <>
            <NutritionDisplay nutrition={recipe.nutritionInfo} />
          </>
        )}
      </CardContent>
    </Card>
  );
}