import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { useGroupStore } from "@/hooks/useGroupStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, ExternalLink, Star } from "lucide-react";
import spaceHeroBg from "@/assets/space-hero-bg.jpg";

export default function CopilotEnhanced() {
  const { scenarioId } = useParams();
  const { groupId, groupName } = useGroupStore();
  const [submission, setSubmission] = useState<any>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!groupId || !scenarioId) {
      navigate("/");
      return;
    }
    loadSubmission();
  }, [groupId, scenarioId]);

  const loadSubmission = async () => {
    try {
      const { data, error } = await supabase
        .from("copilot_submissions")
        .select("*")
        .eq("group_id", groupId)
        .eq("scenario_id", scenarioId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error("No submission found");
        navigate(`/scenario/${scenarioId}/copilot`);
        return;
      }
      setSubmission(data);
      setUserRating(data.user_rating || 0);
    } catch (error) {
      console.error("Error loading submission:", error);
      toast.error("Failed to load submission");
    }
  };

  const handleCopyPrompt = () => {
    if (submission?.enhanced_prompt) {
      navigator.clipboard.writeText(submission.enhanced_prompt);
      toast.success("Enhanced prompt copied to clipboard!");
    }
  };

  const handleOpenCopilot = () => {
    window.open("https://copilot.microsoft.com", "_blank");
  };

  const handleRating = async (rating: number) => {
    setUserRating(rating);
    try {
      const { error } = await supabase
        .from("copilot_submissions")
        .update({ user_rating: rating })
        .eq("id", submission.id);

      if (error) throw error;
      toast.success("Rating saved!");
    } catch (error) {
      console.error("Error saving rating:", error);
      toast.error("Failed to save rating");
    }
  };

  const handleNext = () => {
    navigate(`/scenario/${scenarioId}/complete`);
  };

  if (!submission) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header groupName={groupName || undefined} />

      <div
        className="relative py-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${spaceHeroBg})` }}
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        <div className="container mx-auto px-6 relative z-10">
          <h1 className="text-4xl font-bold mb-4">Enhanced Prompt</h1>
          <p className="text-lg text-muted-foreground">
            Use this improved prompt with Microsoft Copilot
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Enhanced Prompt Display */}
          <Card className="p-6 border-border bg-card/50 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-4">Your Enhanced Prompt</h2>
            <p className="text-foreground whitespace-pre-wrap mb-4 p-4 bg-muted/50 rounded-md">
              {submission.enhanced_prompt || submission.prompt}
            </p>
          </Card>

          {/* Action Buttons */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 border-border bg-card/50 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4">Copy Prompt</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Copy the enhanced prompt to your clipboard
              </p>
              <Button onClick={handleCopyPrompt} className="w-full">
                <Copy className="w-4 h-4 mr-2" />
                Copy to Clipboard
              </Button>
            </Card>

            <Card className="p-6 border-border bg-card/50 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4">Open Copilot</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Open Microsoft Copilot in a new tab
              </p>
              <Button onClick={handleOpenCopilot} className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Copilot
              </Button>
            </Card>
          </div>

          {/* Rating Section */}
          <Card className="p-6 border-border bg-card/50 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-4">Rate This Prompt</h2>
            <p className="text-sm text-muted-foreground mb-4">
              How would you rate the quality of the enhanced prompt?
            </p>
            <div className="flex gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= userRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground hover:text-yellow-400"
                    }`}
                  />
                </button>
              ))}
            </div>
          </Card>

          {/* Next Button */}
          <div className="flex justify-end">
            <Button onClick={handleNext} size="lg" className="px-8">
              Next →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
