import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import connectMongo from '@/lib/mongodb';
import VaultItem from '@/models/VaultItem';
import User from '@/models/User';

export async function GET() {
    try {
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json({
                success: false,
                error: 'Not authenticated'
            }, { status: 401 });
        }

        await connectMongo();

        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'User not found'
            }, { status: 404 });
        }

        const vaultItems = await VaultItem.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .lean() as unknown as Array<{
                _id: mongoose.Types.ObjectId;
                encryptedData: string;
                category: string;
                isFavorite: boolean;
                createdAt: Date;
            }>;

        const items = vaultItems.map(item => ({
            _id: item._id.toString(),
            encryptedData: item.encryptedData,
            category: item.category,
            isFavorite: item.isFavorite,
            createdAt: item.createdAt.toISOString()
        }));

        return NextResponse.json({
            success: true,
            items
        });

    } catch (error) {
        console.error('Vault fetch error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json({
                success: false,
                error: 'Not authenticated'
            }, { status: 401 });
        }

        const body = await request.json();
        const { encryptedData, category, isFavorite } = body;

        if (!encryptedData) {
            return NextResponse.json({
                success: false,
                error: 'Encrypted data is required'
            }, { status: 400 });
        }

        await connectMongo();

        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'User not found'
            }, { status: 404 });
        }

        const newVaultItem = new VaultItem({
            userId: user._id,
            encryptedData,
            category: category || 'general',
            isFavorite: isFavorite || false,
        });

        await newVaultItem.save();

        return NextResponse.json({
            success: true,
            message: 'Vault item created successfully',
            item: {
                _id: newVaultItem._id.toString(),
                category: newVaultItem.category,
                isFavorite: newVaultItem.isFavorite,
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Vault creation error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
