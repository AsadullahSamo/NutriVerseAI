import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { ChefHat, Book, Trophy, TrendingUp, Loader2, ArrowUpRight } from "lucide-react";
import type { CookingSkillLevel, Recipe } from "@shared/schema";

export function SkillProgressionLayout() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showLearningPathDialog, setShowLearningPathDialog] = React.useState(false);
  const [selectedRecipe, setSelectedRecipe] = React.useState<Recipe | null>(null);

  const { data: skillLevel, isLoading: isLoadingSkills, error: skillError, refetch: refetchSkills } = useQuery({
    queryKey: ["cookingSkills"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/cooking-skills");
        const data = await response.json();
        console.log('Cooking skills API response:', data);
        return data;
      } catch (error) {
        console.error('Error in cooking skills API:', error);
        throw error;
      }
    },
    enabled: !!user,
    retry: 2,
    onError: (error) => {
      console.error('Error fetching cooking skills:', error);
      toast({
        title: "Error loading cooking skills",
        description: "Please try again",
        variant: "destructive",
      });
    }
  });

  const { data: insights, isLoading: isLoadingInsights } = useQuery({
    queryKey: ["skillInsights"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/cooking-skills/insights");
      return response.json();
    },
    enabled: !!skillLevel,
  });

  const assessRecipeMutation = useMutation({
    mutationFn: async (recipeId: number) => {
      const response = await apiRequest(
        "POST", 
        `/api/cooking-skills/assess/${recipeId}`
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cookingSkills"] });
      toast({
        title: "Skills Updated!",
        description: "Your cooking skills have been assessed and updated.",
      });
    },
  });

  const generateLearningPathMutation = useMutation({
    mutationFn: async (data: { goals: string[]; preferredCuisines?: string[] }) => {
      const response = await apiRequest(
        "POST",
        "/api/cooking-skills/learning-path",
        data
      );
      return response.json();
    },
  });

  const defaultLearningPath = {
    path: [
      {
        stage: 1,
        focus: "Mastering the Basics",
        techniques: [
          "Knife Skills - Proper chopping and dicing",
          "Understanding cooking temperatures",
          "Basic seasoning techniques"
        ],
        suggestedRecipes: [
          { recipeId: 1, difficulty: "beginner" },
          { recipeId: 2, difficulty: "beginner" }
        ],
        estimatedTimeToMaster: "2-3 weeks"
      },
      {
        stage: 2,
        focus: "Intermediate Cooking Methods",
        techniques: [
          "Sautéing and pan-frying",
          "Basic sauce preparation",
          "Cooking meat to proper temperature"
        ],
        suggestedRecipes: [
          { recipeId: 3, difficulty: "intermediate" },
          { recipeId: 4, difficulty: "intermediate" }
        ],
        estimatedTimeToMaster: "3-4 weeks"
      },
      {
        stage: 3,
        focus: "Advanced Techniques",
        techniques: [
          "Complex flavor combinations",
          "Advanced baking methods",
          "Menu planning and timing"
        ],
        suggestedRecipes: [
          { recipeId: 5, difficulty: "advanced" },
          { recipeId: 6, difficulty: "advanced" }
        ],
        estimatedTimeToMaster: "4-6 weeks"
      }
    ],
    tips: [
      "Practice regularly to build muscle memory",
      "Don't be afraid to make mistakes",
      "Learn to taste as you cook and adjust seasonings"
    ]
  };

  if (isLoadingSkills) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-[200px]">
        <div className="flex flex-col items-center gap-4">
          <ChefHat className="w-8 h-8 animate-bounce" />
          <p>Loading your cooking skills...</p>
        </div>
      </div>
    );
  }

  if (skillError) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <ChefHat className="w-12 h-12 text-muted-foreground" />
            <p className="text-muted-foreground">Could not load skill level.</p>
            <Button onClick={() => refetchSkills()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!skillLevel) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <ChefHat className="w-12 h-12 text-muted-foreground" />
            <p>Welcome to Cooking Skills! Let's start tracking your progress.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const skillAreas = Object.entries(skillLevel.skillAreas).map(([name, data]) => ({
    name,
    ...data,
  }));

  const handleGenerateLearningPath = async () => {
    try {
      setShowLearningPathDialog(true);
      
      const result = await generateLearningPathMutation.mutateAsync({
        goals: ["master_basics", "improve_techniques", "explore_cuisines"],
        preferredCuisines: user?.preferences?.cuisines || ["italian", "asian", "mediterranean"],
      });
      
      console.log("Learning path generated:", result);
      
      if (!result || !result.path || result.path.length === 0) {
        console.warn("Empty learning path returned, using default");
      }
    } catch (error) {
      console.error("Failed to generate learning path:", error);
      toast({
        title: "Error",
        description: "Failed to generate learning path. Using default recommendations instead.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Cooking Skill Progression</h2>
        <Button onClick={handleGenerateLearningPath}>
          <Book className="w-4 h-4 mr-2" />
          Generate Learning Path
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ChefHat className="w-6 h-6 mr-2" />
              Overall Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-4">Level {skillLevel.overallLevel}</div>
            <div className="space-y-4">
              {skillAreas.map((skill) => (
                <div key={skill.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{skill.name}</span>
                    <span className="text-muted-foreground">
                      Level {skill.level}
                    </span>
                  </div>
                  <Progress
                    value={(skill.experience % 100)}
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="w-6 h-6 mr-2" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights?.recommendedSkills?.map((skill: string) => (
                <div key={skill} className="flex items-center p-2 rounded-lg bg-muted">
                  <TrendingUp className="w-4 h-4 mr-2 text-primary" />
                  {skill}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {insights && (
        <Card>
          <CardHeader>
            <CardTitle>Progress Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {typeof insights.insights === 'string' 
                ? insights.insights 
                : 'Your cooking skills are improving. Keep cooking to see more detailed insights.'}
            </p>
            {insights.suggestedRecipes?.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Suggested Recipes</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {insights.suggestedRecipes.map((suggestion) => (
                    <Card key={suggestion.recipeId}>
                      <CardContent className="p-4">
                        <p>{suggestion.reason}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showLearningPathDialog} onOpenChange={setShowLearningPathDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Your Personalized Learning Path</DialogTitle>
          </DialogHeader>

          {generateLearningPathMutation.isPending ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Generating your personalized learning path...</p>
            </div>
          ) : generateLearningPathMutation.isError ? (
            <ScrollArea className="h-[60vh]">
              <div className="py-8 space-y-4">
                <p>Sorry, we couldn't generate a custom learning path at this time.</p>
                <p className="text-muted-foreground">Here are some general recommendations to improve your cooking skills:</p>
                <div className="space-y-6 mt-4">
                  {defaultLearningPath.path.map((stage) => (
                    <Card key={stage.stage}>
                      <CardHeader>
                        <CardTitle>Stage {stage.stage}: {stage.focus}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Key Techniques:</h4>
                            <ul className="list-disc list-inside">
                              {stage.techniques.map((technique) => (
                                <li key={technique}>{technique}</li>
                              ))}
                            </ul>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Estimated time to master: {stage.estimatedTimeToMaster}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </ScrollArea>
          ) : (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                {(generateLearningPathMutation.data?.path || defaultLearningPath.path).map((stage) => (
                  <Card key={stage.stage}>
                    <CardHeader>
                      <CardTitle>Stage {stage.stage}: {stage.focus}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Key Techniques:</h4>
                          <ul className="list-disc list-inside">
                            {stage.techniques.map((technique) => (
                              <li key={technique}>{technique}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Suggested Recipes:</h4>
                          <div className="grid gap-2">
                            {stage.suggestedRecipes.map((recipe) => (
                              <div
                                key={recipe.recipeId}
                                className="flex justify-between items-center p-2 bg-muted rounded"
                              >
                                <span>Recipe #{recipe.recipeId}</span>
                                <span className="text-sm text-muted-foreground">
                                  {recipe.difficulty}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Estimated time to master: {stage.estimatedTimeToMaster}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {generateLearningPathMutation.data?.tips && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Tips for Success:</h4>
                    <ul className="list-disc list-inside">
                      {generateLearningPathMutation.data.tips.map((tip, index) => (
                        <li key={index} className="text-muted-foreground">{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
          
          <DialogFooter>
            <Button 
              onClick={() => setShowLearningPathDialog(false)}
              className="w-full mt-4"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}