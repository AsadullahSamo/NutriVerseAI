import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import RecipesPage from "@/pages/recipes-page";
import PantryPage from "@/pages/pantry-page";
import CommunityPage from "@/pages/community-page";
import MealPlanPage from "@/pages/meal-plan-page";
import { ProtectedRoute } from "./lib/protected-route";
import { Navbar } from "@/components/navbar";
import NutritionPage from "./pages/nutrition-page";
import KitchenEquipmentPage from '@/pages/kitchen-equipment-page';
import CulturalCuisinePage from '@/pages/cultural-cuisine-page';
import KitchenStoragePage from '@/pages/kitchen-storage-page';

function Router() {
  return (
    <>
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route>
          <Navbar />
          <Switch>
            <ProtectedRoute path="/" component={HomePage} />
            <ProtectedRoute path="/recipes" component={RecipesPage} />
            <ProtectedRoute path="/pantry" component={PantryPage} />
            <ProtectedRoute path="/community" component={CommunityPage} />
            <ProtectedRoute path="/meal-plans" component={MealPlanPage} />
            <ProtectedRoute path="/nutrition" component={NutritionPage} />
            <ProtectedRoute path="/kitchen-equipment" component={KitchenEquipmentPage} />
            <ProtectedRoute path="/cultural-cuisine" component={CulturalCuisinePage} />
            <ProtectedRoute path="/kitchen-storage" component={KitchenStoragePage} />
            <Route component={NotFound} />
          </Switch>
        </Route>
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;