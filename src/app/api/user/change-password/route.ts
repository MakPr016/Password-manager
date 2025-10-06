import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import connectMongo from '@/lib/mongodb';
import User from '@/models/User';
import VaultItem from '@/models/VaultItem';
import { encryptVaultItem, decryptVaultItem } from '@/lib/encryption';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json({
                success: false,
                error: 'Not authenticated'
            }, { status: 401 });
        }

        await connectMongo();

        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({
                success: false,
                error: 'Current and new passwords are required'
            }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({
                success: false,
                error: 'Password must be at least 6 characters'
            }, { status: 400 });
        }

        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'User not found'
            }, { status: 404 });
        }

        const isValidPassword = await bcrypt.compare(currentPassword, user.hashedPassword);

        if (!isValidPassword) {
            return NextResponse.json({
                success: false,
                error: 'Current password is incorrect'
            }, { status: 400 });
        }

        const allVaultItems = await VaultItem.find({ userId: user._id });
        const websiteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const reencryptedItems = [];
        const failedItems = [];

        for (const item of allVaultItems) {
            try {
                const decryptResult = decryptVaultItem(
                    item.encryptedData,
                    currentPassword,
                    user.email
                );

                if (!decryptResult.success || !decryptResult.data) {
                    console.error(`Failed to decrypt item ${item._id}: ${decryptResult.error}`);
                    failedItems.push({
                        id: item._id,
                        reason: decryptResult.error || 'Decryption failed'
                    });
                    continue;
                }

                let vaultData = decryptResult.data;

                if (vaultData.title === 'PassManager Account' || 
                    vaultData.url?.includes(websiteUrl) ||
                    vaultData.notes?.includes('PassManager account')) {
                    vaultData = {
                        ...vaultData,
                        password: newPassword,
                        notes: 'Your PassManager account credentials - password updated automatically'
                    };
                }

                const encryptionResult = encryptVaultItem(
                    vaultData,
                    newPassword,
                    user.email
                );

                if (!encryptionResult.success || !encryptionResult.encryptedData) {
                    console.error(`Failed to encrypt item ${item._id}: ${encryptionResult.error}`);
                    failedItems.push({
                        id: item._id,
                        reason: encryptionResult.error || 'Encryption failed'
                    });
                    continue;
                }

                reencryptedItems.push({
                    _id: item._id,
                    encryptedData: encryptionResult.encryptedData
                });
            } catch (error) {
                console.error(`Exception re-encrypting item ${item._id}:`, error);
                failedItems.push({
                    id: item._id,
                    reason: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        if (failedItems.length > 0) {
            console.error('Failed items:', failedItems);
            return NextResponse.json({
                success: false,
                error: `Failed to re-encrypt ${failedItems.length} vault items. Password not changed.`,
                failedItems
            }, { status: 500 });
        }

        for (const item of reencryptedItems) {
            await VaultItem.findByIdAndUpdate(item._id, {
                encryptedData: item.encryptedData
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.hashedPassword = hashedPassword;
        await user.save();

        console.log('Password changed successfully');

        return NextResponse.json({
            success: true,
            message: 'Password changed successfully',
            reencryptedCount: reencryptedItems.length
        });

    } catch (error) {
        console.error('Password change error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}
