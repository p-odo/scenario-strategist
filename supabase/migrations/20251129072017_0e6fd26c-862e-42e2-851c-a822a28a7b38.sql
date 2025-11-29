-- Remove authentication requirement from RLS policies
-- Regular users can now create and update without signing in

DROP POLICY IF EXISTS "Authenticated users can create submissions" ON copilot_submissions;
DROP POLICY IF EXISTS "Authenticated users can update submissions" ON copilot_submissions;
DROP POLICY IF EXISTS "Authenticated users can create choices" ON group_choices;
DROP POLICY IF EXISTS "Authenticated users can create progress" ON group_progress;
DROP POLICY IF EXISTS "Authenticated users can update progress" ON group_progress;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;

-- Allow everyone to create and update
CREATE POLICY "Everyone can create submissions" ON copilot_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Everyone can update submissions" ON copilot_submissions
  FOR UPDATE USING (true);

CREATE POLICY "Everyone can create choices" ON group_choices
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Everyone can create progress" ON group_progress
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Everyone can update progress" ON group_progress
  FOR UPDATE USING (true);

CREATE POLICY "Everyone can create groups" ON groups
  FOR INSERT WITH CHECK (true);