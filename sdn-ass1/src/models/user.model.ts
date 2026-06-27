import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  password?: string;
  admin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    admin: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
