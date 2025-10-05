'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { encryptVaultItem } from '@/lib/encryption';
import { useVault } from '@/providers/vault-provider';

const vaultItemSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    username: z.string().optional(),
    password: z.string().min(1, 'Password is required'),
    url: z.string().optional(),
    notes: z.string().optional(),
    category: z.string().min(1, 'Category is required'),
    customCategory: z.string().optional(),
});

type VaultItemFormData = z.infer<typeof vaultItemSchema>;

interface EditVaultItemModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    item: {
        _id: string;
        decryptedData: {
            title: string;
            username?: string;
            password: string;
            url?: string;
            notes?: string;
        };
        category: string;
    };
}

export default function EditVaultItemModal({ open, onOpenChange, onSuccess, item }: EditVaultItemModalProps) {
    const { data: session } = useSession();
    const { masterPassword } = useVault();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const predefinedCategories = ['general', 'work', 'personal', 'banking', 'social'];
    const isCustomCategory = !predefinedCategories.includes(item.category);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<VaultItemFormData>({
        resolver: zodResolver(vaultItemSchema),
        defaultValues: {
            title: item.decryptedData.title,
            username: item.decryptedData.username || '',
            password: item.decryptedData.password,
            url: item.decryptedData.url || '',
            notes: item.decryptedData.notes || '',
            category: isCustomCategory ? 'other' : item.category,
            customCategory: isCustomCategory ? item.category : '',
        }
    });

    const category = watch('category');

    useEffect(() => {
        if (open) {
            const isCustom = !predefinedCategories.includes(item.category);
            reset({
                title: item.decryptedData.title,
                username: item.decryptedData.username || '',
                password: item.decryptedData.password,
                url: item.decryptedData.url || '',
                notes: item.decryptedData.notes || '',
                category: isCustom ? 'other' : item.category,
                customCategory: isCustom ? item.category : '',
            });
        }
    }, [open]);

    const onSubmit = async (data: VaultItemFormData) => {
        if (!session?.user?.email || !masterPassword) {
            toast.error('Session expired');
            return;
        }

        if (data.category === 'other' && !data.customCategory) {
            toast.error('Please enter a custom category name');
            return;
        }

        setIsSubmitting(true);

        try {
            const vaultData = {
                title: data.title,
                username: data.username ?? '',
                password: data.password,
                url: data.url ?? '',
                notes: data.notes ?? '',
            };

            const encryptionResult = encryptVaultItem(vaultData, masterPassword, session.user.email);

            if (!encryptionResult.success || !encryptionResult.encryptedData) {
                toast.error('Failed to encrypt data');
                setIsSubmitting(false);
                return;
            }

            const finalCategory = data.category === 'other' && data.customCategory
                ? data.customCategory.toLowerCase().trim()
                : data.category;

            const response = await fetch(`/api/vault/${item._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    encryptedData: encryptionResult.encryptedData,
                    category: finalCategory,
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Item updated successfully!');
                onSuccess();
                onOpenChange(false);
            } else {
                toast.error('Failed to update item');
            }
        } catch (error) {
            toast.error('Error updating item');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Item</DialogTitle>
                    <DialogDescription>Update your vault item details</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            {...register('title')}
                            placeholder="e.g., Gmail Account"
                        />
                        {errors.title && (
                            <p className="text-sm text-red-500">{errors.title.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="username">Username / Email</Label>
                        <Input
                            id="username"
                            {...register('username')}
                            placeholder="username@example.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="flex gap-2">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                {...register('password')}
                                placeholder="Enter password"
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        {errors.password && (
                            <p className="text-sm text-red-500">{errors.password.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="url">Website URL</Label>
                        <Input
                            id="url"
                            {...register('url')}
                            placeholder="https://example.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            {...register('notes')}
                            placeholder="Additional notes..."
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                            value={category}
                            onValueChange={(value) => setValue('category', value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="work">Work</SelectItem>
                                <SelectItem value="personal">Personal</SelectItem>
                                <SelectItem value="banking">Banking</SelectItem>
                                <SelectItem value="social">Social</SelectItem>
                                <SelectItem value="other">Other (Custom)</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.category && (
                            <p className="text-sm text-red-500">{errors.category.message}</p>
                        )}
                    </div>

                    {category === 'other' && (
                        <div className="space-y-2">
                            <Label htmlFor="customCategory">Custom Category Name</Label>
                            <Input
                                id="customCategory"
                                {...register('customCategory')}
                                placeholder="Enter category name"
                            />
                            {errors.customCategory && (
                                <p className="text-sm text-red-500">{errors.customCategory.message}</p>
                            )}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Item'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
