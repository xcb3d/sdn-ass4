import { Router } from 'express';
import { QuizController } from '../controllers/quiz.controller';
import { verifyUser, verifyAdmin } from '../authenticate';

const router = Router();
const quizController = new QuizController();

router.get('/', (req, res) => quizController.getAll(req, res));
router.get('/:quizId', (req, res) => quizController.getById(req, res));
router.post('/', verifyUser, verifyAdmin, (req, res) => quizController.create(req, res));
router.put('/:quizId', verifyUser, verifyAdmin, (req, res) => quizController.update(req, res));
router.delete('/:quizId', verifyUser, verifyAdmin, (req, res) => quizController.delete(req, res));

router.get('/:quizId/populate', (req, res) => quizController.populateCapital(req, res));
router.post('/:quizId/question', verifyUser, verifyAdmin, (req, res) => quizController.addQuestion(req, res));
router.post('/:quizId/questions', verifyUser, verifyAdmin, (req, res) => quizController.addQuestions(req, res));

export { router as quizRoutes };
