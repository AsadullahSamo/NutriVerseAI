import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  ArrowLeft, Info as InfoIcon, ChevronRight, AlertTriangle, Sparkles, 
  ChefHat, Brain, Loader2, Edit, Plus, Trash2, History, 
  Star, UtensilsCrossed, Map, Scroll, ArrowRight, Info, Globe2 
} from "lucide-react";
import type { CulturalRecipe, CulturalCuisine } from "@shared/schema";
import { getRecipeAuthenticityScore, getTechniqueTips, getSubstitutions, getPairings, getEtiquette } from "@ai-services/cultural-cuisine-service";
import type { RecipeAuthenticityAnalysis, TechniqueTip } from "@ai-services/cultural-cuisine-service";

interface RecipeDetailsProps {
  recipe: CulturalRecipe;
  cuisine: CulturalCuisine;
  onBack: () => void;
}

interface IngredientSubstitution {
  original: string;
  substitute: string;
  notes: string;
  flavorImpact: 'minimal' | 'moderate' | 'significant';
}

interface Pairings {
  mainDishes: string[];
  sideDishes: string[];
  desserts: string[];
  beverages: string[];
}

interface Etiquette {
  presentation: string[];
  customs: string[];
  taboos: string[];
  servingOrder: string[];
}

interface CulturalNotes {
  [key: string]: string;
}

