import { Request, Response } from 'express';
import { QuestionService } from '../services/question.service';

const questionService = new QuestionService();

export class QuestionController {
  async getAll(_req: Request, res: Response): Promise<void> {
    const questions = await questionService.getAll();
    res.json(questions);
  }

  async getById(req: Request, res: Response): Promise<void> {
    const question = await questionService.getById(req.params.questionId as string);
    if (!question) {
      res.status(404).json({ message: 'Question not found' });
      return;
    }
    res.json(question);
  }

  async create(req: Request, res: Response): Promise<void> {
    const { text, options, keywords, correctAnswerIndex } = req.body;
    const author = (req as any).user?._id;
    const question = await questionService.create({ text, options, keywords, correctAnswerIndex, author });
    res.status(201).json(question);
  }

  async update(req: Request, res: Response): Promise<void> {
    const { text, options, keywords, correctAnswerIndex } = req.body;
    const question = await questionService.update(req.params.questionId as string, {
      text,
      options,
      keywords,
      correctAnswerIndex,
    });
    if (!question) {
      res.status(404).json({ message: 'Question not found' });
      return;
    }
    res.json(question);
  }

  async delete(req: Request, res: Response): Promise<void> {
    const question = await questionService.delete(req.params.questionId as string);
    if (!question) {
      res.status(404).json({ message: 'Question not found' });
      return;
    }
    res.json({ message: 'Question deleted' });
  }
}
