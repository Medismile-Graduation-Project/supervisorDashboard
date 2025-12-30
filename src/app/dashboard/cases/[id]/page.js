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
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const statusColors = {
  new: 'bg-gray-100 text-gray-800',
  pending_assignment: 'bg-blue-100 text-blue-800',
  assigned: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-sky-100 text-sky-800',
  completed: 'bg-green-100 text-green-800',
  closed: 'bg-gray-200 text-gray-600',
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
          <p className="mt-4 text-sm text-dark-lighter">جاري تحميل الحالة...</p>
        </div>
      </div>
    );
  }

  if (!currentCase) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-lighter">الحالة غير موجودة</p>
        <button
          onClick={() => router.push('/dashboard/cases')}
          className="mt-4 text-sky-600 hover:text-sky-700"
        >
          العودة إلى قائمة الحالات
        </button>
      </div>
    );
  }

  const pendingRequests = assignmentRequests.filter(
    (r) => r.status === 'pending' && r.case === params.id
  );
  const sessionsNeedingReview = sessions.filter(
    (s) => s.status === 'completed' || s.status === 'needs_review'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/cases')}
            className="text-dark-lighter hover:text-dark"
          >
            <ArrowRightIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-dark">
              {isEditing ? 'تعديل الحالة' : currentCase.title}
            </h1>
            <p className="mt-1 text-sm text-dark-lighter">
              {currentCase.patient?.first_name} {currentCase.patient?.last_name}
            </p>
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
          >
            <PencilIcon className="h-5 w-5" />
            تعديل
          </button>
        )}
      </div>

      {/* Status and Priority Badges */}
      <div className="flex items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            statusColors[currentCase.status] || statusColors.new
          }`}
        >
          {statusLabels[currentCase.status] || currentCase.status}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            priorityColors[currentCase.priority] || priorityColors.medium
          }`}
        >
          {priorityLabels[currentCase.priority] || currentCase.priority}
        </span>
        {currentCase.is_public && (
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
            عامة
          </span>
        )}
        {pendingRequests.length > 0 && (
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
            {pendingRequests.length} طلب إسناد
          </span>
        )}
        {sessionsNeedingReview.length > 0 && (
          <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800">
            {sessionsNeedingReview.length} جلسة تحتاج مراجعة
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-light-gray">
        <nav className="flex gap-6">
          {[
            { id: 'details', label: 'التفاصيل' },
            { id: 'assignments', label: 'طلبات الإسناد', badge: pendingRequests.length },
            { id: 'sessions', label: 'الجلسات', badge: sessionsNeedingReview.length },
            { id: 'history', label: 'التاريخ' },
            { id: 'history', label: 'السجل' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-sky-600 text-sky-600'
                  : 'text-dark-lighter hover:text-dark'
              }`}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span className="mr-2 rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-800">
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
              <div className="rounded-lg bg-light border border-light-gray p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    العنوان
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    الوصف
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    rows={6}
                    className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      الأولوية
                    </label>
                    <select
                      value={editForm.priority}
                      onChange={(e) =>
                        setEditForm({ ...editForm, priority: e.target.value })
                      }
                      className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      {Object.entries(priorityLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      حالة الحالة
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) =>
                        setEditForm({ ...editForm, status: e.target.value })
                      }
                      className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={editForm.is_public}
                    onChange={(e) =>
                      setEditForm({ ...editForm, is_public: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-dark-lighter text-sky-600 focus:ring-sky-500"
                  />
                  <label htmlFor="is_public" className="text-sm text-dark">
                    جعل الحالة عامة (متاحة للطلاب)
                  </label>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleUpdateCase}
                    className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
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
                    className="rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm font-medium text-dark hover:bg-light-gray transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  <div className="rounded-lg bg-light border border-light-gray p-6">
                    <h2 className="text-lg font-semibold text-dark mb-4">وصف الحالة</h2>
                    <p className="text-dark-lighter whitespace-pre-wrap">
                      {currentCase.description || 'لا يوجد وصف'}
                    </p>
                  </div>

                  {/* Quick Actions */}
                  {currentCase.status !== 'closed' && (
                    <div className="rounded-lg bg-light border border-light-gray p-6">
                      <h2 className="text-lg font-semibold text-dark mb-4">إجراءات سريعة</h2>
                      <div className="flex flex-wrap gap-3">
                        {getNextStatus(currentCase.status) && (
                          <button
                            onClick={() =>
                              handleStatusChange(getNextStatus(currentCase.status))
                            }
                            className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors"
                          >
                            <ClockIcon className="h-5 w-5" />
                            تغيير إلى {statusLabels[getNextStatus(currentCase.status)]}
                          </button>
                        )}
                        {currentCase.status === 'completed' && (
                          <button
                            onClick={() => handleStatusChange('closed')}
                            className="flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
                          >
                            إغلاق الحالة
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="rounded-lg bg-light border border-light-gray p-6">
                    <h2 className="text-lg font-semibold text-dark mb-4">معلومات الحالة</h2>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-dark-lighter">المريض:</span>
                        <p className="font-medium text-dark">
                          {currentCase.patient?.first_name} {currentCase.patient?.last_name}
                        </p>
                      </div>
                      {currentCase.student && (
                        <div>
                          <span className="text-dark-lighter">الطالب المسند:</span>
                          <p className="font-medium text-dark">
                            {currentCase.student?.first_name} {currentCase.student?.last_name}
                          </p>
                        </div>
                      )}
                      <div>
                        <span className="text-dark-lighter">تاريخ الإنشاء:</span>
                        <p className="font-medium text-dark">
                          {new Date(currentCase.created_at).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      {currentCase.updated_at && (
                        <div>
                          <span className="text-dark-lighter">آخر تحديث:</span>
                          <p className="font-medium text-dark">
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
          <div className="rounded-lg bg-light border border-light-gray">
            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-dark-lighter">لا توجد طلبات إسناد معلقة</p>
              </div>
            ) : (
              <div className="divide-y divide-light-gray">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-dark">
                            {request.student?.first_name} {request.student?.last_name}
                          </h3>
                          <span className="text-sm text-dark-lighter">
                            {request.student?.email}
                          </span>
                        </div>
                        <p className="text-sm text-dark-lighter mb-3">{request.message}</p>
                        <p className="text-xs text-dark-lighter">
                          {new Date(request.created_at).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setAssignmentAction('accepted');
                            setAssignmentResponse('');
                            setShowAssignmentModal(true);
                          }}
                          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
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
                          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
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
          <div className="rounded-lg bg-light border border-light-gray">
            {sessions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-dark-lighter">لا توجد جلسات علاج</p>
              </div>
            ) : (
              <div className="divide-y divide-light-gray">
                {sessions.map((session) => (
                  <div key={session.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <ClipboardDocumentCheckIcon className="h-5 w-5 text-sky-500" />
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              session.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : session.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {session.status === 'approved'
                              ? 'موافق عليها'
                              : session.status === 'rejected'
                              ? 'مرفوضة'
                              : 'تحتاج مراجعة'}
                          </span>
                        </div>
                        <p className="text-sm text-dark-lighter mb-3 whitespace-pre-wrap">
                          {session.notes}
                        </p>
                        {session.supervisor_feedback && (
                          <div className="mt-3 p-3 rounded-lg bg-sky-50 border border-sky-100">
                            <p className="text-xs font-medium text-sky-800 mb-1">
                              ملاحظات المشرف:
                            </p>
                            <p className="text-sm text-sky-900">{session.supervisor_feedback}</p>
                          </div>
                        )}
                        <p className="text-xs text-dark-lighter mt-3">
                          {new Date(session.created_at).toLocaleDateString('ar-SA')}
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
                          className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors"
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
          <div className="rounded-lg bg-light border border-light-gray">
            {!caseHistory || caseHistory.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-dark-lighter">لا يوجد سجل</p>
              </div>
            ) : (
              <div className="divide-y divide-light-gray">
                {Array.isArray(caseHistory) && caseHistory.map((item, index) => (
                  <div key={item.id || index} className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0">
                        <div className="h-2 w-2 rounded-full bg-sky-500 mt-2"></div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-dark">{item.description || item.action || 'حدث'}</p>
                        <p className="text-xs text-dark-lighter mt-1">
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
          <div className="w-full max-w-md rounded-lg bg-light p-6">
            <h3 className="text-lg font-semibold text-dark mb-4">
              {assignmentAction === 'accepted' ? 'قبول' : 'رفض'} طلب الإسناد
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-dark mb-2">
                رد المشرف (اختياري)
              </label>
              <textarea
                value={assignmentResponse}
                onChange={(e) => setAssignmentResponse(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="أضف ملاحظاتك..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleRespondToAssignment(selectedRequest.id, assignmentAction);
                }}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
                  assignmentAction === 'accepted'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                تأكيد {assignmentAction === 'accepted' ? 'القبول' : 'الرفض'}
              </button>
              <button
                onClick={() => {
                  setShowAssignmentModal(false);
                  setSelectedRequest(null);
                  setAssignmentResponse('');
                }}
                className="flex-1 rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm font-medium text-dark hover:bg-light-gray transition-colors"
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
          <div className="w-full max-w-2xl rounded-lg bg-light p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-dark mb-4">مراجعة الجلسة</h3>
            
            {/* Session Details */}
            <div className="space-y-4 mb-4">
              {/* Status */}
              <div className="p-4 rounded-lg bg-light-gray">
                <p className="text-sm font-medium text-dark-lighter mb-2">حالة الجلسة:</p>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                    (currentSession?.status || selectedSession.status) === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : (currentSession?.status || selectedSession.status) === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {(currentSession?.status || selectedSession.status) === 'approved'
                    ? 'موافق عليها'
                    : (currentSession?.status || selectedSession.status) === 'rejected'
                    ? 'مرفوضة'
                    : 'تحتاج مراجعة'}
                </span>
              </div>

              {/* Notes */}
              <div className="p-4 rounded-lg bg-light-gray">
                <p className="text-sm font-medium text-dark-lighter mb-2">ملاحظات الطالب:</p>
                <p className="text-sm text-dark whitespace-pre-wrap">
                  {currentSession?.notes || selectedSession.notes || 'لا توجد ملاحظات'}
                </p>
              </div>

              {/* Attachments */}
              {currentSession?.attachments && currentSession.attachments.length > 0 && (
                <div className="p-4 rounded-lg bg-light-gray">
                  <p className="text-sm font-medium text-dark-lighter mb-2">المرفقات:</p>
                  <div className="space-y-2">
                    {currentSession.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment.url || attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-sky-600 hover:text-sky-700"
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
                <div className="p-4 rounded-lg bg-light-gray">
                  <p className="text-sm font-medium text-dark-lighter mb-2">التسلسل العلاجي:</p>
                  <p className="text-sm text-dark whitespace-pre-wrap">
                    {currentSession.treatment_sequence}
                  </p>
                </div>
              )}
            </div>

            {/* Supervisor Feedback */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-dark mb-2">
                ملاحظات المشرف
              </label>
              <textarea
                value={sessionFeedback}
                onChange={(e) => setSessionFeedback(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="أضف ملاحظاتك على الجلسة..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => handleReviewSession(selectedSession.id, 'approved')}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
              >
                <CheckCircleIcon className="h-5 w-5" />
                موافقة
              </button>
              <button
                onClick={() => handleReviewSession(selectedSession.id, 'rejected')}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
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


