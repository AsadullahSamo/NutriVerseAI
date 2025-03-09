import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Utensils, Book, Info, Loader2, PlusCircle, Camera, Edit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecipeDetails } from "./RecipeDetails";
import { CulturalCuisine, CulturalRecipe, CulturalTechnique } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Banner Image</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ bannerUrl });
        }} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Banner Image URL</label>
            <Input 
              placeholder="https://example.com/banner.jpg" 
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Add a wide banner image that represents the cuisine
            </p>
          </div>
          <Button type="submit" className="w-full">Save Banner</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CuisineDetails({ cuisineId, onBack }: CuisineDetailsProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<CulturalRecipe | null>(null);
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [isEditingImages, setIsEditingImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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

  const handleUpdateImages = async (data: { imageUrl: string; bannerUrl: string }) => {
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !cuisine) {
    return (
      <div className="text-center">
        <p className="text-destructive">Failed to load cuisine details</p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          Go Back
        </Button>
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
        authenticIngredients: [], // These would be added in a more detailed form
        instructions: [],
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

      toast({
        title: "Recipe Added",
        description: "The recipe has been added successfully.",
      });

      // Refetch cuisine details to get the updated recipes list
      refetch();
      setIsAddingRecipe(false);
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

  return (
    <div className="relative">
      {cuisine?.bannerUrl && (
        <div className="relative w-full h-[300px] -mt-6 mb-6 rounded-lg overflow-hidden">
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
          <Button
            size="sm"
            className="absolute top-4 right-4"
            onClick={() => setIsEditingImages(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Banner
          </Button>
        </div>
      )}

      <div className="mt-6 space-y-6">
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

        <div className="max-h-[calc(100vh-480px)] overflow-y-auto pr-4 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-3 sticky top-0 bg-background z-10">
              <TabsTrigger value="overview">
                <Info className="h-4 w-4 mr-2 hidden sm:inline" /> 
                Overview
              </TabsTrigger>
              <TabsTrigger value="recipes">
                <Utensils className="h-4 w-4 mr-2 hidden sm:inline" /> 
                Recipes
              </TabsTrigger>
              <TabsTrigger value="techniques">
                <Book className="h-4 w-4 mr-2 hidden sm:inline" /> 
                Techniques
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Key Ingredients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(cuisine.keyIngredients) ? (
                        cuisine.keyIngredients.map((ingredient, i) => (
                          <Badge key={i} variant="outline">{ingredient}</Badge>
                        ))
                      ) : typeof cuisine.keyIngredients === 'object' ? (
                        Object.keys(cuisine.keyIngredients).map((ingredient, i) => (
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
                        cuisine.cookingTechniques.map((technique, i) => (
                          <Badge key={i}>{technique}</Badge>
                        ))
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Cultural Context</CardTitle>
                </CardHeader>
                <CardContent>
                  {typeof cuisine.culturalContext === 'object' ? (
                    Object.entries(cuisine.culturalContext).map(([key, value], i) => (
                      <div key={i} className="mb-4 last:mb-0">
                        <h3 className="font-medium mb-1 capitalize">{key}</h3>
                        <p>{value}</p>
                      </div>
                    ))
                  ) : (
                    <p>{cuisine.culturalContext}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Traditional Serving Etiquette</CardTitle>
                </CardHeader>
                <CardContent>
                  {typeof cuisine.servingEtiquette === 'object' ? (
                    Object.entries(cuisine.servingEtiquette).map(([key, value], i) => (
                      <div key={i} className="mb-4 last:mb-0">
                        <h3 className="font-medium mb-1 capitalize">{key}</h3>
                        <p>{value}</p>
                      </div>
                    ))
                  ) : (
                    <p>{cuisine.servingEtiquette}</p>
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
                      <form onSubmit={handleAddRecipe} className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Name</label>
                          <Input name="name" placeholder="Recipe name" required />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Description</label>
                          <Textarea name="description" placeholder="Recipe description" required />
                        </div>
                        <div>
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
                {cuisine.recipes?.map((recipe) => (
                  <Card key={recipe.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedRecipe(recipe)}>
                    <CardHeader>
                      <CardTitle>{recipe.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">{recipe.description}</p>
                      <Badge className="mt-4" variant={
                        recipe.difficulty === 'beginner' ? 'default' :
                        recipe.difficulty === 'intermediate' ? 'secondary' : 'destructive'
                      }>
                        {recipe.difficulty}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="techniques" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cuisine.techniques?.map((technique) => (
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}