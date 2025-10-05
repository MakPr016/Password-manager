'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Shield, Key } from 'lucide-react';
import { toast } from 'sonner';
import { useVault } from '@/providers/vault-provider';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function SecuritySettings() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const { lockVault } = useVault();
    const [loading, setLoading] = useState(false);
    const [fetchingStatus, setFetchingStatus] = useState(true);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [showDisable2FADialog, setShowDisable2FADialog] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        fetch2FAStatus();
    }, []);

    const fetch2FAStatus = async () => {
        try {
            const response = await fetch('/api/user/2fa-status');
            const data = await response.json();
            
            if (data.success) {
                setTwoFactorEnabled(data.twoFactorEnabled);
            }
        } catch (error) {
            console.error('Error fetching 2FA status:', error);
        } finally {
            setFetchingStatus(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Password changed successfully', {
                    description: `${data.reencryptedCount} vault items re-encrypted. Please unlock vault again.`
                });
                
                lockVault();
                
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                
                setTimeout(() => {
                    router.push('/vault');
                }, 2000);
            } else {
                toast.error(data.error || 'Failed to change password');
            }
        } catch (error) {
            toast.error('Error changing password');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle2FA = async () => {
        if (twoFactorEnabled) {
            setShowDisable2FADialog(true);
        } else {
            window.location.href = '/setup-2fa';
        }
    };

    const handleDisable2FA = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/auth/2fa/disable', {
                method: 'POST',
            });

            const data = await response.json();

            if (data.success) {
                setTwoFactorEnabled(false);
                await update({ twoFactorEnabled: false });
                toast.success('2FA disabled successfully');
            } else {
                toast.error('Failed to disable 2FA');
            }
        } catch (error) {
            toast.error('Error disabling 2FA');
        } finally {
            setLoading(false);
            setShowDisable2FADialog(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Two-Factor Authentication</CardTitle>
                    <CardDescription>
                        Add an extra layer of security to your account
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                <p className="font-medium">2FA Status</p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {fetchingStatus ? 'Loading...' : (twoFactorEnabled ? 'Enabled' : 'Disabled')}
                            </p>
                        </div>
                        <Switch
                            checked={twoFactorEnabled}
                            onCheckedChange={handleToggle2FA}
                            disabled={loading || fetchingStatus}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                        Update your account password. All vault items will be re-encrypted.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                            />
                        </div>

                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Changing...
                                </>
                            ) : (
                                <>
                                    <Key className="mr-2 h-4 w-4" />
                                    Change Password
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <AlertDialog open={showDisable2FADialog} onOpenChange={setShowDisable2FADialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Disable 2FA</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to disable two-factor authentication? This will make your account less secure.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDisable2FA} className="bg-red-500 hover:bg-red-600">
                            Disable 2FA
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}