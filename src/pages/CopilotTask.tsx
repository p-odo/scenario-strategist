import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/Header";
import { useGroupStore } from "@/hooks/useGroupStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, ExternalLink, Sparkles } from "lucide-react";

export default function CopilotTask() {
  const { scenarioId } = useParams();
  const { groupId, groupName } = useGroupStore();
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data State
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Control the "Loading..." state
  
  const navigate = useNavigate();
  const location = useLocation(); // To access state passed from previous page

  useEffect(() => {
    if (!scenarioId) return;
    loadData();
  }, [scenarioId]);

  const loadData = async () => {
    try {
      // OPTIMIZATION: Check if tasks were passed via navigation state (Instant Load)
      // This makes the progress bar appear with 0ms delay if coming from Task.tsx
      if (location.state?.tasks) {
        setTasks(location.state.tasks);
        setIsLoading(false);
        return;
      }

      // Fallback: Fetch from database if we refreshed the page
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("scenario_id", scenarioId)
        .order("order_index");
      
      if (data) setTasks(data);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setIsLoading(false); // Reveal the page only after data is ready
    }
  };

  // Determine which step is active (Copilot is usually index 3)
  const currentTaskIndex = tasks.findIndex(t => t.order_index === 3);
  const activeIndex = currentTaskIndex !== -1 ? currentTaskIndex : 2;

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsSubmitting(true);

    const modelAnswer = `You are an expert in aerospace procurement and risk analysis. Your task is to evaluate two vendor PowerPoint decks for life support systems and recommend which vendor should be prioritized for Cathay Space’s mission-critical operations.

Perform the following steps:

1. **Generate Critical Questions** Create a list of probing questions to ask each vendor in the upcoming meeting. Cover these areas:
   - Compliance with international space safety standards
   - Scalability for long-duration missions
   - Risk mitigation strategies for system failures
   - Contractual flexibility and penalties for non-compliance

2. **Define Decision Criteria** Suggest a weighted set of decision criteria aligned with Cathay Space’s priorities:
   - Safety and reliability
   - Transparency and auditability
   - Cost-effectiveness
   - Expert oversight and maintainability

3. **Evaluate Copilot Reliability** Before giving your recommendation:
   - Provide citations for any claims or data used
   - Walk through your reasoning step by step
   - Highlight any assumptions or gaps in the provided decks

4. **Vendor Probability Assessment** Based on the evidence in both decks:
   - Assign a probability (as a percentage) that each vendor will meet Cathay Space’s safety and reliability standards for mission-critical operations
   - Explain the logic behind these probabilities

Finally, summarize your recommendation in a clear, actionable format (e.g., "Vendor A should be prioritized because...").
`;
const Question = 'You have received two vendor PowerPoint decks for life support systems. Each deck contains extensive information—technical specifications, pricing models, compliance claims, etc. You need to determine which vendor offers the best solution for mission-critical operations.`;
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
        body: { prompt, modelAnswer, Question},
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
      navigate(`/scenario/${scenarioId}/copilot/feedback`);
    } catch (error) {
      console.error("Error submitting prompt:", error);
      toast.error("Failed to submit prompt");
      setIsSubmitting(false);
    }
  };

  // Block rendering until data is loaded to prevent "pop-in"
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
                      // Pass tasks state back to keep it fast
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
        {/* ------------------- */}

        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-3">Leveraging Microsoft Copilot</h1>
            <p className="text-lg text-muted-foreground mb-4">
              You have received two vendor PowerPoint decks for life support systems. Each deck contains extensive information—technical specifications, pricing models, compliance claims, etc.
            </p>
            <p className="text-lg text-muted-foreground">
              You need to determine which vendor offers the best solution for mission-critical operations.
            </p>
          </div>
        </div>

        <Card className="p-8 mb-6 bg-card/50 backdrop-blur-sm">
          <h3 className="text-xl font-semibold mb-4">YOUR TASK</h3>
          <p className="mb-4">Write a Copilot prompt that will help you analyze both decks and recommend which vendor should be prioritized. The prompt should:</p>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {[
              "Generate critical questions to ask each vendor in the upcoming meeting (covering compliance, scalability, risk mitigation, and contractual flexibility).",
              "Suggest decision criteria based on Cathay Space's priorities (e.g., safety, transparency, auditability, cost-effectiveness, and expert oversight).",
              "Evaluate reliability of Copilot, including elements to ensure the reliability of Copilot's output. (Such as asking for citations and walking through the thought logic of their conclusion).",
              "Based on the available evidence, get a probability (as a percentage) that each vendor will meet Cathay Space's safety and reliability standards for mission-critical operations."
            ].map((item, i) => (
              <Card key={i} className="p-4 border-accent/20 bg-accent/5">
                <p className="text-sm">{item}</p>
              </Card>
            ))}
          </div>

          <h4 className="font-semibold mb-3">DRAFT YOUR PROMPT</h4>
          <Textarea
            placeholder="I have uploaded 15,000 documents as attachments, please..."
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
