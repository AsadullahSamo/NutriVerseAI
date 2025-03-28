import * as React from "react";
import { Link } from "wouter";
import { UserButton } from "./UserButton";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Home, Book, ShoppingCart, Users, Calendar, LineChart, Wrench, Globe, Menu, X, ChevronDown, UtensilsCrossed, ChefHat, Clock } from "lucide-react";
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

  const mainLinks = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/community", icon: Users, label: "Community" },
  ];

  const menuGroups = {
    food: {
      label: "Food",
      icon: UtensilsCrossed,
      items: [
        { href: "/recipes", icon: Book, label: "Recipes" },
        { href: "/cultural-cuisine", icon: Globe, label: "Cultural Cuisine" },
      ],
    },
    kitchen: {
      label: "Kitchen",
      icon: ChefHat,
      items: [
        { href: "/pantry", icon: ShoppingCart, label: "Pantry" },
        { href: "/kitchen-equipment", icon: Wrench, label: "Equipment Management" },
      ],
    },
    planning: {
      label: "Planning",
      icon: Clock,
      items: [
        { href: "/meal-plans", icon: Calendar, label: "Meal Plans" },
        { href: "/nutrition", icon: LineChart, label: "Nutrition Tracking" },
      ],
    },
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background">
        <div className="container flex h-14 items-center">
          {/* Logo - aligned to the left with proper spacing */}
          <Link href="/" className="flex items-center pl-4">
            <span className="font-bold text-xl">NutriVerseAI</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex justify-center items-center space-x-6 mx-auto">
            {/* Main Links */}
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <link.icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            ))}

            {/* Dropdown Menus */}
            {Object.entries(menuGroups).map(([key, group]) => (
              <DropdownMenu key={key}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-3 py-2">
                    <group.icon className="h-4 w-4" />
                    <span>{group.label}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuGroup>
                    {group.items.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href} className="flex items-center gap-2 w-full hover:cursor-pointer">
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ))}
          </nav>

          {/* Right side controls with proper spacing */}
          <div className="flex items-center gap-4 ml-auto pr-4">
            {/* Mobile menu button - moved before other controls */}
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

            <ThemeToggle />
            {user ? (
              <UserButton />
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Button variant="ghost" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu with enhanced spacing */}
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 top-[3.5rem] z-40 bg-background/95 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <div className="fixed inset-x-0 top-[3.5rem] z-50 border-t bg-background shadow-lg">
              <nav className="container flex flex-col divide-y divide-border">
                {/* Main Links */}
                {mainLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="h-12 w-[100%] flex items-center gap-3 px-6 py-4 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setIsOpen(false)}
                  >
                    <link.icon className="h-5 w-5" />
                    <span>{link.label}</span>
                  </Link>
                ))}

                {/* Group Links */}
                {Object.values(menuGroups).flatMap(group => 
                  group.items.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="h-12 w-[100%] flex items-center gap-3 px-6 py-4 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                      onClick={() => setIsOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  ))
                )}

                {/* Auth buttons for mobile */}
                {!user && (
                  <div className="flex flex-col gap-4 p-6">
                    <Button variant="ghost" asChild className="justify-start text-base" onClick={() => setIsOpen(false)}>
                      <Link href="/sign-in">Sign In</Link>
                    </Button>
                    <Button asChild className="justify-start text-base" onClick={() => setIsOpen(false)}>
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