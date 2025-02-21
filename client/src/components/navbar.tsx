import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "./theme-switcher";
import { Home, Book, LogOut, Package, Users } from "lucide-react";

export function Navbar() {
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </Link>
          <Link href="/recipes">
            <Button variant="ghost" className="gap-2">
              <Book className="h-4 w-4" />
              Recipes
            </Button>
          </Link>
          <Link href="/pantry">
            <Button variant="ghost" className="gap-2">
              <Package className="h-4 w-4" />
              Pantry
            </Button>
          </Link>
          <Link href="/community">
            <Button variant="ghost" className="gap-2">
              <Users className="h-4 w-4" />
              Community
            </Button>
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          <ThemeSwitcher />
          <Button 
            variant="ghost" 
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}