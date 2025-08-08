"use client"

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  MessageSquare, 
  Shield,
  CheckCircle,
  Clock,
  ArrowRight,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/headless-button";
import { Input } from "@/components/ui/headless-input";
import { Avatar, AvatarFallback } from "@/components/ui/headless-avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    channelName: string
    timestamp: string
  }>
}

// Mock invite data - in real app, this would come from API
const getInviteData = (channelName: string, timestamp: string) => {
  // Map channel names to IDs and descriptions
  const channelMap: Record<string, { id: string; description: string; isPrivate: boolean }> = {
    'general': { id: 'c1', description: 'General discussion and team updates', isPrivate: false },
    'development': { id: 'c2', description: 'Development discussions and code reviews', isPrivate: false },
    'design-review': { id: 'c3', description: 'Design feedback and reviews', isPrivate: false },
    'bugs': { id: 'c4', description: 'Bug reports and issue tracking', isPrivate: false },
  };

  const channelInfo = channelMap[channelName] || channelMap['general'];
  
  // Check if timestamp is expired (older than 7 days)
  const inviteTime = parseInt(timestamp);
  const now = Date.now();
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  const isExpired = (now - inviteTime) > sevenDaysInMs;

  return {
    isValid: !isExpired,
    channel: {
      id: channelInfo.id,
      name: channelName,
      description: channelInfo.description,
      isPrivate: channelInfo.isPrivate,
      memberCount: 9
    },
    project: {
      id: '1',
      name: 'LaunchDB',
      description: 'Real-time collaborative database platform'
    },
    invitedBy: {
      name: 'Abu Shadab',
      avatar: 'AS',
      role: 'CEO & Founder'
    },
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    message: "Hey! Join us on LaunchDB to collaborate on our project. We're building something amazing together!"
  };
};

export default function InvitePage({ params }: PageProps) {
  const { channelName, timestamp } = use(params);
  const router = useRouter();
  const [inviteData, setInviteData] = useState<ReturnType<typeof getInviteData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    designation: ''
  });

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    // Simulate fetching invite data
    setTimeout(() => {
      const data = getInviteData(channelName, timestamp);
      setInviteData(data);
      setLoading(false);
    }, 1000);
  }, [channelName, timestamp]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate registration
    setTimeout(() => {
      console.log('Registering with:', formData);
      // After successful registration, redirect to the channel
      router.push(`/project/${inviteData?.project.id}/channel/${inviteData?.channel.id}`);
    }, 1500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate login
    setTimeout(() => {
      console.log('Logging in with:', loginData);
      // After successful login, redirect to the channel
      router.push(`/project/${inviteData?.project.id}/channel/${inviteData?.channel.id}`);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Validating invite link...</p>
        </div>
      </div>
    );
  }

  if (!inviteData?.isValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Invalid Invite Link</h2>
          <p className="text-muted-foreground mb-6">
            This invite link is invalid or has expired. Please request a new invite from your team.
          </p>
          <Link href="/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const daysUntilExpiry = Math.ceil((inviteData.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              You&apos;re invited to join {inviteData.project.name}
            </h1>
            <p className="text-muted-foreground">
              {inviteData.invitedBy.name} has invited you to collaborate
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column - Invite Details */}
            <div className="space-y-6">
              {/* Project Info Card */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="font-semibold text-lg mb-2">{inviteData.project.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {inviteData.project.description}
                </p>
                
                <Separator className="my-4" />
                
                {/* Channel Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Channel</span>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">#{inviteData.channel.name}</span>
                      {inviteData.channel.isPrivate && (
                        <Badge variant="secondary" className="text-xs">Private</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Members</span>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{inviteData.channel.memberCount} members</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Expires in</span>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{daysUntilExpiry} days</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invited By Card */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Invited by</h4>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {inviteData.invitedBy.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{inviteData.invitedBy.name}</p>
                    <p className="text-sm text-muted-foreground">{inviteData.invitedBy.role}</p>
                  </div>
                </div>
                
                {inviteData.message && (
                  <>
                    <Separator className="my-4" />
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground italic">
                        &ldquo;{inviteData.message}&rdquo;
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* What you'll get */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border border-primary/20">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  What you&apos;ll get access to
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                    Real-time messaging with the team
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                    File sharing and collaboration
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                    AI-powered developer assistants
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                    Project updates and notifications
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column - Auth Form */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="mb-6">
                <div className="flex gap-2 p-1 bg-muted rounded-lg">
                  <button
                    onClick={() => setAuthMode('register')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      authMode === 'register' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Create Account
                  </button>
                  <button
                    onClick={() => setAuthMode('login')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      authMode === 'login' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Sign In
                  </button>
                </div>
              </div>

              {authMode === 'register' ? (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Create your account</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Join {inviteData.project.name} and start collaborating
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        required
                        placeholder="Enter your name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        required
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Role/Designation</label>
                    <Input
                      required
                      placeholder="e.g., Frontend Developer, Product Manager"
                      value={formData.designation}
                      onChange={(e) => setFormData({...formData, designation: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Alert className="bg-primary/5 border-primary/20">
                    <AlertDescription className="text-sm">
                      By creating an account, you&apos;ll automatically join the <strong>#{inviteData.channel.name}</strong> channel
                    </AlertDescription>
                  </Alert>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Account & Join
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    By joining, you agree to our{" "}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Welcome back!</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Sign in to join {inviteData.project.name}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        required
                        placeholder="Enter your email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>

                  <Alert className="bg-primary/5 border-primary/20">
                    <AlertDescription className="text-sm">
                      After signing in, you&apos;ll join the <strong>#{inviteData.channel.name}</strong> channel
                    </AlertDescription>
                  </Alert>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In & Join
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}