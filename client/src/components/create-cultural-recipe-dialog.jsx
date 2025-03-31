import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateCulturalRecipeDetails } from "@/lib/generateCulturalRecipeDetails";
export function CreateCulturalRecipeDialog({ open, onOpenChange, onSuccess, cuisine }) {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            authenticIngredients: [],
            instructions: [],
            culturalNotes: {
                history: "",
                significance: "",
                variations: ""
            },
            servingSuggestions: [],
            difficulty: "intermediate",
            localSubstitutes: {
                ingredient: "",
                notes: ""
            }
        }
    });
    const generateAIDetails = async () => {
        const name = form.getValues("name");
        if (!name) {
            toast({
                title: "Missing Information",
                description: "Please enter a recipe name to generate details.",
                variant: "destructive"
            });
            return;
        }
        setIsGenerating(true);
        try {
            const details = await generateCulturalRecipeDetails(name, cuisine);
            form.setValue("description", details.description);
            form.setValue("authenticIngredients", details.authenticIngredients.join('\n'));
            form.setValue("instructions", details.instructions.join('\n'));
            form.setValue("culturalNotes", details.culturalNotes);
            form.setValue("servingSuggestions", details.servingSuggestions);
            form.setValue("difficulty", details.difficulty);
            form.setValue("localSubstitutes", details.localSubstitutes);
            toast({
                title: "Details Generated",
                description: "AI has generated cultural recipe details. Please review and manually enter an image URL that best represents this dish.",
            });
        }
        catch (error) {
            toast({
                title: "Generation Failed",
                description: "Failed to generate details. Please try again.",
                variant: "destructive"
            });
        }
        finally {
            setIsGenerating(false);
        }
    };
    const onSubmit = async (data) => {
        try {
            const response = await fetch("/api/cultural-recipes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(Object.assign(Object.assign({}, data), { authenticIngredients: data.authenticIngredients.split('\n').map(i => i.trim()).filter(Boolean), instructions: data.instructions.split('\n').map(i => i.trim()).filter(Boolean) }))
            });
            if (!response.ok) {
                throw new Error("Failed to create cultural recipe");
            }
            const recipe = await response.json();
            onOpenChange(false);
            form.reset();
            toast({
                title: "Cultural Recipe Created",
                description: "Your cultural recipe has been added successfully."
            });
            onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess(recipe);
        }
        catch (error) {
            toast({
                title: "Creation Failed",
                description: "Failed to create cultural recipe. Please try again.",
                variant: "destructive"
            });
        }
    };
    return (<Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Cultural Recipe</DialogTitle>
          <DialogDescription>
            Add a new recipe from {cuisine} cuisine.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Sushi" {...field}/>
                  </FormControl>
                </FormItem>)}/>

            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={generateAIDetails} disabled={isGenerating}>
                {isGenerating ? (<>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                    Generating...
                  </>) : (<>
                    <Wand2 className="mr-2 h-4 w-4"/>
                    Generate Details
                  </>)}
              </Button>
            </div>

            <FormField control={form.control} name="description" render={({ field }) => (<FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the recipe..." {...field}/>
                  </FormControl>
                </FormItem>)}/>

            <FormField control={form.control} name="authenticIngredients" render={({ field }) => (<FormItem>
                  <FormLabel>Authentic Ingredients</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter each ingredient on a new line&#10;e.g.,&#10;2 cups sushi rice&#10;4 sheets nori&#10;1 cucumber&#10;1 avocado" className="min-h-[100px]" {...field}/>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Enter each ingredient on a new line
                  </p>
                </FormItem>)}/>

            <FormField control={form.control} name="instructions" render={({ field }) => (<FormItem>
                  <FormLabel>Instructions</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter each step on a new line&#10;e.g.,&#10;1. Cook the rice according to package instructions&#10;2. Slice the vegetables into thin strips&#10;3. Lay out a sheet of nori on a bamboo mat&#10;4. Spread rice evenly over the nori" className="min-h-[150px]" {...field}/>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Enter each step on a new line
                  </p>
                </FormItem>)}/>

            {/* ... rest of the form fields ... */}
          </form>
        </Form>
      </DialogContent>
    </Dialog>);
}
