import { Question, IQuestion } from '../models/question.model';

export class QuestionService {
  async getAll(): Promise<IQuestion[]> {
    return Question.find();
  }

  async getById(id: string): Promise<IQuestion | null> {
    return Question.findById(id);
  }

  async create(data: {
    text: string;
    options: string[];
    keywords: string[];
    correctAnswerIndex: number;
    author?: any;
  }): Promise<IQuestion> {
    const question = new Question(data);
    return question.save();
  }

  async update(
    id: string,
    data: Partial<{
      text: string;
      options: string[];
      keywords: string[];
      correctAnswerIndex: number;
    }>
  ): Promise<IQuestion | null> {
    return Question.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id: string): Promise<IQuestion | null> {
    return Question.findByIdAndDelete(id);
  }
}
