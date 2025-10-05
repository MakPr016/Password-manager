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

        const reencryptedItems = [];
        let failedItems = 0;

        for (const item of allVaultItems) {
            try {
                const decryptResult = decryptVaultItem(
                    item.encryptedData,
                    currentPassword,
                    user.email
                );

                if (decryptResult.success && decryptResult.data) {
                    const encryptionResult = encryptVaultItem(
                        decryptResult.data,
                        newPassword,
                        user.email
                    );

                    if (encryptionResult.success && encryptionResult.encryptedData) {
                        reencryptedItems.push({
                            _id: item._id,
                            encryptedData: encryptionResult.encryptedData
                        });
                    } else {
                        failedItems++;
                    }
                } else {
                    failedItems++;
                }
            } catch (error) {
                console.error(`Failed to re-encrypt item ${item._id}:`, error);
                failedItems++;
            }
        }

        if (failedItems > 0) {
            return NextResponse.json({
                success: false,
                error: `Failed to re-encrypt ${failedItems} vault items. Password not changed.`
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

        return NextResponse.json({
            success: true,
            message: 'Password changed successfully',
            reencryptedCount: reencryptedItems.length
        });

    } catch (error) {
        console.error('Password change error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
