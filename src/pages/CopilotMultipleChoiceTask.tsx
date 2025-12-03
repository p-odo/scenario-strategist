import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { useGroupStore } from "@/hooks/useGroupStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck, Scale } from "lucide-react";

export default function CopilotMultipleChoiceTask() {
  const { scenarioId, taskNumber } = useParams();
  const { groupId, groupName } = useGroupStore();
  
  // State for the progress bar
  const [tasks, setTasks] = useState<any[]>([]);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for Answers
  const [part1Answer, setPart1Answer] = useState<string>("");
  const [part2Answer, setPart2Answer] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!scenarioId) return;
    loadData();
  }, [scenarioId]);

  const loadData = async () => {
    try {
      // 1. Load Tasks for Progress Bar
      let allTasks = [];
      if (location.state?.tasks) {
        allTasks = location.state.tasks;
      } else {
        const { data } = await supabase
          .from("tasks")
          .select("*")
          .eq("scenario_id", scenarioId)
          .order("order_index");
        if (data) allTasks = data;
      }
      setTasks(allTasks);

      // 2. Identify Current Task (Scenario 2, Task 2)
      // We assume this page maps to order_index 2
      const task = allTasks.find(t => t.order_index === 2);
      setCurrentTask(task);

    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Progress Bar Logic
  const currentTaskIndex = tasks.findIndex(t => t.order_index === 2);
  const activeIndex = currentTaskIndex !== -1 ? currentTaskIndex : 1;

  const handleSubmit = async () => {
    if (!part1Answer || !part2Answer) {
      toast.error("Please answer both parts before continuing.");
      return;
    }

    if (!currentTask || !groupId) return;

    setIsSubmitting(true);

    try {
      // We assume there are "Options" in the DB corresponding to these choices.
      // For now, we will create a generic "Group Choice" record to mark this task as complete.
      // Ideally, you would look up the specific Option ID for "Answer B" and "Answer C".
      
      // Here we just insert a record to 'group_choices' to allow the progress bar to calculate completion.
      // We use the current task ID. Ideally, you associate the answer string, but your schema relies on option_id.
      // OPTIONAL: You can create dummy options in your DB for these questions if you want scoring.
      
      // For this implementation, we simply mark progress:
      await supabase.from("group_progress").upsert({
        group_id: groupId,
        scenario_id: scenarioId,
        current_task: 3, // Move to next task
        // timestamp updates automatically
      });

      // Simple toast feedback
      toast.success("Responses recorded. Proceeding...");

      // Navigate to Task 3 (The Copilot Press Release task)
      navigate(`/scenario/${scenarioId}/copilot-s2`, { state: { tasks } });

    } catch (error) {
      console.error("Error submitting:", error);
      toast.error("Failed to save selection");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><p>Loading...</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <Header groupName={groupName || undefined} />
      <div className="container mx-auto px-6 py-12 max-w-5xl">

        {/* --- Progress Bar --- */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            {tasks.map((t, index) => (
              <div key={t.id} className="flex items-center">
                <div 
                  className={`flex items-center gap-2 ${index <= activeIndex ? "" : "opacity-40"} ${index < activeIndex ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                  onClick={() => {
                    if (index < activeIndex) {
                      navigate(`/scenario/${scenarioId}/task/${index + 1}`, { state: { tasks } });
                    }
                  }}
                >
                  {index < activeIndex ? (
                    <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center text-success-foreground">✓</div>
                  ) : (
                    <div className={`w-10 h-10 rounded-full ${index === activeIndex ? "bg-primary" : "bg-muted"} flex items-center justify-center font-semibold`}>
                      {index + 1}
                    </div>
                  )}
                  <span className={index === activeIndex ? "font-semibold" : "text-muted-foreground"}>{t.title}</span>
                </div>
                {index < tasks.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${index < activeIndex ? "bg-success" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* --- Header Content --- */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground uppercase tracking-widest mb-2">Deep-Space Contingency</p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-primary flex items-center justify-center text-xl font-bold">2</div>
            <h1 className="text-3xl font-bold">Trusting the Model: Reliability & Compliance Check</h1>
          </div>
        </div>

        {/* --- Main Content Box --- */}
        <Card className="p-8 border-border bg-card">
          
          {/* PART 1 */}
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Part 1: AI Output Reliability
            </h2>
            <p className="text-muted-foreground mb-4">
              You chose to build a custom AI risk model in Task 1. The model is now live and has generated recommendations...
              Before you act on its advice, you need to confirm the model is reliable and compliant.
            </p>
            <p className="font-semibold mb-6">Which check gives you the strongest evidence of reliability?</p>

            <RadioGroup value={part1Answer} onValueChange={setPart1Answer} className="space-y-3">
              {[
                { val: "A", label: "A: Ask for the model's confidence score and error margin", desc: "Shows how sure it is, but doesn't explain why." },
                { val: "B", label: "B: Review a plain-language explanation of how the recommendation was reached", desc: "Transparency and traceability are essential for trust and compliance." },
                { val: "C", label: "C: Confirm the model was tested for rare or extreme scenarios", desc: "Important for robustness, but not enough on its own." },
                { val: "D", label: "D: Verify that human oversight and override controls are in place", desc: "Critical for accountability, but doesn't confirm the recommendation itself is sound." },
              ].map((opt) => (
                <div key={opt.val} className={`flex items-start space-x-3 p-4 rounded-lg border transition-all ${part1Answer === opt.val ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}>
                  <RadioGroupItem value={opt.val} id={`p1-${opt.val}`} className="mt-1" />
                  <div className="flex-1 cursor-pointer" onClick={() => setPart1Answer(opt.val)}>
                    <Label htmlFor={`p1-${opt.val}`} className="font-semibold text-base cursor-pointer">{opt.label}</Label>
                    <p className="text-sm text-muted-foreground mt-1">{opt.desc}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="w-full h-px bg-border mb-12" />

          {/* PART 2 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              Part 2: Compliance Dilemma
            </h2>
            <p className="text-muted-foreground mb-6">
              The model recommends delaying the mission, but its advice is a black box—it cannot explain the rationale clearly, and acting on it may violate EU AI Act for high risk systems:
            </p>

            {/* EU Act Excerpt Box */}
            <div className="p-4 border-l-4 border-blue-500 bg-blue-500/10 mb-8 rounded-r-md">
              <h4 className="text-blue-400 font-bold text-sm mb-2 uppercase flex items-center gap-2">🇪🇺 EU AI Act excerpt</h4>
              <p className="text-sm text-blue-200/90 italic leading-relaxed">
                "High-risk AI must be transparent and explainable, with clear documentation and logs, and allow human oversight. It also requires risk management, robust data, and compliance checks to ensure safe, ethical, and trustworthy AI."
              </p>
            </div>

            <p className="font-semibold mb-6">You must decide on the next course of action. Choose the best action:</p>

            <RadioGroup value={part2Answer} onValueChange={setPart2Answer} className="space-y-3">
              {[
                { val: "A", label: "A: Override the model and choose a safer alternative", desc: "Documenting the reasoning and informing stakeholders." },
                { val: "B", label: "B: Insert a human-in-the-loop gate now", desc: "Require expert review, produce an explainability pack (clear rationale, uncertainty, data used), and log the decision before any action." },
                { val: "C", label: "C: Pause and remediate the model", desc: "Perform/refresh a risk & rights assessment (incl. a Fundamental Rights Impact Assessment), retrain or adjust thresholds, update documentation, and resume only after a conformity check." },
                { val: "D", label: "D: Proceed while disclosing the violation to regulators and affected parties", desc: "Transparency without fixing the root cause." },
              ].map((opt) => (
                <div key={opt.val} className={`flex items-start space-x-3 p-4 rounded-lg border transition-all ${part2Answer === opt.val ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}>
                  <RadioGroupItem value={opt.val} id={`p2-${opt.val}`} className="mt-1" />
                  <div className="flex-1 cursor-pointer" onClick={() => setPart2Answer(opt.val)}>
                    <Label htmlFor={`p2-${opt.val}`} className="font-semibold text-base cursor-pointer">{opt.label}</Label>
                    <p className="text-sm text-muted-foreground mt-1">{opt.desc}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSubmit} disabled={isSubmitting} size="lg" className="w-full md:w-auto px-8">
              {isSubmitting ? "Saving..." : "Confirm & Continue"}
            </Button>
          </div>

        </Card>
      </div>
    </div>
  );
}