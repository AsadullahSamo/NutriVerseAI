import { Recipe } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { GitFork, Trash2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { EditRecipeDialog } from "./edit-recipe-dialog";

interface RecipeActionsProps {
  recipe: Recipe & { postId?: number };
  size?: "default" | "sm";
  showDelete?: boolean;
  hideEditDelete?: boolean;  // New prop to hide edit/delete buttons completely
}

export function RecipeActions({ recipe, size = "default", showDelete = false, hideEditDelete = false }: RecipeActionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteRecipeMutation = useMutation({
    mutationFn: async () => {
      setIsDeleting(true);
      try {
        const res = await apiRequest("DELETE", `/api/recipes/${recipe.id}`);
        if (!res.ok) {
          throw new Error("Failed to delete recipe");
        }
        return { success: true };
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete recipe. Please try again.",
          variant: "destructive"
        });
        throw error;
      } finally {
        setIsDeleting(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community"] });
      queryClient.invalidateQueries({ queryKey: ["recommendedRecipes"] });
      toast({
        title: "Recipe deleted",
        description: "Recipe has been deleted successfully.",
      });
    }
  });

  const forkMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await apiRequest("POST", `/api/recipes/${recipe.id}/fork`);
        return res.json();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fork recipe. Please try again.",
          variant: "destructive"
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community"] });
      queryClient.invalidateQueries({ queryKey: ["recommendedRecipes"] });
      toast({
        title: "Recipe forked!",
        description: "The recipe has been added to your collection.",
      });
    },
  });

  if (!user) return null;

  return (
    <div className="flex items-center justify-end -mr-1">
      <Button
        variant="ghost"
        size={size}
        onClick={() => forkMutation.mutate()}
        disabled={forkMutation.isPending}
        className="h-7 px-3 text-sm hover:bg-secondary"
      >
        <GitFork className="h-4 w-4" />
        <span className="ml-2">Fork</span>
      </Button>

      {!hideEditDelete && showDelete && (
        <>
          <EditRecipeDialog 
            recipe={recipe} 
            trigger={
              <Button variant="ghost" size={size} className="h-7 px-3 text-sm hover:bg-secondary">
                <Pencil className="h-4 w-4" />
                <span className="ml-2">Edit</span>
              </Button>
            }
          />
          <Button
            variant="ghost"
            size={size}
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this recipe? This action cannot be undone.")) {
                deleteRecipeMutation.mutate();
              }
            }}
            disabled={isDeleting || deleteRecipeMutation.isPending}
            className="h-7 px-3 text-sm hover:bg-secondary"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="ml-2">{isDeleting ? "..." : "Delete"}</span>
          </Button>
        </>
      )}
    </div>
  );
}