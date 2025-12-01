import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { useGroupStore } from "@/hooks/useGroupStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Layers, DollarSign, Star, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AICheatSheet } from "@/components/AICheatSheet";
import ReactMarkdown from 'react-markdown'

export default function Task() {
  const { scenarioId, taskNumber } = useParams();
  const { groupId, groupName } = useGroupStore();
  const [scenario, setScenario] = useState<any>(null);
  const [task, setTask] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [cheatSheets, setCheatSheets] = useState<any[]>([]);
  const [activeCheatSheetId, setActiveCheatSheetId] = useState<string | undefined>();
  const [isConfirming, setIsConfirming] = useState(false);
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

  const handleOptionSelect = async (option: any) => {
    setSelectedOption(option);
    
    // Fetch cheat sheets for this option
    const { data: optionCheatSheets } = await supabase
      .from("option_cheat_sheets")
      .select(`
        cheat_sheet_id,
        ai_cheat_sheets (*)
      `)
      .eq("option_id", option.id);
    
    const sheets = optionCheatSheets?.map((ocs: any) => ocs.ai_cheat_sheets) || [];
    setCheatSheets(sheets);
    setActiveCheatSheetId(sheets[0]?.id);
  };

  const handleConfirm = async () => {
    if (!selectedOption || !groupId || !task) return;
    
    setIsConfirming(true);
    try {
      const { error } = await supabase
        .from("group_choices")
        .insert({
          group_id: groupId,
          task_id: task.id,
          option_id: selectedOption.id,
        });

      if (error) throw error;

      toast.success("Choice saved!");
      setSelectedOption(null); // Close modal before navigation
      
      const nextTaskNumber = parseInt(taskNumber!) + 1;
      if (nextTaskNumber <= tasks.length) {
        navigate(`/scenario/${scenarioId}/task/${nextTaskNumber}`);
      } else {
        navigate(`/scenario/${scenarioId}/complete`);
      }
    } catch (error) {
      console.error("Error saving choice:", error);
      toast.error("Failed to save choice");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedOption(null);
    setCheatSheets([]);
    setActiveCheatSheetId(undefined);
  };

  const getIcon = (iconName: string | null) => {
    if (iconName === "search") return <Search className="w-8 h-8 text-primary" />;
    if (iconName === "layers") return <Layers className="w-8 h-8 text-primary" />;
    return <Layers className="w-8 h-8 text-primary" />;
  };

  useEffect(() => {
    if (cheatSheets.length > 0) {
      setActiveCheatSheetId((current) => current ?? cheatSheets[0].id);
    }
  }, [cheatSheets]);
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
                <div 
                  className={`flex items-center gap-2 ${index <= currentTaskIndex ? "" : "opacity-40"} ${index < currentTaskIndex ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                  onClick={() => {
                    if (index < currentTaskIndex) {
                      navigate(`/scenario/${scenarioId}/task/${index + 1}`);
                    }
                  }}
                >
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
              <div className="prose-invert text-lg text-muted-foreground max-w-none">
                <ReactMarkdown>{task.description || ""}</ReactMarkdown>
              </div>
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
                  <div className="text-muted-foreground mb-4">
                    <ReactMarkdown>{(option.description || '').split('.')[0] + '.'}</ReactMarkdown>
                  </div>
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

      <Dialog open={!!selectedOption} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-background/95 backdrop-blur-sm border-border">
          <DialogHeader className="p-6 pb-4 border-b border-border">
            <DialogTitle className="text-2xl font-bold">CONFIRM YOUR SELECTION?</DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-3 gap-6 p-6">
            {/* Option Details Card */}
            <Card className="md:col-span-2 p-6 border-border bg-card">
              <div className="flex items-start gap-4 mb-6">
                {selectedOption && getIcon(selectedOption.icon)}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">{selectedOption?.title}</h3>
                  <div className="text-muted-foreground">
                    <ReactMarkdown>{selectedOption?.description || ""}</ReactMarkdown>
                  </div>
                </div>
              </div>

              {selectedOption?.implications && selectedOption.implications.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 text-lg">Implications/Approach:</h4>
                  <ul className="space-y-2">
                    {selectedOption.implications.map((implication: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-muted-foreground">{implication}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button 
                onClick={handleConfirm} 
                disabled={isConfirming}
                className="w-full"
                size="lg"
              >
                {isConfirming ? "Confirming..." : "Confirm"}
              </Button>
            </Card>

            {/* AI Cheat Sheets */}
            {cheatSheets.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">AI Technology Guide</h4>
                <Tabs
                  value={activeCheatSheetId}
                  onValueChange={setActiveCheatSheetId}
                  className="w-full"
                >
                  <TabsList className="grid w-full bg-muted" style={{ gridTemplateColumns: `repeat(${cheatSheets.length}, minmax(0, 1fr))` }}>
                    {cheatSheets.map((sheet: any) => (
                      <TabsTrigger key={sheet.id} value={sheet.id} className="text-xs">
                        {sheet.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {cheatSheets.map((sheet: any) => (
                    <TabsContent key={sheet.id} value={sheet.id} className="mt-3">
                      <AICheatSheet
                        name={sheet.name}
                        icon={sheet.icon}
                        headerColor={sheet.header_color}
                        whatIs={sheet.what_is}
                        prerequisites={sheet.prerequisites}
                        exampleUseCases={sheet.example_use_cases}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
