import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Music,
  ChevronDown,
  ChevronUp,
  CloudRain,
  Coffee,
  Wind,
  Waves,
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Track {
  id: string;
  name: string;
  icon: React.ReactNode;
  type: 'tone' | 'noise';
  noiseType?: string;
  frequency?: number;
}

const tracks: Track[] = [
  { id: 'brown-noise', name: 'Brown Noise', icon: <Wind className="h-4 w-4" />, type: 'noise', noiseType: 'brown' },
  { id: 'pink-noise', name: 'Pink Noise', icon: <Wind className="h-4 w-4" />, type: 'noise', noiseType: 'pink' },
  { id: 'white-noise', name: 'White Noise', icon: <Wind className="h-4 w-4" />, type: 'noise', noiseType: 'white' },
  { id: 'rain', name: 'Rain Sounds', icon: <CloudRain className="h-4 w-4" />, type: 'noise', noiseType: 'rain' },
  { id: 'ocean', name: 'Ocean Waves', icon: <Waves className="h-4 w-4" />, type: 'noise', noiseType: 'ocean' },
  { id: 'cafe', name: 'Coffee Shop', icon: <Coffee className="h-4 w-4" />, type: 'noise', noiseType: 'cafe' },
  { id: 'binaural-alpha', name: 'Alpha Waves (Focus)', icon: <Brain className="h-4 w-4" />, type: 'tone', frequency: 10 },
  { id: 'binaural-theta', name: 'Theta Waves (Relax)', icon: <Brain className="h-4 w-4" />, type: 'tone', frequency: 6 },
];

// Generate noise using Web Audio API
const createNoiseGenerator = (audioContext: AudioContext, type: string): AudioNode => {
  const bufferSize = 2 * audioContext.sampleRate;
  const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const output = noiseBuffer.getChannelData(0);

  if (type === 'white') {
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  } else if (type === 'pink') {
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
  } else if (type === 'brown') {
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }
  } else if (type === 'rain') {
    // Simulate rain with filtered noise and droplet sounds
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Low frequency rumble + occasional high frequency drops
      const dropChance = Math.random();
      const drop = dropChance > 0.999 ? (Math.random() * 0.3) : 0;
      output[i] = ((lastOut + (0.015 * white)) / 1.015) * 2.5 + drop;
      lastOut = output[i];
    }
  } else if (type === 'ocean') {
    // Simulate ocean waves with modulated noise
    for (let i = 0; i < bufferSize; i++) {
      const t = i / audioContext.sampleRate;
      const waveModulation = Math.sin(t * 0.15 * Math.PI * 2) * 0.5 + 0.5;
      const white = Math.random() * 2 - 1;
      output[i] = white * waveModulation * 0.4;
    }
  } else if (type === 'cafe') {
    // Simulate coffee shop ambient with layered noise
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Mix of brown noise (background) with occasional higher frequencies
      const murmur = Math.random() > 0.98 ? (Math.random() - 0.5) * 0.2 : 0;
      output[i] = ((lastOut + (0.025 * white)) / 1.025) * 2 + murmur;
      lastOut = output[i];
    }
  }

  const source = audioContext.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;
  return source;
};

// Generate binaural beats
const createBinauralBeats = (audioContext: AudioContext, beatFreq: number = 10): AudioNode[] => {
  const baseFreq = 200;

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

const InlineFocusMusic = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(30);
  const [isMuted, setIsMuted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
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

  const startAudio = useCallback(async (track: Track) => {
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

      if (track.type === 'tone') {
        const [oscLeft, oscRight, merger] = createBinauralBeats(ctx, track.frequency || 10);
        (merger as AudioNode).connect(gainNodeRef.current);
        (oscLeft as OscillatorNode).start();
        (oscRight as OscillatorNode).start();
        sourceNodesRef.current = [oscLeft, oscRight, merger];
      } else {
        const source = createNoiseGenerator(ctx, track.noiseType || 'brown') as AudioBufferSourceNode;
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
      const success = await startAudio(currentTrack);
      if (success) {
        setIsPlaying(true);
      }
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
        const success = await startAudio(tracks[index]);
        if (success) setIsPlaying(true);
      }, 50);
    }
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col items-center gap-3 mt-6">
      <div className="flex items-center gap-3">
        <Button
          size="icon"
          variant={isPlaying ? "default" : "outline"}
          className="h-10 w-10 rounded-full"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              className="gap-2 text-sm"
            >
              {currentTrack.icon}
              <span>{currentTrack.name}</span>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="center">
            <div className="space-y-1 max-h-[280px] overflow-y-auto">
              {tracks.map((track, index) => (
                <button
                  key={track.id}
                  onClick={() => selectTrack(index)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-3",
                    index === currentTrackIndex
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  {track.icon}
                  <span className="font-medium">{track.name}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

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
          className="w-24"
        />
      </div>
      
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Music className="h-3 w-3" />
        Focus sounds for concentration
      </p>
    </div>
  );
};

export default InlineFocusMusic;
