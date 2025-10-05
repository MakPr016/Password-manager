import mongoose, { Schema, Document } from 'mongoose';

interface IVaultItem extends Document {
  userId: mongoose.Types.ObjectId;
  encryptedData: string;
  category: string;
  isFavorite: boolean;
  lastAccessed?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const vaultItemSchema = new Schema<IVaultItem>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  encryptedData: {
    type: String,
    required: [true, 'Encrypted data is required']
  },
  category: {
    type: String,
    default: 'general',
    lowercase: true,
    trim: true
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  lastAccessed: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

vaultItemSchema.index({ userId: 1, createdAt: -1 });
vaultItemSchema.index({ userId: 1, isFavorite: -1 });
vaultItemSchema.index({ userId: 1, category: 1 });

export default mongoose.models.VaultItem || mongoose.model<IVaultItem>('VaultItem', vaultItemSchema);
