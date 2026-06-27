import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import { apiUrl } from '../../lib/api';

export interface UserDetail {
  _id: string;
  username: string;
  admin: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface UsersState {
  list: UserDetail[];
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
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

export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const response = await fetch(apiUrl('/users'), {
        method: 'GET',
        headers: getAuthHeader(state),
      });
      return await handleResponse(response, 'Failed to fetch users list');
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchUsers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUsers.fulfilled, (state, action: PayloadAction<UserDetail[]>) => {
      state.loading = false;
      state.list = action.payload;
    });
    builder.addCase(fetchUsers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export default usersSlice.reducer;
