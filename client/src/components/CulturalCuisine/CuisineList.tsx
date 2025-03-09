import { CulturalCuisine } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Globe, PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface CuisineListProps {
  cuisines: CulturalCuisine[];
  onSelectCuisine: (id: number) => void;
}

interface AddCuisineData {
  name: string;
  region: string;
  description: string;
  bannerUrl: string;
  keyIngredients: string[];
  cookingTechniques: string[];
}

export function CuisineList({ cuisines, onSelectCuisine }: CuisineListProps) {
  const [isAddingCuisine, setIsAddingCuisine] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAddCuisine = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const newCuisine = {
        name: formData.get('name') as string,
        region: formData.get('region') as string,
        description: formData.get('description') as string,
        bannerUrl: formData.get('bannerUrl') as string,
        keyIngredients: (formData.get('keyIngredients') as string).split(',').map(i => i.trim()),
        cookingTechniques: (formData.get('cookingTechniques') as string).split(',').map(t => t.trim()),
        culturalContext: {
          history: "To be added",
          significance: "To be added"
        },
        servingEtiquette: {
          general: "To be added"
        }
      };

      const response = await fetch('/api/cultural-cuisines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCuisine)
      });

      if (!response.ok) {
        throw new Error('Failed to add cuisine');
      }

      toast({
        title: "Success",
        description: "New cuisine has been added successfully.",
      });
      setIsAddingCuisine(false);
      // Reload page to show new cuisine
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add cuisine. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatKeyIngredients = (ingredients: unknown): string => {
    if (Array.isArray(ingredients)) {
      return ingredients.slice(0, 5).join(', ') + (ingredients.length > 5 ? '...' : '');
    }
    if (ingredients && typeof ingredients === 'object') {
      const values = Object.values(ingredients as Record<string, unknown>);
      return values.slice(0, 5).join(', ') + (values.length > 5 ? '...' : '');
    }
    return 'Information not available';
  };

  if (cuisines.length === 0) {
    return (
      <div className="text-center p-12">
        <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium">No cuisines found</h3>
        <p className="text-muted-foreground mt-2">
          Start by adding a new cuisine to explore.
        </p>
        <Button onClick={() => setIsAddingCuisine(true)} className="mt-4">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Your First Cuisine
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Explore World Cuisines</h2>
        <Button onClick={() => setIsAddingCuisine(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add New Cuisine
        </Button>
      </div>

      <Dialog open={isAddingCuisine} onOpenChange={setIsAddingCuisine}>
        <DialogContent className="sm:max-w-[600px]">
          <ScrollArea className="max-h-[80vh] px-6">
            <DialogHeader>
              <DialogTitle>Add New Cuisine</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCuisine} className="space-y-8 py-4">
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <label className="text-sm font-medium">Name</label>
                  <Input name="name" placeholder="e.g., Thai, Mexican, Italian" required />
                </div>
                <div className="space-y-2.5">
                  <label className="text-sm font-medium">Region</label>
                  <Input name="region" placeholder="e.g., Southeast Asia, Latin America" required />
                </div>
                <div className="space-y-2.5">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea name="description" placeholder="Brief description of the cuisine..." required />
                </div>
                <div className="space-y-2.5">
                  <label className="text-sm font-medium">Banner Image URL</label>
                  <Input 
                    name="bannerUrl" 
                    placeholder="https://example.com/banner.jpg"
                    type="url"
                    required 
                  />
                  <p className="text-xs text-muted-foreground">
                    Add a wide banner image that showcases the cuisine
                  </p>
                </div>
                <div className="space-y-2.5">
                  <label className="text-sm font-medium">Key Ingredients</label>
                  <Input 
                    name="keyIngredients" 
                    placeholder="rice, garlic, ginger, soy sauce"
                    required 
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated list of key ingredients
                  </p>
                </div>
                <div className="space-y-2.5">
                  <label className="text-sm font-medium">Cooking Techniques</label>
                  <Input 
                    name="cookingTechniques" 
                    placeholder="stir-frying, steaming, grilling"
                    required 
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated list of cooking techniques
                  </p>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Cuisine'}
              </Button>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cuisines.map((cuisine) => (
          <Card key={cuisine.id} className="flex flex-col">
            <div 
              className="h-48 bg-cover bg-center relative rounded-t-lg overflow-hidden"
              style={{ 
                backgroundImage: `url(${cuisine.bannerUrl || `https://source.unsplash.com/800x600/?${encodeURIComponent(cuisine.name.toLowerCase() + ' food')}`})`
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4">
                <h3 className="text-xl font-bold text-white">{cuisine.name}</h3>
                <div className="flex items-center text-white/80 text-sm">
                  <MapPin className="h-3 w-3 mr-1" /> {cuisine.region}
                </div>
              </div>
            </div>
            <CardContent className="flex-grow pt-4">
              <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                {cuisine.description}
              </p>
              <div className="text-sm">
                <p className="font-medium mb-1">Key ingredients:</p>
                <p className="text-muted-foreground line-clamp-2">
                  {formatKeyIngredients(cuisine.keyIngredients)}
                </p>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button 
                onClick={() => onSelectCuisine(cuisine.id)} 
                className="w-full"
              >
                Explore {cuisine.name} Cuisine
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}