export function RecipeDetails({ recipe, cuisine, onBack }: RecipeDetailsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [substitutions, setSubstitutions] = useState<IngredientSubstitution[]>([]);
  const [authenticityScore, setAuthenticityScore] = useState<{ score: number; feedback: string[] }>({ score: 0, feedback: [] });
  const [loading, setLoading] = useState<boolean>(false);
  const [pairings, setPairings] = useState<Pairings | null>(null);
  const [etiquette, setEtiquette] = useState<Etiquette | null>(null);
  const [authenticityAnalysis, setAuthenticityAnalysis] = useState<RecipeAuthenticityAnalysis | null>(null);
  const [techniqueTips, setTechniqueTips] = useState<TechniqueTip[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [isEditingIngredients, setIsEditingIngredients] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isAddingSubstitutions, setIsAddingSubstitutions] = useState(false);
  
  const { data: recipeDetails, refetch } = useQuery({
    queryKey: ['recipe', recipe.id],
    queryFn: async () => {
      const response = await fetch(`/api/cultural-recipes/${recipe.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recipe details');
      }
      return response.json();
    },
    initialData: recipe
  });

  useEffect(() => {
    if (user) {
      fetchSubstitutions();
    }
  }, [user, recipe.id]);
  
  const fetchSubstitutions = async () => {
    if (!recipe || !cuisine) return;
    setLoading(true);
    try {
      const data = await getSubstitutions(recipe, cuisine);
      if (data && Array.isArray(data.substitutions)) {
        setSubstitutions(data.substitutions);
        // Update authenticity score if provided
        if (typeof data.authenticityScore === 'number') {
          setAuthenticityScore({
            score: data.authenticityScore,
            feedback: data.authenticityFeedback || []
          });
        }
      }
    } catch (error) {
      console.error('Error fetching substitutions:', error);
      toast({
        title: "Error",
        description: "Could not load ingredient substitutions. Please try again.",
        variant: "destructive",
      });
      setSubstitutions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPairings = async () => {
    if (!recipe || !cuisine) return;
    setLoading(true);
    try {
      const data = await getPairings(recipe, cuisine);
      if (data) {
        setPairings({
          mainDishes: data.mainDishes || [],
          sideDishes: data.sideDishes || [],
          desserts: data.desserts || [],
          beverages: data.beverages || []
        });
      }
    } catch (error) {
      console.error('Error fetching pairings:', error);
      toast({
        title: "Error",
        description: "Could not load complementary dishes. Please try again.",
        variant: "destructive",
      });
      setPairings(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchEtiquette = async () => {
    if (!recipe || !cuisine) return;
    setLoading(true);
    try {
      const data = await getEtiquette(recipe, cuisine);
      if (data) {
        setEtiquette({
          presentation: data.presentation || [],
          customs: data.customs || [],
          taboos: data.taboos || [],
          servingOrder: data.servingOrder || []
        });
      }
    } catch (error) {
      console.error('Error fetching etiquette:', error);
      toast({
        title: "Error",
        description: "Could not load serving etiquette. Please try again.",
        variant: "destructive",
      });
      setEtiquette(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthenticityAnalysis = async () => {
    if (!recipe) return;
    setIsAnalyzing(true);
    try {
      const analysis = await getRecipeAuthenticityScore(recipe, cuisine);
      setAuthenticityAnalysis(analysis);
      // Update the authenticity score state when analysis is complete
      setAuthenticityScore({
        score: analysis.authenticityScore,
        feedback: analysis.suggestions || []
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze recipe authenticity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchTechniqueTips = async () => {
    if (!recipe || !cuisine || techniqueTips.length > 0) return;
    setIsAnalyzing(true);
    try {
      // For demo purposes, create a mock technique from the recipe
      const mockTechnique = {
        id: 0,
        name: recipe.name,
        description: recipe.description,
        difficulty: recipe.difficulty,
        steps: [],
        tips: [],
        cuisineId: cuisine.id,
        createdAt: new Date(),
        commonUses: {},
        videoUrl: null
      };
      const tips = await getTechniqueTips(mockTechnique, cuisine);
      setTechniqueTips([tips]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load technique tips. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdateRecipe = async (updatedData: Partial<CulturalRecipe>) => {
    try {
      const response = await fetch(`/api/cultural-recipes/${recipe.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to update recipe');
      }

      await refetch(); // Refetch recipe data after update

      toast({
        title: "Recipe Updated",
        description: "Recipe details have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update recipe. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddSubstitution = async (substitution: IngredientSubstitution) => {
    try {
      const response = await fetch(`/api/cultural-recipes/${recipe.id}/substitutions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(substitution),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to add substitution');
      }

      const data = await response.json();
      
      // Update local state with the new substitution
      setSubstitutions(prev => [...prev, data.substitution]);
      
      // Update recipe details through react-query
      await refetch();

      toast({
        title: "Substitution Added",
        description: "The ingredient substitution has been added successfully.",
      });

      setIsAddingSubstitutions(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add substitution. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRecipe = async () => {
    try {
      const response = await fetch(`/api/cultural-recipes/${recipe.id}`, {
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

      onBack(); // Return to cuisine view after deletion
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete recipe. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Update button labels and dialogs based on content existence
  const hasInstructions = Array.isArray(recipeDetails.instructions) ? recipeDetails.instructions.length > 0 : 
    recipeDetails.instructions && Object.keys(recipeDetails.instructions).length > 0;
  const hasIngredients = Array.isArray(recipeDetails.authenticIngredients) ? recipeDetails.authenticIngredients.length > 0 :
    recipeDetails.authenticIngredients && Object.keys(recipeDetails.authenticIngredients).length > 0;
  const hasNotes = recipeDetails.culturalNotes && Object.keys(recipeDetails.culturalNotes).length > 0;

  const renderModernAdaptations = () => {
    if (!authenticityAnalysis?.modernAdaptations?.length) {
      return null;
    }

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Modern Adaptations</h4>
        <div className="flex flex-wrap gap-1">
          {authenticityAnalysis.modernAdaptations.map((adaptation: string, i: number) => (
            <Badge key={i} variant="secondary">{adaptation}</Badge>
          ))}
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="space-y-6">
          <div className="flex items-center gap-4 justify-between">
            <Button onClick={onBack} variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {cuisine.name} Cuisine
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Recipe
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
                  <AlertDialogAction onClick={handleDeleteRecipe} className="bg-destructive text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{recipe.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{recipe.description}</p>
                <Badge variant={
                  recipe.difficulty === 'beginner' ? 'default' :
                  recipe.difficulty === 'intermediate' ? 'secondary' : 'destructive'
                }>
                  {recipe.difficulty}
                </Badge>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-12 gap-6">
              <div className="md:col-span-8 space-y-6">
                <div 
                  className="h-64 w-full bg-cover bg-center rounded-lg"
                  style={{ 
                    backgroundImage: `url(https://source.unsplash.com/1200x800/?${encodeURIComponent(recipe.name.toLowerCase())})`,
                    backgroundSize: 'cover'
                  }}
                />
                
                <div>
                  <h2 className="text-xl font-bold mb-2">Description</h2>
                  <p>{recipe.description}</p>
                </div>

                <Tabs defaultValue="instructions" className="w-full">
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="instructions">Instructions</TabsTrigger>
                    <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
                    <TabsTrigger value="cultural-notes">Cultural Notes</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="instructions" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold mt-2">Steps</h3>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsEditingInstructions(true)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {hasInstructions ? 'Edit Steps' : 'Add Steps'}
                      </Button>
                    </div>
                    <ol className="space-y-4">
                      {Array.isArray(recipe.instructions) ? (
                        recipe.instructions.map((step: string, i: number) => (
                          <li key={i} className="flex gap-4 items-start">
                            <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                              {i + 1}
                            </div>
                            <div>{step}</div>
                          </li>
                        ))
                      ) : recipe.instructions && typeof recipe.instructions === 'object' ? (
                        Object.values(recipe.instructions as Record<string, string>).map((step: string, i: number) => (
                          <li key={i} className="flex gap-4 items-start">
                            <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                              {i + 1}
                            </div>
                            <div>{step}</div>
                          </li>
                        ))
                      ) : null}
                    </ol>
                  </TabsContent>
                  
                  <TabsContent value="ingredients">
                    <div className="space-y-6 mt-2">
                      <div>
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">Authentic Ingredients</h3>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setIsEditingIngredients(true)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {hasIngredients ? 'Edit Ingredients' : 'Add Ingredients'}
                          </Button>
                        </div>
                        <ul className="space-y-3 mt-4">
                          {Array.isArray(recipe.authenticIngredients) ? (
                            recipe.authenticIngredients.map((ingredient: string, i: number) => (
                              <li key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/10 transition-colors">
                                <div className="flex items-center gap-2">
                                  <ChevronRight className="h-4 w-4 text-primary" />
                                  <span className="font-medium">{ingredient}</span>
                                </div>
                                {substitutions.some(s => s.original === ingredient) && (
                                  <Badge variant="outline" className="animate-fadeIn flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span>Has substitution</span>
                                  </Badge>
                                )}
                              </li>
                            ))
                          ) : recipe.authenticIngredients && typeof recipe.authenticIngredients === 'object' ? (
                            Object.entries(recipe.authenticIngredients as Record<string, string>).map(([name, quantity]: [string, string], i: number) => (
                              <li key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/10 transition-colors">
                                <div className="flex items-center gap-2">
                                  <ChevronRight className="h-4 w-4 text-primary" />
                                  <span className="font-medium">{name}: {quantity}</span>
                                </div>
                                {substitutions.some(s => s.original === name) && (
                                  <Badge variant="outline" className="animate-fadeIn flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span>Has substitution</span>
                                  </Badge>
                                )}
                              </li>
                            ))
                          ) : null}
                        </ul>
                      </div>
                      
                      {recipe.localSubstitutes && Object.keys(recipe.localSubstitutes).length > 0 && (
                        <Card className="mt-6 overflow-hidden">
                          <CardHeader className="border-b bg-muted/50">
                            <CardTitle className="text-lg">Local Substitutes</CardTitle>
                            <CardDescription>Traditional ingredient alternatives available locally</CardDescription>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="divide-y">
                              {Object.entries(recipe.localSubstitutes as Record<string, string>).map(([original, substitute]: [string, string], i: number) => {
                                const substitutionDetails = substitutions.find(s => s.original === original);
                                return (
                                  <div key={i} className="p-4 hover:bg-accent/5 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center text-sm">
                                          <span className="font-semibold">{original}</span>
                                          <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
                                          <span>{substitute}</span>
                                        </div>
                                      </div>
                                      {substitutionDetails && (
                                        <Badge variant={
                                          substitutionDetails.flavorImpact === 'minimal' ? 'outline' :
                                          substitutionDetails.flavorImpact === 'moderate' ? 'secondary' : 
                                          'destructive'
                                        } className="animate-fadeIn">
                                          {substitutionDetails.flavorImpact} impact
                                        </Badge>
                                      )}
                                    </div>
                                    {substitutionDetails?.notes && (
                                      <div className="pl-4 border-l-2 border-primary/20 mt-2">
                                        <p className="text-sm text-muted-foreground">
                                          {substitutionDetails.notes}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="cultural-notes">
                    <div className="space-y-6 mt-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Globe2 className="h-5 w-5 text-primary" />
                          Cultural Notes
                        </h3>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setIsEditingNotes(true)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          {hasNotes ? 'Edit Notes' : 'Add Notes'}
                        </Button>
                      </div>
                      {recipe.culturalNotes && typeof recipe.culturalNotes === 'object' ? (
                        <div className="grid gap-6">
                          {Object.entries(recipe.culturalNotes as Record<string, string>).map(([title, note]: [string, string], i: number) => (
                            <Card key={i} className="relative overflow-hidden group hover:shadow-md transition-all duration-200">
                              <CardHeader className="bg-muted/50 border-b">
                                <CardTitle className="capitalize flex items-center gap-2 text-base">
                                  {title === 'history' && <History className="h-4 w-4 text-primary" />}
                                  {title === 'significance' && <Star className="h-4 w-4 text-amber-500" />}
                                  {title === 'serving' && <UtensilsCrossed className="h-4 w-4 text-emerald-500" />}
                                  {title === 'variations' && <Map className="h-4 w-4 text-indigo-500" />}
                                  {title.replace(/_/g, ' ')}
                                  {title === 'significance' && (
                                    <Badge variant="secondary" className="ml-auto">Cultural Heritage</Badge>
                                  )}
                                  {title === 'serving' && (
                                    <Badge variant="secondary" className="ml-auto">Traditional Method</Badge>
                                  )}
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="pt-4">
                                <p className="leading-relaxed">{note}</p>
                              </CardContent>
                              <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none transform translate-x-8 -translate-y-8 transition-transform group-hover:translate-x-4 group-hover:-translate-y-4">
                                {title === 'history' && <History className="w-full h-full" />}
                                {title === 'significance' && <Star className="w-full h-full" />}
                                {title === 'serving' && <UtensilsCrossed className="w-full h-full" />}
                                {title === 'variations' && <Map className="w-full h-full" />}
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : recipe.culturalNotes ? (
                        <p>{String(recipe.culturalNotes)}</p>
                      ) : (
                        <Card className="bg-muted/50">
                          <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                            <Scroll className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                            <p className="text-sm text-muted-foreground">No cultural notes have been added yet.</p>
                            <p className="text-xs text-muted-foreground mt-1">Click 'Add Notes' to share cultural context about this recipe.</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              <div className="md:col-span-4 space-y-6">
                {/* Authenticity Analysis */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Recipe Authenticity
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchAuthenticityAnalysis}
                      disabled={isAnalyzing || !!authenticityAnalysis}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : authenticityAnalysis ? (
                        "Analysis Complete"
                      ) : (
                        <>
                          <Brain className="mr-2 h-4 w-4" />
                          Analyze
                        </>
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {authenticityAnalysis && (
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Authenticity Score</span>
                            <span className="font-bold text-primary">{authenticityAnalysis.authenticityScore}%</span>
                          </div>
                          <Progress value={authenticityAnalysis.authenticityScore} />
                        </div>

                        {authenticityAnalysis.traditionalElements?.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Traditional Elements</h4>
                            <div className="flex flex-wrap gap-1">
                              {authenticityAnalysis.traditionalElements.map((element, i) => (
                                <Badge key={i} variant="outline">{element}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {renderModernAdaptations()}

                        {authenticityAnalysis.culturalAccuracy && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Cultural Accuracy</h4>
                            <p className="text-sm text-muted-foreground">{authenticityAnalysis.culturalAccuracy}</p>
                          </div>
                        )}

                        {authenticityAnalysis.suggestions?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Suggestions for Improvement</h4>
                            <ul className="text-sm space-y-1">
                              {authenticityAnalysis.suggestions.map((suggestion, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <InfoIcon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                  <span className="text-muted-foreground">{suggestion}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Technique Tips */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <ChefHat className="h-4 w-4" />
                      Technique Tips
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTechniqueTips([]); // Reset tips first
                        fetchTechniqueTips();
                      }}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Brain className="mr-2 h-4 w-4" />
                          {techniqueTips.length > 0 ? 'Refresh Tips' : 'Get Tips'}
                        </>
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {techniqueTips.length > 0 ? (
                      <div className="space-y-6">
                        {techniqueTips.map((tip, index) => (
                          <div key={index} className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium mb-1">Traditional Method</h4>
                              <p className="text-sm text-muted-foreground">{tip.traditionalMethod}</p>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium mb-1">Modern Adaptation</h4>
                              <p className="text-sm text-muted-foreground">{tip.modernAdaptation}</p>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium mb-1">Common Mistakes to Avoid</h4>
                              <ul className="text-sm space-y-1">
                                {tip.commonMistakes.map((mistake: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-muted-foreground">{mistake}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium mb-1">Expert Tips</h4>
                              <ul className="text-sm space-y-1">
                                {tip.tips.map((expertTip: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <ChefHat className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                    <span className="text-muted-foreground">{expertTip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Click "Get Tips" to receive expert cooking technique guidance</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Authenticity Score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Authenticity score is calculated based on:</p>
                          <ul className="list-disc list-inside mt-2">
                            <li>Use of traditional ingredients</li>
                            <li>Cooking methods</li>
                            <li>Cultural adherence</li>
                            <li>Regional variations</li>
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                      Authenticity Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Progress value={authenticityScore.score} />
                      <div className="flex justify-between text-sm">
                        <span>Modified</span>
                        <span className="font-medium">{authenticityScore.score}%</span>
                        <span>Authentic</span>
                      </div>
                      
                      {authenticityScore.feedback.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Feedback</h4>
                          <ul className="text-sm space-y-1">
                            {authenticityScore.feedback.map((item, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Ingredient Substitutions Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b bg-muted/50">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        Ingredient Substitutions
                      </CardTitle>
                      <CardDescription>Alternative ingredients and their impact</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchSubstitutions}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Show Substitutions
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddingSubstitutions(true)}
                        className="whitespace-nowrap"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Substitution
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {substitutions.length > 0 ? (
                      <div className="space-y-4">
                        {substitutions.map((sub, index) => (
                          <div key={index} 
                            className="group p-4 rounded-lg border bg-card hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center">
                                    <span className="font-medium text-primary">{sub.original}</span>
                                    <div className="mx-3 flex items-center gap-2">
                                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                      <Badge variant="outline" className="font-normal">
                                        {sub.substitute}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <Badge variant={
                                sub.flavorImpact === 'minimal' ? 'outline' :
                                sub.flavorImpact === 'moderate' ? 'secondary' : 
                                'destructive'
                              } className="ml-2 transition-all duration-200 group-hover:scale-105">
                                <div className="flex items-center gap-1.5">
                                  <div className={`w-2 h-2 rounded-full ${
                                    sub.flavorImpact === 'minimal' ? 'bg-primary' :
                                    sub.flavorImpact === 'moderate' ? 'bg-secondary' :
                                    'bg-destructive'
                                  }`} />
                                  {sub.flavorImpact} impact
                                </div>
                              </Badge>
                            </div>
                            <div className="pl-4 border-l-2 border-primary/20 mt-3">
                              <div className="flex items-start gap-2">
                                <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <p className="text-sm text-muted-foreground">{sub.notes}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : !loading ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <div className="rounded-full bg-muted p-3 mb-3">
                          <Plus className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          No substitutions added yet
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Click "Add Substitution" to suggest ingredient alternatives
                        </p>
                      </div>
                    ) : (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                    {!user && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground text-center">
                          Sign in to view personalized substitutions based on your pantry
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Complementary Dishes */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-semibold">Complementary Dishes</CardTitle>
                    <Button variant="ghost" size="sm" onClick={fetchPairings} disabled={loading}>
                      {loading ? 'Loading...' : 'Show Pairings'}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {pairings ? (
                      <div className="space-y-3">
                        {pairings.mainDishes.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm">Main Dishes</h4>
                            <ul className="mt-1">
                              {pairings.mainDishes.map((dish, i) => (
                                <li key={i} className="text-sm">{dish}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {pairings.sideDishes.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm">Side Dishes</h4>
                            <ul className="mt-1">
                              {pairings.sideDishes.map((dish, i) => (
                                <li key={i} className="text-sm">{dish}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {pairings.desserts.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm">Desserts</h4>
                            <ul className="mt-1">
                              {pairings.desserts.map((dish, i) => (
                                <li key={i} className="text-sm">{dish}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {pairings.beverages.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm">Beverages</h4>
                            <ul className="mt-1">
                              {pairings.beverages.map((beverage, i) => (
                                <li key={i} className="text-sm">{beverage}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Click "Show Pairings" to see recommended dish combinations
                      </p>
                    )}
                  </CardContent>
                </Card>
                
                {/* Serving Etiquette */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-semibold">Serving Etiquette</CardTitle>
                    <Button variant="ghost" size="sm" onClick={fetchEtiquette} disabled={loading}>
                      {loading ? 'Loading...' : 'Show Etiquette'}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {etiquette ? (
                      <div className="space-y-3">
                        {etiquette.taboos.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm text-destructive">Taboos to Avoid</h4>
                            <ul className="mt-1 list-disc list-inside">
                              {etiquette.taboos.map((taboo, i) => (
                                <li key={i} className="text-sm">{taboo}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {etiquette.customs.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm">Customs</h4>
                            <ul className="mt-1 list-disc list-inside">
                              {etiquette.customs.map((custom, i) => (
                                <li key={i} className="text-sm">{custom}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {etiquette.presentation.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm">Presentation</h4>
                            <ul className="mt-1 list-disc list-inside">
                              {etiquette.presentation.map((tip, i) => (
                                <li key={i} className="text-sm">{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Click "Show Etiquette" to see serving customs
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Instructions Dialog */}
        <Dialog open={isEditingInstructions} onOpenChange={setIsEditingInstructions}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{hasInstructions ? 'Edit Recipe Instructions' : 'Add Recipe Instructions'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const instructionsText = formData.get('instructions') as string;
              const instructions = instructionsText.split('\n').filter(Boolean);
              handleUpdateRecipe({ instructions });
              setIsEditingInstructions(false);
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Instructions</label>
                <Textarea 
                  name="instructions"
                  defaultValue={Array.isArray(recipeDetails.instructions) ? 
                    recipeDetails.instructions.join('\n') : 
                    Object.values(recipeDetails.instructions || {}).join('\n')}
                  placeholder="Enter each step on a new line"
                  rows={10}
                />
                <p className="text-sm text-muted-foreground">
                  Enter each step on a new line. For example:
                  {'\nChop the vegetables\nHeat oil in a pan\nAdd spices'}
                </p>
              </div>
              <Button type="submit" className="w-full">
                {hasInstructions ? 'Save Instructions' : 'Add Instructions'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Ingredients Dialog */}
        <Dialog open={isEditingIngredients} onOpenChange={setIsEditingIngredients}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{hasIngredients ? 'Edit Authentic Ingredients' : 'Add Authentic Ingredients'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const ingredientsText = formData.get('ingredients') as string;
              const ingredients = ingredientsText.split(',').map(i => i.trim()).filter(Boolean);
              handleUpdateRecipe({ authenticIngredients: ingredients });
              setIsEditingIngredients(false);
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ingredients</label>
                <Textarea 
                  name="ingredients"
                  defaultValue={Array.isArray(recipeDetails.authenticIngredients) ? 
                    recipeDetails.authenticIngredients.join(', ') : 
                    Object.keys(recipeDetails.authenticIngredients || {}).join(', ')}
                  placeholder="Enter ingredients separated by commas"
                  rows={6}
                />
                <p className="text-sm text-muted-foreground">
                  Enter ingredients separated by commas. For example:
                  {'\nrice, ginger, soy sauce, sesame oil'}
                </p>
              </div>
              <Button type="submit" className="w-full">
                {hasIngredients ? 'Save Ingredients' : 'Add Ingredients'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Cultural Notes Dialog */}
        <Dialog open={isEditingNotes} onOpenChange={setIsEditingNotes}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{hasNotes ? 'Edit Cultural Notes' : 'Add Cultural Notes'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const culturalNotes: CulturalNotes = {};
              const sections = ['history', 'significance', 'serving', 'variations'];
              
              sections.forEach(section => {
                const content = formData.get(`note_${section}`) as string;
                if (content?.trim()) {
                  culturalNotes[section] = content.trim();
                }
              });
              
              handleUpdateRecipe({ culturalNotes });
              setIsEditingNotes(false);
            }} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Historical Context</label>
                  <Textarea 
                    name="note_history"
                    defaultValue={recipeDetails.culturalNotes?.history || ''}
                    placeholder="Historical background of the dish"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cultural Significance</label>
                  <Textarea 
                    name="note_significance"
                    defaultValue={recipeDetails.culturalNotes?.significance || ''}
                    placeholder="Cultural importance and meaning"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Serving Traditions</label>
                  <Textarea 
                    name="note_serving"
                    defaultValue={recipeDetails.culturalNotes?.serving || ''}
                    placeholder="Traditional serving methods"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Regional Variations</label>
                  <Textarea 
                    name="note_variations"
                    defaultValue={recipeDetails.culturalNotes?.variations || ''}
                    placeholder="Different variations across regions"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                {hasNotes ? 'Save Cultural Notes' : 'Add Cultural Notes'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Substitution Dialog */}
        <Dialog open={isAddingSubstitutions} onOpenChange={setIsAddingSubstitutions}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Ingredient Substitution</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const substitution = {
                original: formData.get('original') as string,
                substitute: formData.get('substitute') as string,
                notes: formData.get('notes') as string,
                flavorImpact: formData.get('flavorImpact') as 'minimal' | 'moderate' | 'significant'
              };
              handleAddSubstitution(substitution);
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Original Ingredient</label>
                <Input name="original" placeholder="Original ingredient" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Substitute</label>
                <Input name="substitute" placeholder="Substitute ingredient" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea name="notes" placeholder="Usage notes and tips" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Flavor Impact</label>
                <select name="flavorImpact" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" required>
                  <option value="minimal">Minimal</option>
                  <option value="moderate">Moderate</option>
                  <option value="significant">Significant</option>
                </select>
              </div>
              <Button type="submit" className="w-full">Add Substitution</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}