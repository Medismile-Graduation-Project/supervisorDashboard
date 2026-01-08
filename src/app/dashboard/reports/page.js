'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { fetchReports, fetchReportById, createReport, updateReport, submitReport, approveReport, rejectReport } from '@/store/slices/reportsSlice';
import { fetchCases } from '@/store/slices/casesSlice';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  PaperAirplaneIcon,
  PlusIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const reportTypeLabels = {
  cases: 'تقرير الحالات',
  sessions: 'تقرير الجلسات',
  appointments: 'تقرير المواعيد',
  evaluations: 'تقرير التقييمات',
  summary: 'تقرير شامل',
  custom: 'تقرير مخصص',
};

const statusLabels = {
  draft: 'مسودة',
  submitted: 'مقدمة',
  approved: 'موافق عليها',
  rejected: 'مرفوضة',
  locked: 'مقفلة',
};

const statusColors = {
  draft: 'bg-sky-50 text-sky-700',
  submitted: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  locked: 'bg-sky-500 text-white',
};

export default function ReportsPage() {
  const dispatch = useAppDispatch();
  const { reports = [], loading, currentReport } = useAppSelector((state) => state.reports);
  const { cases = [] } = useAppSelector((state) => state.cases);

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [createFormData, setCreateFormData] = useState({
    report_type: 'clinical_case',
    target_type: 'case',
    target_id: '',
    title: '',
    description: '',
    content: '',
  });
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    content: '',
  });
  const [approveFormData, setApproveFormData] = useState({
    review_notes: '',
    score: '',
  });
  const [rejectFormData, setRejectFormData] = useState({
    review_notes: '',
  });
  const [localFilters, setLocalFilters] = useState({
    report_type: '',
    status: '',
    date_from: '',
    date_to: '',
  });

  useEffect(() => {
    dispatch(fetchReports());
    dispatch(fetchCases());
  }, [dispatch]);

  useEffect(() => {
    if (selectedReportId) {
      dispatch(fetchReportById(selectedReportId));
    }
  }, [selectedReportId, dispatch]);

  const filteredReports = Array.isArray(reports) ? reports.filter((report) => {
    const matchesSearch =
      report.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.report_type?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      !localFilters.report_type || report.report_type === localFilters.report_type;
    const matchesStatus = !localFilters.status || report.status === localFilters.status;

    const reportDate = new Date(report.created_at);
    const matchesDateFrom =
      !localFilters.date_from || reportDate >= new Date(localFilters.date_from);
    const matchesDateTo =
      !localFilters.date_to || reportDate <= new Date(localFilters.date_to);

    return matchesSearch && matchesType && matchesStatus && matchesDateFrom && matchesDateTo;
  }) : [];

  const handleCreateReport = async () => {
    if (!createFormData.title || !createFormData.target_id) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      // تحويل content من string إلى object إذا كان string
      let contentObj = {};
      if (createFormData.content) {
        try {
          contentObj = typeof createFormData.content === 'string' 
            ? JSON.parse(createFormData.content) 
            : createFormData.content;
        } catch (e) {
          // إذا فشل parsing، نستخدمه كـ summary
          contentObj = { summary: createFormData.content };
        }
      }

      const result = await dispatch(createReport({
        report_type: createFormData.report_type,
        target_type: createFormData.target_type,
        target_id: createFormData.target_id,
        title: createFormData.title,
        description: createFormData.description || '',
        content: contentObj,
      }));

      if (createReport.fulfilled.match(result)) {
        toast.success('تم إنشاء التقرير بنجاح');
        setShowCreateModal(false);
        setCreateFormData({
          report_type: 'clinical_case',
          target_type: 'case',
          target_id: '',
          title: '',
          description: '',
          content: '',
        });
        dispatch(fetchReports());
      } else {
        const errorMessage = result.payload?.message || 
                           result.payload?.error || 
                           'فشل إنشاء التقرير';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء التقرير');
    }
  };

  const handleEditReport = (report) => {
    // التحقق من أن التقرير في حالة draft أو rejected
    if (report.status !== 'draft' && report.status !== 'rejected') {
      toast.error('يمكن تعديل التقارير في حالة draft أو rejected فقط');
      return;
    }
    
    setSelectedReport(report);
    setSelectedReportId(report.id);
    
    // تحويل content من object إلى string إذا كان object
    let contentString = '';
    if (report.content) {
      if (typeof report.content === 'object') {
        contentString = JSON.stringify(report.content, null, 2);
      } else {
        contentString = report.content;
      }
    }
    
    setEditFormData({
      title: report.title || '',
      description: report.description || '',
      content: contentString,
    });
    setShowEditModal(true);
  };

  const handleUpdateReport = async () => {
    if (!selectedReportId || !selectedReport) return;

    if (!editFormData.title) {
      toast.error('العنوان مطلوب');
      return;
    }

    try {
      const result = await dispatch(updateReport({
        reportId: selectedReportId,
        title: editFormData.title,
        description: editFormData.description,
        content: editFormData.content,
      }));

      if (updateReport.fulfilled.match(result)) {
        toast.success('تم تحديث التقرير بنجاح');
        setShowEditModal(false);
        setSelectedReport(null);
        setSelectedReportId(null);
        setEditFormData({ title: '', description: '', content: '' });
        dispatch(fetchReports());
        if (showDetailsModal) {
          dispatch(fetchReportById(selectedReportId));
        }
      } else {
        const errorMessage = result.payload?.message || 
                           result.payload?.error || 
                           'فشل تحديث التقرير';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث التقرير');
    }
  };

  const handleViewDetails = async (reportId) => {
    setSelectedReportId(reportId);
    setShowDetailsModal(true);
  };

  const handleApproveReport = async () => {
    if (!selectedReportId) return;

    try {
      const result = await dispatch(approveReport({
        reportId: selectedReportId,
        review_notes: approveFormData.review_notes,
        score: approveFormData.score,
      }));
      
      if (approveReport.fulfilled.match(result)) {
        toast.success('تم اعتماد التقرير بنجاح');
        setShowApproveModal(false);
        setSelectedReportId(null);
        setApproveFormData({ review_notes: '', score: '' });
        dispatch(fetchReports());
        if (showDetailsModal) {
          dispatch(fetchReportById(selectedReportId));
        }
      } else {
        const errorMessage = result.payload?.message || 
                           result.payload?.error || 
                           'فشل اعتماد التقرير';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء اعتماد التقرير');
    }
  };

  const handleSubmitReport = async (reportId) => {
    if (!confirm('هل أنت متأكد من تقديم هذا التقرير؟ بعد التقديم سيتم إرساله للمراجعة.')) {
      return;
    }

    try {
      const result = await dispatch(submitReport(reportId));
      
      if (submitReport.fulfilled.match(result)) {
        toast.success('تم تقديم التقرير بنجاح');
        dispatch(fetchReports());
        if (showDetailsModal && selectedReportId === reportId) {
          dispatch(fetchReportById(reportId));
        }
      } else {
        const errorMessage = result.payload?.message || 
                           result.payload?.error || 
                           'فشل تقديم التقرير';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تقديم التقرير');
    }
  };

  const handleRejectReport = async () => {
    if (!selectedReportId) return;

    if (!rejectFormData.review_notes || !rejectFormData.review_notes.trim()) {
      toast.error('يرجى إدخال ملاحظات الرفض');
      return;
    }

    try {
      const result = await dispatch(rejectReport({
        reportId: selectedReportId,
        review_notes: rejectFormData.review_notes,
      }));
      
      if (rejectReport.fulfilled.match(result)) {
        toast.success('تم رفض التقرير بنجاح');
        setShowRejectModal(false);
        setSelectedReportId(null);
        setRejectFormData({ review_notes: '' });
        dispatch(fetchReports());
        if (showDetailsModal) {
          dispatch(fetchReportById(selectedReportId));
        }
      } else {
        const errorMessage = result.payload?.message || 
                           result.payload?.error || 
                           'فشل رفض التقرير';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء رفض التقرير');
    }
  };


  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
            التقارير
          </h1>
          <p className="text-sm sm:text-base text-dark-lighter leading-relaxed" style={{ fontFamily: 'inherit' }}>
            عرض ومراجعة تقارير الحالات المشرف عليها
          </p>
        </div>
        <button
          onClick={() => {
            setCreateFormData({
              report_type: 'clinical_case',
              target_type: 'case',
              target_id: '',
              title: '',
              description: '',
              content: '',
            });
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2.5 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30"
        >
          <PlusIcon className="h-5 w-5" />
          تقرير جديد
        </button>
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
              placeholder="ابحث عن تقرير..."
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
          <div className="mt-5 pt-5 grid grid-cols-1 gap-4 border-t border-sky-100 md:grid-cols-4">
            <div>
              <label className="block text-sm font-semibold text-dark mb-2.5">نوع التقرير</label>
              <select
                value={localFilters.report_type}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, report_type: e.target.value })
                }
                className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
              >
                <option value="">جميع الأنواع</option>
                {Object.entries(reportTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
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
              <label className="block text-sm font-semibold text-dark mb-2.5">من تاريخ</label>
              <input
                type="date"
                value={localFilters.date_from}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, date_from: e.target.value })
                }
                className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark mb-2.5">إلى تاريخ</label>
              <input
                type="date"
                value={localFilters.date_to}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, date_to: e.target.value })
                }
                className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Reports List */}
      <div className="rounded-lg bg-white border border-sky-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent"></div>
            <p className="mt-4 text-base font-semibold text-dark-lighter leading-relaxed">جاري تحميل التقارير...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center">
            <ChartBarIcon className="mx-auto h-12 w-12 text-dark-lighter" />
            <p className="mt-4 text-base font-semibold text-dark leading-relaxed">لا توجد تقارير</p>
            <p className="mt-2 text-sm text-dark-lighter leading-relaxed">
              {searchTerm || localFilters.report_type || localFilters.status
                ? 'لا توجد تقارير تطابق معايير البحث'
                : 'لم يتم إنشاء أي تقارير بعد'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-sky-100">
            {filteredReports.map((report) => (
              <div key={report.id} className="p-5 sm:p-6 hover:bg-sky-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h3 className="text-lg font-semibold text-dark leading-relaxed">
                        {report.title || 'تقرير بدون عنوان'}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                          statusColors[report.status] || statusColors.draft
                        }`}
                      >
                        {statusLabels[report.status] || report.status}
                      </span>
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700 whitespace-nowrap">
                        {reportTypeLabels[report.report_type] || report.report_type}
                      </span>
                    </div>

                    {report.description && (
                      <p className="text-sm text-dark-lighter mb-4 line-clamp-2 leading-relaxed">
                        {report.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-dark-lighter flex-wrap">
                      {report.created_at && (
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-sky-500 flex-shrink-0" />
                          <span>
                            {new Date(report.created_at).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                      {report.created_by && (
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-sky-500 flex-shrink-0" />
                          <span>
                            {report.created_by?.first_name} {report.created_by?.last_name}
                          </span>
                        </div>
                      )}
                      {report.file_url && (
                        <div className="flex items-center gap-2 text-sky-600">
                          <DocumentArrowDownIcon className="h-4 w-4 flex-shrink-0" />
                          <span className="font-semibold">ملف متاح للتحميل</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0 flex-wrap">
                    <button
                      onClick={() => handleViewDetails(report.id)}
                      className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    >
                      <EyeIcon className="h-4 w-4" />
                      عرض التفاصيل
                    </button>
                    {(report.status === 'draft' || report.status === 'rejected') && (
                      <>
                        <button
                          onClick={() => handleEditReport(report)}
                          className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                        >
                          <PencilIcon className="h-4 w-4" />
                          تعديل
                        </button>
                        <button
                          onClick={() => handleSubmitReport(report.id)}
                          className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        >
                          <PaperAirplaneIcon className="h-4 w-4" />
                          تقديم
                        </button>
                      </>
                    )}
                    {report.status === 'submitted' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedReportId(report.id);
                            setApproveFormData({ review_notes: '', score: '' });
                            setShowApproveModal(true);
                          }}
                          className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/30"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          موافقة
                        </button>
                        <button
                          onClick={() => {
                            setSelectedReportId(report.id);
                            setRejectFormData({ review_notes: '' });
                            setShowRejectModal(true);
                          }}
                          className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30"
                        >
                          <XCircleIcon className="h-4 w-4" />
                          رفض
                        </button>
                      </>
                    )}
                    {report.file_url && (
                      <a
                        href={report.file_url}
                        download
                        className="flex items-center gap-2 rounded-lg bg-sky-400 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                        تحميل
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Details Modal */}
      {showDetailsModal && currentReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white border border-sky-100 p-6 max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="text-xl font-semibold text-dark mb-5" style={{ fontFamily: 'inherit' }}>تفاصيل التقرير</h3>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">العنوان</label>
                <p className="text-sm font-semibold text-dark leading-relaxed">{currentReport.title || 'بدون عنوان'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">نوع التقرير</label>
                  <p className="text-sm font-semibold text-dark leading-relaxed">
                    {reportTypeLabels[currentReport.report_type] || currentReport.report_type}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">الحالة</label>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                      statusColors[currentReport.status] || statusColors.draft
                    }`}
                  >
                    {statusLabels[currentReport.status] || currentReport.status}
                  </span>
                </div>
              </div>

              {currentReport.description && (
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">الوصف</label>
                  <p className="text-sm text-dark whitespace-pre-wrap leading-relaxed">{currentReport.description}</p>
                </div>
              )}

              {currentReport.created_at && (
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">تاريخ الإنشاء</label>
                  <p className="text-sm text-dark leading-relaxed">
                    {new Date(currentReport.created_at).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}

              {currentReport.file_url && (
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">الملف</label>
                  <a
                    href={currentReport.file_url}
                    download
                    className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-semibold transition-colors"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5" />
                    <span>تحميل التقرير</span>
                  </a>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              {(currentReport.status === 'draft' || currentReport.status === 'rejected') && (
                <>
                  <button
                    onClick={() => handleEditReport(currentReport)}
                    className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  >
                    <PencilIcon className="h-5 w-5" />
                    تعديل
                  </button>
                  <button
                    onClick={() => {
                      handleSubmitReport(currentReport.id);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                    تقديم التقرير
                  </button>
                </>
              )}
              {currentReport.status === 'submitted' && (
                <>
                  <button
                    onClick={() => {
                      setSelectedReportId(currentReport.id);
                      setApproveFormData({ review_notes: '', score: '' });
                      setShowApproveModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/30"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    موافقة
                  </button>
                  <button
                    onClick={() => {
                      setSelectedReportId(currentReport.id);
                      setRejectFormData({ review_notes: '' });
                      setShowRejectModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  >
                    <XCircleIcon className="h-5 w-5" />
                    رفض
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedReportId(null);
                }}
                className="flex-1 rounded-lg border-2 border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark hover:bg-sky-50 hover:border-sky-300 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/20"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Report Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white border border-sky-100 p-6 max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="text-xl font-semibold text-dark mb-5" style={{ fontFamily: 'inherit' }}>
              الموافقة على التقرير
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-dark mb-2.5">
                  ملاحظات المراجعة (اختياري)
                </label>
                <textarea
                  value={approveFormData.review_notes}
                  onChange={(e) => setApproveFormData({ ...approveFormData, review_notes: e.target.value })}
                  rows={4}
                  placeholder="أدخل ملاحظات المراجعة..."
                  className="w-full rounded-lg border-2 border-green-200 bg-green-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-green-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-400/20 transition-all duration-200 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-2.5">
                  النقاط (اختياري)
                </label>
                <input
                  type="number"
                  value={approveFormData.score}
                  onChange={(e) => setApproveFormData({ ...approveFormData, score: e.target.value })}
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="أدخل النقاط (0-100)"
                  className="w-full rounded-lg border-2 border-green-200 bg-green-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-green-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-400/20 transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleApproveReport}
                className="flex-1 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/30"
              >
                موافقة
              </button>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedReportId(null);
                  setApproveFormData({ review_notes: '', score: '' });
                }}
                className="flex-1 rounded-lg border-2 border-green-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark hover:bg-green-50 hover:border-green-300 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400/20"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Report Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white border border-sky-100 p-6 max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="text-xl font-semibold text-dark mb-5" style={{ fontFamily: 'inherit' }}>
              رفض التقرير
            </h3>

            <div className="space-y-5">
              <div className="rounded-lg bg-red-50 border-2 border-red-200 p-4">
                <p className="text-sm font-semibold text-red-800 mb-2">تنبيه</p>
                <p className="text-sm text-red-700">
                  يجب إدخال ملاحظات المراجعة عند رفض التقرير لتوضيح سبب الرفض.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-2.5">
                  ملاحظات المراجعة <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={rejectFormData.review_notes}
                  onChange={(e) => setRejectFormData({ ...rejectFormData, review_notes: e.target.value })}
                  rows={6}
                  placeholder="أدخل ملاحظات المراجعة (مطلوب)..."
                  required
                  className="w-full rounded-lg border-2 border-red-200 bg-red-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-400/20 transition-all duration-200 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleRejectReport}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30"
              >
                رفض
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedReportId(null);
                  setRejectFormData({ review_notes: '' });
                }}
                className="flex-1 rounded-lg border-2 border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark hover:bg-red-50 hover:border-red-300 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400/20"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Report Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 p-4">
          <div className="w-full max-w-3xl rounded-lg bg-white border border-sky-100 p-6 max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="text-xl font-semibold text-dark mb-5" style={{ fontFamily: 'inherit' }}>
              إنشاء تقرير جديد
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-dark mb-2.5">
                  نوع التقرير <span className="text-sky-600">*</span>
                </label>
                <select
                  value={createFormData.report_type}
                  onChange={(e) => setCreateFormData({ ...createFormData, report_type: e.target.value })}
                  required
                  className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                >
                  <option value="clinical_case">تقرير حالة سريرية</option>
                  <option value="cases">تقرير الحالات</option>
                  <option value="sessions">تقرير الجلسات</option>
                  <option value="appointments">تقرير المواعيد</option>
                  <option value="evaluations">تقرير التقييمات</option>
                  <option value="summary">تقرير شامل</option>
                  <option value="custom">تقرير مخصص</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-2.5">
                  نوع الهدف <span className="text-sky-600">*</span>
                </label>
                <select
                  value={createFormData.target_type}
                  onChange={(e) => setCreateFormData({ ...createFormData, target_type: e.target.value, target_id: '' })}
                  required
                  className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                >
                  <option value="case">حالة سريرية</option>
                  <option value="session">جلسة</option>
                  <option value="appointment">موعد</option>
                </select>
              </div>

              {createFormData.target_type === 'case' && (
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2.5">
                    الحالة السريرية <span className="text-sky-600">*</span>
                  </label>
                  <select
                    value={createFormData.target_id}
                    onChange={(e) => setCreateFormData({ ...createFormData, target_id: e.target.value })}
                    required
                    className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                  >
                    <option value="">اختر الحالة</option>
                    {Array.isArray(cases) && cases.map((caseItem) => (
                      <option key={caseItem.id} value={caseItem.id}>
                        {caseItem.title || `حالة ${caseItem.id.substring(0, 8)}...`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(createFormData.target_type === 'session' || createFormData.target_type === 'appointment') && (
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2.5">
                    معرف {createFormData.target_type === 'session' ? 'الجلسة' : 'الموعد'} <span className="text-sky-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={createFormData.target_id}
                    onChange={(e) => setCreateFormData({ ...createFormData, target_id: e.target.value })}
                    required
                    placeholder={`أدخل معرف ${createFormData.target_type === 'session' ? 'الجلسة' : 'الموعد'} (UUID)`}
                    className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-dark mb-2.5">
                  العنوان <span className="text-sky-600">*</span>
                </label>
                <input
                  type="text"
                  value={createFormData.title}
                  onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                  required
                  placeholder="أدخل عنوان التقرير"
                  className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-2.5">
                  الوصف (اختياري)
                </label>
                <textarea
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                  rows={3}
                  placeholder="ملخص قصير للتقرير..."
                  className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-2.5">
                  المحتوى (JSON أو نص) (اختياري)
                </label>
                <textarea
                  value={createFormData.content}
                  onChange={(e) => setCreateFormData({ ...createFormData, content: e.target.value })}
                  rows={6}
                  placeholder='{"diagnosis": "...", "sessions": []} أو نص عادي'
                  className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200 resize-none font-mono text-xs"
                />
                <p className="mt-1 text-xs text-dark-lighter">
                  يمكنك إدخال JSON مثل: {"{"}"diagnosis": "...", "sessions": []{"}"} أو نص عادي
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateReport}
                className="flex-1 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              >
                إنشاء
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateFormData({
                    report_type: 'clinical_case',
                    target_type: 'case',
                    target_id: '',
                    title: '',
                    description: '',
                    content: '',
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

      {/* Edit Report Modal */}
      {showEditModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 p-4">
          <div className="w-full max-w-3xl rounded-lg bg-white border border-sky-100 p-6 max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="text-xl font-semibold text-dark mb-5" style={{ fontFamily: 'inherit' }}>
              تعديل التقرير
            </h3>

            <div className="space-y-5">
              <div className="rounded-lg bg-orange-50 border-2 border-orange-200 p-4">
                <p className="text-sm font-semibold text-orange-800 mb-2">معلومات التقرير</p>
                <div className="text-sm text-orange-700 space-y-1">
                  <p>النوع: {reportTypeLabels[selectedReport.report_type] || selectedReport.report_type}</p>
                  <p>الحالة: {statusLabels[selectedReport.status] || selectedReport.status}</p>
                  <p>نوع الهدف: {selectedReport.target_type}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-2.5">
                  العنوان <span className="text-orange-600">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  required
                  placeholder="أدخل عنوان التقرير"
                  className="w-full rounded-lg border-2 border-orange-200 bg-orange-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-2.5">
                  الوصف (اختياري)
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={3}
                  placeholder="ملخص قصير للتقرير..."
                  className="w-full rounded-lg border-2 border-orange-200 bg-orange-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition-all duration-200 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-2.5">
                  المحتوى (JSON أو نص) (اختياري)
                </label>
                <textarea
                  value={editFormData.content}
                  onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                  rows={8}
                  placeholder='{"diagnosis": "...", "sessions": []} أو نص عادي'
                  className="w-full rounded-lg border-2 border-orange-200 bg-orange-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition-all duration-200 resize-none font-mono text-xs"
                />
                <p className="mt-1 text-xs text-dark-lighter">
                  يمكنك إدخال JSON مثل: {"{"}"diagnosis": "...", "sessions": []{"}"} أو نص عادي
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateReport}
                className="flex-1 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              >
                حفظ التغييرات
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedReport(null);
                  setSelectedReportId(null);
                  setEditFormData({ title: '', description: '', content: '' });
                }}
                className="flex-1 rounded-lg border-2 border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark hover:bg-orange-50 hover:border-orange-300 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400/20"
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









