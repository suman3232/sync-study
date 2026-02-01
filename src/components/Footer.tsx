import { useNavigate } from 'react-router-dom';
import { BookOpen, Timer, Users, Trophy, Flame } from 'lucide-react';

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="border-t bg-card/50 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-display font-bold text-lg">SyncStudy</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              A collaborative study platform designed to help you stay focused, 
              track your progress, and achieve your learning goals with friends.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 text-sm">Features</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Timer className="h-3 w-3" /> Pomodoro Timer
              </li>
              <li className="flex items-center gap-2">
                <Users className="h-3 w-3" /> Study Rooms
              </li>
              <li className="flex items-center gap-2">
                <Trophy className="h-3 w-3" /> Achievements
              </li>
              <li className="flex items-center gap-2">
                <Flame className="h-3 w-3" /> Daily Challenges
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 text-sm">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button onClick={() => navigate('/discover')} className="hover:text-primary transition-colors">
                  Discover Rooms
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/achievements')} className="hover:text-primary transition-colors">
                  Achievements
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/leaderboard')} className="hover:text-primary transition-colors">
                  Leaderboard
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/settings')} className="hover:text-primary transition-colors">
                  Settings
                </button>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} SyncStudy. Stay focused, study together.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Made with ❤️ for learners</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
