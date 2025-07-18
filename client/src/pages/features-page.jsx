import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeatureDirectory } from "@/components/Home/FeatureDirectory";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  Sparkles, 
  Calendar, 
  Utensils, 
  Activity, 
  ShoppingCart, 
  Home, 
  Hammer, 
  Users, 
  Smile, 
  Globe, 
  Lock,
  ArrowRight,
  Brain,
  Lightbulb,
  ChevronRight,
  Layers
} from "lucide-react";
import { Link } from "wouter";

// AI-powered features
const aiFeatures = [
  {
    id: "meal-planning",
    title: "AI Meal Planning",
    description: "Personalized meal plans based on your preferences and nutrition goals",
    icon: <Calendar className="h-10 w-10" />,
    color: "bg-blue-500",
    capabilities: [
      "Generates weekly meal suggestions based on preferences",
      "Adapts to dietary restrictions automatically",
      "Balances nutrition across your meal plan"
    ],
    route: "/meal-plans"
  },
  {
    id: "recipe-recommendations",
    title: "Smart Recipe Suggestions",
    description: "Discover recipes tailored to your taste profile and kitchen inventory",
    icon: <Utensils className="h-10 w-10" />,
    color: "bg-green-500",
    capabilities: [
      "Personalizes recommendations based on past favorites",
      "Suggests recipes using ingredients you already have",
      "Adapts recipes to your dietary needs"
    ],
    route: "/recipes",
    hasNestedFeatures: true,
    nestedFeatures: [
      {
        title: "My Recipes",
        description: "Create recipes with AI assistance",
        capabilities: [
          "Enter a recipe name for AI to generate complete details",
          "Full manual control option for custom recipes"
        ]
      },
      {
        title: "AI Recommendations",
        description: "Get instant recipe suggestions",
        capabilities: [
          "Input available ingredients for custom suggestions",
          "Complete with instructions and nutrition details"
        ]
      }
    ]
  },
  {
    id: "nutrition-insights",
    title: "Nutrition Analysis",
    description: "Get AI-powered insights about your eating patterns and nutrition habits",
    icon: <Activity className="h-10 w-10" />,
    color: "bg-red-500",
    capabilities: [
      "Identifies nutritional imbalances in your diet",
      "Provides personalized improvement recommendations",
      "Correlates nutrition with mood and energy levels"
    ],
    route: "/nutrition"
  },
  {
    id: "smart-shopping",
    title: "Intelligent Grocery Lists",
    description: "Smart shopping recommendations and sustainable alternatives",
    icon: <ShoppingCart className="h-10 w-10" />,
    color: "bg-amber-500",
    capabilities: [
      "Suggests eco-friendly and budget-conscious alternatives",
      "Optimizes shopping lists by store layout",
      "Predicts needed items based on usage patterns"
    ],
    route: "/grocery-lists"
  },
  {
    id: "pantry-analysis",
    title: "Smart Pantry Management",
    description: "Optimize ingredient usage and reduce food waste",
    icon: <Home className="h-10 w-10" />,
    color: "bg-purple-500",
    capabilities: [
      "Recommends recipes using soon-to-expire ingredients",
      "Provides intelligent storage tips to extend shelf life",
      "Tracks your kitchen's sustainability metrics"
    ],
    route: "/pantry"
  },
  {
    id: "equipment-ai",
    title: "Equipment Intelligence",
    description: "AI-powered maintenance and usage optimization for kitchen tools",
    icon: <Hammer className="h-10 w-10" />,
    color: "bg-orange-500",
    capabilities: [
      "Creates personalized maintenance schedules",
      "Matches recipes to your available equipment",
      "Analyzes which equipment provides most value"
    ],
    route: "/kitchen-equipment"
  },
  {
    id: "mood-analysis",
    title: "Mood & Cooking Analysis",
    description: "Track and analyze how cooking and food affect your emotional wellbeing",
    icon: <Smile className="h-10 w-10" />,
    color: "bg-pink-500",
    capabilities: [
      "Analyzes mood patterns related to specific foods",
      "Identifies recipes that consistently improve mood",
      "Suggests recipes based on your current mood"
    ],
    route: "/profile"
  },
  {
    id: "cultural-ai",
    title: "Cultural Cuisine AI",
    description: "Explore authentic traditional recipes with cultural context",
    icon: <Globe className="h-10 w-10" />,
    color: "bg-emerald-500",
    capabilities: [
      "Provides authenticity scoring for traditional recipes",
      "Suggests culturally appropriate substitutions",
      "Explains cultural significance and history of dishes"
    ],
    route: "/cultural-cuisine"
  }
];

