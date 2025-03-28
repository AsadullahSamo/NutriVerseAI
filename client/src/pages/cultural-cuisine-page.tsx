import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Utensils, History, Book, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CuisineList } from "@/components/CulturalCuisine/CuisineList";
import { CuisineDetails } from "@/components/CulturalCuisine/CuisineDetails";
import { Button } from "@/components/ui/button";

export default function CulturalCuisinePage() {
  const [selectedCuisineId, setSelectedCuisineId] = useState<number | null>(null);
  const [view, setView] = useState<'list' | 'details'>('list');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [forceRefresh, setForceRefresh] = useState<number>(Date.now());
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = "Cultural Cuisine Explorer | NutriVerseAI";
  }, []);

  const { data: cuisines, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/cultural-cuisines', forceRefresh],
    queryFn: async () => {
      try {
        // Add timestamp to prevent caching
        const timestamp = Date.now();
        const response = await fetch(`/api/cultural-cuisines?t=${timestamp}`, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
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
    },
    staleTime: 0,
    cacheTime: 0
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