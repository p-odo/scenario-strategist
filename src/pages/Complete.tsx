import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/Header";
import { useGroupStore } from "@/hooks/useGroupStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Star, Sparkles } from "lucide-react";
import spaceHeroBg from "@/assets/space-hero-bg.jpg";

export default function Complete() {
  const { scenarioId } = useParams();
  const { groupId, groupName } = useGroupStore();
  const [scenario, setScenario] = useState<any>(null);
  
  // Scenario Scores
  const [score, setScore] = useState<number | null>(null);
  const [businessScore, setBusinessScore] = useState<number>(0);
  const [timeScore, setTimeScore] = useState<number>(0);
  const [costScore, setCostScore] = useState<number>(0);
  const [maxScore, setMaxScore] = useState<number>(0);

  // NEW: AI Score
  const [aiScore, setAiScore] = useState<number | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!groupId || !scenarioId) {
      navigate("/");
      return;
    }
    loadData();
  }, [groupId, scenarioId]);

  const loadData = async () => {
    try {
      // 1. Load Scenario
      const scenarioResult = await supabase
        .from("scenarios")
        .select("*")
        .eq("id", scenarioId)
        .maybeSingle();

      if (scenarioResult.error || !scenarioResult.data) {
        toast.error("Scenario not found");
        navigate("/home");
        return;
      }
      setScenario(scenarioResult.data);

      // 2. Load Tasks (to verify completion)
      const tasksResult = await supabase
        .from("tasks")
        .select("id")
        .eq("scenario_id", scenarioId);

      const taskIds = tasksResult.data?.map((t) => t.id) || [];

      // 3. Load Group Choices (For Scenario Score)
      const choicesResult = await supabase
        .from("group_choices")
        .select("id, task_id, option_id, created_at")
        .eq("group_id", groupId)
        .in("task_id", taskIds);

      // 4. Load AI Submission (For AI Score) -- NEW
      const submissionResult = await supabase
        .from("copilot_submissions")
        .select("ai_score")
        .eq("group_id", groupId)
        .eq("scenario_id", scenarioId)
        .order("created_at", { ascending: false }) // Get latest
        .limit(1)
        .maybeSingle();
      
      if (submissionResult.data) {
        setAiScore(submissionResult.data.ai_score);
      }

      // --- Calculate Scenario Score Logic ---
      if (choicesResult.data && choicesResult.data.length > 0) {
        // Keep only latest choice per task
        const latestChoiceByTask: Record<string, any> = {};
        choicesResult.data.forEach((choice) => {
          const existing = latestChoiceByTask[choice.task_id];
          if (!existing || new Date(choice.created_at) > new Date(existing.created_at)) {
            latestChoiceByTask[choice.task_id] = choice;
          }
        });
        const uniqueChoices = Object.values(latestChoiceByTask);

        // Get options to calculate weighted score
        const optionIds = uniqueChoices.map((c) => c.option_id);
        const optionsResult = await supabase.from("options").select("*").in("id", optionIds);

        let totalScore = 0;
        let totalBusiness = 0;
        let totalTime = 0;
        let totalCost = 0;

        uniqueChoices.forEach((choice) => {
          const option = optionsResult.data?.find((opt) => opt.id === choice.option_id);
          if (option) {
            const weightedScore =
              option.business_impact_score * 0.4 +
              option.time_score * 0.3 +
              option.cost_score * 0.3;
            totalScore += weightedScore;
            totalBusiness += option.business_impact_score;
            totalTime += option.time_score;
            totalCost += option.cost_score;
          }
        });

        const maxPossible = uniqueChoices.length * 5;
        setScore(totalScore);
        setBusinessScore(totalBusiness);
        setTimeScore(totalTime);
        setCostScore(totalCost);
        setMaxScore(maxPossible);
      }

      // Mark as completed
      await supabase
        .from("group_progress")
        .update({ completed_at: new Date().toISOString() })
        .eq("group_id", groupId)
        .eq("scenario_id", scenarioId);

    } catch (error) {
      console.error("Error in loadData:", error);
      toast.error("An error occurred while loading data");
    }
  };

  const handleComplete = async () => {
    try {
      // Logic to reset session (delete choices, reset progress)
      const tasksResult = await supabase.from("tasks").select("id").eq("scenario_id", scenarioId);
      const taskIds = tasksResult.data?.map((t) => t.id) || [];

      if (taskIds.length > 0) {
        await supabase.from("group_choices").delete().eq("group_id", groupId).in("task_id", taskIds);
      }
      
      // Also reset Copilot submissions if you want a clean slate? 
      // await supabase.from("copilot_submissions").delete().eq("group_id", groupId).eq("scenario_id", scenarioId);

      await supabase
        .from("group_progress")
        .update({ current_task: 1, started_at: null, completed_at: null })
        .eq("group_id", groupId)
        .eq("scenario_id", scenarioId);

      toast.success("Session completed and reset successfully");
      navigate("/home");
    } catch (error) {
      console.error("Error resetting session:", error);
      toast.error("Failed to reset session");
    }
  };

  // --- Helpers for AI Score Display ---
  const getStarsFromScore = (score: number): number => {
    if (score >= 18) return 5;
    if (score >= 14) return 4;
    if (score >= 10) return 3;
    if (score >= 6) return 2;
    if (score >= 1) return 1;
    return 0;
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 18) return "Excellent prompt – High-quality results";
    if (score >= 14) return "Good prompt – Minor improvements needed";
    if (score >= 10) return "Fair prompt – Clarifications required";
    if (score >= 6) return "Poor prompt – Copilot will struggle";
    return "Very poor prompt – Rewrite needed";
  };

  const renderStars = (stars: number) => {
    return (
      <div className="flex gap-1 justify-center my-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-6 h-6 ${
              star <= stars
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    );
  };

  if (!scenario) return <div className="min-h-screen bg-background flex items-center justify-center"><p>Loading...</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <Header groupName={groupName || undefined} />

      <div className="relative py-20 bg-cover bg-center" style={{ backgroundImage: `url(${spaceHeroBg})` }}>
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        <div className="container mx-auto px-6 relative z-10">
          <Button variant="ghost" className="mb-6 text-foreground hover:text-primary" onClick={() => navigate("/home")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
          <h1 className="text-4xl font-bold mb-4">{scenario.name}</h1>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        
        {/* Main Card Container */}
        <Card className="max-w-5xl mx-auto p-8 border-success/20 bg-card/50 backdrop-blur-sm">
          
          <h2 className="text-2xl font-semibold mb-8 text-center">
            You have completed this scenario!
          </h2>

          {/* TWO COLUMN LAYOUT: Scenario Score (Left) | AI Score (Right) */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            
            {/* Left: Strategic Performance (Existing) */}
            <div className="p-6 rounded-xl bg-card border border-border/50">
              <div className="text-center mb-6">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Strategic Score</p>
                <p className="text-5xl font-bold text-primary">{score?.toFixed(1) || "0.0"}</p>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Business Impact</span>
                    <span className="text-xs text-muted-foreground">{businessScore.toFixed(1)} / {maxScore}</span>
                  </div>
                  <Progress value={maxScore ? (businessScore / maxScore) * 100 : 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Time Efficiency</span>
                    <span className="text-xs text-muted-foreground">{timeScore.toFixed(1)} / {maxScore}</span>
                  </div>
                  <Progress value={maxScore ? (timeScore / maxScore) * 100 : 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Cost Effectiveness</span>
                    <span className="text-xs text-muted-foreground">{costScore.toFixed(1)} / {maxScore}</span>
                  </div>
                  <Progress value={maxScore ? (costScore / maxScore) * 100 : 0} className="h-2" />
                </div>
              </div>
            </div>

            {/* Right: AI Performance (New) */}
            <div className="p-6 rounded-xl bg-card border border-border/50 flex flex-col justify-center">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2 text-muted-foreground">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-semibold uppercase tracking-wider">AI Prompt Score</span>
                </div>
                
                {/* Score Number */}
                <p className="text-5xl font-bold text-primary mb-2">
                  {aiScore ? aiScore.toFixed(0) : "0"} <span className="text-2xl text-muted-foreground font-normal">/ 20</span>
                </p>

                {/* Stars */}
                {renderStars(getStarsFromScore(aiScore || 0))}

                {/* Label */}
                <p className="text-sm font-medium text-foreground mt-4 px-4 py-2 bg-muted/50 rounded-lg inline-block">
                  {getScoreLabel(aiScore || 0)}
                </p>
              </div>
            </div>

          </div>

          <Button onClick={handleComplete} size="lg" className="w-full bg-muted hover:bg-muted/90 h-12 text-lg">
            Return to Dashboard
          </Button>
        </Card>
      </div>
    </div>
  );
}
