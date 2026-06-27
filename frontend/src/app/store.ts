import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import quizzesReducer from '../features/quizzes/quizzesSlice';
import questionsReducer from '../features/questions/questionsSlice';
import usersReducer from '../features/users/usersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    quizzes: quizzesReducer,
    questions: questionsReducer,
    users: usersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
