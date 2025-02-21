import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Share2 } from "lucide-react";

interface CreatePostDialogProps {
  trigger?: React.ReactNode;
}

export function CreatePostDialog({ trigger }: CreatePostDialogProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [type, setType] = useState<string>("RECIPE_SHARE");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: recipes } = useQuery({
    queryKey: ["/api/recipes"],
    enabled: type === "RECIPE_SHARE"
  });

  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");

  const createPostMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = { ...data };
      if (data.type === "RECIPE_SHARE" && selectedRecipeId) {
        payload.recipeId = parseInt(selectedRecipeId);
      }
      return apiRequest("POST", "/api/community", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community"] });
      setOpen(false);
      setContent("");
      setSelectedRecipeId("");
      toast({
        title: "Post created!",
        description: "Your post has been shared with the community.",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Share2 className="h-4 w-4 mr-2" />
            Share with Community
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Select post type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RECIPE_SHARE">Share Recipe</SelectItem>
              <SelectItem value="FOOD_RESCUE">Food Rescue</SelectItem>
              <SelectItem value="COOKING_TIP">Cooking Tip</SelectItem>
            </SelectContent>
          </Select>

          {type === "RECIPE_SHARE" && (
            <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a recipe to share" />
              </SelectTrigger>
              <SelectContent>
                {recipes?.map((recipe) => (
                  <SelectItem key={recipe.id} value={recipe.id.toString()}>
                    {recipe.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Textarea
            placeholder="What would you like to share?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[150px]"
          />
          <Button 
            className="w-full" 
            onClick={() => createPostMutation.mutate({content, type, userId: user?.id})} // Added data to mutation call
            disabled={!content.trim() || createPostMutation.isPending}
          >
            Post
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}