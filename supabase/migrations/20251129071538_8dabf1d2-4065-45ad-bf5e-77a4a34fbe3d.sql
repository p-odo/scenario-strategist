-- Create user profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create trigger function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  
  -- Add default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

-- Create trigger for new user signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Update groups RLS policies
DROP POLICY IF EXISTS "Anyone can create groups" ON public.groups;
DROP POLICY IF EXISTS "Public can view groups" ON public.groups;

CREATE POLICY "Authenticated users can create groups"
ON public.groups FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Everyone can view groups"
ON public.groups FOR SELECT
USING (true);

CREATE POLICY "Admins can delete groups"
ON public.groups FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update group_choices RLS policies
DROP POLICY IF EXISTS "Anyone can create choices" ON public.group_choices;
DROP POLICY IF EXISTS "Public can view choices" ON public.group_choices;

CREATE POLICY "Authenticated users can create choices"
ON public.group_choices FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Everyone can view choices"
ON public.group_choices FOR SELECT
USING (true);

CREATE POLICY "Admins can delete choices"
ON public.group_choices FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update group_progress RLS policies
DROP POLICY IF EXISTS "Anyone can create progress" ON public.group_progress;
DROP POLICY IF EXISTS "Anyone can update progress" ON public.group_progress;
DROP POLICY IF EXISTS "Public can view progress" ON public.group_progress;

CREATE POLICY "Authenticated users can create progress"
ON public.group_progress FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update progress"
ON public.group_progress FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Everyone can view progress"
ON public.group_progress FOR SELECT
USING (true);

CREATE POLICY "Admins can delete progress"
ON public.group_progress FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update copilot_submissions RLS policies
DROP POLICY IF EXISTS "Anyone can create submissions" ON public.copilot_submissions;
DROP POLICY IF EXISTS "Anyone can update submissions" ON public.copilot_submissions;
DROP POLICY IF EXISTS "Public can view submissions" ON public.copilot_submissions;

CREATE POLICY "Authenticated users can create submissions"
ON public.copilot_submissions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update submissions"
ON public.copilot_submissions FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Everyone can view submissions"
ON public.copilot_submissions FOR SELECT
USING (true);

CREATE POLICY "Admins can delete submissions"
ON public.copilot_submissions FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for admin monitoring
ALTER PUBLICATION supabase_realtime ADD TABLE public.copilot_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_choices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;