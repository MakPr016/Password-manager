/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import VaultItemsGrid from './_components/VaultItemsGrid';
import AddVaultItemModal from './_components/AddVaultItemModal';
import { decryptVaultItem } from '@/lib/encryption';
import { useVault } from '@/providers/vault-provider';

interface VaultItem {
    _id: string;
    encryptedData: string;
    category: string;
    isFavorite: boolean;
    createdAt: string;
}

export default function VaultPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const category = searchParams.get('category');
    const { masterPassword, isUnlocked, unlockVault } = useVault();
    
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
    const [decryptedItems, setDecryptedItems] = useState<any[]>([]);
    const [tempPassword, setTempPassword] = useState('');
    const [unlocking, setUnlocking] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchVaultItems();
        }
    }, [status]);

    useEffect(() => {
        if (isUnlocked && masterPassword && vaultItems.length > 0) {
            filterAndDecryptItems();
        }
    }, [category, vaultItems, isUnlocked, masterPassword]);

    const fetchVaultItems = async () => {
        try {
            const response = await fetch('/api/vault');
            const data = await response.json();

            if (data.success) {
                setVaultItems(data.items);
            } else {
                toast.error('Failed to fetch vault items');
            }
        } catch (error) {
            toast.error('Error fetching vault items');
        } finally {
            setLoading(false);
        }
    };

    const filterAndDecryptItems = () => {
        if (!session?.user?.email || !masterPassword) return;

        let filteredItems = vaultItems;
        
        if (category) {
            filteredItems = vaultItems.filter(item => item.category === category);
        }

        const decrypted = filteredItems
            .map((item) => {
                const result = decryptVaultItem(
                    item.encryptedData,
                    masterPassword,
                    session.user.email!
                );

                if (!result.success || !result.data) {
                    return null;
                }

                return {
                    _id: item._id,
                    category: item.category,
                    isFavorite: item.isFavorite,
                    createdAt: item.createdAt,
                    decryptedData: result.data
                };
            })
            .filter((item) => item !== null);

        setDecryptedItems(decrypted);
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tempPassword || !session?.user?.email) return;

        setUnlocking(true);

        try {
            const response = await fetch('/api/vault');
            const data = await response.json();

            if (!data.success) {
                toast.error('Failed to fetch vault items');
                setUnlocking(false);
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
                    setUnlocking(false);
                    return;
                }
            }

            await unlockVault(tempPassword);
            setTempPassword('');
        } catch (error) {
            toast.error('Error unlocking vault');
        } finally {
            setUnlocking(false);
        }
    };

    const handleAddSuccess = () => {
        fetchVaultItems();
    };

    const getCategoryTitle = () => {
        if (!category) return 'All Items';
        return category.charAt(0).toUpperCase() + category.slice(1);
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
                        <CardTitle>Unlock Vault</CardTitle>
                        <CardDescription>
                            Enter your master password to access your vault
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
                                disabled={!tempPassword || unlocking}
                            >
                                {unlocking ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Unlocking...
                                    </>
                                ) : (
                                    'Unlock Vault'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <>
            <AddVaultItemModal
                open={showAddModal}
                onOpenChange={setShowAddModal}
                onSuccess={handleAddSuccess}
            />

            <div className="container mx-auto py-8 px-4">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{getCategoryTitle()}</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage your secure credentials
                        </p>
                    </div>
                    <Button onClick={() => setShowAddModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add New
                    </Button>
                </div>

                {decryptedItems.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground mb-4">
                            {category ? `No ${category} items found` : 'No vault items found'}
                        </p>
                        <Button onClick={() => setShowAddModal(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Item
                        </Button>
                    </div>
                ) : (
                    <VaultItemsGrid items={decryptedItems} />
                )}
            </div>
        </>
    );
}