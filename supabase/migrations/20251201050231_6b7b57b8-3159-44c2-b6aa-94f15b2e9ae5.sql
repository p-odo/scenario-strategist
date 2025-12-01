-- Add individual rubric component scores to copilot_submissions table
ALTER TABLE copilot_submissions
ADD COLUMN goal_score INTEGER,
ADD COLUMN context_score INTEGER,
ADD COLUMN source_score INTEGER,
ADD COLUMN expectation_score INTEGER;