import { useState } from "react";
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
  const [selectedRecipe, setSelectedRecipe] = useState<CulturalRecipe | null>(null);
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [isEditingImages, setIsEditingImages] = useState(false);
  const [isEditingCulturalDetails, setIsEditingCulturalDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [aiInsights, setAiInsights] = useState<CulturalInsights | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isAddingTechnique, setIsAddingTechnique] = useState(false);
  const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);

  const { data: cuisine, isLoading, error, refetch } = useQuery({
    queryKey: ['cuisine', cuisineId],
    queryFn: async () => {
      const response = await fetch(`/api/cultural-cuisines/${cuisineId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cuisine details');
      }
      return response.json();
    }
  });

  const handleUpdateImages = async (data: { bannerUrl: string }) => {
    try {
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
      const response = await fetch(`/api/cultural-cuisines/${cuisineId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete cuisine');
      }

      const deletedCuisine = await response.json();
      
      if (!deletedCuisine) {
        throw new Error('Cuisine not found');
      }

      // Invalidate both cuisine list and detail queries
      await queryClient.invalidateQueries({ queryKey: ['/api/cultural-cuisines'] });
      await queryClient.invalidateQueries({ queryKey: ['cuisine', cuisineId] });

      toast({
        title: "Cuisine Deleted",
        description: "The cuisine has been deleted successfully.",
      });

      // Use the onBack prop to return to the cuisine list
      onBack();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete cuisine. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchAIInsights = async () => {
    if (!cuisine || aiInsights) return;
    setIsLoadingAI(true);
    try {
      const insights = await analyzeCulturalCuisine(cuisine);
      setAiInsights(insights);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load AI insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleDeleteSelectedRecipe = async (recipeId: number) => {
    try {
      const response = await fetch(`/api/cultural-recipes/${recipeId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete recipe');
      }

      toast({
        title: "Recipe Deleted",
        description: "The recipe has been deleted successfully.",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete recipe. Please try again.",
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
      const newRecipe = {
        name: formData.get('name'),
        description: formData.get('description'),
        difficulty: formData.get('difficulty') || 'beginner',
        cuisineId,
        // Initialize with empty but valid structures that match the database schema
        authenticIngredients: formData.get('ingredients')?.toString().split(',').map(i => i.trim()).filter(Boolean) || [],
        instructions: formData.get('instructions')?.toString().split('\n').filter(Boolean) || [],
        culturalNotes: {
          history: formData.get('note_history')?.toString() || '',
          significance: formData.get('note_significance')?.toString() || '',
          serving: formData.get('note_serving')?.toString() || '',
          variations: formData.get('note_variations')?.toString() || ''
        },
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

      toast({
        title: "Recipe Added",
        description: "The recipe has been added successfully.",
      });

      // Refetch cuisine details to get the updated recipes list
      await refetch();
      setIsAddingRecipe(false);
      // Automatically select the newly added recipe for editing
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

  const handleAddTechnique = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const newTechnique = {
        name: formData.get('name'),
        description: formData.get('description'),
        difficulty: formData.get('difficulty') || 'beginner',
        cuisineId,
        steps: [],
        tips: [],
        commonUses: {},
        videoUrl: formData.get('videoUrl') || null
      };

      const response = await fetch('/api/cultural-techniques', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTechnique),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to add technique');
      }

      toast({
        title: "Technique Added",
        description: "The technique has been added successfully.",
      });

      refetch();
      setIsAddingTechnique(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add technique. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
      <div className="relative space-y-6 pb-12">
        {cuisine?.bannerUrl && (
          <div className="relative w-full h-[300px] rounded-lg overflow-hidden">
            <img 
              src={cuisine.bannerUrl} 
              alt={`${cuisine.name} banner`}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background/20" />
            <div className="absolute bottom-0 left-0 p-6">
              <h1 className="text-4xl font-bold mb-2 text-white drop-shadow-lg">{cuisine.name}</h1>
              <div className="flex items-center gap-2 text-white/80">
                <MapPin className="h-4 w-4" /> {cuisine.region}
              </div>
            </div>
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                size="sm"
                onClick={() => setIsEditingImages(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Banner
              </Button>
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
              <TabsList className="grid grid-cols-3 mb-8">
                <TabsTrigger value="overview">
                  <Globe2 className="h-4 w-4 mr-2 hidden sm:inline" /> 
                  Overview
                </TabsTrigger>
                <TabsTrigger value="recipes">
                  <UtensilsCrossed className="h-4 w-4 mr-2 hidden sm:inline" /> 
                  Recipes
                </TabsTrigger>
                <TabsTrigger value="techniques">
                  <ChefHat className="h-4 w-4 mr-2 hidden sm:inline" /> 
                  Techniques
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <History className="h-5 w-5 text-primary" />
                          <CardTitle>Cultural Context</CardTitle>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateCulturalDetails}
                            disabled={isGeneratingDetails}
                          >
                            {isGeneratingDetails ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Brain className="h-4 w-4 mr-2" />
                                Generate with AI
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingCulturalDetails(true)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {cuisine.culturalContext && Object.keys(cuisine.culturalContext).length > 0 ? 'Edit Context' : 'Add Context'}
                          </Button>
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
                                  <h3 className="text-lg font-semibold capitalize">{formatHeading(key)}</h3>
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
                          <p className="text-xs text-muted-foreground mt-1">Click 'Add Context' to share cultural information.</p>
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
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateCulturalDetails}
                            disabled={isGeneratingDetails}
                          >
                            {isGeneratingDetails ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Brain className="h-4 w-4 mr-2" />
                                Generate with AI
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingCulturalDetails(true)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {cuisine.servingEtiquette && Object.keys(cuisine.servingEtiquette).length > 0 ? 'Edit Etiquette' : 'Add Etiquette'}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {cuisine.servingEtiquette && typeof cuisine.servingEtiquette === 'object' && Object.keys(cuisine.servingEtiquette).length > 0 ? (
                        <div className="grid gap-6">
                          {Object.entries(cuisine.servingEtiquette).map(([key, value]: [string, unknown], i: number) => {
                            const k = key.toLowerCase();
                            const { icon, content } = getEtiquetteDisplay(k, value);
                            const sectionStyle = k.includes('table') ? 'border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/30' :
                                                k.includes('custom') ? 'border-l-purple-500 bg-purple-50/30 dark:bg-purple-950/30' :
                                                k.includes('order') ? 'border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/30' :
                                                k.includes('taboo') ? 'border-l-red-500 bg-red-50/30 dark:bg-red-950/30' :
                                                'border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/30';

                            return (
                              <div key={i} className={`p-6 rounded-lg border-l-4 ${sectionStyle} transition-all duration-200 hover:shadow-md`}>
                                <div className="flex items-center space-x-3 mb-4">
                                  {icon}
                                  <h3 className="text-lg font-semibold capitalize">{formatHeading(key)}</h3>
                                </div>
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                  {content}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <UtensilsCrossed className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-50" />
                          <p className="text-sm text-muted-foreground">No serving etiquette has been added yet.</p>
                          <p className="text-xs text-muted-foreground mt-1">Click 'Add Etiquette' to add serving customs.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card className="col-span-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Brain className="h-5 w-5 text-primary" />
                        <CardTitle>AI Cultural Insights</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchAIInsights}
                        disabled={isLoadingAI || !!aiInsights}
                      >
                        {isLoadingAI ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : aiInsights ? (
                          "Analysis Complete"
                        ) : (
                          <>
                            <Brain className="mr-2 h-4 w-4" />
                            Analyze Culture
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {aiInsights ? (
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-medium mb-2">Historical Context</h3>
                          <p className="text-muted-foreground">{aiInsights.historicalContext}</p>
                        </div>

                        <div>
                          <h3 className="font-medium mb-2">Cultural Significance</h3>
                          <ul className="list-disc pl-4 space-y-1">
                            {aiInsights.culturalSignificance?.map((item: string, i: number) => (
                              <li key={i} className="text-muted-foreground">{item}</li>
                            )) || <li className="text-muted-foreground">No cultural significance information available</li>}
                          </ul>
                        </div>

                        <div>
                          <h3 className="font-medium mb-2">Traditional Occasions</h3>
                          <ul className="list-disc pl-4 space-y-1">
                            {aiInsights.traditionalOccasions?.map((occasion: string, i: number) => (
                              <li key={i} className="text-muted-foreground">{occasion}</li>
                            )) || <li className="text-muted-foreground">No traditional occasions information available</li>}
                          </ul>
                        </div>

                        <div>
                          <h3 className="font-medium mb-2">Modern Adaptations</h3>
                          <ul className="list-disc pl-4 space-y-1">
                            {aiInsights.modernAdaptations?.map((adaptation: string, i: number) => (
                              <li key={i} className="text-muted-foreground">{adaptation}</li>
                            )) || <li className="text-muted-foreground">No modern adaptations information available</li>}
                          </ul>
                        </div>

                        <div>
                          <h3 className="font-medium mb-2">Regional Variations</h3>
                          <div className="grid gap-4 md:grid-cols-2">
                            {aiInsights.regionalVariations?.map((variation: { region: string; description: string; uniqueIngredients: string[] }, i: number) => (
                              <Card key={i} className="bg-muted/50">
                                <CardHeader>
                                  <CardTitle className="text-base">{variation.region}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-sm text-muted-foreground mb-2">{variation.description}</p>
                                  <div className="flex flex-wrap gap-1">
                                    {variation.uniqueIngredients?.map((ingredient: string, j: number) => (
                                      <Badge key={j} variant="outline">{ingredient}</Badge>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            )) || <p className="text-muted-foreground col-span-2">No regional variations information available</p>}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Click "Analyze Culture" to get AI-powered insights about {cuisine?.name} cuisine.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
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
                              <label className="text-sm font-medium">Difficulty</label>
                              <Select name="difficulty" defaultValue="beginner">
                                <SelectTrigger>
                                  <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="beginner">Beginner</SelectItem>
                                  <SelectItem value="intermediate">Intermediate</SelectItem>
                                  <SelectItem value="advanced">Advanced</SelectItem>
                                </SelectContent>
                              </Select>
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
                                placeholder="Enter each step on a new line&#13;&#10;Example:&#13;&#10;1. Chop vegetables&#13;&#10;2. Heat oil in pan&#13;&#10;3. Add spices" 
                                required
                                rows={5}
                              />
                              <p className="text-xs text-muted-foreground">
                                Enter each instruction step on a new line
                              </p>
                            </div>
                            <div className="space-y-4">
                              <h3 className="text-sm font-medium">Cultural Notes</h3>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Historical Context</label>
                                <Textarea 
                                  name="note_history"
                                  placeholder="Historical background of the dish"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Cultural Significance</label>
                                <Textarea 
                                  name="note_significance"
                                  placeholder="Cultural importance and meaning"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Serving Traditions</label>
                                <Textarea 
                                  name="note_serving"
                                  placeholder="Traditional serving methods"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Regional Variations</label>
                                <Textarea 
                                  name="note_variations"
                                  placeholder="Different variations across regions"
                                />
                              </div>
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
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl">{recipe.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedRecipe(recipe)}
                            >
                              View Details
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
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
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{recipe.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="techniques" className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Traditional Techniques</h2>
                  <Dialog open={isAddingTechnique} onOpenChange={setIsAddingTechnique}>
                    <DialogTrigger asChild>
                      <Button>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Technique
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh]">
                      <ScrollArea className="max-h-[80vh] pr-4">
                        <DialogHeader>
                          <DialogTitle>Add New Technique</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddTechnique} className="space-y-6 py-4">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Name</label>
                              <Input name="name" placeholder="Technique name" required />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Description</label>
                              <Textarea name="description" placeholder="Technique description" required />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Difficulty</label>
                              <Select name="difficulty" defaultValue="beginner">
                                <SelectTrigger>
                                  <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="beginner">Beginner</SelectItem>
                                  <SelectItem value="intermediate">Intermediate</SelectItem>
                                  <SelectItem value="advanced">Advanced</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Video URL (optional)</label>
                              <Input name="videoUrl" placeholder="https://example.com/technique-video" />
                            </div>
                          </div>
                          <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Adding Technique...
                              </>
                            ) : (
                              'Add Technique'
                            )}
                          </Button>
                        </form>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {cuisine.techniques?.map((technique: CulturalTechnique) => (
                    <Card key={technique.id}>
                      <CardHeader>
                        <CardTitle>{technique.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="mb-4">{technique.description}</p>
                        <Badge variant={
                          technique.difficulty === 'beginner' ? 'default' :
                          technique.difficulty === 'intermediate' ? 'secondary' : 'destructive'
                        }>
                          {technique.difficulty}
                        </Badge>
                        {technique.videoUrl && (
                          <a 
                            href={technique.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-primary hover:underline mt-2"
                          >
                            <Play className="h-4 w-4" />
                            Watch Technique Video
                          </a>
                        )}
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
  const items = typeof value === 'string' ? value.split(/[•\n]/).filter(item => item.trim()) : [];
  
  if (key.includes('taboo')) {
    return {
      icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
      content: (
        <ul className="space-y-2 list-none">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-red-700 dark:text-red-300">
              <Ban className="h-4 w-4 flex-shrink-0 mt-1" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )
    };
  }
  
  if (key.includes('order')) {
    return {
      icon: <ListOrdered className="h-5 w-5 text-blue-600" />,
      content: (
        <ol className="space-y-2 list-none">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{idx + 1}</span>
              </div>
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ol>
      )
    };
  }
  
  if (key.includes('table') || key.includes('setting')) {
    return {
      icon: <ChefHat className="h-5 w-5 text-emerald-600" />,
      content: (
        <ul className="space-y-2 list-none">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-emerald-700 dark:text-emerald-300">
              <UtensilsCrossed className="h-4 w-4 flex-shrink-0 mt-1" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )
    };
  }

  // Default for customs and general guidelines
  return {
    icon: <ScrollText className="h-5 w-5 text-purple-600" />,
    content: Array.isArray(items) && items.length > 0 ? (
      <ul className="space-y-2 list-none">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 text-purple-700 dark:text-purple-300">
            <Info className="h-4 w-4 flex-shrink-0 mt-1" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-muted-foreground">{String(value)}</p>
    )
  };
};