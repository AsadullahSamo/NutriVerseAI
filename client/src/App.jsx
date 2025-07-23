import { Switch, Route } from "wouter"
import { queryClient } from "@/lib/queryClient"
import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"
import { AuthProvider } from "@/hooks/use-auth"
import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext"
// Import global fetch override to fix all API calls automatically
import "@/lib/api"
// Import custom toast styles
import "@/styles/toast.css"
import NotFound from "@/pages/not-found"
import HomePage from "@/pages/home-page"
import AuthPage from "@/pages/auth-page"
import RecipesPage from "@/pages/recipes-page"
import PantryPage from "@/pages/pantry-page"
import CommunityPage from "@/pages/community-page"
import MealPlanPage from "@/pages/meal-plan-page"
import { ProtectedRoute } from "@/lib/protected-route"
import { Navbar } from "@/components/Navbar"
import NutritionPage from "./pages/nutrition-page"
import KitchenEquipmentPage from "@/pages/kitchen-equipment-page"
import CulturalCuisinePage from "@/pages/cultural-cuisine-page"
import KitchenStoragePage from "@/pages/kitchen-storage-page"
import ProfilePage from "@/pages/profile-page"
import UserSettings from "@/pages/user-settings"
import FeaturesPage from "@/pages/features-page"
import ProjectThumbnail from "@/pages/ProjectThumbnail"
import ProjectThumbnailAI from "@/pages/ProjectThumbnailAI"
import ProjectThumbnailUX from "@/pages/ProjectThumbnailUX"
import ProjectThumbnailHealth from "@/pages/ProjectThumbnailHealth"
import ProjectThumbnailCulture from "@/pages/ProjectThumbnailCulture"
import ProjectThumbnailSustainability from "@/pages/ProjectThumbnailSustainability"
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
        <Route path="*">
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
          <Toaster
            position="top-right"
            richColors={true}
            closeButton={false}
            duration={3000}
            expand={false}
            visibleToasts={3}
            theme="system"
            toastOptions={{
              style: {
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                padding: '12px 16px',
              },
              className: 'custom-toast',
            }}
          />
        </UserPreferencesProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
