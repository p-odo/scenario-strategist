-- Create AI cheat sheets table
CREATE TABLE public.ai_cheat_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  header_color TEXT NOT NULL DEFAULT '#9ca3af',
  what_is TEXT NOT NULL,
  prerequisites TEXT NOT NULL,
  example_use_cases TEXT[] NOT NULL
);

-- Create junction table linking options to cheat sheets
CREATE TABLE public.option_cheat_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  option_id UUID NOT NULL REFERENCES public.options(id) ON DELETE CASCADE,
  cheat_sheet_id UUID NOT NULL REFERENCES public.ai_cheat_sheets(id) ON DELETE CASCADE,
  UNIQUE(option_id, cheat_sheet_id)
);

-- Enable RLS
ALTER TABLE public.ai_cheat_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.option_cheat_sheets ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "AI cheat sheets are viewable by everyone"
ON public.ai_cheat_sheets FOR SELECT USING (true);

CREATE POLICY "Option cheat sheets are viewable by everyone"
ON public.option_cheat_sheets FOR SELECT USING (true);

-- Insert initial cheat sheets based on the provided images
INSERT INTO public.ai_cheat_sheets (name, icon, header_color, what_is, prerequisites, example_use_cases) VALUES
('RPA', 'MonitorCog', '#14b8a6', 'RPA mimics your actions like clicking buttons, typing data or copying and pasting information, etc., following the pre-defined instructions you set.', 'RPA follows only your pre-defined instructions, which need to be carefully planned out to ensure optimal performances. The business process should also be reviewed beforehand.', ARRAY[
  'Automatic update of flight inventory with the latest flight plans',
  'Download data from a third-party system and generate reports'
]),
('IDP', 'FileSearch', '#14b8a6', 'IDP reads and extracts typed or handwritten info from documents, transform and input them to your desired location.', 'Human-in-the-loop is required when handling handwriting and images of low quality. Retraining is required to improve accuracy.', ARRAY[
  'Extract values from invoices and submit to the system',
  'Verify manual inputs with scanned documents'
]),
('AI Agent', 'MessageSquare', '#9ca3af', 'AI Agent is an assistant with reasoning capabilities that can plan and execute multi-step tasks with minimal human intervention.', 'AI agents may take unexpected actions to achieve goals. Strict limits and proactive monitoring are required to ensure they behave as designed.', ARRAY[
  'An agent to aggregate and analyse data from various dashboards',
  'An agent to support new joiners to apply all necessary system access'
]),
('Customized AI', 'LayoutDashboard', '#9ca3af', 'Customised AI is an in-house-developed model and trained on the proprietary data to unlock specific business insights and values.', 'The success of customized AI is contingent upon the high-quality data and a well-defined, high-value business objective.', ARRAY[
  'Build a custom JRS Simulation model for resource planning',
  'Build an optimisation model based on proprietary operations data'
]),
('Embedded AI', 'MapPin', '#9ca3af', 'Embedded AI refers to AI capabilities integrated directly into and operating on data within existing applications.', 'Embedded AI may offer little room for customisation. The solution should also support integration with Cathay''s governance, security and monitoring requirements.', ARRAY[
  'Leverage SAP''s Joule to review financial transactions in SAP',
  'Leverage ServiceNow''s NowAssist to process IT Service requests'
]),
('Conversational Chatbot', 'MessageCircle', '#9ca3af', 'Chatbot is an automated helper that follows a pre-defined logic to answer a fixed list of common FAQ.', 'The success of the chatbot depends on the configuration of the dialogue flow and clearly documented business processes.', ARRAY[
  'FAQ chatbot for new joiners',
  'Guided flow for customers to locate the right information on the website'
]),
('RAG', 'MessagesSquare', '#14b8a6', 'RAG is an AI chatbot that searches your knowledge base and generates personalised responses that your team can use as a helpful reference. Imagine ChatGPT for your department.', 'The quality and accuracy of chatbot responses depend on the quality of source data and prompt (how the question is being asked matters).', ARRAY[
  'Quick Search for Cargo Port Information and handling manuals',
  'Provide customised responses on US Tax policy enquiries'
]),
('Microsoft CoPilot', 'Box', '#14b8a6', 'CoPilot is an integrated digital assistant in M365 ecosystem. It uses your work data to create, summarize, and analyse content.', 'CoPilot is self-service, self-maintained and leverages only the data in the user''s own M365 ecosystem for personal use only.', ARRAY[
  'Summarise follow-up items and draft meeting minutes',
  'Download email attachments from specific suppliers to an Excel file'
]);