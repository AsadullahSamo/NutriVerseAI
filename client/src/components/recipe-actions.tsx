import { Recipe } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Heart, GitFork, Trash2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
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
  const [hasLiked, setHasLiked] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(recipe.likes);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: likeStatus } = useQuery({
    queryKey: ["/api/recipes", recipe.id, "liked"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/recipes/${recipe.id}/liked`);
      return res.json();
    },
    enabled: !!user
  });

  useEffect(() => {
    if (likeStatus) {
      setHasLiked(likeStatus.hasLiked);
    }
  }, [likeStatus]);

  useEffect(() => {
    setLocalLikeCount(recipe.likes);
  }, [recipe.likes]);

  const deleteRecipeMutation = useMutation({
    mutationFn: async () => {
      setIsDeleting(true);
      try {
        if (recipe.likes > 0) {
          setIsDeleting(false);
          return Promise.reject({
            message: "Cannot delete recipe that has likes"
          });
        }
        await apiRequest("DELETE", `/api/recipes/${recipe.id}`);
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
        description: "Recipe has been deleted. Any shared posts will show this recipe as deleted.",
      });
    },
    onError: (error: any) => {
      if (error.message === "Cannot delete recipe that has likes") {
        toast({
          title: "Cannot delete recipe",
          description: "This recipe has been liked by others in the community. As it's valuable to them, it cannot be deleted.",
          variant: "destructive"
        });
      }
    }
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await apiRequest("POST", `/api/recipes/${recipe.id}/like`);
        return res.json();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to like recipe. Please try again.",
          variant: "destructive"
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      setHasLiked(!hasLiked);
      setLocalLikeCount(data.likes);
      // Invalidate all related queries to sync likes
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community"] });
      queryClient.invalidateQueries({ queryKey: ["recommendedRecipes"] });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/recipes", recipe.id, "liked"],
        exact: true
      });
      toast({
        title: hasLiked ? "Recipe unliked" : "Recipe liked!",
        description: hasLiked ? "Recipe removed from your likes" : "Thanks for showing your appreciation.",
      });
    },
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
        onClick={() => likeMutation.mutate()}
        disabled={likeMutation.isPending || !user}
        className="h-7 px-3 text-sm hover:bg-secondary"
      >
        <Heart className={`h-4 w-4 ${hasLiked ? "fill-current text-red-500" : ""}`} />
        <span className="ml-2 tabular-nums">{localLikeCount}</span>
      </Button>
      
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