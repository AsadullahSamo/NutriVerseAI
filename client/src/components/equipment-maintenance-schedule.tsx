import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Loader2, AlertTriangle, CalendarIcon, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { KitchenEquipment, MaintenanceSchedule, generateMaintenanceSchedule } from "../../../ai-services/kitchen-inventory-ai";
import { EquipmentMaintenanceDialog } from "./equipment-maintenance-dialog";

interface MaintenanceScheduleCardProps {
  equipment: KitchenEquipment[];
}

export function MaintenanceScheduleCard({ equipment }: MaintenanceScheduleCardProps) {
  const [maintenanceSchedule, setMaintenanceSchedule] = useState<MaintenanceSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const { toast } = useToast();
  
  useEffect(() => {
    async function fetchSchedule() {
      if (!equipment.length) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // We could fetch maintenance history from the API here if available
        // const maintenanceHistory = await fetchMaintenanceHistory();
        
        // For now, we'll just use the AI to generate a schedule based on equipment data
        const schedule = await generateMaintenanceSchedule(equipment);
        setMaintenanceSchedule(schedule);
      } catch (error) {
        console.error("Error generating maintenance schedule:", error);
        toast({
          title: "Couldn't generate maintenance schedule",
          description: "There was an error generating your maintenance schedule.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchSchedule();
  }, [equipment, toast]);
  
  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Maintenance Schedule</CardTitle>
          <CardDescription>
            View upcoming and overdue maintenance tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Generating your maintenance schedule...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!maintenanceSchedule || 
      (!maintenanceSchedule.upcoming.length && 
       !maintenanceSchedule.overdue.length && 
       !maintenanceSchedule.completed.length)) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Maintenance Schedule</CardTitle>
          <CardDescription>
            No maintenance tasks scheduled
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center gap-4">
            <CalendarIcon className="h-16 w-16 text-muted-foreground/30" />
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                No maintenance tasks found
              </p>
              <p className="text-sm text-muted-foreground">
                Add equipment with maintenance intervals to see scheduled tasks
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Maintenance Schedule</CardTitle>
        <CardDescription>
          Keep track of your equipment maintenance tasks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Upcoming</span>
              {maintenanceSchedule.upcoming.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {maintenanceSchedule.upcoming.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="overdue" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Overdue</span>
              {maintenanceSchedule.overdue.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {maintenanceSchedule.overdue.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Completed</span>
              {maintenanceSchedule.completed.length > 0 && (
                <Badge variant="outline" className="ml-1">
                  {maintenanceSchedule.completed.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="space-y-4">
            {maintenanceSchedule.upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No upcoming maintenance tasks</p>
              </div>
            ) : (
              maintenanceSchedule.upcoming.map((task) => (
                <Card key={`${task.equipmentId}-${task.maintenanceType}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-lg truncate">{task.equipmentName}</h3>
                        <p className="text-sm text-muted-foreground">{task.maintenanceType}</p>
                        <div className="flex items-center mt-2">
                          <CalendarIcon className="h-4 w-4 mr-2 text-blue-500" />
                          <p className="text-sm">Due: {task.dueDate}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          className={
                            task.priority === 'high'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : task.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }
                        >
                          {task.priority} priority
                        </Badge>
                        
                        {equipment.find(e => e.id === task.equipmentId) && (
                          <EquipmentMaintenanceDialog 
                            item={equipment.find(e => e.id === task.equipmentId)!} 
                          />
                        )}
                      </div>
                    </div>
                    
                    {task.tips && task.tips.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-medium mb-2">Maintenance Tips:</h4>
                        <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                          {task.tips.slice(0, 2).map((tip, index) => (
                            <li key={index}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="overdue" className="space-y-4">
            {maintenanceSchedule.overdue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No overdue maintenance tasks</p>
              </div>
            ) : (
              maintenanceSchedule.overdue.map((task) => (
                <Card 
                  key={`${task.equipmentId}-${task.maintenanceType}`} 
                  className="border-red-200 hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-lg truncate">{task.equipmentName}</h3>
                        <p className="text-sm text-muted-foreground">{task.maintenanceType}</p>
                        <div className="flex items-center mt-2">
                          <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                          <p className="text-sm text-red-600">Overdue by {task.overdueBy}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          variant="destructive"
                        >
                          {task.priority} priority
                        </Badge>
                        
                        {equipment.find(e => e.id === task.equipmentId) && (
                          <EquipmentMaintenanceDialog 
                            item={equipment.find(e => e.id === task.equipmentId)!} 
                          />
                        )}
                      </div>
                    </div>
                    
                    {task.tips && task.tips.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-medium mb-2">Maintenance Tips:</h4>
                        <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                          {task.tips.slice(0, 2).map((tip, index) => (
                            <li key={index}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4">
            {maintenanceSchedule.completed.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No completed maintenance tasks</p>
              </div>
            ) : (
              maintenanceSchedule.completed.map((task) => (
                <Card key={`${task.equipmentId}-${task.completedDate}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-lg truncate">{task.equipmentName}</h3>
                        <p className="text-sm text-muted-foreground">{task.maintenanceType}</p>
                        <div className="flex flex-col gap-1 mt-2">
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            <p className="text-sm">Completed: {task.completedDate}</p>
                          </div>
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-2 text-blue-500" />
                            <p className="text-sm">Next due: {task.nextDueDate}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}