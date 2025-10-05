'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Copy, Check, Shield, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

export default function Setup2FAPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [secret, setSecret] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [token, setToken] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    const handleEnable2FA = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/auth/2fa/setup', {
                method: 'POST',
            });

            const data = await response.json();

            if (data.success) {
                setSecret(data.secret);
                setQrCode(data.qrCode);
                setStep(2);
            } else {
                toast.error('Failed to setup 2FA');
            }
        } catch (error) {
            toast.error('Error setting up 2FA');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        router.push('/dashboard');
    };

    const handleVerify = async () => {
        if (!token || token.length !== 6) {
            toast.error('Please enter a valid 6-digit code');
            return;
        }

        setVerifying(true);

        try {
            const response = await fetch('/api/auth/2fa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, secret }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('2FA enabled successfully!');
                router.push('/dashboard');
            } else {
                toast.error(data.error || 'Invalid code');
            }
        } catch (error) {
            toast.error('Error verifying code');
        } finally {
            setVerifying(false);
        }
    };

    const handleCopySecret = () => {
        navigator.clipboard.writeText(secret);
        setCopied(true);
        toast.success('Secret copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center h-screen p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-6 w-6 text-primary" />
                        <CardTitle>Two-Factor Authentication</CardTitle>
                    </div>
                    <CardDescription>
                        {step === 1 && 'Secure your account with 2FA'}
                        {step === 2 && 'Scan QR code with your authenticator app'}
                        {step === 3 && 'Verify your authenticator setup'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-3 text-sm">
                                <p className="text-muted-foreground">
                                    Two-factor authentication adds an extra layer of security to your account.
                                </p>
                                <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                                    <li>Protect your account from unauthorized access</li>
                                    <li>Required for sensitive operations</li>
                                    <li>Works with popular authenticator apps</li>
                                </ul>
                                <p className="text-muted-foreground">
                                    You can always enable this later from your settings.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 pt-4">
                                <Button
                                    onClick={handleEnable2FA}
                                    disabled={loading}
                                    className="w-full"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Setting up...
                                        </>
                                    ) : (
                                        <>
                                            Enable 2FA
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleSkip}
                                    disabled={loading}
                                    className="w-full"
                                >
                                    Skip for now
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">Step 1: Scan QR Code</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Use an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator
                                </p>
                                {qrCode && (
                                    <div className="flex justify-center p-4 bg-white rounded-lg">
                                        <Image
                                            src={qrCode}
                                            alt="2FA QR Code"
                                            width={200}
                                            height={200}
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">Manual Entry (Optional)</h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                    If you cannot scan the QR code, enter this key manually:
                                </p>
                                <div className="flex gap-2">
                                    <Input
                                        value={secret}
                                        readOnly
                                        className="font-mono text-sm bg-muted"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleCopySecret}
                                    >
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep(1)}
                                    className="flex-1"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back
                                </Button>
                                <Button
                                    onClick={() => setStep(3)}
                                    className="flex-1"
                                >
                                    Next
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">Verify Setup</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Enter the 6-digit code from your authenticator app to verify the setup
                                </p>
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
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep(2)}
                                    disabled={verifying}
                                    className="flex-1"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back
                                </Button>
                                <Button
                                    onClick={handleVerify}
                                    disabled={verifying || token.length !== 6}
                                    className="flex-1"
                                >
                                    {verifying ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        'Complete Setup'
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center gap-2 pt-4">
                        <div className={`h-2 w-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                        <div className={`h-2 w-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                        <div className={`h-2 w-2 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
