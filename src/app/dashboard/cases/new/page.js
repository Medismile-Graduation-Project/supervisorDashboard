'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { fetchNewCases, supervisorDecision } from '@/store/slices/casesSlice';
import {
  CheckCircleIcon,
  XCircleIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

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

export default function NewCasesPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { newCases = [], loading } = useAppSelector((state) => state.cases);
  const { user } = useAppSelector((state) => state.auth);
  const [showSupervisorDecisionModal, setShowSupervisorDecisionModal] = useState(false);
  const [selectedCaseForDecision, setSelectedCaseForDecision] = useState(null);
  const [supervisorDecisionType, setSupervisorDecisionType] = useState('accept');
  const [supervisorDecisionNote, setSupervisorDecisionNote] = useState('');

  useEffect(() => {
    // التحقق من وجود بيانات المستخدم قبل جلب الحالات
    if (user?.id && user?.university) {
      dispatch(fetchNewCases());
    }
  }, [dispatch, user]);

  const handleSupervisorDecision = async () => {
    if (!selectedCaseForDecision) return;
    
    try {
      const result = await dispatch(
        supervisorDecision({
          caseId: selectedCaseForDecision.id,
          decision: supervisorDecisionType,
          note: supervisorDecisionNote || undefined,
        })
      );
      
      if (supervisorDecision.fulfilled.match(result)) {
        toast.success(
          supervisorDecisionType === 'accept' ? 'تم قبول الحالة' : 'تم رفض الحالة'
        );
        setShowSupervisorDecisionModal(false);
        setSelectedCaseForDecision(null);
        setSupervisorDecisionNote('');
        // إعادة جلب الحالات الجديدة
        dispatch(fetchNewCases());
      } else {
        const errorMessage = result.payload?.detail || 
                           result.payload?.message || 
                           result.payload?.error ||
                           'فشل معالجة القرار';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء معالجة القرار');
    }
  };

  // التحقق من وجود بيانات المستخدم
  if (!user?.id || !user?.university) {
    return (
      <div className="space-y-6">
        <div className="mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
            الحالات الجديدة
          </h1>
        </div>
        <div className="rounded-lg bg-white border border-sky-100 p-12 text-center shadow-sm">
          <p className="text-base font-semibold text-dark" style={{ fontFamily: 'inherit' }}>
            جاري تحميل بيانات المستخدم...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
          الحالات الجديدة
        </h1>
        <p className="text-sm sm:text-base text-dark-lighter leading-relaxed" style={{ fontFamily: 'inherit' }}>
          مراجعة الحالات الجديدة واتخاذ قرار بشأنها (قبول/رفض)
        </p>
      </div>

      {/* Stats Card */}
      <div className="rounded-lg bg-white border border-sky-100 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-dark-lighter mb-2" style={{ fontFamily: 'inherit' }}>
              عدد الحالات الجديدة
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-dark" style={{ fontFamily: 'inherit' }}>
              {newCases.length}
            </p>
          </div>
          <div className="flex-shrink-0">
            <FolderIcon className="h-8 w-8 text-sky-500" />
          </div>
        </div>
      </div>

      {/* New Cases List */}
      <div className="rounded-lg bg-white border border-sky-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent"></div>
            <p className="mt-4 text-sm text-dark-lighter" style={{ fontFamily: 'inherit' }}>
              جاري تحميل الحالات الجديدة...
            </p>
          </div>
        ) : newCases.length === 0 ? (
          <div className="p-12 text-center">
            <FolderIcon className="mx-auto h-12 w-12 text-dark-lighter" />
            <p className="mt-4 text-base font-semibold text-dark" style={{ fontFamily: 'inherit' }}>
              لا توجد حالات جديدة
            </p>
            <p className="mt-2 text-sm text-dark-lighter leading-relaxed" style={{ fontFamily: 'inherit' }}>
              جميع الحالات تم مراجعتها
            </p>
          </div>
        ) : (
          <div className="divide-y divide-sky-100">
            {newCases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="p-5 sm:p-6 hover:bg-sky-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                      <Link
                        href={`/dashboard/cases/${caseItem.id}`}
                        className="text-base sm:text-lg font-semibold text-dark hover:text-sky-600 transition-colors"
                        style={{ fontFamily: 'inherit' }}
                      >
                        {caseItem.title}
                      </Link>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                          priorityColors[caseItem.priority] || priorityColors.medium
                        }`}
                        style={{ fontFamily: 'inherit' }}
                      >
                        {priorityLabels[caseItem.priority] || caseItem.priority}
                      </span>
                    </div>
                    <p className="text-sm text-dark-lighter line-clamp-2 mb-4 leading-relaxed" style={{ fontFamily: 'inherit' }}>
                      {caseItem.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-dark-lighter flex-wrap" style={{ fontFamily: 'inherit' }}>
                      <span>
                        المريض:{' '}
                        <span className="font-medium text-dark">
                          {caseItem.patient?.first_name} {caseItem.patient?.last_name}
                        </span>
                      </span>
                      {caseItem.student && (
                        <span>
                          الطالب:{' '}
                          <span className="font-medium text-dark">
                            {caseItem.student?.first_name} {caseItem.student?.last_name}
                          </span>
                        </span>
                      )}
                      <span>
                        {new Date(caseItem.created_at).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setSelectedCaseForDecision(caseItem);
                        setSupervisorDecisionType('accept');
                        setSupervisorDecisionNote('');
                        setShowSupervisorDecisionModal(true);
                      }}
                      className="flex items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20"
                      style={{ fontFamily: 'inherit' }}
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      قبول
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCaseForDecision(caseItem);
                        setSupervisorDecisionType('reject');
                        setSupervisorDecisionNote('');
                        setShowSupervisorDecisionModal(true);
                      }}
                      className="flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      style={{ fontFamily: 'inherit' }}
                    >
                      <XCircleIcon className="h-5 w-5" />
                      رفض
                    </button>
                    <Link
                      href={`/dashboard/cases/${caseItem.id}`}
                      className="flex items-center justify-center rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark hover:bg-sky-50 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/20"
                      style={{ fontFamily: 'inherit' }}
                    >
                      التفاصيل
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Supervisor Decision Modal - قرار المشرف على حالة جديدة */}
      {showSupervisorDecisionModal && selectedCaseForDecision && (
        <div className="fixed inset-0 bg-dark/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-dark mb-4" style={{ fontFamily: 'inherit' }}>
              {supervisorDecisionType === 'accept' ? 'قبول الحالة' : 'رفض الحالة'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
                ملاحظات (اختياري)
              </label>
              <textarea
                value={supervisorDecisionNote}
                onChange={(e) => setSupervisorDecisionNote(e.target.value)}
                placeholder="أضف ملاحظات حول قرارك..."
                rows={3}
                className="w-full rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/50 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all resize-none"
                style={{ fontFamily: 'inherit' }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSupervisorDecision}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  supervisorDecisionType === 'accept'
                    ? 'bg-green-500 hover:bg-green-600 focus:ring-green-400'
                    : 'bg-red-500 hover:bg-red-600 focus:ring-red-400'
                }`}
                style={{ fontFamily: 'inherit' }}
              >
                {supervisorDecisionType === 'accept' ? 'قبول' : 'رفض'}
              </button>
              <button
                onClick={() => {
                  setShowSupervisorDecisionModal(false);
                  setSelectedCaseForDecision(null);
                  setSupervisorDecisionNote('');
                }}
                className="flex-1 rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark hover:bg-sky-50 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/20"
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

