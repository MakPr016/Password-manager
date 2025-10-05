'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Zap, Eye, Key, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Navbar from '@/components/global/navbar';

export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const features = [
    {
      icon: Shield,
      title: 'Military-Grade Encryption',
      description: 'AES-256 encryption ensures your passwords are secure from any threat.'
    },
    {
      icon: Lock,
      title: 'Zero-Knowledge Architecture',
      description: 'Only you can access your passwords. Not even we can see them.'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Instant access to your passwords across all your devices.'
    },
    {
      icon: Eye,
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security with TOTP-based 2FA.'
    },
    {
      icon: Key,
      title: 'Password Generator',
      description: 'Create strong, unique passwords for all your accounts instantly.'
    },
    {
      icon: CheckCircle2,
      title: 'Smart Organization',
      description: 'Organize passwords by categories and mark favorites for quick access.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-32 pb-20">
        <section className="max-w-5xl mx-auto text-center space-y-8 mb-32">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-muted/50 text-sm mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Secure, Simple, Yours</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight">
            Your Passwords,
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              Perfectly Safe
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Store, manage, and secure all your passwords in one encrypted vault. 
            Simple, powerful, and built with your privacy in mind.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            {session ? (
              <Button size="lg" className="text-lg px-8 h-14 rounded-full" onClick={() => router.push('/dashboard')}>
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <>
                <Button size="lg" className="text-lg px-8 h-14 rounded-full" onClick={() => router.push('/signup')}>
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 rounded-full" onClick={() => router.push('/login')}>
                  Sign In
                </Button>
              </>
            )}
          </div>
          
        </section>

        <section className="max-w-6xl mx-auto mb-32">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-8 hover:shadow-lg transition-shadow border-2">
                <div className="rounded-full w-12 h-12 bg-primary/10 flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto text-center space-y-8 mb-32">
          <h2 className="text-4xl md:text-5xl font-bold">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 pt-8">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-2xl font-bold text-primary">
                1
              </div>
              <h3 className="text-xl font-semibold">Create Your Account</h3>
              <p className="text-muted-foreground">
                Sign up in seconds with just your email and a master password
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-2xl font-bold text-primary">
                2
              </div>
              <h3 className="text-xl font-semibold">Add Your Passwords</h3>
              <p className="text-muted-foreground">
                Store passwords, notes, and organize them in categories
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-2xl font-bold text-primary">
                3
              </div>
              <h3 className="text-xl font-semibold">Access Anywhere</h3>
              <p className="text-muted-foreground">
                Your encrypted vault is accessible from any device, anytime
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">PassManager</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 PassManager. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
