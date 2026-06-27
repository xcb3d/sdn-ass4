import { Quiz, IQuiz } from '../models/quiz.model';
import { Question, IQuestion } from '../models/question.model';

export class QuizService {
  async getAll(): Promise<IQuiz[]> {
    return Quiz.find().populate('questions');
  }

  async getById(id: string): Promise<IQuiz | null> {
    return Quiz.findById(id).populate('questions');
  }

  async create(data: { title: string; description: string; questions?: string[] }): Promise<IQuiz> {
    const quiz = new Quiz(data);
    return quiz.save();
  }

  async update(
    id: string,
    data: Partial<{ title: string; description: string; questions: string[] }>
  ): Promise<IQuiz | null> {
    return Quiz.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id: string): Promise<IQuiz | null> {
    const quiz = await Quiz.findById(id);
    if (!quiz) return null;

    await Question.deleteMany({ _id: { $in: quiz.questions } });
    return Quiz.findByIdAndDelete(id);
  }

  async populateWithKeyword(quizId: string, keyword: string): Promise<IQuiz | null> {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return null;

    const matchingQuestions = await Question.find({ text: { $regex: keyword, $options: 'i' } });
    const matchingIds = matchingQuestions.map((q) => q._id);

    quiz.questions = matchingIds;
    await quiz.save();

    return Quiz.findById(quizId).populate('questions');
  }

  async addQuestion(quizId: string, questionData: {
    text: string;
    options: string[];
    keywords: string[];
    correctAnswerIndex: number;
    author?: any;
  }): Promise<IQuiz | null> {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return null;

    const question = new Question(questionData);
    const saved = await question.save();

    quiz.questions.push(saved._id as any);
    await quiz.save();

    return Quiz.findById(quizId).populate('questions');
  }

  async addQuestions(quizId: string, questionsData: Array<{
    text: string;
    options: string[];
    keywords: string[];
    correctAnswerIndex: number;
    author?: any;
  }>): Promise<IQuiz | null> {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return null;

    const questions = await Question.insertMany(questionsData);
    const ids = questions.map((q) => q._id);

    quiz.questions.push(...ids as any);
    await quiz.save();

    return Quiz.findById(quizId).populate('questions');
  }
}
