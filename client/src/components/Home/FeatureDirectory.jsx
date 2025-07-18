import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, Search, Sparkles, Calendar, Utensils, Activity, ShoppingCart, Home, Hammer, Users, Smile, Globe, Lock } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";

// Feature data with detailed information including benefits and AI capabilities
const featureData = [
  {
    id: "meal-planning",
    title: "Smart Meal Planning",
    description: "Create personalized meal plans with AI-powered suggestions based on your preferences and nutritional goals.",
    icon: <Calendar className="h-6 w-6" />,
    color: "bg-blue-500",
    route: "/meal-plans",
    category: "Nutrition",
    hasAI: true,
    benefits: [
      "Save time with automated weekly meal planning (for lunch, breakfast, dinner, etc.)",
      "Stay on track with nutrition targets",
      "Reduce food waste through efficient ingredient usage",
      "Discover new meals that match your preferences",
      "Handle dietary restrictions automatically"
    ],
    aiCapabilities: [
      "Generates personalized meal suggestions based on your preference (calorie target, dietary restriction, etc.)",
      "Optimizes plans to meet your nutritional goals",
      "Adapts to dietary restrictions and ingredient availability",
      "Balances meals across days for nutritional variety"
    ],
    screenshot: "https://placehold.co/800x500/2563eb/FFFFFF?text=Meal+Planning+Screenshot"
  },
  {
    id: "recipes",
    title: "Smart Recipe Management",
    description: "Create, share, and discover recipes with full nutrition tracking and smart recommendations.",
    icon: <Utensils className="h-6 w-6" />,
    color: "bg-green-500",
    route: "/recipes",
    category: "Nutrition",
    hasAI: true,
    benefits: [
      "Build a personalized recipe collection",
      "Simply enter a recipe name and let AI generate all details",
      "Track complete nutritional information",
      "Share creations with the community",
      "Discover new recipes that match your preferences",
      "Input available ingredients and get instant recipe ideas"
    ],
    aiCapabilities: [
      "AI generates complete recipes from just a name or concept",
      "Recommends recipes based on your preferences (in Home page)",
      "Generates 3 detailed recipe recommendations from ingredients",
      "Offers ingredient alternatives based on what you have (for cultural recipe)",
      "Automatically calculates nutrition information",
      "Complete with instructions, ingredients list, and nutrition values"
    ],
    screenshot: "https://placehold.co/800x500/22c55e/FFFFFF?text=Recipe+Management+Screenshot"
  },
  {
    id: "nutrition",
    title: "Advanced Nutrition Tracking",
    description: "Set goals, track intake with visual progress indicators, and get AI-powered insights about your habits.",
    icon: <Activity className="h-6 w-6" />,
    color: "bg-red-500",
    route: "/nutrition",
    category: "Nutrition",
    hasAI: true,
    benefits: [
      "Set personalized nutrition goals",
      "Track macro and micronutrients",
      "Visualize progress with interactive charts",
      "Receive alerts for goal exceedance",
      "Analyze trends over time"
    ],
    aiCapabilities: [
      "Analyzes nutrition patterns to identify imbalances",
      "Provides personalized recommendations for improvement",
      "Tracks progress toward goals and adjusts recommendations",
      "Identifies correlations between nutrition and mood/energy"
    ],
    screenshot: "https://placehold.co/800x500/ef4444/FFFFFF?text=Nutrition+Tracking+Screenshot"
  },
  {
    id: "grocery",
    title: "Grocery Lists",
    description: "Create customized lists or add high priority item to shopping list from kitchen ",
    icon: <ShoppingCart className="h-6 w-6" />,
    color: "bg-amber-500",
    route: "/",
    category: "Shopping",
    hasAI: false,
    benefits: [
      "Add high priority items from your kitchen",
      "Track purchases and items you have",
      "Mobile-friendly interface for in-store use",
      "Categorization of items",
      "Manage multiple lists for different purposes"
    ],
    screenshot: "https://placehold.co/800x500/f59e0b/FFFFFF?text=Grocery+Lists+Screenshot"
  },
  {
    id: "pantry",
    title: "Smart Pantry",
    description: "Track your ingredients, monitor expiry dates, and get sustainability insights.",
    icon: <Home className="h-6 w-6" />,
    color: "bg-purple-500", 
    route: "/pantry",
    category: "Kitchen",
    hasAI: true,
    benefits: [
      "Reduce food waste with expiry tracking",
      "Always know what ingredients you have on hand",
      "Categorize items for easy management",
      "Track nutrition information for ingredients",
      "Conduct pantry analysis"
    ],
    aiCapabilities: [
      "Enter a pantry name and let AI generate all details",
      "Tracks sustainability metrics for your kitchen",
    ],
    screenshot: "https://placehold.co/800x500/9333ea/FFFFFF?text=Smart+Pantry+Screenshot"
  },
  {
    id: "equipment",
    title: "Kitchen Equipment Management",
    description: "Track your kitchen tools with AI-powered maintenance schedules and usage analysis.",
    icon: <Hammer className="h-6 w-6" />,
    color: "bg-orange-500", 
    route: "/kitchen-equipment",
    category: "Kitchen",
    hasAI: true,
    benefits: [
      "Keep track of all your kitchen equipment",
      "Maintain equipment in optimal condition",
      "Find recipes compatible with your tools",
      "Get personalized equipment recommendations",
      "Track equipment usage and effectiveness"
    ],
    aiCapabilities: [
      "Get AI maintenance tips for each equipment",
      "Run AI analysis on your kitchen equipments",
      "Add recommended equipment items to your shopping list with priority",
      "Get recipe matches and equipment recommendations"
    ],
    screenshot: "https://placehold.co/800x500/f97316/FFFFFF?text=Kitchen+Equipment+Screenshot"
  },
  {
    id: "community",
    title: "Community Features",
    description: "Share recipes, cooking experiences, and food rescue tips with other users.",
    icon: <Users className="h-6 w-6" />,
    color: "bg-sky-500", 
    route: "/community",
    category: "Social",
    hasAI: false,
    benefits: [
      "Connect with other home cooks",
      "Share your culinary creations, food rescue or cooking tips",
      "Get inspiration from other users",
      "Learn food rescue and sustainability tips from other users",
      "Build your cooking reputation"
    ],
    aiCapabilities: [],
    screenshot: "https://placehold.co/800x500/0ea5e9/FFFFFF?text=Community+Screenshot"
  },
  {
    id: "mood",
    title: "Mood & Cooking Experience",
    description: "Track how cooking affects your mood with AI-powered emotional pattern insights.",
    icon: <Smile className="h-6 w-6" />,
    color: "bg-pink-500", 
    route: "/recipes",
    category: "Wellness",
    hasAI: true,
    benefits: [
      "Understand how foods affect your mood",
      "Track cooking confidence and progress",
      "Identify recipes that bring you joy",
      "Create a personal cooking journal",
      "See emotional patterns over time"
    ],
    aiCapabilities: [
      "Analyzes mood patterns in relation to specific foods",
      "Identifies recipes that consistently improve mood",
      "Tracks cooking confidence growth over time",
      "Suggests recipes based on current mood"
    ],
    screenshot: "https://placehold.co/800x500/ec4899/FFFFFF?text=Mood+Tracking+Screenshot"
  },
  {
    id: "cultural",
    title: "Cultural Cuisine",
    description: "Discover traditional recipes with authenticity scoring and cultural context.",
    icon: <Globe className="h-6 w-6" />,
    color: "bg-emerald-500", 
    route: "/cultural-cuisine",
    category: "Learning",
    hasAI: true,
    benefits: [
      "Explore authentic traditional recipes",
      "Learn about cultural food contexts, taboos",
      "Understand regional variations",
      "Learn proper serving customs",
      "Find authentic ingredient substitutions"
    ],
    aiCapabilities: [
      "Suggests culturally appropriate substitutions",
      "Generate cultural context, history, serving order, dining customs etc",
      "Identifies regional variations in traditional dishes",
      "Learn about main and side dishes, desserts and beverages for a cultural recipe"
    ],
    screenshot: "https://placehold.co/800x500/10b981/FFFFFF?text=Cultural+Cuisine+Screenshot"
  },
  {
    id: "account",
    title: "User Account Management",
    description: "Personalize your profile, theme, and manage your account securely.",
    icon: <Lock className="h-6 w-6" />,
    color: "bg-indigo-500", 
    route: "/profile",
    category: "Settings",
    hasAI: false,
    benefits: [
      "Secure authentication system",
      "Personalized user profiles",
      "Custom theme preferences",
      "Forgot password via secret key",
      "Password reset and delete account",
      "Secret key implementation to remove email dependency",
      "Mobile-friendly account management",
    ],
    aiCapabilities: [],
    screenshot: "https://placehold.co/800x500/6366f1/FFFFFF?text=Account+Management+Screenshot"
  },
  {
    id: "ai-features",
    title: "AI-Powered Features",
    description: "Experience the power of AI across 12 different features for a smarter cooking experience.",
    icon: <Sparkles className="h-6 w-6" />,
    color: "bg-violet-500", 
    route: "/features",
    category: "AI",
    hasAI: true,
    benefits: [
      "Get personalized recommendations",
      "Save time with smart automations",
      "Discover insights about your cooking",
      "Improve nutrition with AI analysis",
      "Enhance sustainability with smart suggestions"
    ],
    aiCapabilities: [
      "Smart meal planning based on preferences and dietary restrictions",
      "Mood tracking with emotional pattern analysis for cooking",
      "Personalized and ingredient-based recipe recommendations",
      "Automatic form filling using just names for recipes, pantry and cultural cuisine",
      "Kitchen equipment maintenance tips and recommendations", 
      "Recipe matches based on available equipment with nutrition info",
      "Nutrition AI insights and goal tracking",
      "Cultural cuisine authenticity analysis"
    ],
    screenshot: "https://placehold.co/800x500/8b5cf6/FFFFFF?text=AI+Features+Screenshot"
  }
];

