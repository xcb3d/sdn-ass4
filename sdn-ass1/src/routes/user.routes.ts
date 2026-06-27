import { Router } from 'express';
import passport from 'passport';
import { UserController } from '../controllers/user.controller';
import { verifyUser, verifyAdmin } from '../authenticate';

const router = Router();
const userController = new UserController();

// GET all users (Admin only)
router.get('/', verifyUser, verifyAdmin, (req, res, next) => userController.getAll(req, res, next));

// User Registration
router.post('/signup', (req, res) => userController.signup(req, res));

// User Login
router.post('/login', passport.authenticate('local', { session: false }), (req, res) => userController.login(req, res));

export { router as userRoutes };
