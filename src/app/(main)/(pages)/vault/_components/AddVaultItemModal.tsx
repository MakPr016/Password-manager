'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AddVaultItemForm from '@/components/forms/AddVaultItemForm';

interface AddVaultItemModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function AddVaultItemModal({ open, onOpenChange, onSuccess }: AddVaultItemModalProps) {
    const [masterPassword, setMasterPassword] = useState('');
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(true);
    const [verifying, setVerifying] = useState(false);

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (masterPassword) {
            setShowPasswordPrompt(false);
            toast.success('Ready to add new item');
        }
    };

    const handleSuccess = () => {
        setMasterPassword('');
        setShowPasswordPrompt(true);
        onSuccess();
        onOpenChange(false);
    };

    const handleCancel = () => {
        setMasterPassword('');
        setShowPasswordPrompt(true);
        onOpenChange(false);
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setMasterPassword('');
            setShowPasswordPrompt(true);
        }
        onOpenChange(open);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                {showPasswordPrompt ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Unlock Vault</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <p className="text-sm text-muted-foreground">
                                Enter your master password to add a new item
                            </p>
                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="masterPassword">Master Password</Label>
                                    <Input
                                        id="masterPassword"
                                        type="password"
                                        value={masterPassword}
                                        onChange={(e) => setMasterPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        className="flex-1"
                                        disabled={!masterPassword || verifying}
                                    >
                                        {verifying ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            'Unlock'
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCancel}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Add New Vault Item</DialogTitle>
                        </DialogHeader>
                        <AddVaultItemForm
                            masterPassword={masterPassword}
                            onSuccess={handleSuccess}
                            onCancel={handleCancel}
                        />
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
