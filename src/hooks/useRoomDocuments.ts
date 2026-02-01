import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RoomDocument {
  id: string;
  room_id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export const useRoomDocuments = (roomId: string | undefined) => {
  return useQuery({
    queryKey: ['room-documents', roomId],
    queryFn: async () => {
      if (!roomId) return [];

      const { data, error } = await supabase
        .from('room_documents')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RoomDocument[];
    },
    enabled: !!roomId,
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ roomId, file }: { roomId: string; file: File }) => {
      if (!user) throw new Error('No user');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${roomId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('room-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('room-documents')
        .getPublicUrl(fileName);

      // Save document reference to database
      const { data, error } = await supabase
        .from('room_documents')
        .insert({
          room_id: roomId,
          user_id: user.id,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type || 'application/octet-stream',
          file_size: file.size,
        })
        .select()
        .single();

      if (error) throw error;
      return data as RoomDocument;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['room-documents', variables.roomId] });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ document }: { document: RoomDocument }) => {
      // Extract storage path from URL
      const urlParts = document.file_url.split('/room-documents/');
      if (urlParts.length > 1) {
        const storagePath = urlParts[1];
        await supabase.storage
          .from('room-documents')
          .remove([storagePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('room_documents')
        .delete()
        .eq('id', document.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['room-documents', variables.document.room_id] });
    },
  });
};
