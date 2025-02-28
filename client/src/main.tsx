import { createRoot } from "react-dom/client";
import { Route, Switch } from "wouter";
import App from "./App";
import "./index.css";
import MealPrepPage from "@/pages/meal-prep-page";
import { ProtectedRoute } from "@/lib/protected-route";

const root = createRoot(document.getElementById("root")!);

root.render(
  <App>
    <Switch>
      <Route path="/meal-prep">
        <ProtectedRoute>
          <MealPrepPage />
        </ProtectedRoute>
      </Route>
    </Switch>
  </App>
);
