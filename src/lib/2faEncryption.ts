import CryptoJS from 'crypto-js';

export const encrypt2FASecret = (secret: string): string => {
    const encryptionKey = process.env.TWOFA_ENCRYPTION_KEY;

    if (!encryptionKey) {
        throw new Error('2FA encryption key not configured');
    }

    try {
        const encrypted = CryptoJS.AES.encrypt(secret, encryptionKey).toString();
        return encrypted;
    } catch (error) {
        console.error('2FA secret encryption error:', error);
        throw new Error('Failed to encrypt 2FA secret');
    }
};

export const decrypt2FASecret = (encryptedSecret: string): string => {
    const encryptionKey = process.env.TWOFA_ENCRYPTION_KEY;

    if (!encryptionKey) {
        throw new Error('2FA encryption key not configured');
    }

    try {
        const decryptedBytes = CryptoJS.AES.decrypt(encryptedSecret, encryptionKey);
        const decryptedSecret = decryptedBytes.toString(CryptoJS.enc.Utf8);

        if (!decryptedSecret) {
            throw new Error('Failed to decrypt 2FA secret');
        }

        return decryptedSecret;
    } catch (error) {
        console.error('2FA secret decryption error:', error);
        throw new Error('Failed to decrypt 2FA secret');
    }
};

export const generate2FAEncryptionKey = (): string => {
    return CryptoJS.lib.WordArray.random(256 / 8).toString();
};
