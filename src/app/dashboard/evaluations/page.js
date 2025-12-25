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
};

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  in_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  finalized: 'bg-sky-100 text-sky-800',
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
  const { evaluations, loading } = useAppSelector((state) => state.evaluations);
  const { cases } = useAppSelector((state) => state.cases);
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
    case: '',
    student: '',
    evaluation_type: 'clinical',
    title: '',
    description: '',
    criteria: '',
    max_score: 100,
    status: 'draft',
  });

  useEffect(() => {
    dispatch(fetchEvaluations());
    dispatch(fetchCases());
  }, [dispatch]);

  const filteredEvaluations = evaluations.filter((evaluation) => {
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
  });

  const handleCreateEvaluation = async () => {
    try {
      const result = await dispatch(createEvaluation(formData));
      if (createEvaluation.fulfilled.match(result)) {
        toast.success('تم إنشاء التقييم بنجاح');
        setShowCreateModal(false);
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
        dispatch(fetchEvaluations());
      } else {
        toast.error(result.payload?.message || 'فشل إنشاء التقييم');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء التقييم');
    }
  };

  const handleUpdateEvaluation = async () => {
    if (!selectedEvaluation) return;

    try {
      const result = await dispatch(
        updateEvaluation({ evaluationId: selectedEvaluation.id, data: formData })
      );
      if (updateEvaluation.fulfilled.match(result)) {
        toast.success('تم تحديث التقييم بنجاح');
        setShowEditModal(false);
        setSelectedEvaluation(null);
        dispatch(fetchEvaluations());
      } else {
        toast.error(result.payload?.message || 'فشل تحديث التقييم');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث التقييم');
    }
  };

  const handleSubmitEvaluation = async (evaluationId) => {
    try {
      const result = await dispatch(submitEvaluation(evaluationId));
      if (submitEvaluation.fulfilled.match(result)) {
        toast.success('تم إرسال التقييم بنجاح');
        dispatch(fetchEvaluations());
      } else {
        toast.error(result.payload?.message || 'فشل إرسال التقييم');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إرسال التقييم');
    }
  };

  const handleFinalizeEvaluation = async (evaluationId) => {
    if (!confirm('هل أنت متأكد من إنهاء هذا التقييم؟ لا يمكن التراجع عن هذا الإجراء.')) {
      return;
    }

    try {
      const result = await dispatch(finalizeEvaluation(evaluationId));
      if (finalizeEvaluation.fulfilled.match(result)) {
        toast.success('تم إنهاء التقييم بنجاح');
        dispatch(fetchEvaluations());
      } else {
        toast.error(result.payload?.message || 'فشل إنهاء التقييم');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إنهاء التقييم');
    }
  };

  const handleEditClick = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setFormData({
      case: evaluation.case || '',
      student: evaluation.student || '',
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
                    {evaluation.status === 'draft' && (
                      <>
                        <button
                          onClick={() => handleEditClick(evaluation)}
                          className="flex items-center gap-2 rounded-lg border border-dark-lighter bg-light px-3 py-2 text-sm font-medium text-dark hover:bg-light-gray transition-colors"
                        >
                          <PencilIcon className="h-4 w-4" />
                          تعديل
                        </button>
                        <button
                          onClick={() => handleSubmitEvaluation(evaluation.id)}
                          className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          إرسال
                        </button>
                      </>
                    )}
                    {evaluation.status === 'approved' && (
                      <button
                        onClick={() => handleFinalizeEvaluation(evaluation.id)}
                        className="flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        إنهاء
                      </button>
                    )}
                    {evaluation.status !== 'draft' && evaluation.status !== 'finalized' && (
                      <button
                        onClick={() => handleEditClick(evaluation)}
                        className="flex items-center gap-2 rounded-lg border border-dark-lighter bg-light px-3 py-2 text-sm font-medium text-dark hover:bg-light-gray transition-colors"
                      >
                        <PencilIcon className="h-4 w-4" />
                        عرض
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
                  العنوان <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="مثال: تقييم الأداء السريري - الفصل الأول"
                  className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    الحالة السريرية
                  </label>
                  <select
                    value={formData.case}
                    onChange={(e) => setFormData({ ...formData, case: e.target.value })}
                    className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">اختر الحالة (اختياري)</option>
                    {cases.map((caseItem) => (
                      <option key={caseItem.id} value={caseItem.id}>
                        {caseItem.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">نوع التقييم</label>
                  <select
                    value={formData.evaluation_type}
                    onChange={(e) =>
                      setFormData({ ...formData, evaluation_type: e.target.value })
                    }
                    className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="وصف التقييم..."
                  className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">معايير التقييم</label>
                <textarea
                  value={formData.criteria}
                  onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
                  rows={4}
                  placeholder="اذكر معايير التقييم..."
                  className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  النقاط العظمى
                </label>
                <input
                  type="number"
                  value={formData.max_score}
                  onChange={(e) =>
                    setFormData({ ...formData, max_score: parseInt(e.target.value) || 100 })
                  }
                  min="1"
                  max="1000"
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
                    case: '',
                    student: '',
                    evaluation_type: 'clinical',
                    title: '',
                    description: '',
                    criteria: '',
                    max_score: 100,
                    status: 'draft',
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

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  العنوان <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    الحالة السريرية
                  </label>
                  <select
                    value={formData.case}
                    onChange={(e) => setFormData({ ...formData, case: e.target.value })}
                    className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">اختر الحالة (اختياري)</option>
                    {cases.map((caseItem) => (
                      <option key={caseItem.id} value={caseItem.id}>
                        {caseItem.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">نوع التقييم</label>
                  <select
                    value={formData.evaluation_type}
                    onChange={(e) =>
                      setFormData({ ...formData, evaluation_type: e.target.value })
                    }
                    className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">معايير التقييم</label>
                <textarea
                  value={formData.criteria}
                  onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
                  rows={4}
                  className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  النقاط العظمى
                </label>
                <input
                  type="number"
                  value={formData.max_score}
                  onChange={(e) =>
                    setFormData({ ...formData, max_score: parseInt(e.target.value) || 100 })
                  }
                  min="1"
                  max="1000"
                  className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateEvaluation}
                className="flex-1 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
              >
                حفظ التغييرات
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedEvaluation(null);
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

