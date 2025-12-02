import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/Header";
import { useGroupStore } from "@/hooks/useGroupStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star } from "lucide-react";
import spaceHeroBg from "@/assets/space-hero-bg.jpg";

export default function CopilotFeedback() {
  const { scenarioId } = useParams();
  const { groupId, groupName } = useGroupStore();
  const [submission, setSubmission] = useState<any>(null);
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
    } catch (error) {
      console.error("Error loading submission:", error);
      toast.error("Failed to load feedback");
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

  const getStarsFromScore = (score: number): number => {
    if (score >= 18) return 5;
    if (score >= 14) return 4;
    if (score >= 10) return 3;
    if (score >= 6) return 2;
    if (score >= 1) return 1;
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 18) return "Excellent prompt – High-quality results expected";
    if (score >= 14) return "Good prompt – Minor improvements needed";
    if (score >= 10) return "Fair prompt – Clarifications required";
    if (score >= 6) return "Poor prompt – Copilot will struggle";
    return "Very poor prompt – Rewrite needed";
  };

  const renderStars = (stars: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-8 h-8 ${
              star <= stars
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header groupName={groupName || undefined} />

      <div
        className="relative py-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${spaceHeroBg})` }}
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        <div className="container mx-auto px-6 relative z-10">
          <h1 className="text-4xl font-bold mb-4">Your Prompt Feedback</h1>
          <p className="text-lg text-muted-foreground">
            Review your AI-generated feedback and score
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Original Prompt Card */}
          <Card className="p-6 border-border bg-card/50 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-4">Your Original Prompt</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {submission.prompt}
            </p>
          </Card>

          {/* Score and Feedback Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* AI Score Card */}
            <Card className="p-6 border-border bg-card/50 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-4">AI Score</h2>
              <div className="flex flex-col items-center gap-4">
                {renderStars(getStarsFromScore(submission.ai_score || 0))}
                <p className="text-4xl font-bold text-primary">
                  {submission.ai_score?.toFixed(0) || "0"} / 20
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  {getScoreLabel(submission.ai_score || 0)}
                </p>
              </div>
            </Card>

            {/* AI Feedback Card */}
            <Card className="p-6 border-border bg-card/50 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-4">AI Feedback</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {submission.feedback || "No feedback available"}
              </p>
            </Card>
          </div>

          {/* Rubric Component Breakdown */}
          <Card className="p-6 border-border bg-card/50 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-6">Rubric Component Breakdown</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">A. Goal (Clarity of Purpose)</span>
                  <span className="text-primary font-semibold">{submission.goal_score || 0} / 5</span>
                </div>
                <Progress value={((submission.goal_score || 0) / 5) * 100} className="h-3" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">B. Context (Background Information)</span>
                  <span className="text-primary font-semibold">{submission.context_score || 0} / 5</span>
                </div>
                <Progress value={((submission.context_score || 0) / 5) * 100} className="h-3" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">C. Source (Reference Material)</span>
                  <span className="text-primary font-semibold">{submission.source_score || 0} / 5</span>
                </div>
                <Progress value={((submission.source_score || 0) / 5) * 100} className="h-3" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">D. Expectation (Output Format & Quality)</span>
                  <span className="text-primary font-semibold">{submission.expectation_score || 0} / 5</span>
                </div>
                <Progress value={((submission.expectation_score || 0) / 5) * 100} className="h-3" />
              </div>
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
