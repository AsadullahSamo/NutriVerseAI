import * as React from "react";
import { Link } from "wouter";
import { ThemeToggle } from "./ThemeToggle";
import { UserButton } from "./UserButton";
import { useAuth } from "../client/src/hooks/use-auth";
import { Button } from "../client/src/components/ui/button";
import { Home, Book, ShoppingCart, Users, Calendar, LineChart, Wrench, Globe, Menu, X } from "lucide-react";

export function Navbar() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const menuItems = [
    { href: "/recipes", icon: Book, label: "Recipes" },
    { href: "/pantry", icon: ShoppingCart, label: "Pantry" },
    { href: "/community", icon: Users, label: "Community" },
    { href: "/meal-plans", icon: Calendar, label: "Meal Plans" },
    { href: "/nutrition", icon: LineChart, label: "Nutrition Tracking" },
    { href: "/kitchen-equipment", icon: Wrench, label: "Equipment Management" },
    { href: "/cultural-cuisine", icon: Globe, label: "Cultural Cuisine" },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center">
            <span className="font-bold text-xl">NutriCartAI</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {menuItems.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href} className="flex items-center gap-2 text-sm font-medium">
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <UserButton />
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
              </div>
            )}
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md p-0"
              onClick={() => setIsOpen(!isOpen)}
            >
              <span className="sr-only">Open menu</span>
              {isOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 top-[3.5rem] z-40 bg-background/95 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            {/* Menu */}
            <div className="fixed inset-x-0 top-[3.5rem] z-50 border-t bg-background shadow-lg">
              <nav className="container flex flex-col divide-y divide-border">
                {menuItems.map(({ href, icon: Icon, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2 py-4 text-sm font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                ))}
                {!user && (
                  <div className="flex flex-col gap-4 py-4">
                    <Button variant="ghost" asChild className="justify-start" onClick={() => setIsOpen(false)}>
                      <Link href="/sign-in">Sign In</Link>
                    </Button>
                    <Button asChild className="justify-start" onClick={() => setIsOpen(false)}>
                      <Link href="/sign-up">Sign Up</Link>
                    </Button>
                  </div>
                )}
              </nav>
            </div>
          </>
        )}
      </header>
      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-14" />
    </>
  );
}