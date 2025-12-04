import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, modelAnswer } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Scoring prompt:", (prompt || "").substring(0, 500) + "...");

    // Ask the model to return a JSON object with score, feedback, enhanced prompt, and individual scores
    const systemContent = `You are an expert prompt evaluator. Your task is to assess how well the user's prompt aligns with the following rubric and optionally reference the provided model answer.

Evaluation Criteria:
A. Goal: Did the user clearly state what they want Copilot to do?
B. Context: Did the user provide relevant background (audience, domain, constraints)?
C. Source: Did the user include references, examples, or data Copilot should use?
D. Expectation: Did the user specify output format, tone, length, and quality?

Scoring Instructions:
- Rate each criterion (A, B, C, D) from 1 to 5 using the detailed descriptions below.
- Sum the four scores to produce a total score between 0 and 20.

Detailed Rubric:
A. Goal (Clarity of Purpose)
5 – Excellent: Clearly states desired outcome with no ambiguity.
4 – Good: Mostly clear goal; minor clarifications needed.
3 – Fair: Somewhat clear; leaves room for interpretation.
2 – Poor: Vague or partially missing goal.
1 – Very Poor: No clear goal; Copilot must guess user intent.

B. Context (Relevant Background Information)
5 – Excellent: All necessary background details provided (audience, domain, constraints).
4 – Good: Most relevant context included; minor details missing.
3 – Fair: Some context, but key details missing.
2 – Poor: Minimal context; important information lacking.
1 – Very Poor: No context; prompt isolated and unclear.

C. Source (Reference Material or Data)
5 – Excellent: Accurate sources, examples, or data included.
4 – Good: Some source material provided, but not comprehensive.
3 – Fair: Vague mention of sources without specifics.
2 – Poor: Sources suggested but not provided.
1 – Very Poor: No sources or references; relies on assumptions.

D. Expectation (Output Format & Quality)
5 – Excellent: Clearly specifies output type, tone, length, and quality standards. 
4 – Good: Indicates output format but lacks minor details. 
3 – Fair: General idea of output given, some ambiguity remains.
2 – Poor: Minimal guidance on output expectations.
1 – Very Poor: No indication of output format or quality.

Output Requirements:
Return ONLY a valid JSON object with these fields:
- score: a sum of total score between 0 and 20
- goal_score: score for Goal (1-5)
- context_score: score for Context (1-5)
- source_score: score for Source (1-5)
- expectation_score: score for Expectation (1-5)
- feedback: a string explaining why the prompt is good or bad and how to improve it, the string shall cover 1. Goal: Did the prompt clearly state what I want Copilot to do? 2. Context: Did the prompt provide relevant background (audience, domain, constraints)? 3. Source: Did the prompt include references, examples, or data Copilot should use? and 4. Expectation: Did the prompt specify output format, tone, length, and quality?. Analyse in each part one by one
- enhanced_prompt: an improved version of the user's prompt that addresses the issues identified

Do not include additional text.`;

    const userContent = `Model Answer:
${modelAnswer}

Evaluate this prompt and return the JSON object described above for the following prompt:

${prompt}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    // Trim code fences if present
    content = content.trim().replace(/^```(?:json)?\n/, "").replace(/\n```$/, "");

    // Try to extract JSON
    let parsed: {
      score?: number | string;
      goal_score?: number | string;
      context_score?: number | string;
      source_score?: number | string;
      expectation_score?: number | string;
      feedback?: string;
      enhanced_prompt?: string;
    } | null = null;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch (e2) {
          console.error("Failed to parse JSON from model response:", e2, "raw content:", content);
        }
      } else {
        console.error("No JSON object found in model response:", content);
      }
    }

    // Fallbacks
    let score = 0;
    let goal_score = 0;
    let context_score = 0;
    let source_score = 0;
    let expectation_score = 0;
    let feedback = "";
    let enhanced_prompt = "";

    if (parsed) {
      score = typeof parsed.score === "number" ? parsed.score : parseFloat(String(parsed.score)) || 0;
      goal_score = typeof parsed.goal_score === "number" ? parsed.goal_score : parseFloat(String(parsed.goal_score)) || 0;
      context_score = typeof parsed.context_score === "number" ? parsed.context_score : parseFloat(String(parsed.context_score)) || 0;
      source_score = typeof parsed.source_score === "number" ? parsed.source_score : parseFloat(String(parsed.source_score)) || 0;
      expectation_score = typeof parsed.expectation_score === "number" ? parsed.expectation_score : parseFloat(String(parsed.expectation_score)) || 0;
      feedback = parsed.feedback ? String(parsed.feedback) : "";
      enhanced_prompt = parsed.enhanced_prompt ? String(parsed.enhanced_prompt) : prompt;
    } else {
      const numMatch = content.match(/\d+(\.\d+)?/g);
      score = numMatch && numMatch[0] ? parseFloat(numMatch[0]) : 0;
      goal_score = numMatch && numMatch[1] ? parseFloat(numMatch[1]) : 0;
      context_score = numMatch && numMatch[2] ? parseFloat(numMatch[2]) : 0;
      source_score = numMatch && numMatch[3] ? parseFloat(numMatch[3]) : 0;
      expectation_score = numMatch && numMatch[4] ? parseFloat(numMatch[4]) : 0;
      feedback = content.replace(/\r|\n/g, " ").slice(0, 2000);
      enhanced_prompt = prompt;
    }

    // Normalize to valid ranges
    score = Math.max(0, Math.min(20, Number(score)));
    goal_score = Math.max(1, Math.min(5, Number(goal_score)));
    context_score = Math.max(1, Math.min(5, Number(context_score)));
    source_score = Math.max(1, Math.min(5, Number(source_score)));
    expectation_score = Math.max(1, Math.min(5, Number(expectation_score)));

    console.log("Calculated score:", score);

    // Store feedback in Supabase if configured
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const insertPayload = {
          prompt,
          model_answer: modelAnswer,
          score,
          goal_score,
          context_score,
          source_score,
          expectation_score,
          feedback,
          created_at: new Date().toISOString(),
        };
        const { error: insertError } = await supabase.from("prompt_feedback").insert([insertPayload]);
        if (insertError) {
          console.error("Failed to store feedback in Supabase:", insertError);
        } else {
          console.log("Stored prompt feedback in Supabase");
        }
      } catch (e) {
        console.error("Error storing feedback in Supabase:", e);
      }
    } else {
      console.log("Supabase not configured; skipping storage of feedback");
    }

    return new Response(
      JSON.stringify({ score, goal_score, context_score, source_score, expectation_score, feedback, enhanced_prompt }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
