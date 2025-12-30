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
  draft: 'bg-gray-100 text-gray-800',
  completed: 'bg-blue-100 text-blue-800',
  needs_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
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
      <div>
        <h1 className="text-2xl font-bold text-dark">مراجعة الجلسات</h1>
        <p className="mt-1 text-sm text-dark-lighter">
          مراجعة وموافقة/رفض جلسات العلاج
        </p>
      </div>

      {/* Stats Card */}
      <div className="rounded-lg bg-light border border-light-gray p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-dark-lighter">
              الجلسات التي تحتاج مراجعة
            </p>
            <p className="mt-1 text-2xl font-bold text-dark">
              {sessionsNeedingReview.length}
            </p>
          </div>
          <ClipboardDocumentCheckIcon className="h-8 w-8 text-orange-500" />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-lg bg-light border border-light-gray p-4">
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
              className="block w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 pr-10 text-sm text-dark placeholder-dark-lighter focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm font-medium text-dark hover:bg-light-gray transition-colors"
          >
            <FunnelIcon className="h-5 w-5" />
            فلترة
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-light-gray pt-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-dark mb-2">الحالة</label>
              <select
                value={localFilters.status}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, status: e.target.value })
                }
                className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
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
              <label className="block text-sm font-medium text-dark mb-2">الحالة السريرية</label>
              <select
                value={localFilters.case_id}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, case_id: e.target.value })
                }
                className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
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
      <div className="rounded-lg bg-light border border-light-gray overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent"></div>
            <p className="mt-4 text-sm text-dark-lighter">جاري تحميل الجلسات...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-8 text-center">
            <ClipboardDocumentCheckIcon className="mx-auto h-12 w-12 text-dark-lighter" />
            <p className="mt-4 text-sm font-medium text-dark">لا توجد جلسات تحتاج مراجعة</p>
            <p className="mt-1 text-sm text-dark-lighter">
              {searchTerm || localFilters.status || localFilters.case_id
                ? 'لا توجد جلسات تطابق معايير البحث'
                : 'جميع الجلسات تمت مراجعتها'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-light-gray">
            {filteredSessions.map((session) => (
              <div key={session.id} className="p-6 hover:bg-light-gray transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        href={`/dashboard/cases/${session.case}`}
                        className="text-lg font-semibold text-dark hover:text-sky-600 transition-colors"
                      >
                        {session.case_title || 'حالة سريرية'}
                      </Link>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusColors[session.status] || statusColors.needs_review
                        }`}
                      >
                        {statusLabels[session.status] || session.status}
                      </span>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-dark-lighter mb-1">
                        الطالب: {session.student?.first_name} {session.student?.last_name}
                      </p>
                      <p className="text-sm text-dark whitespace-pre-wrap line-clamp-3">
                        {session.notes}
                      </p>
                    </div>
                    {session.supervisor_feedback && (
                      <div className="mt-3 p-3 rounded-lg bg-sky-50 border border-sky-100">
                        <p className="text-xs font-medium text-sky-800 mb-1">
                          ملاحظات المشرف السابقة:
                        </p>
                        <p className="text-sm text-sky-900">{session.supervisor_feedback}</p>
                      </div>
                    )}
                    <p className="text-xs text-dark-lighter mt-3">
                      {new Date(session.created_at).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setSelectedSession(session);
                        setReviewStatus('approved');
                        setShowReviewModal(true);
                      }}
                      className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
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
                      className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                    >
                      <XCircleIcon className="h-5 w-5" />
                      رفض
                    </button>
                    <Link
                      href={`/dashboard/cases/${session.case}`}
                      className="text-center rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm font-medium text-dark hover:bg-light-gray transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-light p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-dark mb-4">
              {reviewStatus === 'approved' ? 'موافقة على الجلسة' : 'رفض الجلسة'}
            </h3>

            {/* Session Details */}
            <div className="mb-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-dark-lighter mb-1">الحالة:</p>
                <Link
                  href={`/dashboard/cases/${selectedSession.case}`}
                  className="text-sm font-semibold text-dark hover:text-sky-600"
                >
                  {selectedSession.case_title || 'حالة سريرية'}
                </Link>
              </div>
              <div>
                <p className="text-sm font-medium text-dark-lighter mb-1">الطالب:</p>
                <p className="text-sm text-dark">
                  {selectedSession.student?.first_name} {selectedSession.student?.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-dark-lighter mb-1">ملاحظات الطالب:</p>
                <div className="p-3 rounded-lg bg-light-gray">
                  <p className="text-sm text-dark whitespace-pre-wrap">
                    {selectedSession.notes}
                  </p>
                </div>
              </div>
            </div>

            {/* Feedback */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-dark mb-2">
                ملاحظات المشرف {reviewStatus === 'rejected' && '(مطلوب)'}
              </label>
              <textarea
                value={sessionFeedback}
                onChange={(e) => setSessionFeedback(e.target.value)}
                rows={5}
                required={reviewStatus === 'rejected'}
                className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
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
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
                  reviewStatus === 'approved'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
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
                className="flex-1 rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm font-medium text-dark hover:bg-light-gray transition-colors"
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










