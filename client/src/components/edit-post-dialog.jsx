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

import { useMutation, useQuery } from "@tanstack/react-query"
import { apiRequest, queryClient } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"
import { Pencil, Loader2 } from "lucide-react"

export function EditPostDialog({ post, trigger }) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState(post.content)
  const [type, setType] = useState(post.type)
  const { toast } = useToast()

  const { data: recipes } = useQuery({
    queryKey: ["/api/recipes"],
    enabled: type === "RECIPE_SHARE"
  })

  const [selectedRecipeId, setSelectedRecipeId] = useState(
    post.recipeId?.toString() || ""
  )

  const editPostMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        content,
        type,
        recipeId:
          type === "RECIPE_SHARE" && selectedRecipeId
            ? parseInt(selectedRecipeId)
            : null
      }
      const res = await apiRequest(
        "PATCH",
        `/api/community/${post.id}`,
        payload
      )
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community"] })
      setOpen(false)
      toast({
        title: "Post updated!",
        description: "Your post has been updated successfully."
      })
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4 mr-2" />
            Edit Post
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
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
            <Select
              value={selectedRecipeId}
              onValueChange={setSelectedRecipeId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a recipe to share" />
              </SelectTrigger>
              <SelectContent>
                {recipes?.map(recipe => (
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
          />

          <Button
            className="w-full"
            onClick={() => editPostMutation.mutate()}
            disabled={editPostMutation.isPending}
          >
            {editPostMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Update Post
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
