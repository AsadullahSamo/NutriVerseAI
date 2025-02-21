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
}

export function RecipeActions({ recipe, size = "default", showDelete = false }: RecipeActionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hasLiked, setHasLiked] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(recipe.likes);

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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      try {
        await apiRequest("DELETE", `/api/recipes/${recipe.id}`);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete recipe. Please try again.",
          variant: "destructive"
        });
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate both recipes and community queries
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community"] });
      toast({
        title: "Recipe deleted",
        description: "Your recipe has been deleted.",
      });
    },
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
      // Invalidate both recipes and community queries to sync likes
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community"] });
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
      toast({
        title: "Recipe forked!",
        description: "The recipe has been added to your collection.",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      if (!recipe.postId) return;
      try {
        await apiRequest("DELETE", `/api/community/${recipe.postId}`);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete post. Please try again.",
          variant: "destructive"
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Post deleted",
        description: "Your post has been deleted.",
      });
    },
  });

  if (!user) return null;

  return (
    <div className="flex gap-2">
      <Button
        variant="ghost"
        size={size}
        onClick={() => likeMutation.mutate()}
        disabled={likeMutation.isPending || !user}
      >
        <Heart className={`h-4 w-4 mr-2 ${hasLiked ? "fill-current text-red-500" : ""}`} />
        {localLikeCount}
      </Button>
      
      <Button
        variant="ghost"
        size={size}
        onClick={() => forkMutation.mutate()}
        disabled={forkMutation.isPending}
      >
        <GitFork className="h-4 w-4 mr-2" />
        Fork
      </Button>
      {recipe.postId && showDelete && (
        <Button
          variant="ghost"
          size={size}
          onClick={() => deletePostMutation.mutate()}
          disabled={deletePostMutation.isPending}
        >
          <Trash2 className="h-4 w-4 text-destructive mr-2" />
          Delete Post
        </Button>
      )}
      {!recipe.postId && showDelete && (
        <>
          <EditRecipeDialog recipe={recipe} />
          <Button
            variant="ghost"
            size={size}
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 text-destructive mr-2" />
            Delete Recipe
          </Button>
        </>
      )}
    </div>
  );
}