import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { encrypt2FASecret, decrypt2FASecret } from './2faEncryption';

export const generate2FASecret = (email: string) => {
    const secret = speakeasy.generateSecret({
        name: `VaultPass (${email})`,
        issuer: 'VaultPass',
        length: 32
    });

    return {
        secret: secret.base32,
        otpauthUrl: secret.otpauth_url
    };
};

export const generateQRCode = async (otpauthUrl: string): Promise<string> => {
    try {
        const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
        return qrCodeDataUrl;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw error;
    }
};

export const verify2FAToken = (token: string, encryptedSecret: string): boolean => {
    try {
        const secret = decrypt2FASecret(encryptedSecret);

        return speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 1
        });
    } catch (error) {
        console.error('Error verifying 2FA token:', error);
        return false;
    }
};

export const encryptAndStore2FASecret = (secret: string): string => {
    return encrypt2FASecret(secret);
};

export const getDecrypted2FASecret = (encryptedSecret: string): string => {
    return decrypt2FASecret(encryptedSecret);
};