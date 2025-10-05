'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, Copy, ExternalLink, Star } from 'lucide-react';
import { toast } from 'sonner';
import type { VaultItemData } from '@/types';

interface DecryptedVaultItem {
    _id: string;
    category: string;
    isFavorite: boolean;
    createdAt: string;
    decryptedData: VaultItemData;
}

interface VaultItemsGridProps {
    items: DecryptedVaultItem[];
}

export default function VaultItemsGrid({ items }: VaultItemsGridProps) {
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0]?.toUpperCase() || '')
            .slice(0, 2)
            .join('');
    };

    const handleCopy = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied to clipboard!`);

            setTimeout(async () => {
                await navigator.clipboard.writeText('');
            }, 15000);
        } catch (error) {
            toast.error('Failed to copy to clipboard');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {items.map((item) => (
                <VaultItemCard
                    key={item._id}
                    item={item}
                    getInitials={getInitials}
                    handleCopy={handleCopy}
                />
            ))}
        </div>
    );
}

interface VaultItemCardProps {
    item: DecryptedVaultItem;
    getInitials: (name: string) => string;
    handleCopy: (text: string, label: string) => void;
}

function VaultItemCard({ item, getInitials, handleCopy }: VaultItemCardProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-start flex-col md:flex-row justify-between gap-4">
                    <div className="flex flex-col md:flex-row items-start gap-4 flex-1 min-w-0">
                        <Avatar className="h-12 w-12 rounded-lg flex-shrink-0">
                            <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                                {getInitials(item.decryptedData.title || item.decryptedData.username || 'VA')}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0 w-full">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg truncate">
                                    {item.decryptedData.title}
                                </h3>
                                {item.isFavorite && (
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                                )}
                            </div>

                            {item.decryptedData.username && (
                                <p className="text-sm text-muted-foreground truncate mt-1">
                                    {item.decryptedData.username}
                                </p>
                            )}

                            {item.decryptedData.url && (
                                <a
                                    href={item.decryptedData.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block mt-1"
                                >
                                    {item.decryptedData.url}
                                </a>
                            )}

                            {item.decryptedData.password && (
                                <div className="flex items-center gap-2 mt-3">
                                    <div className="flex-1 min-w-0">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={item.decryptedData.password}
                                            readOnly
                                            className="w-full px-3 py-1.5 text-sm border rounded-md bg-muted/50 font-mono"
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="flex-shrink-0"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleCopy(item.decryptedData.password!, 'Password')}
                                        className="flex-shrink-0"
                                        aria-label="Copy password"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}

                            {item.decryptedData.notes && (
                                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                    {item.decryptedData.notes}
                                </p>
                            )}
                        </div>
                    </div>

                    <Link href={`/vault/${item._id}`} className="flex-shrink-0">
                        <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
