import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RoomNotes {
  id: string;
  room_id: string;
  content: string;
  last_edited_by: string | null;
  updated_at: string;
}

export const useRoomNotes = (roomId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['room-notes', roomId],
    queryFn: async () => {
      if (!roomId) return null;

      const { data, error } = await supabase
        .from('room_notes')
        .select('*')
        .eq('room_id', roomId)
        .single();

      if (error) throw error;
      return data as RoomNotes;
    },
    enabled: !!roomId,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`notes-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'room_notes',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          queryClient.setQueryData(['room-notes', roomId], payload.new as RoomNotes);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);

  return query;
};

export const useUpdateNotes = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ roomId, content }: { roomId: string; content: string }) => {
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('room_notes')
        .update({
          content,
          last_edited_by: user.id,
        })
        .eq('room_id', roomId);

      if (error) throw error;
    },
  });
};
