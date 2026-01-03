import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

// Async Thunks
export const fetchCases = createAsyncThunk(
  'cases/fetchCases',
  async (params = {}, { rejectWithValue, getState }) => {
    try {
      // الحصول على بيانات المستخدم من state
      const state = getState();
      const user = state.auth.user;
      
      // إضافة supervisor_id و university_id للفلترة
      const filteredParams = {
        ...params,
      };
      
      // إضافة supervisor_id إذا كان موجوداً
      if (user?.id) {
        filteredParams.supervisor_id = user.id;
      }
      
      // إضافة university_id إذا كان موجوداً (API يتوقع university_id)
      if (user?.university) {
        filteredParams.university_id = user.university;
      }
      
      const response = await api.get('/cases/', { params: filteredParams });
      // API يعيد array مباشرة أو object مع data property
      const casesData = response.data.data || response.data || [];
      console.log('Cases API Response:', { 
        raw: response.data, 
        processed: casesData,
        isArray: Array.isArray(casesData),
        length: Array.isArray(casesData) ? casesData.length : 0
      });
      return casesData;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchCaseById = createAsyncThunk(
  'cases/fetchCaseById',
  async (caseId, { rejectWithValue, getState }) => {
    try {
      const response = await api.get(`/cases/${caseId}/`);
      const caseData = response.data.data || response.data;
      
      // التحقق من أن الحالة تنتمي للمشرف والجامعة الصحيحة
      const state = getState();
      const user = state.auth.user;
      
      if (user?.id && user?.university) {
        const matchesSupervisor = caseData.supervisor?.id === user.id || 
                                 caseData.supervisor_id === user.id;
        const matchesUniversity = caseData.university_id === user.university;
        
        if (!matchesSupervisor || !matchesUniversity) {
          return rejectWithValue('ليس لديك صلاحية للوصول إلى هذه الحالة');
        }
      }
      
      return caseData;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createCase = createAsyncThunk(
  'cases/createCase',
  async (caseData, { rejectWithValue, getState }) => {
    try {
      // الحصول على بيانات المستخدم من state
      const state = getState();
      const user = state.auth.user;
      
      // إضافة supervisor_id و university_id تلقائياً
      const caseDataWithAuth = {
        ...caseData,
      };
      
      if (user?.id) {
        caseDataWithAuth.supervisor_id = user.id;
      }
      
      if (user?.university) {
        caseDataWithAuth.university_id = user.university;
      }
      
      const response = await api.post('/cases/', caseDataWithAuth);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateCase = createAsyncThunk(
  'cases/updateCase',
  async ({ caseId, data }, { rejectWithValue, getState }) => {
    try {
      // التحقق من الصلاحيات أولاً
      const state = getState();
      const user = state.auth.user;
      
      if (user?.id && user?.university) {
        // جلب الحالة للتحقق من الصلاحيات
        const caseResponse = await api.get(`/cases/${caseId}/`);
        const caseData = caseResponse.data.data || caseResponse.data;
        
        const matchesSupervisor = caseData.supervisor?.id === user.id || 
                                 caseData.supervisor_id === user.id;
        const matchesUniversity = caseData.university_id === user.university;
        
        if (!matchesSupervisor || !matchesUniversity) {
          return rejectWithValue('ليس لديك صلاحية لتحديث هذه الحالة');
        }
      }
      
      // تحديث الحالة
      const response = await api.patch(`/cases/${caseId}/`, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// تم حذف fetchAssignmentRequests - الـ endpoint غير موجود
export const fetchAssignmentRequests = createAsyncThunk(
  'cases/fetchAssignmentRequests',
  async (params = {}, { rejectWithValue }) => {
    return rejectWithValue('الـ endpoint غير متاح');
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

export const fetchCaseHistory = createAsyncThunk(
  'cases/fetchCaseHistory',
  async (caseId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/cases/${caseId}/history/`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  cases: [],
  currentCase: null,
  assignmentRequests: [],
  caseHistory: [],
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
        // التأكد من أن البيانات هي array
        state.cases = Array.isArray(action.payload) ? action.payload : [];
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
        state.assignmentRequests = [];
      })
      .addCase(fetchAssignmentRequests.rejected, (state) => {
        state.assignmentRequests = [];
      })
      // Respond to Assignment Request
      .addCase(respondToAssignmentRequest.fulfilled, (state, action) => {
        const index = state.assignmentRequests.findIndex(
          (r) => r.id === action.payload.id
        );
        if (index !== -1) {
          state.assignmentRequests[index] = action.payload;
        }
      })
      // Fetch Case History
      .addCase(fetchCaseHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCaseHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.caseHistory = action.payload;
      })
      .addCase(fetchCaseHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, clearCurrentCase, clearError } = casesSlice.actions;
export default casesSlice.reducer;










