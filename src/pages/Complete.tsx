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

  // AI Score
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

      // 2. Load Tasks
      const tasksResult = await supabase
        .from("tasks")
        .select("id")
        .eq("scenario_id", scenarioId);

      const taskIds = tasksResult.data?.map((t) => t.id) || [];

      // 3. Load Group Choices
      const choicesResult = await supabase
        .from("group_choices")
        .select("id, task_id, option_id, created_at")
        .eq("group_id", groupId)
        .in("task_id", taskIds);

      // 4. Load AI Submission
      const submissionResult = await supabase
        .from("copilot_submissions")
        .select("ai_score")
        .eq("group_id", groupId)
        .eq("scenario_id", scenarioId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (submissionResult.data) {
        setAiScore(submissionResult.data.ai_score);
      }

      // Calculate Scenario Score
      if (choicesResult.data && choicesResult.data.length > 0) {
        const latestChoiceByTask: Record<string, any> = {};
        choicesResult.data.forEach((choice) => {
          const existing = latestChoiceByTask[choice.task_id];
          if (!existing || new Date(choice.created_at) > new Date(existing.created_at)) {
            latestChoiceByTask[choice.task_id] = choice;
          }
        });
        const uniqueChoices = Object.values(latestChoiceByTask);

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
      const tasksResult = await supabase.from("tasks").select("id").eq("scenario_id", scenarioId);
      const taskIds = tasksResult.data?.map((t) => t.id) || [];

      if (taskIds.length > 0) {
        await supabase.from("group_choices").delete().eq("group_id", groupId).in("task_id", taskIds);
      }

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
      <div className="flex gap-2 justify-center my-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            // Increased size to w-8 h-8
            className={`w-8 h-8 ${
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
        <Card className="max-w-4xl mx-auto p-10 border-success/20 bg-card/50 backdrop-blur-sm">
          
          <h2 className="text-3xl font-semibold mb-10 text-center">
            You have completed this scenario!
          </h2>

          {/* --- SECTION 1: STRATEGIC SCORE --- */}
          <div className="text-center mb-12">
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">Strategic Score</p>
            <p className="text-7xl font-bold text-primary mb-8">{score?.toFixed(1) || "0.0"}</p>
            
            <div className="max-w-xl mx-auto space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Business Impact</span>
                  <span className="text-xs text-muted-foreground">{businessScore.toFixed(1)} / {maxScore}</span>
                </div>
                <Progress value={maxScore ? (businessScore / maxScore) * 100 : 0} className="h-2.5" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Time Efficiency</span>
                  <span className="text-xs text-muted-foreground">{timeScore.toFixed(1)} / {maxScore}</span>
                </div>
                <Progress value={maxScore ? (timeScore / maxScore) * 100 : 0} className="h-2.5" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Cost Effectiveness</span>
                  <span className="text-xs text-muted-foreground">{costScore.toFixed(1)} / {maxScore}</span>
                </div>
                <Progress value={maxScore ? (costScore / maxScore) * 100 : 0} className="h-2.5" />
              </div>
            </div>
          </div>

          {/* --- SECTION 2: AI SCORE (Bigger Size) --- */}
          {aiScore !== null && (
            <div className="mt-12 pt-12 border-t border-border/40">
              <div className="text-center max-w-xl mx-auto">
                <div className="flex items-center justify-center gap-2 mb-4 text-muted-foreground">
                  {/* Increased label size */}
                  <span className="text-base font-bold uppercase tracking-widest">Copilot Prompt Score</span>
                </div>
                
                <div className="flex flex-col items-center justify-center">
                  <div className="flex items-baseline gap-3 mb-2">
                    {/* Increased Number Size to 6xl */}
                    <span className="text-6xl font-bold text-foreground">{aiScore.toFixed(0)}</span>
                    <span className="text-3xl text-muted-foreground font-light">/ 20</span>
                  </div>
                  
                  {renderStars(getStarsFromScore(aiScore))}
                  
                  <div className="mt-4 inline-block px-6 py-2 bg-muted/40 rounded-full border border-border/50">
                    {/* Increased label text size */}
                    <p className="text-base font-medium text-foreground">
                      {getScoreLabel(aiScore)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-16 pt-6">
            <Button onClick={handleComplete} size="lg" className="w-full bg-primary hover:bg-primary/90 h-14 text-xl font-semibold shadow-lg">
              Return to Control Center
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
