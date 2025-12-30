'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { getCurrentUser, initializeAuth } from '@/store/slices/authSlice';
import DashboardLayout from '@/components/Layout/DashboardLayout';

// Layout مشترك لجميع صفحات الداشبورد
// هذا Layout يطبق DashboardLayout (Sidebar + Header) على جميع الصفحات الفرعية
export default function Layout({ children }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, initialized, loading } = useAppSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);

  // تجنب مشاكل Hydration - عرض نفس المحتوى على الخادم والعميل
  useEffect(() => {
    setMounted(true);
    // تهيئة المصادقة
    dispatch(initializeAuth());
  }, [dispatch]);

  useEffect(() => {
    // إذا تم التهيئة ولم يكن المستخدم مسجل دخول، إعادة توجيه للـ login
    if (mounted && initialized && !loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [mounted, initialized, isAuthenticated, loading, router]);

  useEffect(() => {
    // جلب بيانات المستخدم إذا كان مسجل دخول
    if (mounted && initialized && isAuthenticated) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, mounted, initialized, isAuthenticated]);

  // على الخادم، عرض نفس البنية (بدون محتوى حقيقي)
  if (!mounted) {
    return (
      <div className="flex h-screen overflow-hidden bg-light-gray">
        <div className="flex h-screen w-64 flex-col bg-dark border-l border-dark-light">
          <div className="flex h-16 items-center justify-center border-b border-dark-light px-4">
            <h1 className="text-xl font-bold text-light">MediSmile</h1>
          </div>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent"></div>
                <p className="mt-4 text-sm text-dark-lighter">جاري التحميل...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // عرض شاشة تحميل أثناء التحقق من المصادقة
  if (!initialized || loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-light-gray">
        <div className="flex h-screen w-64 flex-col bg-dark border-l border-dark-light">
          <div className="flex h-16 items-center justify-center border-b border-dark-light px-4">
            <h1 className="text-xl font-bold text-light">MediSmile</h1>
          </div>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent"></div>
                <p className="mt-4 text-sm text-dark-lighter">جاري التحميل...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // إذا لم يكن مسجل دخول، لا تعرض المحتوى (سيتم إعادة التوجيه)
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen overflow-hidden bg-light-gray">
        <div className="flex h-screen w-64 flex-col bg-dark border-l border-dark-light">
          <div className="flex h-16 items-center justify-center border-b border-dark-light px-4">
            <h1 className="text-xl font-bold text-light">MediSmile</h1>
          </div>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent"></div>
                <p className="mt-4 text-sm text-dark-lighter">جاري التحميل...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
