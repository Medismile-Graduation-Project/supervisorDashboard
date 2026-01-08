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

export const createReport = createAsyncThunk(
  'reports/createReport',
  async ({ report_type, target_type, target_id, title, description, content, attachments }, { rejectWithValue }) => {
    try {
      const payload = {
        report_type,
        target_type,
        target_id,
        title,
        description: description || '',
        content: content || {},
      };
      
      // إضافة attachments إذا كان موجوداً
      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        payload.attachments = attachments;
      }
      
      const response = await api.post('/reports/', payload);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateReport = createAsyncThunk(
  'reports/updateReport',
  async ({ reportId, title, description, content }, { rejectWithValue }) => {
    try {
      const payload = {};
      
      if (title !== undefined) {
        payload.title = title;
      }
      
      if (description !== undefined) {
        payload.description = description;
      }
      
      if (content !== undefined) {
        // تحويل content من string إلى object إذا كان string
        if (typeof content === 'string') {
          try {
            payload.content = JSON.parse(content);
          } catch (e) {
            payload.content = { summary: content };
          }
        } else {
          payload.content = content;
        }
      }
      
      const response = await api.patch(`/reports/${reportId}/`, payload);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const approveReport = createAsyncThunk(
  'reports/approveReport',
  async ({ reportId, review_notes, score }, { rejectWithValue }) => {
    try {
      const payload = {};
      
      // إضافة review_notes إذا كان موجوداً
      if (review_notes && review_notes.trim()) {
        payload.review_notes = review_notes.trim();
      }
      
      // إضافة score إذا كان موجوداً
      if (score !== undefined && score !== null) {
        payload.score = parseFloat(score);
      }
      
      const response = await api.post(`/reports/${reportId}/approve/`, payload);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const submitReport = createAsyncThunk(
  'reports/submitReport',
  async (reportId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/reports/${reportId}/submit/`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const rejectReport = createAsyncThunk(
  'reports/rejectReport',
  async ({ reportId, review_notes }, { rejectWithValue }) => {
    try {
      const payload = {};
      
      // review_notes مطلوب لرفض التقرير
      if (review_notes && review_notes.trim()) {
        payload.review_notes = review_notes.trim();
      }
      
      const response = await api.post(`/reports/${reportId}/reject/`, payload);
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
      // Create Report
      .addCase(createReport.fulfilled, (state, action) => {
        state.reports.unshift(action.payload);
      })
      // Update Report
      .addCase(updateReport.fulfilled, (state, action) => {
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
      })
      // Submit Report
      .addCase(submitReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitReport.fulfilled, (state, action) => {
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
      .addCase(submitReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentReport, clearError } = reportsSlice.actions;
export default reportsSlice.reducer;










