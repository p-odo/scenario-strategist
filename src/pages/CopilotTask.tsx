import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsSubmitting(true);

    const modelAnswer = "Create an Executive Compliance Report summarising all submitted filings. Include: Document names and categories, Filing destinations (regulatory portals), Status of each submission, Compliance check against required standards. Present in a structured table with a brief narrative overview.";

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
            enhanced_prompt: response.data.enhanced_prompt || null
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

  return (
    <div className="min-h-screen bg-background">
      <Header groupName={groupName || undefined} />
      <div className="container mx-auto px-6 py-12 max-w-6xl">
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
