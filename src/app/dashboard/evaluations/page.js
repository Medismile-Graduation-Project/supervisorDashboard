'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  fetchEvaluations,
  fetchEvaluationById,
  createEvaluation,
  updateEvaluation,
  adjustEvaluation,
  submitEvaluation,
  finalizeEvaluation,
  fetchStudentRating,
  clearCurrentEvaluation,
} from '@/store/slices/evaluationsSlice';
import { fetchCases } from '@/store/slices/casesSlice';
import { fetchAppointments } from '@/store/slices/appointmentsSlice';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  AcademicCapIcon,
  ClockIcon,
  ArrowPathIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import toast from 'react-hot-toast';

const statusLabels = {
  draft: 'مسودة',
  submitted: 'مقدمة',
  in_review: 'قيد المراجعة',
  approved: 'موافق عليها',
  rejected: 'مرفوضة',
  adjusted: 'معدلة',
  finalized: 'نهائية',
  final: 'نهائي',
};

const statusColors = {
  draft: 'bg-sky-50 text-sky-700',
  submitted: 'bg-sky-100 text-sky-800',
  in_review: 'bg-sky-200 text-sky-800',
  approved: 'bg-sky-500 text-white',
  rejected: 'bg-dark-lighter text-light',
  adjusted: 'bg-orange-100 text-orange-700',
  finalized: 'bg-sky-500 text-white',
  final: 'bg-sky-500 text-white',
};

const typeLabels = {
  mid_term: 'تقييم منتصف الفصل',
  final: 'تقييم نهائي',
  clinical: 'تقييم سريري',
  presentation: 'تقييم عرض',
  other: 'أخرى',
};

