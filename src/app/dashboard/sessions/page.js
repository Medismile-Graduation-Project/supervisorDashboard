'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  fetchSessionsNeedingReview,
  reviewSession,
} from '@/store/slices/sessionsSlice';
import { fetchCases } from '@/store/slices/casesSlice';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import toast from 'react-hot-toast';

const statusLabels = {
  draft: 'مسودة',
  completed: 'مكتملة',
  needs_review: 'تحتاج مراجعة',
  approved: 'موافق عليها',
  rejected: 'مرفوضة',
};

const statusColors = {
  draft: 'bg-sky-50 text-sky-700',
  completed: 'bg-sky-100 text-sky-800',
  needs_review: 'bg-sky-200 text-sky-800',
  approved: 'bg-sky-500 text-white',
  rejected: 'bg-dark-lighter text-light',
};

export default function SessionsPage() {
  const dispatch = useAppDispatch();
  const { sessionsNeedingReview, loading } = useAppSelector(
    (state) => state.sessions
  );
  const { cases } = useAppSelector((state) => state.cases);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    status: '',
    case_id: '',
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionFeedback, setSessionFeedback] = useState('');
  const [reviewStatus, setReviewStatus] = useState('approved');

  useEffect(() => {
    dispatch(fetchSessionsNeedingReview());
    dispatch(fetchCases());
  }, [dispatch]);

  const filteredSessions = sessionsNeedingReview.filter((session) => {
    const matchesSearch =
      session.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.case?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.student?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.student?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !localFilters.status || session.status === localFilters.status;
    const matchesCase = !localFilters.case_id || session.case === localFilters.case_id;

    return matchesSearch && matchesStatus && matchesCase;
  });

  const handleReviewSession = async () => {
    if (!selectedSession) return;

    try {
      const result = await dispatch(
        reviewSession({
          sessionId: selectedSession.id,
          status: reviewStatus,
          supervisor_feedback: sessionFeedback,
        })
      );
      if (reviewSession.fulfilled.match(result)) {
        toast.success(
          reviewStatus === 'approved'
            ? 'تمت الموافقة على الجلسة'
            : 'تم رفض الجلسة'
        );
        setShowReviewModal(false);
        setSelectedSession(null);
        setSessionFeedback('');
        dispatch(fetchSessionsNeedingReview());
      } else {
        toast.error(result.payload?.message || 'فشل مراجعة الجلسة');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء مراجعة الجلسة');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
          مراجعة الجلسات
        </h1>
        <p className="text-sm sm:text-base text-dark-lighter leading-relaxed" style={{ fontFamily: 'inherit' }}>
          مراجعة وموافقة/رفض جلسات العلاج
        </p>
      </div>

      {/* Stats Card */}
      <div className="rounded-lg bg-white border border-sky-100 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-dark-lighter mb-2" style={{ fontFamily: 'inherit' }}>
              الجلسات التي تحتاج مراجعة
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-dark" style={{ fontFamily: 'inherit' }}>
              {sessionsNeedingReview.length}
            </p>
          </div>
          <div className="flex-shrink-0">
            <ClipboardDocumentCheckIcon className="h-8 w-8 text-sky-500" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-lg bg-white border border-sky-100 p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-dark-lighter" />
            </div>
            <input
              type="text"
              placeholder="بحث في الجلسات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 pr-10 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all"
              style={{ fontFamily: 'inherit' }}
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm font-medium text-dark hover:bg-sky-50 hover:border-sky-300 transition-all focus:outline-none focus:ring-2 focus:ring-sky-400/20"
            style={{ fontFamily: 'inherit' }}
          >
            <FunnelIcon className="h-5 w-5" />
            فلترة
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-5 grid grid-cols-1 gap-4 border-t border-sky-100 pt-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-dark mb-2.5" style={{ fontFamily: 'inherit' }}>
                الحالة
              </label>
              <select
                value={localFilters.status}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, status: e.target.value })
                }
                className="w-full rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all"
                style={{ fontFamily: 'inherit' }}
              >
                <option value="">جميع الحالات</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark mb-2.5" style={{ fontFamily: 'inherit' }}>
                الحالة السريرية
              </label>
              <select
                value={localFilters.case_id}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, case_id: e.target.value })
                }
                className="w-full rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all"
                style={{ fontFamily: 'inherit' }}
              >
                <option value="">جميع الحالات</option>
                {cases.map((caseItem) => (
                  <option key={caseItem.id} value={caseItem.id}>
                    {caseItem.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Sessions List */}
      <div className="rounded-lg bg-white border border-sky-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent"></div>
            <p className="mt-4 text-sm text-dark-lighter" style={{ fontFamily: 'inherit' }}>
              جاري تحميل الجلسات...
            </p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardDocumentCheckIcon className="mx-auto h-12 w-12 text-dark-lighter" />
            <p className="mt-4 text-base font-semibold text-dark" style={{ fontFamily: 'inherit' }}>
              لا توجد جلسات تحتاج مراجعة
            </p>
            <p className="mt-2 text-sm text-dark-lighter leading-relaxed" style={{ fontFamily: 'inherit' }}>
              {searchTerm || localFilters.status || localFilters.case_id
                ? 'لا توجد جلسات تطابق معايير البحث'
                : 'جميع الجلسات تمت مراجعتها'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-sky-100">
            {filteredSessions.map((session) => (
              <div key={session.id} className="p-5 sm:p-6 hover:bg-sky-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                      <Link
                        href={`/dashboard/cases/${session.case}`}
                        className="text-base sm:text-lg font-semibold text-dark hover:text-sky-600 transition-colors"
                        style={{ fontFamily: 'inherit' }}
                      >
                        {session.case_title || 'حالة سريرية'}
                      </Link>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                          statusColors[session.status] || statusColors.needs_review
                        }`}
                        style={{ fontFamily: 'inherit' }}
                      >
                        {statusLabels[session.status] || session.status}
                      </span>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm text-dark-lighter mb-2" style={{ fontFamily: 'inherit' }}>
                        الطالب:{' '}
                        <span className="font-medium text-dark">
                          {session.student?.first_name} {session.student?.last_name}
                        </span>
                      </p>
                      <p className="text-sm text-dark whitespace-pre-wrap line-clamp-3 leading-relaxed" style={{ fontFamily: 'inherit' }}>
                        {session.notes}
                      </p>
                    </div>
                    {session.supervisor_feedback && (
                      <div className="mt-4 p-3.5 rounded-lg bg-sky-50 border border-sky-200">
                        <p className="text-xs font-semibold text-sky-800 mb-1.5" style={{ fontFamily: 'inherit' }}>
                          ملاحظات المشرف السابقة:
                        </p>
                        <p className="text-sm text-sky-900 leading-relaxed" style={{ fontFamily: 'inherit' }}>
                          {session.supervisor_feedback}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-dark-lighter mt-4" style={{ fontFamily: 'inherit' }}>
                      {new Date(session.created_at).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setSelectedSession(session);
                        setReviewStatus('approved');
                        setShowReviewModal(true);
                      }}
                      className="flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                      style={{ fontFamily: 'inherit' }}
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      موافقة
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSession(session);
                        setReviewStatus('rejected');
                        setShowReviewModal(true);
                      }}
                      className="flex items-center justify-center gap-2 rounded-lg bg-dark-lighter px-4 py-2.5 text-sm font-semibold text-white hover:bg-dark transition-colors focus:outline-none focus:ring-2 focus:ring-dark-lighter/20"
                      style={{ fontFamily: 'inherit' }}
                    >
                      <XCircleIcon className="h-5 w-5" />
                      رفض
                    </button>
                    <Link
                      href={`/dashboard/cases/${session.case}`}
                      className="text-center rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm font-medium text-dark hover:bg-sky-50 hover:border-sky-300 transition-all focus:outline-none focus:ring-2 focus:ring-sky-400/20"
                      style={{ fontFamily: 'inherit' }}
                    >
                      عرض الحالة
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white border border-sky-100 shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-semibold text-dark mb-5" style={{ fontFamily: 'inherit' }}>
              {reviewStatus === 'approved' ? 'موافقة على الجلسة' : 'رفض الجلسة'}
            </h3>

            {/* Session Details */}
            <div className="mb-5 space-y-4">
              <div>
                <p className="text-sm font-semibold text-dark-lighter mb-1.5" style={{ fontFamily: 'inherit' }}>
                  الحالة:
                </p>
                <Link
                  href={`/dashboard/cases/${selectedSession.case}`}
                  className="text-sm font-semibold text-dark hover:text-sky-600 transition-colors"
                  style={{ fontFamily: 'inherit' }}
                >
                  {selectedSession.case_title || 'حالة سريرية'}
                </Link>
              </div>
              <div>
                <p className="text-sm font-semibold text-dark-lighter mb-1.5" style={{ fontFamily: 'inherit' }}>
                  الطالب:
                </p>
                <p className="text-sm text-dark" style={{ fontFamily: 'inherit' }}>
                  {selectedSession.student?.first_name} {selectedSession.student?.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-dark-lighter mb-1.5" style={{ fontFamily: 'inherit' }}>
                  ملاحظات الطالب:
                </p>
                <div className="p-3.5 rounded-lg bg-sky-50 border border-sky-200">
                  <p className="text-sm text-dark whitespace-pre-wrap leading-relaxed" style={{ fontFamily: 'inherit' }}>
                    {selectedSession.notes}
                  </p>
                </div>
              </div>
            </div>

            {/* Feedback */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-dark mb-2.5" style={{ fontFamily: 'inherit' }}>
                ملاحظات المشرف {reviewStatus === 'rejected' && <span className="text-sky-600">(مطلوب)</span>}
              </label>
              <textarea
                value={sessionFeedback}
                onChange={(e) => setSessionFeedback(e.target.value)}
                rows={5}
                required={reviewStatus === 'rejected'}
                className="w-full rounded-lg border border-sky-200 bg-white px-4 py-3 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all"
                style={{ fontFamily: 'inherit' }}
                placeholder={
                  reviewStatus === 'approved'
                    ? 'أضف ملاحظاتك على الجلسة (اختياري)...'
                    : 'يرجى توضيح سبب الرفض...'
                }
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleReviewSession}
                disabled={reviewStatus === 'rejected' && !sessionFeedback.trim()}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 ${
                  reviewStatus === 'approved'
                    ? 'bg-sky-500 hover:bg-sky-600 focus:ring-sky-500/20'
                    : 'bg-dark-lighter hover:bg-dark focus:ring-dark-lighter/20'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ fontFamily: 'inherit' }}
              >
                {reviewStatus === 'approved' ? (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    موافقة
                  </>
                ) : (
                  <>
                    <XCircleIcon className="h-5 w-5" />
                    رفض
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedSession(null);
                  setSessionFeedback('');
                }}
                className="flex-1 rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm font-medium text-dark hover:bg-sky-50 hover:border-sky-300 transition-all focus:outline-none focus:ring-2 focus:ring-sky-400/20"
                style={{ fontFamily: 'inherit' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}















