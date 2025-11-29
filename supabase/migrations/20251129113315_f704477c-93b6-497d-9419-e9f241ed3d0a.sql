-- Add enhanced_prompt column to copilot_submissions table
ALTER TABLE public.copilot_submissions
ADD COLUMN IF NOT EXISTS enhanced_prompt text;