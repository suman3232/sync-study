import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LiveActivityIndicatorProps {
  status: 'studying' | 'break' | 'idle';
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const statusConfig = {
  studying: {
    label: 'Studying',
    icon: '📚',
    dotColor: 'bg-primary',
    badgeClass: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20',
    pulseClass: 'animate-pulse',
  },
  break: {
    label: 'On Break',
    icon: '☕',
    dotColor: 'bg-success',
    badgeClass: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
    pulseClass: '',
  },
  idle: {
    label: 'Idle',
    icon: '💤',
    dotColor: 'bg-muted-foreground',
    badgeClass: 'bg-muted text-muted-foreground border-muted-foreground/20 hover:bg-muted/80',
    pulseClass: '',
  },
};

export const LiveActivityIndicator = ({ 
  status, 
  size = 'md',
  showLabel = true 
}: LiveActivityIndicatorProps) => {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        'gap-2 transition-all duration-300',
        config.badgeClass,
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'px-3 py-1'
      )}
    >
      <span className="relative flex h-2 w-2">
        <span 
          className={cn(
            'absolute inline-flex h-full w-full rounded-full opacity-75',
            config.dotColor,
            status === 'studying' && 'animate-ping'
          )}
        />
        <span 
          className={cn(
            'relative inline-flex rounded-full h-2 w-2',
            config.dotColor
          )}
        />
      </span>
      {showLabel && (
        <span className={cn(config.pulseClass)}>
          {config.icon} {config.label}
        </span>
      )}
    </Badge>
  );
};

// Compact dot-only indicator for avatars
export const StatusDot = ({ status }: { status: 'studying' | 'break' | 'idle' }) => {
  const config = statusConfig[status];
  
  return (
    <span className="absolute bottom-0 right-0 flex h-3 w-3">
      <span 
        className={cn(
          'absolute inline-flex h-full w-full rounded-full opacity-75',
          config.dotColor,
          status === 'studying' && 'animate-ping'
        )}
      />
      <span 
        className={cn(
          'relative inline-flex rounded-full h-3 w-3 border-2 border-background',
          config.dotColor
        )}
      />
    </span>
  );
};

export default LiveActivityIndicator;
