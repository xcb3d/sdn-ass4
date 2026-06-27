import { Request, Response } from 'express';
import { QuizService } from '../services/quiz.service';

const quizService = new QuizService();

export class QuizController {
  async getAll(_req: Request, res: Response): Promise<void> {
    const quizzes = await quizService.getAll();
    res.json(quizzes);
  }

  async getById(req: Request, res: Response): Promise<void> {
    const quiz = await quizService.getById(req.params.quizId as string);
    if (!quiz) {
      res.status(404).json({ message: 'Quiz not found' });
      return;
    }
    res.json(quiz);
  }

  async create(req: Request, res: Response): Promise<void> {
    const { title, description, questions } = req.body;
    const quiz = await quizService.create({ title, description, questions });
    res.status(201).json(quiz);
  }

  async update(req: Request, res: Response): Promise<void> {
    const { title, description, questions } = req.body;
    const quiz = await quizService.update(req.params.quizId as string, {
      title,
      description,
      questions,
    });
    if (!quiz) {
      res.status(404).json({ message: 'Quiz not found' });
      return;
    }
    res.json(quiz);
  }

  async delete(req: Request, res: Response): Promise<void> {
    const quiz = await quizService.delete(req.params.quizId as string);
    if (!quiz) {
      res.status(404).json({ message: 'Quiz not found' });
      return;
    }
    res.json({ message: 'Quiz deleted' });
  }

  async populateCapital(req: Request, res: Response): Promise<void> {
    const quiz = await quizService.populateWithKeyword(req.params.quizId as string, 'capital');
    if (!quiz) {
      res.status(404).json({ message: 'Quiz not found' });
      return;
    }
    res.json(quiz);
  }

  async addQuestion(req: Request, res: Response): Promise<void> {
    const { text, options, keywords, correctAnswerIndex } = req.body;
    const author = (req as any).user?._id;
    const quiz = await quizService.addQuestion(req.params.quizId as string, {
      text,
      options,
      keywords,
      correctAnswerIndex,
      author,
    });
    if (!quiz) {
      res.status(404).json({ message: 'Quiz not found' });
      return;
    }
    res.status(201).json(quiz);
  }

  async addQuestions(req: Request, res: Response): Promise<void> {
    const { questions } = req.body;
    const author = (req as any).user?._id;
    const questionsWithAuthor = (questions || []).map((q: any) => ({ ...q, author }));
    const quiz = await quizService.addQuestions(req.params.quizId as string, questionsWithAuthor);
    if (!quiz) {
      res.status(404).json({ message: 'Quiz not found' });
      return;
    }
    res.status(201).json(quiz);
  }
}
