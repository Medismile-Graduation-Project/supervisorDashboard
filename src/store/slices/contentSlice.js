import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

// Async Thunks
export const fetchPendingContent = createAsyncThunk(
  'content/fetchPendingContent',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/community/content/', { params });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const approveContent = createAsyncThunk(
  'content/approveContent',
  async (contentId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/community/content/${contentId}/approve/`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const rejectContent = createAsyncThunk(
  'content/rejectContent',
  async ({ contentId, rejection_reason }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/community/content/${contentId}/reject/`, {
        rejection_reason: rejection_reason || '',
      });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  pendingContent: [],
  loading: false,
  error: null,
};

const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Pending Content
      .addCase(fetchPendingContent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingContent.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingContent = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchPendingContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Approve Content
      .addCase(approveContent.fulfilled, (state, action) => {
        state.pendingContent = state.pendingContent.filter(
          (c) => c.id !== action.payload.id
        );
      })
      // Reject Content
      .addCase(rejectContent.fulfilled, (state, action) => {
        state.pendingContent = state.pendingContent.filter(
          (c) => c.id !== action.payload.id
        );
      });
  },
});

export const { clearError } = contentSlice.actions;
export default contentSlice.reducer;


