import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { apiUrl } from '../../lib/api';

interface UserInfo {
  _id: string;
  username: string;
  admin: boolean;
}

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

// Initial state load from localStorage
const savedToken = localStorage.getItem('quiz_token');
const savedUser = localStorage.getItem('quiz_user');

let parsedUser = null;
try {
  if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
    parsedUser = JSON.parse(savedUser);
  }
} catch (e) {
  console.error("Error parsing saved user from localStorage:", e);
}

const tokenVal = (savedToken && savedToken !== 'undefined' && savedToken !== 'null') ? savedToken : null;

const initialState: AuthState = {
  token: tokenVal,
  user: parsedUser,
  isAuthenticated: !!tokenVal && !!parsedUser,
  loading: false,
  error: null,
  successMessage: null,
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

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(apiUrl('/users/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      return await handleResponse(response, 'Login failed');
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const signupUser = createAsyncThunk(
  'auth/signup',
  async (credentials: { username: string; password: string; admin?: boolean }, { rejectWithValue }) => {
    try {
      const response = await fetch(apiUrl('/users/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      return await handleResponse(response, 'Registration failed');
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.successMessage = null;
      localStorage.removeItem('quiz_token');
      localStorage.removeItem('quiz_user');
    },
    clearMessages(state) {
      state.error = null;
      state.successMessage = null;
    }
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      localStorage.setItem('quiz_token', action.payload.token);
      localStorage.setItem('quiz_user', JSON.stringify(action.payload.user));
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Signup
    builder.addCase(signupUser.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.successMessage = null;
    });
    builder.addCase(signupUser.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.successMessage = action.payload.status || 'Sign up successful!';
    });
    builder.addCase(signupUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { logout, clearMessages } = authSlice.actions;
export default authSlice.reducer;
