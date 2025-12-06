import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { useGroupStore } from "@/hooks/useGroupStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Layers, DollarSign, Star, Clock, Info, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AICheatSheet } from "@/components/AICheatSheet";
import ReactMarkdown from 'react-markdown';

interface StandardChoiceTaskProps {
  task: any;
  tasks: any[];
}

export default function StandardChoiceTask({ task, tasks }: StandardChoiceTaskProps) {
  const { groupId, groupName } = useGroupStore();
  const navigate = useNavigate();

  // Task Data
  const options = task.options || [];
  
  // Selection State
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSubmittedDialog, setShowSubmittedDialog] = useState(false);
  
  // Right Column Content State
  const [cheatSheets, setCheatSheets] = useState<any[]>([]);
  const [activeCheatSheetId, setActiveCheatSheetId] = useState<string | undefined>();
  const [aiReminderMessage, setAiReminderMessage] = useState<string | null>(null);
  
  // Accordion State
  const [activeAccordionValue, setActiveAccordionValue] = useState<string>("");

  // AI Reminders Cache
  const [aiReminders, setAiReminders] = useState<Record<string, string>>({});

  useEffect(() => {
    // Pre-fetch AI reminders when options load
    const fetchReminders = async () => {
      if (!options.length) return;
      
      const optionIds = options.map((o: any) => o.id);
      try {
        // 1. Check the linking table 'option_ai_consideration'
        const { data: links } = await supabase
          .from("option_ai_consideration")
          .select("option_id, reminder_id")
          .in("option_id", optionIds);
        
        if (links && links.length > 0) {
          const reminderIds = links.map((l: any) => l.reminder_id);
          // 2. Fetch the actual message
          const { data: messages } = await supabase
            .from("responsible_ai_consideration")
            .select("id, message")
            .in("id", reminderIds);
            
          const map: Record<string, string> = {};
          links.forEach((link: any) => {
            const match = messages?.find((m: any) => m.id === link.reminder_id);
            if (match) map[link.option_id] = match.message;
          });
          setAiReminders(map);
        }
      } catch (err) {
        console.error("Error pre-fetching reminders:", err);
      }
    };
    fetchReminders();
  }, [task.id]);

  useEffect(() => {
    if (cheatSheets.length > 0 && !activeCheatSheetId) {
      setActiveCheatSheetId(cheatSheets[0].id);
    }
  }, [cheatSheets]);

  const handleOptionSelect = async (option: any) => {
    setSelectedOption(option);
    
    // 1. Get Reminder (Strict: Only from DB)
    const foundMessage = aiReminders[option.id] || null;
    setAiReminderMessage(foundMessage);

    // 2. Fetch Cheat Sheets
    const { data: optionCheatSheets } = await supabase
      .from("option_cheat_sheets")
      .select(`cheat_sheet_id, ai_cheat_sheets (*)`)
      .eq("option_id", option.id);
    
    const sheets = optionCheatSheets?.map((ocs: any) => ocs.ai_cheat_sheets) || [];
    setCheatSheets(sheets);
    setActiveCheatSheetId(sheets[0]?.id);

    // 3. STRICT ACCORDION LOGIC
    // ONLY open "Responsible AI" if a message was actually found in the DB.
    if (foundMessage) {
      setActiveAccordionValue("responsible-ai");
    } else if (sheets.length > 0) {
      // If no AI message but tech guide exists, open that
      setActiveAccordionValue("tech-guide");
    } else {
      // Otherwise, keep closed
      setActiveAccordionValue(""); 
    }
  };

  const handleConfirm = async () => {
    if (!selectedOption || !groupId || !task) {
      toast.error("Missing selection or group data.");
      return;
    }
    
    setIsConfirming(true);
    try {
      // FIX: Ensure we are using 'choice_submissions' (and cast as any for now)
      const { error } = await supabase
        .from("choice_submissions" as any) 
        .insert({
          group_id: groupId,
          task_id: task.id,
          option_id: selectedOption.id,
        });

      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }

      await supabase.from("group_progress").upsert({
        group_id: groupId,
        scenario_id: task.scenario_id,
        current_task: task.order_index + 1,
      });

      toast.success("Choice saved!");
      setSelectedOption(null);
      setShowSubmittedDialog(true);
    } catch (error: any) {
      console.error("Error saving choice:", error);
      toast.error(`Failed to save: ${error.message || "Unknown error"}`);
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
  };

  const getIcon = (iconName: string | null) => {
    if (iconName === "search") return <Search className="w-8 h-8 text-primary" />;
    if (iconName === "layers") return <Layers className="w-8 h-8 text-primary" />;
    return <Layers className="w-8 h-8 text-primary" />;
  };

  const getNumberWord = (num: number) => {
    const map: Record<number, string> = { 1: "ONE", 2: "TWO", 3: "THREE", 4: "FOUR", 5: "FIVE" };
    return map[num] || num.toString();
  };

  const currentTaskIndex = task.order_index - 1;

  return (
    <div className="min-h-screen bg-background">
      <Header groupName={groupName || undefined} />
      
      <div className="container mx-auto px-6 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            {tasks.map((t, index) => (
              <div key={t.id} className="flex items-center">
                <div className={`flex items-center gap-2 ${index <= currentTaskIndex ? "" : "opacity-40"}`}>
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
              <span className="text-2xl font-bold text-primary">{task.order_index}</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-primary mb-3">{task.title}</h2>
              <div className="prose-invert text-base text-muted-foreground max-w-none">
                <ReactMarkdown>{task.description || ""}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        {/* Options Grid */}
        <h3 className="text-xl font-semibold mb-6 uppercase">
          YOU HAVE {getNumberWord(options.length)} CHOICES:
        </h3>
        
        <div className={`grid gap-6 max-w-6xl ${options.length > 2 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          {options.map((option: any) => (
            <Card
              key={option.id}
              className="p-6 cursor-pointer hover:border-primary transition-colors border-border bg-card/50 backdrop-blur-sm group flex flex-col h-full relative overflow-hidden"
              onClick={() => handleOptionSelect(option)}
            >
               <div className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-primary transition-colors" />
              
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
                {option.cost_label && <Badge variant="secondary" className="px-2.5 py-0.5 text-xs gap-1.5"><DollarSign className="w-3 h-3" />{option.cost_label}</Badge>}
                {option.impact_label && <Badge variant="secondary" className="px-2.5 py-0.5 text-xs gap-1.5"><Star className="w-3 h-3" />{option.impact_label}</Badge>}
                {option.speed_label && <Badge variant="secondary" className="px-2.5 py-0.5 text-xs gap-1.5"><Clock className="w-3 h-3" />{option.speed_label}</Badge>}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={!!selectedOption} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-background/95 backdrop-blur-sm border-border">
          
          <DialogHeader className="p-6 pb-4 border-b border-border flex flex-row items-center justify-between">
            <DialogTitle className="text-2xl font-bold">CONFIRM YOUR SELECTION?</DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-3 gap-6 p-6">
            
            {/* Left Column: Detailed Option Card */}
            <Card className="md:col-span-2 p-8 border-border bg-card flex flex-col justify-between relative">
              <div>
                <div className="flex items-start gap-5 mb-6">
                  {selectedOption && getIcon(selectedOption.icon)}
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold mb-3">{selectedOption?.title}</h3>
                    <div className="flex flex-wrap gap-3 mb-6">
                      {selectedOption?.cost_label && <Badge variant="secondary" className="px-3 py-1 text-sm"><DollarSign className="w-3.5 h-3.5" />{selectedOption.cost_label}</Badge>}
                      {selectedOption?.impact_label && <Badge variant="secondary" className="px-3 py-1 text-sm"><Star className="w-3.5 h-3.5" />{selectedOption.impact_label}</Badge>}
                      {selectedOption?.speed_label && <Badge variant="secondary" className="px-3 py-1 text-sm"><Clock className="w-3.5 h-3.5" />{selectedOption.speed_label}</Badge>}
                    </div>
                    <div className="text-muted-foreground prose prose-invert max-w-none text-base leading-relaxed">
                      <ReactMarkdown>{selectedOption?.description || ""}</ReactMarkdown>
                    </div>
                  </div>
                </div>

                {selectedOption?.implications?.length > 0 && (
                   <div className="my-6 p-4 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="flex items-center gap-2 mb-3 text-primary font-semibold uppercase tracking-wide">
                        <Layers className="w-5 h-5" />
                        <span>Implications / Approach</span>
                      </div>
                      <ul className="space-y-3">
                        {selectedOption.implications.map((implication: string, index: number) => (
                          <li key={index} className="flex items-start gap-3 text-base">
                            <span className="text-primary mt-1">•</span>
                            <div className="text-foreground/90">
                              <ReactMarkdown components={{ p: ({children}) => <span className="block">{children}</span> }}>{implication}</ReactMarkdown>
                            </div>
                          </li>
                        ))}
                      </ul>
                   </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-border/30">
                <Button onClick={handleConfirm} disabled={isConfirming} className="w-full font-bold text-lg h-14 shadow-xl">
                  {isConfirming ? "Confirming..." : "Confirm & Continue"}
                </Button>
              </div>
            </Card>

            {/* Right Column: AI & Tech Guide */}
            <div className="space-y-4">
              <Accordion 
                type="single" 
                collapsible 
                value={activeAccordionValue} 
                onValueChange={setActiveAccordionValue}
                className="w-full space-y-4"
              >
                {/* 1. RESPONSIBLE AI REMINDER - CONDITIONALLY RENDERED */}
                {aiReminderMessage && (
                  <AccordionItem value="responsible-ai" className="border rounded-lg bg-card px-4">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-2 text-sm font-semibold uppercase text-success">
                         <Sparkles className="w-4 h-4" />
                         Responsible AI Considerations
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="p-4 border border-success/20 bg-success/5 rounded-md text-sm text-muted-foreground leading-relaxed">
                        <ReactMarkdown>{aiReminderMessage}</ReactMarkdown>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* 2. AI TECH GUIDE */}
                <AccordionItem value="tech-guide" className="border rounded-lg bg-card px-4">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
                      <Info className="w-4 h-4" />
                      AI Technology Guide
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    {cheatSheets.length > 0 ? (
                      <Tabs value={activeCheatSheetId} onValueChange={setActiveCheatSheetId} className="w-full">
                        <TabsList className="grid w-full bg-muted mb-4" style={{ gridTemplateColumns: `repeat(${cheatSheets.length}, minmax(0, 1fr))` }}>
                          {cheatSheets.map((sheet: any) => (
                            <TabsTrigger key={sheet.id} value={sheet.id} className="text-xs">{sheet.name}</TabsTrigger>
                          ))}
                        </TabsList>
                        {cheatSheets.map((sheet: any) => (
                          <TabsContent key={sheet.id} value={sheet.id}>
                            <AICheatSheet {...sheet} headerColor={sheet.header_color} whatIs={sheet.what_is} exampleUseCases={sheet.example_use_cases} />
                          </TabsContent>
                        ))}
                      </Tabs>
                    ) : (
                      <p className="text-sm text-muted-foreground italic p-2">No specific technical guide available for this option.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submitted / Success Dialog */}
      <Dialog open={showSubmittedDialog} onOpenChange={setShowSubmittedDialog}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Selection Confirmed!</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
              <span className="text-3xl">✓</span>
            </div>
            <p className="text-muted-foreground text-lg">
              Please wait for instructions before moving to the next task.
            </p>
          </div>
          <Button 
            onClick={() => {
              setShowSubmittedDialog(false);
              window.scrollTo(0, 0);
              const nextTaskNumber = parseInt(task.order_index) + 1;
              if (nextTaskNumber <= tasks.length) {
                  navigate(`/scenario/${task.scenario_id}/task/${nextTaskNumber}`);
              } else {
                  navigate(`/scenario/${task.scenario_id}/complete`);
              }
            }}
            className="w-full"
            size="lg"
          >
            Next Task
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}