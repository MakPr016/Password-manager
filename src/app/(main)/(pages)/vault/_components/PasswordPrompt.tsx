'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface PasswordPromptProps {
    open: boolean;
    onPasswordSubmit: (password: string) => void;
    loading?: boolean;
}

export default function PasswordPrompt({ open, onPasswordSubmit, loading }: PasswordPromptProps) {
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onPasswordSubmit(password);
    };

    return (
        <Dialog open={open} onOpenChange={() => {}}>
            <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Unlock Your Vault</DialogTitle>
                    <DialogDescription>
                        Enter your master password to decrypt and view your vault items
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">Master Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            autoFocus
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading || !password}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Unlocking...
                            </>
                        ) : (
                            'Unlock Vault'
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
