import CryptoJS from 'crypto-js';
import type { EncryptionResult, DecryptionResult, VaultItemData } from '@/types';

export const generateEncryptionKey = (userPassword: string, userEmail: string): string => {
    const salt = CryptoJS.enc.Utf8.parse(userEmail);
    const key = CryptoJS.PBKDF2(userPassword, salt, {
        keySize: 256 / 32,
        iterations: 10000
    });
    return key.toString();
};

export const encryptVaultItem = (
    data: VaultItemData,
    userPassword: string,
    userEmail: string
): EncryptionResult => {
    try {
        if (!data.title && !data.username && !data.password) {
            return {
                success: false,
                error: 'At least title, username, or password is required'
            };
        }
        const jsonString = JSON.stringify(data);

        const key = generateEncryptionKey(userPassword, userEmail);

        const encrypted = CryptoJS.AES.encrypt(jsonString, key).toString();

        return {
            success: true,
            encryptedData: encrypted
        };
    } catch (error) {
        console.error('Encryption error:', error);
        return {
            success: false,
            error: 'Encryption failed'
        };
    }
}

export const decryptVaultItem = (
    encryptedData: string,
    userPassword: string,
    userEmail: string
): DecryptionResult => {
    try {
        const key = generateEncryptionKey(userPassword, userEmail);
        const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, key);
        
        let decryptedString = '';
        try {
            decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);
        } catch (error) {
            throw new Error('Invalid password - decryption failed');
        }

        if (!decryptedString) {
            throw new Error('Invalid password - unable to decrypt data');
        }

        const data: VaultItemData = JSON.parse(decryptedString);

        return {
            success: true,
            data: data
        };
    } catch (error) {
        console.error('Decryption error:', error);
        return {
            success: false,
            error: error instanceof Error && error.message.includes('Invalid password') 
                ? 'Invalid password - please try again' 
                : 'Decryption failed - wrong password or corrupted data'
        };
    }
};

export const verifyUserPassword = (
    userEmail: string,
    password: string,
    sampleEncryptedData: string
): boolean => {
    const result = decryptVaultItem(sampleEncryptedData, password, userEmail);
    return result.success;
};

export const generateTestEncryption = (userPassword: string, userEmail: string): string => {
    const testData: VaultItemData = {
        title: 'verification',
        username: 'test',
        password: 'test',
        url: 'test',
        notes: 'test'
    };

    const result = encryptVaultItem(testData, userPassword, userEmail);
    return result.encryptedData || '';
};