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
import { Loader2 } from 'lucide-react';

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [needs2FA, setNeeds2FA] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      twoFactorCode: ''
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        twoFactorCode: data.twoFactorCode || '',
        redirect: false
      });

      if (result?.ok) {
        toast.success('Welcome back!', {
          description: 'Redirecting to your dashboard...'
        });
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else if (result?.error === '2FA_REQUIRED') {
        setNeeds2FA(true);
        toast.info('2FA Required', {
          description: 'Please enter your 2FA code to continue'
        });
      } else {
        toast.error('Login failed', {
          description: result?.error || 'Invalid email or password'
        });
      }
    } catch (err) {
      toast.error('Network error', {
        description: 'Please check your connection and try again'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Welcome Back</CardTitle>
        <CardDescription>
          Sign in to access your secure password vault
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
              disabled={isLoading || needs2FA}
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
              disabled={isLoading || needs2FA}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {needs2FA && (
            <div className="space-y-2">
              <Label htmlFor="twoFactorCode">2FA Code</Label>
              <Input
                id="twoFactorCode"
                type="text"
                placeholder="Enter 6-digit code"
                maxLength={6}
                {...register('twoFactorCode')}
                className={errors.twoFactorCode ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.twoFactorCode && (
                <p className="text-sm text-red-500">{errors.twoFactorCode.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Enter the code from your authenticator app
              </p>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          {needs2FA && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setNeeds2FA(false)}
              disabled={isLoading}
            >
              Back to Login
            </Button>
          )}

          <div className="text-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Don&apos;t have an account?
            </span>
            <Button
              variant='link'
              onClick={() => router.push('/auth/signup')}
              className="cursor-pointer hover:underline font-medium px-1"
              disabled={isLoading}
            >
              Create one here
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
