'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, type SignupFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from "sonner"
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function SignupForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: ''
        }
    });

    const onSubmit = async (data: SignupFormData) => {
        setIsLoading(true);
        setError('');
        setSuccess('');

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

            if (result.success) {
                setSuccess('Account created successfully!');
                reset();
                toast.success('Account created successfully!')
                setTimeout(() => {
                    router.push('/dashboard');
                }, 2000);
            } else {
                setError(result.error || 'Failed to create account');
                toast.error('Failed to create account')
            }
        } catch (err) {
            setError('Network error. Please try again.');
            toast.error('Network error. Please try again.')
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create Account</CardTitle>
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
                            placeholder="Enter your full name"
                            {...register('name')}
                            className={errors.name ? 'border-red-500' : ''}
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
                            placeholder="Enter your email"
                            {...register('email')}
                            className={errors.email ? 'border-red-500' : ''}
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
                        />
                        {errors.password && (
                            <p className="text-sm text-red-500">{errors.password.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm your password"
                            {...register('confirmPassword')}
                            className={errors.confirmPassword ? 'border-red-500' : ''}
                        />
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
                        <span className="text-gray-600">Already have an account? </span>
                        <button
                            type="button"
                            onClick={() => router.push('/login')}
                            className="font-medium hover:underline cursor-pointer"
                        >
                            Sign in here
                        </button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}