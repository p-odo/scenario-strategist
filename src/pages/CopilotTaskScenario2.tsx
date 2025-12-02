import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/Header";
import { useGroupStore } from "@/hooks/useGroupStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export default function CopilotTaskScenario2() {
  const { scenarioId } = useParams();
  const { groupId, groupName } = useGroupStore();
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data State
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!scenarioId) return;
    loadData();
  }, [scenarioId]);

  const loadData = async () => {
    try {
      if (location.state?.tasks) {
        setTasks(location.state.tasks);
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("scenario_id", scenarioId)
        .order("order_index");
      
      if (data) setTasks(data);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentTaskIndex = tasks.findIndex(t => t.order_index === 3);
  const activeIndex = currentTaskIndex !== -1 ? currentTaskIndex : 2;

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsSubmitting(true);

    // =========================================================================
    // TODO: UPDATE THIS MODEL ANSWER FOR SCENARIO 2
    // =========================================================================
    const modelAnswer = `
      You are an expert in crisis management and public relations. 
      Your task is to draft a press statement regarding the delay of the launch...
      
      Criteria:
      1. Tone: Professional, transparent, yet reassuring.
      2. Key Elements: Acknowledge the delay, explain the safety-first reasoning, provide a new timeline.
      3. Responsible AI: Avoid speculation and cite only confirmed engineering reports.
    `; 
    // =========================================================================

    const { data: submissionData, error: submissionError } = await supabase
      .from("copilot_submissions")
      .insert({
        group_id: groupId,
        scenario_id: scenarioId,
        prompt: prompt,
      })
      .select()
      .single();

    if (submissionError) {
      toast.error("Failed to save submission");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await supabase.functions.invoke("score-prompt", {
        body: { prompt, modelAnswer },
      });

      if (response.data?.score !== undefined) {
        await supabase
          .from("copilot_submissions")
          .update({ 
            ai_score: response.data.score,
            feedback: response.data.feedback || null,
            enhanced_prompt: response.data.enhanced_prompt || null,
            goal_score: response.data.goal_score || null,
            context_score: response.data.context_score || null,
            source_score: response.data.source_score || null,
            expectation_score: response.data.expectation_score || null
          })
          .eq("id", submissionData.id);
      }

      toast.success("Prompt submitted successfully!");
      // Note: You might want a separate feedback page for S2, or reuse the same one
      navigate(`/scenario/${scenarioId}/copilot/feedback`); 
    } catch (error) {
      console.error("Error submitting prompt:", error);
      toast.error("Failed to submit prompt");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header groupName={groupName || undefined} />
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        
        {/* Progress Bar */}
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

        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            {/* TODO: UPDATE TITLE FOR SCENARIO 2 */}
            <h1 className="text-3xl font-bold mb-3">Scenario 2: Copilot Task Title</h1>
            
            {/* TODO: UPDATE DESCRIPTION FOR SCENARIO 2 */}
            <p className="text-lg text-muted-foreground mb-4">
              [Scenario 2 Context Description goes here... e.g., "The launch has been delayed and you need to communicate this to stakeholders..."]
            </p>
          </div>
        </div>

        <Card className="p-8 mb-6 bg-card/50 backdrop-blur-sm">
          <h3 className="text-xl font-semibold mb-4">YOUR TASK</h3>
          <p className="mb-4">Write a Copilot prompt that will help you...</p>
          
          {/* TODO: UPDATE BULLET POINTS FOR SCENARIO 2 */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {[
              "Scenario 2 Requirement A (e.g. Draft a press release)",
              "Scenario 2 Requirement B (e.g. Analyze financial impact)",
              "Scenario 2 Requirement C (e.g. Ensure compliance)",
              "Scenario 2 Requirement D (e.g. Suggest mitigation steps)"
            ].map((item, i) => (
              <Card key={i} className="p-4 border-accent/20 bg-accent/5">
                <p className="text-sm">{item}</p>
              </Card>
            ))}
          </div>

          <h4 className="font-semibold mb-3">DRAFT YOUR PROMPT</h4>
          <Textarea
            placeholder="Please analyze the situation and..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[200px] mb-4"
          />
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </Card>

        <Card className="p-6 border-success/20 bg-card/80">
          <div className="flex items-center gap-2 mb-3 text-success">
            <Sparkles className="w-5 h-5" />
            <h4 className="font-semibold">Responsible AI reminder</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            When crafting prompts in Copilot, apply Responsible AI principles: ensure clarity, avoid bias, respect privacy, and validate outputs for accuracy and compliance before acting on them. Always prioritize transparency and accountability.
          </p>
        </Card>
      </div>
    </div>
  );
}
