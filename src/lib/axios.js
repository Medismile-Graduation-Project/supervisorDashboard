import axios from 'axios';

// إنشاء instance من axios مع الإعدادات الأساسية
const api = axios.create({
  // استخدم متغير البيئة أولاً، وإذا لم يكن موجوداً استخدم الـ base URL الجديد على Railway
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    'https://medismile1-production.up.railway.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor لإضافة Token تلقائياً
api.interceptors.request.use(
  (config) => {
    // الحصول على Token من localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    
    // إضافة Token إلى Header إذا كان موجوداً ولم يكن موجوداً بالفعل
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor للتعامل مع الأخطاء
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // إذا كان الخطأ 401 ولم يتم إعادة المحاولة بعد
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // تجنب إعادة المحاولة لطلبات تسجيل الدخول
      if (originalRequest.url?.includes('/login') || originalRequest.url?.includes('/token/refresh')) {
        return Promise.reject(error);
      }

      try {
        // محاولة تجديد Token
        const refreshToken = typeof window !== 'undefined' 
          ? localStorage.getItem('refresh_token') 
          : null;

        if (refreshToken) {
          const response = await axios.post(
            `${
              process.env.NEXT_PUBLIC_API_URL ||
              'https://medismile1-production.up.railway.app/api'
            }/accounts/auth/token/refresh/`,
            { refresh: refreshToken }
          );

          const { access } = response.data;
          
          if (access && typeof window !== 'undefined') {
            localStorage.setItem('access_token', access);
            
            // تحديث الـ header للطلب الأصلي
            originalRequest.headers.Authorization = `Bearer ${access}`;
            
            // إعادة المحاولة
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // إذا فشل تجديد Token، مسح البيانات وإعادة توجيه
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          
          // إعادة توجيه فقط إذا لم نكن في صفحة تسجيل الدخول
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshError);
      }
      
      // إذا لم يكن هناك refresh token، مسح البيانات
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;


















