import { useQuery, useMutation } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RecipeCard } from "@/components/recipe-card"
import { Users, MapPin, Loader2, Trash2, AlertTriangle } from "lucide-react"
import { useState } from "react"
import { CreatePostDialog } from "@/components/create-post-dialog"
import { useAuth } from "@/hooks/use-auth"
import { apiRequest, queryClient } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"
import { EditPostDialog } from "@/components/edit-post-dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"

export default function CommunityPage() {
  const [selectedType, setSelectedType] = useState(null)
  const [viewFilter, setViewFilter] = useState("all") // "all" or "my"
  const { user } = useAuth()
  const { toast } = useToast()

  const { data: posts, isLoading } = useQuery({
    queryKey: ["/api/community"]
  })

  const { data: currentGoal } = useQuery({
    queryKey: ["/api/nutrition-goals/current"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/nutrition-goals/current")
      return res.json()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async postId => {
      const response = await apiRequest("DELETE", `/api/community/${postId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to process post")
      }
      const result = await response.json()

      // If the post was hidden (not deleted), update localStorage
      if (result.type === "hidden") {
        const hiddenPosts = JSON.parse(
          localStorage.getItem("hiddenPosts") || "[]"
        )
        if (!hiddenPosts.includes(postId)) {
          hiddenPosts.push(postId)
          localStorage.setItem("hiddenPosts", JSON.stringify(hiddenPosts))
        }
      }

      return result
    },
    onSuccess: result => {
      queryClient.invalidateQueries({ queryKey: ["/api/community"] })
      toast({
        title: result.type === "deleted" ? "Post deleted" : "Post hidden",
        description: "The post has been deleted successfully."
      })
    },
    onError: error => {
      toast({
        title: "Error",
        description:
          error.message || "Failed to process post. Please try again.",
        variant: "destructive"
      })
    }
  })

  // Filter out hidden posts from localStorage
  const hiddenPosts = JSON.parse(localStorage.getItem("hiddenPosts") || "[]")

  // Apply filters
  let filteredPosts = posts?.filter(post => !hiddenPosts.includes(post.id)) || []

  // Filter by type
  if (selectedType) {
    filteredPosts = filteredPosts.filter(post => post.type === selectedType)
  }

  // Filter by ownership
  if (viewFilter === "my") {
    filteredPosts = filteredPosts.filter(post => post.userId === user?.id)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    )
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

          {!currentGoal &&
            filteredPosts?.some(post => post.type === "RECIPE_SHARE") && (
              <div className="mb-6 mt-6 p-4 rounded-lg border bg-muted/50">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-medium">Set Your Nutrition Goals</h4>
                    <p className="text-sm text-muted-foreground">
                      To track your nutrition progress and get personalized
                      recipe recommendations for shared recipes, please set up
                      your daily nutrition goals in Nutrition Tracking under
                      Planning.
                    </p>
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => (window.location.href = "/nutrition")}
                      >
                        Set Nutrition Goals
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          <div className="space-y-4 mt-6">
            {/* View Filter */}
            <div className="flex gap-2">
              <Button
                variant={viewFilter === "all" ? "default" : "outline"}
                onClick={() => setViewFilter("all")}
                size="sm"
              >
                All Posts
              </Button>
              <Button
                variant={viewFilter === "my" ? "default" : "outline"}
                onClick={() => setViewFilter("my")}
                size="sm"
              >
                My Posts
              </Button>
            </div>

            {/* Type Filter */}
            <div className="flex gap-2">
              <Button
                variant={selectedType === null ? "default" : "outline"}
                onClick={() => setSelectedType(null)}
              >
                All Types
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
          </div>
        </header>

        <div className="grid gap-6">
          {filteredPosts?.map(post => (
            <Card key={post.id}>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Posted by{" "}
                      {post.userId === user?.id ? "you" : post.username}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {post.userId === user?.id && (
                      <>
                        <EditPostDialog post={post} />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Post
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Post?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete this post.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(post.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Delete Post
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>

                {post.type === "RECIPE_SHARE" && (
                  <>
                    <p className="text-sm">{post.content}</p>
                    {post.recipe ? (
                      <RecipeCard
                        recipe={{ ...post.recipe, postId: post.id }}
                        hideEditDelete={true}
                      />
                    ) : (
                      <div className="p-4 border rounded-md bg-muted">
                        <p className="text-sm text-muted-foreground">
                          This recipe has been deleted
                        </p>
                      </div>
                    )}
                  </>
                )}
                {post.type === "FOOD_RESCUE" && (
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <h3 className="font-semibold text-lg">
                        Food Rescue Opportunity
                      </h3>
                    </div>
                    <p>{post.content}</p>
                    {post.location && typeof post.location === "string" && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {post.location}
                      </p>
                    )}
                  </div>
                )}
                {post.type === "COOKING_TIP" && (
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <h3 className="font-semibold text-lg">Cooking Tip</h3>
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
  )
}
