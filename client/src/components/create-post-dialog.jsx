import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

import { useAuth } from "@/hooks/use-auth"
import { useMutation, useQuery } from "@tanstack/react-query"
import { apiRequest, queryClient } from "@/lib/queryClient"
import { toast } from "sonner"
import { Share2 } from "lucide-react"

export function CreatePostDialog({ trigger }) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const [type, setType] = useState("RECIPE_SHARE")
  const { user } = useAuth()

  const { data: recipes } = useQuery({
    queryKey: ["/api/recipes"],
    enabled: type === "RECIPE_SHARE"
  })

  const [selectedRecipeId, setSelectedRecipeId] = useState("")

  const createPostMutation = useMutation({
    mutationFn: async data => {
      try {
        const payload = {
          content: data.content,
          type: data.type,
          userId: data.userId,
          username: user?.username || user?.name || "Anonymous"
        }

        if (data.type === "RECIPE_SHARE" && data.recipeId) {
          payload.recipeId = data.recipeId
        }

        const res = await apiRequest("POST", "/api/community", payload)
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.message || "Failed to create post")
        }
        return res.json()
      } catch (error) {
        console.error("Create post error:", error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community"] })
      setOpen(false)
      setContent("")
      setSelectedRecipeId("")
      toast.success("Post created!", {
        description: "Your post has been shared with the community."
      })
    },
    onError: error => {
      toast.error("Error", {
        description:
          error.message || "Failed to create post. Please try again."
      })
    }
  })

  const handleCreatePost = () => {
    if (type === "RECIPE_SHARE" && !selectedRecipeId) {
      toast.error("Error", {
        description: "Please select a recipe to share"
      })
      return
    }

    const postData = {
      content,
      type,
      userId: user?.id,
      ...(type === "RECIPE_SHARE" && selectedRecipeId
        ? { recipeId: parseInt(selectedRecipeId) }
        : {})
    }

    createPostMutation.mutate(postData)
  }

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
          <div className="space-y-2">
            <label className="text-sm font-medium">Post Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="RECIPE_SHARE">Share Recipe</option>
              <option value="FOOD_RESCUE">Food Rescue</option>
              <option value="COOKING_TIP">Cooking Tip</option>
            </select>
          </div>

          {type === "RECIPE_SHARE" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Recipe</label>
              <select
                value={selectedRecipeId}
                onChange={(e) => setSelectedRecipeId(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="">Select a recipe to share</option>
                {recipes &&
                  recipes.map(recipe => (
                    <option key={recipe.id} value={recipe.id.toString()}>
                      {recipe.title}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <Textarea
            placeholder="What would you like to share?"
            value={content}
            onChange={e => setContent(e.target.value)}
            className="min-h-[150px]"
          />
          <Button
            className="w-full"
            onClick={handleCreatePost}
            disabled={
              !content.trim() ||
              createPostMutation.isPending ||
              (type === "RECIPE_SHARE" && !selectedRecipeId)
            }
          >
            {createPostMutation.isPending ? "Creating..." : "Post"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
