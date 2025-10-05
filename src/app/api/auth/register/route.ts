import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectMongo from '@/lib/mongodb';
import User from '@/models/User';
import VaultItem from '@/models/VaultItem';
import { encryptVaultItem } from '@/lib/encryption';
import type { SignupCredentials, VaultItemData } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body: SignupCredentials = await request.json();
        const { name, email, password } = body;

        if (!name || !email || !password) {
            return NextResponse.json({
                success: false,
                error: 'Name, Email and Password are required'
            },
                {
                    status: 400
                }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Password must be at least 6 characters'
                },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('Invalid email format');
            return NextResponse.json(
                {
                    success: false,
                    error: 'Please enter a valid email address'
                },
                { status: 400 }
            );
        }

        await connectMongo();

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            console.log('User already exists:', email);
            return NextResponse.json(
                {
                    success: false,
                    error: 'A user already exists with this email address'
                },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            hashedPassword,
            twoFactorEnabled: false,
            preferences: {
                darkMode: false,
                autoClearTime: 20
            }
        });
        const savedUser = await user.save();
        console.log('User created successfully:', savedUser.email);

        const websiteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        
        const vaultData: VaultItemData = {
            title: 'PassManager Account',
            username: email,
            password: password,
            url: websiteUrl,
            notes: 'Your PassManager account credentials - saved automatically on registration'
        };

        const encryptionResult = encryptVaultItem(vaultData, password, email);

        if (!encryptionResult.success || !encryptionResult.encryptedData) {
            console.error('Failed to encrypt vault data');
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to create vault entry'
                },
                { status: 500 }
            );
        }

        const firstVaultEntry = new VaultItem({
            userId: savedUser._id,
            encryptedData: encryptionResult.encryptedData,
            category: 'personal',
            isFavorite: true
        });

        await firstVaultEntry.save();
        console.log('First vault entry created for user:', savedUser.email);

        return NextResponse.json(
            {
                success: true,
                autoLogin: true,
                message: 'Account created successfully!',
                user: {
                    id: savedUser._id.toString(),
                    name: savedUser.name,
                    email: savedUser.email,
                    twoFactorEnabled: savedUser.twoFactorEnabled
                }
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        
        if (error instanceof Error && 'code' in error && error.code === 11000) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'A user already exists with this email address'
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: 'An error occurred while creating your account. Please try again.'
            },
            { status: 500 }
        );
    }
}