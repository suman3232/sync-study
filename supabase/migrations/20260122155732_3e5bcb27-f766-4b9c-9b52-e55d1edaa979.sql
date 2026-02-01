-- Create storage bucket for room documents
INSERT INTO storage.buckets (id, name, public) VALUES ('room-documents', 'room-documents', true);

-- Create table to track room documents
CREATE TABLE public.room_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.room_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for room_documents
CREATE POLICY "Members can view room documents"
ON public.room_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM room_members
    WHERE room_members.room_id = room_documents.room_id
    AND room_members.user_id = auth.uid()
  )
);

CREATE POLICY "Members can upload documents"
ON public.room_documents
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM room_members
    WHERE room_members.room_id = room_documents.room_id
    AND room_members.user_id = auth.uid()
  )
);

CREATE POLICY "Uploaders can delete their own documents"
ON public.room_documents
FOR DELETE
USING (auth.uid() = user_id);

-- Storage policies for room-documents bucket
CREATE POLICY "Room members can upload documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'room-documents' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Room members can view documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'room-documents');

CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'room-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Enable realtime for room_documents
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_documents;