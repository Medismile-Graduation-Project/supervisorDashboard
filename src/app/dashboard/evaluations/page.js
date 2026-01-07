'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  fetchEvaluations,
  createEvaluation,
  updateEvaluation,
  submitEvaluation,
  finalizeEvaluation,
  fetchStudentStatistics,
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
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import toast from 'react-hot-toast';

const statusLabels = {
  draft: 'مسودة',
  submitted: 'مقدمة',
  in_review: 'قيد المراجعة',
  approved: 'موافق عليها',
  rejected: 'مرفوضة',
  finalized: 'نهائية',
  final: 'نهائي',
};

const statusColors = {
  draft: 'bg-sky-50 text-sky-700',
  submitted: 'bg-sky-100 text-sky-800',
  in_review: 'bg-sky-200 text-sky-800',
  approved: 'bg-sky-500 text-white',
  rejected: 'bg-dark-lighter text-light',
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
  const { evaluations = [], loading, studentStatistics } = useAppSelector((state) => state.evaluations);
  const { cases = [] } = useAppSelector((state) => state.cases);
  const { appointments = [] } = useAppSelector((state) => state.appointments);
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
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
    const matchesSearch =
      evaluation.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.case?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.student?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.student?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !localFilters.status || evaluation.status === localFilters.status;
    const matchesType = !localFilters.type || evaluation.evaluation_type === localFilters.type;
    const matchesCase = !localFilters.case_id || evaluation.case === localFilters.case_id;

    return matchesSearch && matchesStatus && matchesType && matchesCase;
  }) : [];

  const handleCreateEvaluation = async () => {
    if (!formData.student_id || !formData.target_type || !formData.target_id || !formData.score) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const result = await dispatch(createEvaluation({
        student_id: formData.student_id,
        target_type: formData.target_type, // 'case' | 'session' | 'appointment'
        target_id: formData.target_id, // UUID
        score: formData.score,
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

  const handleViewStatistics = async (studentId) => {
    setSelectedStudentId(studentId);
    setShowStatisticsModal(true);
    await dispatch(fetchStudentStatistics(studentId));
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
    draft: evaluations.filter((e) => e.status === 'draft').length,
    submitted: evaluations.filter((e) => e.status === 'submitted').length,
    final: evaluations.filter((e) => e.status === 'final' || e.status === 'finalized').length,
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
              <p className="text-sm font-medium text-dark-lighter mb-1">مسودات</p>
              <p className="text-2xl font-bold text-dark">{stats.draft}</p>
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
              <p className="text-sm font-medium text-dark-lighter mb-1">مقدمة</p>
              <p className="text-2xl font-bold text-dark">{stats.submitted}</p>
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
              <p className="text-2xl font-bold text-dark">{stats.final}</p>
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
              <label className="block text-sm font-semibold text-dark mb-2.5">نوع التقييم</label>
              <select
                value={localFilters.type}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, type: e.target.value })
                }
                className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
              >
                <option value="">جميع الأنواع</option>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
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
                        {evaluation.title || 'تقييم بدون عنوان'}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                          statusColors[evaluation.status] || statusColors.draft
                        }`}
                      >
                        {statusLabels[evaluation.status] || evaluation.status}
                      </span>
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700 whitespace-nowrap">
                        {typeLabels[evaluation.evaluation_type] || evaluation.evaluation_type}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      {evaluation.case && (
                        <div className="flex items-center gap-2 text-sm text-dark-lighter">
                          <DocumentTextIcon className="h-5 w-5 text-sky-500 flex-shrink-0" />
                          <Link
                            href={`/dashboard/cases/${evaluation.case}`}
                            className="hover:text-sky-600 transition-colors truncate"
                          >
                            {evaluation.case_title || 'حالة سريرية'}
                          </Link>
                        </div>
                      )}
                      {evaluation.student && (
                        <div className="flex items-center gap-2 text-sm text-dark-lighter">
                          <UserIcon className="h-5 w-5 text-sky-500 flex-shrink-0" />
                          <span className="truncate">
                            {evaluation.student?.first_name} {evaluation.student?.last_name}
                          </span>
                        </div>
                      )}
                      {evaluation.max_score && (
                        <div className="flex items-center gap-2 text-sm text-dark-lighter">
                          <AcademicCapIcon className="h-5 w-5 text-sky-500 flex-shrink-0" />
                          <span>
                            النقاط: <span className="font-medium text-dark">{evaluation.score || 0}</span> / {evaluation.max_score}
                          </span>
                        </div>
                      )}
                    </div>

                    {evaluation.description && (
                      <p className="mt-4 text-sm text-dark-lighter line-clamp-2 leading-relaxed">
                        {evaluation.description}
                      </p>
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
                    
                    {/* أزرار للتقييمات في حالة submitted */}
                    {evaluation.status === 'submitted' && (
                      <button
                        onClick={() => handleFinalizeEvaluation(evaluation.id)}
                        className="flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        اعتماد
                      </button>
                    )}
                    
                    {/* زر الإحصائيات - متاح دائماً */}
                    {evaluation.student_id && (
                      <button
                        onClick={() => handleViewStatistics(evaluation.student_id || evaluation.student?.id)}
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
            <h3 className="text-xl font-semibold text-dark mb-5" style={{ fontFamily: 'inherit' }}>إحصائيات أداء الطالب</h3>

            {loading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent"></div>
                <p className="mr-4 text-base font-semibold text-dark-lighter leading-relaxed">جاري تحميل الإحصائيات...</p>
              </div>
            ) : studentStatistics ? (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-sky-50 border-2 border-sky-200 p-5">
                    <p className="text-sm font-semibold text-sky-800 mb-2">متوسط النقاط</p>
                    <p className="text-2xl font-bold text-sky-900">
                      {studentStatistics.average_score || 'N/A'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-sky-100 border-2 border-sky-300 p-5">
                    <p className="text-sm font-semibold text-sky-800 mb-2">إجمالي التقييمات</p>
                    <p className="text-2xl font-bold text-sky-900">
                      {studentStatistics.total_evaluations || 0}
                    </p>
                  </div>
                </div>
                {studentStatistics.evaluations && studentStatistics.evaluations.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-dark mb-3">التقييمات السابقة</p>
                    <div className="space-y-2">
                      {studentStatistics.evaluations.map((evaluationItem) => (
                        <div key={evaluationItem.id} className="p-4 rounded-lg bg-sky-50 border-2 border-sky-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-dark">{evaluationItem.target_type}</p>
                              <p className="text-xs text-dark-lighter mt-1">
                                {new Date(evaluationItem.created_at).toLocaleDateString('ar-SA', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                            <span className="text-lg font-bold text-sky-600">{evaluationItem.score}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-base font-semibold text-dark-lighter leading-relaxed">لا توجد إحصائيات متاحة</p>
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
    </div>
  );
}









