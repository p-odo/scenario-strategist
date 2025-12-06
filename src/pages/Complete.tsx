import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { useGroupStore } from "@/hooks/useGroupStore";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Star, CheckCircle2, XCircle, Trophy, ShieldCheck, UploadCloud } from "lucide-react";
import spaceHeroBg from "@/assets/space-hero-bg.jpg";
import ReactMarkdown from "react-markdown";

// Helper for Number Animation
const CountUp = ({ end, duration = 2000 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const update = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(ease * end);
      if (progress < 1) animationFrame = requestAnimationFrame(update);
    };

    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <>{count.toFixed(1)}</>;
};

export default function Complete() {
  const { scenarioId } = useParams();
  const { groupId, groupName } = useGroupStore();
  
  const [scenario, setScenario] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [taskResults, setTaskResults] = useState<any[]>([]);
  const [grandTotal, setGrandTotal] = useState<number>(0);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!groupId || !scenarioId) {
      navigate("/");
      return;
    }
    loadData();
  }, [groupId, scenarioId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: scenarioData } = await supabase.from("scenarios").select("*").eq("id", scenarioId).single();
      setScenario(scenarioData);

      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("scenario_id", scenarioId)
        .order("order_index");

      if (!tasks) return;

      const results = [];
      let totalScoreCalc = 0;

      for (const task of tasks) {
        
        // ====================================================
        // A. STANDARD CHOICE TASKS (Table: choice_submissions)
        // ====================================================
        if (task.task_type === "CHOICE") {
             const { data: sub } = await supabase
               .from("choice_submissions") 
               .select("*")
               .eq("group_id", groupId)
               .eq("task_id", task.id)
               .order("created_at", { ascending: false })
               .limit(1)
               .maybeSingle();

             if (sub) {
               const { data: userOpt } = await supabase.from("options").select("*").eq("id", sub.option_id).maybeSingle();
               const { data: correctOpt } = await supabase.from("options").select("*").eq("task_id", task.id).eq("is_correct", true).maybeSingle();

               if (userOpt) {
                   const score = (userOpt.business_impact_score * 0.4) + (userOpt.time_score * 0.3) + (userOpt.cost_score * 0.3);
                   totalScoreCalc += score;

                   results.push({
                     type: "CHOICE",
                     title: task.title,
                     userChoice: userOpt,
                     correctChoice: correctOpt || userOpt,
                     isCorrect: correctOpt ? userOpt.id === correctOpt.id : true,
                     score: score,
                     // Standard Option table uses 'feedback'
                     userFeedback: (correctOpt && userOpt.id !== correctOpt.id) ? userOpt.feedback : null,
                     correctFeedback: correctOpt ? correctOpt.feedback : userOpt.feedback
                   });
               }
             }
        }

        // ====================================================
        // B. MCQ TASKS (Table: mcq_submissions + mcq_options)
        // ====================================================
        else if (task.task_type === "MCQ") {
             const { data: sub } = await supabase
               .from("mcq_submissions")
               .select("*")
               .eq("group_id", groupId)
               .eq("task_id", task.id)
               .order("created_at", { ascending: false })
               .limit(1)
               .maybeSingle();

             const { data: rawMcqOptions } = await supabase
               .from("mcq_options" as any) 
               .select("*")
               .eq("task_id", task.id);
             
             const mcqOptions = (rawMcqOptions || []) as any[];

             if (sub && mcqOptions.length > 0) {
               totalScoreCalc += Number(sub.score);
               
               const answers = (sub.answers as any) || {};
               
               // Get unique questions
               const questionIds = Array.from(new Set(mcqOptions.map((o: any) => o.question_identifier)));

               const details = questionIds.map((qId: any) => {
                  const userAnswerVal = answers[qId]; 
                  
                  // Find options in DB
                  const userOptionObj = mcqOptions.find((o: any) => o.question_identifier === qId && o.choice_key === userAnswerVal);
                  const correctOptionObj = mcqOptions.find((o: any) => o.question_identifier === qId && o.is_correct === true);
                  
                  // Get Title (Fallback to DB option label if config missing)
                  const config = (task.task_config as any) || {};
                  const qConfig = config.questions?.find((q: any) => q.id === qId);
                  const qTitle = qConfig ? qConfig.title : (userOptionObj?.label || "Question");

                  const isCorrect = correctOptionObj ? (userAnswerVal === correctOptionObj.choice_key) : false;

                  return {
                    id: qId,
                    title: qTitle,
                    userVal: userAnswerVal,
                    userLabel: userOptionObj ? `${userOptionObj.choice_key}: ${userOptionObj.label}` : userAnswerVal,
                    correctLabel: correctOptionObj ? `${correctOptionObj.choice_key}: ${correctOptionObj.label}` : "Correct Option",
                    
                    // Correct Analysis
                    explanation: correctOptionObj?.explanation || "Analysis not available.",
                    
                    isCorrect: isCorrect,
                    
                    // FIX: MCQ table uses 'explanation', NOT 'feedback'
                    userFeedback: !isCorrect && userOptionObj ? userOptionObj.explanation : null
                  };
               });

               results.push({
                 type: "MCQ",
                 title: task.title,
                 questions: details,
                 score: sub.score
               });
             }
        }

        // ====================================================
        // C. COPILOT TASKS
        // ====================================================
        else if (task.task_type === "COPILOT") {
            const { data: sub } = await supabase
              .from("copilot_submissions")
              .select("*")
              .eq("group_id", groupId)
              .eq("scenario_id", scenarioId)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (sub) {
              totalScoreCalc += Number(sub.ai_score || 0);
              results.push({
                type: "COPILOT",
                title: task.title,
                aiScore: sub.ai_score,
                feedback: sub.feedback
              });
            }
        }

        // ====================================================
        // D. UPLOAD TASKS
        // ====================================================
        else if (task.task_type === "UPLOAD") {
            const { data: sub } = await supabase
              .from("upload_submissions")
              .select("*")
              .eq("group_id", groupId)
              .eq("task_id", task.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (sub) {
              results.push({
                type: "UPLOAD",
                title: task.title,
                score: 0,
                imageUrl: sub.image_url
              });
            }
        }
      }

      setTaskResults(results);
      setGrandTotal(totalScoreCalc);
      
      await supabase.from("group_progress").update({ completed_at: new Date().toISOString() }).eq("group_id", groupId).eq("scenario_id", scenarioId);

    } catch (error) {
      console.error("Error loading complete data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnHome = async () => {
    navigate("/home");
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-primary">Generating Mission Report...</div>;

  return (
    <div className="min-h-screen bg-background">
      <Header groupName={groupName || undefined} />

      <div className="relative py-20 bg-cover bg-center" style={{ backgroundImage: `url(${spaceHeroBg})` }}>
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h1 className="text-4xl font-bold mb-4">{scenario?.name}</h1>
          <p className="text-xl text-muted-foreground">Mission Debrief & Performance Report</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-5xl">
        
        <div className="space-y-8 mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
             <ShieldCheck className="w-6 h-6 text-primary" />
             Decision Log & Analysis
          </h2>

          {taskResults.length === 0 && (
             <div className="p-8 border border-dashed border-muted-foreground/30 rounded text-center text-muted-foreground">
                No completed tasks found for this scenario.
             </div>
          )}

          {taskResults.map((result, idx) => (
            <Card key={idx} className="p-8 border-border bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 150}ms` }}>
              
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <h3 className="text-xl font-bold text-foreground">{result.title}</h3>
                 </div>
                 {result.type !== "UPLOAD" && (
                   <div className="text-right">
                      <span className="text-2xl font-bold text-primary">+{result.score?.toFixed(1) || result.aiScore?.toFixed(0) || 0}</span>
                      <span className="text-xs text-muted-foreground block">POINTS EARNED</span>
                   </div>
                 )}
              </div>

              {/* === STANDARD CHOICE DISPLAY === */}
              {result.type === "CHOICE" && (
                <div className="grid md:grid-cols-2 gap-8">
                   <div className={`p-4 rounded-lg border ${result.isCorrect ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}`}>
                      <p className="text-xs font-bold uppercase mb-2 text-muted-foreground">Your Selection</p>
                      <p className="text-lg font-semibold flex items-center gap-2">
                        {result.isCorrect ? <CheckCircle2 className="w-5 h-5 text-success" /> : <XCircle className="w-5 h-5 text-destructive" />}
                        {result.userChoice.title}
                      </p>
                      {/* Show feedback if INCORRECT */}
                      {!result.isCorrect && result.userFeedback && (
                        <p className="text-sm text-muted-foreground mt-2">{result.userFeedback}</p>
                      )}
                   </div>
                   
                   <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                      <p className="text-xs font-bold uppercase mb-2 text-primary">
                        {result.isCorrect ? "Why this was the best choice" : "Preferred Strategy"}
                      </p>
                      <p className="text-lg font-semibold flex items-center gap-2">
                         <Star className="w-5 h-5 text-primary" />
                         {result.correctChoice.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {result.correctChoice.feedback}
                      </p>
                   </div>
                </div>
              )}

              {/* === MCQ DISPLAY === */}
              {result.type === "MCQ" && (
                <div className="space-y-6">
                  {result.questions.map((q: any) => (
                    <div key={q.id} className="border-b border-border/50 pb-6 last:border-0 last:pb-0">
                       <p className="font-semibold mb-3 text-lg">{q.title}</p>
                       <div className="grid md:grid-cols-2 gap-8">
                          
                          {/* User Selection */}
                          <div className={`p-4 rounded-lg border ${q.isCorrect ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}`}>
                             <p className="text-xs font-bold uppercase mb-2 text-muted-foreground">Your Selection</p>
                             <p className="text-base font-semibold flex items-start gap-2">
                                {q.isCorrect ? <CheckCircle2 className="w-5 h-5 text-success mt-0.5 shrink-0" /> : <XCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />}
                                <span>{q.userLabel}</span>
                             </p>
                             {/* Only show feedback here if wrong */}
                             {q.userFeedback && <p className="text-sm text-muted-foreground mt-2">{q.userFeedback}</p>}
                          </div>

                          {/* Correct Analysis */}
                          <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                             <p className="text-xs font-bold uppercase mb-2 text-primary">
                                {q.isCorrect ? "Analysis" : "Preferred Strategy"}
                             </p>
                             
                             <p className="text-base font-semibold flex items-start gap-2 mb-2">
                                <Star className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                                <span>{q.correctLabel}</span>
                             </p>
                             
                             <p className="text-sm text-muted-foreground leading-relaxed">
                                {q.explanation}
                             </p>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              )}

              {/* === COPILOT DISPLAY === */}
              {result.type === "COPILOT" && (
                <div>
                   <div className="flex items-center gap-4 mb-4">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-6 h-6 ${s <= Math.round((result.aiScore/20)*5) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                      <span className="text-lg font-medium">{result.aiScore?.toFixed(0)} / 20</span>
                   </div>
                   <div className="text-sm text-muted-foreground bg-black/20 p-4 rounded leading-relaxed">
                      <ReactMarkdown>{result.feedback || "No feedback generated."}</ReactMarkdown>
                   </div>
                </div>
              )}

              {/* === UPLOAD DISPLAY === */}
              {result.type === "UPLOAD" && (
                <div className="flex items-center gap-4 p-4 border border-dashed border-primary/30 bg-primary/5 rounded">
                   <UploadCloud className="w-8 h-8 text-primary" />
                   <div>
                      <p className="font-semibold">Architecture Diagram Uploaded</p>
                      <a href={result.imageUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">View Submission</a>
                   </div>
                   <div className="ml-auto">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                        Completed
                      </span>
                   </div>
                </div>
              )}

            </Card>
          ))}
        </div>

        {/* --- GRAND TOTAL ANIMATION --- */}
        <div className="sticky bottom-6 z-50">
           <Card className="p-6 bg-background/95 backdrop-blur-md border-primary/50 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] flex items-center justify-between max-w-4xl mx-auto border-2">
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-primary animate-pulse" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-bold uppercase tracking-wider">Mission Score</h3>
                    <p className="text-muted-foreground text-sm">Aggregated Performance</p>
                 </div>
              </div>

              <div className="text-right">
                 <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400 tabular-nums">
                    <CountUp end={grandTotal} />
                 </div>
              </div>
           </Card>
        </div>

        <div className="mt-12 text-center pb-20">
           <Button onClick={handleReturnHome} variant="outline" size="lg" className="gap-2">
             <ArrowLeft className="w-4 h-4" /> Return to Control Center
           </Button>
        </div>

      </div>
    </div>
  );
}