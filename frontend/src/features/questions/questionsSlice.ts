import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import type { QuestionInfo } from '../quizzes/quizzesSlice';
import { apiUrl } from '../../lib/api';

interface QuestionsState {
  list: QuestionInfo[];
  loading: boolean;
  error: string | null;
}

const initialState: QuestionsState = {
  list: [],
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

export const fetchQuestions = createAsyncThunk(
  'questions/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(apiUrl('/question'));
      return await handleResponse(response, 'Failed to fetch questions');
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const createQuestion = createAsyncThunk(
  'questions/create',
  async (questionData: Omit<QuestionInfo, '_id'>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await fetch(apiUrl('/question'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(state),
        },
        body: JSON.stringify(questionData),
      });
      return await handleResponse(response, 'Failed to create question');
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateQuestion = createAsyncThunk(
  'questions/update',
  async (
    { questionId, questionData }: { questionId: string; questionData: Omit<QuestionInfo, '_id' | 'author'> },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const response = await fetch(apiUrl(`/question/${questionId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(state),
        },
        body: JSON.stringify(questionData),
      });
      return await handleResponse(response, 'Failed to update question');
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteQuestion = createAsyncThunk(
  'questions/delete',
  async (questionId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await fetch(apiUrl(`/question/${questionId}`), {
        method: 'DELETE',
        headers: getAuthHeader(state),
      });
      await handleResponse(response, 'Failed to delete question');
      return questionId;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

const questionsSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // fetchQuestions
    builder.addCase(fetchQuestions.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchQuestions.fulfilled, (state, action: PayloadAction<QuestionInfo[]>) => {
      state.loading = false;
      state.list = action.payload;
    });
    builder.addCase(fetchQuestions.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // createQuestion
    builder.addCase(createQuestion.fulfilled, (state, action: PayloadAction<QuestionInfo>) => {
      state.list.push(action.payload);
    });

    // updateQuestion
    builder.addCase(updateQuestion.fulfilled, (state, action: PayloadAction<QuestionInfo>) => {
      const idx = state.list.findIndex((q) => q._id === action.payload._id);
      if (idx !== -1) {
        state.list[idx] = action.payload;
      }
    });

    // deleteQuestion
    builder.addCase(deleteQuestion.fulfilled, (state, action: PayloadAction<string>) => {
      state.list = state.list.filter((q) => q._id !== action.payload);
    });
  },
});

export default questionsSlice.reducer;
