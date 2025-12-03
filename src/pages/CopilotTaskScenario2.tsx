import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/Header";
import { useGroupStore } from "@/hooks/useGroupStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, AlertTriangle } from "lucide-react";

export default function CopilotTaskScenario2() {
  const { scenarioId } = useParams();
  const { groupId, groupName } = useGroupStore();
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data State for Progress Bar
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
      // Fast load from previous page state if available
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

  // Progress Bar Logic (Task 3 is usually index 3, i.e., array position 2 or 3 depending on your data)
  // Assuming this is the last task
  const activeIndex = tasks.length > 0 ? tasks.length - 1 : 2;

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsSubmitting(true);

    // --- SCENARIO 2 SPECIFIC MODEL ANSWER ---
    const modelAnswer = `
      You are an expert Crisis Communications Director for a major aerospace company.
      
      Context: The AI Risk Model has flagged a potential anomaly in the life support systems. Following safety protocols and EU AI Act compliance checks, we have decided to postpone the launch to perform a human-in-the-loop review. Rumors of a "critical failure" are already leaking on social media.

      Task: Draft a press statement to address the delay.

      Criteria for the prompt and output:
      1. **Tone:** Transparent, reassuring, and authoritative. Avoid defensive language.
      2. **Key Message:** Prioritize safety above all. Explicitly mention that the delay is a proactive safety measure triggered by rigorous quality checks, not a confirmed failure.
      3. **Audience:** General public, investors, and regulatory bodies.
      4. **Responsible AI:** Do not speculate on the technical cause until the review is complete. Avoid over-promising on the new launch date.
      
      Structure:
      - Headline: Clear and neutral.
      - Body Paragraph 1: The announcement of the delay.
      - Body Paragraph 2: The reason (Safety & Compliance commitment).
      - Closing: Commitment to updates.
    `;

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
      // We reuse the same feedback page because it is generic enough to handle any submission
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
                    <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center text-success-foreground">
                      ✓
                    </div>
                  ) : (
                    <div className={`w-10 h-10 rounded-full ${index === activeIndex ? "bg-primary" : "bg-muted"} flex items-center justify-center font-semibold`}>
                      {index + 1}
                    </div>
                  )}
                  <span className={index === activeIndex ? "font-semibold" : "text-muted-foreground"}>
                    {t.title}
                  </span>
                </div>
                {index < tasks.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${index < activeIndex ? "bg-success" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* --- Header --- */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-3">Crisis Communication: The Delay</h1>
            <p className="text-lg text-muted-foreground mb-4">
              Following your decision to prioritize compliance and reliability, the mission launch has been paused for a "Human-in-the-Loop" review.
            </p>
            <p className="text-lg text-muted-foreground">
              Social media is already buzzing with rumors of a "catastrophic failure." You need to control the narrative immediately.
            </p>
          </div>
        </div>

        {/* --- Task Card --- */}
        <Card className="p-8 mb-6 bg-card/50 backdrop-blur-sm">
          <h3 className="text-xl font-semibold mb-4">YOUR TASK</h3>
          <p className="mb-4">
            Write a Copilot prompt to draft a <b>Press Statement</b> regarding the launch delay. The statement must balance transparency with brand reputation.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {[
              "Address the rumors directly without repeating negative language.",
              "Explain that the pause is a proactive safety measure (referencing your rigorous compliance checks).",
              "Maintain a tone that is professional, transparent, and reassuring to stakeholders.",
              "Avoid speculation on the technical cause until the review is complete (Responsible AI principle)."
            ].map((item, i) => (
              <Card key={i} className="p-4 border-accent/20 bg-accent/5">
                <p className="text-sm">{item}</p>
              </Card>
            ))}
          </div>

          <h4 className="font-semibold mb-3">DRAFT YOUR PROMPT</h4>
          <Textarea
            placeholder="Act as a Crisis Communications Director. Draft a press statement that..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[200px] mb-4"
          />
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </Card>

        {/* --- Responsible AI Reminder --- */}
        <Card className="p-6 border-success/20 bg-card/80">
          <div className="flex items-center gap-2 mb-3 text-success">
            <Sparkles className="w-5 h-5" />
            <h4 className="font-semibold">Responsible AI reminder</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            <strong>Accuracy & Honesty:</strong> When using AI for crisis comms, verify that the generated text does not invent details or make promises (like a specific new launch date) that haven't been approved by engineering. AI can hallucinate facts to fill gaps—ensure the output adheres strictly to confirmed information.
          </p>
        </Card>
      </div>
    </div>
  );
}