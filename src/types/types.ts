export interface User {
  _id?: string;
  name: string;
  email: string;
  hashedPassword: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  preferences: {
    darkMode: boolean;
    autoClearTime: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VaultItemData {
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
}

export interface VaultItem {
  _id?: string;
  userId: string;
  encryptedData: string;
  category: string;
  isFavorite: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  lastAccessed?: Date;
}

export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeSimilar: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface EncryptionResult {
  success: boolean;
  encryptedData?: string;
  error?: string;
}

export interface DecryptionResult {
  success: boolean;
  data?: VaultItemData;
  error?: string;
}

export interface DashboardStats {
  totalPasswords: number;
  strongPasswords: number;
  weakPasswords: number;
  reusedPasswords: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  action: 'created' | 'updated' | 'accessed' | 'generated';
  title: string;
  timestamp: Date;
}