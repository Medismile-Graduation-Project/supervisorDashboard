import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

// Async Thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/accounts/login/supervisor/', { email, password });
      
      // البنية الفعلية للاستجابة: response.data.tokens و response.data.user
      const tokens = response.data.tokens || response.data.data?.tokens;
      const user = response.data.user || response.data.data?.user;
      
      // حفظ Tokens في localStorage
      if (typeof window !== 'undefined') {
        if (tokens?.access) {
          localStorage.setItem('access_token', tokens.access);
        }
        if (tokens?.refresh) {
          localStorage.setItem('refresh_token', tokens.refresh);
        }
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
      }
      
      // إرجاع البيانات بالبنية المتوقعة
      return {
        tokens: tokens || {},
        user: user || {},
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = typeof window !== 'undefined' 
        ? localStorage.getItem('refresh_token') 
        : null;
      
      if (refreshToken) {
        await api.post('/accounts/logout/supervisor/', { refresh: refreshToken });
      }
      
      // حذف Tokens من localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
      
      return null;
    } catch (error) {
      // حتى لو فشل الطلب، نمسح البيانات المحلية
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      // جلب بيانات المشرف الكاملة من API
      const response = await api.get('/accounts/me/supervisor/');
      const userData = response.data.data || response.data;
      
      // حفظ في localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
      return userData;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      // تحديث بيانات المشرف في API
      const response = await api.patch('/accounts/me/supervisor/', profileData);
      const userData = response.data.data || response.data;
      
      // تحديث localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
      return userData;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// تجنب استخدام localStorage في initialState لتجنب Hydration Error
const getInitialState = () => {
  if (typeof window === 'undefined') {
    return {
      user: null,
      tokens: { access: null, refresh: null },
      isAuthenticated: false,
      loading: false,
      error: null,
      initialized: false,
    };
  }

  try {
    const userStr = localStorage.getItem('user');
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    return {
      user: userStr ? JSON.parse(userStr) : null,
      tokens: {
        access: accessToken,
        refresh: refreshToken,
      },
      isAuthenticated: !!accessToken,
      loading: false,
      error: null,
      initialized: true,
    };
  } catch (error) {
    return {
      user: null,
      tokens: { access: null, refresh: null },
      isAuthenticated: false,
      loading: false,
      error: null,
      initialized: true,
    };
  }
};

const initialState = getInitialState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    initializeAuth: (state) => {
      if (typeof window !== 'undefined' && !state.initialized) {
        try {
          const userStr = localStorage.getItem('user');
          const accessToken = localStorage.getItem('access_token');
          const refreshToken = localStorage.getItem('refresh_token');

          state.user = userStr ? JSON.parse(userStr) : null;
          state.tokens = {
            access: accessToken,
            refresh: refreshToken,
          };
          state.isAuthenticated = !!accessToken;
          state.initialized = true;
        } catch (error) {
          state.initialized = true;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.tokens = { access: null, refresh: null };
        state.isAuthenticated = false;
        state.error = null;
      })
      // Get Current User
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setUser, initializeAuth } = authSlice.actions;
export default authSlice.reducer;

