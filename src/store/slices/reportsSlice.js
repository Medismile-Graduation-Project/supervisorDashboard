import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

// Async Thunks
export const fetchReports = createAsyncThunk(
  'reports/fetchReports',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/reports/', { params });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchReportById = createAsyncThunk(
  'reports/fetchReportById',
  async (reportId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/reports/${reportId}/`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const approveReport = createAsyncThunk(
  'reports/approveReport',
  async (reportId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/reports/${reportId}/approve/`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const rejectReport = createAsyncThunk(
  'reports/rejectReport',
  async (reportId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/reports/${reportId}/reject/`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  reports: [],
  currentReport: null,
  loading: false,
  error: null,
};

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    clearCurrentReport: (state) => {
      state.currentReport = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Reports
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Report By ID
      .addCase(fetchReportById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReportById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentReport = action.payload;
      })
      .addCase(fetchReportById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Approve Report
      .addCase(approveReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveReport.fulfilled, (state, action) => {
        state.loading = false;
        // تحديث التقرير في القائمة
        const index = state.reports.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.reports[index] = action.payload;
        }
        // تحديث currentReport إذا كان هو نفسه
        if (state.currentReport?.id === action.payload.id) {
          state.currentReport = action.payload;
        }
      })
      .addCase(approveReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Reject Report
      .addCase(rejectReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectReport.fulfilled, (state, action) => {
        state.loading = false;
        // تحديث التقرير في القائمة
        const index = state.reports.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.reports[index] = action.payload;
        }
        // تحديث currentReport إذا كان هو نفسه
        if (state.currentReport?.id === action.payload.id) {
          state.currentReport = action.payload;
        }
      })
      .addCase(rejectReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentReport, clearError } = reportsSlice.actions;
export default reportsSlice.reducer;










