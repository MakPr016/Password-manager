'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, Save, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { encryptVaultItem } from '@/lib/encryption';
import { generatePassword } from '@/lib/passwordUtils';
import type { VaultItemData, PasswordOptions } from '@/types';

const vaultItemSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    username: z.string(),
    password: z.string(),
    url: z.string(),
    notes: z.string(),
    category: z.string().min(1, 'Category is required'),
    customCategory: z.string().optional(),
    isFavorite: z.boolean(),
});

type VaultItemFormData = z.infer<typeof vaultItemSchema>;

interface AddVaultItemFormProps {
    masterPassword: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function AddVaultItemForm({ masterPassword, onSuccess, onCancel }: AddVaultItemFormProps) {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<VaultItemFormData>({
        resolver: zodResolver(vaultItemSchema),
        defaultValues: {
            title: '',
            username: '',
            password: '',
            url: '',
            notes: '',
            category: 'general',
            customCategory: '',
            isFavorite: false,
        },
    });

    const category = watch('category');
    const customCategory = watch('customCategory');
    const isFavorite = watch('isFavorite');
    const password = watch('password');

    const handleGeneratePassword = () => {
        const options: PasswordOptions = {
            length: 16,
            uppercase: true,
            lowercase: true,
            numbers: true,
            symbols: true,
            excludeSimilar: true,
        };
        
        const generated = generatePassword(options);
        setValue('password', generated);
        toast.success('Password generated!');
    };

    const onSubmit = async (data: VaultItemFormData) => {
        if (!session?.user?.email) {
            toast.error('Not authenticated');
            return;
        }

        if (data.category === 'other' && !data.customCategory) {
            toast.error('Please enter a custom category name');
            return;
        }

        setIsLoading(true);

        try {
            const vaultData: VaultItemData = {
                title: data.title,
                username: data.username || '',
                password: data.password || '',
                url: data.url || '',
                notes: data.notes || '',
            };

            const encryptionResult = encryptVaultItem(
                vaultData,
                masterPassword,
                session.user.email
            );

            if (!encryptionResult.success || !encryptionResult.encryptedData) {
                toast.error('Failed to encrypt data');
                return;
            }

            const finalCategory = data.category === 'other' && data.customCategory
                ? data.customCategory.toLowerCase().trim()
                : data.category;

            const response = await fetch('/api/vault', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    encryptedData: encryptionResult.encryptedData,
                    category: finalCategory,
                    isFavorite: data.isFavorite,
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Vault item created successfully!');
                onSuccess();
            } else {
                toast.error(result.error || 'Failed to create vault item');
            }
        } catch (error) {
            toast.error('Error creating vault item');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                    id="title"
                    {...register('title')}
                    placeholder="e.g., GitHub Account"
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
                        {showPassword ? <EyeOff/> : <Eye/>}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleGeneratePassword}
                        title="Generate Password"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                    id="url"
                    {...register('url')}
                    placeholder="https://example.com"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                    id="notes"
                    {...register('notes')}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Additional notes..."
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
            </div>

            {category === 'other' && (
                <div className="space-y-2">
                    <Label htmlFor="customCategory">Custom Category Name *</Label>
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

            <div className="flex items-center space-x-2">
                <Checkbox
                    id="isFavorite"
                    checked={isFavorite}
                    onCheckedChange={(checked) =>
                        setValue('isFavorite', checked as boolean)
                    }
                />
                <Label htmlFor="isFavorite" className="cursor-pointer">
                    Mark as favorite
                </Label>
            </div>

            <div className="flex gap-2 pt-4">
                <Button
                    type="submit"
                    className="flex-1"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Item
                        </>
                    )}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}
