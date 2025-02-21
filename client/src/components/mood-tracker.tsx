import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SmilePlus } from "lucide-react";

interface MoodTrackerProps {
  recipeId: number;
}

export function MoodTracker({ recipeId }: MoodTrackerProps) {
  const [entry, setEntry] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

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
        description: "Your cooking experience has been recorded.",
      });
    },
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">How did cooking make you feel?</h3>
      <Textarea
        placeholder="Share your cooking experience..."
        value={entry}
        onChange={(e) => setEntry(e.target.value)}
        className="min-h-[100px]"
      />
      <Button 
        onClick={() => moodMutation.mutate()}
        disabled={!entry.trim() || moodMutation.isPending}
      >
        <SmilePlus className="h-4 w-4 mr-2" />
        Track Mood
      </Button>
    </div>
  );
}
