import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Utensils, History, Book, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CuisineList } from "@/components/CulturalCuisine/CuisineList";
import { CuisineDetails } from "@/components/CulturalCuisine/CuisineDetails";
import { Button } from "@/components/ui/button";

export default function CulturalCuisinePage() {
  const [selectedCuisineId, setSelectedCuisineId] = useState<number | null>(null);
  const [view, setView] = useState<'list' | 'details'>('list');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Cultural Cuisine Explorer | NutriCartAI";
  }, []);

  const { data: cuisines, isLoading, error } = useQuery({
    queryKey: ['/api/cultural-cuisines'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/cultural-cuisines');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || errorData.error || 'Failed to fetch cuisines');
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format');
        }
        return data;
      } catch (err) {
        if (err instanceof Error) {
          setErrorDetails(err.message);
        }
        throw err;
      }
    }
  });

  const handleSelectCuisine = (id: number) => {
    setSelectedCuisineId(id);
    setView('details');
  };

  const handleBackToList = () => {
    setSelectedCuisineId(null);
    setView('list');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-2xl font-bold mb-2">Failed to load cuisines</h3>
        <p className="text-muted-foreground max-w-md mb-2">
          There was an error loading the cultural cuisines. Please try again later.
        </p>
        {errorDetails && (
          <p className="text-sm text-destructive mb-4">
            Error details: {errorDetails}
          </p>
        )}
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
          Refresh Page
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 overflow-x-hidden">
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Cultural Cuisine Explorer</h1>
            <p className="text-muted-foreground">
              Discover authentic recipes from around the world
            </p>
          </div>
          
          {view === 'details' && (
            <Button onClick={handleBackToList} variant="outline">
              Back to All Cuisines
            </Button>
          )}
        </div>

        {view === 'list' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Authentic Techniques
                  </CardTitle>
                  <Utensils className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{cuisines?.length ? cuisines.reduce((acc, cuisine) => acc + (cuisine.cookingTechniques?.length || 0), 0) : 0}+</div>
                  <p className="text-xs text-muted-foreground">
                    Traditional cooking methods
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Cultural Context
                  </CardTitle>
                  <History className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{cuisines?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Rich cultural histories
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Traditional Recipes
                  </CardTitle>
                  <Book className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {cuisines?.length ? cuisines.reduce((acc, cuisine) => acc + 5, 0) : 0}+
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Authentic dishes to explore
                  </p>
                </CardContent>
              </Card>
            </div>

            <CuisineList cuisines={cuisines || []} onSelectCuisine={handleSelectCuisine} />
          </>
        )}

        {view === 'details' && selectedCuisineId && (
          <CuisineDetails 
            cuisineId={selectedCuisineId} 
            onBack={handleBackToList} 
          />
        )}
      </div>
    </div>
  );
}