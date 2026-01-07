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

export const fetchEvaluationById = createAsyncThunk(
  'evaluations/fetchEvaluationById',
  async (evaluationId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/evaluations/${evaluationId}/`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createEvaluation = createAsyncThunk(
  'evaluations/createEvaluation',
  async ({ target_type, target_id, score, original_score, rubric, comment }, { rejectWithValue }) => {
    try {
      const scoreValue = parseFloat(score);
      const originalScoreValue = original_score !== undefined ? parseFloat(original_score) : scoreValue;
      
      const payload = {
        target_type, // "appointment" | "case" | "student" | "supervisor"
        target_id, // UUID للهدف المختار
        original_score: originalScoreValue,
        score: scoreValue,
      };
      
      // إضافة rubric إذا كان موجوداً
      if (rubric && Object.keys(rubric).length > 0) {
        payload.rubric = rubric;
      }
      
      // إضافة comment إذا كان موجوداً
      if (comment && comment.trim()) {
        payload.comment = comment.trim();
      }
      
      const response = await api.post('/evaluations/', payload);
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
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const adjustEvaluation = createAsyncThunk(
  'evaluations/adjustEvaluation',
  async ({ evaluationId, new_score, reason }, { rejectWithValue }) => {
    try {
      const payload = {
        new_score: parseFloat(new_score),
      };
      
      // إضافة reason إذا كان موجوداً
      if (reason && reason.trim()) {
        payload.reason = reason.trim();
      }
      
      const response = await api.patch(`/evaluations/${evaluationId}/adjust/`, payload);
      return response.data.data || response.data;
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

export const fetchStudentRating = createAsyncThunk(
  'evaluations/fetchStudentRating',
  async (studentId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/evaluations/students/${studentId}/rating/`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  evaluations: [],
  currentEvaluation: null,
  studentRating: null,
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
      // Fetch Evaluation By ID
      .addCase(fetchEvaluationById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvaluationById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEvaluation = action.payload;
      })
      .addCase(fetchEvaluationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.currentEvaluation = null;
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
      // Adjust Evaluation
      .addCase(adjustEvaluation.fulfilled, (state, action) => {
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
      // Fetch Student Rating
      .addCase(fetchStudentRating.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentRating.fulfilled, (state, action) => {
        state.loading = false;
        state.studentRating = action.payload;
      })
      .addCase(fetchStudentRating.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentEvaluation, clearError } = evaluationsSlice.actions;
export default evaluationsSlice.reducer;










