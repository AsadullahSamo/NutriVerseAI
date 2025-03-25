import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Plus, Trash2, Edit, Brain, ChefHat,
  PlusCircle, Play, Globe2, UtensilsCrossed, MapPin,
  BookOpen, Scroll, History, Star, Map, Loader2, AlertTriangle, ListOrdered, Palette, Ban, Info, Sparkles, ScrollText
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { analyzeCulturalCuisine, type CulturalInsights, generateCulturalDetails } from "@ai-services/cultural-cuisine-service";
import type { CulturalCuisine, CulturalRecipe, CulturalTechnique } from "@shared/schema";
import { RecipeDetails } from "./RecipeDetails";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Add formatHeading utility function
const formatHeading = (text: string): string => {
  return text
    .replace(/([A-Z])/g, ' $1') // Insert space before capital letters
    .replace(/_/g, ' ') // Replace underscores with spaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
};

interface CuisineDetailsProps {
  cuisineId: number;
  onBack: () => void;
}

// Update the Recipe interface to match CulturalRecipe
interface Recipe extends Omit<CulturalRecipe, 'instructions' | 'authenticIngredients' | 'culturalNotes' | 'localSubstitutes'> {
  instructions: string[] | Record<string, string>;
  authenticIngredients: string[] | Record<string, string>;
  culturalNotes: Record<string, string>;
  createdBy: number;
  localSubstitutes: Record<string, string>;
}

interface EditImagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { bannerUrl: string }) => void;
  currentImages: { bannerUrl?: string };
}

function EditImagesDialog({ open, onOpenChange, onSubmit, currentImages }: EditImagesDialogProps) {
  const [bannerUrl, setBannerUrl] = useState(currentImages.bannerUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ bannerUrl });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update images:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Images</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Banner Image URL</label>
            <Input 
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="Enter banner image URL"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditCulturalDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { culturalContext: Record<string, string>; servingEtiquette: Record<string, string> }) => void;
  currentDetails: {
    culturalContext: Record<string, string>;
    servingEtiquette: Record<string, string>;
  };
}

