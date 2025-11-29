import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { useGroupStore } from "@/hooks/useGroupStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import spaceHeroBg from "@/assets/space-hero-bg.jpg";

export default function Complete() {
  const { scenarioId } = useParams();
  const { groupId, groupName } = useGroupStore();
  const [scenario, setScenario] = useState<any>(null);
  const [score, setScore] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!groupId || !scenarioId) {
      navigate("/");
      return;
    }
    loadData();
  }, [groupId, scenarioId]);

  const loadData = async () => {
    const scenarioResult = await supabase.from("scenarios").select("*").eq("id", scenarioId).single();
    
    // Get tasks for this scenario
    const tasksResult = await supabase.from("tasks").select("id").eq("scenario_id", scenarioId);
    const taskIds = tasksResult.data?.map(t => t.id) || [];
    
    // Get choices with options
    const choicesResult = await supabase
      .from("group_choices")
      .select("*, options(*)")
      .eq("group_id", groupId)
      .in("task_id", taskIds);

    if (scenarioResult.error || !scenarioResult.data) {
      toast.error("Scenario not found");
      navigate("/home");
      return;
    }

    setScenario(scenarioResult.data);

    // Calculate weighted score
    if (choicesResult.data && choicesResult.data.length > 0) {
      let totalScore = 0;
      choicesResult.data.forEach((choice: any) => {
        const option = choice.options;
        const weightedScore =
          option.business_impact_score * 0.4 +
          option.time_score * 0.3 +
          option.cost_score * 0.3;
        totalScore += weightedScore;
      });
      setScore(totalScore / choicesResult.data.length);
    }

    // Mark as completed
    await supabase
      .from("group_progress")
      .update({ completed_at: new Date().toISOString() })
      .eq("group_id", groupId)
      .eq("scenario_id", scenarioId);
  };

  const handleComplete = () => {
    navigate("/home");
  };

  if (!scenario) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p>Loading...</p>
    </div>;
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
          <Button
            variant="ghost"
            className="mb-6 text-foreground hover:text-primary"
            onClick={() => navigate("/home")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          <h1 className="text-4xl font-bold mb-4">
            {scenario.name}
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <Card className="max-w-3xl mx-auto p-8 border-success/20 bg-card/50 backdrop-blur-sm">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold mb-4">
              You have completed this scenario! Please wait for the session host for next instructions.
            </h2>
            {score !== null && (
              <div className="mb-6">
                <p className="text-lg text-muted-foreground mb-2">Your Score:</p>
                <p className="text-5xl font-bold text-primary">{score.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Based on Business Impact (40%), Time (30%), and Cost (30%)
                </p>
              </div>
            )}
          </div>
          <Button
            onClick={handleComplete}
            size="lg"
            className="w-full bg-muted hover:bg-muted/90"
          >
            Completed
          </Button>
        </Card>
      </div>
    </div>
  );
}
