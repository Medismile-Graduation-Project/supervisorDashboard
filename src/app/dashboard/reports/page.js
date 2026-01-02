'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { fetchReports, fetchReportById, approveReport, rejectReport } from '@/store/slices/reportsSlice';
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
  generated: 'مولّد',
  completed: 'مكتمل',
};

const statusColors = {
  draft: 'bg-sky-50 text-sky-700',
  generated: 'bg-sky-200 text-sky-800',
  completed: 'bg-sky-500 text-white',
};

export default function ReportsPage() {
  const dispatch = useAppDispatch();
  const { reports = [], loading, currentReport } = useAppSelector((state) => state.reports);

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [localFilters, setLocalFilters] = useState({
    report_type: '',
    status: '',
    date_from: '',
    date_to: '',
  });

  useEffect(() => {
    dispatch(fetchReports());
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

  const handleViewDetails = async (reportId) => {
    setSelectedReportId(reportId);
    setShowDetailsModal(true);
  };

  const handleApproveReport = async (reportId) => {
    try {
      const result = await dispatch(approveReport(reportId));
      if (approveReport.fulfilled.match(result)) {
        toast.success('تم اعتماد التقرير بنجاح');
        dispatch(fetchReports());
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

  const handleRejectReport = async (reportId) => {
    try {
      const result = await dispatch(rejectReport(reportId));
      if (rejectReport.fulfilled.match(result)) {
        toast.success('تم رفض التقرير بنجاح');
        dispatch(fetchReports());
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
      <div className="mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
          التقارير
        </h1>
        <p className="text-sm sm:text-base text-dark-lighter leading-relaxed" style={{ fontFamily: 'inherit' }}>
          عرض ومراجعة تقارير الحالات المشرف عليها
        </p>
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
                    {report.status !== 'approved' && report.status !== 'rejected' && (
                      <>
                        <button
                          onClick={() => handleApproveReport(report.id)}
                          className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          اعتماد
                        </button>
                        <button
                          onClick={() => handleRejectReport(report.id)}
                          className="flex items-center gap-2 rounded-lg bg-dark-lighter px-4 py-2 text-sm font-semibold text-white hover:bg-dark transition-colors focus:outline-none focus:ring-2 focus:ring-dark-lighter/30"
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
              {currentReport.status !== 'approved' && currentReport.status !== 'rejected' && (
                <>
                  <button
                    onClick={() => {
                      handleApproveReport(currentReport.id);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    اعتماد
                  </button>
                  <button
                    onClick={() => {
                      handleRejectReport(currentReport.id);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-dark-lighter px-4 py-2.5 text-sm font-semibold text-white hover:bg-dark transition-colors focus:outline-none focus:ring-2 focus:ring-dark-lighter/30"
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
    </div>
  );
}