// Define categories for filtering - Add back AI category
const categories = [
  { id: "all", label: "All Features" },
  { id: "ai", label: "AI Features", icon: <Sparkles className="h-4 w-4" /> },
  { id: "Nutrition", label: "Nutrition" },
  { id: "Kitchen", label: "Kitchen" },
  { id: "Shopping", label: "Shopping" },
  { id: "Social", label: "Social" },
  { id: "Wellness", label: "Wellness" },
  { id: "Learning", label: "Learning" },
  { id: "Settings", label: "Settings" }
];

export function FeatureDirectory({ highlightedFeatureId }) {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [selectedNestedFeature, setSelectedNestedFeature] = useState(null);
  const highlightedRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Scroll to highlighted feature when the component mounts
  useEffect(() => {
    if (highlightedFeatureId) {
      const feature = featureData.find(f => f.id === highlightedFeatureId);
      if (feature) {
        setSelectedFeature(feature);
        setSelectedNestedFeature(null);
        // Set appropriate category tab
        if (feature.hasAI) {
          setActiveTab("ai");
        } else {
          setActiveTab(feature.category);
        }
        
        // Scroll to highlighted feature after a short delay
        setTimeout(() => {
          if (highlightedRef.current) {
            highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    }
  }, [highlightedFeatureId]);

  // Filter features based on active tab and search query
  const filteredFeatures = featureData.filter(feature => {
    // First filter by category
    const matchesCategory = 
      activeTab === "all" || 
      (activeTab === "ai" && feature.id === "ai-features") || // Only show AI Features item
      feature.category === activeTab;
    
    // Then filter by search query
    const matchesSearch = 
      searchQuery === "" ||
      feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      // Also search in nested features
      (feature.nestedFeatures && feature.nestedFeatures.some(
        nestedFeature => 
          nestedFeature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          nestedFeature.description.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    
    return matchesCategory && matchesSearch;
  });

  // Handle feature selection
  const handleFeatureClick = (feature) => {
    setSelectedFeature(feature);
    setSelectedNestedFeature(null);
  };

  // Handle nested feature selection
  const handleNestedFeatureClick = (nestedFeature) => {
    setSelectedNestedFeature(nestedFeature);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setSearchQuery(e.target.value);
  };

  return (
    <>
      {/* Only render the directory content */}
      <div className="w-full max-w-[1200px] mx-auto p-2 sm:p-4">
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Feature Directory</h2>
          <p className="text-muted-foreground text-sm sm:text-base">Explore all the powerful features of NutriVerse</p>
        </div>
        
        {/* Search bar */}
        <div className="relative mb-4 sm:mb-6">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search features..."
            className="pl-8"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
        {/* Feature categories */}
        <div className="mb-4 sm:mb-6 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeTab === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(category.id)}
              className={`${activeTab === category.id ? "bg-primary text-primary-foreground" : ""}`}
            >
              {category.icon}
              <span className="ml-1">{category.label}</span>
              {category.id === "ai" && <Sparkles className="ml-1 h-3 w-3" />}
            </Button>
          ))}
        </div>
        
        {/* Main content wrapper with proper overflow handling */}
        <div className="bg-background rounded-lg border shadow-lg overflow-hidden max-h-[80vh] flex flex-col">
          <div className="flex flex-col md:flex-row h-full">
            <div className="w-full md:w-1/3 border-r h-[35vh] md:h-auto">
              {/* Feature list */}
              <ScrollArea className="h-full md:h-[calc(80vh-8rem)]">
                <div className="p-2">
                  {filteredFeatures.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">
                      No features found matching your search
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredFeatures.map(feature => (
                        <div key={feature.id}>
                          <Card
                            className={`cursor-pointer transition-all hover:shadow ${
                              selectedFeature?.id === feature.id && !selectedNestedFeature
                                ? "ring-2 ring-primary" 
                                : "ring-0"
                            }`}
                            onClick={() => handleFeatureClick(feature)}
                            ref={feature.id === highlightedFeatureId ? highlightedRef : null}
                          >
                            <CardContent className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${feature.color} text-white`}>
                                  {feature.icon}
                                </div>
                                <div>
                                  <h3 className="font-medium">{feature.title}</h3>
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {feature.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {feature.nestedFeatures && (
                                  <Badge variant="secondary" className="text-xs">
                                    {feature.nestedFeatures.length} sub-features
                                  </Badge>
                                )}
                                {feature.hasAI && (
                                  <Badge variant="outline" className="gap-1">
                                    <Sparkles className="h-3 w-3" /> AI
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                          
                          {/* Nested features (if any) */}
                          {feature.nestedFeatures && selectedFeature?.id === feature.id && (
                            <div className="pl-4 mt-1 mb-2 border-l-2 border-muted ml-3 space-y-1">
                              {feature.nestedFeatures.map(nestedFeature => (
                                <Card
                                  key={nestedFeature.id}
                                  className={`cursor-pointer transition-all hover:shadow-sm ${
                                    selectedNestedFeature?.id === nestedFeature.id 
                                      ? "ring-2 ring-primary" 
                                      : "ring-0"
                                  }`}
                                  onClick={() => handleNestedFeatureClick(nestedFeature)}
                                >
                                  <CardContent className="p-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className={`p-1.5 rounded-full ${nestedFeature.color} text-white`}>
                                        {nestedFeature.icon}
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-medium">{nestedFeature.title}</h4>
                                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                          {nestedFeature.description}
                                        </p>
                                      </div>
                                    </div>
                                    {nestedFeature.hasAI && (
                                      <Badge variant="outline" className="text-xs gap-1">
                                        <Sparkles className="h-3 w-3" /> AI
                                      </Badge>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
            
            {/* Feature detail view */}
            <div className="w-full md:w-2/3 overflow-hidden">
              {selectedNestedFeature ? (
                <ScrollArea className="h-[calc(80vh-8rem)]">
                  <div className="p-6 pb-20">
                    {/* Nested Feature header with back button */}
                    <div className="flex items-center gap-2 mb-6">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2"
                        onClick={() => setSelectedNestedFeature(null)}
                      >
                        <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                        Back
                      </Button>
                      <Badge variant="outline">Sub-feature</Badge>
                      {selectedNestedFeature.hasAI && (
                        <Badge variant="outline" className="gap-1">
                          <Sparkles className="h-3 w-3" /> AI-Powered
                        </Badge>
                      )}
                    </div>
                    
                    {/* Nested Feature header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-full ${selectedNestedFeature.color} text-white`}>
                        {selectedNestedFeature.icon}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{selectedNestedFeature.title}</h2>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Part of: {selectedFeature.title}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Nested Feature screenshot */}
                    <div className="rounded-lg overflow-hidden mb-6 border">
                      <img 
                        src={selectedNestedFeature.screenshot} 
                        alt={`${selectedNestedFeature.title} screenshot`} 
                        className="w-full"
                      />
                    </div>
                    
                    {/* Nested Feature description */}
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-2">Description</h3>
                      <p className="text-muted-foreground">
                        {selectedNestedFeature.description}
                      </p>
                    </div>
                    
                    {/* Benefits */}
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-2">Benefits</h3>
                      <ul className="space-y-2">
                        {selectedNestedFeature.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* AI Capabilities (if any) */}
                    {selectedNestedFeature.hasAI && selectedNestedFeature.aiCapabilities && selectedNestedFeature.aiCapabilities.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-violet-500" />
                          AI Capabilities
                        </h3>
                        <ul className="space-y-2">
                          {selectedNestedFeature.aiCapabilities.map((capability, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <ChevronRight className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                              <span>{capability}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Call to action button */}
                    <Link href={selectedFeature.route}>
                      <Button className="w-full py-6 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all group">
                        Try {selectedNestedFeature.title}
                        <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </ScrollArea>
              ) : selectedFeature ? (
                <ScrollArea className="h-[calc(80vh-8rem)]">
                  <div className="p-6 pb-20">
                    {/* Feature header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-full ${selectedFeature.color} text-white`}>
                        {selectedFeature.icon}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{selectedFeature.title}</h2>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Category: {selectedFeature.category}</span>
                          {selectedFeature.hasAI && (
                            <Badge variant="outline" className="gap-1">
                              <Sparkles className="h-3 w-3" /> AI-Powered
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Feature screenshot */}
                    <div className="rounded-lg overflow-hidden mb-6 border">
                      <img 
                        src={selectedFeature.screenshot} 
                        alt={`${selectedFeature.title} screenshot`} 
                        className="w-full"
                      />
                    </div>
                    
                    {/* Feature description */}
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-2">Description</h3>
                      <p className="text-muted-foreground">
                        {selectedFeature.description}
                      </p>
                    </div>
                    
                    {/* Nested features section (if any) */}
                    {selectedFeature.nestedFeatures && (
                      <div className="mb-6">
                        <h3 className="text-lg font-medium mb-3">Included Features</h3>
                        <div className="grid gap-3 md:grid-cols-2">
                          {selectedFeature.nestedFeatures.map(nestedFeature => (
                            <Card
                              key={nestedFeature.id}
                              className="cursor-pointer hover:shadow-md transition-all"
                              onClick={() => handleNestedFeatureClick(nestedFeature)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className={`p-2 rounded-full ${nestedFeature.color} text-white`}>
                                    {nestedFeature.icon}
                                  </div>
                                  <h4 className="font-medium">{nestedFeature.title}</h4>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {nestedFeature.description}
                                </p>
                                <Button variant="outline" size="sm" className="w-full gap-1">
                                  View Details <ChevronRight className="h-4 w-4" />
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Benefits */}
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-2">Benefits</h3>
                      <ul className="space-y-2">
                        {selectedFeature.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* AI Capabilities (if any) */}
                    {selectedFeature.hasAI && selectedFeature.aiCapabilities && selectedFeature.aiCapabilities.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-violet-500" />
                          AI Capabilities
                        </h3>
                        <ul className="space-y-2">
                          {selectedFeature.aiCapabilities.map((capability, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <ChevronRight className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                              <span>{capability}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Call to action button - only for non-AI-features */}
                    {selectedFeature.id !== "ai-features" && (
                      <Link href={selectedFeature.route}>
                        <Button className="w-full py-6 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all group">
                          Try {selectedFeature.title}
                          <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex items-center justify-center h-full text-center p-6">
                  <div>
                    <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2">Explore NutriVerseAI Features</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Select a feature from the list to see detailed information, benefits, and capabilities.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 