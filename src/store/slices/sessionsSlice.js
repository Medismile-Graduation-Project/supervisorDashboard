import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

// Async Thunks
export const fetchSessions = createAsyncThunk(
  'sessions/fetchSessions',
  async ({ caseId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/cases/${caseId}/sessions/`, { params });
      // API يعيد array مباشرة
      return response.data.data || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// تم حذف fetchSessionsNeedingReview - الـ endpoint غير موجود
export const fetchSessionsNeedingReview = createAsyncThunk(
  'sessions/fetchSessionsNeedingReview',
  async (params = {}, { rejectWithValue }) => {
    return rejectWithValue('الـ endpoint غير متاح');
  }
);

export const reviewSession = createAsyncThunk(
  'sessions/reviewSession',
  async ({ sessionId, status, supervisor_feedback }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/cases/sessions/${sessionId}/review/`, {
        status,
        supervisor_feedback,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchSessionById = createAsyncThunk(
  'sessions/fetchSessionById',
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/case-sessions/${sessionId}/`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  sessions: [],
  sessionsNeedingReview: [],
  currentSession: null,
  loading: false,
  error: null,
};

const sessionsSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    clearCurrentSession: (state) => {
      state.currentSession = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Sessions
      .addCase(fetchSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.loading = false;
        // التأكد من أن البيانات هي array
        state.sessions = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Sessions Needing Review
      .addCase(fetchSessionsNeedingReview.fulfilled, (state, action) => {
        state.sessionsNeedingReview = [];
      })
      .addCase(fetchSessionsNeedingReview.rejected, (state) => {
        state.sessionsNeedingReview = [];
      })
      // Review Session
      .addCase(reviewSession.fulfilled, (state, action) => {
        const index = state.sessions.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.sessions[index] = action.payload;
        }
        // إزالة من قائمة الجلسات التي تحتاج مراجعة
        state.sessionsNeedingReview = state.sessionsNeedingReview.filter(
          (s) => s.id !== action.payload.id
        );
      })
      // Fetch Session By ID
      .addCase(fetchSessionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSessionById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSession = action.payload;
      })
      .addCase(fetchSessionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentSession, clearError } = sessionsSlice.actions;
export default sessionsSlice.reducer;










