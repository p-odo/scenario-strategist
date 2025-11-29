import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { useGroupStore } from "@/hooks/useGroupStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, FileText } from "lucide-react";
import orbitImg from "@/assets/scenario-orbit-documents.jpg";

export default function ScenarioConfirmation() {
  const { scenarioId } = useParams();
  const { groupId, groupName } = useGroupStore();
  const [scenario, setScenario] = useState<any>(null);
  const [isStarting, setIsStarting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!groupId || !scenarioId) {
      navigate("/");
      return;
    }
    loadScenario();
  }, [groupId, scenarioId]);

  const loadScenario = async () => {
    const { data, error } = await supabase
      .from("scenarios")
      .select("*")
      .eq("id", scenarioId)
      .single();

    if (error || !data) {
      toast.error("Scenario not found");
      navigate("/home");
      return;
    }

    setScenario(data);
  };

  const handleStart = async () => {
    setIsStarting(true);

    // Create or update progress
    const { error } = await supabase
      .from("group_progress")
      .upsert({
        group_id: groupId,
        scenario_id: scenarioId,
        current_task: 1,
        is_locked: true,
        started_at: new Date().toISOString(),
      }, {
        onConflict: "group_id,scenario_id"
      });

    setIsStarting(false);

    if (error) {
      toast.error("Failed to start scenario");
      return;
    }

    navigate(`/scenario/${scenarioId}/task/1`);
  };

  if (!scenario) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p>Loading...</p>
    </div>;
  }

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty.toLowerCase() === "intermediate") return "bg-accent text-accent-foreground";
    if (difficulty.toLowerCase() === "advanced") return "bg-destructive text-destructive-foreground";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header groupName={groupName || undefined} />
      
      <div 
        className="relative py-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${orbitImg})` }}
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

          <div className="flex items-start gap-4 mb-4">
            <FileText className="w-10 h-10 text-primary flex-shrink-0" />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold">{scenario.name}</h1>
                <Badge className={getDifficultyColor(scenario.difficulty)}>
                  {scenario.difficulty.toUpperCase()}
                </Badge>
              </div>
              <p className="text-lg text-muted-foreground max-w-3xl">
                {scenario.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <Card className="max-w-3xl mx-auto p-8 border-primary/20 bg-card/50 backdrop-blur-sm">
          <p className="text-lg mb-6">
            You must decide what matters most right now—speed, accuracy, auditability, or expert
            judgment—and pick the corresponding path. You will be presented with 3 tasks.
          </p>
          <Button
            onClick={handleStart}
            disabled={isStarting}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isStarting ? "Starting..." : "Start now"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
