/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, KeyRound, Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { decryptVaultItem } from '@/lib/encryption';
import { useVault } from '@/providers/vault-provider';
import AddVaultItemModal from '../vault/_components/AddVaultItemModal';
import type { DashboardStats } from '@/types';

const isStrongPassword = (password: string): boolean => {
    if (password.length < 12) return false;
    
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    return hasUpper && hasLower && hasNumber && hasSymbol;
};

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { masterPassword, isUnlocked, unlockVault } = useVault();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [tempPassword, setTempPassword] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (isUnlocked && session?.user?.email) {
            analyzeVault();
        }
    }, [isUnlocked, session]);

    const analyzeVault = async () => {
        if (!masterPassword || !session?.user?.email) return;

        setLoading(true);

        try {
            const response = await fetch('/api/vault');
            const data = await response.json();

            if (!data.success) {
                toast.error('Failed to fetch vault items');
                return;
            }

            const vaultItems = data.items;
            const passwords: string[] = [];
            const decryptedItems: any[] = [];

            vaultItems.forEach((item: any) => {
                const result = decryptVaultItem(
                    item.encryptedData,
                    masterPassword,
                    session.user.email!
                );

                if (result.success && result.data) {
                    decryptedItems.push({
                        id: item._id,
                        title: result.data.title,
                        password: result.data.password,
                        createdAt: item.createdAt
                    });

                    if (result.data.password) {
                        passwords.push(result.data.password);
                    }
                }
            });

            let strongPasswords = 0;
            let weakPasswords = 0;

            passwords.forEach(pwd => {
                if (isStrongPassword(pwd)) {
                    strongPasswords++;
                } else {
                    weakPasswords++;
                }
            });

            const passwordCounts = new Map<string, number>();
            passwords.forEach(pwd => {
                passwordCounts.set(pwd, (passwordCounts.get(pwd) || 0) + 1);
            });
            
            const reusedPasswords = Array.from(passwordCounts.values()).filter(count => count > 1).length;

            const recentActivity = decryptedItems.slice(0, 5).map(item => ({
                id: item.id,
                action: 'created' as const,
                title: item.title,
                timestamp: new Date(item.createdAt)
            }));

            const calculatedStats: DashboardStats = {
                totalPasswords: vaultItems.length,
                strongPasswords,
                weakPasswords,
                reusedPasswords,
                recentActivity
            };

            setStats(calculatedStats);
        } catch (error) {
            toast.error('Error analyzing vault');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tempPassword || !session?.user?.email) return;

        setAnalyzing(true);

        try {
            const response = await fetch('/api/vault');
            const data = await response.json();

            if (!data.success) {
                toast.error('Failed to fetch vault items');
                setAnalyzing(false);
                return;
            }

            const testItem = data.items[0];
            if (testItem) {
                const result = decryptVaultItem(
                    testItem.encryptedData,
                    tempPassword,
                    session.user.email
                );

                if (!result.success) {
                    toast.error('Invalid password');
                    setAnalyzing(false);
                    return;
                }
            }

            await unlockVault(tempPassword);
            setTempPassword('');
        } catch (error) {
            toast.error('Error unlocking vault');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleAddSuccess = () => {
        analyzeVault();
    };

    const getActivityIcon = (action: string) => {
        switch (action) {
            case 'created':
                return <Plus className="h-4 w-4" />;
            case 'updated':
                return <KeyRound className="h-4 w-4" />;
            case 'accessed':
                return <Clock className="h-4 w-4" />;
            case 'generated':
                return <Shield className="h-4 w-4" />;
            default:
                return <KeyRound className="h-4 w-4" />;
        }
    };

    const getActivityColor = (action: string) => {
        switch (action) {
            case 'created':
                return 'text-green-600';
            case 'updated':
                return 'text-blue-600';
            case 'accessed':
                return 'text-gray-600';
            case 'generated':
                return 'text-purple-600';
            default:
                return 'text-gray-600';
        }
    };

    const formatTimestamp = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!isUnlocked) {
        return (
            <div className="container mx-auto py-8 px-4 max-w-md">
                <Card>
                    <CardHeader>
                        <CardTitle>Unlock Dashboard</CardTitle>
                        <CardDescription>
                            Enter your master password to view dashboard statistics
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="masterPassword">Master Password</Label>
                                <Input
                                    id="masterPassword"
                                    type="password"
                                    value={tempPassword}
                                    onChange={(e) => setTempPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    autoFocus
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={!tempPassword || analyzing}
                            >
                                {analyzing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Unlocking...
                                    </>
                                ) : (
                                    'Unlock Dashboard'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (loading || !stats) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const securityScore = stats.totalPasswords > 0
        ? Math.round((stats.strongPasswords / stats.totalPasswords) * 100)
        : 0;

    return (
        <>
            <AddVaultItemModal
                open={showAddModal}
                onOpenChange={setShowAddModal}
                onSuccess={handleAddSuccess}
            />

            <div className="container mx-auto py-8 px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground mt-2">
                        Welcome back, {session?.user?.name}
                    </p>
                </div>

                <Card className="mb-8 lg:hidden">
                    <CardHeader className='mb-2'>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Manage your passwords</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-3">
                        <Button
                            className="w-full"
                            onClick={() => setShowAddModal(true)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Password
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push('/generate')}
                        >
                            <KeyRound className="h-4 w-4 mr-2" />
                            Generate Password
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push('/vault')}
                        >
                            <Shield className="h-4 w-4 mr-2" />
                            View All Passwords
                        </Button>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Passwords</CardTitle>
                            <KeyRound className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalPasswords}</div>
                            <p className="text-xs text-muted-foreground">
                                Stored in your vault
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Strong Passwords</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.strongPasswords}</div>
                            <p className="text-xs text-muted-foreground">
                                {securityScore}% security score
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Weak Passwords</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.weakPasswords}</div>
                            <p className="text-xs text-muted-foreground">
                                Need attention
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Reused Passwords</CardTitle>
                            <Shield className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.reusedPasswords}</div>
                            <p className="text-xs text-muted-foreground">
                                Security risk
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="hidden lg:block">
                        <CardHeader className='mb-3'>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>Manage your passwords</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                className="w-full"
                                onClick={() => setShowAddModal(true)}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Password
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => router.push('/generate')}
                            >
                                <KeyRound className="h-4 w-4 mr-2" />
                                Generate Password
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => router.push('/vault')}
                            >
                                <Shield className="h-4 w-4 mr-2" />
                                View All Passwords
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Your latest vault activities</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {stats.recentActivity.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">No recent activity</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {stats.recentActivity.map((activity) => (
                                        <div
                                            key={activity.id}
                                            className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            <div className={`mt-1 ${getActivityColor(activity.action)}`}>
                                                {getActivityIcon(activity.action)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {activity.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground capitalize">
                                                    {activity.action}
                                                </p>
                                            </div>
                                            <p className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatTimestamp(activity.timestamp)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {(stats.weakPasswords > 0 || stats.reusedPasswords > 0) && (
                    <Card className="mt-6 border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                Security Recommendations
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {stats.weakPasswords > 0 && (
                                <p className="text-sm">
                                    • Update {stats.weakPasswords} weak password{stats.weakPasswords > 1 ? 's' : ''} to improve security
                                </p>
                            )}
                            {stats.reusedPasswords > 0 && (
                                <p className="text-sm">
                                    • Change {stats.reusedPasswords} reused password{stats.reusedPasswords > 1 ? 's' : ''} to unique ones
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
