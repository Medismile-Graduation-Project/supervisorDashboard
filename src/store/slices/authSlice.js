import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

// Async Thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/accounts/auth/login/', { email, password });
      
      // حفظ Tokens في localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', response.data.data.tokens.access);
        localStorage.setItem('refresh_token', response.data.data.tokens.refresh);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      
      return response.data.data;
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
        await api.post('/accounts/auth/logout/', { refresh: refreshToken });
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
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (userStr) {
        return JSON.parse(userStr);
      }
      
      // إذا لم يكن هناك user محفوظ، جلب من API
      const response = await api.get('/accounts/auth/me/');
      return response.data.data;
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
      });
  },
});

export const { clearError, setUser, initializeAuth } = authSlice.actions;
export default authSlice.reducer;

