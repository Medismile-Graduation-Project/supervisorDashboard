'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { createSupportTicket, clearError, clearSuccess } from '@/store/slices/supportSlice';
import {
  LifebuoyIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function SupportPage() {
  const dispatch = useAppDispatch();
  const { loading, error, success, ticketId } = useAppSelector((state) => state.support);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
  });

  useEffect(() => {
    // مسح الأخطاء والنجاح عند تحميل الصفحة
    dispatch(clearError());
    dispatch(clearSuccess());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      toast.success('تم إرسال تذكرة الدعم بنجاح');
      // مسح النموذج بعد النجاح
      setFormData({
        subject: '',
        description: '',
      });
      // مسح حالة النجاح بعد 3 ثوان
      setTimeout(() => {
        dispatch(clearSuccess());
      }, 3000);
    }
  }, [success, dispatch]);

  useEffect(() => {
    if (error) {
      const errorMessage = error?.detail || 
                          error?.message || 
                          error?.error || 
                          'حدث خطأ أثناء إرسال تذكرة الدعم';
      toast.error(errorMessage);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // التحقق من الحقول المطلوبة
    if (!formData.subject.trim()) {
      toast.error('الرجاء إدخال عنوان المشكلة');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('الرجاء إدخال وصف المشكلة');
      return;
    }

    try {
      const result = await dispatch(createSupportTicket(formData));
      if (createSupportTicket.fulfilled.match(result)) {
        // سيتم التعامل مع النجاح في useEffect
      }
    } catch (error) {
      // سيتم التعامل مع الخطأ في useEffect
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg border border-sky-100 shadow-sm p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-sky-50">
            <LifebuoyIcon className="h-6 w-6 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark" style={{ fontFamily: 'inherit' }}>
              الدعم الفني
            </h1>
            <p className="text-sm text-dark-lighter mt-1" style={{ fontFamily: 'inherit' }}>
              أرسل مشكلتك أو استفسارك وسنقوم بالرد عليك في أقرب وقت ممكن
            </p>
          </div>
        </div>
      </div>

      {/* Support Form */}
      <div className="bg-white rounded-lg border border-sky-100 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subject Field */}
          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-semibold text-dark mb-2"
              style={{ fontFamily: 'inherit' }}
            >
              عنوان المشكلة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="مثال: مشكلة في تسجيل الدخول"
              className="w-full rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm text-dark placeholder-dark-lighter focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-0 transition-colors"
              style={{ fontFamily: 'inherit' }}
              disabled={loading}
            />
          </div>

          {/* Description Field */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-dark mb-2"
              style={{ fontFamily: 'inherit' }}
            >
              وصف المشكلة <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={8}
              placeholder="يرجى وصف المشكلة بالتفصيل..."
              className="w-full rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm text-dark placeholder-dark-lighter focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-0 transition-colors resize-none"
              style={{ fontFamily: 'inherit' }}
              disabled={loading}
            />
          </div>

          {/* Success Message */}
          {success && (
            <div className="rounded-lg bg-sky-50 border border-sky-200 p-4 flex items-start gap-3">
              <CheckCircleIcon className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-sky-900" style={{ fontFamily: 'inherit' }}>
                  تم إرسال تذكرة الدعم بنجاح
                </p>
                {ticketId && (
                  <p className="text-xs text-sky-700 mt-1" style={{ fontFamily: 'inherit' }}>
                    رقم التذكرة: {ticketId}
                  </p>
                )}
                <p className="text-xs text-sky-700 mt-1" style={{ fontFamily: 'inherit' }}>
                  سيتم الرد عليك في أقرب وقت ممكن
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !success && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
              <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900" style={{ fontFamily: 'inherit' }}>
                  حدث خطأ أثناء إرسال التذكرة
                </p>
                <p className="text-xs text-red-700 mt-1" style={{ fontFamily: 'inherit' }}>
                  {error?.detail || error?.message || error?.error || 'يرجى المحاولة مرة أخرى'}
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-sky-100">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ fontFamily: 'inherit' }}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4" />
                  <span>إرسال تذكرة الدعم</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Help Information */}
      <div className="bg-sky-50 rounded-lg border border-sky-100 p-6">
        <h2 className="text-lg font-bold text-dark mb-3" style={{ fontFamily: 'inherit' }}>
          نصائح لإرسال تذكرة دعم فعالة
        </h2>
        <ul className="space-y-2 text-sm text-dark-lighter" style={{ fontFamily: 'inherit' }}>
          <li className="flex items-start gap-2">
            <span className="text-sky-600 mt-1">•</span>
            <span>اذكر عنواناً واضحاً ومختصراً للمشكلة</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sky-600 mt-1">•</span>
            <span>وصف المشكلة بالتفصيل مع ذكر الخطوات التي قمت بها</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sky-600 mt-1">•</span>
            <span>اذكر أي رسائل خطأ ظهرت لك إن وجدت</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sky-600 mt-1">•</span>
            <span>اذكر متى بدأت المشكلة وما هي التغييرات التي قمت بها</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

