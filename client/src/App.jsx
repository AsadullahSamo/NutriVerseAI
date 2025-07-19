import { Switch, Route } from "wouter"
import { queryClient } from "@/lib/queryClient"
import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/hooks/use-auth"
import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext"
// Import global fetch override to fix all API calls automatically
import "@/lib/api"
import NotFound from "@/pages/not-found.jsx"
import HomePage from "@/pages/home-page.jsx"
import AuthPage from "@/pages/auth-page.jsx"
import RecipesPage from "@/pages/recipes-page.jsx"
import PantryPage from "@/pages/pantry-page.jsx"
import CommunityPage from "@/pages/community-page.jsx"
import MealPlanPage from "@/pages/meal-plan-page.jsx"
import { ProtectedRoute } from "@/lib/protected-route"
import { Navbar } from "@/components/Navbar.jsx"
import NutritionPage from "./pages/nutrition-page.jsx"
import KitchenEquipmentPage from "@/pages/kitchen-equipment-page.jsx"
import CulturalCuisinePage from "@/pages/cultural-cuisine-page.jsx"
import KitchenStoragePage from "@/pages/kitchen-storage-page.jsx"
import ProfilePage from "@/pages/profile-page.jsx"
import UserSettings from "@/pages/user-settings.jsx"
import FeaturesPage from "@/pages/features-page.jsx"
import ProjectThumbnail from "@/pages/ProjectThumbnail.jsx"
import ProjectThumbnailAI from "@/pages/ProjectThumbnailAI.jsx"
import ProjectThumbnailUX from "@/pages/ProjectThumbnailUX.jsx"
import ProjectThumbnailHealth from "@/pages/ProjectThumbnailHealth.jsx"
import ProjectThumbnailCulture from "@/pages/ProjectThumbnailCulture.jsx"
import ProjectThumbnailSustainability from "@/pages/ProjectThumbnailSustainability.jsx"
import ProjectThumbnailYouTube from "@/pages/ProjectThumbnailYouTube.jsx"

function Router() {
  return (
    <>
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="/thumbnail" component={ProjectThumbnail} />
        <Route path="/thumbnail/ai" component={ProjectThumbnailAI} />
        <Route path="/thumbnail/ux" component={ProjectThumbnailUX} />
        <Route path="/thumbnail/health" component={ProjectThumbnailHealth} />
        <Route path="/thumbnail/culture" component={ProjectThumbnailCulture} />
        <Route path="/thumbnail/sustainability" component={ProjectThumbnailSustainability} />
        <Route path="/thumbnail/youtube" component={ProjectThumbnailYouTube} />
        <Route>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 pt-16">
              <Switch>
                <ProtectedRoute path="/" component={HomePage} />
                <ProtectedRoute path="/recipes" component={RecipesPage} />
                <ProtectedRoute path="/pantry" component={PantryPage} />
                <ProtectedRoute path="/community" component={CommunityPage} />
                <ProtectedRoute path="/meal-plans" component={MealPlanPage} />
                <ProtectedRoute path="/nutrition" component={NutritionPage} />
                <ProtectedRoute
                  path="/kitchen-equipment"
                  component={KitchenEquipmentPage}
                />
                <ProtectedRoute
                  path="/cultural-cuisine"
                  component={CulturalCuisinePage}
                />
                <ProtectedRoute
                  path="/kitchen-storage"
                  component={KitchenStoragePage}
                />
                <ProtectedRoute path="/profile" component={ProfilePage} />
                <ProtectedRoute path="/settings" component={UserSettings} />
                <ProtectedRoute path="/features" component={FeaturesPage} />
                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
        </Route>
      </Switch>
    </>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UserPreferencesProvider>
          <Router />
          <Toaster />
        </UserPreferencesProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
