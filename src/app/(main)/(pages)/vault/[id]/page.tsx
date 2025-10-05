'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Loader2, Eye, EyeOff, Copy, ExternalLink, Star, Edit, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { toast } from 'sonner';
import { decryptVaultItem } from '@/lib/encryption';
import { useVault } from '@/providers/vault-provider';
import EditVaultItemModal from '../_components/EditVaultItemModal';
import type { VaultItemData } from '@/types';

interface VaultItemWithDecrypted {
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
    const { masterPassword, isUnlocked, unlockVault } = useVault();
    const resolvedParams = use(params);
    const [item, setItem] = useState<VaultItemWithDecrypted | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [tempPassword, setTempPassword] = useState('');
    const [unlocking, setUnlocking] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchVaultItem();
    }, [resolvedParams.id]);

    useEffect(() => {
        if (isUnlocked && masterPassword && item && !item.decryptedData) {
            decryptItem(masterPassword);
        }
    }, [isUnlocked, masterPassword]);

    const fetchVaultItem = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/vault/${resolvedParams.id}`);
            const data = await response.json();

            if (data.success) {
                setItem(data.item);
                if (isUnlocked && masterPassword && session?.user?.email) {
                    const result = decryptVaultItem(
                        data.item.encryptedData,
                        masterPassword,
                        session.user.email
                    );
                    if (result.success && result.data) {
                        setItem({ ...data.item, decryptedData: result.data });
                    }
                }
            } else {
                toast.error('Failed to load vault item');
            }
        } catch (error) {
            toast.error('Error loading vault item');
        } finally {
            setLoading(false);
        }
    };

    const decryptItem = (password: string) => {
        if (!item || !session?.user?.email) return;

        try {
            const result = decryptVaultItem(
                item.encryptedData,
                password,
                session.user.email
            );

            if (result.success && result.data) {
                setItem(prev => prev ? { ...prev, decryptedData: result.data } : null);
            }
        } catch (error) {
            console.error('Decryption error:', error);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUnlocking(true);

        if (!item || !session?.user?.email) {
            toast.error('Session error');
            setUnlocking(false);
            return;
        }

        const result = decryptVaultItem(
            item.encryptedData,
            tempPassword,
            session.user.email
        );

        if (!result.success || !result.data) {
            toast.error('Invalid password');
            setUnlocking(false);
            return;
        }

        await unlockVault(tempPassword);
        setTempPassword('');
        toast.success('Vault unlocked!');
        setUnlocking(false);
    };

    const handleCopy = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied!`);
        } catch (error) {
            toast.error('Failed to copy');
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const response = await fetch(`/api/vault/${resolvedParams.id}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Item deleted successfully');
                router.push('/vault');
            } else {
                toast.error('Failed to delete item');
            }
        } catch (error) {
            toast.error('Error deleting item');
        } finally {
            setDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    const handleEditSuccess = () => {
        fetchVaultItem();
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

    if (!item) {
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
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">Item not found</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <>
            {item && item.decryptedData && (
                <EditVaultItemModal
                    open={showEditModal}
                    onOpenChange={setShowEditModal}
                    onSuccess={handleEditSuccess}
                    item={{
                        _id: item._id,
                        decryptedData: item.decryptedData,
                        category: item.category,
                    }}
                />
            )}

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Item</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{item?.decryptedData?.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="container mx-auto py-8 px-4 max-w-2xl">
                <Button
                    variant="ghost"
                    onClick={() => router.push('/vault')}
                    className="mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Vault
                </Button>

                {!isUnlocked ? (
                    <Card>
                        <CardHeader>
                            <h2 className="text-2xl font-bold">Unlock Vault</h2>
                            <p className="text-sm text-muted-foreground">
                                Enter your master password to view this item
                            </p>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <Input
                                    type="password"
                                    placeholder="Master password"
                                    value={tempPassword}
                                    onChange={(e) => setTempPassword(e.target.value)}
                                    disabled={unlocking}
                                    autoFocus
                                />
                                <Button type="submit" className="w-full" disabled={unlocking || !tempPassword}>
                                    {unlocking ? (
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
                ) : item.decryptedData ? (
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
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowEditModal(true)}
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 text-red-600 hover:text-red-700"
                                    onClick={() => setShowDeleteDialog(true)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                            <p className="text-muted-foreground">Decrypting...</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
