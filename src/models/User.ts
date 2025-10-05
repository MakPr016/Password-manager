import mongoose, { Schema, Document } from 'mongoose';

interface IUser extends Document {
  name: string;
  email: string;
  hashedPassword: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string; 
  preferences: {
    darkMode: boolean;
    autoClearTime: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxLength: [40, 'Name too long']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    hashedPassword: {
        type: String,
        required: [true, 'Password is required'],
        minLength: [6, 'Password must be at least 6 characters']
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: {
        type: String,
        default: null
    },
    preferences: {
        darkMode: {
            type: Boolean,
            default: false
        },
        autoClearTime: {
            type: Number,
            default: 20
        }
    }
}, {
    timestamps: true
})

userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.hashedPassword;
    delete user.twoFactorSecret;
    return user;
};

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema);