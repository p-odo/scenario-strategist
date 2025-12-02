-- Create the Responsible AI Consideration table
CREATE TABLE public.responsible_ai_consideration (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    message text,
    CONSTRAINT responsible_ai_consideration_pkey PRIMARY KEY (id)
);

-- Create the Link table
CREATE TABLE public.option_ai_consideration (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    option_id uuid,
    reminder_id uuid,
    CONSTRAINT option_ai_consideration_pkey PRIMARY KEY (id),
    CONSTRAINT option_ai_consideration_option_id_fkey FOREIGN KEY (option_id) REFERENCES public.options(id),
    CONSTRAINT option_ai_consideration_reminder_id_fkey FOREIGN KEY (reminder_id) REFERENCES public.responsible_ai_consideration(id)
);

-- Enable Security (RLS)
ALTER TABLE responsible_ai_consideration ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_ai_consideration ENABLE ROW LEVEL SECURITY;

-- Allow Public Access
CREATE POLICY "Allow public read access" ON responsible_ai_consideration FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read access" ON option_ai_consideration FOR SELECT TO anon, authenticated USING (true);