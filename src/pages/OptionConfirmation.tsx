import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { useGroupStore } from "@/hooks/useGroupStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X, Search, Layers, Sparkles } from "lucide-react";

export default function OptionConfirmation() {
  const { scenarioId, taskNumber, optionId } = useParams();
  const { groupId, groupName } = useGroupStore();
  const [option, setOption] = useState<any>(null);
  const [task, setTask] = useState<any>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [totalTasks, setTotalTasks] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!groupId || !scenarioId || !taskNumber || !optionId) {
      navigate("/");
      return;
    }
    loadData();
  }, [groupId, scenarioId, taskNumber, optionId]);

  const loadData = async () => {
    const [optionResult, taskResult, tasksCountResult] = await Promise.all([
      supabase.from("options").select("*, tasks(*)").eq("id", optionId).single(),
      supabase.from("tasks").select("*").eq("scenario_id", scenarioId).eq("order_index", parseInt(taskNumber!)).single(),
      supabase.from("tasks").select("id", { count: "exact" }).eq("scenario_id", scenarioId),
    ]);

    if (optionResult.error || !optionResult.data) {
      toast.error("Option not found");
      navigate(`/scenario/${scenarioId}/task/${taskNumber}`);
      return;
    }

    setOption(optionResult.data);
    setTask(taskResult.data);
    setTotalTasks(tasksCountResult.count || 0);
  };

  const handleConfirm = async () => {
    setIsConfirming(true);

    const { error } = await supabase
      .from("group_choices")
      .insert({
        group_id: groupId,
        task_id: task.id,
        option_id: optionId,
      });

    if (error) {
      toast.error("Failed to save choice");
      setIsConfirming(false);
      return;
    }

    const nextTaskNumber = parseInt(taskNumber!) + 1;
    
    if (nextTaskNumber <= totalTasks) {
      navigate(`/scenario/${scenarioId}/task/${nextTaskNumber}`);
    } else {
      navigate(`/scenario/${scenarioId}/complete`);
    }
  };

  const handleClose = () => {
    navigate(`/scenario/${scenarioId}/task/${taskNumber}`);
  };

  const getIcon = (iconName: string | null) => {
    if (iconName === "search") return <Search className="w-8 h-8 text-primary" />;
    if (iconName === "layers") return <Layers className="w-8 h-8 text-primary" />;
    return <Layers className="w-8 h-8 text-primary" />;
  };

  if (!option || !task) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p>Loading...</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background/95 backdrop-blur-sm">
      <Header groupName={groupName || undefined} />
      
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">CONFIRM YOUR SELECTION?</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 p-8 relative border-primary/20 bg-card backdrop-blur-sm">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-start gap-4 mb-6">
                {getIcon(option.icon)}
                <h3 className="text-2xl font-semibold flex-1">{option.title}</h3>
              </div>

              <div className="mb-6">
                <p className="font-semibold mb-3">There are a few <span className="font-bold">implications/approach</span> to this method:</p>
                <ul className="space-y-2">
                  {option.implications && option.implications.map((impl: string, index: number) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>{impl}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={handleConfirm}
                disabled={isConfirming}
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                {isConfirming ? "Confirming..." : "Confirm & skip to 5 hour later"}
              </Button>
            </Card>

            <Card className="p-6 border-success/20 bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4 text-success">
                <Sparkles className="w-5 h-5" />
                <h4 className="font-semibold">Responsible AI reminder</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                When crafting prompts in Copilot, apply Responsible AI principles: ensure clarity,
                avoid bias, respect privacy, and validate outputs for accuracy and compliance
                before acting on them. Always prioritize transparency and accountability.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
