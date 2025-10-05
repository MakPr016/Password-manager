'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { signupSchema, type SignupFormData } from '@/lib/validations/auth';
import { generatePassword, calculatePasswordStrength, getPasswordStrengthLabel, getPasswordStrengthColor } from '@/lib/passwordUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, RefreshCw, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

export default function SignupForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [showGenerator, setShowGenerator] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [copied, setCopied] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: ''
        }
    });

    const password = watch('password');

    const handleGeneratePassword = () => {
        const newPassword = generatePassword({
            length: 16,
            uppercase: true,
            lowercase: true,
            numbers: true,
            symbols: true,
            excludeSimilar: true
        });

        setGeneratedPassword(newPassword);
        setValue('password', newPassword);
        setValue('confirmPassword', newPassword);

        const strength = calculatePasswordStrength(newPassword);
        setPasswordStrength(strength);

        toast.success('Password generated!', {
            description: `Strength: ${getPasswordStrengthLabel(strength)}`
        });
    };

    const handleCopyPassword = async () => {
        if (generatedPassword) {
            await navigator.clipboard.writeText(generatedPassword);
            setCopied(true);
            toast.success('Password copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const onSubmit = async (data: SignupFormData) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    password: data.password
                })
            });

            const result = await response.json();

            if (result.success && result.autoLogin) {
                toast.success('Account created successfully!', {
                    description: 'Logging you in...'
                });

                const signInResponse = await signIn('credentials', {
                    email: data.email,
                    password: data.password,
                    redirect: false
                });

                if (signInResponse?.error) {
                    toast.error('Registration successful but auto-login failed', {
                        description: 'Please sign in manually'
                    });
                    router.push('/login');
                } else if (signInResponse?.ok) {
                    toast.success('Welcome! You are now logged in.');
                    reset();
                    router.push('/setup-2fa');
                }
            } else {
                setError(result.error || 'Failed to create account');
                toast.error('Failed to create account', {
                    description: result.error || 'Please try again'
                });
            }
        } catch (err) {
            setError('Network error');
            toast.error('Network error', {
                description: 'Please check your connection and try again'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const currentPasswordStrength = password ? calculatePasswordStrength(password) : 0;
    const strengthLabel = getPasswordStrengthLabel(currentPasswordStrength);
    const strengthColor = getPasswordStrengthColor(currentPasswordStrength);

    return (
        <Card>
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">Create Account</CardTitle>
                <CardDescription>
                    Enter your details to create your secure vault
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {error && (
                        <Alert className="border-red-200 bg-red-50 text-red-800">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Your name"
                            {...register('name')}
                            className={errors.name ? 'border-red-500' : ''}
                            disabled={isLoading}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="test@example.com"
                            {...register('email')}
                            className={errors.email ? 'border-red-500' : ''}
                            disabled={isLoading}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowGenerator(!showGenerator)}
                                className="h-auto p-1 text-xs text-blue-600 hover:text-blue-500"
                            >
                                {showGenerator ? 'Hide Generator' : 'Generate Password'}
                            </Button>
                        </div>

                        {showGenerator && (
                            <div className="flex gap-2 mb-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleGeneratePassword}
                                    className="flex-1"
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Generate Strong Password
                                </Button>
                                {generatedPassword && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopyPassword}
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                )}
                            </div>
                        )}

                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                {...register('password')}
                                className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                                disabled={isLoading}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-500" />
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-500" />
                                )}
                            </Button>
                        </div>
                        {errors.password && (
                            <p className="text-sm text-red-500">{errors.password.message}</p>
                        )}

                        {password && password.length > 0 && (
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span>Password Strength:</span>
                                    <span style={{ color: strengthColor }} className="font-semibold">
                                        {strengthLabel}
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full transition-all duration-300"
                                        style={{
                                            width: `${currentPasswordStrength}%`,
                                            backgroundColor: strengthColor
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Confirm your password"
                                {...register('confirmPassword')}
                                className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                                disabled={isLoading}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-500" />
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-500" />
                                )}
                            </Button>
                        </div>
                        {errors.confirmPassword && (
                            <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
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
                                Creating Account...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </Button>

                    <div className="text-center text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                            Already have an account?{' '}
                        </span>
                        <Button
                            variant='link'
                            onClick={() => router.push('/login')}
                            className="px-1 cursor-pointer font-medium"
                            disabled={isLoading}
                        >
                            Sign in here
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}