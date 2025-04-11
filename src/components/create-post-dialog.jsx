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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import { useMutation, useQuery } from "@tanstack/react-query"
import { apiRequest, queryClient } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"
import { Share2 } from "lucide-react"

export function CreatePostDialog({ trigger }) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const [type, setType] = useState("RECIPE_SHARE")
  const { user } = useAuth()
  const { toast } = useToast()

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
      toast({
        title: "Post created!",
        description: "Your post has been shared with the community."
      })
    },
    onError: error => {
      toast({
        title: "Error",
        description:
          error.message || "Failed to create post. Please try again.",
        variant: "destructive"
      })
    }
  })

  const handleCreatePost = () => {
    if (type === "RECIPE_SHARE" && !selectedRecipeId) {
      toast({
        title: "Error",
        description: "Please select a recipe to share",
        variant: "destructive"
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
            <Select
              value={selectedRecipeId}
              onValueChange={setSelectedRecipeId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a recipe to share" />
              </SelectTrigger>
              <SelectContent>
                {recipes &&
                  recipes.map(recipe => (
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
