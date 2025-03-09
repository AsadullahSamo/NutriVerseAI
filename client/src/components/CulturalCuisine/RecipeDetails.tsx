import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Info, ChevronRight, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { CulturalCuisine, CulturalRecipe } from "@shared/schema";

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

export function RecipeDetails({ recipe, cuisine, onBack }: RecipeDetailsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [substitutions, setSubstitutions] = useState<IngredientSubstitution[]>([]);
  const [authenticityScore, setAuthenticityScore] = useState<{ score: number; feedback: string[] }>({ score: 100, feedback: [] });
  const [loading, setLoading] = useState<boolean>(false);
  const [pairings, setPairings] = useState<Pairings | null>(null);
  const [etiquette, setEtiquette] = useState<Etiquette | null>(null);
  
  useEffect(() => {
    if (user) {
      fetchSubstitutions();
    }
  }, [user, recipe.id]);
  
  const fetchSubstitutions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cultural-recipes/${recipe.id}/substitutions`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch substitutions');
      }
      
      const data = await response.json();
      setSubstitutions(data.substitutions);
      setAuthenticityScore({
        score: data.authenticityScore,
        feedback: data.authenticityFeedback
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not load ingredient substitutions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPairings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cultural-recipes/${recipe.id}/pairings`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch pairings');
      }
      
      const data = await response.json();
      setPairings(data);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not load complementary dishes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEtiquette = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cultural-recipes/${recipe.id}/etiquette`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch etiquette guide');
      }
      
      const data = await response.json();
      setEtiquette(data);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not load serving etiquette",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onBack}
        className="absolute top-0 left-0 flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {cuisine.name} Cuisine
      </Button>

      <div className="mt-12">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">{recipe.name}</h1>
            {recipe.localName && (
              <p className="text-lg text-muted-foreground italic">{recipe.localName}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge>{recipe.difficulty}</Badge>
            </div>
          </div>
        </div>

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
                <h3 className="text-lg font-semibold mt-2">Steps</h3>
                <ol className="space-y-4">
                  {Array.isArray(recipe.instructions) ? (
                    recipe.instructions.map((step, i) => (
                      <li key={i} className="flex gap-4 items-start">
                        <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <div>{step}</div>
                      </li>
                    ))
                  ) : typeof recipe.instructions === 'object' ? (
                    Object.values(recipe.instructions).map((step, i) => (
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
                  <h3 className="text-lg font-semibold">Authentic Ingredients</h3>
                  <ul className="space-y-2">
                    {Array.isArray(recipe.authenticIngredients) ? (
                      recipe.authenticIngredients.map((ingredient, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <ChevronRight className="h-4 w-4 text-primary" />
                          <span>{ingredient}</span>
                          {substitutions.some(s => s.original === ingredient) && (
                            <Badge variant="outline" className="ml-auto">Has substitution</Badge>
                          )}
                        </li>
                      ))
                    ) : typeof recipe.authenticIngredients === 'object' ? (
                      Object.entries(recipe.authenticIngredients).map(([name, quantity], i) => (
                        <li key={i} className="flex items-center gap-2">
                          <ChevronRight className="h-4 w-4 text-primary" />
                          <span>{name}: {quantity}</span>
                          {substitutions.some(s => s.original === name) && (
                            <Badge variant="outline" className="ml-auto">Has substitution</Badge>
                          )}
                        </li>
                      ))
                    ) : null}
                  </ul>
                  
                  {recipe.localSubstitutes && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold">Local Substitutes</h3>
                      <ul className="space-y-2">
                        {Array.isArray(recipe.localSubstitutes) ? (
                          recipe.localSubstitutes.map((substitute, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <ChevronRight className="h-4 w-4 text-primary" />
                              <span>{substitute}</span>
                            </li>
                          ))
                        ) : typeof recipe.localSubstitutes === 'object' ? (
                          Object.entries(recipe.localSubstitutes).map(([original, substitute], i) => (
                            <li key={i} className="flex items-center gap-2 justify-between">
                              <div>
                                <ChevronRight className="h-4 w-4 text-primary inline mr-1" />
                                <span>{original}:</span>
                              </div>
                              <span className="text-muted-foreground">{substitute}</span>
                            </li>
                          ))
                        ) : null}
                      </ul>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="cultural-notes">
                <div className="space-y-4 mt-2">
                  {typeof recipe.culturalNotes === 'object' ? (
                    Object.entries(recipe.culturalNotes).map(([title, note], i) => (
                      <div key={i}>
                        <h3 className="text-lg font-semibold mb-2 capitalize">{title.replace(/_/g, ' ')}</h3>
                        <p>{note}</p>
                      </div>
                    ))
                  ) : (
                    <p>{recipe.culturalNotes}</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="md:col-span-4 space-y-6">
            {/* Authenticity Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-4 w-4" /> 
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
            
            {/* Ingredient Substitutions */}
            <Card>
              <CardHeader>
                <CardTitle>Ingredient Substitutions</CardTitle>
              </CardHeader>
              <CardContent>
                {substitutions.length > 0 ? (
                  <div className="space-y-4">
                    {substitutions.map((sub, index) => (
                      <div key={index} className="border-b pb-3 last:border-0 last:pb-0">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{sub.original}</span>
                          <span className="font-medium">→</span>
                          <span className="font-medium">{sub.substitute}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{sub.notes}</p>
                        <div className="mt-1">
                          <Badge variant={
                            sub.flavorImpact === 'minimal' ? 'outline' : 
                            sub.flavorImpact === 'moderate' ? 'secondary' : 'destructive'
                          } className="text-xs">
                            {sub.flavorImpact} impact
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    {loading ? 'Loading substitutions...' : 'No substitutions available'}
                  </div>
                )}
                {!user && (
                  <div className="text-center mt-4 text-sm">
                    <p>Sign in to view personalized substitutions based on your pantry</p>
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
  );
}