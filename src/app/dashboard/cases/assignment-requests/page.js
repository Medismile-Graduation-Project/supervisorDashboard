'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  fetchAssignmentRequests,
  respondToAssignmentRequest,
  fetchCaseById,
} from '@/store/slices/casesSlice';
import { toast } from 'react-hot-toast';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

const statusLabels = {
  pending: 'معلق',
  approved: 'موافق عليه',
  rejected: 'مرفوض',
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const priorityLabels = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  urgent: 'عاجلة',
};

const priorityColors = {
  low: 'bg-sky-100 text-sky-700',
  medium: 'bg-sky-200 text-sky-800',
  high: 'bg-sky-300 text-sky-900',
  urgent: 'bg-sky-500 text-white',
};

export default function AssignmentRequestsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { assignmentRequests, loading } = useAppSelector((state) => state.cases);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending'); // Default: pending only
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseAction, setResponseAction] = useState('accepted'); // 'accepted' or 'rejected'
  const [supervisorResponse, setSupervisorResponse] = useState('');
  const [casesData, setCasesData] = useState({}); // لتخزين بيانات الحالات

  useEffect(() => {
    dispatch(fetchAssignmentRequests({ status: statusFilter }));
  }, [dispatch, statusFilter]);

  // جلب بيانات الحالات لكل طلب
  useEffect(() => {
    const fetchCasesForRequests = async () => {
      if (!Array.isArray(assignmentRequests) || assignmentRequests.length === 0) {
        return;
      }

      // جمع جميع case IDs الفريدة
      const caseIds = new Set();
      assignmentRequests.forEach((request) => {
        const caseId = request.case || request.case_id;
        if (caseId) {
          caseIds.add(caseId);
        }
      });

      // جلب بيانات الحالات التي لم يتم جلبها بعد
      const fetchedCases = {};
      await Promise.all(
        Array.from(caseIds).map(async (caseId) => {
          // التحقق من أن الحالة لم يتم جلبها بالفعل
          if (casesData[caseId]) {
            return;
          }
          try {
            const result = await dispatch(fetchCaseById(caseId));
            if (fetchCaseById.fulfilled.match(result)) {
              fetchedCases[caseId] = result.payload;
            }
          } catch (error) {
            console.error(`Error fetching case ${caseId}:`, error);
          }
        })
      );

      // تحديث casesData
      if (Object.keys(fetchedCases).length > 0) {
        setCasesData((prev) => ({ ...prev, ...fetchedCases }));
      }
    };

    fetchCasesForRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentRequests, dispatch]);

  const handleRespondToRequest = async () => {
    if (!selectedRequest) return;

    try {
      const result = await dispatch(
        respondToAssignmentRequest({
          caseId: selectedRequest.case || selectedRequest.case_id,
          decision: responseAction === 'accepted' ? 'approve' : 'reject',
          supervisor_response: supervisorResponse.trim() || undefined,
        })
      );

      if (respondToAssignmentRequest.fulfilled.match(result)) {
        toast.success(
          responseAction === 'accepted'
            ? 'تم قبول طلب الإسناد بنجاح'
            : 'تم رفض طلب الإسناد'
        );
        setShowResponseModal(false);
        setSelectedRequest(null);
        setSupervisorResponse('');
        // إعادة جلب الطلبات
        dispatch(fetchAssignmentRequests({ status: statusFilter }));
      } else {
        const errorMessage =
          result.payload?.message ||
          result.payload?.errors?.detail ||
          'فشل معالجة طلب الإسناد';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء معالجة الطلب');
    }
  };

  const filteredRequests = Array.isArray(assignmentRequests)
    ? assignmentRequests.filter((request) => {
        const matchesSearch =
          !searchTerm ||
          request.student?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.student?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          casesData[request.case || request.case_id]?.title?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = !statusFilter || request.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
    : [];

  const pendingCount = Array.isArray(assignmentRequests)
    ? assignmentRequests.filter((r) => r.status === 'pending').length
    : 0;

  return (
    <div className="min-h-screen bg-sky-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-dark" style={{ fontFamily: 'inherit' }}>
                طلبات الإسناد
              </h1>
              <p className="mt-2 text-sm text-dark-lighter" style={{ fontFamily: 'inherit' }}>
                إدارة طلبات الإسناد من الطلاب للحالات الطبية
              </p>
            </div>
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2">
                <ClockIcon className="h-5 w-5 text-yellow-800" />
                <span className="text-sm font-semibold text-yellow-800" style={{ fontFamily: 'inherit' }}>
                  {pendingCount} طلب معلق
                </span>
              </div>
            )}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-dark-lighter" />
              <input
                type="text"
                placeholder="ابحث عن طالب، بريد إلكتروني، أو حالة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent text-sm"
                style={{ fontFamily: 'inherit' }}
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 border border-sky-200 rounded-lg hover:bg-sky-50 transition-colors text-sm font-medium text-dark"
                style={{ fontFamily: 'inherit' }}
              >
                <FunnelIcon className="h-5 w-5" />
                فلترة
              </button>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-sky-200 shadow-sm">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-2" style={{ fontFamily: 'inherit' }}>
                    الحالة
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
                    style={{ fontFamily: 'inherit' }}
                  >
                    <option value="">الكل</option>
                    <option value="pending">معلق</option>
                    <option value="approved">موافق عليه</option>
                    <option value="rejected">مرفوض</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-lg border border-sky-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
              <p className="mt-4 text-sm text-dark-lighter" style={{ fontFamily: 'inherit' }}>
                جاري التحميل...
              </p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              <FolderIcon className="mx-auto h-12 w-12 text-dark-lighter mb-4" />
              <p className="text-base font-semibold text-dark" style={{ fontFamily: 'inherit' }}>
                لا توجد طلبات إسناد
              </p>
              <p className="mt-2 text-sm text-dark-lighter leading-relaxed" style={{ fontFamily: 'inherit' }}>
                {statusFilter === 'pending'
                  ? 'لا توجد طلبات إسناد معلقة حالياً'
                  : 'لا توجد طلبات إسناد تطابق الفلترة المحددة'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-sky-100">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-5 sm:p-6 hover:bg-sky-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Student Info */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-sky-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-dark" style={{ fontFamily: 'inherit' }}>
                            {request.student?.first_name} {request.student?.last_name}
                          </h3>
                          <p className="text-xs sm:text-sm text-dark-lighter" style={{ fontFamily: 'inherit' }}>
                            {request.student?.email}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap flex-shrink-0 ${statusColors[request.status] || statusColors.pending}`}
                          style={{ fontFamily: 'inherit' }}
                        >
                          {statusLabels[request.status] || request.status}
                        </span>
                      </div>

                      {/* Case Info */}
                      {(request.case || request.case_id) && (() => {
                        const caseId = request.case || request.case_id;
                        const caseData = casesData[caseId];
                        return (
                          <div className="mb-3 p-3 bg-sky-50 rounded-lg border border-sky-200">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <FolderIcon className="h-4 w-4 text-sky-600 flex-shrink-0" />
                                  <button
                                    onClick={() => router.push(`/dashboard/cases/${caseId}`)}
                                    className="text-sm font-semibold text-dark hover:text-sky-600 transition-colors text-right"
                                    style={{ fontFamily: 'inherit' }}
                                  >
                                    {caseData?.title || 'جاري التحميل...'}
                                  </button>
                                </div>
                                {caseData?.description && (
                                  <p className="text-xs text-dark-lighter line-clamp-2 mb-2 leading-relaxed" style={{ fontFamily: 'inherit' }}>
                                    {caseData.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 text-xs text-dark-lighter flex-wrap">
                                  {caseData?.patient && (
                                    <span style={{ fontFamily: 'inherit' }}>
                                      المريض:{' '}
                                      <span className="font-medium text-dark">
                                        {caseData.patient.first_name} {caseData.patient.last_name}
                                      </span>
                                    </span>
                                  )}
                                  {caseData?.priority && (
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priorityColors[caseData.priority] || priorityColors.medium}`} style={{ fontFamily: 'inherit' }}>
                                      {priorityLabels[caseData.priority] || caseData.priority}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Message */}
                      {request.message && (
                        <p className="text-sm text-dark-lighter mb-4 leading-relaxed" style={{ fontFamily: 'inherit' }}>
                          {request.message}
                        </p>
                      )}

                      {/* Date */}
                      <p className="text-xs text-dark-lighter" style={{ fontFamily: 'inherit' }}>
                        {new Date(request.created_at).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>

                      {/* Supervisor Response (if exists) */}
                      {request.supervisor_response && (
                        <div className="mt-3 p-3 bg-sky-50 rounded-lg border border-sky-200">
                          <p className="text-xs font-semibold text-dark mb-1" style={{ fontFamily: 'inherit' }}>
                            رد المشرف:
                          </p>
                          <p className="text-sm text-dark-lighter" style={{ fontFamily: 'inherit' }}>
                            {request.supervisor_response}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions (only for pending requests) */}
                    {request.status === 'pending' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setResponseAction('accepted');
                            setSupervisorResponse('');
                            setShowResponseModal(true);
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
                            setResponseAction('rejected');
                            setSupervisorResponse('');
                            setShowResponseModal(true);
                          }}
                          className="flex items-center gap-2 rounded-lg bg-dark-lighter px-4 py-2.5 text-sm font-semibold text-light hover:bg-dark focus:outline-none focus:ring-2 focus:ring-dark-lighter focus:ring-offset-2 transition-colors"
                          style={{ fontFamily: 'inherit' }}
                        >
                          <XCircleIcon className="h-5 w-5" />
                          رفض
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setShowResponseModal(false)}></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-dark mb-4" style={{ fontFamily: 'inherit' }}>
                {responseAction === 'accepted' ? 'قبول' : 'رفض'} طلب الإسناد
              </h2>
              <p className="text-sm text-dark-lighter mb-4" style={{ fontFamily: 'inherit' }}>
                طالب: {selectedRequest.student?.first_name} {selectedRequest.student?.last_name}
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-dark mb-2" style={{ fontFamily: 'inherit' }}>
                  رد المشرف (اختياري)
                </label>
                <textarea
                  value={supervisorResponse}
                  onChange={(e) => setSupervisorResponse(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
                  placeholder="أضف ملاحظات أو تعليقات..."
                  style={{ fontFamily: 'inherit' }}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowResponseModal(false);
                    setSelectedRequest(null);
                    setSupervisorResponse('');
                  }}
                  className="px-4 py-2 border border-sky-200 rounded-lg text-sm font-medium text-dark hover:bg-sky-50 transition-colors"
                  style={{ fontFamily: 'inherit' }}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleRespondToRequest}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
                    responseAction === 'accepted'
                      ? 'bg-sky-500 hover:bg-sky-600'
                      : 'bg-dark-lighter hover:bg-dark'
                  }`}
                  style={{ fontFamily: 'inherit' }}
                >
                  تأكيد {responseAction === 'accepted' ? 'القبول' : 'الرفض'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

