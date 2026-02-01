-- Add category column to study_rooms table
ALTER TABLE public.study_rooms 
ADD COLUMN category text DEFAULT 'general';

-- Create an index for faster filtering
CREATE INDEX idx_study_rooms_category ON public.study_rooms(category);