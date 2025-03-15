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
  Star, UtensilsCrossed, Map, Scroll, ArrowRight, Info, Globe2, Wine, Palette, ListOrdered, Ban, MapPin 
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
  const [etiquette, setEtiquette] = useState<Etiquette>({ presentation: [], customs: [], taboos: [], servingOrder: [] });
  const [authenticityAnalysis, setAuthenticityAnalysis] = useState<RecipeAuthenticityAnalysis | null>(null);
  const [techniqueTips, setTechniqueTips] = useState<TechniqueTip[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [isEditingIngredients, setIsEditingIngredients] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  
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
      console.log('Fetching substitutions for:', recipe.name);
      const data = await getSubstitutions(recipe, [], cuisine.region);
      console.log('Substitutions response:', data);
      
      if (data && data.substitutions) {
        setSubstitutions(data.substitutions);
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
      console.log('Fetching pairings for:', recipe.name);
      const data = await getPairings(recipe, cuisine);
      console.log('Pairings response:', data);
      
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
    } finally {
      setLoading(false);
    }
  };

  const fetchEtiquette = async () => {
    if (!recipe || !cuisine) return;
    setLoading(true);
    try {
      console.log('Fetching etiquette for:', recipe.name);
      const data = await getEtiquette(recipe, cuisine);
      console.log('Etiquette response:', data);
      
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
      // Keep the existing etiquette state instead of setting to null
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthenticityAnalysis = async () => {
    if (!recipe) return;
    setIsAnalyzing(true);
    try {
      console.log('Analyzing authenticity for:', recipe.name);
      // Convert ingredient substitutions to array format expected by getRecipeAuthenticityScore
      const substitutionsArray = substitutions.map(s => ({
        original: s.original,
        substitute: s.substitute,
        flavorImpact: s.flavorImpact
      }));
      const analysis = await getRecipeAuthenticityScore(recipe, substitutionsArray);
      console.log('Authenticity analysis response:', analysis);
      
      setAuthenticityAnalysis(analysis);
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
      // Convert arrays to objects with numbered keys if present
      const formattedData = {
        ...updatedData,
        instructions: Array.isArray(updatedData.instructions) 
          ? Object.fromEntries(updatedData.instructions.map((inst, i) => [i.toString(), inst]))
          : updatedData.instructions,
        authenticIngredients: Array.isArray(updatedData.authenticIngredients)
          ? Object.fromEntries(updatedData.authenticIngredients.map((ing, i) => [i.toString(), ing]))
          : updatedData.authenticIngredients,
      };

      const response = await fetch(`/api/cultural-recipes/${recipe.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
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
        <div className="space-y-4">
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

          {/* Main content */}
          <div className="grid gap-2">
            {/* Recipe Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">{recipe.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">{recipe.description}</p>
                <Badge variant={
                  recipe.difficulty === 'beginner' ? 'default' :
                  recipe.difficulty === 'intermediate' ? 'secondary' : 'destructive'
                }>
                  {recipe.difficulty}
                </Badge>
              </CardContent>
            </Card>

            {/* Location/Region Badge */}
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <MapPin className="h-4 w-4 text-white/90" />
              <span className="text-sm font-medium text-white/90">{cuisine.region}</span>
            </div>
            
            {/* Recipe Image */}
            <div 
              className="h-64 w-full bg-cover bg-center rounded-lg shadow-md"
              style={{ 
                backgroundImage: `url(https://source.unsplash.com/1200x800/?${encodeURIComponent(recipe.name.toLowerCase())})`,
                backgroundSize: 'cover'
              }}
            />
            
            {/* Tabs Content */}
            <div className="mt-2">
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
                  <div className="space-y-4 mt-2">
                    {/* Authentic Ingredients Section */}
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

                    {/* Substitutions Section */}
                    <Card className="overflow-hidden">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-muted/50 border-b">
                        <div>
                          <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-primary" />
                            Ingredient Substitutions
                          </CardTitle>
                          <CardDescription>Alternative ingredients and their impact</CardDescription>
                        </div>
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
                      </CardHeader>
                      <CardContent className="p-6">
                        {substitutions.length > 0 ? (
                          <div className="grid gap-4 md:grid-cols-2">
                            {substitutions.map((sub, index) => (
                              <div key={index} 
                                className="group p-4 rounded-lg border bg-card hover:shadow-md transition-all duration-200"
                              >
                                <div className="flex flex-wrap gap-4 items-start justify-between">
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                        {sub.original}
                                      </Badge>
                                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                      <Badge variant="outline" className="font-normal">
                                        {sub.substitute}
                                      </Badge>
                                    </div>
                                    <div className="pl-4 border-l-2 border-primary/20">
                                      <div className="flex items-start gap-2">
                                        <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <p className="text-sm text-muted-foreground">{sub.notes}</p>
                                      </div>
                                    </div>
                                  </div>
                                  <Badge variant={
                                    sub.flavorImpact === 'minimal' ? 'outline' :
                                    sub.flavorImpact === 'moderate' ? 'secondary' : 
                                    'destructive'
                                  } className="transition-all duration-200 group-hover:scale-105">
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
                              </div>
                            ))}
                          </div>
                        ) : !loading ? (
                          <div className="text-center py-8">
                            <div className="rounded-full bg-primary/10 p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                              <ArrowRight className="h-6 w-6 text-primary" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              No substitutions added yet
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Click "Show Substitutions" to discover ingredient alternatives
                            </p>
                          </div>
                        ) : (
                          <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        )}
                        {!user && (
                          <div className="mt-6 pt-6 border-t text-center">
                            <p className="text-sm text-muted-foreground">
                              Sign in to view personalized substitutions based on your pantry
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Authenticity Analysis Card */}
                    <Card className="overflow-hidden">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-muted/50 border-b">
                        <div>
                          <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <History className="h-4 w-4 text-primary" />
                            Cultural Authenticity
                          </CardTitle>
                          <CardDescription>Traditional authenticity analysis</CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={fetchAuthenticityAnalysis}
                          disabled={isAnalyzing}
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Brain className="mr-2 h-4 w-4" />
                              Analyze Authenticity
                            </>
                          )}
                        </Button>
                      </CardHeader>
                      <CardContent className="p-6">
                        {authenticityAnalysis ? (
                          <div className="space-y-6">
                            {/* Authenticity Score */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium">Authenticity Score</h4>
                                <span className="text-2xl font-bold text-primary">
                                  {authenticityAnalysis?.authenticityScore || 0}%
                                </span>
                              </div>
                              <Progress 
                                value={authenticityAnalysis?.authenticityScore || 0}
                                max={100}
                                className="h-2"
                              />
                            </div>

                            {/* Traditional Elements */}
                            {authenticityAnalysis.traditionalElements?.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                  <Star className="h-4 w-4 text-amber-500" />
                                  Traditional Elements
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {authenticityAnalysis.traditionalElements.map((element, i) => (
                                    <Badge key={i} variant="outline" className="bg-card">
                                      {element}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Modern Adaptations */}
                            {authenticityAnalysis.modernAdaptations?.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-blue-500" />
                                  Modern Adaptations
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {authenticityAnalysis.modernAdaptations.map((adaptation, i) => (
                                    <Badge key={i} variant="secondary">
                                      {adaptation}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Cultural Accuracy */}
                            {authenticityAnalysis.culturalAccuracy && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                  <Globe2 className="h-4 w-4 text-emerald-500" />
                                  Cultural Accuracy
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {authenticityAnalysis.culturalAccuracy}
                                </p>
                              </div>
                            )}

                            {/* Improvement Suggestions */}
                            {authenticityAnalysis.suggestions?.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                  <Info className="h-4 w-4 text-blue-500" />
                                  Suggestions for Improvement
                                </h4>
                                <ul className="space-y-2">
                                  {authenticityAnalysis.suggestions.map((suggestion, i) => (
                                    <li key={i} className="text-sm flex items-start gap-2">
                                      <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5" />
                                      <span>{suggestion}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="rounded-full bg-primary/10 p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                              <History className="h-6 w-6 text-primary" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Click "Analyze Authenticity" to assess this recipe's cultural authenticity
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Complementary Dishes Card */}
                    <Card className="overflow-hidden">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-muted/50 border-b">
                        <div>
                          <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <UtensilsCrossed className="h-4 w-4 text-primary" />
                            Complementary Dishes
                          </CardTitle>
                          <CardDescription>Traditional pairings and accompaniments</CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={fetchPairings}
                          disabled={loading}
                          className="ml-2"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Show Pairings
                            </>
                          )}
                        </Button>
                      </CardHeader>
                      <CardContent className="p-6">
                        {pairings ? (
                          <div className="grid gap-6 md:grid-cols-2">
                            {pairings.mainDishes.length > 0 && (
                              <div className="space-y-3 p-4 rounded-lg border bg-card">
                                <h4 className="font-medium text-sm flex items-center gap-2">
                                  <ChefHat className="h-4 w-4 text-primary" />
                                  Main Dishes
                                </h4>
                                <ul className="space-y-2">
                                  {pairings.mainDishes.map((dish, i) => (
                                    <li key={i} className="text-sm flex items-start gap-2">
                                      <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5" />
                                      <span>{dish}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {pairings.sideDishes.length > 0 && (
                              <div className="space-y-3 p-4 rounded-lg border bg-card">
                                <h4 className="font-medium text-sm flex items-center gap-2">
                                  <UtensilsCrossed className="h-4 w-4 text-emerald-500" />
                                  Side Dishes
                                </h4>
                                <ul className="space-y-2">
                                  {pairings.sideDishes.map((dish, i) => (
                                    <li key={i} className="text-sm flex items-start gap-2">
                                      <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5" />
                                      <span>{dish}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {pairings.desserts.length > 0 && (
                              <div className="space-y-3 p-4 rounded-lg border bg-card">
                                <h4 className="font-medium text-sm flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-amber-500" />
                                  Desserts
                                </h4>
                                <ul className="space-y-2">
                                  {pairings.desserts.map((dish, i) => (
                                    <li key={i} className="text-sm flex items-start gap-2">
                                      <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5" />
                                      <span>{dish}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {pairings.beverages.length > 0 && (
                              <div className="space-y-3 p-4 rounded-lg border bg-card">
                                <h4 className="font-medium text-sm flex items-center gap-2">
                                  <Wine className="h-4 w-4 text-indigo-500" />
                                  Beverages
                                </h4>
                                <ul className="space-y-2">
                                  {pairings.beverages.map((beverage, i) => (
                                    <li key={i} className="text-sm flex items-start gap-2">
                                      <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5" />
                                      <span>{beverage}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="rounded-full bg-primary/10 p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                              <UtensilsCrossed className="h-6 w-6 text-primary" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Click "Show Pairings" to discover traditional dish combinations
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Serving Etiquette Card */}
                    <Card className="overflow-hidden">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-muted/50 border-b">
                        <div>
                          <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Globe2 className="h-4 w-4 text-primary" />
                            Serving Etiquette
                          </CardTitle>
                          <CardDescription>Cultural dining customs and traditions</CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={fetchEtiquette}
                          disabled={loading}
                          className="ml-2"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : etiquette && 
                              etiquette.presentation?.length > 0 || 
                              etiquette.customs?.length > 0 || 
                              etiquette.taboos?.length > 0 || 
                              etiquette.servingOrder?.length > 0 ? (
                            <>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Etiquette
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Add Etiquette
                            </>
                          )}
                        </Button>
                      </CardHeader>
                      <CardContent className="p-6">
                        {etiquette ? (
                          <div className="grid gap-6 md:grid-cols-2">
                            {etiquette.taboos.length > 0 && (
                              <div className="space-y-3 p-4 rounded-lg border">
                                <h4 className="font-medium text-sm flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-red-600" />
                                  Cultural Taboos
                                </h4>
                                <ul className="space-y-2">
                                  {etiquette.taboos.map((taboo, i) => (
                                    <li key={i} className="text-sm flex items-start gap-2 p-3 rounded-md hover:bg-muted/60 transition-colors">
                                      <Ban className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                                      <span>{taboo}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {etiquette.customs.length > 0 && (
                              <div className="space-y-3 p-4 rounded-lg border">
                                <h4 className="font-medium text-sm flex items-center gap-2">
                                  <Scroll className="h-4 w-4 text-amber-600" />
                                  Traditional Customs
                                </h4>
                                <ul className="space-y-2">
                                  {etiquette.customs.map((custom, i) => (
                                    <li key={i} className="text-sm flex items-start gap-2 p-3 rounded-md hover:bg-muted/60 transition-colors">
                                      <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                      <span>{custom}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {etiquette.presentation.length > 0 && (
                              <div className="space-y-3 p-4 rounded-lg border">
                                <h4 className="font-medium text-sm flex items-center gap-2">
                                  <Palette className="h-4 w-4 text-emerald-600" />
                                  Table Setting & Presentation
                                </h4>
                                <ul className="space-y-2">
                                  {etiquette.presentation.map((tip, i) => (
                                    <li key={i} className="text-sm flex items-start gap-2 p-3 rounded-md hover:bg-muted/60 transition-colors">
                                      <ChefHat className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                      <span>{tip}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {etiquette.servingOrder.length > 0 && (
                              <div className="space-y-3 p-4 rounded-lg border">
                                <h4 className="font-medium text-sm flex items-center gap-2">
                                  <ListOrdered className="h-4 w-4 text-blue-600" />
                                  Serving Order
                                </h4>
                                <ul className="space-y-2">
                                  {etiquette.servingOrder.map((step, i) => (
                                    <li key={i} className="text-sm flex items-start gap-2 p-3 rounded-md hover:bg-muted/60 transition-colors">
                                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{i + 1}</span>
                                      </div>
                                      <span>{step}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="rounded-full bg-primary/10 p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                              <Globe2 className="h-6 w-6 text-primary" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Click "Add Etiquette" to add cultural dining customs
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* Cultural Notes Tab Content */}
                <TabsContent value="cultural-notes">
                  <div className="space-y-4 mt-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Globe2 className="h-5 w-5 text-primary" />
                        Cultural Context
                      </h3>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsEditingNotes(true)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {recipe.culturalNotes && Object.keys(recipe.culturalNotes).length > 0 
                          ? 'Edit Cultural Context' 
                          : 'Add Cultural Context'}
                      </Button>
                    </div>
                    {recipe.culturalNotes && Object.entries(recipe.culturalNotes as Record<string, string>).length > 0 ? (
                      <div className="grid gap-6">
                        {Object.entries(recipe.culturalNotes as Record<string, string>).map(([title, note], i) => {
                          // Determine appropriate icon and styles based on context type
                          const getIconAndStyles = (type: string) => {
                            switch(type) {
                              case 'history':
                                return {
                                  icon: <History className="h-5 w-5 text-blue-600" />,
                                  textClass: "text-blue-700 dark:text-blue-300",
                                  badge: "Historical Background",
                                  badgeClass: "bg-blue-100/80 dark:bg-blue-900/80 text-blue-700 dark:text-blue-300"
                                };
                              case 'significance': 
                                return {
                                  icon: <Star className="h-5 w-5 text-amber-600" />,
                                  textClass: "text-amber-700 dark:text-amber-300",
                                  badge: "Cultural Heritage",
                                  badgeClass: "bg-amber-100/80 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300"
                                };
                              case 'serving':
                                return {
                                  icon: <UtensilsCrossed className="h-5 w-5 text-emerald-600" />,
                                  textClass: "text-emerald-700 dark:text-emerald-300",
                                  badge: "Traditional Method",
                                  badgeClass: "bg-emerald-100/80 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300"
                                };
                              case 'variations':
                              default:
                                return {
                                  icon: <Map className="h-5 w-5 text-purple-600" />,
                                  textClass: "text-purple-700 dark:text-purple-300",
                                  badge: "Regional Styles",
                                  badgeClass: "bg-purple-100/80 dark:bg-purple-900/80 text-purple-700 dark:text-purple-300"
                                };
                            }
                          };

                          const { icon, textClass, badge, badgeClass } = getIconAndStyles(title);
                          
                          // Format note into bullet points if it contains periods or commas
                          const formatNote = (noteText: string) => {
                            if (noteText.includes('.') && noteText.split('.').length > 2) {
                              return noteText.split('.').filter(item => item.trim().length > 0);
                            }
                            if (noteText.includes(',') && noteText.split(',').length > 3) {
                              return noteText.split(',').filter(item => item.trim().length > 0);
                            }
                            return [];
                          };
                          
                          const bulletPoints = formatNote(note);
                          const hasBullets = bulletPoints.length > 0;
                          
                          return (
                            <Card key={i} className="relative overflow-hidden group hover:shadow-md transition-all duration-200">
                              <CardHeader className="border-b">
                                <CardTitle className="capitalize flex items-center gap-2 text-base">
                                  {icon}
                                  <span className={textClass}>
                                    {title.replace(/_/g, ' ')}
                                  </span>
                                  <Badge variant="secondary" className={`ml-auto ${badgeClass}`}>{badge}</Badge>
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="relative p-6">
                                <div className="relative z-10">
                                  <div className={`pl-4 border-l-2 border-${title === 'history' ? 'blue' : title === 'significance' ? 'amber' : title === 'serving' ? 'emerald' : 'purple'}-400 dark:border-${title === 'history' ? 'blue' : title === 'significance' ? 'amber' : title === 'serving' ? 'emerald' : 'purple'}-600`}>
                                    {hasBullets ? (
                                      <ul className="space-y-2 list-none">
                                        {bulletPoints.map((point, idx) => (
                                          <li key={idx} className="flex items-start gap-2">
                                            <div className={`h-5 w-5 rounded-full flex-shrink-0 flex items-center justify-center bg-${title === 'history' ? 'blue' : title === 'significance' ? 'amber' : title === 'serving' ? 'emerald' : 'purple'}-100 dark:bg-${title === 'history' ? 'blue' : title === 'significance' ? 'amber' : title === 'serving' ? 'emerald' : 'purple'}-900`}>
                                              <span className={`text-xs font-medium ${textClass}`}>{idx + 1}</span>
                                            </div>
                                            <span className={`text-muted-foreground ${textClass}`}>{point}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="leading-relaxed text-muted-foreground">{note}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="absolute top-0 right-0 w-40 h-40 opacity-[0.03] pointer-events-none transform translate-x-8 -translate-y-8 transition-transform duration-300 group-hover:translate-x-4 group-hover:-translate-y-4">
                                  {icon}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <Card className="bg-muted/50">
                        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                          <div className="rounded-full bg-primary/10 p-4 mb-4">
                            <Scroll className="h-8 w-8 text-primary opacity-50" />
                          </div>
                          <p className="text-sm text-muted-foreground">No cultural notes have been added yet.</p>
                          <p className="text-xs text-muted-foreground mt-2">Click 'Add Cultural Context' to share cultural context about this recipe.</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
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
              <DialogTitle>
                {hasIngredients ? 'Edit Authentic Ingredients' : 'Add Authentic Ingredients'}
              </DialogTitle>
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
      </div>
    </TooltipProvider>
  );
}