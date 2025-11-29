-- Add feedback column to copilot_submissions table to store AI evaluation feedback
ALTER TABLE copilot_submissions 
ADD COLUMN feedback text;