'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  fetchCaseById,
  updateCase,
  fetchAssignmentRequests,
  respondToAssignmentRequest,
  fetchCaseHistory,
} from '@/store/slices/casesSlice';
import { fetchSessions, reviewSession, fetchSessionById } from '@/store/slices/sessionsSlice';
import {
  ArrowRightIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const statusLabels = {
  new: 'جديدة',
  pending_assignment: 'في انتظار الإسناد',
  assigned: 'مسندة',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتملة',
  closed: 'مغلقة',
};

const priorityLabels = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  urgent: 'عاجلة',
};

const priorityColors = {
  low: 'bg-sky-50 text-sky-700',
  medium: 'bg-sky-100 text-sky-800',
  high: 'bg-sky-300 text-sky-900',
  urgent: 'bg-sky-500 text-white',
};

const statusColors = {
  new: 'bg-sky-50 text-sky-700',
  pending_assignment: 'bg-sky-100 text-sky-800',
  assigned: 'bg-sky-200 text-sky-800',
  in_progress: 'bg-sky-400 text-white',
  completed: 'bg-sky-500 text-white',
  closed: 'bg-dark-lighter text-light',
};

export default function CaseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentCase, loading, caseHistory } = useAppSelector((state) => state.cases);
  const { sessions, currentSession } = useAppSelector((state) => state.sessions);
  const { assignmentRequests } = useAppSelector((state) => state.cases);

  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: '',
    is_public: false,
    status: '',
  });
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [assignmentResponse, setAssignmentResponse] = useState('');
  const [assignmentAction, setAssignmentAction] = useState('accepted'); // 'accepted' or 'rejected'
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionFeedback, setSessionFeedback] = useState('');

  useEffect(() => {
    if (params.id) {
      dispatch(fetchCaseById(params.id));
      dispatch(fetchSessions({ caseId: params.id }));
      dispatch(fetchAssignmentRequests({ case: params.id }));
      dispatch(fetchCaseHistory(params.id));
    }
  }, [params.id, dispatch]);

  useEffect(() => {
    if (currentCase) {
      setEditForm({
        title: currentCase.title || '',
        description: currentCase.description || '',
        priority: currentCase.priority || '',
        is_public: currentCase.is_public || false,
        status: currentCase.status || '',
      });
    }
  }, [currentCase]);

  const handleUpdateCase = async () => {
    try {
      const result = await dispatch(
        updateCase({ caseId: params.id, data: editForm })
      );
      if (updateCase.fulfilled.match(result)) {
        toast.success('تم تحديث الحالة بنجاح');
        setIsEditing(false);
        dispatch(fetchCaseById(params.id));
      } else {
        toast.error(result.payload?.message || 'فشل تحديث الحالة');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الحالة');
    }
  };

  const handleRespondToAssignment = async (requestId, status) => {
    try {
      const result = await dispatch(
        respondToAssignmentRequest({
          requestId,
          status,
          supervisor_response: assignmentResponse,
        })
      );
      if (respondToAssignmentRequest.fulfilled.match(result)) {
        toast.success(
          status === 'accepted' ? 'تم قبول طلب الإسناد' : 'تم رفض طلب الإسناد'
        );
        setShowAssignmentModal(false);
        setSelectedRequest(null);
        setAssignmentResponse('');
        dispatch(fetchCaseById(params.id));
        dispatch(fetchAssignmentRequests({ case: params.id }));
      } else {
        toast.error(result.payload?.message || 'فشل معالجة الطلب');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء معالجة الطلب');
    }
  };

  const handleReviewSession = async (sessionId, status) => {
    try {
      const result = await dispatch(
        reviewSession({
          sessionId,
          status,
          supervisor_feedback: sessionFeedback,
        })
      );
      if (reviewSession.fulfilled.match(result)) {
        toast.success(
          status === 'approved' ? 'تمت الموافقة على الجلسة' : 'تم رفض الجلسة'
        );
        setShowSessionModal(false);
        setSelectedSession(null);
        setSessionFeedback('');
        dispatch(fetchCaseById(params.id));
        dispatch(fetchSessions({ caseId: params.id }));
      } else {
        toast.error(result.payload?.message || 'فشل مراجعة الجلسة');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء مراجعة الجلسة');
    }
  };

  const getNextStatus = (currentStatus) => {
    const transitions = {
      new: 'pending_assignment',
      pending_assignment: 'assigned',
      assigned: 'in_progress',
      in_progress: 'completed',
      completed: 'closed',
    };
    return transitions[currentStatus];
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const result = await dispatch(
        updateCase({ caseId: params.id, data: { status: newStatus } })
      );
      if (updateCase.fulfilled.match(result)) {
        toast.success('تم تغيير حالة الحالة بنجاح');
        dispatch(fetchCaseById(params.id));
      } else {
        toast.error(result.payload?.message || 'فشل تغيير الحالة');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تغيير الحالة');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent"></div>
          <p className="mt-4 text-sm font-semibold text-dark-lighter leading-relaxed" style={{ fontFamily: 'inherit' }}>
            جاري تحميل الحالة...
          </p>
        </div>
      </div>
    );
  }

  if (!currentCase) {
    return (
      <div className="text-center py-12">
        <p className="text-base font-semibold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
          الحالة غير موجودة
        </p>
        <button
          onClick={() => router.push('/dashboard/cases')}
          className="mt-4 rounded-lg bg-sky-400 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 transition-colors"
          style={{ fontFamily: 'inherit' }}
        >
          العودة إلى قائمة الحالات
        </button>
      </div>
    );
  }

  const pendingRequests = Array.isArray(assignmentRequests) 
    ? assignmentRequests.filter((r) => r.status === 'pending' && r.case === params.id)
    : [];
  
  const sessionsNeedingReview = Array.isArray(sessions)
    ? sessions.filter((s) => s.status === 'completed' || s.status === 'needs_review')
    : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/cases')}
              className="flex items-center justify-center h-10 w-10 rounded-lg border border-sky-200 bg-white text-dark-lighter hover:text-dark hover:bg-sky-50 hover:border-sky-300 transition-all focus:outline-none focus:ring-2 focus:ring-sky-400/20"
            >
              <ArrowRightIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
                {isEditing ? 'تعديل الحالة' : currentCase.title}
              </h1>
              <p className="text-sm sm:text-base text-dark-lighter leading-relaxed" style={{ fontFamily: 'inherit' }}>
                {currentCase.patient?.first_name} {currentCase.patient?.last_name}
              </p>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 rounded-lg bg-sky-400 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 transition-colors"
              style={{ fontFamily: 'inherit' }}
            >
              <PencilIcon className="h-5 w-5" />
              تعديل
            </button>
          )}
        </div>
      </div>

      {/* Status and Priority Badges */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
            statusColors[currentCase.status] || statusColors.new
          }`}
          style={{ fontFamily: 'inherit' }}
        >
          {statusLabels[currentCase.status] || currentCase.status}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
            priorityColors[currentCase.priority] || priorityColors.medium
          }`}
          style={{ fontFamily: 'inherit' }}
        >
          {priorityLabels[currentCase.priority] || currentCase.priority}
        </span>
        {currentCase.is_public && (
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 whitespace-nowrap" style={{ fontFamily: 'inherit' }}>
            عامة
          </span>
        )}
        {pendingRequests.length > 0 && (
          <span className="rounded-full bg-sky-200 px-3 py-1 text-xs font-semibold text-sky-800 whitespace-nowrap" style={{ fontFamily: 'inherit' }}>
            {pendingRequests.length} طلب إسناد
          </span>
        )}
        {sessionsNeedingReview.length > 0 && (
          <span className="rounded-full bg-sky-300 px-3 py-1 text-xs font-semibold text-sky-900 whitespace-nowrap" style={{ fontFamily: 'inherit' }}>
            {sessionsNeedingReview.length} جلسة تحتاج مراجعة
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-sky-100">
        <nav className="flex gap-6 overflow-x-auto">
          {[
            { id: 'details', label: 'التفاصيل' },
            { id: 'assignments', label: 'طلبات الإسناد', badge: pendingRequests.length },
            { id: 'sessions', label: 'الجلسات', badge: sessionsNeedingReview.length },
            { id: 'history', label: 'السجل' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-b-2 border-sky-500 text-sky-600'
                  : 'text-dark-lighter hover:text-dark'
              }`}
              style={{ fontFamily: 'inherit' }}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'details' && (
          <div className="space-y-6">
            {isEditing ? (
              <div className="rounded-lg bg-white border border-sky-100 p-5 sm:p-6 shadow-sm space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2.5" style={{ fontFamily: 'inherit' }}>
                    العنوان
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    className="w-full rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/50 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all"
                    style={{ fontFamily: 'inherit' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2.5" style={{ fontFamily: 'inherit' }}>
                    الوصف
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    rows={6}
                    className="w-full rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/50 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all resize-none"
                    style={{ fontFamily: 'inherit' }}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-dark mb-2.5" style={{ fontFamily: 'inherit' }}>
                      الأولوية
                    </label>
                    <select
                      value={editForm.priority}
                      onChange={(e) =>
                        setEditForm({ ...editForm, priority: e.target.value })
                      }
                      className="w-full rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all"
                      style={{ fontFamily: 'inherit' }}
                    >
                      {Object.entries(priorityLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark mb-2.5" style={{ fontFamily: 'inherit' }}>
                      حالة الحالة
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) =>
                        setEditForm({ ...editForm, status: e.target.value })
                      }
                      className="w-full rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all"
                      style={{ fontFamily: 'inherit' }}
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={editForm.is_public}
                    onChange={(e) =>
                      setEditForm({ ...editForm, is_public: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-sky-300 text-sky-500 focus:ring-sky-400"
                  />
                  <label htmlFor="is_public" className="text-sm font-medium text-dark" style={{ fontFamily: 'inherit' }}>
                    جعل الحالة عامة (متاحة للطلاب)
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleUpdateCase}
                    className="rounded-lg bg-sky-400 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 transition-colors"
                    style={{ fontFamily: 'inherit' }}
                  >
                    حفظ التغييرات
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({
                        title: currentCase.title || '',
                        description: currentCase.description || '',
                        priority: currentCase.priority || '',
                        is_public: currentCase.is_public || false,
                        status: currentCase.status || '',
                      });
                    }}
                    className="rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm font-medium text-dark hover:bg-sky-50 hover:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all"
                    style={{ fontFamily: 'inherit' }}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  <div className="rounded-lg bg-white border border-sky-100 p-5 sm:p-6 shadow-sm">
                    <h2 className="text-lg sm:text-xl font-bold text-dark mb-4" style={{ fontFamily: 'inherit' }}>
                      وصف الحالة
                    </h2>
                    <p className="text-sm sm:text-base text-dark-lighter leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'inherit' }}>
                      {currentCase.description || 'لا يوجد وصف'}
                    </p>
                  </div>

                  {/* Quick Actions */}
                  {currentCase.status !== 'closed' && (
                    <div className="rounded-lg bg-white border border-sky-100 p-5 sm:p-6 shadow-sm">
                      <h2 className="text-lg sm:text-xl font-bold text-dark mb-4" style={{ fontFamily: 'inherit' }}>
                        إجراءات سريعة
                      </h2>
                      <div className="flex flex-wrap gap-3">
                        {getNextStatus(currentCase.status) && (
                          <button
                            onClick={() =>
                              handleStatusChange(getNextStatus(currentCase.status))
                            }
                            className="flex items-center gap-2 rounded-lg bg-sky-400 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 transition-colors"
                            style={{ fontFamily: 'inherit' }}
                          >
                            <ClockIcon className="h-5 w-5" />
                            تغيير إلى {statusLabels[getNextStatus(currentCase.status)]}
                          </button>
                        )}
                        {currentCase.status === 'completed' && (
                          <button
                            onClick={() => handleStatusChange('closed')}
                            className="flex items-center gap-2 rounded-lg bg-dark-lighter px-4 py-2.5 text-sm font-semibold text-light hover:bg-dark focus:outline-none focus:ring-2 focus:ring-dark-lighter focus:ring-offset-2 transition-colors"
                            style={{ fontFamily: 'inherit' }}
                          >
                            إغلاق الحالة
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="rounded-lg bg-white border border-sky-100 p-5 sm:p-6 shadow-sm">
                    <h2 className="text-lg sm:text-xl font-bold text-dark mb-4" style={{ fontFamily: 'inherit' }}>
                      معلومات الحالة
                    </h2>
                    <div className="space-y-4 text-sm">
                      <div className="border-b border-sky-100 pb-3">
                        <span className="block text-xs font-medium text-dark-lighter mb-1.5" style={{ fontFamily: 'inherit' }}>
                          المريض:
                        </span>
                        <p className="text-sm font-semibold text-dark leading-relaxed" style={{ fontFamily: 'inherit' }}>
                          {currentCase.patient?.first_name} {currentCase.patient?.last_name}
                        </p>
                      </div>
                      {currentCase.student && (
                        <div className="border-b border-sky-100 pb-3">
                          <span className="block text-xs font-medium text-dark-lighter mb-1.5" style={{ fontFamily: 'inherit' }}>
                            الطالب المسند:
                          </span>
                          <p className="text-sm font-semibold text-dark leading-relaxed" style={{ fontFamily: 'inherit' }}>
                            {currentCase.student?.first_name} {currentCase.student?.last_name}
                          </p>
                        </div>
                      )}
                      <div className="border-b border-sky-100 pb-3">
                        <span className="block text-xs font-medium text-dark-lighter mb-1.5" style={{ fontFamily: 'inherit' }}>
                          تاريخ الإنشاء:
                        </span>
                        <p className="text-sm font-semibold text-dark leading-relaxed" style={{ fontFamily: 'inherit' }}>
                          {new Date(currentCase.created_at).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      {currentCase.updated_at && (
                        <div>
                          <span className="block text-xs font-medium text-dark-lighter mb-1.5" style={{ fontFamily: 'inherit' }}>
                            آخر تحديث:
                          </span>
                          <p className="text-sm font-semibold text-dark leading-relaxed" style={{ fontFamily: 'inherit' }}>
                            {new Date(currentCase.updated_at).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="rounded-lg bg-white border border-sky-100 overflow-hidden shadow-sm">
            {pendingRequests.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-base font-semibold text-dark" style={{ fontFamily: 'inherit' }}>
                  لا توجد طلبات إسناد معلقة
                </p>
                <p className="mt-2 text-sm text-dark-lighter leading-relaxed" style={{ fontFamily: 'inherit' }}>
                  لا توجد طلبات إسناد معلقة لهذه الحالة
                </p>
              </div>
            ) : (
              <div className="divide-y divide-sky-100">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="p-5 sm:p-6 hover:bg-sky-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                          <h3 className="text-base sm:text-lg font-semibold text-dark" style={{ fontFamily: 'inherit' }}>
                            {request.student?.first_name} {request.student?.last_name}
                          </h3>
                          <span className="text-xs sm:text-sm text-dark-lighter" style={{ fontFamily: 'inherit' }}>
                            {request.student?.email}
                          </span>
                        </div>
                        <p className="text-sm text-dark-lighter mb-4 leading-relaxed" style={{ fontFamily: 'inherit' }}>
                          {request.message}
                        </p>
                        <p className="text-xs text-dark-lighter" style={{ fontFamily: 'inherit' }}>
                          {new Date(request.created_at).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setAssignmentAction('accepted');
                            setAssignmentResponse('');
                            setShowAssignmentModal(true);
                          }}
                          className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 transition-colors"
                          style={{ fontFamily: 'inherit' }}
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                          قبول
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setAssignmentAction('rejected');
                            setAssignmentResponse('');
                            setShowAssignmentModal(true);
                          }}
                          className="flex items-center gap-2 rounded-lg bg-dark-lighter px-4 py-2.5 text-sm font-semibold text-light hover:bg-dark focus:outline-none focus:ring-2 focus:ring-dark-lighter focus:ring-offset-2 transition-colors"
                          style={{ fontFamily: 'inherit' }}
                        >
                          <XCircleIcon className="h-5 w-5" />
                          رفض
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="rounded-lg bg-white border border-sky-100 overflow-hidden shadow-sm">
            {!Array.isArray(sessions) || sessions.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-base font-semibold text-dark" style={{ fontFamily: 'inherit' }}>
                  لا توجد جلسات علاج
                </p>
                <p className="mt-2 text-sm text-dark-lighter leading-relaxed" style={{ fontFamily: 'inherit' }}>
                  لم يتم إضافة أي جلسات علاج لهذه الحالة بعد
                </p>
              </div>
            ) : (
              <div className="divide-y divide-sky-100">
                {sessions.map((session) => (
                  <div key={session.id} className="p-5 sm:p-6 hover:bg-sky-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                          <ClipboardDocumentCheckIcon className="h-5 w-5 text-sky-500 flex-shrink-0" />
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                              session.status === 'approved'
                                ? 'bg-sky-500 text-white'
                                : session.status === 'rejected'
                                ? 'bg-dark-lighter text-light'
                                : 'bg-sky-200 text-sky-800'
                            }`}
                            style={{ fontFamily: 'inherit' }}
                          >
                            {session.status === 'approved'
                              ? 'موافق عليها'
                              : session.status === 'rejected'
                              ? 'مرفوضة'
                              : 'تحتاج مراجعة'}
                          </span>
                        </div>
                        <p className="text-sm text-dark-lighter mb-4 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'inherit' }}>
                          {session.notes}
                        </p>
                        {session.supervisor_feedback && (
                          <div className="mt-4 p-4 rounded-lg bg-sky-50 border border-sky-200">
                            <p className="text-xs font-semibold text-sky-800 mb-2" style={{ fontFamily: 'inherit' }}>
                              ملاحظات المشرف:
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
                          })}
                        </p>
                      </div>
                      {(session.status === 'completed' || session.status === 'needs_review') && (
                        <button
                          onClick={async () => {
                            setSelectedSession(session);
                            setSessionFeedback('');
                            // جلب تفاصيل الجلسة الكاملة
                            await dispatch(fetchSessionById(session.id));
                            setShowSessionModal(true);
                          }}
                          className="flex items-center gap-2 rounded-lg bg-sky-400 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 transition-colors flex-shrink-0"
                          style={{ fontFamily: 'inherit' }}
                        >
                          مراجعة
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="rounded-lg bg-white border border-sky-100 overflow-hidden shadow-sm">
            {!caseHistory || caseHistory.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-base font-semibold text-dark" style={{ fontFamily: 'inherit' }}>
                  لا يوجد سجل
                </p>
                <p className="mt-2 text-sm text-dark-lighter leading-relaxed" style={{ fontFamily: 'inherit' }}>
                  لا يوجد سجل أنشطة لهذه الحالة
                </p>
              </div>
            ) : (
              <div className="divide-y divide-sky-100">
                {Array.isArray(caseHistory) && caseHistory.map((item, index) => (
                  <div key={item.id || index} className="p-5 sm:p-6 hover:bg-sky-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 mt-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-sky-500"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-semibold text-dark leading-relaxed mb-2" style={{ fontFamily: 'inherit' }}>
                          {item.description || item.action || 'حدث'}
                        </p>
                        <p className="text-xs text-dark-lighter leading-relaxed" style={{ fontFamily: 'inherit' }}>
                          {item.performed_by?.first_name || item.user?.first_name || ''} {item.performed_by?.last_name || item.user?.last_name || ''} -{' '}
                          {new Date(item.created_at || item.timestamp).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignmentModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white border border-sky-100 p-5 sm:p-6 shadow-lg">
            <h3 className="text-lg sm:text-xl font-bold text-dark mb-4" style={{ fontFamily: 'inherit' }}>
              {assignmentAction === 'accepted' ? 'قبول' : 'رفض'} طلب الإسناد
            </h3>
            <div className="mb-5">
              <label className="block text-sm font-semibold text-dark mb-2.5" style={{ fontFamily: 'inherit' }}>
                رد المشرف (اختياري)
              </label>
              <textarea
                value={assignmentResponse}
                onChange={(e) => setAssignmentResponse(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/50 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all resize-none"
                placeholder="أضف ملاحظاتك..."
                style={{ fontFamily: 'inherit' }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleRespondToAssignment(selectedRequest.id, assignmentAction);
                }}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  assignmentAction === 'accepted'
                    ? 'bg-sky-500 hover:bg-sky-600 focus:ring-sky-400'
                    : 'bg-dark-lighter hover:bg-dark focus:ring-dark-lighter'
                }`}
                style={{ fontFamily: 'inherit' }}
              >
                تأكيد {assignmentAction === 'accepted' ? 'القبول' : 'الرفض'}
              </button>
              <button
                onClick={() => {
                  setShowAssignmentModal(false);
                  setSelectedRequest(null);
                  setAssignmentResponse('');
                }}
                className="flex-1 rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm font-medium text-dark hover:bg-sky-50 hover:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all"
                style={{ fontFamily: 'inherit' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Review Modal */}
      {showSessionModal && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white border border-sky-100 p-5 sm:p-6 max-h-[90vh] overflow-y-auto shadow-lg">
            <h3 className="text-lg sm:text-xl font-bold text-dark mb-5" style={{ fontFamily: 'inherit' }}>
              مراجعة الجلسة
            </h3>
            
            {/* Session Details */}
            <div className="space-y-4 mb-5">
              {/* Status */}
              <div className="p-4 rounded-lg bg-sky-50 border border-sky-100">
                <p className="text-xs font-semibold text-dark-lighter mb-2.5" style={{ fontFamily: 'inherit' }}>
                  حالة الجلسة:
                </p>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    (currentSession?.status || selectedSession.status) === 'approved'
                      ? 'bg-sky-500 text-white'
                      : (currentSession?.status || selectedSession.status) === 'rejected'
                      ? 'bg-dark-lighter text-light'
                      : 'bg-sky-200 text-sky-800'
                  }`}
                  style={{ fontFamily: 'inherit' }}
                >
                  {(currentSession?.status || selectedSession.status) === 'approved'
                    ? 'موافق عليها'
                    : (currentSession?.status || selectedSession.status) === 'rejected'
                    ? 'مرفوضة'
                    : 'تحتاج مراجعة'}
                </span>
              </div>

              {/* Notes */}
              <div className="p-4 rounded-lg bg-sky-50 border border-sky-100">
                <p className="text-xs font-semibold text-dark-lighter mb-2.5" style={{ fontFamily: 'inherit' }}>
                  ملاحظات الطالب:
                </p>
                <p className="text-sm text-dark leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'inherit' }}>
                  {currentSession?.notes || selectedSession.notes || 'لا توجد ملاحظات'}
                </p>
              </div>

              {/* Attachments */}
              {currentSession?.attachments && currentSession.attachments.length > 0 && (
                <div className="p-4 rounded-lg bg-sky-50 border border-sky-100">
                  <p className="text-xs font-semibold text-dark-lighter mb-2.5" style={{ fontFamily: 'inherit' }}>
                    المرفقات:
                  </p>
                  <div className="space-y-2">
                    {currentSession.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment.url || attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-sky-600 hover:text-sky-700 transition-colors"
                        style={{ fontFamily: 'inherit' }}
                      >
                        <span>📎</span>
                        <span>{attachment.name || attachment.filename || `مرفق ${index + 1}`}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Treatment Sequence */}
              {currentSession?.treatment_sequence && (
                <div className="p-4 rounded-lg bg-sky-50 border border-sky-100">
                  <p className="text-xs font-semibold text-dark-lighter mb-2.5" style={{ fontFamily: 'inherit' }}>
                    التسلسل العلاجي:
                  </p>
                  <p className="text-sm text-dark leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'inherit' }}>
                    {currentSession.treatment_sequence}
                  </p>
                </div>
              )}
            </div>

            {/* Supervisor Feedback */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-dark mb-2.5" style={{ fontFamily: 'inherit' }}>
                ملاحظات المشرف
              </label>
              <textarea
                value={sessionFeedback}
                onChange={(e) => setSessionFeedback(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/50 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all resize-none"
                placeholder="أضف ملاحظاتك على الجلسة..."
                style={{ fontFamily: 'inherit' }}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => handleReviewSession(selectedSession.id, 'approved')}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 transition-colors"
                style={{ fontFamily: 'inherit' }}
              >
                <CheckCircleIcon className="h-5 w-5" />
                موافقة
              </button>
              <button
                onClick={() => handleReviewSession(selectedSession.id, 'rejected')}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-dark-lighter px-4 py-2.5 text-sm font-semibold text-light hover:bg-dark focus:outline-none focus:ring-2 focus:ring-dark-lighter focus:ring-offset-2 transition-colors"
                style={{ fontFamily: 'inherit' }}
              >
                <XCircleIcon className="h-5 w-5" />
                رفض
              </button>
              <button
                onClick={() => {
                  setShowSessionModal(false);
                  setSelectedSession(null);
                  setSessionFeedback('');
                }}
                className="flex-1 rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm font-medium text-dark hover:bg-sky-50 hover:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all"
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


