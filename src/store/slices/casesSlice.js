import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

// Async Thunks
export const fetchCases = createAsyncThunk(
  'cases/fetchCases',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/cases/', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchCaseById = createAsyncThunk(
  'cases/fetchCaseById',
  async (caseId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/cases/${caseId}/`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createCase = createAsyncThunk(
  'cases/createCase',
  async (caseData, { rejectWithValue }) => {
    try {
      const response = await api.post('/cases/', caseData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateCase = createAsyncThunk(
  'cases/updateCase',
  async ({ caseId, data }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/cases/${caseId}/`, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchAssignmentRequests = createAsyncThunk(
  'cases/fetchAssignmentRequests',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/cases/assignment-requests/', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const respondToAssignmentRequest = createAsyncThunk(
  'cases/respondToAssignmentRequest',
  async ({ requestId, status, supervisor_response }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/cases/assignment-requests/${requestId}/`, {
        status,
        supervisor_response,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  cases: [],
  currentCase: null,
  assignmentRequests: [],
  loading: false,
  error: null,
  filters: {
    status: null,
    priority: null,
    is_public: null,
  },
};

const casesSlice = createSlice({
  name: 'cases',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearCurrentCase: (state) => {
      state.currentCase = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cases
      .addCase(fetchCases.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCases.fulfilled, (state, action) => {
        state.loading = false;
        state.cases = action.payload;
      })
      .addCase(fetchCases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Case By ID
      .addCase(fetchCaseById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCaseById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCase = action.payload;
      })
      .addCase(fetchCaseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Case
      .addCase(createCase.fulfilled, (state, action) => {
        state.cases.unshift(action.payload);
      })
      // Update Case
      .addCase(updateCase.fulfilled, (state, action) => {
        const index = state.cases.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.cases[index] = action.payload;
        }
        if (state.currentCase?.id === action.payload.id) {
          state.currentCase = action.payload;
        }
      })
      // Fetch Assignment Requests
      .addCase(fetchAssignmentRequests.fulfilled, (state, action) => {
        state.assignmentRequests = action.payload;
      })
      // Respond to Assignment Request
      .addCase(respondToAssignmentRequest.fulfilled, (state, action) => {
        const index = state.assignmentRequests.findIndex(
          (r) => r.id === action.payload.id
        );
        if (index !== -1) {
          state.assignmentRequests[index] = action.payload;
        }
      });
  },
});

export const { setFilters, clearCurrentCase, clearError } = casesSlice.actions;
export default casesSlice.reducer;


