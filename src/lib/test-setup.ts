import { generatePassword, calculatePasswordStrength } from './passwordUtils';
import { encryptVaultItem, decryptVaultItem } from './encryption';
import type { VaultItemData, PasswordOptions } from '@/types';

export const testSetup = () => {
    console.log('Testing Password Vault Setup...');

    // Test password generation
    const options: PasswordOptions = {
        length: 12,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
        excludeSimilar: true
    };

    const password = generatePassword(options);
    const strength = calculatePasswordStrength(password);

    console.log('Password Generator:', { password, strength });

    // Test encryption
    const testData: VaultItemData = {
        title: 'Test Account',
        username: 'test@example.com',
        password: 'TestPassword123!',
        url: 'https://test.com',
        notes: 'Test notes'
    };

    const encrypted = encryptVaultItem(testData, 'userpassword', 'user@email.com');
    const decrypted = decryptVaultItem(encrypted.encryptedData!, 'userpassword', 'user@email.com');

    console.log('Encryption/Decryption:', {
        encrypted: encrypted.success,
        decrypted: decrypted.success,
        dataMatch: JSON.stringify(testData) === JSON.stringify(decrypted.data)
    });

    console.log('Setup verification complete!');
};
