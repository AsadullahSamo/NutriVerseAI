import React, { useEffect, useState } from 'react';
import { getEquipmentRecommendations, generateMaintenanceSchedule, getRecipesByEquipment } from '@/ai-services/kitchen-ai';
import { analyzeKitchenInventory, getMaintenanceTips, type KitchenEquipment as KitchenEquipmentType } from '@/ai-services/kitchen-inventory-ai';
import type { EquipmentRecommendation, MaintenanceSchedule } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, AlertTriangle, CheckCircle, XCircle, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';

const KitchenEquipmentPage: React.FC = () => {
  const [equipment, setEquipment] = useState<KitchenEquipmentType[]>([]);
  const [recommendations, setRecommendations] = useState<EquipmentRecommendation[]>([]);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState<MaintenanceSchedule[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<KitchenEquipmentType | null>(null);
  const [maintenanceTips, setMaintenanceTips] = useState<string[]>([]);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // Add equipment form states
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<KitchenEquipmentType>>({
    name: '',
    category: 'Appliances',
    condition: 'good',
    purchaseDate: format(new Date(), 'yyyy-MM-dd')
  });

  // Initial sample equipment for a better user experience when no equipment is fetched
  const sampleEquipment: KitchenEquipmentType[] = [
    { id: 1, name: 'Food Processor', category: 'Appliances', condition: 'excellent', lastMaintenanceDate: '2023-01-15', purchaseDate: '2022-05-10' },
    { id: 2, name: 'Stand Mixer', category: 'Appliances', condition: 'good', lastMaintenanceDate: '2023-02-20', purchaseDate: '2021-11-05' },
    { id: 3, name: 'Chef\'s Knife', category: 'Cutlery', condition: 'fair', purchaseDate: '2020-08-15' },
    { id: 4, name: 'Cast Iron Skillet', category: 'Cookware', condition: 'good', lastMaintenanceDate: '2023-03-10', purchaseDate: '2019-12-25' },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        // Try to get data from local storage first
        const storedEquipment = localStorage.getItem('kitchen-equipment');
        
        if (storedEquipment) {
          const parsedEquipment = JSON.parse(storedEquipment);
          console.log('Using equipment data from local storage');
          setEquipment(parsedEquipment);
          
          // Fetch AI analysis based on stored data
          await handleInitialAiRequests(parsedEquipment);
          return;
        }
        
        // If no local storage data, fetch from backend
        const equipmentData = await fetch('/api/kitchen-equipment').then(res => res.json())
          .catch(err => {
            console.log('Using sample equipment data for AI analysis');
            return sampleEquipment; // Use sample data if API fails, but still use real AI
          });
        
        setEquipment(equipmentData);
        // Also save to local storage
        localStorage.setItem('kitchen-equipment', JSON.stringify(equipmentData));

        // Directly trigger AI analysis when equipment is loaded
        await handleInitialAiRequests(equipmentData);
      } catch (error) {
        console.error('Error in initial data loading:', error);
        setApiError('There was an error loading your kitchen equipment data.');
        
        // Even if there's an error, we can still use the sample equipment for AI analysis
        setEquipment(sampleEquipment);
        // Save sample data to local storage as fallback
        localStorage.setItem('kitchen-equipment', JSON.stringify(sampleEquipment));
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  async function handleInitialAiRequests(equipmentData: KitchenEquipmentType[]) {
    setAiLoading(true);
    try {
      // First check if we have stored recommendations and recipe data
      const storedRecommendations = localStorage.getItem('kitchen-recommendations');
      const storedRecipes = localStorage.getItem('kitchen-recipes');
      const storedMaintenanceSchedule = localStorage.getItem('kitchen-maintenance-schedule');
      
      // Prepare data containers
      let recommendationsResult;
      let maintenanceResult;
      let recipesResult;
      
      // If we have stored data and it's not too old, use it
      // In a real app, you might want to check the timestamp to refresh after some time
      if (storedRecommendations && storedRecipes && storedMaintenanceSchedule) {
        console.log('Using stored AI analysis data');
        recommendationsResult = JSON.parse(storedRecommendations);
        maintenanceResult = JSON.parse(storedMaintenanceSchedule);
        recipesResult = { possibleRecipes: JSON.parse(storedRecipes) };
      } else {
        console.log('Fetching fresh AI analysis data');
        // Run all AI requests in parallel for better performance
        [recommendationsResult, maintenanceResult, recipesResult] = await Promise.all([
          getEquipmentRecommendations(equipmentData, ['Italian', 'Healthy Cooking']),
          generateMaintenanceSchedule(equipmentData, '2023-01-01', '2023-12-31'),
          getRecipesByEquipment(equipmentData, ['Italian', 'Healthy Cooking']),
        ]);
      }

      // Always ensure we have no duplicates in maintenance schedule based on equipment name
      if (Array.isArray(maintenanceResult)) {
        // First, get a mapping of equipment IDs to equipment names
        const equipmentNameMap = new Map();
        equipmentData.forEach(item => {
          equipmentNameMap.set(item.id, item.name);
        });
        
        // Create a set to track equipment names we've already seen
        const processedNames = new Set<string>();
        
        // Sort by priority - put items that need maintenance sooner at the beginning
        const sortedMaintenance = [...maintenanceResult].sort((a, b) => {
          // Compare dates - earlier dates first (higher priority)
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        
        // Filter the maintenance schedule to keep only unique equipment names
        const uniqueMaintenanceItems = [];
        
        for (const item of sortedMaintenance) {
          // Get the equipment name for this item
          const equipmentName = equipmentNameMap.get(item.equipmentId) || `Equipment #${item.equipmentId}`;
          
          // If we haven't seen this equipment name yet, keep this item
          if (!processedNames.has(equipmentName)) {
            processedNames.add(equipmentName);
            uniqueMaintenanceItems.push(item);
          }
        }
        
        maintenanceResult = uniqueMaintenanceItems;
        console.log(`Deduplicated maintenance schedule: ${maintenanceResult.length} items for ${equipmentData.length} equipment pieces`);
      } else {
        console.error('Maintenance result is not an array:', maintenanceResult);
        maintenanceResult = []; // Fallback
      }
      
      // Store results in local storage (with deduplicated maintenance)
      localStorage.setItem('kitchen-recommendations', JSON.stringify(recommendationsResult));
      localStorage.setItem('kitchen-maintenance-schedule', JSON.stringify(maintenanceResult));
      localStorage.setItem('kitchen-recipes', JSON.stringify(recipesResult.possibleRecipes));

      setRecommendations(recommendationsResult);
      setMaintenanceSchedule(maintenanceResult);
      setRecipes(recipesResult.possibleRecipes);
      
      setNotification({
        type: 'success',
        message: 'AI analysis completed successfully!'
      });

    } catch (error) {
      console.error('Error in AI analysis:', error);
      setApiError('There was an error analyzing your kitchen equipment. The AI service may be temporarily unavailable.');
    } finally {
      setAiLoading(false);
      setLoading(false);
    }
  }

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const getConditionColor = (condition: string) => {
    switch(condition) {
      case 'excellent': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'good': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'fair': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'needs-maintenance': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      case 'replace': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const handleUpdateStatus = async (item: KitchenEquipmentType) => {
    setSelectedEquipment(item);
    setAiLoading(true);
    try {
      // Get AI-powered maintenance tips - Direct AI call
      console.log('Getting AI maintenance tips for:', item.name);
      const tips = await getMaintenanceTips(item);
      setMaintenanceTips(tips);
      setMaintenanceDialogOpen(true);
    } catch (error) {
      console.error('Error getting maintenance tips:', error);
      setNotification({
        type: 'error',
        message: 'Failed to get maintenance tips. Please try again.'
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddToShoppingList = async (rec: EquipmentRecommendation) => {
    try {
      await fetch('/api/shopping-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ item: rec.name, category: 'Kitchen Equipment', priority: rec.priority }),
      });
      setNotification({
        type: 'success',
        message: `${rec.name} has been added to your shopping list.`
      });
    } catch (error) {
      console.error('Error adding to shopping list:', error);
      setNotification({
        type: 'error',
        message: 'Failed to add item to shopping list. Please try again.'
      });
    }
  };

  const handleDismissRecommendation = (id: number) => {
    const updatedRecommendations = recommendations.filter(rec => rec.id !== id);
    setRecommendations(updatedRecommendations);
    
    // Save updated recommendations to local storage
    localStorage.setItem('kitchen-recommendations', JSON.stringify(updatedRecommendations));
    
    setNotification({
      type: 'success',
      message: 'Recommendation has been removed from your list.'
    });
  };

  const handleMarkComplete = async (scheduleItem: MaintenanceSchedule) => {
    try {
      // Update maintenance record
      const item = equipment.find(e => e.id === scheduleItem.equipmentId);
      if (item) {
        const updatedItem = { ...item, lastMaintenanceDate: new Date().toISOString() };
        // Update equipment state with the new maintenance date
        const updatedEquipment = equipment.map(e => e.id === item.id ? updatedItem : e);
        setEquipment(updatedEquipment);
        
        // Save updated equipment to local storage
        localStorage.setItem('kitchen-equipment', JSON.stringify(updatedEquipment));
      }
      
      // Remove from maintenance schedule
      const updatedSchedule = maintenanceSchedule.filter(s => s.equipmentId !== scheduleItem.equipmentId);
      setMaintenanceSchedule(updatedSchedule);
      
      // Also save the updated maintenance schedule to local storage
      localStorage.setItem('kitchen-maintenance-schedule', JSON.stringify(updatedSchedule));
      
      setNotification({
        type: 'success',
        message: `Maintenance tasks for ${item?.name || 'this item'} have been marked as complete.`
      });
    } catch (error) {
      console.error('Error marking maintenance complete:', error);
      setNotification({
        type: 'error',
        message: 'Failed to update maintenance record. Please try again.'
      });
    }
  };

  const handleViewRecipe = (recipeId: number) => {
    // Instead of navigating to a non-existent route, show recipe details in a dialog
    try {
      // Find the recipe in our current state
      const recipe = recipes.find(r => r.id === recipeId);
      if (recipe) {
        // Show recipe details in a notification
        setNotification({
          type: 'success',
          message: `Recipe "${recipe.title}" would normally open in the recipe viewer. This is a placeholder for that functionality.`
        });
        
        // In a real app, you would navigate to the recipe page or open a modal
        // window.location.href = `/recipes/${recipeId}`;
      } else {
        setNotification({
          type: 'error',
          message: 'Recipe not found.'
        });
      }
    } catch (error) {
      console.error('Error viewing recipe:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load recipe details.'
      });
    }
  };

  const handleRunAIAnalysis = async () => {
    setAiLoading(true);
    try {
      console.log('Running AI analysis on kitchen equipment...');
      // Direct AI call for analysis
      const analysis = await analyzeKitchenInventory(equipment, ['Italian', 'Baking', 'Healthy']);
      console.log('AI analysis complete:', analysis);
      
      // Ensure analysis has the expected structure
      const validatedAnalysis = {
        maintenanceRecommendations: Array.isArray(analysis.maintenanceRecommendations) 
          ? analysis.maintenanceRecommendations 
          : [],
        shoppingRecommendations: Array.isArray(analysis.shoppingRecommendations) 
          ? analysis.shoppingRecommendations 
          : [],
        recipeRecommendations: Array.isArray(analysis.recipeRecommendations) 
          ? analysis.recipeRecommendations 
          : []
      };
      
      setAiAnalysis(validatedAnalysis);
      setAnalysisDialogOpen(true);
      setNotification({
        type: 'success',
        message: 'AI analysis completed successfully!'
      });
    } catch (error) {
      console.error('Error running AI analysis:', error);
      // Set a default structure to prevent mapping errors
      setAiAnalysis({
        maintenanceRecommendations: [],
        shoppingRecommendations: [],
        recipeRecommendations: []
      });
      
      setNotification({
        type: 'error',
        message: 'Failed to run AI analysis. Please try again.'
      });
    } finally {
      setAiLoading(false);
    }
  };
  
  // New functions for equipment form
  const openAddEquipmentDialog = () => {
    setFormData({
      name: '',
      category: 'Appliances',
      condition: 'good',
      purchaseDate: format(new Date(), 'yyyy-MM-dd')
    });
    setIsEditing(false);
    setEquipmentDialogOpen(true);
  };
  
  const openEditEquipmentDialog = (item: KitchenEquipmentType) => {
    setFormData({
      id: item.id,
      name: item.name,
      category: item.category,
      condition: item.condition,
      purchaseDate: item.purchaseDate,
      lastMaintenanceDate: item.lastMaintenanceDate
    });
    setIsEditing(true);
    setEquipmentDialogOpen(true);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmitEquipment = async () => {
    if (!formData.name || !formData.category || !formData.condition) {
      setNotification({
        type: 'error',
        message: 'Please fill in all required fields'
      });
      return;
    }
    
    try {
      // In a real application, you would save this to your backend
      const updatedEquipment = [...equipment];
      
      if (isEditing && formData.id) {
        // Update existing equipment
        const index = updatedEquipment.findIndex(item => item.id === formData.id);
        if (index !== -1) {
          updatedEquipment[index] = formData as KitchenEquipmentType;
        }
      } else {
        // Add new equipment with a generated ID
        const newId = Math.max(0, ...equipment.map(e => e.id)) + 1;
        updatedEquipment.push({
          ...formData,
          id: newId
        } as KitchenEquipmentType);
      }
      
      setEquipment(updatedEquipment);
      // Save updated equipment to local storage
      localStorage.setItem('kitchen-equipment', JSON.stringify(updatedEquipment));
      setEquipmentDialogOpen(false);
      setNotification({
        type: 'success',
        message: isEditing 
          ? `${formData.name} has been updated successfully` 
          : `${formData.name} has been added to your equipment`
      });
      
      // Regenerate AI analysis with the updated equipment
      // This ensures recommendations stay in sync with your inventory
      setAiLoading(true);
      try {
        // Run AI analysis on the updated equipment set
        const [recResults, maintResults, recipeResults] = await Promise.all([
          getEquipmentRecommendations(updatedEquipment, ['Italian', 'Healthy Cooking']),
          generateMaintenanceSchedule(updatedEquipment, '2023-01-01', '2023-12-31'),
          getRecipesByEquipment(updatedEquipment, ['Italian', 'Healthy Cooking']),
        ]);
        
        // Update state and local storage
        setRecommendations(recResults);
        setMaintenanceSchedule(maintResults);
        setRecipes(recipeResults.possibleRecipes);
        
        // Save updated AI results to local storage
        localStorage.setItem('kitchen-recommendations', JSON.stringify(recResults));
        localStorage.setItem('kitchen-maintenance-schedule', JSON.stringify(maintResults));
        localStorage.setItem('kitchen-recipes', JSON.stringify(recipeResults.possibleRecipes));
      } catch (aiError) {
        console.error('Error refreshing AI analysis:', aiError);
        // Don't show an error notification here since we already showed a success message for the equipment update
      } finally {
        setAiLoading(false);
      }
    } catch (error) {
      console.error('Error saving equipment:', error);
      setNotification({
        type: 'error',
        message: 'Failed to save equipment. Please try again.'
      });
    }
  };

  const handleDeleteEquipment = async (id: number) => {
    try {
      // In a real application, you would delete this from your backend
      const updatedEquipment = equipment.filter(item => item.id !== id);
      setEquipment(updatedEquipment);
      // Save updated equipment to local storage
      localStorage.setItem('kitchen-equipment', JSON.stringify(updatedEquipment));
      setNotification({
        type: 'success',
        message: 'Equipment has been deleted successfully.'
      });
    } catch (error) {
      console.error('Error deleting equipment:', error);
      setNotification({
        type: 'error',
        message: 'Failed to delete equipment. Please try again.'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Progress className="w-[60%] h-2" value={40} />
        <p className="mt-4">Loading kitchen equipment data and running AI analysis...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2 text-center">Kitchen Equipment Management</h1>
      <p className="text-center mb-6 text-muted-foreground">AI-powered insights for your kitchen inventory</p>
      
      {apiError && (
        <Alert className="mb-4 bg-red-50 border-red-200">
          <div className="flex gap-2 items-center">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertTitle>Error</AlertTitle>
          </div>
          <AlertDescription className="ml-6">{apiError}</AlertDescription>
        </Alert>
      )}
      
      {notification && (
        <Alert className={`mb-4 ${notification.type === 'success' ? 'bg-green-900/40 border-green-700 text-green-200' : 'bg-red-900/40 border-red-700 text-red-200'}`}>
          <div className="flex gap-2 items-center">
            {notification.type === 'success' ? <CheckCircle className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
            <AlertTitle>{notification.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
          </div>
          <AlertDescription className="ml-6">{notification.message}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <Button 
          onClick={handleRunAIAnalysis} 
          disabled={aiLoading} 
          className="flex items-center gap-2"
        >
          {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
          Run AI Analysis on Your Kitchen
        </Button>
        
        <Button 
          onClick={openAddEquipmentDialog} 
          className="flex items-center gap-2"
          variant="outline"
        >
          <PlusCircle className="h-4 w-4" />
          Add Equipment
        </Button>
      </div>
      
      <Tabs defaultValue="equipment" className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="recipes">Recipe Matches</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {equipment.map(item => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle>{item.name}</CardTitle>
                    <Badge className={getConditionColor(item.condition)} variant="secondary">{item.condition}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p><span className="font-semibold">Category:</span> {item.category}</p>
                  {item.purchaseDate && <p><span className="font-semibold">Purchased:</span> {new Date(item.purchaseDate).toLocaleDateString()}</p>}
                  {item.lastMaintenanceDate && <p><span className="font-semibold">Last Maintenance:</span> {new Date(item.lastMaintenanceDate).toLocaleDateString()}</p>}
                </CardContent>
                <CardFooter className="flex justify-between gap-2 border-t">
                  <Button 
                    className="flex-1" 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleUpdateStatus(item)}
                    disabled={aiLoading}
                  >
                    {aiLoading && selectedEquipment?.id === item.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    AI Maintenance Tips
                  </Button>
                  <Button 
                    className="flex-1"
                    variant="ghost" 
                    size="sm"
                    onClick={() => openEditEquipmentDialog(item)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    className="flex-1"
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteEquipment(item.id)}
                    title="Delete equipment"
                  >
                    <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {recommendations.length > 0 ? (
              recommendations.map(rec => (
                <Card key={rec.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle>{rec.name}</CardTitle>
                      <Badge className={getPriorityColor(rec.priority)} variant="secondary">{rec.priority} priority</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p>{rec.reason}</p>
                  </CardContent>
                  <CardFooter className="flex gap-2 border-t">
                    <Button 
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAddToShoppingList(rec)}
                    >
                      Add to Shopping List
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDismissRecommendation(rec.id)}
                    >
                      Dismiss
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-2 flex flex-col items-center justify-center p-8 bg-secondary/10 border border-dashed border-border rounded-md">
                <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                <p className="text-center mb-2 text-muted-foreground">No AI recommendations yet.</p>
                <Button 
                  size="sm" 
                  onClick={() => handleRunAIAnalysis()}
                >
                  Get Recommendations
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <div className="mb-4 p-4 bg-secondary/10 border border-border rounded-md">
            <h3 className="text-lg font-semibold mb-2">AI-Powered Maintenance Center</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Our AI analyzes your equipment conditions and usage patterns to suggest optimal maintenance schedules.
            </p>
            <div className="flex justify-end">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleRunAIAnalysis()}
                disabled={aiLoading}
                className="flex items-center gap-2"
              >
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Refresh Maintenance Recommendations
              </Button>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {maintenanceSchedule.length > 0 ? (
              maintenanceSchedule.map(schedule => {
                const item = equipment.find(e => e.id === schedule.equipmentId);
                // Calculate if maintenance is upcoming (within 7 days)
                const isUpcoming = new Date(schedule.date).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000;
                // Calculate if maintenance is overdue
                const isOverdue = new Date(schedule.date).getTime() < new Date().getTime();
                
                // Use consistent badge styling with other components
                const statusClassName = isOverdue 
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  : isUpcoming 
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
                
                return (
                  <Card 
                    key={schedule.equipmentId} 
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle>{item?.name || `Equipment #${schedule.equipmentId}`}</CardTitle>
                        <Badge className={statusClassName} variant="secondary">
                          {isOverdue ? 'Overdue' : isUpcoming ? 'Upcoming' : 'Scheduled'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p><span className="font-semibold">Scheduled Date:</span> {new Date(schedule.date).toLocaleDateString()}</p>
                      {item?.lastMaintenanceDate && (
                        <p><span className="font-semibold">Last Maintained:</span> {new Date(item.lastMaintenanceDate).toLocaleDateString()}</p>
                      )}
                      <div className="mt-2">
                        <p className="font-semibold">Tasks:</p>
                        <ScrollArea className="h-20 mt-1 bg-secondary/10 rounded border border-border p-2">
                          <ul className="list-disc pl-5">
                            {schedule.tasks.map((task, i) => (
                              <li key={i}>{task}</li>
                            ))}
                          </ul>
                        </ScrollArea>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2 border-t">
                      <Button 
                        className="flex-1" 
                        size="sm"
                        onClick={() => handleMarkComplete(schedule)}
                        variant={isOverdue ? "destructive" : "outline"}
                      >
                        Mark Complete
                      </Button>
                      <Button 
                        className="flex-1"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleUpdateStatus(item || { id: schedule.equipmentId, name: `Equipment #${schedule.equipmentId}`, category: 'Unknown', condition: 'unknown' })}
                      >
                        Get Tips
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-2 flex flex-col items-center justify-center p-8 bg-secondary/10 border border-dashed border-border rounded-md">
                <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                <p className="text-center mb-2 text-muted-foreground">No maintenance schedules yet.</p>
                <Button 
                  size="sm" 
                  onClick={() => handleRunAIAnalysis()}
                >
                  Generate Maintenance Schedule
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="recipes" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {recipes.length > 0 ? (
              recipes.map(recipe => (
                <Card key={recipe.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle>{recipe.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold">Required Equipment:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {recipe.requiredEquipment.map((eq: string, i: number) => (
                        <Badge key={i} variant="secondary" className="bg-secondary/30">{eq}</Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t">
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => handleViewRecipe(recipe.id)}
                    >
                      View Recipe
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-2 flex flex-col items-center justify-center p-8 bg-secondary/10 border border-dashed border-border rounded-md">
                <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                <p className="text-center mb-2 text-muted-foreground">No recipe matches yet.</p>
                <Button 
                  size="sm" 
                  onClick={() => handleRunAIAnalysis()}
                >
                  Find Recipe Matches
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Maintenance Tips Dialog */}
      <Dialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>AI Maintenance Tips for {selectedEquipment?.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[300px] mt-4">
            <ul className="list-disc pl-5 space-y-2">
              {maintenanceTips.map((tip, index) => (
                <li key={index}>{String(tip)}</li>
              ))}
            </ul>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <Button onClick={() => setMaintenanceDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Equipment Add/Edit Dialog */}
      <Dialog open={equipmentDialogOpen} onOpenChange={setEquipmentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Equipment' : 'Add Equipment'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="e.g., Stand Mixer"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleSelectChange('category', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="Appliances">Appliances</SelectItem>
                    <SelectItem value="Cookware">Cookware</SelectItem>
                    <SelectItem value="Cutlery">Cutlery</SelectItem>
                    <SelectItem value="Utensils">Utensils</SelectItem>
                    <SelectItem value="Bakeware">Bakeware</SelectItem>
                    <SelectItem value="Storage">Storage</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="condition" className="text-right">
                Condition
              </Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => handleSelectChange('condition', value as any)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="needs-maintenance">Needs Maintenance</SelectItem>
                    <SelectItem value="replace">Replace</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="purchaseDate" className="text-right">
                Purchase Date
              </Label>
              <Input
                id="purchaseDate"
                name="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastMaintenanceDate" className="text-right">
                Last Maintenance
              </Label>
              <Input
                id="lastMaintenanceDate"
                name="lastMaintenanceDate"
                type="date"
                value={formData.lastMaintenanceDate}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEquipmentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitEquipment}>{isEditing ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Analysis Dialog */}
      <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>AI Analysis of Your Kitchen Equipment</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] mt-4">
            {aiAnalysis && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold">Maintenance Recommendations</h3>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    {aiAnalysis.maintenanceRecommendations && aiAnalysis.maintenanceRecommendations.length > 0 ? (
                      aiAnalysis.maintenanceRecommendations.map((rec: any, index: number) => (
                        <li key={index} className="space-y-1">
                          <div><span className="font-medium">{rec.equipmentId}:</span> {rec.recommendation}</div>
                          <div className="text-sm">Priority: <Badge className={getPriorityColor(rec.priority)}>{rec.priority}</Badge></div>
                          <div className="text-sm text-muted-foreground">Action: {rec.suggestedAction}</div>
                        </li>
                      ))
                    ) : (
                      <li>No maintenance recommendations available.</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Shopping Recommendations</h3>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    {aiAnalysis.shoppingRecommendations && aiAnalysis.shoppingRecommendations.length > 0 ? (
                      aiAnalysis.shoppingRecommendations.map((rec: any, index: number) => (
                        <li key={index} className="space-y-1">
                          <div><span className="font-medium">{rec.itemName}</span> - {rec.reason}</div>
                          <div className="text-sm">Priority: <Badge className={getPriorityColor(rec.priority)}>{rec.priority}</Badge></div>
                          {rec.estimatedPrice && <div className="text-sm text-muted-foreground">Est. price: {rec.estimatedPrice}</div>}
                        </li>
                      ))
                    ) : (
                      <li>No shopping recommendations available.</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Recipe Recommendations</h3>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    {aiAnalysis.recipeRecommendations && aiAnalysis.recipeRecommendations.length > 0 ? (
                      aiAnalysis.recipeRecommendations.map((rec: any, index: number) => (
                        <li key={index} className="space-y-1">
                          <div><span className="font-medium">{rec.recipeName}</span></div>
                          <div className="text-sm">{rec.possibleWithCurrent ? 'Possible with current equipment' : 'Requires additional equipment'}</div>
                          <div className="text-sm">Required: {rec.requiredEquipment && rec.requiredEquipment.length > 0 ? rec.requiredEquipment.join(', ') : 'None specified'}</div>
                        </li>
                      ))
                    ) : (
                      <li>No recipe recommendations available.</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </ScrollArea>
          <DialogFooter className="mt-4">
            <Button onClick={() => setAnalysisDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KitchenEquipmentPage;