-- Add option_name column to group_choices
ALTER TABLE public.group_choices ADD COLUMN IF NOT EXISTS option_name text;

-- Add feedback and is_correct columns to options
ALTER TABLE public.options ADD COLUMN IF NOT EXISTS feedback text;
ALTER TABLE public.options ADD COLUMN IF NOT EXISTS is_correct boolean DEFAULT false;

-- Add task_type and task_config columns to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_type text NOT NULL DEFAULT 'CHOICE'::text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_config jsonb DEFAULT '{}'::jsonb;

-- Create choice_submissions table
CREATE TABLE IF NOT EXISTS public.choice_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.groups(id),
  task_id uuid NOT NULL REFERENCES public.tasks(id),
  option_id uuid NOT NULL REFERENCES public.options(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create mcq_options table
CREATE TABLE IF NOT EXISTS public.mcq_options (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id),
  question_identifier text NOT NULL,
  choice_key text NOT NULL,
  label text NOT NULL,
  description text,
  explanation text,
  is_correct boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create mcq_submissions table
CREATE TABLE IF NOT EXISTS public.mcq_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.groups(id),
  task_id uuid NOT NULL REFERENCES public.tasks(id),
  answers jsonb NOT NULL,
  score numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create upload_submissions table
CREATE TABLE IF NOT EXISTS public.upload_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.groups(id),
  task_id uuid NOT NULL REFERENCES public.tasks(id),
  image_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.choice_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcq_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcq_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for choice_submissions
CREATE POLICY "Everyone can view choice submissions" ON public.choice_submissions FOR SELECT USING (true);
CREATE POLICY "Everyone can create choice submissions" ON public.choice_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can delete choice submissions" ON public.choice_submissions FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for mcq_options
CREATE POLICY "Everyone can view mcq options" ON public.mcq_options FOR SELECT USING (true);

-- RLS policies for mcq_submissions
CREATE POLICY "Everyone can view mcq submissions" ON public.mcq_submissions FOR SELECT USING (true);
CREATE POLICY "Everyone can create mcq submissions" ON public.mcq_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can delete mcq submissions" ON public.mcq_submissions FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for upload_submissions
CREATE POLICY "Everyone can view upload submissions" ON public.upload_submissions FOR SELECT USING (true);
CREATE POLICY "Everyone can create upload submissions" ON public.upload_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can delete upload submissions" ON public.upload_submissions FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));