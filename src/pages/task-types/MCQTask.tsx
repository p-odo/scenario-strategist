import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGroupStore } from "@/hooks/useGroupStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Info } from "lucide-react";

interface MCQTaskProps {
  task: any;
  tasks: any[];
}

// Helper to render different types of content blocks (Text vs Info Box)
const ContentBlockRenderer = ({ block }: { block: any }) => {
  if (block.type === 'alert') {
    return (
      <div className="border-l-4 border-blue-500 bg-blue-500/10 p-4 rounded-r-md my-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-blue-400 font-bold text-xs uppercase flex items-center gap-1">
            <Info className="w-3 h-3" /> {block.title}
          </span>
        </div>
        <p className="text-blue-200/90 italic text-sm leading-relaxed">
          "{block.content}"
        </p>
      </div>
    );
  }
  // Default to simple paragraph
  return (
    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
      {block.content}
    </p>
  );
};

export default function MCQTask({ task, tasks }: MCQTaskProps) {
  const { groupId, groupName } = useGroupStore();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmittedDialog, setShowSubmittedDialog] = useState(false);

  // --- DYNAMIC CONFIGURATION ---
  const config = task.task_config || {};
  const scenarioParts = config.parts || []; 

  const handleAnswerChange = (partId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [partId]: value }));
  };

  const handleSubmit = async () => {
    // 1. Validation
    const missing = scenarioParts.some((part: any) => !answers[part.id]);
    if (missing) {
      toast.error("Please select an answer for all parts.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. Calculate Score Dynamically (FIXED LOGIC)
      let calculatedScore = 0;
      scenarioParts.forEach((part: any) => {
        const userChoiceKey = answers[part.id];
        const correctOption = part.options.find((o: any) => o.isCorrect);
        
        // SCORING FIX: 1.0 for Correct, 0.5 for Incorrect
        if (correctOption && userChoiceKey === correctOption.key) {
          calculatedScore += 1.0; 
        } else {
          calculatedScore += 0.5; 
        }
      });

      // 3. Save to Supabase
      const { error } = await supabase.from("mcq_submissions" as any).insert({
        group_id: groupId,
        task_id: task.id,
        answers: answers,
        score: calculatedScore
      });

      if (error) {
        console.error("Submission error:", error);
      }

      // 4. Update Progress
      await supabase.from("group_progress").upsert({
        group_id: groupId,
        scenario_id: task.scenario_id,
        current_task: task.order_index + 1,
      });

      setShowSubmittedDialog(true);

    } catch (error: any) {
      console.error("Error submitting:", error);
      toast.error("Failed to submit answers");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTaskIndex = task.order_index - 1;

  if (!scenarioParts.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold">Configuration Error</h2>
          <p className="text-muted-foreground">Task configuration is missing in the database.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header groupName={groupName || undefined} />
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        
        {/* --- Progress Bar --- */}
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

        {/* --- Task Header --- */}
        <div className="mb-10">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Deep-Space Contingency</p>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center text-lg font-bold bg-white/5">
              {task.order_index}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{task.title}</h1>
            </div>
          </div>
        </div>

        {/* --- Main Content Card --- */}
        <Card className="p-8 border-white/10 bg-card">
          
          {scenarioParts.map((part: any, index: number) => (
            <div key={part.id || index} className="mb-12 last:mb-0">
              
              <h2 className="text-xl font-bold mb-4">{part.title}</h2>
              
              <div className="mb-6">
                {part.content_blocks && part.content_blocks.map((block: any, i: number) => (
                  <ContentBlockRenderer key={i} block={block} />
                ))}
              </div>

              <p className="font-semibold text-foreground mt-4 mb-2">
                {part.question_text}
              </p>
              <p className="text-xs uppercase tracking-wide mb-4">Choose the best action:</p>

              <RadioGroup 
                value={answers[part.id]} 
                onValueChange={(val) => handleAnswerChange(part.id, val)}
                className="space-y-3"
              >
                {part.options.map((opt: any) => (
                  <div 
                    key={opt.key} 
                    className={`
                      relative flex items-start space-x-4 p-4 rounded-lg border cursor-pointer transition-all duration-200
                      ${answers[part.id] === opt.key 
                        ? "border-primary bg-primary/10" 
                        : "border-white/10 hover:bg-white/5"}
                    `}
                    onClick={() => handleAnswerChange(part.id, opt.key)}
                  >
                    <RadioGroupItem value={opt.key} id={`${part.id}-${opt.key}`} className="mt-1 border-white/50 text-primary" />
                    <div className="flex-1">
                      <Label 
                        htmlFor={`${part.id}-${opt.key}`} 
                        className="font-bold text-base cursor-pointer block mb-1"
                      >
                        <span className="text-primary mr-2">{opt.key}:</span>
                        {opt.label}
                      </Label>
                      <p className="text-sm text-muted-foreground leading-snug">
                        {opt.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>

              {index < scenarioParts.length - 1 && <div className="w-full h-px bg-white/10 mt-12" />}
            </div>
          ))}

          <div className="flex justify-end pt-6 border-t border-white/10 mt-8">
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting} 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 h-12 text-lg"
            >
              {isSubmitting ? "Submitting..." : "Confirm & Continue"}
            </Button>
          </div>

        </Card>

        {/* --- Success Dialog --- */}
        <Dialog open={showSubmittedDialog} onOpenChange={setShowSubmittedDialog}>
          <DialogContent className="max-w-md text-center bg-card border-white/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center mb-2">Answers Logged</DialogTitle>
            </DialogHeader>
            <div className="py-6 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <p className="text-muted-foreground text-base px-4">
                Your compliance decisions have been recorded for the final assessment.
              </p>
            </div>
            <Button 
              onClick={() => {
                setShowSubmittedDialog(false);
                window.scrollTo(0, 0);
                const nextTaskNumber = parseInt(task.order_index) + 1;
                navigate(`/scenario/${task.scenario_id}/task/${nextTaskNumber}`, { state: { tasks } });
              }}
              className="w-full h-12 text-lg"
              size="lg"
            >
              Next Task
            </Button>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}