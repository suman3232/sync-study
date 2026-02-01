import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Timer, 
  Users, 
  Zap, 
  ArrowRight, 
  CheckCircle2,
  Sparkles,
  Target,
  Trophy,
  MessageSquare,
  Music,
  TrendingUp,
  Clock,
  Star,
  Heart,
  Github,
  Twitter
} from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: Timer,
      title: 'Synced Pomodoro Timers',
      description: 'Study in sync with your group. Everyone sees the same timer, keeping you all focused together.',
    },
    {
      icon: Users,
      title: 'Collaborative Spaces',
      description: 'Share notes in real-time, chat with study partners, and see who\'s actively studying.',
    },
    {
      icon: Zap,
      title: 'Track Your Progress',
      description: 'Build study streaks, earn pomodoros, and climb the leaderboard. Stay motivated!',
    },
    {
      icon: Target,
      title: 'Daily Challenges',
      description: 'Complete daily goals to earn XP and stay consistent with your study habits.',
    },
    {
      icon: Trophy,
      title: 'Achievements & Rewards',
      description: 'Unlock badges and achievements as you reach study milestones.',
    },
    {
      icon: Music,
      title: 'Focus Music',
      description: 'Built-in ambient sounds and lo-fi music to help you concentrate.',
    },
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Create or Join a Room',
      description: 'Start a new study room or join an existing one with a simple code.',
      icon: Users,
    },
    {
      step: '02',
      title: 'Study Together',
      description: 'Use synchronized timers, chat, and share notes with your study partners.',
      icon: Clock,
    },
    {
      step: '03',
      title: 'Track & Grow',
      description: 'Complete challenges, earn achievements, and watch your productivity soar.',
      icon: TrendingUp,
    },
  ];

  const testimonials = [
    {
      name: 'Sarah K.',
      role: 'Medical Student',
      content: 'SyncStudy helped me stay accountable during my MCAT prep. Studying with friends made those long hours actually enjoyable!',
      avatar: 'S',
    },
    {
      name: 'Alex M.',
      role: 'Computer Science Major',
      content: 'The synchronized timers are a game-changer. My study group is so much more productive now.',
      avatar: 'A',
    },
    {
      name: 'Jordan L.',
      role: 'Law Student',
      content: 'I love the daily challenges! They keep me motivated and coming back every day.',
      avatar: 'J',
    },
  ];

  const stats = [
    { value: '50K+', label: 'Study Sessions' },
    { value: '10K+', label: 'Active Students' },
    { value: '1M+', label: 'Pomodoros Completed' },
    { value: '98%', label: 'Satisfaction Rate' },
  ];

  const benefits = [
    'Free to use',
    'Real-time synchronization',
    'Works on any device',
    'No downloads required',
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 gradient-hero opacity-5" />
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        
        {/* Navigation */}
        <nav className="relative container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="font-display font-bold text-2xl">SyncStudy</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/auth')}>
                Get Started
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative container mx-auto px-4 py-20 lg:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4" />
            Study smarter, together
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold max-w-4xl mx-auto leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            The best way to
            <span className="text-gradient-primary"> study with friends</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            SyncStudy helps you stay focused and motivated by studying together in real-time. 
            Shared timers, collaborative notes, and friendly competition.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button 
              variant="gradient" 
              size="xl" 
              onClick={() => navigate('/auth')}
              className="gap-2"
            >
              Start Studying Free
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="xl" 
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              See How It Works
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="text-center animate-fade-in"
              style={{ animationDelay: `${0.1 * index}s` }}
            >
              <div className="text-3xl md:text-4xl font-display font-bold text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
            <Zap className="h-3 w-3" />
            Powerful Features
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Everything you need to study better
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            SyncStudy combines the best productivity techniques with real-time collaboration.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="p-6 rounded-2xl bg-card border shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 animate-fade-in group"
              style={{ animationDelay: `${0.1 * (index + 1)}s` }}
            >
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <feature.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-display font-semibold mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-success/10 rounded-full text-success text-sm font-medium mb-4">
            <Target className="h-3 w-3" />
            Simple Process
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            How SyncStudy Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes and transform your study sessions.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {howItWorks.map((item, index) => (
            <div 
              key={index} 
              className="relative text-center animate-fade-in"
              style={{ animationDelay: `${0.15 * index}s` }}
            >
              {/* Connector line */}
              {index < howItWorks.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
              )}
              
              <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
                <div className="absolute inset-0 gradient-primary rounded-full opacity-10" />
                <div className="absolute inset-2 bg-card rounded-full border-2 border-primary/20 flex items-center justify-center">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold flex items-center justify-center">
                  {item.step}
                </span>
              </div>
              
              <h3 className="text-xl font-display font-semibold mb-3">
                {item.title}
              </h3>
              <p className="text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-full text-accent text-sm font-medium mb-4">
            <Star className="h-3 w-3" />
            Testimonials
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Loved by Students Everywhere
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See what our community has to say about SyncStudy.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="p-6 rounded-2xl bg-card border shadow-sm animate-fade-in"
              style={{ animationDelay: `${0.1 * index}s` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                "{testimonial.content}"
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 gradient-hero" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIyIiBjeT0iMiIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          <div className="relative px-8 py-16 md:py-24 text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4">
              Ready to study smarter?
            </h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
              Join thousands of students who are already using SyncStudy to stay focused and achieve their goals.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="xl" 
                onClick={() => navigate('/auth')}
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                Get Started for Free
              </Button>
              <Button 
                size="xl" 
                variant="outline"
                onClick={() => navigate('/auth')}
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="font-display font-bold text-xl">SyncStudy</span>
              </div>
              <p className="text-muted-foreground text-sm max-w-md mb-4">
                The collaborative study platform that helps you stay focused, motivated, and connected with your study partners. Study together, achieve more.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
                </li>
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Study Tips</a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Blog</a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Community</a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Support</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} SyncStudy. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-destructive fill-destructive" />
              <span>for students</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
