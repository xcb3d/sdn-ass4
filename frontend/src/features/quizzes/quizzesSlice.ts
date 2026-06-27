import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import { apiUrl } from '../../lib/api';

export interface QuestionInfo {
  _id: string;
  text: string;
  options: string[];
  keywords: string[];
  correctAnswerIndex: number;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuizInfo {
  _id: string;
  title: string;
  description: string;
  questions: QuestionInfo[] | string[];
  createdAt?: string;
  updatedAt?: string;
}

interface QuizzesState {
  list: QuizInfo[];
  currentQuiz: QuizInfo | null;
  loading: boolean;
  error: string | null;
}

const initialState: QuizzesState = {
  list: [],
  currentQuiz: null,
  loading: false,
  error: null,
};

// Helper function to get token from state returning explicit Record<string, string>
const getAuthHeader = (state: RootState): Record<string, string> => {
  const token = state.auth.token;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Helper to handle response and errors safely
const handleResponse = async (response: Response, defaultError: string) => {
  const text = await response.text();
  if (!response.ok) {
    try {
      const data = JSON.parse(text);
      throw new Error(data.message || data.err?.message || defaultError);
    } catch (e: any) {
      if (e.message && e.message !== defaultError && !e.message.includes('JSON')) {
        throw e;
      }
      throw new Error(text || response.statusText || defaultError);
    }
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error('Invalid server response format');
  }
};

export const fetchQuizzes = createAsyncThunk(
  'quizzes/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(apiUrl('/quizzes'));
      return await handleResponse(response, 'Failed to fetch quizzes');
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchQuizById = createAsyncThunk(
  'quizzes/fetchById',
  async (quizId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(apiUrl(`/quizzes/${quizId}`));
      return await handleResponse(response, 'Failed to fetch quiz');
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const createQuiz = createAsyncThunk(
  'quizzes/create',
  async (quizData: { title: string; description: string; questions?: string[] }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await fetch(apiUrl('/quizzes'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(state),
        },
        body: JSON.stringify(quizData),
      });
      return await handleResponse(response, 'Failed to create quiz');
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateQuiz = createAsyncThunk(
  'quizzes/update',
  async ({ quizId, quizData }: { quizId: string; quizData: { title: string; description: string; questions?: string[] } }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await fetch(apiUrl(`/quizzes/${quizId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(state),
        },
        body: JSON.stringify(quizData),
      });
      return await handleResponse(response, 'Failed to update quiz');
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteQuiz = createAsyncThunk(
  'quizzes/delete',
  async (quizId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await fetch(apiUrl(`/quizzes/${quizId}`), {
        method: 'DELETE',
        headers: getAuthHeader(state),
      });
      await handleResponse(response, 'Failed to delete quiz');
      return quizId;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const populateQuiz = createAsyncThunk(
  'quizzes/populate',
  async (quizId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(apiUrl(`/quizzes/${quizId}/populate`));
      return await handleResponse(response, 'Failed to populate quiz');
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const addQuestionToQuiz = createAsyncThunk(
  'quizzes/addQuestion',
  async (
    { quizId, questionData }: { quizId: string; questionData: Omit<QuestionInfo, '_id'> },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const response = await fetch(apiUrl(`/quizzes/${quizId}/question`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(state),
        },
        body: JSON.stringify(questionData),
      });
      return await handleResponse(response, 'Failed to add question to quiz');
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const bulkAddQuestionsToQuiz = createAsyncThunk(
  'quizzes/bulkAddQuestions',
  async (
    { quizId, questionsData }: { quizId: string; questionsData: Omit<QuestionInfo, '_id'>[] },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const response = await fetch(apiUrl(`/quizzes/${quizId}/questions`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(state),
        },
        body: JSON.stringify({ questions: questionsData }),
      });
      return await handleResponse(response, 'Failed to add questions to quiz');
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

const quizzesSlice = createSlice({
  name: 'quizzes',
  initialState,
  reducers: {
    clearCurrentQuiz(state) {
      state.currentQuiz = null;
    },
  },
  extraReducers: (builder) => {
    // fetchQuizzes
    builder.addCase(fetchQuizzes.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchQuizzes.fulfilled, (state, action: PayloadAction<QuizInfo[]>) => {
      state.loading = false;
      state.list = action.payload;
    });
    builder.addCase(fetchQuizzes.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // fetchQuizById
    builder.addCase(fetchQuizById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchQuizById.fulfilled, (state, action: PayloadAction<QuizInfo>) => {
      state.loading = false;
      state.currentQuiz = action.payload;
    });
    builder.addCase(fetchQuizById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // createQuiz
    builder.addCase(createQuiz.fulfilled, (state, action: PayloadAction<QuizInfo>) => {
      state.list.push(action.payload);
    });

    // updateQuiz
    builder.addCase(updateQuiz.fulfilled, (state, action: PayloadAction<QuizInfo>) => {
      const idx = state.list.findIndex((q) => q._id === action.payload._id);
      if (idx !== -1) {
        state.list[idx] = action.payload;
      }
      if (state.currentQuiz?._id === action.payload._id) {
        state.currentQuiz = action.payload;
      }
    });

    // deleteQuiz
    builder.addCase(deleteQuiz.fulfilled, (state, action: PayloadAction<string>) => {
      state.list = state.list.filter((q) => q._id !== action.payload);
      if (state.currentQuiz?._id === action.payload) {
        state.currentQuiz = null;
      }
    });

    // populateQuiz
    builder.addCase(populateQuiz.fulfilled, (state, action: PayloadAction<QuizInfo>) => {
      const idx = state.list.findIndex((q) => q._id === action.payload._id);
      if (idx !== -1) {
        state.list[idx] = action.payload;
      }
      state.currentQuiz = action.payload;
    });

    // addQuestionToQuiz
    builder.addCase(addQuestionToQuiz.fulfilled, (state, action: PayloadAction<QuizInfo>) => {
      const idx = state.list.findIndex((q) => q._id === action.payload._id);
      if (idx !== -1) {
        state.list[idx] = action.payload;
      }
      state.currentQuiz = action.payload;
    });

    // bulkAddQuestionsToQuiz
    builder.addCase(bulkAddQuestionsToQuiz.fulfilled, (state, action: PayloadAction<QuizInfo>) => {
      const idx = state.list.findIndex((q) => q._id === action.payload._id);
      if (idx !== -1) {
        state.list[idx] = action.payload;
      }
      state.currentQuiz = action.payload;
    });
  },
});

export const { clearCurrentQuiz } = quizzesSlice.actions;
export default quizzesSlice.reducer;
