'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  fetchEvaluations,
  createEvaluation,
  updateEvaluation,
  finalizeEvaluation,
  fetchStudentStatistics,
} from '@/store/slices/evaluationsSlice';
import { fetchCases } from '@/store/slices/casesSlice';
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
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  in_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  finalized: 'bg-sky-100 text-sky-800',
  final: 'bg-sky-100 text-sky-800',
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
    target_type: '',
    score: '',
  });

  useEffect(() => {
    dispatch(fetchEvaluations());
    dispatch(fetchCases());
  }, [dispatch]);

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
    if (!formData.student_id || !formData.target_type || !formData.score) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const result = await dispatch(createEvaluation({
        student_id: formData.student_id,
        target_type: formData.target_type,
        score: parseFloat(formData.score),
      }));
      if (createEvaluation.fulfilled.match(result)) {
        toast.success('تم إنشاء التقييم بنجاح');
        setShowCreateModal(false);
        setFormData({
          student_id: '',
          target_type: '',
          score: '',
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
    // منع التعديل إذا كان التقييم نهائي
    if (evaluation.status === 'final' || evaluation.status === 'finalized') {
      toast.error('لا يمكن تعديل تقييم نهائي');
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
    in_review: evaluations.filter((e) => e.status === 'in_review').length,
    finalized: evaluations.filter((e) => e.status === 'finalized').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">إدارة التقييمات</h1>
          <p className="mt-1 text-sm text-dark-lighter">
            عرض وإدارة جميع التقييمات الأكاديمية للطلاب
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              case: '',
              student: '',
              evaluation_type: 'clinical',
              title: '',
              description: '',
              criteria: '',
              max_score: 100,
              status: 'draft',
            });
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          تقييم جديد
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">إجمالي التقييمات</p>
              <p className="mt-1 text-2xl font-bold text-dark">{stats.total}</p>
            </div>
            <DocumentTextIcon className="h-8 w-8 text-sky-500" />
          </div>
        </div>
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">مسودات</p>
              <p className="mt-1 text-2xl font-bold text-dark">{stats.draft}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-gray-500"></div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">مقدمة</p>
              <p className="mt-1 text-2xl font-bold text-dark">{stats.submitted}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-blue-500"></div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">قيد المراجعة</p>
              <p className="mt-1 text-2xl font-bold text-dark">{stats.in_review}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">نهائية</p>
              <p className="mt-1 text-2xl font-bold text-dark">{stats.finalized}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-sky-500"></div>
            </div>
          </div>
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
              placeholder="بحث في التقييمات..."
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
          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-light-gray pt-4 md:grid-cols-3">
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
              <label className="block text-sm font-medium text-dark mb-2">نوع التقييم</label>
              <select
                value={localFilters.type}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, type: e.target.value })
                }
                className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
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

      {/* Evaluations List */}
      <div className="rounded-lg bg-light border border-light-gray overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent"></div>
            <p className="mt-4 text-sm text-dark-lighter">جاري تحميل التقييمات...</p>
          </div>
        ) : filteredEvaluations.length === 0 ? (
          <div className="p-8 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-dark-lighter" />
            <p className="mt-4 text-sm font-medium text-dark">لا توجد تقييمات</p>
            <p className="mt-1 text-sm text-dark-lighter">
              {searchTerm || localFilters.status || localFilters.type || localFilters.case_id
                ? 'لا توجد تقييمات تطابق معايير البحث'
                : 'لم يتم إنشاء أي تقييمات بعد'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-light-gray">
            {filteredEvaluations.map((evaluation) => (
              <div
                key={evaluation.id}
                className="p-6 hover:bg-light-gray transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-dark">
                        {evaluation.title || 'تقييم بدون عنوان'}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusColors[evaluation.status] || statusColors.draft
                        }`}
                      >
                        {statusLabels[evaluation.status] || evaluation.status}
                      </span>
                      <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800">
                        {typeLabels[evaluation.evaluation_type] || evaluation.evaluation_type}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                      {evaluation.case && (
                        <div className="flex items-center gap-2 text-sm text-dark-lighter">
                          <DocumentTextIcon className="h-5 w-5" />
                          <Link
                            href={`/dashboard/cases/${evaluation.case}`}
                            className="hover:text-sky-600 transition-colors"
                          >
                            {evaluation.case_title || 'حالة سريرية'}
                          </Link>
                        </div>
                      )}
                      {evaluation.student && (
                        <div className="flex items-center gap-2 text-sm text-dark-lighter">
                          <UserIcon className="h-5 w-5" />
                          <span>
                            {evaluation.student?.first_name} {evaluation.student?.last_name}
                          </span>
                        </div>
                      )}
                      {evaluation.max_score && (
                        <div className="flex items-center gap-2 text-sm text-dark-lighter">
                          <AcademicCapIcon className="h-5 w-5" />
                          <span>
                            النقاط: {evaluation.score || 0} / {evaluation.max_score}
                          </span>
                        </div>
                      )}
                    </div>

                    {evaluation.description && (
                      <p className="mt-3 text-sm text-dark-lighter line-clamp-2">
                        {evaluation.description}
                      </p>
                    )}

                    {evaluation.created_at && (
                      <p className="mt-2 text-xs text-dark-lighter">
                        {new Date(evaluation.created_at).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {(evaluation.status === 'draft' || (evaluation.status !== 'final' && evaluation.status !== 'finalized')) && (
                      <button
                        onClick={() => handleEditClick(evaluation)}
                        disabled={evaluation.status === 'final' || evaluation.status === 'finalized'}
                        className="flex items-center gap-2 rounded-lg border border-dark-lighter bg-light px-3 py-2 text-sm font-medium text-dark hover:bg-light-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PencilIcon className="h-4 w-4" />
                        تعديل
                      </button>
                    )}
                    {evaluation.status !== 'final' && evaluation.status !== 'finalized' && (
                      <button
                        onClick={() => handleFinalizeEvaluation(evaluation.id)}
                        className="flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        اعتماد
                      </button>
                    )}
                    {evaluation.student_id && (
                      <button
                        onClick={() => handleViewStatistics(evaluation.student_id || evaluation.student?.id)}
                        className="flex items-center gap-2 rounded-lg border border-sky-500 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-light p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-dark mb-4">إنشاء تقييم جديد</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  الطالب <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  required
                  className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
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
                <label className="block text-sm font-medium text-dark mb-2">
                  نوع الهدف <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.target_type}
                  onChange={(e) => setFormData({ ...formData, target_type: e.target.value })}
                  required
                  placeholder="مثال: clinical_skill, presentation, etc."
                  className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  النقاط <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                  required
                  min="0"
                  step="0.1"
                  placeholder="أدخل النقاط"
                  className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateEvaluation}
                className="flex-1 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
              >
                إنشاء
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({
                    student_id: '',
                    target_type: '',
                    score: '',
                  });
                }}
                className="flex-1 rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm font-medium text-dark hover:bg-light-gray transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedEvaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-light p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-dark mb-4">تعديل التقييم</h3>

            {selectedEvaluation.status === 'final' || selectedEvaluation.status === 'finalized' ? (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-800">لا يمكن تعديل تقييم نهائي</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    نوع الهدف <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.target_type}
                    onChange={(e) => setFormData({ ...formData, target_type: e.target.value })}
                    required
                    className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    النقاط <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                    required
                    min="0"
                    step="0.1"
                    className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              {selectedEvaluation.status !== 'final' && selectedEvaluation.status !== 'finalized' && (
                <button
                  onClick={handleUpdateEvaluation}
                  className="flex-1 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
                >
                  حفظ التغييرات
                </button>
              )}
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedEvaluation(null);
                }}
                className="flex-1 rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm font-medium text-dark hover:bg-light-gray transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Modal */}
      {showStatisticsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-light p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-dark mb-4">إحصائيات أداء الطالب</h3>

            {loading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent"></div>
                <p className="mt-4 text-sm text-dark-lighter">جاري تحميل الإحصائيات...</p>
              </div>
            ) : studentStatistics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-sky-50 border border-sky-100 p-4">
                    <p className="text-sm font-medium text-sky-800 mb-1">متوسط النقاط</p>
                    <p className="text-2xl font-bold text-sky-900">
                      {studentStatistics.average_score || 'N/A'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-green-50 border border-green-100 p-4">
                    <p className="text-sm font-medium text-green-800 mb-1">إجمالي التقييمات</p>
                    <p className="text-2xl font-bold text-green-900">
                      {studentStatistics.total_evaluations || 0}
                    </p>
                  </div>
                </div>
                {studentStatistics.evaluations && studentStatistics.evaluations.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-dark mb-2">التقييمات السابقة</p>
                    <div className="space-y-2">
                      {studentStatistics.evaluations.map((evaluationItem) => (
                        <div key={evaluationItem.id} className="p-3 rounded-lg bg-light-gray border border-light">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-dark">{evaluationItem.target_type}</p>
                              <p className="text-xs text-dark-lighter">
                                {new Date(evaluationItem.created_at).toLocaleDateString('ar-SA')}
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
              <div className="p-8 text-center">
                <p className="text-dark-lighter">لا توجد إحصائيات متاحة</p>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowStatisticsModal(false);
                  setSelectedStudentId(null);
                }}
                className="rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm font-medium text-dark hover:bg-light-gray transition-colors"
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









