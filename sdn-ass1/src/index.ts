import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import passport from 'passport';

dotenv.config();

import { quizRoutes } from './routes/quiz.routes';
import { questionRoutes } from './routes/question.routes';
import { userRoutes } from './routes/user.routes';

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/SimpleQuiz';

app.use(express.json());
app.use(passport.initialize());

// Enable CORS for API requests
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use('/users', userRoutes);
app.use('/quizzes', quizRoutes);
app.use('/question', questionRoutes);
app.use('/questions', questionRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    res.status(404).json({ message: 'Resource not found' });
    return;
  }
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ message });
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB (SimpleQuiz)');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

