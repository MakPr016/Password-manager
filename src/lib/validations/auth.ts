import { z } from 'zod';

export const loginSchema = z.object({
    email: z
        .email('Please enter a valid email address')
        .min(1, 'Email is required'),
    password: z
        .string()
        .min(1, 'Password is required')
        .min(6, 'Password must be at least 6 characters'),
    twoFactorCode: z
        .string()
        .optional()
        .refine((val) => !val || val.length === 6, {
            message: '2FA code must be 6 digits'
        })
});

export const signupSchema = z.object({
    name: z
        .string()
        .min(1, 'Name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name cannot exceed 50 characters'),
    email: z
        .email('Please enter a valid email address')
        .min(1, 'Email is required'),
    password: z
        .string()
        .min(1, 'Password is required')
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password cannot exceed 100 characters'),
    confirmPassword: z
        .string()
        .min(1, 'Please confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;