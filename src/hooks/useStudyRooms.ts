import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const ROOM_CATEGORIES = [
  { value: 'general', label: 'General', icon: 'BookOpen' },
  { value: 'exam-prep', label: 'Exam Prep', icon: 'GraduationCap' },
  { value: 'coding', label: 'Coding', icon: 'Code' },
  { value: 'reading', label: 'Reading', icon: 'BookMarked' },
  { value: 'writing', label: 'Writing', icon: 'PenTool' },
  { value: 'languages', label: 'Languages', icon: 'Languages' },
  { value: 'math', label: 'Math', icon: 'Calculator' },
  { value: 'creative', label: 'Creative', icon: 'Palette' },
] as const;

export type RoomCategory = typeof ROOM_CATEGORIES[number]['value'];

export interface StudyRoom {
  id: string;
  name: string;
  description: string | null;
  room_code: string;
  created_by: string;
  is_active: boolean;
  is_private: boolean;
  timer_duration: number;
  break_duration: number;
  category: RoomCategory;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  status: 'studying' | 'break' | 'idle';
  joined_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const useMyRooms = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-rooms', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get rooms user is a member of
      const { data: memberships, error: memberError } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      const roomIds = memberships?.map(m => m.room_id) || [];
      
      if (roomIds.length === 0) {
        return [];
      }

      // Get room details with member count
      const { data: rooms, error: roomsError } = await supabase
        .from('study_rooms')
        .select('*')
        .in('id', roomIds);

      if (roomsError) throw roomsError;

      // Get member counts for each room
      const roomsWithCounts = await Promise.all(
        (rooms || []).map(async (room) => {
          const { count } = await supabase
            .from('room_members')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);
          
          return {
            ...room,
            member_count: count || 0,
          };
        })
      );

      return roomsWithCounts as StudyRoom[];
    },
    enabled: !!user,
  });
};

export const useRoom = (roomId: string | undefined) => {
  return useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => {
      if (!roomId) return null;

      const { data, error } = await supabase
        .from('study_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) throw error;
      return data as StudyRoom;
    },
    enabled: !!roomId,
  });
};

export const useRoomByCode = () => {
  return useMutation({
    mutationFn: async (roomCode: string) => {
      const { data, error } = await supabase
        .from('study_rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .single();

      if (error) throw error;
      return data as StudyRoom;
    },
  });
};

export const useCreateRoom = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, description, isPrivate, category }: { name: string; description?: string; isPrivate?: boolean; category?: RoomCategory }) => {
      if (!user) throw new Error('No user');

      // Generate a room code
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let roomCode = '';
      for (let i = 0; i < 6; i++) {
        roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const { data: room, error: roomError } = await supabase
        .from('study_rooms')
        .insert({
          name,
          description,
          room_code: roomCode,
          created_by: user.id,
          is_private: isPrivate ?? false,
          category: category ?? 'general',
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add creator as member
      await supabase
        .from('room_members')
        .insert({
          room_id: room.id,
          user_id: user.id,
          status: 'idle',
        });

      // Create timer state
      await supabase
        .from('room_timer_state')
        .insert({
          room_id: room.id,
          time_remaining: room.timer_duration * 60,
        });

      // Create notes
      await supabase
        .from('room_notes')
        .insert({
          room_id: room.id,
          content: '',
        });

      return room as StudyRoom;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-rooms'] });
    },
  });
};

export const useUpdateRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      roomId, 
      updates 
    }: { 
      roomId: string; 
      updates: Partial<Pick<StudyRoom, 'name' | 'description' | 'timer_duration' | 'break_duration'>>; 
    }) => {
      const { data, error } = await supabase
        .from('study_rooms')
        .update(updates)
        .eq('id', roomId)
        .select()
        .single();

      if (error) throw error;
      return data as StudyRoom;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['room', variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ['my-rooms'] });
    },
  });
};

export const useJoinRoom = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (roomId: string) => {
      if (!user) throw new Error('No user');

      // Check if user is already a member
      const { data: existingMembership } = await supabase
        .from('room_members')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .single();

      // Only insert if not already a member
      if (!existingMembership) {
        const { error } = await supabase
          .from('room_members')
          .insert({
            room_id: roomId,
            user_id: user.id,
            status: 'idle',
          });

        if (error && error.code !== '23505') throw error; // Ignore duplicate key error
        
        return { isNewJoin: true };
      }
      
      return { isNewJoin: false };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room-members'] });
    },
  });
};

export const useLeaveRoom = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (roomId: string) => {
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room-members'] });
    },
  });
};

export const useRoomMembers = (roomId: string | undefined) => {
  return useQuery({
    queryKey: ['room-members', roomId],
    queryFn: async () => {
      if (!roomId) return [];

      const { data, error } = await supabase
        .from('room_members')
        .select(`
          *,
          profile:profiles!room_members_user_id_fkey(full_name, avatar_url)
        `)
        .eq('room_id', roomId);

      if (error) throw error;
      
      return data.map(member => ({
        ...member,
        profile: Array.isArray(member.profile) ? member.profile[0] : member.profile,
      })) as RoomMember[];
    },
    enabled: !!roomId,
  });
};

export const useUpdateMemberStatus = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ roomId, status }: { roomId: string; status: 'studying' | 'break' | 'idle' }) => {
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('room_members')
        .update({ status })
        .eq('room_id', roomId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['room-members', variables.roomId] });
    },
  });
};
