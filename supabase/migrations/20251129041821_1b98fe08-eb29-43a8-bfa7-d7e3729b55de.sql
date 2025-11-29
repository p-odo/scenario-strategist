-- Create groups table
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create scenarios table
CREATE TABLE public.scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create options table
CREATE TABLE public.options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  cost_label TEXT,
  impact_label TEXT,
  speed_label TEXT,
  implications TEXT[],
  business_impact_score DECIMAL(3,1) NOT NULL,
  time_score DECIMAL(3,1) NOT NULL,
  cost_score DECIMAL(3,1) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create group_progress table
CREATE TABLE public.group_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE NOT NULL,
  current_task INTEGER NOT NULL DEFAULT 1,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, scenario_id)
);

-- Create group_choices table
CREATE TABLE public.group_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  option_id UUID REFERENCES public.options(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create copilot_submissions table
CREATE TABLE public.copilot_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE NOT NULL,
  prompt TEXT NOT NULL,
  ai_score DECIMAL(5,2),
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public read, authenticated write for simulation purposes)
CREATE POLICY "Public can view groups" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Anyone can create groups" ON public.groups FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view scenarios" ON public.scenarios FOR SELECT USING (true);

CREATE POLICY "Public can view tasks" ON public.tasks FOR SELECT USING (true);

CREATE POLICY "Public can view options" ON public.options FOR SELECT USING (true);

CREATE POLICY "Public can view progress" ON public.group_progress FOR SELECT USING (true);
CREATE POLICY "Anyone can create progress" ON public.group_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update progress" ON public.group_progress FOR UPDATE USING (true);

CREATE POLICY "Public can view choices" ON public.group_choices FOR SELECT USING (true);
CREATE POLICY "Anyone can create choices" ON public.group_choices FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view submissions" ON public.copilot_submissions FOR SELECT USING (true);
CREATE POLICY "Anyone can create submissions" ON public.copilot_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update submissions" ON public.copilot_submissions FOR UPDATE USING (true);