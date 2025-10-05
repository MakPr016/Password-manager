'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

interface VaultContextType {
    masterPassword: string | null;
    isUnlocked: boolean;
    unlockVault: (password: string) => void;
    lockVault: () => void;
    remainingTime: number;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

const ENC_KEY = "__vault_enc_key__";
const ENC_PWD = "__vault_enc_pwd__";
const IV_KEY = "__vault_iv__";
const TIMEOUT_KEY = "__vault_timeout__";
const TIMEOUT_DURATION = 10 * 60 * 1000;

async function generateKey(): Promise<CryptoKey> {
    const keyData = crypto.getRandomValues(new Uint8Array(32));
    return await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
    );
}

async function getOrCreateKey(): Promise<CryptoKey> {
    const storedKey = sessionStorage.getItem(ENC_KEY);
    if (storedKey) {
        const keyData = Uint8Array.from(atob(storedKey), c => c.charCodeAt(0));
        return await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'AES-GCM' },
            true,
            ['encrypt', 'decrypt']
        );
    }
    
    const key = await generateKey();
    const exported = await crypto.subtle.exportKey('raw', key);
    const keyArray = new Uint8Array(exported);
    sessionStorage.setItem(ENC_KEY, btoa(String.fromCharCode(...keyArray)));
    return key;
}

async function encryptPassword(password: string): Promise<{ encrypted: string; iv: string }> {
    const key = await getOrCreateKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
    const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
    );
    
    const encryptedArray = new Uint8Array(encryptedBuffer);
    return {
        encrypted: btoa(String.fromCharCode(...encryptedArray)),
        iv: btoa(String.fromCharCode(...iv))
    };
}

async function decryptPassword(encrypted: string, ivStr: string): Promise<string> {
    try {
        const key = await getOrCreateKey();
        const iv = Uint8Array.from(atob(ivStr), c => c.charCodeAt(0));
        const encryptedData = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
        
        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            encryptedData
        );
        
        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    } catch (error) {
        throw new Error('Decryption failed');
    }
}

export function VaultProvider({ children }: { children: ReactNode }) {
    const [masterPassword, setMasterPassword] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);

    useEffect(() => {
        const initializeSession = async () => {
            const encPwd = sessionStorage.getItem(ENC_PWD);
            const iv = sessionStorage.getItem(IV_KEY);
            const timeout = sessionStorage.getItem(TIMEOUT_KEY);
            
            if (encPwd && iv && timeout) {
                const expiryTime = parseInt(timeout);
                const now = Date.now();
                
                if (now < expiryTime) {
                    try {
                        const pwd = await decryptPassword(encPwd, iv);
                        setMasterPassword(pwd);
                        setRemainingTime(Math.floor((expiryTime - now) / 1000));
                    } catch (error) {
                        sessionStorage.removeItem(ENC_PWD);
                        sessionStorage.removeItem(IV_KEY);
                        sessionStorage.removeItem(TIMEOUT_KEY);
                    }
                } else {
                    sessionStorage.removeItem(ENC_PWD);
                    sessionStorage.removeItem(IV_KEY);
                    sessionStorage.removeItem(TIMEOUT_KEY);
                }
            }
            
            setMounted(true);
        };
        
        initializeSession();
    }, []);

    useEffect(() => {
        if (!masterPassword) {
            setRemainingTime(0);
            return;
        }

        const interval = setInterval(() => {
            const timeout = sessionStorage.getItem(TIMEOUT_KEY);
            if (!timeout) {
                lockVault();
                return;
            }

            const expiryTime = parseInt(timeout);
            const now = Date.now();
            const remaining = Math.floor((expiryTime - now) / 1000);

            if (remaining <= 0) {
                lockVault();
                toast.error('Session expired. Please unlock vault again.');
            } else {
                setRemainingTime(remaining);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [masterPassword]);

    const unlockVault = async (password: string) => {
        const expiry = Date.now() + TIMEOUT_DURATION;
        const { encrypted, iv } = await encryptPassword(password);
        
        setMasterPassword(password);
        sessionStorage.setItem(ENC_PWD, encrypted);
        sessionStorage.setItem(IV_KEY, iv);
        sessionStorage.setItem(TIMEOUT_KEY, expiry.toString());
        setRemainingTime(TIMEOUT_DURATION / 1000);
        toast.success('Vault unlocked for 10 minutes');
    };

    const lockVault = () => {
        setMasterPassword(null);
        setRemainingTime(0);
        sessionStorage.removeItem(ENC_PWD);
        sessionStorage.removeItem(IV_KEY);
        sessionStorage.removeItem(TIMEOUT_KEY);
        sessionStorage.removeItem(ENC_KEY);
    };

    if (!mounted) {
        return null;
    }

    return (
        <VaultContext.Provider
            value={{
                masterPassword,
                isUnlocked: masterPassword !== null,
                unlockVault,
                lockVault,
                remainingTime,
            }}
        >
            {children}
        </VaultContext.Provider>
    );
}

export function useVault() {
    const context = useContext(VaultContext);
    if (context === undefined) {
        throw new Error('useVault must be used within a VaultProvider');
    }
    return context;
}