function EditCulturalDetailsDialog({ open, onOpenChange, onSubmit, currentDetails }: EditCulturalDetailsDialogProps) {
  const [culturalContext, setCulturalContext] = useState(currentDetails.culturalContext || {});
  const [servingEtiquette, setServingEtiquette] = useState(currentDetails.servingEtiquette || {});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ culturalContext, servingEtiquette });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update cultural details:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Cultural Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-4">Cultural Context</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">History</label>
                  <Textarea
                    value={culturalContext.history || ''}
                    onChange={(e) => setCulturalContext({ ...culturalContext, history: e.target.value })}
                    placeholder="Historical background and origins"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Traditions</label>
                  <Textarea
                    value={culturalContext.traditions || ''}
                    onChange={(e) => setCulturalContext({ ...culturalContext, traditions: e.target.value })}
                    placeholder="Cultural traditions and practices"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Festivals</label>
                  <Textarea
                    value={culturalContext.festivals || ''}
                    onChange={(e) => setCulturalContext({ ...culturalContext, festivals: e.target.value })}
                    placeholder="Associated festivals and celebrations"
                  />
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div>
              <h3 className="text-lg font-medium mb-4">Serving Etiquette</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Table Setting</label>
                  <Textarea
                    value={servingEtiquette.tableSetting || ''}
                    onChange={(e) => setServingEtiquette({ ...servingEtiquette, tableSetting: e.target.value })}
                    placeholder="Traditional table setting guidelines"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dining Customs</label>
                  <Textarea
                    value={servingEtiquette.diningCustoms || ''}
                    onChange={(e) => setServingEtiquette({ ...servingEtiquette, diningCustoms: e.target.value })}
                    placeholder="Cultural dining customs and rules"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Serving Order</label>
                  <Textarea
                    value={servingEtiquette.servingOrder || ''}
                    onChange={(e) => setServingEtiquette({ ...servingEtiquette, servingOrder: e.target.value })}
                    placeholder="Traditional order of serving dishes"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CuisineDetails({ cuisineId, onBack }: CuisineDetailsProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [isEditingImages, setIsEditingImages] = useState(false);
  const [isEditingCulturalDetails, setIsEditingCulturalDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);

  // Add state for user ID
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Add state for visibility
  const [isHidden, setIsHidden] = useState<boolean>(false);

  // Fetch current user ID on mount
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include' // Important: include credentials for authentication
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentUserId(data.id);
          console.log('[User] Current user ID:', data.id);
        } else {
          console.error('[User] Failed to fetch user data:', response.status);
          // Don't set currentUserId if unauthorized - this is expected for non-logged in users
          if (response.status !== 401) {
            toast({
              title: "Error",
              description: "Failed to fetch user data. Some features may be limited.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('[User] Failed to fetch user data:', error);
      }
    };
    fetchUserId();
  }, [toast]);

  // Check visibility from both localStorage and server data
  useEffect(() => {
    const hiddenCuisines = JSON.parse(localStorage.getItem('hiddenCuisines') || '[]');
    const isHiddenLocally = hiddenCuisines.includes(Number(cuisineId));
    console.log(`[Visibility] Checking local storage - Cuisine ${cuisineId} hidden status:`, isHiddenLocally);
    
    if (isHiddenLocally) {
      console.log(`[Visibility] Cuisine ${cuisineId} is marked as hidden in localStorage`);
      setIsHidden(true);
      onBack();
    }
  }, [cuisineId, onBack]);

  // Modified query with improved visibility check
  const { data: cuisine, isLoading, error, refetch } = useQuery({
    queryKey: ['cuisine', cuisineId],
    queryFn: async () => {
      console.log(`[Query] Fetching cuisine ${cuisineId}`);
      const response = await fetch(`/api/cultural-cuisines/${cuisineId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch cuisine details');
      }
      const data = await response.json();
      
      // Before showing error, check if it's hidden
      if (currentUserId && data.hiddenFor?.includes(currentUserId)) {
        setIsHidden(true);
        onBack();
        return null;
      }
      
      return data;
    },
    enabled: !!cuisineId,
    retry: false,
    staleTime: 0
  });

  const handleUpdateImages = async (data: { bannerUrl: string }) => {
    try {
      // Store banner URL in localStorage
      localStorage.setItem(`cuisine-image-${cuisineId}`, data.bannerUrl);
      setLocalImageUrl(data.bannerUrl);
      const response = await fetch(`/api/cultural-cuisines/${cuisineId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to update images');
      }

      toast({
        title: "Images Updated",
        description: "The cuisine images have been updated successfully.",
      });

      refetch();
      setIsEditingImages(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update images. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCulturalDetails = async (data: { 
    culturalContext: Record<string, string>; 
    servingEtiquette: Record<string, string> 
  }) => {
    try {
      const response = await fetch(`/api/cultural-cuisines/${cuisineId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          culturalContext: data.culturalContext,
          servingEtiquette: data.servingEtiquette
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to update cultural details');
      }

      toast({
        title: "Details Updated",
        description: "Cultural details have been updated successfully.",
      });

      refetch();
      setIsEditingCulturalDetails(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update cultural details. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCuisine = async () => {
    try {
      console.log(`[Delete] Attempting to hide cuisine ${cuisineId} for user ${currentUserId}`);
      const response = await fetch(`/api/cultural-cuisines/${cuisineId}/hide`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to hide cuisine');
      }

      const result = await response.json();
      console.log(`[Delete] Server response:`, result);

      // Update localStorage
      const hiddenCuisines = JSON.parse(localStorage.getItem('hiddenCuisines') || '[]');
      if (!hiddenCuisines.includes(Number(cuisineId))) {
        hiddenCuisines.push(Number(cuisineId));
        localStorage.setItem('hiddenCuisines', JSON.stringify(hiddenCuisines));
        console.log(`[Delete] Updated hidden cuisines in localStorage:`, hiddenCuisines);
      }

      // Set local state and force navigation
      setIsHidden(true);
      queryClient.removeQueries({ queryKey: ['cuisine', cuisineId] });
      queryClient.removeQueries({ queryKey: ['cuisines'] });
      onBack();

      toast({
        title: "Success",
        description: "The cuisine has been deleted successfully.",
      });
    } catch (error) {
      console.error('[Delete] Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to hide cuisine. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateCulturalDetails = async () => {
    setIsGeneratingDetails(true);
    try {
      const details = await generateCulturalDetails(cuisine);
      
      // Update the cuisine with new cultural details
      const response = await fetch(`/api/cultural-cuisines/${cuisineId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          culturalContext: details.culturalContext,
          servingEtiquette: details.servingEtiquette
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to update cultural details');
      }

      toast({
        title: "Cultural Details Generated",
        description: "The cuisine's cultural context and serving etiquette have been updated with AI-generated content.",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate cultural details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDetails(false);
    }
  };

  const handleAddRecipe = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const imageUrl = formData.get('imageUrl')?.toString();

      const newRecipe = {
        name: formData.get('name'),
        description: formData.get('description'),
        difficulty: formData.get('difficulty') || 'beginner',
        imageUrl, // Will be sent to database but not used for display
        cuisineId,
        authenticIngredients: formData.get('ingredients')?.toString().split(',').map(i => i.trim()).filter(Boolean) || [],
        instructions: formData.get('instructions')?.toString().split('\n').filter(Boolean) || [],
        culturalNotes: {},
        servingSuggestions: []
      };

      const response = await fetch('/api/cultural-recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRecipe),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to add recipe');
      }

      const addedRecipe = await response.json();

      // Store and force refresh image URL in localStorage using the new recipe's ID
      if (imageUrl) {
        localStorage.removeItem(`recipe-image-${addedRecipe.id}`);
        localStorage.setItem(`recipe-image-${addedRecipe.id}`, imageUrl);
      }

      toast({
        title: "Recipe Added",
        description: "The recipe has been added successfully.",
      });

      await refetch();
      setIsAddingRecipe(false);
      setSelectedRecipe(addedRecipe);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add recipe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSelectedRecipe = async (recipeId: number) => { 
    try {
      if (!currentUserId) {
        throw new Error('You must be logged in to delete recipes');
      }

      console.log(`[Delete] Attempting to delete recipe ${recipeId} for user ${currentUserId}`);
      const response = await fetch(`/api/cultural-recipes/${recipeId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Delete] Server error:', errorData);
        throw new Error(errorData.details || errorData.message || 'Failed to delete recipe');
      }

      // Clear all related queries to force a fresh fetch
      queryClient.removeQueries({ queryKey: ['recipe', recipeId] });
      queryClient.removeQueries({ queryKey: ['recipes'] });
      queryClient.removeQueries({ queryKey: ['cuisine', cuisineId] });
      
      toast({
        title: "Recipe Deleted",
        description: "The recipe has been permanently deleted.",
      });

      // If we were viewing the recipe details, go back to the cuisine view
      if (selectedRecipe?.id === recipeId) {
        setSelectedRecipe(null);
      }

      // Refetch to update the cuisine's recipe list
      await refetch();
    } catch (error) {
      console.error('[Delete] Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete recipe. Please try again.",
        variant: "destructive",
      });
    }
  };
  

  const canDeleteRecipe = (recipe: CulturalRecipe) => {
    return recipe.createdBy === currentUserId; // Only allow deletion by creator
  };

  // When setting selected recipe, ensure it has the correct type
  const handleViewRecipe = (recipe: CulturalRecipe) => {
    // Cast the recipe to match our Recipe interface
    const fullRecipe: Recipe = {
      ...recipe,
      instructions: recipe.instructions as string[] | Record<string, string>,
      authenticIngredients: recipe.authenticIngredients as string[] | Record<string, string>,
      culturalNotes: recipe.culturalNotes as Record<string, string>,
      localSubstitutes: recipe.localSubstitutes as Record<string, string>,
      createdBy: recipe.createdBy || 0, // Ensure createdBy is always a number
      // Add any missing required fields from CulturalRecipe
      hiddenFor: recipe.hiddenFor || [],
      localName: recipe.localName || null,
      servingSuggestions: recipe.servingSuggestions || [],
      complementaryDishes: recipe.complementaryDishes || []
    };
    setSelectedRecipe(fullRecipe);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="flex justify-center items-center h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !cuisine) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="text-center">
          <p className="text-destructive">Failed to load cuisine details</p>
          <Button onClick={onBack} variant="outline" className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (selectedRecipe) {
    return (
      <RecipeDetails 
        recipe={selectedRecipe} 
        cuisine={cuisine} 
        onBack={() => setSelectedRecipe(null)} 
      />
    );
  }

  // Return null if hidden (both from localStorage or server data)
  if (isHidden) {
    console.log(`[Render] Cuisine ${cuisineId} is hidden, returning null`);
    return null;
  }

  const canEditCuisine = cuisine?.createdBy === currentUserId;

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
      <div className="relative space-y-6 pb-12">
        {(localImageUrl || cuisine?.bannerUrl) && (
          <div className="relative w-full h-[300px] rounded-lg overflow-hidden">
            <img 
              src={localImageUrl || cuisine.bannerUrl}
              alt={`${cuisine.name} banner`}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = `https://source.unsplash.com/1200x400/?${encodeURIComponent(cuisine.name.toLowerCase() + ' food')}`;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background/20" />
            <div className="absolute bottom-0 left-0 p-6">
              <h1 className="text-4xl font-bold mb-2 text-white drop-shadow-lg">{cuisine.name}</h1>
              <div className="flex items-center gap-2 text-white/80">
                <MapPin className="h-4 w-4" /> {cuisine.region}
              </div>
            </div>
            <div className="absolute top-4 right-4 flex gap-2">
              {canEditCuisine && (
                <Button
                  size="sm"
                  onClick={() => setIsEditingImages(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Banner
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Delete Cuisine
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will permanently delete this cuisine and all its associated recipes and techniques. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteCuisine} className="bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}

        <div className="space-y-8">
          <div className="prose max-w-none">
            {!cuisine?.bannerUrl && (
              <>
                <h1 className="text-4xl font-bold mb-2">{cuisine?.name}</h1>
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4" /> {cuisine?.region}
                </div>
              </>
            )}
            <p className="text-muted-foreground text-lg leading-relaxed">
              {cuisine?.description}
            </p>
          </div>

          <EditImagesDialog 
            open={isEditingImages}
            onOpenChange={setIsEditingImages}
            onSubmit={handleUpdateImages}
            currentImages={{
              bannerUrl: cuisine?.bannerUrl
            }}
          />

          <EditCulturalDetailsDialog
            open={isEditingCulturalDetails}
            onOpenChange={setIsEditingCulturalDetails}
            onSubmit={handleUpdateCulturalDetails}
            currentDetails={{
              culturalContext: cuisine?.culturalContext as Record<string, string>,
              servingEtiquette: cuisine?.servingEtiquette as Record<string, string>
            }}
          />

          <div className="space-y-8">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid grid-cols-2 mb-8">
                <TabsTrigger value="overview">
                  <Globe2 className="h-4 w-4 mr-2 hidden sm:inline" /> 
                  Overview
                </TabsTrigger>
                <TabsTrigger value="recipes">
                  <UtensilsCrossed className="h-4 w-4 mr-2 hidden sm:inline" /> 
                  Recipes
                </TabsTrigger>
                </TabsList>

              <TabsContent value="overview" className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Key Ingredients</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(cuisine.keyIngredients) ? (
                          cuisine.keyIngredients.map((ingredient: string, i: number) => (
                            <Badge key={i} variant="outline">{ingredient}</Badge>
                          ))
                        ) : typeof cuisine.keyIngredients === 'object' ? (
                          Object.keys(cuisine.keyIngredients).map((ingredient: string, i: number) => (
                            <Badge key={i} variant="outline">{ingredient}</Badge>
                          ))
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Cooking Styles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(cuisine.cookingTechniques) ? (
                          cuisine.cookingTechniques.map((technique: string, i: number) => (
                            <Badge key={i}>{technique}</Badge>
                          ))
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end mb-4">
                  <Button
                    variant="outline"
                    onClick={handleGenerateCulturalDetails}
                    disabled={isGeneratingDetails}
                  >
                    {isGeneratingDetails ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Cultural Details...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2 text-primary" />
                        Generate Cultural Details with AI
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <History className="h-5 w-5 text-primary" />
                          <CardTitle>Cultural Context</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {cuisine.culturalContext && typeof cuisine.culturalContext === 'object' && Object.keys(cuisine.culturalContext).length > 0 ? (
                        <div className="grid gap-6">
                          {Object.entries(cuisine.culturalContext).map(([key, value]: [string, unknown], i: number) => {
                            const k = key.toLowerCase();
                            const sectionStyle = k.includes('history') ? 'border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/30' :
                                                k.includes('tradition') ? 'border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/30' :
                                                k.includes('festival') ? 'border-l-purple-500 bg-purple-50/30 dark:bg-purple-950/30' :
                                                'border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/30';

                            return (
                              <div key={i} className={`p-6 rounded-lg border-l-4 ${sectionStyle} transition-all duration-200 hover:shadow-md`}>
                                <div className="flex items-center space-x-3 mb-4">
                                  {k.includes('history') && <History className="h-5 w-5 text-blue-600" />}
                                  {k.includes('tradition') && <ScrollText className="h-5 w-5 text-emerald-600" />}
                                  {k.includes('festival') && <Sparkles className="h-5 w-5 text-purple-600" />}
                                  {k.includes('influence') && <Globe2 className="h-5 w-5 text-amber-600" />}
                                  <h3 className="text-lg font-semibold capitalize text-foreground">{formatHeading(key)}</h3>
                                </div>
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                  <p className="leading-relaxed text-muted-foreground">{String(value)}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <Scroll className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-50" />
                          <p className="text-sm text-muted-foreground">No cultural context has been added yet.</p>
                          <p className="text-xs text-muted-foreground mt-1">Use the AI generation to add cultural information.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="col-span-1">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Scroll className="h-5 w-5 text-primary" />
                          <CardTitle>Traditional Serving Etiquette</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {cuisine.servingEtiquette && typeof cuisine.servingEtiquette === 'object' && Object.keys(cuisine.servingEtiquette).length > 0 ? (
                        <div className="grid gap-6">
                          {Object.entries(cuisine.servingEtiquette).map(([key, value]) => {
                            if (!value) return null;
                            const k = key.toLowerCase();
                            
                            // Determine if this is a general descriptive section
                            const isGeneralSection = !k.includes('table') && !k.includes('order') && !k.includes('taboo') && !k.includes('dining');

                            return (
                              <div key={k} className={`p-4 border-l-4 rounded-lg ${
                                k.includes('table') ? 'border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/30' :
                                k.includes('dining') ? 'border-l-purple-500 bg-purple-50/30 dark:bg-purple-950/30' :
                                k.includes('order') ? 'border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/30' :
                                k.includes('taboo') ? 'border-l-red-500 bg-red-50/30 dark:bg-red-950/30' :
                                'border-l-gray-500 bg-gray-50/30 dark:bg-gray-950/30'
                              }`}>
                                <h4 className="font-medium mb-2">{
                                  k.includes('table') ? 'Table Setting' :
                                  k.includes('dining') ? 'Dining Customs' :
                                  k.includes('order') ? 'Serving Order' :
                                  k.includes('taboo') ? 'Cultural Taboos' :
                                  key.replace(/([A-Z])/g, ' $1').trim()
                                }</h4>
                                <div className="space-y-2">
                                  {isGeneralSection ? (
                                    // General descriptive text without bullet points
                                    <p className="text-sm text-muted-foreground">
                                      {typeof value === 'string' ? value : Array.isArray(value) ? value.join(' ') : String(value)}
                                    </p>
                                  ) : (
                                    // Specific sections with icons or numbers
                                    <div className="space-y-3">
                                      {(Array.isArray(value) ? value : 
                                        typeof value === 'string' ? value.split(/\n|•/).filter(item => item.trim()) : 
                                        [String(value)]
                                      ).map((item, i) => {
                                        // Serving order section with numbered circles
                                        if (k.includes('order')) {
                                          return (
                                            <div key={i} className="flex items-start gap-3">
                                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{i + 1}</span>
                                              </div>
                                              <span className="text-sm text-muted-foreground mt-0.5">{item}</span>
                                            </div>
                                          );
                                        }
                                        
                                        // Table setting section with utensil icons
                                        if (k.includes('table')) {
                                          return (
                                            <div key={i} className="flex items-start gap-3">
                                              <UtensilsCrossed className="h-4 w-4 flex-shrink-0 mt-1 text-emerald-600" />
                                              <span className="text-sm text-muted-foreground">{item}</span>
                                            </div>
                                          );
                                        }

                                        // Taboos section with warning icons
                                        if (k.includes('taboo')) {
                                          return (
                                            <div key={i} className="flex items-start gap-3">
                                              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-1 text-red-600" />
                                              <span className="text-sm text-muted-foreground">{item}</span>
                                            </div>
                                          );
                                        }

                                        // Dining customs with custom bullet points
                                        return (
                                          <div key={i} className="flex items-start gap-3">
                                            <Info className="h-4 w-4 flex-shrink-0 mt-1 text-purple-600" />
                                            <span className="text-sm text-muted-foreground">{item}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <UtensilsCrossed className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-50" />
                          <p className="text-sm text-muted-foreground">No serving etiquette has been added yet.</p>
                          <p className="text-xs text-muted-foreground mt-1">Use the AI generation to add serving customs.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="recipes" className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Traditional Recipes</h2>
                  <Dialog open={isAddingRecipe} onOpenChange={setIsAddingRecipe}>
                    <DialogTrigger asChild>
                      <Button>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Recipe
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh]">
                      <ScrollArea className="max-h-[80vh] pr-4">
                        <DialogHeader>
                          <DialogTitle>Add New Recipe</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddRecipe} className="space-y-6 py-4">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Name</label>
                              <Input name="name" placeholder="Recipe name" required />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Description</label>
                              <Textarea name="description" placeholder="Recipe description" required />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Image URL</label>
                              <Input name="imageUrl" type="url" placeholder="https://..." />
                              <p className="text-xs text-muted-foreground">
                                Add an image URL that showcases the dish
                              </p>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Difficulty</label>
                              <select 
                                name="difficulty" 
                                className="w-full p-2 rounded-md border bg-background text-foreground" 
                                required
                              >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Ingredients</label>
                              <Textarea 
                                name="ingredients" 
                                placeholder="Enter ingredients separated by commas&#13;&#10;Example: rice, ginger, soy sauce, sesame oil" 
                                required 
                              />
                              <p className="text-xs text-muted-foreground">
                                Enter ingredients separated by commas
                              </p>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Instructions</label>
                              <Textarea 
                                name="instructions" 
                                placeholder="Enter each step on a new line&#13;&#10;Example:&#13;&#10;Chop vegetables&#13;&#10;Heat oil in pan&#13;&#10;Add spices" 
                                required
                                rows={5}
                              />
                              <p className="text-xs text-muted-foreground">
                                Enter each step on a new line
                              </p>
                            </div>
                          </div>
                          <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Adding Recipe...
                              </>
                            ) : (
                              'Add Recipe'
                            )}
                          </Button>
                        </form>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cuisine.recipes?.map((recipe: CulturalRecipe) => (
                    <Card key={recipe.id} className="relative group">
                      <div className="flex items-center gap-2 justify-between my-2 mx-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewRecipe(recipe)}
                            >
                              View Details
                            </Button>
                            {recipe.createdBy === currentUserId ? (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Recipe
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Recipe?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete this recipe.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteSelectedRecipe(recipe.id)}
                                      className="bg-destructive text-destructive-foreground"
                                    >
                                      Delete Recipe
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="text-muted-foreground"
                                    >
                                      <Info className="h-4 w-4 mr-1" />
                                      Creator Only
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Only the creator of this recipe can delete it.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl">{recipe.name}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{recipe.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

const getEtiquetteDisplay = (key: string, value: unknown) => {
  // Convert both string and array inputs into a consistent array format
  const items = Array.isArray(value) 
    ? value 
    : typeof value === 'string' 
      ? value.split(/[•\n]/).filter(item => item.trim())
      : [];
  
  // Special handling for serving order - use numbered circles
  if (key.includes('order') || key.includes('sequence')) {
    return {
      icon: <ListOrdered className="h-5 w-5 text-blue-600" />,
      content: (
        <ol className="space-y-3 list-none">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{idx + 1}</span>
              </div>
              <span className="text-foreground mt-0.5">{item}</span>
            </li>
          ))}
        </ol>
      )
    };
  }

  // Special handling for taboos - use warning icons and red styling
  if (key.includes('taboo') || key.includes('avoid')) {
    return {
      icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
      content: (
        <ul className="space-y-3 list-none">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <Ban className="h-4 w-4 flex-shrink-0 mt-1 text-red-600" />
              <span className="text-foreground">{item}</span>
            </li>
          ))}
        </ul>
      )
    };
  }

  // Special handling for table setting - use utensils icon
  if (key.includes('table') || key.includes('setting') || key.includes('arrangement')) {
    return {
      icon: <UtensilsCrossed className="h-5 w-5 text-emerald-600" />,
      content: (
        <ul className="space-y-3 list-none">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <ChefHat className="h-4 w-4 flex-shrink-0 mt-1 text-emerald-600" />
              <span className="text-foreground">{item}</span>
            </li>
          ))}
        </ul>
      )
    };
  }

  // Default for dining customs and general guidelines
  return {
    icon: <ScrollText className="h-5 w-5 text-purple-600" />,
    content: items.length > 0 ? (
      <ul className="space-y-3 list-none">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <Info className="h-4 w-4 flex-shrink-0 mt-1 text-purple-600" />
            <span className="text-foreground">{item}</span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-muted-foreground">{String(value)}</p>
    )
  };
};

// In the handleAddRecipe function, add the new recipe
const newRecipe = {
  name: "Risotto alla Milanese",
  description: "A luxurious Northern Italian dish where saffron-infused Carnaroli rice is slowly cooked to creamy perfection, embodying Milan's refined culinary heritage. The distinctive golden color and rich, yet delicate flavor profile make this dish a cornerstone of Lombardy cuisine.",
  difficulty: "advanced",
  imageUrl: "https://source.unsplash.com/featured/?risotto-milanese",
  authenticIngredients: [
    "Carnaroli rice",
    "Saffron threads",
    "White wine (dry)",
    "Parmigiano-Reggiano cheese",
    "White onion",
    "European-style butter",
    "Beef or vegetable stock (homemade preferred)",
    "Extra virgin olive oil",
    "Sea salt",
    "Black pepper"
  ],
  instructions: [
    "Toast saffron threads lightly and steep in warm stock",
    "Finely dice white onion and sweat in butter and olive oil until translucent",
    "Add Carnaroli rice and toast until grains are hot and slightly translucent",
    "Deglaze with dry white wine and stir until absorbed",
    "Begin adding hot saffron-infused stock gradually, stirring constantly",
    "Continue adding stock and stirring for about 18-20 minutes until rice is al dente",
    "Remove from heat and vigorously stir in cold butter and Parmigiano-Reggiano",
    "Let rest for 2 minutes before serving",
    "Plate and finish with additional Parmigiano-Reggiano if desired"
  ],
  culturalNotes: {
    history: "Risotto alla Milanese originated in Milan during the 16th century, influenced by the city's trade connections and wealth. The use of saffron was inspired by its use in cathedral stained glass artwork.",
    significance: "This dish represents Milan's refined culinary tradition and its historical prosperity. The golden color from saffron symbolizes wealth and luxury in Milanese culture.",
    serving: "Traditionally served as 'all'onda' (wave-like consistency) on warm plates. Often accompanies Ossobuco in the complete dish 'Ossobuco alla Milanese'.",
    variations: "While the authentic recipe remains strict, modern variations might include bone marrow or different rice varieties. However, true Risotto alla Milanese must use Carnaroli or Vialone Nano rice and real saffron."
  },
  prepTime: 35
};