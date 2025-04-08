import { useAuth } from "@/hooks/use-auth"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Loader2,
  ShoppingCart,
  Utensils,
  Clock,
  Users,
  Check,
  Copy,
  Sparkles,
  ShoppingBasket,
  Flame,
  Beef,
  Wheat,
  Droplet,
  ChefHat,
  ListChecks,
  Scale
} from "lucide-react"
import { GroceryList } from "@/components/grocery-list"
import { Link } from "wouter"
import { CreateGroceryListDialog } from "@/components/create-grocery-list-dialog"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { apiRequest } from "@/lib/queryClient"

export default function HomePage() {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState("")
  const [secretKey, setSecretKey] = useState(null)
  const [secretKeyDialog, setSecretKeyDialog] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopySecretKey = async () => {
    if (secretKey) {
      await navigator.clipboard.writeText(secretKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Secret key copied",
        description: "Make sure to store it in a secure place"
      })
    }
  }

  // Check for secret key in URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const key = params.get("secretKey")
    if (key) {
      setSecretKey(key)
      setSecretKeyDialog(true)
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [])

  // Prevent closing dialog if secret key hasn't been acknowledged
  const handleSecretKeyDialogClose = () => {
    if (secretKey) {
      toast({
        title: "⚠️ Important",
        description:
          "You must save your secret key before continuing. Click 'I Have Saved My Secret Key' when done.",
        variant: "destructive"
      })
    }
  }

  const handleConfirmSecretKeySaved = () => {
    toast({
      title: "Success",
      description: "Your secret key has been saved. Keep it in a safe place."
    })
    setSecretKeyDialog(false)
    setSecretKey(null)
  }

  // Prevent navigation if secret key hasn't been saved
  useEffect(() => {
    const handleBeforeUnload = e => {
      if (secretKey) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [secretKey])

  // Update display name when profile changes
  useEffect(() => {
    const loadDisplayName = () => {
      // Prioritize profile name over username
      const savedProfile = localStorage.getItem("userProfile")
      if (savedProfile) {
        const profile = JSON.parse(savedProfile)
        setDisplayName(profile.name || user?.name || user?.username)
        return
      }
      setDisplayName(user?.name || user?.username || "")
    }

    // Load initial name
    loadDisplayName()

    // Listen for profile updates
    const handleStorageChange = e => {
      if (e.key === "userProfile") {
        loadDisplayName()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("localProfileUpdate", loadDisplayName)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("localProfileUpdate", loadDisplayName)
    }
  }, [user])

  const { data: groceryLists, isLoading: listsLoading } = useQuery({
    queryKey: ["/api/grocery-lists"],
    refetchOnWindowFocus: true,
    refetchOnMount: true
  })

  const { data: recipes } = useQuery({
    queryKey: ["/api/recipes"]
  })

  const { data: recommendedRecipes, isLoading: isLoadingRecipes } = useQuery({
    queryKey: ["/api/recipes/personalized", user?.id, recipes?.length],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/recipes/personalized")
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      } catch (error) {
        console.error("Error fetching personalized recommendations:", error)
        return [] // Return empty array on error
      }
    },
    enabled: !!user && recipes?.length > 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 0,
    cacheTime: 0,
    refetchInterval: 0, // Disable automatic refetching
    onSuccess: data => {
      console.log("Received personalized recommendations:", data)
    },
    onError: error => {
      console.error("Error fetching personalized recommendations:", error)
    }
  })

  if (listsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {displayName ? `Welcome, ${displayName}!` : "Welcome!"}
          </h1>
          <p className="text-muted-foreground mt-2">
            Your personalized nutrition dashboard
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <section>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Grocery Lists
                </CardTitle>
                <CreateGroceryListDialog />
              </CardHeader>
              <CardContent>
                {groceryLists?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No grocery lists yet. Create one to get started!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {groceryLists
                      ?.sort((a, b) => {
                        // Sort kitchen equipment lists first
                        const hasKitchenA = a.items.some(
                          item => item.category === "Kitchen Equipment"
                        )
                        const hasKitchenB = b.items.some(
                          item => item.category === "Kitchen Equipment"
                        )
                        if (hasKitchenA && !hasKitchenB) return -1
                        if (!hasKitchenA && hasKitchenB) return 1
                        // Then sort by date
                        return (
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime()
                        )
                      })
                      .map(list => (
                        <GroceryList key={list.id} list={list} />
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Personalized Recipe Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingRecipes ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-6">
                    <div className="relative">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-8 w-8 rounded-full bg-primary/10 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-primary font-medium">Generating personalized recommendations...</p>
                      <p className="text-muted-foreground text-sm">This may take a few moments</p>
                    </div>
                    <div className="w-full max-w-xs h-1 bg-primary/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary animate-[progress_2s_ease-in-out_infinite]"></div>
                    </div>
                  </div>
                ) : !recipes?.length ? (
                  <p className="text-muted-foreground text-center py-8">
                    No personalized recommendations available yet. Create a recipe in Recipes tab to get started!
                  </p>
                ) : recommendedRecipes?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No personalized recommendations available yet. Create a recipe in Recipes tab to get started!
                  </p>
                ) : (
                  <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4 
                    [&::-webkit-scrollbar]:w-2
                    [&::-webkit-scrollbar-track]:bg-background/50
                    [&::-webkit-scrollbar-thumb]:bg-primary/20
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    [&::-webkit-scrollbar-thumb:hover]:bg-primary/30
                    [&::-webkit-scrollbar-thumb]:transition-colors">
                    {recommendedRecipes?.map((recipe, index) => (
                      <Card key={index} className="overflow-hidden border border-primary/10 hover:border-primary/20 transition-colors bg-gradient-to-br from-background to-primary/5">
                        <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
                          <CardTitle className="flex items-center gap-2 text-xl text-foreground">
                            <ChefHat className="h-5 w-5 text-primary" />
                            {recipe.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                          <div className="space-y-2">
                            <h4 className="font-medium text-lg flex items-center gap-2 text-foreground">
                              <ShoppingBasket className="h-5 w-5 text-primary" />
                              Ingredients
                            </h4>
                            <ul className="list-disc pl-4 space-y-1.5">
                              {recipe.ingredients?.map((ing, i) => (
                                <li key={i} className="text-muted-foreground hover:text-foreground transition-colors">
                                  {ing}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium text-lg flex items-center gap-2 text-foreground">
                              <ListChecks className="h-5 w-5 text-primary" />
                              Instructions
                            </h4>
                            <ol className="list-decimal pl-4 space-y-3">
                              {recipe.instructions?.map((step, i) => (
                                <li key={i} className="text-muted-foreground hover:text-foreground transition-colors">
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium text-lg flex items-center gap-2 text-foreground">
                              <Scale className="h-5 w-5 text-primary" />
                              Nutrition Info
                            </h4>
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/10">
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Flame className="h-4 w-4 text-orange-500" />
                                  Calories
                                </p>
                                <p className="font-medium text-lg text-primary">
                                  {recipe.nutritionInfo?.calories || 0}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Beef className="h-4 w-4 text-red-500" />
                                  Protein
                                </p>
                                <p className="font-medium text-lg text-primary">
                                  {recipe.nutritionInfo?.protein || 0}g
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Wheat className="h-4 w-4 text-amber-500" />
                                  Carbs
                                </p>
                                <p className="font-medium text-lg text-primary">
                                  {recipe.nutritionInfo?.carbs || 0}g
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Droplet className="h-4 w-4 text-blue-500" />
                                  Fat
                                </p>
                                <p className="font-medium text-lg text-primary">
                                  {recipe.nutritionInfo?.fat || 0}g
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>

      {/* Secret Key Dialog */}
      <Dialog
        open={secretKeyDialog}
        onOpenChange={() => handleSecretKeyDialogClose()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              Important: Save Your Secret Key
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center text-muted-foreground">
              Please save this secret key in a secure place. You will need it to
              reset your password if you forget it:
            </p>
            <div className="relative">
              <div className="p-3 bg-muted rounded-md font-mono text-sm break-all pr-12">
                {secretKey}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={handleCopySecretKey}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-md">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                ⚠️ Warning: This key will not be shown again. Store it somewhere
                secure.
              </p>
            </div>
            <Button onClick={handleConfirmSecretKeySaved} className="w-full">
              I Have Saved My Secret Key
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
