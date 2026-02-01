import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Participant {
  id: string;
  name: string;
  stream?: MediaStream;
  screenStream?: MediaStream;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
}

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'screen-share-start' | 'screen-share-stop';
  from: string;
  to?: string;
  data?: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

export const useVideoCall = (roomId: string) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const screenPeerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  };

  // Send renegotiation offer to a peer
  const sendRenegotiationOffer = useCallback(async (peerId: string, pc: RTCPeerConnection) => {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      channelRef.current?.send({
        type: 'broadcast',
        event: 'signaling',
        payload: {
          type: 'offer',
          from: user?.id,
          to: peerId,
          data: offer,
        },
      });
    } catch (err) {
      console.error('Failed to send renegotiation offer:', err);
    }
  }, [user?.id]);

  const createPeerConnection = useCallback((peerId: string) => {
    // Check if connection already exists
    const existingPc = peerConnections.current.get(peerId);
    if (existingPc && existingPc.connectionState !== 'closed' && existingPc.connectionState !== 'failed') {
      return existingPc;
    }

    const pc = new RTCPeerConnection(configuration);

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'signaling',
          payload: {
            type: 'ice-candidate',
            from: user?.id,
            to: peerId,
            data: event.candidate.toJSON(),
          },
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('Received track from', peerId, event.track.kind);
      setParticipants((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(peerId);
        newMap.set(peerId, {
          id: peerId,
          name: existing?.name || 'Participant',
          stream: event.streams[0],
          screenStream: existing?.screenStream,
          isMuted: existing?.isMuted || false,
          isVideoOff: existing?.isVideoOff || false,
          isScreenSharing: existing?.isScreenSharing || false,
        });
        return newMap;
      });
    };

    pc.onnegotiationneeded = async () => {
      // Handle renegotiation when tracks are added/removed
      if (pc.signalingState === 'stable') {
        await sendRenegotiationOffer(peerId, pc);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', peerId, pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        peerConnections.current.delete(peerId);
        setParticipants((prev) => {
          const newMap = new Map(prev);
          newMap.delete(peerId);
          return newMap;
        });
      }
    };

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        console.log('Adding local track:', track.kind);
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Add screen share tracks if active
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        console.log('Adding screen track:', track.kind);
        pc.addTrack(track, screenStreamRef.current!);
      });
    }

    peerConnections.current.set(peerId, pc);
    return pc;
  }, [user?.id, sendRenegotiationOffer]);

  const handleSignaling = useCallback(async (message: SignalingMessage) => {
    if (message.type === 'screen-share-start' || message.type === 'screen-share-stop') {
      // Handle screen share status updates
      setParticipants((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(message.from);
        if (existing) {
          newMap.set(message.from, {
            ...existing,
            isScreenSharing: message.type === 'screen-share-start',
          });
        }
        return newMap;
      });
      return;
    }

    if (message.to !== user?.id) return;

    let pc = peerConnections.current.get(message.from);

    if (message.type === 'offer') {
      if (!pc) {
        pc = createPeerConnection(message.from);
      }
      
      // Handle offer collision (both sides creating offers)
      if (pc.signalingState !== 'stable') {
        await Promise.all([
          pc.setLocalDescription({ type: 'rollback' }),
          pc.setRemoteDescription(new RTCSessionDescription(message.data as RTCSessionDescriptionInit)),
        ]);
      } else {
        await pc.setRemoteDescription(new RTCSessionDescription(message.data as RTCSessionDescriptionInit));
      }
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      channelRef.current?.send({
        type: 'broadcast',
        event: 'signaling',
        payload: {
          type: 'answer',
          from: user?.id,
          to: message.from,
          data: answer,
        },
      });
    } else if (message.type === 'answer') {
      if (pc && pc.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(message.data as RTCSessionDescriptionInit));
      }
    } else if (message.type === 'ice-candidate') {
      if (pc && message.data) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(message.data as RTCIceCandidateInit));
        } catch (err) {
          console.error('Failed to add ICE candidate:', err);
        }
      }
    }
  }, [user?.id, createPeerConnection]);

  const startCall = useCallback(async () => {
    if (!user || !roomId) return;

    setIsConnecting(true);
    setError(null);

    try {
      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Set up signaling channel
      const channel = supabase.channel(`video-call-${roomId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: user.id },
        },
      });

      channel
        .on('broadcast', { event: 'signaling' }, ({ payload }) => {
          handleSignaling(payload as SignalingMessage);
        })
        .on('presence', { event: 'join' }, async ({ key }) => {
          // When someone joins, send them an offer
          if (key !== user.id) {
            console.log('Peer joined:', key);
            const pc = createPeerConnection(key);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            channel.send({
              type: 'broadcast',
              event: 'signaling',
              payload: {
                type: 'offer',
                from: user.id,
                to: key,
                data: offer,
              },
            });
          }
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          console.log('Peer left:', key);
          // Clean up when someone leaves
          const pc = peerConnections.current.get(key);
          if (pc) {
            pc.close();
            peerConnections.current.delete(key);
          }
          setParticipants((prev) => {
            const newMap = new Map(prev);
            newMap.delete(key);
            return newMap;
          });
        });

      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id });
          setIsConnected(true);
          setIsConnecting(false);
        }
      });

      channelRef.current = channel;
    } catch (err) {
      console.error('Failed to start call:', err);
      setError(err instanceof Error ? err.message : 'Failed to start video call. Please allow camera/microphone access.');
      setIsConnecting(false);
    }
  }, [user, roomId, handleSignaling, createPeerConnection]);

  const endCall = useCallback(() => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    // Stop screen share
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
      setIsScreenSharing(false);
    }

    // Close all peer connections
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();
    
    screenPeerConnections.current.forEach((pc) => pc.close());
    screenPeerConnections.current.clear();

    // Unsubscribe from channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setParticipants(new Map());
    setIsConnected(false);
    setError(null);
  }, []);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        
        // Remove screen track from all peer connections
        peerConnections.current.forEach((pc) => {
          const senders = pc.getSenders();
          senders.forEach((sender) => {
            if (sender.track && screenStreamRef.current?.getTracks().includes(sender.track)) {
              pc.removeTrack(sender);
            }
          });
        });
        
        screenStreamRef.current = null;
        setScreenStream(null);
      }
      setIsScreenSharing(false);

      // Notify others
      channelRef.current?.send({
        type: 'broadcast',
        event: 'signaling',
        payload: {
          type: 'screen-share-stop',
          from: user?.id,
        },
      });
    } else {
      try {
        // Clear any previous error
        setError(null);
        
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

        screenStreamRef.current = stream;
        setScreenStream(stream);
        setIsScreenSharing(true);

        // Add screen track to all peer connections
        const screenTrack = stream.getVideoTracks()[0];
        peerConnections.current.forEach((pc) => {
          pc.addTrack(screenTrack, stream);
        });

        // Notify others
        channelRef.current?.send({
          type: 'broadcast',
          event: 'signaling',
          payload: {
            type: 'screen-share-start',
            from: user?.id,
          },
        });

        // Handle when user stops sharing via browser UI
        screenTrack.onended = () => {
          toggleScreenShare();
        };
      } catch (err) {
        console.error('Failed to start screen sharing:', err);
        // User cancelled or browser timeout - don't show error for cancellation
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
            // User cancelled the picker or timeout - silently ignore
            return;
          }
        }
        setError('Failed to start screen sharing. Please try again.');
      }
    }
  }, [isScreenSharing, user?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    isConnected,
    isConnecting,
    localStream,
    screenStream,
    participants,
    isMuted,
    isVideoOff,
    isScreenSharing,
    error,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
  };
};
