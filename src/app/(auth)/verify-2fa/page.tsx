'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useVault } from '@/providers/vault-provider';

export default function Verify2FAPage() {
    const router = useRouter();
    const { unlockVault } = useVault();
    const [token, setToken] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem('pending_login');
        if (stored) {
            setCredentials(JSON.parse(stored));
        } else {
            router.push('/login');
        }
    }, [router]);

    const handleVerify = async () => {
        if (!token || token.length !== 6) {
            toast.error('Please enter a valid 6-digit code');
            return;
        }

        if (!credentials) {
            toast.error('Session expired');
            router.push('/login');
            return;
        }

        setVerifying(true);

        try {
            const result = await signIn('credentials', {
                email: credentials.email,
                password: credentials.password,
                twoFactorCode: token,
                redirect: false
            });

            if (result?.ok) {
                sessionStorage.removeItem('pending_login');
                await unlockVault(credentials.password);
                toast.success('Welcome back!');
                router.push('/dashboard');
            } else {
                toast.error('Invalid 2FA code');
            }
        } catch (error) {
            toast.error('Error verifying 2FA code');
        } finally {
            setVerifying(false);
        }
    };

    const handleBack = () => {
        sessionStorage.removeItem('pending_login');
        router.push('/login');
    };

    if (!credentials) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex items-start justify-center min-h-screen p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-start gap-2 mb-2">
                        <Shield className="h-6 w-6 text-primary" />
                        <CardTitle>Two-Factor Authentication</CardTitle>
                    </div>
                    <CardDescription>
                        Enter the 6-digit code from your authenticator app
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="token">Authentication Code</Label>
                        <Input
                            id="token"
                            type="text"
                            maxLength={6}
                            placeholder="000000"
                            value={token}
                            onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                            className="text-center text-2xl tracking-widest font-mono"
                            autoFocus
                        />
                        <p className="text-xs text-muted-foreground text-center">
                            Logging in as {credentials.email}
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Button
                            onClick={handleVerify}
                            disabled={verifying || token.length !== 6}
                            className="w-full"
                        >
                            {verifying ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                'Verify & Sign In'
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            disabled={verifying}
                            className="w-full"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Login
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
