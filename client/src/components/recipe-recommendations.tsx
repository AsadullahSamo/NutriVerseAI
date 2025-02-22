import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { getRecipeRecommendations, analyzeNutritionalValue } from "../../../ai-services/recipe-ai";
import { useToast } from "../hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Loader2 } from "lucide-react";

// Add delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function RecipeRecommendations() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState("");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const addIngredient = () => {
    if (currentIngredient.trim()) {
      setIngredients(prev => [...prev, currentIngredient.trim()]);
      setCurrentIngredient("");
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const getRecommendations = async () => {
    if (ingredients.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one ingredient",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setRecommendations([]);

    try {
      // Add a small delay before making the API call
      await delay(500);
      
      console.log('Fetching recommendations for:', ingredients);
      const recipes = await getRecipeRecommendations(ingredients);
      console.log('Received recipes:', recipes);
      
      if (!Array.isArray(recipes) || recipes.length === 0) {
        throw new Error('No recipes found for these ingredients');
      }
      
      setRecommendations(recipes);
      toast({
        title: "Success",
        description: `Generated ${recipes.length} recipe recommendations!`,
      });
    } catch (error) {
      console.error('Recipe recommendation error:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to generate recipes. Please try again with different ingredients.';
      
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">AI Recipe Recommendations</h2>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Input
          value={currentIngredient}
          onChange={(e) => setCurrentIngredient(e.target.value)}
          placeholder="Enter an ingredient"
          onKeyDown={(e) => e.key === "Enter" && addIngredient()}
          disabled={isLoading}
        />
        <Button onClick={addIngredient} disabled={isLoading}>Add</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {ingredients.map((ingredient, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="cursor-pointer"
            onClick={() => removeIngredient(index)}
          >
            {ingredient} ×
          </Badge>
        ))}
      </div>

      <Button 
        onClick={getRecommendations} 
        disabled={isLoading || ingredients.length === 0}
        className="w-full relative"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Recipes...
          </>
        ) : (
          "Get Recipe Recommendations"
        )}
      </Button>

      <div className="grid gap-4 mt-4">
        {recommendations.map((recipe, index) => (
          <Card key={index} className="p-4">
            <h3 className="text-xl font-semibold mb-2">{recipe.title}</h3>
            <Separator className="my-2" />
            <div className="space-y-2">
              <h4 className="font-medium">Ingredients:</h4>
              <ul className="list-disc pl-4">
                {recipe.ingredients?.map((ing: string, i: number) => (
                  <li key={i}>{ing}</li>
                )) ?? <li>No ingredients listed</li>}
              </ul>
              <h4 className="font-medium">Instructions:</h4>
              <ol className="list-decimal pl-4">
                {recipe.instructions?.map((step: string, i: number) => (
                  <li key={i}>{step}</li>
                )) ?? <li>No instructions provided</li>}
              </ol>
              <h4 className="font-medium">Nutritional Value:</h4>
              <p>{recipe.nutritionalValue || 'Nutritional information not available'}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}