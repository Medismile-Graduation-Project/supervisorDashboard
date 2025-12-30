import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

// Async Thunks
export const fetchEvaluations = createAsyncThunk(
  'evaluations/fetchEvaluations',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/evaluations/', { params });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createEvaluation = createAsyncThunk(
  'evaluations/createEvaluation',
  async ({ score, target_type, student_id }, { rejectWithValue }) => {
    try {
      const response = await api.post('/evaluations/', {
        score,
        target_type,
        student_id,
      });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateEvaluation = createAsyncThunk(
  'evaluations/updateEvaluation',
  async ({ evaluationId, data }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/evaluations/${evaluationId}/`, data);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const submitEvaluation = createAsyncThunk(
  'evaluations/submitEvaluation',
  async (evaluationId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/evaluations/${evaluationId}/submit/`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const finalizeEvaluation = createAsyncThunk(
  'evaluations/finalizeEvaluation',
  async (evaluationId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/evaluations/${evaluationId}/finalize/`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchStudentStatistics = createAsyncThunk(
  'evaluations/fetchStudentStatistics',
  async (studentId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/evaluations/students/${studentId}/statistics/`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  evaluations: [],
  currentEvaluation: null,
  studentStatistics: null,
  loading: false,
  error: null,
};

const evaluationsSlice = createSlice({
  name: 'evaluations',
  initialState,
  reducers: {
    clearCurrentEvaluation: (state) => {
      state.currentEvaluation = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Evaluations
      .addCase(fetchEvaluations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvaluations.fulfilled, (state, action) => {
        state.loading = false;
        state.evaluations = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchEvaluations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Evaluation
      .addCase(createEvaluation.fulfilled, (state, action) => {
        state.evaluations.unshift(action.payload);
      })
      // Update Evaluation
      .addCase(updateEvaluation.fulfilled, (state, action) => {
        const index = state.evaluations.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          state.evaluations[index] = action.payload;
        }
      })
      // Submit Evaluation
      .addCase(submitEvaluation.fulfilled, (state, action) => {
        const index = state.evaluations.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          state.evaluations[index] = action.payload;
        }
      })
      // Finalize Evaluation
      .addCase(finalizeEvaluation.fulfilled, (state, action) => {
        const index = state.evaluations.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          state.evaluations[index] = action.payload;
        }
      })
      // Fetch Student Statistics
      .addCase(fetchStudentStatistics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentStatistics.fulfilled, (state, action) => {
        state.loading = false;
        state.studentStatistics = action.payload;
      })
      .addCase(fetchStudentStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentEvaluation, clearError } = evaluationsSlice.actions;
export default evaluationsSlice.reducer;










