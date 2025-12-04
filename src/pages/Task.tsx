import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { useGroupStore } from "@/hooks/useGroupStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Layers, DollarSign, Star, Clock, Info, Sparkles, ShieldAlert, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AICheatSheet } from "@/components/AICheatSheet";
import ReactMarkdown from 'react-markdown';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";

export default function Task() {
  const { scenarioId, taskNumber } = useParams();
  const { groupId, groupName } = useGroupStore();
  const [scenario, setScenario] = useState<any>(null);
  const [task, setTask] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isUploadTask, setIsUploadTask] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Selection State
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSubmittedDialog, setShowSubmittedDialog] = useState(false);
  
  // Right Column Content State
  const [cheatSheets, setCheatSheets] = useState<any[]>([]);
  const [activeCheatSheetId, setActiveCheatSheetId] = useState<string | undefined>();
  const [aiReminderMessage, setAiReminderMessage] = useState<string | null>(null);
  
  // Controls which Accordion item is open ("responsible-ai", "tech-guide", or "")
  const [activeAccordionValue, setActiveAccordionValue] = useState<string>("");
  const [leftAccordionValue, setLeftAccordionValue] = useState<string>("");

  // Store reminders in memory so they load instantly
  const [aiReminders, setAiReminders] = useState<Record<string, string>>({});

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

    const isScenario2 = scenarioResult.data.order_index === 2 || scenarioResult.data.name.includes("Scenario 2") || scenarioResult.data.name.includes("Deep-Space");
    const isScenario1 = scenarioResult.data.order_index === 1 || scenarioResult.data.name.includes("Scenario 1");

    // --- NAVIGATION LOGIC ---
    
    // 1. Special Case: Scenario 2, Task 2 (Multiple Choice)
    if (isScenario2 && currentTask.order_index === 2) {
       navigate(`/scenario/${scenarioId}/task-mcq`, { state: { tasks: allTasks } });
       return;
    }

    // 2. Special Case: Scenario 1, Task 1 (Embedded Upload)
    if (isScenario1 && currentTask.order_index === 1) {
      setIsUploadTask(true);
    } else {
      setIsUploadTask(false);
    }

    // 3. Special Case: Task 3 (Copilot Prompting)
    if (currentTask.order_index === 3) {
      if (isScenario2) {
         // Scenario 2 Copilot Page
         navigate(`/scenario/${scenarioId}/copilot-s2`, { state: { tasks: allTasks } });
      } else {
         // Scenario 1 Copilot Page
         navigate(`/scenario/${scenarioId}/copilot`, { state: { tasks: allTasks } });
      }
      return;
    }

    setTask(currentTask);
    const currentOptions = currentTask.options || [];
    setOptions(currentOptions);

    // --- Pre-fetch AI Reminders ---
    if (currentOptions.length > 0) {
        // ... (Keep existing logic for pre-fetching reminders) ...
        const optionIds = currentOptions.map((o: any) => o.id);
        try {
          const { data: links } = await supabase
            .from("option_ai_consideration" as any)
            .select("option_id, reminder_id")
            .in("option_id", optionIds);
          
          const safeLinks = links as any[] | null;
          if (safeLinks && safeLinks.length > 0) {
            const reminderIds = safeLinks.map((l: any) => l.reminder_id);
            const { data: messages } = await supabase
              .from("responsible_ai_consideration" as any)
              .select("id, message")
              .in("id", reminderIds);
            const safeMessages = messages as any[] | null;
            const map: Record<string, string> = {};
            safeLinks.forEach((link: any) => {
              const match = safeMessages?.find((m: any) => m.id === link.reminder_id);
              if (match) {
                map[link.option_id] = match.message;
              }
            });
            setAiReminders(map);
          }
        } catch (err) {
          console.error("Error pre-fetching reminders:", err);
        }
    }
  };

  const handleOptionSelect = async (option: any) => {
    setSelectedOption(option);
    
    // --- 1. INSTANTLY Get Reminder (No DB Call needed) ---
    const foundMessage = aiReminders[option.id] || null;
    setAiReminderMessage(foundMessage);

    // Reset Left Accordion
    setLeftAccordionValue(""); 
    
    // Set Right Accordion
    if (foundMessage) {
      setActiveAccordionValue("responsible-ai");
    } else {
      setActiveAccordionValue(""); 
    }
    
    // --- 2. Fetch Cheat Sheets ---
    const { data: optionCheatSheets } = await supabase
      .from("option_cheat_sheets")
      .select(`cheat_sheet_id, ai_cheat_sheets (*)`)
      .eq("option_id", option.id);
    
    const sheets = optionCheatSheets?.map((ocs: any) => ocs.ai_cheat_sheets) || [];
    setCheatSheets(sheets);
    setActiveCheatSheetId(sheets[0]?.id);
  };

  const handleUpload = async () => {
    if (!uploadFile || !groupId || !task) return;

    setIsUploading(true);
    try {
      // 1. Upload image
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${groupId}/${task.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('task_images')
        .upload(fileName, uploadFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('task_images')
        .getPublicUrl(fileName);

      // 2. Save submission
      const { error: dbError } = await supabase
        .from('task_submissions' as any)
        .insert({
          group_id: groupId,
          task_id: task.id,
          image_url: publicUrl
        });

      if (dbError) throw dbError;

      toast.success("Submission received!");
      setUploadFile(null);
      setShowSubmittedDialog(true);
    } catch (error) {
      console.error("Error uploading:", error);
      toast.error("Failed to upload submission");
    } finally {
      setIsUploading(false);
    }
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
      setSelectedOption(null);
      setShowSubmittedDialog(true);
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
    setAiReminderMessage(null);
    setActiveAccordionValue("");
    setLeftAccordionValue("");
  };

  const getIcon = (iconName: string | null) => {
    if (iconName === "search") return <Search className="w-8 h-8 text-primary" />;
    if (iconName === "layers") return <Layers className="w-8 h-8 text-primary" />;
    return <Layers className="w-8 h-8 text-primary" />;
  };

  useEffect(() => {
    if (cheatSheets.length > 0 && !activeCheatSheetId) {
      setActiveCheatSheetId(cheatSheets[0].id);
    }
  }, [cheatSheets]);

  if (!task || !scenario) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p>Loading...</p></div>;
  }

  const currentTaskIndex = parseInt(taskNumber!) - 1;

  return (
    <div className="min-h-screen bg-background">
      <Header groupName={groupName || undefined} />
      
      <div className="container mx-auto px-6 py-8">
        {/* Breadcrumb / Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            {tasks.map((t, index) => (
              <div key={t.id} className="flex items-center">
                <div 
                  className={`flex items-center gap-2 ${index <= currentTaskIndex ? "" : "opacity-40"}`}
                >
                  {index < currentTaskIndex ? (
                    <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center text-success-foreground">✓</div>
                  ) : (
                    <div className={`w-10 h-10 rounded-full ${index === currentTaskIndex ? "bg-primary" : "bg-muted"} flex items-center justify-center font-semibold`}>
                      {index + 1}
                    </div>
                  )}
                  <span className={index === currentTaskIndex ? "font-semibold" : "text-muted-foreground"}>{t.title}</span>
                </div>
                {index < tasks.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${index < currentTaskIndex ? "bg-success" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Task Title & Description */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-primary">{taskNumber}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">{scenario.name}</h1>
              <h2 className="text-3xl font-bold text-primary mb-3">{task.title}</h2>
              <div className="prose-invert text-base text-muted-foreground max-w-none">
                <ReactMarkdown>{task.description || ""}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        {/* Option Selection Grid */}
        {isUploadTask ? (
          <div className="max-w-4xl mx-auto">
            <Card className="p-0 border-border bg-card/50 backdrop-blur-sm overflow-hidden h-[600px]">
              <iframe 
                src="/upload.html" 
                className="w-full h-full border-0"
                title="Upload Submission"
              />
            </Card>
            <div className="flex justify-end mt-4">
              <Button 
                onClick={() => setShowSubmittedDialog(true)} 
                size="lg"
              >
                Continue
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-semibold mb-6">YOU HAVE TWO CHOICES:</h3>
            <div className="grid md:grid-cols-2 gap-6 max-w-6xl">
              {options.map((option) => (
                <Card
                  key={option.id}
                  className="p-6 cursor-pointer hover:border-primary transition-colors border-border bg-card/50 backdrop-blur-sm group flex flex-col h-full"
                  onClick={() => handleOptionSelect(option)}
                >
                  <div className="flex-1 mb-4">
                    <div className="flex items-start gap-4 mb-4">
                      {getIcon(option.icon)}
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-3">{option.title}</h3>
                        <div className="text-muted-foreground">
                          <ReactMarkdown>{(option.description || '').split('.')[0] + '.'}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-auto">
                    {option.cost_label && (
                      <Badge variant="secondary" className="px-2.5 py-0.5 text-xs gap-1.5 font-medium">
                        <DollarSign className="w-3 h-3" />
                        {option.cost_label}
                      </Badge>
                    )}
                    {option.impact_label && (
                      <Badge variant="secondary" className="px-2.5 py-0.5 text-xs gap-1.5 font-medium">
                        <Star className="w-3 h-3" />
                        {option.impact_label}
                      </Badge>
                    )}
                    {option.speed_label && (
                      <Badge variant="secondary" className="px-2.5 py-0.5 text-xs gap-1.5 font-medium">
                        <Clock className="w-3 h-3" />
                        {option.speed_label}
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      <Dialog open={!!selectedOption} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="max-w-7xl max-h-[85vh] overflow-y-auto p-0 gap-0 bg-background/95 backdrop-blur-sm border-border top-[10%] translate-y-0 data-[state=open]:slide-in-from-top-[5%]">
          
          <DialogHeader className="p-6 pb-4 border-b border-border">
            <DialogTitle className="text-2xl font-bold">CONFIRM YOUR SELECTION?</DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-3 gap-6 p-6">
            
            {/* Left Column: Detailed Card */}
            <Card className="md:col-span-2 p-8 border-border bg-card flex flex-col justify-between">
              <div>
                <div className="flex items-start gap-5 mb-6">
                  {selectedOption && getIcon(selectedOption.icon)}
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold mb-3">{selectedOption?.title}</h3>
                    <div className="flex flex-wrap gap-3 mb-6">
                      {selectedOption?.cost_label && <Badge variant="secondary" className="px-3 py-1 text-sm gap-1.5 h-8"><DollarSign className="w-3.5 h-3.5" />{selectedOption.cost_label}</Badge>}
                      {selectedOption?.impact_label && <Badge variant="secondary" className="px-3 py-1 text-sm gap-1.5 h-8"><Star className="w-3.5 h-3.5" />{selectedOption.impact_label}</Badge>}
                      {selectedOption?.speed_label && <Badge variant="secondary" className="px-3 py-1 text-sm gap-1.5 h-8"><Clock className="w-3.5 h-3.5" />{selectedOption.speed_label}</Badge>}
                    </div>
                    <div className="text-muted-foreground prose prose-invert max-w-none text-base leading-relaxed">
                      <ReactMarkdown>{selectedOption?.description || ""}</ReactMarkdown>
                    </div>
                  </div>
                </div>

                {selectedOption?.implications && selectedOption.implications.length > 0 && (
                   <div className="my-6">
                      <Accordion 
                        type="single" 
                        collapsible 
                        className="w-full"
                        value={leftAccordionValue}
                        onValueChange={setLeftAccordionValue}
                      >
                        <AccordionItem value="implications" className="border border-primary/20 rounded-lg bg-primary/5 overflow-hidden">
                          <AccordionTrigger className="px-6 py-4 hover:bg-primary/10 transition-colors hover:no-underline">
                             <div className="flex items-center gap-3 text-base font-semibold uppercase tracking-wider text-primary">
                                <Layers className="w-5 h-5" />
                                <span>Implications / Approach</span>
                             </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-6 pt-2 bg-card/50">
                            <ul className="space-y-3 mt-2">
                              {selectedOption.implications.map((implication: string, index: number) => (
                                <li key={index} className="flex items-start gap-3 text-base">
                                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                  <div className="text-foreground/90 leading-relaxed">
                                    <ReactMarkdown components={{ p: ({children}) => <span className="block">{children}</span> }}>
                                      {implication}
                                    </ReactMarkdown>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                   </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-border/30">
                <Button onClick={handleConfirm} disabled={isConfirming} className="w-full font-bold text-lg h-14 shadow-xl hover:shadow-primary/20 transition-all" size="lg">
                  {isConfirming ? "Confirming..." : "Confirm Selection"}
                </Button>
              </div>
            </Card>

            {/* Right Column: Accordion (Reminder + Tech Guide) */}
            <div className="space-y-4">
              <Accordion 
                type="single" 
                collapsible 
                value={activeAccordionValue} 
                onValueChange={(val) => {
                  setActiveAccordionValue(val);
                  if (val === "tech-guide") {
                    setLeftAccordionValue("implications");
                  }
                }}
                className="w-full space-y-4"
              >
                
                {/* 1. RESPONSIBLE AI REMINDER */}
                {aiReminderMessage && (
                  <AccordionItem value="responsible-ai" className="border rounded-lg bg-card px-4">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-success">
                         <Sparkles className="w-4 h-4" />
                         Responsible AI Considerations
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="p-4 border border-success/20 bg-success/5 rounded-md">
                        <div className="text-sm text-muted-foreground leading-relaxed prose prose-invert max-w-none">
                          <ReactMarkdown 
                            components={{
                              p: ({children}) => <span className="block mb-2 last:mb-0">{children}</span>
                            }}
                          >
                            {aiReminderMessage || ""}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* 2. AI TECHNOLOGY GUIDE */}
                <AccordionItem value="tech-guide" className="border rounded-lg bg-card px-4">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      <Info className="w-4 h-4" />
                      AI Technology Guide
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    {cheatSheets.length > 0 ? (
                      <Tabs
                        value={activeCheatSheetId}
                        onValueChange={setActiveCheatSheetId}
                        className="w-full"
                      >
                        <TabsList className="grid w-full bg-muted mb-4" style={{ gridTemplateColumns: `repeat(${cheatSheets.length}, minmax(0, 1fr))` }}>
                          {cheatSheets.map((sheet: any) => (
                            <TabsTrigger key={sheet.id} value={sheet.id} className="text-xs">
                              {sheet.name}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        {cheatSheets.map((sheet: any) => (
                          <TabsContent key={sheet.id} value={sheet.id} className="mt-0">
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
                    ) : (
                      <p className="text-sm text-muted-foreground">No guide available for this option.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>

              </Accordion>
            </div>
            
          </div>
        </DialogContent>
      </Dialog>

      {/* Submitted Dialog */}
      <Dialog open={showSubmittedDialog} onOpenChange={setShowSubmittedDialog}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Answer Submitted!</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
              <span className="text-3xl">✓</span>
            </div>
            <p className="text-muted-foreground text-lg">
              Please wait for helper instructions before moving on to the next task.
            </p>
          </div>
          <Button 
            onClick={() => {
              setShowSubmittedDialog(false);
              window.scrollTo(0, 0);
              const nextTaskNumber = parseInt(taskNumber!) + 1;
              if (nextTaskNumber <= tasks.length) {
                navigate(`/scenario/${scenarioId}/task/${nextTaskNumber}`);
              } else {
                navigate(`/scenario/${scenarioId}/complete`);
              }
            }}
            className="w-full"
            size="lg"
          >
            Next
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
