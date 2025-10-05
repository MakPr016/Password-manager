'use client';

import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Copy, ExternalLink, Star, Loader2, Edit, Trash2 } from 'lucide-react';
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

export default function VaultItemModal({ params }: { params: Promise<{ id: string }> }) {
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
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Dialog open onOpenChange={() => router.back()}>
            <DialogContent className="sm:max-w-[550px]">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : showPasswordPrompt ? (
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>Unlock Vault Item</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <p className="text-sm text-muted-foreground">
                                Enter your master password to view this item
                            </p>
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
                        </div>
                    </form>
                ) : item?.decryptedData ? (
                    <>
                        <DialogHeader>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12 rounded-lg">
                                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold">
                                        {getInitials(item.decryptedData.title || 'VA')}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <DialogTitle className="flex items-center gap-2">
                                        {item.decryptedData.title}
                                        {item.isFavorite && (
                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        )}
                                    </DialogTitle>
                                    <p className="text-sm text-muted-foreground capitalize">
                                        {item.category}
                                    </p>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
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
                                        rows={3}
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
                        </div>
                    </>
                ) : (
                    <div className="py-12 text-center">
                        <p className="text-muted-foreground">Item not found</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
