import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Sparkles, Target, ArrowRight } from 'lucide-react';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [studyGoal, setStudyGoal] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    if (!fullName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter your name to continue.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile.mutateAsync({
        full_name: fullName,
        study_goal: studyGoal || null,
      });

      toast({
        title: 'Welcome to SyncStudy! 🎉',
        description: 'Your profile is all set up.',
      });

      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-10 w-10 text-primary" />
            <span className="font-display font-bold text-3xl">SyncStudy</span>
          </div>
          <p className="text-muted-foreground">Let's set up your profile</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        {step === 1 && (
          <Card className="animate-fade-in">
            <CardHeader className="text-center">
              <div className="mx-auto w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-4">
                <Sparkles className="h-7 w-7 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">What should we call you?</CardTitle>
              <CardDescription>
                This will be visible to your study partners
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="text-lg h-12"
                  autoFocus
                />
              </div>
              <Button
                onClick={() => setStep(2)}
                className="w-full"
                variant="gradient"
                size="lg"
                disabled={!fullName.trim()}
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="animate-fade-in">
            <CardHeader className="text-center">
              <div className="mx-auto w-14 h-14 rounded-xl gradient-warm flex items-center justify-center mb-4">
                <Target className="h-7 w-7 text-accent-foreground" />
              </div>
              <CardTitle className="text-2xl">What's your study goal?</CardTitle>
              <CardDescription>
                This helps you stay focused and motivated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="goal">Study Goal (optional)</Label>
                <Textarea
                  id="goal"
                  placeholder="e.g., Pass my calculus exam, Learn web development, Finish my thesis..."
                  value={studyGoal}
                  onChange={(e) => setStudyGoal(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  variant="gradient"
                  size="lg"
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Get Started'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Skip option */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            Skip for now
          </button>
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
