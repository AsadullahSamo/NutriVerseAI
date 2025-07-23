import React, { useState } from "react"
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
        console.log('[Client] Creating post with data:', data);

        const payload = {
          content: data.content,
          type: data.type
          // Don't send userId - let server get it from req.user
        }

        if (data.type === "RECIPE_SHARE" && data.recipeId) {
          payload.recipeId = parseInt(data.recipeId)
        }

        console.log('[Client] Sending payload:', payload);

        const res = await apiRequest("POST", "/api/community", payload)
        if (!res.ok) {
          const errorData = await res.json()
          console.error('[Client] Server error response:', errorData);
          throw new Error(errorData.message || "Failed to create post")
        }
        const result = await res.json()
        console.log('[Client] Post created successfully:', result);
        return result
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
      // Don't send userId - let server get it from req.user
      ...(type === "RECIPE_SHARE" && selectedRecipeId
        ? { recipeId: parseInt(selectedRecipeId) }
        : {})
    }

    createPostMutation.mutate(postData)
  }

  // Simple modal component
  const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-background border rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-semibold">Create Post</h2>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-accent hover:text-accent-foreground flex items-center justify-center text-xl font-bold"
            >
              ×
            </button>
          </div>
          <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {trigger ? (
        React.cloneElement(trigger, {
          onClick: () => setOpen(true)
        })
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Share2 className="h-4 w-4 mr-2" />
          Share with Community
        </Button>
      )}

      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Post Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
              style={{
                backgroundColor: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))'
              }}
            >
              <option
                value="RECIPE_SHARE"
                style={{
                  backgroundColor: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  padding: '8px 12px'
                }}
              >
                Share Recipe
              </option>
              <option
                value="FOOD_RESCUE"
                style={{
                  backgroundColor: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  padding: '8px 12px'
                }}
              >
                Food Rescue
              </option>
              <option
                value="COOKING_TIP"
                style={{
                  backgroundColor: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  padding: '8px 12px'
                }}
              >
                Cooking Tip
              </option>
            </select>
          </div>

          {type === "RECIPE_SHARE" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Recipe</label>
              <select
                value={selectedRecipeId}
                onChange={(e) => setSelectedRecipeId(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
              >
                <option value="" className="hover:bg-accent hover:text-accent-foreground">Select a recipe to share</option>
                {recipes &&
                  recipes.map(recipe => (
                    <option key={recipe.id} value={recipe.id.toString()} className="hover:bg-accent hover:text-accent-foreground">
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
      </Modal>
    </>
  )
}
