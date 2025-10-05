'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Loader2, Eye, EyeOff, Copy, ExternalLink, Star, Edit, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import { decryptVaultItem } from '@/lib/encryption';

interface VaultItemData {
    title: string;
    username?: string;
    password?: string;
    url?: string;
    notes?: string;
}

interface VaultItem {
    _id: string;
    encryptedData: string;
    category: string;
    isFavorite: boolean;
    createdAt: string;
    decryptedData?: VaultItemData;
}

export default function VaultItemPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { data: session } = useSession();
    const resolvedParams = use(params);
    const [item, setItem] = useState<VaultItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [masterPassword, setMasterPassword] = useState('');
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(true);
    const [decrypting, setDecrypting] = useState(false);

    useEffect(() => {
        fetchVaultItem();
    }, [resolvedParams.id]);

    const fetchVaultItem = async () => {
        try {
            const response = await fetch(`/api/vault/${resolvedParams.id}`);
            const data = await response.json();

            if (data.success) {
                setItem(data.item);
            } else {
                toast.error('Failed to load vault item');
            }
        } catch (error) {
            toast.error('Error loading vault item');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setDecrypting(true);

        if (!item || !session?.user?.email) {
            toast.error('Session error');
            setDecrypting(false);
            return;
        }

        const result = decryptVaultItem(
            item.encryptedData,
            masterPassword,
            session.user.email
        );

        if (!result.success || !result.data) {
            toast.error('Invalid password');
            setDecrypting(false);
            return;
        }

        setItem({ ...item, decryptedData: result.data });
        setShowPasswordPrompt(false);
        setDecrypting(false);
        toast.success('Vault item unlocked!');
    };

    const handleCopy = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied!`);
        } catch (error) {
            toast.error('Failed to copy');
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0].toUpperCase())
            .slice(0, 2)
            .join('');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-2xl">
            <Button
                variant="ghost"
                onClick={() => router.push('/vault')}
                className="mb-6"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Vault
            </Button>

            {showPasswordPrompt ? (
                <Card>
                    <CardHeader>
                        <h2 className="text-2xl font-bold">Unlock Vault Item</h2>
                        <p className="text-sm text-muted-foreground">
                            Enter your master password to view this item
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <Input
                                type="password"
                                placeholder="Master password"
                                value={masterPassword}
                                onChange={(e) => setMasterPassword(e.target.value)}
                                disabled={decrypting}
                                autoFocus
                            />
                            <Button type="submit" className="w-full" disabled={decrypting || !masterPassword}>
                                {decrypting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Unlocking...
                                    </>
                                ) : (
                                    'Unlock'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            ) : item?.decryptedData ? (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16 rounded-lg">
                                <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold text-lg">
                                    {getInitials(item.decryptedData.title || 'VA')}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    {item.decryptedData.title}
                                    {item.isFavorite && (
                                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                    )}
                                </h2>
                                <p className="text-sm text-muted-foreground capitalize">
                                    {item.category}
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {item.decryptedData.username && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Username</label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="text"
                                        value={item.decryptedData.username}
                                        readOnly
                                        className="flex-1 bg-muted/50"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleCopy(item.decryptedData!.username!, 'Username')}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {item.decryptedData.password && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Password</label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        value={item.decryptedData.password}
                                        readOnly
                                        className="flex-1 bg-muted/50 font-mono"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleCopy(item.decryptedData!.password!, 'Password')}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {item.decryptedData.url && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">URL</label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="text"
                                        value={item.decryptedData.url}
                                        readOnly
                                        className="flex-1 bg-muted/50"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => window.open(item.decryptedData!.url, '_blank')}
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleCopy(item.decryptedData!.url!, 'URL')}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {item.decryptedData.notes && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Notes</label>
                                <textarea
                                    value={item.decryptedData.notes}
                                    readOnly
                                    rows={4}
                                    className="w-full px-3 py-2 border rounded-md bg-muted/50 text-sm resize-none"
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-2 pt-4 border-t">
                            <Button variant="outline" className="flex-1">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                            <Button variant="outline" className="flex-1 text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">Item not found</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
