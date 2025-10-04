import type { PasswordOptions } from '@/types';

export const generatePassword = (options: PasswordOptions): string => {
    let charset = '';
    const similar = '0O1lI';

    if (options.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (options.numbers) charset += '0123456789';
    if (options.symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (options.excludeSimilar) {
        charset = charset.split('').filter(char => !similar.includes(char)).join('');
    }

    if (charset.length === 0) {
        throw new Error('At least one character type must be selected');
    }

    let password = '';
    for (let i = 0; i < options.length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return password;
}

export const calculatePasswordStrength = (password: string): number => {
    let score = 0;

    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;
    if (password.length >= 16) score += 10;

    if (/[A-Z]/.test(password)) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^A-Za-z0-9]/.test(password)) score += 10;

    if (password.length >= 20) score += 10;

    return Math.min(score, 100);
};

export const getPasswordStrengthLabel = (score: number): string => {
    if (score < 30) return 'Weak';
    if (score < 60) return 'Fair';
    if (score < 80) return 'Good';
    return 'Strong';
};

export const getPasswordStrengthColor = (score: number): string => {
    if (score < 30) return '#EF4444';
    if (score < 60) return '#F59E0B';
    if (score < 80) return '#3B82F6';
    return '#10B981';
};

export const defaultPasswordOptions: PasswordOptions = {
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeSimilar: true
};