export default function EvaluationsPage() {
  const dispatch = useAppDispatch();
  const { evaluations = [], loading, studentRating, currentEvaluation } = useAppSelector((state) => state.evaluations);
  const { cases = [] } = useAppSelector((state) => state.cases);
  const { appointments = [] } = useAppSelector((state) => state.appointments);
  const { user } = useAppSelector((state) => state.auth);
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [adjustFormData, setAdjustFormData] = useState({
    new_score: '',
    reason: '',
  });
  const [localFilters, setLocalFilters] = useState({
    status: '',
    type: '',
    case_id: '',
  });
  const [formData, setFormData] = useState({
    student_id: '',
    target_type: '', // 'case' | 'session' | 'appointment'
    target_id: '', // UUID للهدف المختار
    score: '',
    rubric: {}, // معايير التقييم (object)
    comment: '', // تعليق
  });

  useEffect(() => {
    dispatch(fetchEvaluations());
    dispatch(fetchCases());
    dispatch(fetchAppointments());
  }, [dispatch]);

  // جمع جميع الجلسات من الحالات
  const allSessions = Array.isArray(cases) ? cases.reduce((acc, caseItem) => {
    // الجلسات موجودة في caseItem.sessions إذا كانت متوفرة
    if (caseItem.sessions && Array.isArray(caseItem.sessions)) {
      caseItem.sessions.forEach((session) => {
        if (!acc.find(s => s.id === session.id)) {
          acc.push({ ...session, case_title: caseItem.title, case_id: caseItem.id });
        }
      });
    }
    return acc;
  }, []) : [];

  // جلب قائمة الطلاب من الحالات
  const students = Array.isArray(cases) ? cases.reduce((acc, caseItem) => {
    if (caseItem.student && !acc.find(s => s.id === caseItem.student.id)) {
      acc.push(caseItem.student);
    }
    return acc;
  }, []) : [];

  const filteredEvaluations = Array.isArray(evaluations) ? evaluations.filter((evaluation) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      evaluation.id?.toLowerCase().includes(searchLower) ||
      evaluation.target_type?.toLowerCase().includes(searchLower) ||
      evaluation.target_id?.toLowerCase().includes(searchLower) ||
      evaluation.comment?.toLowerCase().includes(searchLower) ||
      evaluation.status?.toLowerCase().includes(searchLower) ||
      (evaluation.case && cases.find(c => c.id === evaluation.case)?.title?.toLowerCase().includes(searchLower));

    const matchesStatus = !localFilters.status || evaluation.status === localFilters.status;
    const matchesType = !localFilters.type || evaluation.target_type === localFilters.type;
    const matchesCase = !localFilters.case_id || evaluation.case === localFilters.case_id || evaluation.target_id === localFilters.case_id;

    return matchesSearch && matchesStatus && matchesType && matchesCase;
  }) : [];

  const handleCreateEvaluation = async () => {
    if (!formData.student_id || !formData.target_type || !formData.target_id || !formData.score) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const result = await dispatch(createEvaluation({
        target_type: formData.target_type, // 'case' | 'session' | 'appointment'
        target_id: formData.target_id, // UUID
        score: formData.score,
        original_score: formData.score, // original_score = score عند الإنشاء
        rubric: formData.rubric && Object.keys(formData.rubric).length > 0 ? formData.rubric : undefined,
        comment: formData.comment?.trim() || undefined,
      }));
      if (createEvaluation.fulfilled.match(result)) {
        toast.success('تم إنشاء التقييم بنجاح');
        setShowCreateModal(false);
        setFormData({
          student_id: '',
          target_type: '',
          target_id: '',
          score: '',
          rubric: {},
          comment: '',
        });
        dispatch(fetchEvaluations());
      } else {
        const errorMessage = result.payload?.message || 
                           result.payload?.error || 
                           'فشل إنشاء التقييم';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء التقييم');
    }
  };

  const handleUpdateEvaluation = async () => {
    if (!selectedEvaluation) return;

    // منع التعديل إذا كان التقييم نهائي
    if (selectedEvaluation.status === 'final' || selectedEvaluation.status === 'finalized') {
      toast.error('لا يمكن تعديل تقييم نهائي');
      return;
    }

    try {
      const result = await dispatch(
        updateEvaluation({ 
          evaluationId: selectedEvaluation.id, 
          data: {
            score: parseFloat(formData.score),
            target_type: formData.target_type,
          }
        })
      );
      if (updateEvaluation.fulfilled.match(result)) {
        toast.success('تم تحديث التقييم بنجاح');
        setShowEditModal(false);
        setSelectedEvaluation(null);
        dispatch(fetchEvaluations());
      } else {
        const errorMessage = result.payload?.message || 
                           result.payload?.error || 
                           'فشل تحديث التقييم';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث التقييم');
    }
  };

  const handleSubmitEvaluation = async (evaluationId) => {
    if (!confirm('هل أنت متأكد من تقديم هذا التقييم؟ بعد التقديم لا يمكن التعديل، ولكن يمكن اعتماده.')) {
      return;
    }

    try {
      const result = await dispatch(submitEvaluation(evaluationId));
      if (submitEvaluation.fulfilled.match(result)) {
        toast.success('تم تقديم التقييم بنجاح');
        dispatch(fetchEvaluations());
      } else {
        const errorMessage = result.payload?.message || 
                           result.payload?.error || 
                           'فشل تقديم التقييم';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تقديم التقييم');
    }
  };

  const handleAdjustEvaluation = async () => {
    if (!selectedEvaluation) return;

    if (!adjustFormData.new_score) {
      toast.error('يرجى إدخال النقاط الجديدة');
      return;
    }

    if (!confirm('هل أنت متأكد من تعديل نقاط هذا التقييم؟')) {
      return;
    }

    try {
      const result = await dispatch(adjustEvaluation({
        evaluationId: selectedEvaluation.id,
        new_score: adjustFormData.new_score,
        reason: adjustFormData.reason,
      }));

      if (adjustEvaluation.fulfilled.match(result)) {
        toast.success('تم تعديل النقاط بنجاح');
        setShowAdjustModal(false);
        setSelectedEvaluation(null);
        setAdjustFormData({ new_score: '', reason: '' });
        dispatch(fetchEvaluations());
      } else {
        const errorMessage = result.payload?.message || 
                           result.payload?.error || 
                           'فشل تعديل النقاط';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تعديل النقاط');
    }
  };

  const handleFinalizeEvaluation = async (evaluationId) => {
    if (!confirm('هل أنت متأكد من اعتماد هذا التقييم؟ لا يمكن التعديل بعد ذلك.')) {
      return;
    }

    try {
      const result = await dispatch(finalizeEvaluation(evaluationId));
      if (finalizeEvaluation.fulfilled.match(result)) {
        toast.success('تم اعتماد التقييم بنجاح');
        dispatch(fetchEvaluations());
      } else {
        const errorMessage = result.payload?.message || 
                           result.payload?.error || 
                           'فشل اعتماد التقييم';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء اعتماد التقييم');
    }
  };

  const handleViewDetails = async (evaluationId) => {
    setSelectedEvaluation(null);
    setShowDetailModal(true);
    await dispatch(fetchEvaluationById(evaluationId));
  };

  const handleViewStatistics = async (studentId) => {
    setSelectedStudentId(studentId);
    setShowStatisticsModal(true);
    await dispatch(fetchStudentRating(studentId));
  };

  const handleEditClick = (evaluation) => {
    // منع التعديل إذا كان التقييم ليس في حالة draft
    if (evaluation.status !== 'draft') {
      if (evaluation.status === 'submitted') {
        toast.error('لا يمكن تعديل تقييم تم تقديمه. يجب إلغاء التقديم أولاً.');
      } else {
        toast.error('لا يمكن تعديل هذا التقييم');
      }
      return;
    }
    setSelectedEvaluation(evaluation);
    setFormData({
      student_id: evaluation.student_id || evaluation.student?.id || '',
      target_type: evaluation.target_type || '',
      score: evaluation.score || '',
      evaluation_type: evaluation.evaluation_type || 'clinical',
      title: evaluation.title || '',
      description: evaluation.description || '',
      criteria: evaluation.criteria || '',
      max_score: evaluation.max_score || 100,
      status: evaluation.status || 'draft',
    });
    setShowEditModal(true);
  };

  const stats = {
    total: evaluations.length,
    created: evaluations.filter((e) => e.status === 'created').length,
    adjusted: evaluations.filter((e) => e.status === 'adjusted').length,
    finalized: evaluations.filter((e) => e.status === 'finalized' || e.status === 'final').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
            إدارة التقييمات
          </h1>
          <p className="text-sm sm:text-base text-dark-lighter leading-relaxed" style={{ fontFamily: 'inherit' }}>
            عرض وإدارة جميع التقييمات الأكاديمية للطلاب
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              student_id: '',
              target_type: '',
              target_id: '',
              score: '',
              rubric: {},
              comment: '',
            });
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2.5 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30"
        >
          <PlusIcon className="h-5 w-5" />
          تقييم جديد
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white border border-sky-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-lighter mb-1">إجمالي التقييمات</p>
              <p className="text-2xl font-bold text-dark">{stats.total}</p>
            </div>
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-sky-100 flex items-center justify-center">
                <DocumentTextIcon className="h-6 w-6 text-sky-500" />
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white border border-sky-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-lighter mb-1">مُنشأة</p>
              <p className="text-2xl font-bold text-dark">{stats.created}</p>
            </div>
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-sky-50 flex items-center justify-center">
                <div className="h-5 w-5 rounded-full bg-sky-400"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white border border-sky-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-lighter mb-1">معدلة</p>
              <p className="text-2xl font-bold text-dark">{stats.adjusted}</p>
            </div>
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-sky-100 flex items-center justify-center">
                <div className="h-5 w-5 rounded-full bg-sky-500"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white border border-sky-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-lighter mb-1">نهائية</p>
              <p className="text-2xl font-bold text-dark">{stats.finalized}</p>
            </div>
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-sky-100 flex items-center justify-center">
                <div className="h-5 w-5 rounded-full bg-sky-500"></div>
              </div>
            </div>
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
              placeholder="ابحث عن تقييم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 pr-10 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-dark hover:bg-sky-100 hover:border-sky-300 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/20"
          >
            <FunnelIcon className="h-5 w-5" />
            فلترة
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-5 pt-5 grid grid-cols-1 gap-4 border-t border-sky-100 md:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-dark mb-2.5">الحالة</label>
              <select
                value={localFilters.status}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, status: e.target.value })
                }
                className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
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
              <label className="block text-sm font-semibold text-dark mb-2.5">نوع الهدف</label>
              <select
                value={localFilters.type}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, type: e.target.value })
                }
                className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
              >
                <option value="">جميع الأنواع</option>
                <option value="case">حالة سريرية</option>
                <option value="session">جلسة</option>
                <option value="appointment">موعد</option>
                <option value="student">طالب</option>
                <option value="supervisor">مشرف</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark mb-2.5">الحالة السريرية</label>
              <select
                value={localFilters.case_id}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, case_id: e.target.value })
                }
                className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
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

      {/* Evaluations List */}
      <div className="rounded-lg bg-white border border-sky-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent"></div>
            <p className="mt-4 text-base font-semibold text-dark-lighter leading-relaxed">جاري تحميل التقييمات...</p>
          </div>
        ) : filteredEvaluations.length === 0 ? (
          <div className="p-12 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-dark-lighter" />
            <p className="mt-4 text-base font-semibold text-dark leading-relaxed">لا توجد تقييمات</p>
            <p className="mt-2 text-sm text-dark-lighter leading-relaxed">
              {searchTerm || localFilters.status || localFilters.type || localFilters.case_id
                ? 'لا توجد تقييمات تطابق معايير البحث'
                : 'لم يتم إنشاء أي تقييمات بعد'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-sky-100">
            {filteredEvaluations.map((evaluation) => (
              <div
                key={evaluation.id}
                className="p-5 sm:p-6 hover:bg-sky-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h3 className="text-lg font-semibold text-dark leading-relaxed">
                        تقييم {evaluation.target_type === 'case' ? 'حالة' : 
                               evaluation.target_type === 'session' ? 'جلسة' : 
                               evaluation.target_type === 'appointment' ? 'موعد' : 
                               evaluation.target_type || 'غير محدد'}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                          statusColors[evaluation.status] || statusColors.draft
                        }`}
                      >
                        {statusLabels[evaluation.status] || evaluation.status}
                      </span>
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700 whitespace-nowrap">
                        {evaluation.target_type === 'case' ? 'حالة سريرية' : 
                         evaluation.target_type === 'session' ? 'جلسة' : 
                         evaluation.target_type === 'appointment' ? 'موعد' : 
                         evaluation.target_type || 'غير محدد'}
                      </span>
                      {evaluation.evaluator_role && (
                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 whitespace-nowrap">
                          {evaluation.evaluator_role === 'supervisor' ? 'مشرف' : 
                           evaluation.evaluator_role === 'patient' ? 'مريض' : 
                           evaluation.evaluator_role === 'university_admin' ? 'جامعة' : 
                           evaluation.evaluator_role}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {evaluation.case && (
                        <div className="flex items-center gap-2 text-sm text-dark-lighter">
                          <DocumentTextIcon className="h-5 w-5 text-sky-500 flex-shrink-0" />
                          <Link
                            href={`/dashboard/cases/${evaluation.case}`}
                            className="hover:text-sky-600 transition-colors truncate"
                          >
                            {cases.find(c => c.id === evaluation.case)?.title || `حالة ${evaluation.case.substring(0, 8)}...`}
                          </Link>
                        </div>
                      )}
                      {evaluation.student && (
                        <div className="flex items-center gap-2 text-sm text-dark-lighter">
                          <UserIcon className="h-5 w-5 text-sky-500 flex-shrink-0" />
                          <span className="truncate">
                            {students.find(s => s.id === evaluation.student)?.first_name && students.find(s => s.id === evaluation.student)?.last_name
                              ? `${students.find(s => s.id === evaluation.student).first_name} ${students.find(s => s.id === evaluation.student).last_name}`
                              : `طالب ${evaluation.student.substring(0, 8)}...`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* النقاط */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="rounded-lg bg-sky-50 border-2 border-sky-200 p-3">
                        <p className="text-xs text-dark-lighter mb-1">النقاط الأصلية</p>
                        <p className="text-lg font-bold text-dark">{evaluation.original_score !== undefined ? evaluation.original_score : 'N/A'}</p>
                      </div>
                      <div className="rounded-lg bg-green-50 border-2 border-green-200 p-3">
                        <p className="text-xs text-dark-lighter mb-1">النقاط النهائية</p>
                        <p className="text-lg font-bold text-green-700">{evaluation.final_score !== undefined ? evaluation.final_score : evaluation.original_score || 'N/A'}</p>
                      </div>
                    </div>

                    {evaluation.comment && evaluation.comment.trim() && (
                      <div className="mt-4 rounded-lg bg-gray-50 border-2 border-gray-200 p-3">
                        <p className="text-xs font-semibold text-dark-lighter mb-1">التعليق</p>
                        <p className="text-sm text-dark leading-relaxed">{evaluation.comment}</p>
                      </div>
                    )}

                    {/* التعديلات */}
                    {evaluation.adjustments && evaluation.adjustments.length > 0 && (
                      <div className="mt-4 rounded-lg bg-orange-50 border-2 border-orange-200 p-3">
                        <p className="text-xs font-semibold text-orange-800 mb-2">التعديلات ({evaluation.adjustments.length})</p>
                        {evaluation.adjustments.map((adj, idx) => (
                          <div key={adj.id || idx} className="text-xs text-orange-700 mb-1">
                            {adj.old_score} → {adj.new_score} {adj.reason && `(${adj.reason})`}
                          </div>
                        ))}
                      </div>
                    )}

                    {evaluation.created_at && (
                      <p className="mt-3 text-xs text-dark-lighter">
                        {new Date(evaluation.created_at).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {/* زر عرض التفاصيل - متاح دائماً */}
                    <button
                      onClick={() => handleViewDetails(evaluation.id)}
                      className="flex items-center gap-2 rounded-lg border-2 border-sky-200 bg-white px-3 py-2 text-sm font-semibold text-dark hover:bg-sky-50 hover:border-sky-300 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/20"
                    >
                      <EyeIcon className="h-4 w-4" />
                      التفاصيل
                    </button>

                    {/* أزرار للتقييمات في حالة draft */}
                    {evaluation.status === 'draft' && (
                      <>
                        <button
                          onClick={() => handleEditClick(evaluation)}
                          className="flex items-center gap-2 rounded-lg border-2 border-sky-200 bg-white px-3 py-2 text-sm font-semibold text-dark hover:bg-sky-50 hover:border-sky-300 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/20"
                        >
                          <PencilIcon className="h-4 w-4" />
                          تعديل
                        </button>
                        <button
                          onClick={() => handleSubmitEvaluation(evaluation.id)}
                          className="flex items-center gap-2 rounded-lg bg-sky-400 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          تقديم
                        </button>
                      </>
                    )}
                    
                    {/* أزرار لتعديل النقاط - للمشرفين والجامعات */}
                    {(user?.role === 'supervisor' || user?.role === 'university_admin') && 
                     evaluation.status !== 'draft' && 
                     evaluation.status !== 'finalized' && 
                     evaluation.status !== 'final' && (
                      <button
                        onClick={() => {
                          setSelectedEvaluation(evaluation);
                          setAdjustFormData({
                            new_score: evaluation.score || evaluation.original_score || '',
                            reason: '',
                          });
                          setShowAdjustModal(true);
                        }}
                        className="flex items-center gap-2 rounded-lg border-2 border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100 hover:border-orange-300 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400/20"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                        تعديل النقاط
                      </button>
                    )}
                    
                    {/* أزرار للتقييمات في حالة submitted - فقط للجامعات */}
                    {evaluation.status === 'submitted' && user?.role === 'university_admin' && (
                      <button
                        onClick={() => handleFinalizeEvaluation(evaluation.id)}
                        className="flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        اعتماد
                      </button>
                    )}
                    
                    {/* زر الإحصائيات - متاح دائماً */}
                    {evaluation.student && (
                      <button
                        onClick={() => handleViewStatistics(evaluation.student)}
                        className="flex items-center gap-2 rounded-lg border-2 border-sky-300 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100 hover:border-sky-400 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/20"
                      >
                        <AcademicCapIcon className="h-4 w-4" />
                        إحصائيات
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white border border-sky-100 p-6 max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="text-xl font-semibold text-dark mb-5" style={{ fontFamily: 'inherit' }}>إنشاء تقييم جديد</h3>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-dark mb-2.5">
                  الطالب <span className="text-sky-600">*</span>
                </label>
                <select
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  required
                  className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                >
                  <option value="">اختر الطالب</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-2.5">
                  نوع الهدف <span className="text-sky-600">*</span>
                </label>
                <select
                  value={formData.target_type}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      target_type: e.target.value,
                      target_id: '', // إعادة تعيين target_id عند تغيير النوع
                    });
                  }}
                  required
                  className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                >
                  <option value="">اختر نوع الهدف</option>
                  <option value="case">حالة سريرية</option>
                  <option value="session">جلسة</option>
                  <option value="appointment">موعد</option>
                </select>
              </div>

              {formData.target_type && (
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2.5">
                    {formData.target_type === 'case' ? 'الحالة السريرية' : 
                     formData.target_type === 'session' ? 'الجلسة' : 
                     'الموعد'} <span className="text-sky-600">*</span>
                  </label>
                  <select
                    value={formData.target_id}
                    onChange={(e) => setFormData({ ...formData, target_id: e.target.value })}
                    required
                    className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                  >
                    <option value="">اختر {formData.target_type === 'case' ? 'الحالة' : formData.target_type === 'session' ? 'الجلسة' : 'الموعد'}</option>
                    {formData.target_type === 'case' && Array.isArray(cases) && cases.map((caseItem) => (
                      <option key={caseItem.id} value={caseItem.id}>
                        {caseItem.title || `حالة ${caseItem.id}`}
                      </option>
                    ))}
                    {formData.target_type === 'session' && Array.isArray(allSessions) && allSessions.length > 0 ? (
                      allSessions.map((session) => (
                        <option key={session.id} value={session.id}>
                          {session.case_title || 'جلسة'} - {new Date(session.date || session.created_at).toLocaleDateString('ar-SA')}
                        </option>
                      ))
                    ) : formData.target_type === 'session' ? (
                      <option value="" disabled>لا توجد جلسات متاحة</option>
                    ) : null}
                    {formData.target_type === 'appointment' && Array.isArray(appointments) && appointments.map((appointment) => (
                      <option key={appointment.id} value={appointment.id}>
                        {appointment.title || 'موعد'} - {new Date(appointment.date || appointment.created_at).toLocaleDateString('ar-SA')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-dark mb-2.5">
                  النقاط <span className="text-sky-600">*</span>
                </label>
                <input
                  type="number"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                  required
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="أدخل النقاط (0-100)"
                  className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-2.5">
                  التعليق (اختياري)
                </label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  rows={4}
                  placeholder="أضف تعليقاً على التقييم..."
                  className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateEvaluation}
                className="flex-1 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              >
                إنشاء
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({
                    student_id: '',
                    target_type: '',
                    target_id: '',
                    score: '',
                    rubric: {},
                    comment: '',
                  });
                }}
                className="flex-1 rounded-lg border-2 border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark hover:bg-sky-50 hover:border-sky-300 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/20"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedEvaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white border border-sky-100 p-6 max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="text-xl font-semibold text-dark mb-5" style={{ fontFamily: 'inherit' }}>تعديل التقييم</h3>

            {selectedEvaluation.status === 'final' || selectedEvaluation.status === 'finalized' ? (
              <div className="p-4 rounded-lg bg-sky-50 border-2 border-sky-200">
                <p className="text-sm font-semibold text-sky-800">لا يمكن تعديل تقييم نهائي</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2.5">
                    نوع الهدف <span className="text-sky-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.target_type}
                    onChange={(e) => setFormData({ ...formData, target_type: e.target.value })}
                    required
                    className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark mb-2.5">
                    النقاط <span className="text-sky-600">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                    required
                    min="0"
                    step="0.1"
                    className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              {selectedEvaluation.status !== 'final' && selectedEvaluation.status !== 'finalized' && (
                <button
                  onClick={handleUpdateEvaluation}
                  className="flex-1 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                >
                  حفظ التغييرات
                </button>
              )}
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedEvaluation(null);
                }}
                className="flex-1 rounded-lg border-2 border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark hover:bg-sky-50 hover:border-sky-300 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/20"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Modal */}
      {showStatisticsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white border border-sky-100 p-6 max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="text-xl font-semibold text-dark mb-5" style={{ fontFamily: 'inherit' }}>تقييم أداء الطالب</h3>

            {loading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent"></div>
                <p className="mr-4 text-base font-semibold text-dark-lighter leading-relaxed">جاري تحميل التقييم...</p>
              </div>
            ) : studentRating ? (
              <div className="space-y-5">
                {/* التقييم النهائي */}
                <div className="rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 border-2 border-sky-600 p-6 text-white">
                  <p className="text-sm font-semibold mb-2 opacity-90">التقييم النهائي للطالب</p>
                  <p className="text-4xl font-bold">
                    {studentRating.final_rating !== undefined && studentRating.final_rating !== null 
                      ? Number(studentRating.final_rating).toFixed(1) 
                      : 'N/A'}
                  </p>
                  <p className="text-sm mt-2 opacity-75">
                    من إجمالي {studentRating.total_evaluations || 0} تقييم
                  </p>
                </div>

                {/* مكونات التقييم */}
                {studentRating.components && Object.keys(studentRating.components).length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-dark mb-4">مكونات التقييم</p>
                    <div className="space-y-3">
                      {Object.entries(studentRating.components).map(([role, data]) => {
                        const roleLabels = {
                          patient: 'تقييمات المرضى',
                          supervisor: 'تقييمات المشرفين',
                          university_admin: 'تقييمات الجامعة',
                        };
                        const roleColors = {
                          patient: 'bg-green-50 border-green-200 text-green-800',
                          supervisor: 'bg-sky-50 border-sky-200 text-sky-800',
                          university_admin: 'bg-purple-50 border-purple-200 text-purple-800',
                        };
                        
                        return (
                          <div key={role} className={`rounded-lg border-2 p-4 ${roleColors[role] || 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-semibold">{roleLabels[role] || role}</p>
                              <span className="text-lg font-bold">
                                {data.average !== undefined && data.average !== null 
                                  ? Number(data.average).toFixed(1) 
                                  : 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs opacity-75">
                              <span>عدد التقييمات: {data.count || 0}</span>
                              <span>الوزن: {(data.weight || 0) * 100}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* معلومات إضافية */}
                {selectedStudentId && (
                  <div className="rounded-lg bg-sky-50 border-2 border-sky-200 p-4">
                    <p className="text-sm font-semibold text-dark mb-2">الطالب</p>
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-5 w-5 text-sky-500" />
                      <p className="text-base font-medium text-dark">
                        {students.find(s => s.id === selectedStudentId)?.first_name && students.find(s => s.id === selectedStudentId)?.last_name
                          ? `${students.find(s => s.id === selectedStudentId).first_name} ${students.find(s => s.id === selectedStudentId).last_name}`
                          : 'طالب غير معروف'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-base font-semibold text-dark-lighter leading-relaxed">لا توجد بيانات تقييم متاحة</p>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowStatisticsModal(false);
                  setSelectedStudentId(null);
                }}
                className="rounded-lg border-2 border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark hover:bg-sky-50 hover:border-sky-300 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/20"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Evaluation Modal */}
      {showAdjustModal && selectedEvaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white border border-sky-100 p-6 max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="text-xl font-semibold text-dark mb-5" style={{ fontFamily: 'inherit' }}>
              تعديل نقاط التقييم
            </h3>

            <div className="space-y-5">
              {/* معلومات التقييم الحالي */}
              <div className="rounded-lg bg-sky-50 border-2 border-sky-200 p-4">
                <p className="text-sm font-semibold text-dark mb-2">معلومات التقييم الحالي:</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-dark-lighter">الطالب: </span>
                    <span className="font-medium text-dark">
                      {selectedEvaluation.student?.first_name} {selectedEvaluation.student?.last_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-dark-lighter">النقاط الحالية: </span>
                    <span className="font-medium text-dark">
                      {selectedEvaluation.score || selectedEvaluation.original_score || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-dark-lighter">نوع الهدف: </span>
                    <span className="font-medium text-dark">{selectedEvaluation.target_type || 'غير محدد'}</span>
                  </div>
                  <div>
                    <span className="text-dark-lighter">الحالة: </span>
                    <span className="font-medium text-dark">
                      {statusLabels[selectedEvaluation.status] || selectedEvaluation.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* النقاط الجديدة */}
              <div>
                <label className="block text-sm font-semibold text-dark mb-2.5">
                  النقاط الجديدة <span className="text-orange-600">*</span>
                </label>
                <input
                  type="number"
                  value={adjustFormData.new_score}
                  onChange={(e) => setAdjustFormData({ ...adjustFormData, new_score: e.target.value })}
                  required
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="أدخل النقاط الجديدة (0-100)"
                  className="w-full rounded-lg border-2 border-orange-200 bg-orange-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition-all duration-200"
                />
              </div>

              {/* السبب */}
              <div>
                <label className="block text-sm font-semibold text-dark mb-2.5">
                  سبب التعديل (اختياري)
                </label>
                <textarea
                  value={adjustFormData.reason}
                  onChange={(e) => setAdjustFormData({ ...adjustFormData, reason: e.target.value })}
                  rows={4}
                  placeholder="أدخل سبب تعديل النقاط..."
                  className="w-full rounded-lg border-2 border-orange-200 bg-orange-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition-all duration-200 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAdjustEvaluation}
                className="flex-1 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              >
                حفظ التعديل
              </button>
              <button
                onClick={() => {
                  setShowAdjustModal(false);
                  setSelectedEvaluation(null);
                  setAdjustFormData({ new_score: '', reason: '' });
                }}
                className="flex-1 rounded-lg border-2 border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark hover:bg-orange-50 hover:border-orange-300 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400/20"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 p-4">
          <div className="w-full max-w-3xl rounded-lg bg-white border border-sky-100 p-6 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-semibold text-dark" style={{ fontFamily: 'inherit' }}>
                تفاصيل التقييم
              </h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  dispatch(clearCurrentEvaluation());
                }}
                className="rounded-lg p-2 hover:bg-sky-50 transition-colors"
              >
                <XCircleIcon className="h-6 w-6 text-dark-lighter" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent"></div>
                <p className="mr-4 text-base font-semibold text-dark-lighter leading-relaxed">جاري تحميل التفاصيل...</p>
              </div>
            ) : currentEvaluation ? (
              <div className="space-y-5">
                {/* معلومات الطالب */}
                {currentEvaluation.student && (
                  <div className="rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 border-2 border-sky-600 p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <UserIcon className="h-8 w-8" />
                      <div>
                        <p className="text-sm font-semibold opacity-90">الطالب</p>
                        <p className="text-2xl font-bold">
                          {students.find(s => s.id === currentEvaluation.student)?.first_name && students.find(s => s.id === currentEvaluation.student)?.last_name
                            ? `${students.find(s => s.id === currentEvaluation.student).first_name} ${students.find(s => s.id === currentEvaluation.student).last_name}`
                            : 'طالب غير معروف'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* معلومات أساسية */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-sky-50 border-2 border-sky-200 p-4">
                    <p className="text-sm font-semibold text-dark-lighter mb-1">الحالة</p>
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                      statusColors[currentEvaluation.status] || statusColors.draft
                    }`}>
                      {statusLabels[currentEvaluation.status] || currentEvaluation.status}
                    </span>
                  </div>
                  <div className="rounded-lg bg-sky-50 border-2 border-sky-200 p-4">
                    <p className="text-sm font-semibold text-dark-lighter mb-1">نوع الهدف</p>
                    <p className="text-base font-medium text-dark">
                      {currentEvaluation.target_type === 'case' ? 'حالة سريرية' : 
                       currentEvaluation.target_type === 'session' ? 'جلسة' : 
                       currentEvaluation.target_type === 'appointment' ? 'موعد' : 
                       currentEvaluation.target_type || 'غير محدد'}
                    </p>
                  </div>
                  {currentEvaluation.evaluator_role && (
                    <div className="rounded-lg bg-sky-50 border-2 border-sky-200 p-4">
                      <p className="text-sm font-semibold text-dark-lighter mb-1">دور المقيّم</p>
                      <p className="text-base font-medium text-dark">
                        {currentEvaluation.evaluator_role === 'supervisor' ? 'مشرف' : 
                         currentEvaluation.evaluator_role === 'patient' ? 'مريض' : 
                         currentEvaluation.evaluator_role === 'university_admin' ? 'إدارة الجامعة' : 
                         currentEvaluation.evaluator_role}
                      </p>
                    </div>
                  )}
                  {currentEvaluation.case && (
                    <div className="rounded-lg bg-sky-50 border-2 border-sky-200 p-4">
                      <p className="text-sm font-semibold text-dark-lighter mb-1">الحالة السريرية</p>
                      <Link
                        href={`/dashboard/cases/${currentEvaluation.case}`}
                        className="text-base font-medium text-sky-600 hover:text-sky-700 hover:underline"
                      >
                        {cases.find(c => c.id === currentEvaluation.case)?.title || 'عرض الحالة'}
                      </Link>
                    </div>
                  )}
                </div>

                {/* النقاط */}
                <div className="rounded-lg bg-sky-50 border-2 border-sky-200 p-4">
                  <p className="text-sm font-semibold text-dark-lighter mb-3">النقاط</p>
                  <div className="grid grid-cols-2 gap-4">
                    {currentEvaluation.original_score !== undefined && (
                      <div>
                        <p className="text-xs text-dark-lighter mb-1">النقاط الأصلية</p>
                        <p className="text-lg font-bold text-dark">{currentEvaluation.original_score}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-dark-lighter mb-1">النقاط النهائية</p>
                      <p className="text-lg font-bold text-sky-600">
                        {currentEvaluation.final_score !== undefined ? currentEvaluation.final_score : currentEvaluation.score || 0}
                      </p>
                    </div>
                  </div>
                </div>


                {/* التعليق */}
                {currentEvaluation.comment && (
                  <div className="rounded-lg bg-sky-50 border-2 border-sky-200 p-4">
                    <p className="text-sm font-semibold text-dark-lighter mb-2">التعليق</p>
                    <p className="text-sm text-dark leading-relaxed">{currentEvaluation.comment}</p>
                  </div>
                )}

                {/* Rubric */}
                {currentEvaluation.rubric && Object.keys(currentEvaluation.rubric).length > 0 && (
                  <div className="rounded-lg bg-sky-50 border-2 border-sky-200 p-4">
                    <p className="text-sm font-semibold text-dark-lighter mb-3">معايير التقييم</p>
                    <div className="space-y-2">
                      {Object.entries(currentEvaluation.rubric).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm text-dark-lighter">{key}:</span>
                          <span className="text-sm font-medium text-dark">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* التواريخ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentEvaluation.created_at && (
                    <div className="rounded-lg bg-sky-50 border-2 border-sky-200 p-4">
                      <p className="text-sm font-semibold text-dark-lighter mb-1">تاريخ الإنشاء</p>
                      <p className="text-sm text-dark">
                        {new Date(currentEvaluation.created_at).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                  {currentEvaluation.updated_at && (
                    <div className="rounded-lg bg-sky-50 border-2 border-sky-200 p-4">
                      <p className="text-sm font-semibold text-dark-lighter mb-1">آخر تحديث</p>
                      <p className="text-sm text-dark">
                        {new Date(currentEvaluation.updated_at).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-base font-semibold text-dark-lighter leading-relaxed">لا توجد تفاصيل متاحة</p>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  dispatch(clearCurrentEvaluation());
                }}
                className="rounded-lg border-2 border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark hover:bg-sky-50 hover:border-sky-300 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/20"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}









