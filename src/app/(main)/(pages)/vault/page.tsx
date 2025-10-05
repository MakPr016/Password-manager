/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import VaultItemsGrid from './_components/VaultItemsGrid';
import PasswordPrompt from './_components/PasswordPrompt';
import AddVaultItemModal from './_components/AddVaultItemModal';
import { decryptVaultItem } from '@/lib/encryption';

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
    
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
    const [decryptedItems, setDecryptedItems] = useState<any[]>([]);
    const [masterPassword, setMasterPassword] = useState<string>('');

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
        if (masterPassword && vaultItems.length > 0) {
            filterAndDecryptItems();
        }
    }, [category, vaultItems, masterPassword]);

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

    const handlePasswordSubmit = async (password: string) => {
        setLoading(true);

        try {
            if (!session?.user?.email) {
                toast.error('Session error');
                return;
            }

            setMasterPassword(password);

            const decrypted = vaultItems
                .map((item) => {
                    const result = decryptVaultItem(
                        item.encryptedData,
                        password,
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

            if (decrypted.length === 0) {
                toast.error('Invalid password or no items could be decrypted');
                setLoading(false);
                return;
            }

            setDecryptedItems(decrypted);
            setShowPasswordPrompt(false);
            toast.success('Vault unlocked successfully!');
        } catch (error) {
            toast.error('Failed to decrypt vault');
        } finally {
            setLoading(false);
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

    return (
        <>
            <PasswordPrompt
                open={showPasswordPrompt}
                onPasswordSubmit={handlePasswordSubmit}
                loading={loading}
            />

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
                    {!showPasswordPrompt && (
                        <Button onClick={() => setShowAddModal(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add New
                        </Button>
                    )}
                </div>

                {decryptedItems.length === 0 && !showPasswordPrompt ? (
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