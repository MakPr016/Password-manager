'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { useVault } from '@/providers/vault-provider';

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [error, setError] = useState('');
  const router = useRouter();
  const { unlockVault } = useVault();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      twoFactorCode: ''
    }
  });

  const checkIfUser2FAEnabled = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/check-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      return data.twoFactorEnabled || false;
    } catch {
      return false;
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { email, password } = getValues();
    
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const has2FA = await checkIfUser2FAEnabled(email);

      if (has2FA) {
        setStep('2fa');
        toast.info('2FA Required', {
          description: 'Please enter your authenticator code'
        });
        setIsLoading(false);
        return;
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (result?.ok) {
        await unlockVault(password);
        toast.success('Welcome back!');
        router.push('/dashboard');
      } else {
        setError('Invalid email or password');
        toast.error('Login failed');
      }
    } catch (err) {
      setError('Network error');
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { email, password, twoFactorCode } = getValues();
    
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        twoFactorCode,
        redirect: false
      });

      if (result?.ok) {
        await unlockVault(password);
        toast.success('Welcome back!');
        router.push('/dashboard');
      } else {
        setError('Invalid 2FA code');
        toast.error('Invalid 2FA code');
      }
    } catch (err) {
      setError('Verification failed');
      toast.error('Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep('credentials');
    setError('');
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        {step === '2fa' && (
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-primary" />
          </div>
        )}
        <CardTitle className="text-2xl">
          {step === 'credentials' ? 'Welcome Back' : 'Two-Factor Authentication'}
        </CardTitle>
        <CardDescription>
          {step === 'credentials' 
            ? 'Sign in to access your secure password vault'
            : 'Enter the 6-digit code from your authenticator app'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={step === 'credentials' ? handleCredentialsSubmit : handle2FASubmit} className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'credentials' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                  disabled={isLoading}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  {...register('password')}
                  className={errors.password ? 'border-red-500' : ''}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              <div className="text-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Don&apos;t have an account?
                </span>
                <Button
                  type="button"
                  variant='link'
                  onClick={() => router.push('/signup')}
                  className="cursor-pointer hover:underline font-medium px-1"
                  disabled={isLoading}
                >
                  Create one here
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="twoFactorCode">Authentication Code</Label>
                <Input
                  id="twoFactorCode"
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  {...register('twoFactorCode')}
                  className="text-center text-2xl tracking-widest font-mono"
                  disabled={isLoading}
                  autoFocus
                  autoComplete="one-time-code"
                />
                {errors.twoFactorCode && (
                  <p className="text-sm text-red-500">{errors.twoFactorCode.message}</p>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  Logging in as {getValues('email')}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Sign In'
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleBack}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
