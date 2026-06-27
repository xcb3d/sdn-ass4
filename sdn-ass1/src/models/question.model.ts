import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
  text: string;
  author: mongoose.Types.ObjectId;
  options: string[];
  keywords: string[];
  correctAnswerIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    text: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    options: { type: [String], required: true },
    keywords: { type: [String], required: true },
    correctAnswerIndex: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Question = mongoose.model<IQuestion>('Question', questionSchema);
