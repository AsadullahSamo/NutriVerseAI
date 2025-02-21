import { Recipe } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Clock, Users, GitFork } from "lucide-react";
import { NutritionDisplay } from "@/components/nutrition-display";
import { RecipeActions } from "./recipe-actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface RecipeCardProps {
  recipe: Recipe & { postId?: number };
  compact?: boolean;
  showDelete?: boolean;
  hideEditDelete?: boolean;
}

export function RecipeCard({ recipe, compact = false, showDelete = false, hideEditDelete = false }: RecipeCardProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      <div className="flex flex-col flex-grow">
        {!hideEditDelete && (
          <div className="border-b bg-secondary/10">
            <div className="px-2 py-1">
              <RecipeActions 
                recipe={recipe} 
                size="sm" 
                showDelete={showDelete}
                hideEditDelete={hideEditDelete}
              />
            </div>
          </div>
        )}
        <CardHeader className="p-5">
          {recipe.imageUrl && !compact && (
            <div className="relative aspect-[16/9] -mx-5 -mt-5 mb-5">
              <img
                src={recipe.imageUrl}
                alt={recipe.title}
                className="object-cover w-full h-full"
              />
            </div>
          )}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg tracking-tight">
                {recipe.title}
              </h3>
              {recipe.forkedFrom && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1.5">
                  <GitFork className="h-3 w-3 flex-shrink-0" />
                  Forked recipe
                </p>
              )}
            </div>
            {!compact && recipe.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {recipe.description}
              </p>
            )}
          </div>
        </CardHeader>
        <div className="mt-auto">
          <div className="px-4 py-2.5 border-t bg-muted/5">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 flex-shrink-0" />
                {recipe.prepTime} mins
              </span>
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 flex-shrink-0" />
                {Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0} ingredients
              </span>
            </div>
          </div>
          {!compact && (
            <div className="p-4 border-t">
              <NutritionDisplay nutrition={recipe.nutritionInfo as any} />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}