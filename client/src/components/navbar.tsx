import * as React from "react";
import { Link } from "wouter";
import { UserButton } from "./UserButton";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Home, Book, ShoppingCart, Users, Calendar, LineChart, Wrench, Globe, Menu, X, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const menuGroups = {
    main: [
      { href: "/", icon: Home, label: "Home" },
      { href: "/community", icon: Users, label: "Community" },
    ],
    food: [
      { href: "/recipes", icon: Book, label: "Recipes" },
      { href: "/cultural-cuisine", icon: Globe, label: "Cultural Cuisine" },
    ],
    kitchen: [
      { href: "/pantry", icon: ShoppingCart, label: "Pantry" },
      { href: "/kitchen-equipment", icon: Wrench, label: "Equipment Management" },
    ],
    planning: [
      { href: "/meal-plans", icon: Calendar, label: "Meal Plans" },
      { href: "/nutrition", icon: LineChart, label: "Nutrition Tracking" },
    ],
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center pl-6">
            <span className="font-bold text-xl">NutriCartAI</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex justify-center items-center space-x-6 mx-auto">
            {menuGroups.main.map(({ href, icon: Icon, label }) => (
              <Link 
                key={href} 
                href={href} 
                className="flex items-center gap-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground px-3 py-2 rounded-md"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            
            {/* Food Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground px-3 py-2 rounded-md">
                <Book className="h-4 w-4" />
                Food
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  {menuGroups.food.map(({ href, icon: Icon, label }) => (
                    <DropdownMenuItem key={href} asChild>
                      <Link href={href} className="flex items-center gap-2 hover:cursor-pointer">
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Kitchen Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground px-3 py-2 rounded-md">
                <ShoppingCart className="h-4 w-4" />
                Kitchen
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  {menuGroups.kitchen.map(({ href, icon: Icon, label }) => (
                    <DropdownMenuItem key={href} asChild>
                      <Link href={href} className="flex items-center gap-2 hover:cursor-pointer">
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Planning Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground px-3 py-2 rounded-md">
                <Calendar className="h-4 w-4" />
                Planning
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  {menuGroups.planning.map(({ href, icon: Icon, label }) => (
                    <DropdownMenuItem key={href} asChild>
                      <Link href={href} className="flex items-center gap-2 hover:cursor-pointer">
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-2 pr-6 ml-auto">
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
                {Object.entries(menuGroups).flatMap(([, items]) =>
                  items.map(({ href, icon: Icon, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  ))
                )}
                {!user && (
                  <div className="flex flex-col gap-4 p-6">
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