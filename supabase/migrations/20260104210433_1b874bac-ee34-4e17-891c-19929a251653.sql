-- Add is_private column to study_rooms table
ALTER TABLE public.study_rooms 
ADD COLUMN is_private boolean NOT NULL DEFAULT false;

-- Update RLS policy to only show public rooms for browsing (future feature)
-- Users can still access private rooms if they have the code