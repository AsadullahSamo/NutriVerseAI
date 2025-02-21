import { useQuery, useMutation } from "@tanstack/react-query";
import { CommunityPost, Recipe } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RecipeCard } from "@/components/recipe-card";
import { Users, MapPin, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { CreatePostDialog } from "@/components/create-post-dialog";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EditPostDialog } from "@/components/edit-post-dialog";

type PostWithRecipe = CommunityPost & { recipe?: Recipe };

export default function CommunityPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: posts, isLoading } = useQuery<PostWithRecipe[]>({
    queryKey: ["/api/community"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest("DELETE", `/api/community/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community"] });
      toast({
        title: "Post deleted",
        description: "Your post has been removed successfully.",
      });
    },
  });

  const filteredPosts = selectedType 
    ? posts?.filter(post => post.type === selectedType)
    : posts;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Community</h1>
              <p className="text-muted-foreground mt-2">
                Share recipes and connect with other food enthusiasts
              </p>
            </div>
            <CreatePostDialog />
          </div>

          <div className="flex gap-2 mt-6">
            <Button
              variant={selectedType === null ? "default" : "outline"}
              onClick={() => setSelectedType(null)}
            >
              All
            </Button>
            <Button
              variant={selectedType === "RECIPE_SHARE" ? "default" : "outline"}
              onClick={() => setSelectedType("RECIPE_SHARE")}
            >
              Recipes
            </Button>
            <Button
              variant={selectedType === "FOOD_RESCUE" ? "default" : "outline"}
              onClick={() => setSelectedType("FOOD_RESCUE")}
            >
              Food Rescue
            </Button>
            <Button
              variant={selectedType === "COOKING_TIP" ? "default" : "outline"}
              onClick={() => setSelectedType("COOKING_TIP")}
            >
              Tips
            </Button>
          </div>
        </header>

        <div className="grid gap-6">
          {filteredPosts?.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-6">
                {post.type === "RECIPE_SHARE" && post.recipe && (
                  <RecipeCard 
                    recipe={{...post.recipe, postId: post.id}} 
                    showDelete={post.userId === user?.id}
                  />
                )}
                {post.type === "FOOD_RESCUE" && (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-lg">Food Rescue Opportunity</h3>
                      {post.userId === user?.id && (
                        <div className="flex gap-2">
                          <EditPostDialog post={post} />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(post.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <p>{post.content}</p>
                    {post.location && typeof post.location === 'string' && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {post.location}
                      </p>
                    )}
                  </div>
                )}
                {post.type === "COOKING_TIP" && (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-lg">Cooking Tip</h3>
                      {post.userId === user?.id && (
                        <div className="flex gap-2">
                          <EditPostDialog post={post} />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(post.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <p>{post.content}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPosts?.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No posts yet</h3>
            <p className="text-muted-foreground">
              Be the first to share something with the community!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}