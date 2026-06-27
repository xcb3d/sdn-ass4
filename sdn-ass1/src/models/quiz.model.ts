import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IQuiz extends Document {
  title: string;
  description: string;
  questions: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const quizSchema = new Schema<IQuiz>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
  },
  { timestamps: true }
);

export const Quiz = mongoose.model<IQuiz>('Quiz', quizSchema);
