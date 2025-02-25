import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SmilePlus, ChartLine, Sparkles, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MoodEntry } from "@shared/schema";

interface MoodTrackerProps {
  recipeId: number;
}

export function MoodTracker({ recipeId }: MoodTrackerProps) {
  const [entry, setEntry] = useState("");
  const [showInsights, setShowInsights] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const moodEntriesQuery = useQuery({
    queryKey: ["moodEntries", recipeId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/mood-journal/${recipeId}`);
      return res.json() as Promise<MoodEntry[]>;
    },
  });

  const moodMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/mood-journal", {
        recipeId,
        entry,
        userId: user?.id,
        timestamp: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      setEntry("");
      toast({
        title: "Mood tracked!",
        description: "Your cooking experience has been recorded and analyzed.",
      });
      moodEntriesQuery.refetch();
    },
  });

  const deleteMoodEntryMutation = useMutation({
    mutationFn: async (timestamp: string) => {
      const res = await apiRequest("DELETE", `/api/mood-journal/${recipeId}/${encodeURIComponent(timestamp)}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moodEntries", recipeId] });
      toast({
        title: "Entry deleted",
        description: "Your cooking experience entry has been deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const insightsQuery = useQuery({
    queryKey: ["moodInsights", recipeId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/mood-journal/${recipeId}/insights`);
      return res.json() as Promise<{ insights: string }>;
    },
    enabled: showInsights,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">How did cooking make you feel?</h3>
        {(moodEntriesQuery.data ?? []).length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setShowInsights(true)}>
            <ChartLine className="h-4 w-4 mr-2" />
            View Insights
          </Button>
        )}
      </div>

      <Card className="p-4">
        <Textarea
          placeholder="Share your cooking experience..."
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          className="min-h-[100px] mb-4"
        />
        <Button
          onClick={() => moodMutation.mutate()}
          disabled={!entry.trim() || moodMutation.isPending}
        >
          <SmilePlus className="h-4 w-4 mr-2" />
          Track Mood
        </Button>
      </Card>

      {(moodEntriesQuery.data ?? []).map((moodEntry, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">
                {new Date(moodEntry.timestamp).toLocaleDateString()}
              </p>
              <p className="mb-2">{moodEntry.entry}</p>
              {moodEntry.emotions && Array.isArray(moodEntry.emotions) && moodEntry.emotions.length > 0 && (
                <div className="flex gap-2">
                  {moodEntry.emotions.map((emotion, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                    >
                      {emotion}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this cooking experience entry? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMoodEntryMutation.mutate(moodEntry.timestamp)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>
      ))}

      <Dialog open={showInsights} onOpenChange={setShowInsights}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center text-xl">
              <Sparkles className="h-5 w-5 mr-2 text-primary" />
              Mood Insights
            </DialogTitle>
          </DialogHeader>
          
          <Card>
            <CardContent className="p-6">
              {insightsQuery.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm">Analyzing your mood patterns...</span>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="text-foreground leading-relaxed space-y-4 whitespace-pre-wrap">
                    {insightsQuery.data?.insights}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  );
}