export default function FeaturesPage() {
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [highlightedFeatureId, setHighlightedFeatureId] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedFeatureId, setExpandedFeatureId] = useState(null);

  const handleFeatureClick = (featureId) => {
    setHighlightedFeatureId(featureId);
    setDirectoryOpen(true);
  };

  const toggleNestedFeatures = (featureId) => {
    setExpandedFeatureId(expandedFeatureId === featureId ? null : featureId);
  };

  return (
    <div className="container mx-auto p-6">
      <header className="mb-8 text-center">
        <Badge variant="outline" className="mb-2 px-3 py-1 gap-1">
          <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          <span className="text-violet-600 dark:text-violet-400">AI-Powered</span>
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Discover NutriVerseAI Features
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explore our comprehensive suite of AI-powered features designed to make your 
          cooking experience smarter, more sustainable, and personalized to your needs.
        </p>
      </header>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <div className="flex justify-center mb-6">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="all">All Features</TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              AI Features
            </TabsTrigger>
            <TabsTrigger value="discover">By Category</TabsTrigger>
          </TabsList>
        </div>

        {/* All Features Tab */}
        <TabsContent value="all" className="m-0">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {aiFeatures.map((feature) => (
              <Card 
                key={feature.id} 
                className={`overflow-hidden hover:shadow-md transition-shadow ${
                  expandedFeatureId === feature.id ? 'ring-2 ring-primary' : ''
                }`}
              >
                <CardHeader className={`${feature.color} text-white`}>
                  <div className="flex justify-between items-start">
                    {feature.icon}
                    <div className="flex gap-2">
                      {feature.hasNestedFeatures && (
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-8 w-8 rounded-full bg-white/20 border-white/20 text-white hover:bg-white/30 hover:text-white"
                          onClick={() => toggleNestedFeatures(feature.id)}
                        >
                          <Layers className="h-4 w-4" />
                        </Button>
                      )}
                      <Badge variant="outline" className="bg-white/20 border-white/20 text-white">
                        AI-Powered
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-xl mt-2 flex items-center gap-2">
                    {feature.title}
                    {feature.hasNestedFeatures && (
                      <Badge className="bg-white/30 border-0 text-white">
                        Multiple Features
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-white/80">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {/* Show nested features when expanded */}
                  {expandedFeatureId === feature.id && feature.hasNestedFeatures ? (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Included Features:</h4>
                      <div className="space-y-4">
                        {feature.nestedFeatures.map((nestedFeature, idx) => (
                          <div key={idx} className="border rounded-md p-3">
                            <h5 className="font-medium mb-1">{nestedFeature.title}</h5>
                            <p className="text-xs text-muted-foreground mb-2">{nestedFeature.description}</p>
                            <ul className="space-y-1">
                              {nestedFeature.capabilities.map((capability, capIdx) => (
                                <li key={capIdx} className="flex gap-2 items-start">
                                  <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                  <span className="text-xs">{capability}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full mt-3"
                        onClick={() => toggleNestedFeatures(feature.id)}
                      >
                        Show Main Capabilities
                      </Button>
                    </div>
                  ) : (
                    <ul className="space-y-2 mb-4">
                      {feature.capabilities.map((capability, idx) => (
                        <li key={idx} className="flex gap-2 items-start">
                          <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm">{capability}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto text-primary"
                      onClick={() => handleFeatureClick(feature.id)}
                    >
                      Learn More
                    </Button>
                    <Link href={feature.route}>
                      <Button size="sm">
                        Try It <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* AI Features Tab */}
        <TabsContent value="ai" className="m-0">
          <Card className="border-2 border-violet-200 dark:border-violet-950">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-violet-100 dark:bg-violet-900 rounded-full">
                  <Brain className="h-6 w-6 text-violet-500" />
                </div>
                <div>
                  <CardTitle>AI-Powered Platform</CardTitle>
                  <CardDescription>
                    Experience the power of artificial intelligence throughout your cooking journey
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    How AI Enhances Your Experience
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex gap-2">
                      <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Personalization</span>
                        <p className="text-sm text-muted-foreground">
                          AI learns your preferences to deliver tailored recommendations
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Efficiency</span>
                        <p className="text-sm text-muted-foreground">
                          Save time with smart automations and intelligent suggestions
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Optimization</span>
                        <p className="text-sm text-muted-foreground">
                          Make better decisions with data-driven insights and analysis
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-2">
                      <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Sustainability</span>
                        <p className="text-sm text-muted-foreground">
                          Reduce waste and improve eco-friendliness with smart suggestions
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-violet-500" />
                    Core AI Features
                  </h3>
                  <div className="space-y-3">
                    {aiFeatures.slice(0, 5).map((feature) => (
                      <Link key={feature.id} href={feature.route}>
                        <Button 
                          variant="outline" 
                          className="w-full justify-between h-auto py-2 group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${feature.color} text-white`}>
                              {React.cloneElement(feature.icon, { className: "h-4 w-4" })}
                            </div>
                            <span>{feature.title}</span>
                          </div>
                          <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Button>
                      </Link>
                    ))}
                    <Button 
                      variant="outline" 
                      className="w-full justify-center text-primary"
                      onClick={() => setActiveTab("all")}
                    >
                      View All Features
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discover Tab */}
        <TabsContent value="discover" className="m-0">
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full py-8 h-auto"
            onClick={() => setDirectoryOpen(true)}
          >
            <div className="text-center">
              <h3 className="text-xl font-medium mb-2">Open Feature Directory</h3>
              <p className="text-muted-foreground max-w-md">
                Browse our complete feature catalog organized by category, with detailed information and examples
              </p>
            </div>
          </Button>
        </TabsContent>
      </Tabs>

      <Dialog open={directoryOpen} onOpenChange={setDirectoryOpen}>
        <DialogContent className="max-w-[90vw] w-[1100px] p-0 sm:rounded-lg overflow-hidden">
          <FeatureDirectory 
            highlightedFeatureId={highlightedFeatureId}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 