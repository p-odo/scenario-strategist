import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/Header";
import { useGroupStore } from "@/hooks/useGroupStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, AlertTriangle, Send, Star, ArrowRight } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface CopilotTaskProps {
  task: any;
  tasks: any[];
}

export default function CopilotTask({ task, tasks }: CopilotTaskProps) {
  const { groupId, groupName } = useGroupStore();
  const navigate = useNavigate();
  
  // State
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  
  // Toggle for long prompts in feedback view
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);

  // Extract Config
  const config = task.task_config || {};
  const modelAnswer = config.model_answer || "No model answer configured.";
  const criteriaList = config.criteria_list || [
    "Generate critical questions to ask each vendor...",
    "Suggest decision criteria based on priorities...",
    "Evaluate reliability of Copilot output...",
    "Get a probability assessment based on evidence..."
  ];
  const placeholderText = config.placeholder || "I have uploaded documents as attachments, please...";
  const iconType = config.icon_type || "sparkles"; 

  const currentTaskIndex = task.order_index - 1;

  // --- Helper Functions for Scoring UI ---
  const getStarsFromScore = (score: number): number => {
    if (score >= 18) return 5;
    if (score >= 14) return 4;
    if (score >= 10) return 3;
    if (score >= 6) return 2;
    return 1;
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 18) return "Excellent prompt – High-quality results expected";
    if (score >= 14) return "Good prompt – Minor improvements needed";
    if (score >= 10) return "Fair prompt – Clarifications required";
    if (score >= 6) return "Poor prompt – Copilot will struggle";
    return "Very poor prompt – Rewrite needed";
  };

  const renderStars = (stars: number) => {
    return (
      <div className="flex gap-1 justify-center mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-8 h-8 ${
              star <= stars ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    );
  };

  // --- Submission Handler ---
  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create Submission Record
      const { data: submissionData, error: submissionError } = await supabase
        .from("copilot_submissions") 
        .insert({
          group_id: groupId,
          scenario_id: task.scenario_id,
          prompt: prompt,
        })
        .select()
        .single();

      if (submissionError) throw submissionError;

      // 2. Score via Edge Function
      const response = await supabase.functions.invoke("score-prompt", {
        body: { prompt, modelAnswer },
      });

      if (response.error) throw response.error;

      // 3. Update Record with Score
      const { data: updatedRecord, error: updateError } = await supabase
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
        .eq("id", submissionData.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // 4. Update Group Progress
      await supabase.from("group_progress").upsert({
        group_id: groupId,
        scenario_id: task.scenario_id,
        current_task: task.order_index + 1, 
      });

      setSubmissionResult(updatedRecord);
      toast.success("Analysis Complete!");
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error: any) {
      console.error("Error submitting prompt:", error);
      toast.error(error.message || "Failed to analyze prompt.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    // This is the last task, so usually we go to complete
    navigate(`/scenario/${task.scenario_id}/complete`);
  };

  // Helper to truncate text
  const getTruncatedPrompt = (text: string) => {
    // Arbitrary limit, e.g. 300 chars for preview
    const limit = 300;
    if (text.length <= limit) return text;
    return text.slice(0, limit) + "...";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header groupName={groupName || undefined} />
      <div className="container mx-auto px-6 py-12 max-w-[1400px]">
        
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

        {/* Header Section */}
        <div className="flex items-start gap-4 mb-8">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${iconType === 'alert' ? 'bg-orange-500/20 text-orange-500' : 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white'}`}>
            {iconType === 'alert' ? <AlertTriangle className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">{task.title}</h1>
            <div className="text-lg text-muted-foreground prose prose-invert max-w-none">
              <ReactMarkdown>{task.description || ""}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* --- VIEW 1: INPUT FORM --- */}
        {!submissionResult ? (
          <div className="space-y-8">
            
            {/* 1. Criteria Grid */}
            <div>
              <h3 className="text-xl font-semibold mb-4 uppercase text-muted-foreground tracking-wider text-sm">Your Task</h3>
              <p className="mb-4 text-lg">Write a Copilot prompt that should:</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                {criteriaList.map((item: string, i: number) => (
                  <Card key={i} className="p-6 border-accent/20 bg-accent/5 flex items-start gap-3 border border-yellow-500/20 text-yellow-100/90">
                    <p className="text-base leading-relaxed">{item}</p>
                  </Card>
                ))}
              </div>
            </div>

            {/* 2. Input Area + Responsible AI (Side by Side) */}
            <div>
               <h3 className="text-xl font-semibold mb-2 uppercase text-muted-foreground tracking-wider text-sm">Type on Copilot, and paste your prompt here</h3>
               <p className="mb-6 text-muted-foreground">Please open Copilot on this device and try out your prompts. Once you believe you have the best prompt, paste it here.</p>
               
               <div className="grid md:grid-cols-3 gap-6">
                 {/* Left: Input (2/3 width) */}
                 <div className="md:col-span-2 flex flex-col gap-4">
                    <Textarea
                      placeholder={placeholderText}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[250px] p-6 text-base font-mono bg-background/50 border-white/10 resize-none focus:border-primary/50 transition-colors"
                    />
                    <div>
                      <Button onClick={handleSubmit} disabled={isSubmitting} size="lg" className="w-auto px-8 h-12 text-base gap-2">
                        {isSubmitting ? "Submitting..." : "Submit Task"} 
                        {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                      </Button>
                    </div>
                 </div>

                 {/* Right: Responsible AI (1/3 width) */}
                 <Card className="p-6 border-success/20 bg-success/5 h-fit">
                    <div className="flex items-center gap-2 mb-4 text-success">
                      <Sparkles className="w-5 h-5" />
                      <h4 className="font-semibold text-lg">Responsible AI considerations</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      When crafting prompts in Copilot, apply Responsible AI principles: ensure clarity, avoid bias, respect privacy, and validate outputs for accuracy and compliance before acting on them. Always prioritize transparency and accountability.
                    </p>
                 </Card>
               </div>
            </div>
          </div>
        ) : (
          /* --- VIEW 2: FEEDBACK RESULT (New UI) --- */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            
            {/* 1. Original Prompt */}
            <Card className="p-6 border-border bg-card/50 backdrop-blur-sm">
              <h2 className="text-lg font-bold mb-4">Your Original Prompt</h2>
              <p className="text-muted-foreground whitespace-pre-wrap font-mono text-sm bg-black/20 p-4 rounded-md">
                {isPromptExpanded ? submissionResult.prompt : getTruncatedPrompt(submissionResult.prompt)}
              </p>
              {submissionResult.prompt.length > 300 && (
                <Button 
                  variant="link" 
                  className="mt-2 p-0 h-auto text-primary"
                  onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                >
                  {isPromptExpanded ? "Show Less" : "Read More"}
                </Button>
              )}
            </Card>

            {/* 2. Score & Feedback Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Left: Score */}
              <Card className="p-8 border-border bg-card/50 backdrop-blur-sm flex flex-col items-center justify-center text-center">
                <h2 className="text-lg font-bold mb-6 text-left w-full">AI Score</h2>
                
                <div className="flex flex-col items-center py-4">
                  {renderStars(getStarsFromScore(submissionResult.ai_score || 0))}
                  <div className="text-6xl font-bold text-cyan-400 my-2">
                    {submissionResult.ai_score?.toFixed(0) || "0"} <span className="text-2xl text-muted-foreground font-normal">/ 20</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 font-medium">
                    {getScoreLabel(submissionResult.ai_score || 0)}
                  </p>
                </div>
              </Card>

              {/* Right: Feedback */}
              <Card className="p-8 border-border bg-card/50 backdrop-blur-sm">
                <h2 className="text-lg font-bold mb-4">AI Feedback</h2>
                <div className="text-sm leading-relaxed text-muted-foreground h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  <ReactMarkdown>{submissionResult.feedback || "No specific feedback generated."}</ReactMarkdown>
                </div>
              </Card>
            </div>

            {/* 3. Rubric Breakdown */}
            <Card className="p-8 border-border bg-card/50 backdrop-blur-sm">
              <h2 className="text-lg font-bold mb-6">Rubric Component Breakdown</h2>
              <div className="space-y-6">
                {[
                  { label: "A. Goal (Clarity of Purpose)", score: submissionResult.goal_score },
                  { label: "B. Context (Background Information)", score: submissionResult.context_score },
                  { label: "C. Source (Reference Material)", score: submissionResult.source_score },
                  { label: "D. Expectation (Output Format & Quality)", score: submissionResult.expectation_score }
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-2 items-end">
                      <span className="font-semibold text-sm">{item.label}</span>
                      <span className="text-cyan-400 font-bold">{item.score || 0} / 5</span>
                    </div>
                    {/* Custom Styled Progress Bar to match screenshot (Cyan) */}
                    <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-cyan-400 rounded-full transition-all duration-1000 ease-out"
                         style={{ width: `${((item.score || 0) / 5) * 100}%` }}
                       />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            
            {/* 4. Next Button (Aligned Right) */}
            <div className="flex justify-end pt-4">
               <Button onClick={handleNext} size="lg" className="bg-cyan-400 hover:bg-cyan-500 text-black font-bold px-10">
                 Next <ArrowRight className="ml-2 w-4 h-4" />
               </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}