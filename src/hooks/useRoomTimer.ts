import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { notifyRoomActivity } from '@/utils/notifications';

export interface TimerState {
  id: string;
  room_id: string;
  is_running: boolean;
  is_break: boolean;
  time_remaining: number;
  started_at: string | null;
  last_action_by: string | null;
  last_action: string | null;
  updated_at: string;
}

export const useRoomTimer = (roomId: string | undefined) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const previousTimerState = useRef<TimerState | null>(null);

  const query = useQuery({
    queryKey: ['room-timer', roomId],
    queryFn: async () => {
      if (!roomId) return null;

      const { data, error } = await supabase
        .from('room_timer_state')
        .select('*')
        .eq('room_id', roomId)
        .single();

      if (error) throw error;
      return data as TimerState;
    },
    enabled: !!roomId,
  });

  // Subscribe to realtime updates with notifications
  useEffect(() => {
    if (!roomId || !user) return;

    const channel = supabase
      .channel(`timer-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'room_timer_state',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const newState = payload.new as TimerState;
          const prevState = previousTimerState.current;
          
          queryClient.setQueryData(['room-timer', roomId], newState);
          
          // Notify when someone else starts the timer
          if (
            newState.is_running && 
            !prevState?.is_running && 
            newState.last_action_by !== user.id
          ) {
            // Fetch the user who started the timer
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', newState.last_action_by)
              .single();
            
            const userName = profile?.full_name || 'Someone';
            notifyRoomActivity('timer_started', `${userName} started the timer`);
          }
          
          previousTimerState.current = newState;
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient, user]);

  // Keep track of previous state
  useEffect(() => {
    if (query.data) {
      previousTimerState.current = query.data;
    }
  }, [query.data]);

  return query;
};

export const useUpdateTimer = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      roomId, 
      updates, 
      action 
    }: { 
      roomId: string; 
      updates: Partial<TimerState>; 
      action: string;
    }) => {
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('room_timer_state')
        .update({
          ...updates,
          last_action_by: user.id,
          last_action: action,
        })
        .eq('room_id', roomId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['room-timer', variables.roomId] });
    },
  });
};
