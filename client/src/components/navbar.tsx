import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "./theme-switcher";
import { Home, Book, LogOut, Package, Users, Menu, Calendar } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const NavItems = () => (
    <>
      <Link href="/">
        <Button variant="ghost" className="gap-2" onClick={() => setIsOpen(false)}>
          <Home className="h-4 w-4" />
          Home
        </Button>
      </Link>
      <Link href="/recipes">
        <Button variant="ghost" className="gap-2" onClick={() => setIsOpen(false)}>
          <Book className="h-4 w-4" />
          Recipes
        </Button>
      </Link>
      <Link href="/pantry">
        <Button variant="ghost" className="gap-2" onClick={() => setIsOpen(false)}>
          <Package className="h-4 w-4" />
          Pantry
        </Button>
      </Link>
      <Link href="/community">
        <Button variant="ghost" className="gap-2" onClick={() => setIsOpen(false)}>
          <Users className="h-4 w-4" />
          Community
        </Button>
      </Link>
      <Link href="/meal-plans">
        <Button variant="ghost" className="gap-2" onClick={() => setIsOpen(false)}>
          <Calendar className="h-4 w-4" />
          Meal Plans
        </Button>
      </Link>
    </>
  );

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {isMobile ? (
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col gap-4 pt-8">
              <NavItems />
            </SheetContent>
          </Sheet>
        ) : (
          <div className="flex items-center space-x-4">
            <NavItems />
          </div>
        )}
        <div className="flex items-center space-x-2">
          <ThemeSwitcher />
          <Button 
            variant="ghost" 
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            {!isMobile && "Logout"}
          </Button>
        </div>
      </div>
    </nav>
  );
}