import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Music,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Track {
  id: string;
  name: string;
  category: string;
  type: 'tone' | 'noise';
}

const tracks: Track[] = [
  { id: 'brown-noise', name: 'Brown Noise', category: 'Focus', type: 'noise' },
  { id: 'pink-noise', name: 'Pink Noise', category: 'Focus', type: 'noise' },
  { id: 'white-noise', name: 'White Noise', category: 'Focus', type: 'noise' },
  { id: 'binaural', name: 'Binaural Beats', category: 'Focus', type: 'tone' },
];

// Generate noise using Web Audio API
const createNoiseGenerator = (audioContext: AudioContext, type: string): AudioNode => {
  const bufferSize = 2 * audioContext.sampleRate;
  const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const output = noiseBuffer.getChannelData(0);

  if (type === 'white-noise') {
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  } else if (type === 'pink-noise') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  } else if (type === 'brown-noise') {
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }
  }

  const source = audioContext.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;
  return source;
};

// Generate binaural beats
const createBinauralBeats = (audioContext: AudioContext): AudioNode[] => {
  const baseFreq = 200;
  const beatFreq = 10; // Alpha waves for focus

  const oscLeft = audioContext.createOscillator();
  const oscRight = audioContext.createOscillator();
  
  oscLeft.frequency.value = baseFreq;
  oscRight.frequency.value = baseFreq + beatFreq;
  
  oscLeft.type = 'sine';
  oscRight.type = 'sine';

  const merger = audioContext.createChannelMerger(2);
  
  const gainLeft = audioContext.createGain();
  const gainRight = audioContext.createGain();
  gainLeft.gain.value = 0.3;
  gainRight.gain.value = 0.3;

  oscLeft.connect(gainLeft);
  oscRight.connect(gainRight);
  gainLeft.connect(merger, 0, 0);
  gainRight.connect(merger, 0, 1);

  return [oscLeft, oscRight, merger];
};

const FocusMusicPlayer = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(30);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodesRef = useRef<AudioNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);

  const currentTrack = tracks[currentTrackIndex];

  const stopCurrentAudio = useCallback(() => {
    sourceNodesRef.current.forEach(node => {
      try {
        if (node instanceof AudioBufferSourceNode || node instanceof OscillatorNode) {
          node.stop();
        }
        node.disconnect();
      } catch (e) {
        // Already stopped
      }
    });
    sourceNodesRef.current = [];
  }, []);

  const startAudio = useCallback(async (trackId: string) => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext();
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const ctx = audioContextRef.current;
      
      // Create gain node for volume control
      gainNodeRef.current = ctx.createGain();
      gainNodeRef.current.gain.value = isMuted ? 0 : volume / 100;
      gainNodeRef.current.connect(ctx.destination);

      if (trackId === 'binaural') {
        const [oscLeft, oscRight, merger] = createBinauralBeats(ctx);
        (merger as AudioNode).connect(gainNodeRef.current);
        (oscLeft as OscillatorNode).start();
        (oscRight as OscillatorNode).start();
        sourceNodesRef.current = [oscLeft, oscRight, merger];
      } else {
        const source = createNoiseGenerator(ctx, trackId) as AudioBufferSourceNode;
        source.connect(gainNodeRef.current);
        source.start();
        sourceNodesRef.current = [source];
      }

      return true;
    } catch (error) {
      console.error('Failed to start audio:', error);
      return false;
    }
  }, [volume, isMuted]);

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCurrentAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopCurrentAudio]);

  const togglePlay = async () => {
    if (isPlaying) {
      stopCurrentAudio();
      setIsPlaying(false);
    } else {
      const success = await startAudio(currentTrack.id);
      if (success) {
        setIsPlaying(true);
      }
    }
  };

  const nextTrack = async () => {
    const wasPlaying = isPlaying;
    stopCurrentAudio();
    setIsPlaying(false);

    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextIndex);

    if (wasPlaying) {
      setTimeout(async () => {
        const success = await startAudio(tracks[nextIndex].id);
        if (success) setIsPlaying(true);
      }, 50);
    }
  };

  const selectTrack = async (index: number) => {
    if (index === currentTrackIndex && isPlaying) return;
    
    const wasPlaying = isPlaying;
    stopCurrentAudio();
    setIsPlaying(false);
    setCurrentTrackIndex(index);

    if (wasPlaying) {
      setTimeout(async () => {
        const success = await startAudio(tracks[index].id);
        if (success) setIsPlaying(true);
      }, 50);
    }
  };

  return (
    <Card className={cn(
      "fixed bottom-4 right-4 w-72 transition-all duration-300 shadow-lg z-40",
      !isExpanded && "w-auto"
    )}>
      <CardContent className="p-3">
        {/* Collapsed View */}
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant={isPlaying ? "default" : "outline"}
            className="h-10 w-10 rounded-full shrink-0"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>

          {isExpanded ? (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{currentTrack.name}</p>
              <p className="text-xs text-muted-foreground">{currentTrack.category}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Focus Sounds</span>
            </div>
          )}

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <div className="mt-4 space-y-4 animate-fade-in">
            {/* Controls */}
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={nextTrack}
              >
                <SkipForward className="h-4 w-4" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>

              <Slider
                value={[isMuted ? 0 : volume]}
                max={100}
                step={1}
                onValueChange={(val) => {
                  setVolume(val[0]);
                  if (val[0] > 0) setIsMuted(false);
                }}
                className="flex-1"
              />
            </div>

            {/* Track List */}
            <div className="space-y-1">
              {tracks.map((track, index) => (
                <button
                  key={track.id}
                  onClick={() => selectTrack(index)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    index === currentTrackIndex
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  <p className="font-medium">{track.name}</p>
                  <p className="text-xs text-muted-foreground">{track.category}</p>
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Generated ambient sounds for focus
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FocusMusicPlayer;
