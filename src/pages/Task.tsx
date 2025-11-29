import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { useGroupStore } from "@/hooks/useGroupStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Layers, DollarSign, Star, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Task() {
  const { scenarioId, taskNumber } = useParams();
  const { groupId, groupName } = useGroupStore();
  const [scenario, setScenario] = useState<any>(null);
  const [task, setTask] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!groupId || !scenarioId || !taskNumber) {
      navigate("/");
      return;
    }
    loadData();
  }, [groupId, scenarioId, taskNumber]);

  const loadData = async () => {
    const [scenarioResult, tasksResult] = await Promise.all([
      supabase.from("scenarios").select("*").eq("id", scenarioId).single(),
      supabase.from("tasks").select("*, options(*)").eq("scenario_id", scenarioId).order("order_index"),
    ]);

    if (scenarioResult.error || !scenarioResult.data) {
      toast.error("Scenario not found");
      navigate("/home");
      return;
    }

    setScenario(scenarioResult.data);
    const allTasks = tasksResult.data || [];
    setTasks(allTasks);
    
    const currentTask = allTasks.find((t) => t.order_index === parseInt(taskNumber!));
    if (!currentTask) {
      toast.error("Task not found");
      navigate("/home");
      return;
    }

    // Redirect to CopilotTask if this is task 3
    if (currentTask.order_index === 3) {
      navigate(`/scenario/${scenarioId}/copilot`);
      return;
    }

    setTask(currentTask);
    setOptions(currentTask.options || []);
  };

  const handleOptionSelect = (option: any) => {
    navigate(`/scenario/${scenarioId}/task/${taskNumber}/option/${option.id}`);
  };

  const getIcon = (iconName: string | null) => {
    if (iconName === "search") return <Search className="w-8 h-8 text-primary" />;
    if (iconName === "layers") return <Layers className="w-8 h-8 text-primary" />;
    return <Layers className="w-8 h-8 text-primary" />;
  };

  if (!task || !scenario) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p>Loading...</p>
    </div>;
  }

  const currentTaskIndex = parseInt(taskNumber!) - 1;

  return (
    <div className="min-h-screen bg-background">
      <Header groupName={groupName || undefined} />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            {tasks.map((t, index) => (
              <div key={t.id} className="flex items-center">
                <div className={`flex items-center gap-2 ${index <= currentTaskIndex ? "" : "opacity-40"}`}>
                  {index < currentTaskIndex ? (
                    <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center text-success-foreground">
                      ✓
                    </div>
                  ) : (
                    <div className={`w-10 h-10 rounded-full ${index === currentTaskIndex ? "bg-primary" : "bg-muted"} flex items-center justify-center font-semibold`}>
                      {index + 1}
                    </div>
                  )}
                  <span className={index === currentTaskIndex ? "font-semibold" : "text-muted-foreground"}>
                    {t.title}
                  </span>
                </div>
                {index < tasks.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${index < currentTaskIndex ? "bg-success" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-primary">{taskNumber}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {scenario.name}
              </h1>
              <h2 className="text-3xl font-bold text-primary mb-3">{task.title}</h2>
              <p className="text-lg text-muted-foreground max-w-4xl">{task.description}</p>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-semibold mb-6">YOU HAVE TWO CHOICES:</h3>
        <div className="grid md:grid-cols-2 gap-6 max-w-6xl">
          {options.map((option) => (
            <Card
              key={option.id}
              className="p-6 cursor-pointer hover:border-primary transition-colors border-border bg-card/50 backdrop-blur-sm group"
              onClick={() => handleOptionSelect(option)}
            >
              <div className="flex items-start gap-4 mb-4">
                {getIcon(option.icon)}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-3">{option.title}</h3>
                  <p className="text-muted-foreground mb-4">{option.description}</p>
                </div>
              </div>

              <div className="flex gap-3 text-sm">
                {option.cost_label && (
                  <Badge variant="outline" className="gap-1">
                    <DollarSign className="w-3 h-3" />
                    {option.cost_label}
                  </Badge>
                )}
                {option.impact_label && (
                  <Badge variant="outline" className="gap-1">
                    <Star className="w-3 h-3" />
                    {option.impact_label}
                  </Badge>
                )}
                {option.speed_label && (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="w-3 h-3" />
                    {option.speed_label}
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
