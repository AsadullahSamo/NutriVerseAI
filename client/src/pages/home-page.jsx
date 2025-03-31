import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShoppingCart, Utensils, Clock, Users, Check, Copy } from "lucide-react";
import { GroceryList } from "@/components/grocery-list";
import { Link } from "wouter";
import { CreateGroceryListDialog } from "@/components/create-grocery-list-dialog";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
export default function HomePage() {
    const { user } = useAuth();
    const [displayName, setDisplayName] = useState("");
    const [secretKey, setSecretKey] = useState(null);
    const [secretKeyDialog, setSecretKeyDialog] = useState(false);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();
    const handleCopySecretKey = async () => {
        if (secretKey) {
            await navigator.clipboard.writeText(secretKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast({
                title: "Secret key copied",
                description: "Make sure to store it in a secure place",
            });
        }
    };
    // Check for secret key in URL params on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const key = params.get('secretKey');
        if (key) {
            setSecretKey(key);
            setSecretKeyDialog(true);
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);
    // Prevent closing dialog if secret key hasn't been acknowledged
    const handleSecretKeyDialogClose = () => {
        if (secretKey) {
            toast({
                title: "⚠️ Important",
                description: "You must save your secret key before continuing. Click 'I Have Saved My Secret Key' when done.",
                variant: "destructive"
            });
        }
    };
    const handleConfirmSecretKeySaved = () => {
        toast({
            title: "Success",
            description: "Your secret key has been saved. Keep it in a safe place.",
        });
        setSecretKeyDialog(false);
        setSecretKey(null);
    };
    // Prevent navigation if secret key hasn't been saved
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (secretKey) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [secretKey]);
    // Update display name when profile changes
    useEffect(() => {
        const loadDisplayName = () => {
            // Prioritize profile name over username
            const savedProfile = localStorage.getItem('userProfile');
            if (savedProfile) {
                const profile = JSON.parse(savedProfile);
                setDisplayName(profile.name || (user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.username));
                return;
            }
            setDisplayName((user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.username) || "");
        };
        // Load initial name
        loadDisplayName();
        // Listen for profile updates
        const handleStorageChange = (e) => {
            if (e.key === 'userProfile') {
                loadDisplayName();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('localProfileUpdate', loadDisplayName);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('localProfileUpdate', loadDisplayName);
        };
    }, [user]);
    const { data: groceryLists, isLoading: listsLoading } = useQuery({
        queryKey: ["/api/grocery-lists"],
        refetchOnWindowFocus: true, // Ensure lists refresh when window regains focus
        refetchOnMount: true // Refresh when component mounts
    });
    const { data: recommendedRecipes, isLoading: recipesLoading } = useQuery({
        queryKey: ["/api/recipes"],
    });
    if (listsLoading || recipesLoading) {
        return (<div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border"/>
      </div>);
    }
    return (<div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {displayName ? `Welcome, ${displayName}!` : "Welcome!"}
          </h1>
          <p className="text-muted-foreground mt-2">Your personalized nutrition dashboard</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <section>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5"/>
                  Grocery Lists
                </CardTitle>
                <CreateGroceryListDialog />
              </CardHeader>
              <CardContent>
                {(groceryLists === null || groceryLists === void 0 ? void 0 : groceryLists.length) === 0 ? (<p className="text-muted-foreground text-center py-8">
                    No grocery lists yet. Create one to get started!
                  </p>) : (<div className="space-y-4">
                    {groceryLists === null || groceryLists === void 0 ? void 0 : groceryLists.sort((a, b) => {
                // Sort kitchen equipment lists first
                const hasKitchenA = a.items.some((item) => item.category === "Kitchen Equipment");
                const hasKitchenB = b.items.some((item) => item.category === "Kitchen Equipment");
                if (hasKitchenA && !hasKitchenB)
                    return -1;
                if (!hasKitchenA && hasKitchenB)
                    return 1;
                // Then sort by date
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }).map((list) => (<GroceryList key={list.id} list={list}/>))}
                  </div>)}
              </CardContent>
            </Card>
          </section>

          <section>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5"/>
                  Recommended Recipes
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/recipes">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {recommendedRecipes && recommendedRecipes.length > 0 ? (recommendedRecipes.slice(0, 3).map((recipe) => (<Link key={recipe.id} href={`/recipes?id=${recipe.id}`}>
                        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-0 bg-muted/30 hover:bg-muted/50 cursor-pointer group">
                          <CardHeader className="p-4">
                            <div>
                              <h3 className="font-medium text-lg group-hover:text-primary transition-colors">
                                {recipe.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                                {recipe.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                              <span className="flex items-center gap-2">
                                <Clock className="h-4 w-4 flex-shrink-0"/>
                                {recipe.prepTime} mins
                              </span>
                              <span className="flex items-center gap-2">
                                <Users className="h-4 w-4 flex-shrink-0"/>
                                {Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0} ingredients
                              </span>
                            </div>
                          </CardHeader>
                        </Card>
                      </Link>))) : (<p className="text-muted-foreground text-center py-8">
                      No recipes available yet.
                    </p>)}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>

      {/* Secret Key Dialog */}
      <Dialog open={secretKeyDialog} onOpenChange={() => handleSecretKeyDialogClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Important: Save Your Secret Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center text-muted-foreground">
              Please save this secret key in a secure place. You will need it to reset your password if you forget it:
            </p>
            <div className="relative">
              <div className="p-3 bg-muted rounded-md font-mono text-sm break-all pr-12">
                {secretKey}
              </div>
              <Button variant="ghost" size="sm" className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 p-0" onClick={handleCopySecretKey}>
                {copied ? (<Check className="h-4 w-4 text-green-500"/>) : (<Copy className="h-4 w-4"/>)}
              </Button>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-md">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                ⚠️ Warning: This key will not be shown again. Store it somewhere secure.
              </p>
            </div>
            <Button onClick={handleConfirmSecretKeySaved} className="w-full">
              I Have Saved My Secret Key
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>);
}
