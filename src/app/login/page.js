'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { login, clearError, initializeAuth, updateLockoutRemaining } from '@/store/slices/authSlice';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, isAuthenticated, initialized, lockoutRemaining } = useAppSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // تجنب مشاكل Hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // تهيئة المصادقة
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // إعادة توجيه إذا كان المستخدم مسجل دخول بالفعل
  useEffect(() => {
    if (initialized && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [initialized, isAuthenticated, router]);

  // مسح الأخطاء عند تغيير القيم
  useEffect(() => {
    if (error) {
      dispatch(clearError());
    }
  }, [formData, dispatch]);

  // تحديث عداد الحظر كل ثانية
  useEffect(() => {
    if (lockoutRemaining !== null && lockoutRemaining > 0) {
      const interval = setInterval(() => {
        dispatch(updateLockoutRemaining());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutRemaining, dispatch]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'البريد الإلكتروني غير صحيح';
    }
    
    if (!formData.password) {
      errors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 6) {
      errors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // منع الإرسال إذا كان الحساب محظوراً
    if (lockoutRemaining !== null && lockoutRemaining > 0) {
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    try {
      // إرسال email و password إلى API
      const result = await dispatch(login({ email: formData.email, password: formData.password }));
      
      if (login.fulfilled.match(result)) {
        toast.success('تم تسجيل الدخول بنجاح', {
          icon: '✅',
          duration: 2000,
        });
        // التوجيه إلى الصفحة الرئيسية للداشبورد
        router.replace('/dashboard');
      } else if (login.rejected.match(result)) {
        // معالجة الأخطاء من API
        const errorPayload = result.payload;
        let errorMessage = 'فشل تسجيل الدخول. يرجى التحقق من البيانات';
        
        // معالجة البنية الجديدة للأخطاء
        if (errorPayload?.message) {
          errorMessage = errorPayload.message;
        } else if (errorPayload?.detail) {
          errorMessage = errorPayload.detail;
        } else if (errorPayload?.error) {
          errorMessage = typeof errorPayload.error === 'string' 
            ? errorPayload.error 
            : errorPayload.error?.message || errorMessage;
        } else if (typeof errorPayload === 'string') {
          errorMessage = errorPayload;
        }
        
        toast.error(errorMessage, {
          duration: 4000,
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error('حدث خطأ أثناء تسجيل الدخول', {
        duration: 4000,
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-100 p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl bg-white shadow-sm">
          {/* Header */}
          <div className="px-8 py-10 text-center">
            <div className="flex flex-col items-center">
              {/* Logo */}
              <div className="mb-5">
                <div className="w-20 h-20 rounded-full border-2 border-sky-200 bg-white flex items-center justify-center overflow-hidden">
                  <Image
                    src="/Screenshot_٢٠٢٥٠٩٠٨-١٢٣٢٥٥.jpg"
                    alt="MediSmile Logo"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>
              {/* Brand name */}
              <h1 className="text-lg font-bold text-dark mb-6" style={{ fontFamily: 'inherit' }}>MediSmile</h1>
              {/* Welcome heading */}
              <h2 className="text-3xl font-bold text-dark mb-3" style={{ fontFamily: 'inherit' }}>أهلاً بك</h2>
              {/* Subtitle */}
              <p className="text-sky-500 text-sm mb-6" style={{ fontFamily: 'inherit' }}>الوصول إلى رعاية الأسنان التقنية والتعليم</p>
              
              {/* Error Message */}
              {error && (
                <div className="mb-6 w-full">
                  <p className="text-sm text-red-600 text-center" style={{ fontFamily: 'inherit' }}>
                    {error.message || error.error || error.detail || 'حدث خطأ أثناء تسجيل الدخول'}
                  </p>
                </div>
              )}
              
              {/* Lockout Message */}
              {(lockoutRemaining !== null && lockoutRemaining > 0) && (
                <div className="mb-6 w-full">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700 text-center font-semibold mb-2" style={{ fontFamily: 'inherit' }}>
                      تم الحظر بسبب 5 محاولات فاشلة
                    </p>
                    <p className="text-sm text-red-600 text-center" style={{ fontFamily: 'inherit' }}>
                      يرجى المحاولة مرة أخرى بعد {lockoutRemaining} ثانية
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="px-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (formErrors.email) {
                      setFormErrors({ ...formErrors, email: '' });
                    }
                  }}
                  className={`w-full rounded-lg border-0 ${
                    formErrors.email
                      ? 'bg-red-50 text-red-900'
                      : 'bg-sky-100 text-dark'
                  } px-4 py-3.5 pr-12 text-base placeholder-dark-lighter/50 focus:outline-none focus:ring-2 focus:ring-sky-400`}
                  style={{ fontFamily: 'inherit' }}
                  placeholder="البريد الإلكتروني"
                  disabled={loading || (lockoutRemaining !== null && lockoutRemaining > 0)}
                  suppressHydrationWarning
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg
                    className="h-5 w-5 text-dark-lighter"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              {formErrors.email && (
                <p className="text-sm text-red-600 -mt-3" style={{ fontFamily: 'inherit' }}>{formErrors.email}</p>
              )}

              {/* Password Field */}
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (formErrors.password) {
                      setFormErrors({ ...formErrors, password: '' });
                    }
                  }}
                  className={`w-full rounded-lg border-0 ${
                    formErrors.password
                      ? 'bg-red-50 text-red-900'
                      : 'bg-sky-100 text-dark'
                  } px-4 py-3.5 pr-12 text-base placeholder-dark-lighter/50 focus:outline-none focus:ring-2 focus:ring-sky-400`}
                  style={{ fontFamily: 'inherit' }}
                  placeholder="كلمة المرور"
                  disabled={loading || (lockoutRemaining !== null && lockoutRemaining > 0)}
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-dark-lighter hover:text-dark transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-sm text-red-600 -mt-3" style={{ fontFamily: 'inherit' }}>{formErrors.password}</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || (lockoutRemaining !== null && lockoutRemaining > 0)}
                className="w-full rounded-lg bg-sky-400 px-4 py-3.5 text-base font-semibold text-white hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
                style={{ fontFamily: 'inherit' }}
                suppressHydrationWarning
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>جاري تسجيل الدخول...</span>
                  </span>
                ) : (
                  'تسجيل الدخول'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
