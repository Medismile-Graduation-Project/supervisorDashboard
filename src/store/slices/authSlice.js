import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

// Helper function to check lockout status
const checkLockout = () => {
  if (typeof window === 'undefined') return null;
  const lockoutUntil = localStorage.getItem('login_lockout_until');
  if (!lockoutUntil) return null;
  const lockoutTime = parseInt(lockoutUntil, 10);
  const now = Date.now();
  if (now < lockoutTime) {
    return lockoutTime - now; // Return remaining milliseconds
  }
  // Lockout expired, clear it
  localStorage.removeItem('login_lockout_until');
  localStorage.removeItem('login_failed_attempts');
  return null;
};

// Async Thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    // التحقق من حالة الحظر قبل محاولة تسجيل الدخول
    const lockoutRemaining = checkLockout();
    if (lockoutRemaining !== null) {
      const secondsRemaining = Math.ceil(lockoutRemaining / 1000);
      return rejectWithValue({
        message: `تم الحظر بسبب محاولات تسجيل الدخول الفاشلة. يرجى المحاولة مرة أخرى بعد ${secondsRemaining} ثانية`,
        error: 'Account locked',
        isLocked: true,
        lockoutRemaining: secondsRemaining,
      });
    }

    try {
      // 1. تسجيل الدخول والحصول على Tokens
      const response = await api.post('/accounts/login/supervisor/', { email, password });
      
      // استخراج Tokens من الاستجابة
      const tokens = response.data.tokens || response.data.data?.tokens || response.data;
      
      // التحقق من وجود Tokens
      if (!tokens?.access) {
        return rejectWithValue({
          message: 'لم يتم استلام Token من الخادم',
          error: 'Missing access token',
        });
      }
      
      // حفظ Tokens في localStorage فوراً
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', tokens.access);
        if (tokens.refresh) {
          localStorage.setItem('refresh_token', tokens.refresh);
        }
      }
      
      // 2. جلب بيانات المستخدم الكاملة (بما فيها id و university) من API
      // التأكد من إضافة Token في الـ header يدوياً للطلب الأول
      try {
        const userResponse = await api.get('/accounts/me/supervisor/', {
          headers: {
            Authorization: `Bearer ${tokens.access}`,
          },
        });
        const userData = userResponse.data.data || userResponse.data;
        
        // التحقق من وجود بيانات المستخدم الأساسية
        if (!userData?.id || !userData?.university) {
          console.warn('تحذير: بيانات المستخدم غير مكتملة', userData);
        }
        
        // حفظ بيانات المستخدم الكاملة في localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(userData));
          // إعادة تعيين محاولات تسجيل الدخول الفاشلة عند نجاح تسجيل الدخول
          localStorage.removeItem('login_failed_attempts');
          localStorage.removeItem('login_lockout_until');
        }
        
        // إرجاع البيانات الكاملة من API
        return {
          tokens: {
            access: tokens.access,
            refresh: tokens.refresh || null,
          },
          user: userData,
        };
      } catch (userError) {
        // إذا فشل جلب بيانات المستخدم، نمسح Tokens ونعيد الخطأ
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
        return rejectWithValue({
          message: 'فشل جلب بيانات المستخدم',
          error: userError.response?.data || userError.message,
        });
      }
    } catch (error) {
      // معالجة أخطاء تسجيل الدخول
      const errorMessage = error.response?.data || error.message;
      
      // تتبع المحاولات الفاشلة
      if (typeof window !== 'undefined') {
        const failedAttempts = parseInt(localStorage.getItem('login_failed_attempts') || '0', 10);
        const newFailedAttempts = failedAttempts + 1;
        
        if (newFailedAttempts >= 5) {
          // تفعيل الحظر لمدة 60 ثانية
          const lockoutUntil = Date.now() + 60000; // 60 seconds
          localStorage.setItem('login_lockout_until', lockoutUntil.toString());
          localStorage.setItem('login_failed_attempts', '0'); // Reset for next lockout cycle
          
          return rejectWithValue({
            message: 'تم الحظر بسبب 5 محاولات فاشلة. يرجى المحاولة مرة أخرى بعد 60 ثانية',
            error: errorMessage,
            isLocked: true,
            lockoutRemaining: 60,
          });
        } else {
          localStorage.setItem('login_failed_attempts', newFailedAttempts.toString());
        }
      }
      
      return rejectWithValue({
        message: errorMessage?.detail || 
                errorMessage?.message || 
                errorMessage?.error || 
                'فشل تسجيل الدخول. يرجى التحقق من البيانات',
        error: errorMessage,
      });
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
      
      // محاولة تسجيل الخروج من API (حتى لو فشل، نكمل)
      if (refreshToken) {
        try {
          await api.post('/accounts/logout/supervisor/', { refresh: refreshToken });
        } catch (logoutError) {
          // تجاهل أخطاء logout (404 أو غيرها) - نكمل بمسح البيانات المحلية
          console.warn('تحذير: فشل تسجيل الخروج من API', logoutError.response?.status);
        }
      }
      
      // حذف Tokens من localStorage دائماً
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
      // لا نعيد خطأ - نكمل بمسح البيانات المحلية
      return null;
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
      lockoutRemaining: null,
    };
  }

  try {
    const userStr = localStorage.getItem('user');
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    // التحقق من حالة الحظر
    const lockoutRemaining = checkLockout();
    const lockoutSeconds = lockoutRemaining !== null ? Math.ceil(lockoutRemaining / 1000) : null;

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
      lockoutRemaining: lockoutSeconds,
    };
  } catch (error) {
    return {
      user: null,
      tokens: { access: null, refresh: null },
      isAuthenticated: false,
      loading: false,
      error: null,
      initialized: true,
      lockoutRemaining: null,
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
          
          // التحقق من حالة الحظر
          const lockoutRemaining = checkLockout();
          state.lockoutRemaining = lockoutRemaining !== null ? Math.ceil(lockoutRemaining / 1000) : null;

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
    updateLockoutRemaining: (state) => {
      const lockoutRemaining = checkLockout();
      state.lockoutRemaining = lockoutRemaining !== null ? Math.ceil(lockoutRemaining / 1000) : null;
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
        state.lockoutRemaining = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        if (action.payload?.isLocked) {
          state.lockoutRemaining = action.payload.lockoutRemaining || null;
        }
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

export const { clearError, setUser, initializeAuth, updateLockoutRemaining } = authSlice.actions;
export default authSlice.reducer;

