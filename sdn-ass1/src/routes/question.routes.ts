import { Router } from 'express';
import { QuestionController } from '../controllers/question.controller';
import { verifyUser, verifyAuthor } from '../authenticate';

const router = Router();
const questionController = new QuestionController();

router.get('/', (req, res) => questionController.getAll(req, res));
router.get('/:questionId', (req, res) => questionController.getById(req, res));
router.post('/', verifyUser, (req, res) => questionController.create(req, res));
router.put('/:questionId', verifyUser, verifyAuthor, (req, res) => questionController.update(req, res));
router.delete('/:questionId', verifyUser, verifyAuthor, (req, res) => questionController.delete(req, res));

export { router as questionRoutes };
