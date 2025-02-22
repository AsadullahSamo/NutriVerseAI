import { Recipe } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Clock, Users, GitFork, ListOrdered } from "lucide-react";
import { NutritionDisplay } from "@/components/nutrition-display";
import { RecipeActions } from "./recipe-actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";

interface RecipeCardProps {
  recipe: Recipe & { 
    postId?: number;
    ingredients: string[];
    instructions: string[];
  };
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
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs">{recipe.prepTime} {recipe.prepTime === 1 ? 'min' : 'mins'}</span>
                  </div>
                </div>

                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span>{recipe.ingredients.length} {recipe.ingredients.length === 1 ? 'ingredient' : 'ingredients'}</span>
                      </span>
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80 bg-card border-border shadow-lg">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-primary border-b pb-2">Ingredients</h4>
                      <ul className="list-disc pl-4 space-y-1.5 max-h-[200px] overflow-y-auto pr-2">
                        {recipe.ingredients.map((ingredient: string, index: number) => (
                          <li key={index} className="text-sm text-muted-foreground">{ingredient}</li>
                        ))}
                      </ul>
                    </div>
                  </HoverCardContent>
                </HoverCard>

                {!compact && recipe.instructions && recipe.instructions.length > 0 && (
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
                        <span className="flex items-center gap-2">
                          <ListOrdered className="h-4 w-4 flex-shrink-0" />
                          <span>{recipe.instructions.length} {recipe.instructions.length === 1 ? 'step' : 'steps'}</span>
                        </span>
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80 bg-card border-border shadow-lg">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-primary border-b pb-2">Instructions</h4>
                        <ol className="list-decimal pl-4 space-y-1.5 max-h-[250px] overflow-y-auto pr-2">
                          {recipe.instructions.map((instruction: string, index: number) => (
                            <li key={index} className="text-sm text-muted-foreground">{instruction}</li>
                          ))}
                        </ol>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )}
              </div>

              {recipe.sustainabilityScore !== null && recipe.sustainabilityScore !== undefined && (
                <div className="flex items-center gap-2 ml-auto">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-medium text-muted-foreground">Sustainability</span>
                    <div className={`px-2 py-0.5 rounded ${
                      recipe.sustainabilityScore >= 70 ? 'bg-green-500/10 text-green-600' :
                      recipe.sustainabilityScore >= 40 ? 'bg-yellow-500/10 text-yellow-600' :
                      'bg-red-500/10 text-red-600'
                    }`}>
                      <span className="font-medium">{recipe.sustainabilityScore}/100</span>
                    </div>
                  </div>
                </div>
              )}
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