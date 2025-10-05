import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectMongo from '@/lib/mongodb';
import VaultItem from '@/models/VaultItem';
import { decryptVaultItem } from '@/lib/encryption';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();
        
        if (!session?.user?.email) {
            return NextResponse.json({
                success: false,
                error: 'Not authenticated'
            }, { status: 401 });
        }

        const { vaultItemId, password } = await request.json();

        if (!vaultItemId || !password) {
            return NextResponse.json({
                success: false,
                error: 'Vault item ID and password required'
            }, { status: 400 });
        }

        await connectMongo();

        const vaultItem = await VaultItem.findById(vaultItemId);

        if (!vaultItem) {
            return NextResponse.json({
                success: false,
                error: 'Vault item not found'
            }, { status: 404 });
        }

        const decryptResult = decryptVaultItem(
            vaultItem.encryptedData,
            password,
            session.user.email
        );

        if (!decryptResult.success) {
            return NextResponse.json({
                success: false,
                error: decryptResult.error || 'Decryption failed'
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            data: decryptResult.data,
            vaultInfo: {
                id: vaultItem._id,
                category: vaultItem.category,
                isFavorite: vaultItem.isFavorite,
                createdAt: vaultItem.createdAt
            }
        });

    } catch (error) {
        console.error('Decryption test error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
