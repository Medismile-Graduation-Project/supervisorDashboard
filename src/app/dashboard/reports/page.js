'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { fetchReports, createReport } from '@/store/slices/reportsSlice';
import { fetchCases } from '@/store/slices/casesSlice';
import { fetchSessions } from '@/store/slices/sessionsSlice';
import { fetchAppointments } from '@/store/slices/appointmentsSlice';
import { fetchEvaluations } from '@/store/slices/evaluationsSlice';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  PlusIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
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
  draft: 'bg-gray-100 text-gray-800',
  generated: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
};

export default function ReportsPage() {
  const dispatch = useAppDispatch();
  const { reports, loading } = useAppSelector((state) => state.reports);
  const { cases } = useAppSelector((state) => state.cases);
  const { sessions } = useAppSelector((state) => state.sessions);
  const { appointments } = useAppSelector((state) => state.appointments);
  const { evaluations } = useAppSelector((state) => state.evaluations);

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    report_type: '',
    status: '',
    date_from: '',
    date_to: '',
  });
  const [formData, setFormData] = useState({
    title: '',
    report_type: 'summary',
    description: '',
    date_from: '',
    date_to: '',
    include_cases: true,
    include_sessions: true,
    include_appointments: true,
    include_evaluations: true,
  });

  useEffect(() => {
    dispatch(fetchReports());
    dispatch(fetchCases());
    dispatch(fetchSessions());
    dispatch(fetchAppointments());
    dispatch(fetchEvaluations());
  }, [dispatch]);

  const filteredReports = reports.filter((report) => {
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
  });

  const handleCreateReport = async () => {
    try {
      const result = await dispatch(createReport(formData));
      if (createReport.fulfilled.match(result)) {
        toast.success('تم إنشاء التقرير بنجاح');
        setShowCreateModal(false);
        setFormData({
          title: '',
          report_type: 'summary',
          description: '',
          date_from: '',
          date_to: '',
          include_cases: true,
          include_sessions: true,
          include_appointments: true,
          include_evaluations: true,
        });
        dispatch(fetchReports());
      } else {
        toast.error(result.payload?.message || 'فشل إنشاء التقرير');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء التقرير');
    }
  };

  const handleDownloadReport = (report) => {
    // يمكن إضافة منطق تحميل التقرير هنا
    toast.success('جاري تحميل التقرير...');
  };

  // إحصائيات سريعة
  const quickStats = {
    totalCases: cases.length,
    totalSessions: sessions.length,
    totalAppointments: appointments.length,
    totalEvaluations: evaluations.length,
    completedCases: cases.filter((c) => c.status === 'completed').length,
    approvedSessions: sessions.filter((s) => s.status === 'approved').length,
    scheduledAppointments: appointments.filter((a) => a.status === 'scheduled').length,
    finalizedEvaluations: evaluations.filter((e) => e.status === 'finalized').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">التقارير والإحصائيات</h1>
          <p className="mt-1 text-sm text-dark-lighter">
            عرض وإنشاء التقارير والإحصائيات الشاملة
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              title: '',
              report_type: 'summary',
              description: '',
              date_from: '',
              date_to: '',
              include_cases: true,
              include_sessions: true,
              include_appointments: true,
              include_evaluations: true,
            });
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          تقرير جديد
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">إجمالي الحالات</p>
              <p className="mt-1 text-2xl font-bold text-dark">{quickStats.totalCases}</p>
              <p className="text-xs text-dark-lighter mt-1">
                {quickStats.completedCases} مكتملة
              </p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-sky-500" />
          </div>
        </div>
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">إجمالي الجلسات</p>
              <p className="mt-1 text-2xl font-bold text-dark">{quickStats.totalSessions}</p>
              <p className="text-xs text-dark-lighter mt-1">
                {quickStats.approvedSessions} موافق عليها
              </p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">إجمالي المواعيد</p>
              <p className="mt-1 text-2xl font-bold text-dark">{quickStats.totalAppointments}</p>
              <p className="text-xs text-dark-lighter mt-1">
                {quickStats.scheduledAppointments} مجدولة
              </p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">إجمالي التقييمات</p>
              <p className="mt-1 text-2xl font-bold text-dark">{quickStats.totalEvaluations}</p>
              <p className="text-xs text-dark-lighter mt-1">
                {quickStats.finalizedEvaluations} نهائية
              </p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-purple-500" />
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
              placeholder="بحث في التقارير..."
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
          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-light-gray pt-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-2">نوع التقرير</label>
              <select
                value={localFilters.report_type}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, report_type: e.target.value })
                }
                className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
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
              <label className="block text-sm font-medium text-dark mb-2">من تاريخ</label>
              <input
                type="date"
                value={localFilters.date_from}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, date_from: e.target.value })
                }
                className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-2">إلى تاريخ</label>
              <input
                type="date"
                value={localFilters.date_to}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, date_to: e.target.value })
                }
                className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Reports List */}
      <div className="rounded-lg bg-light border border-light-gray overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent"></div>
            <p className="mt-4 text-sm text-dark-lighter">جاري تحميل التقارير...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-8 text-center">
            <ChartBarIcon className="mx-auto h-12 w-12 text-dark-lighter" />
            <p className="mt-4 text-sm font-medium text-dark">لا توجد تقارير</p>
            <p className="mt-1 text-sm text-dark-lighter">
              {searchTerm || localFilters.report_type || localFilters.status
                ? 'لا توجد تقارير تطابق معايير البحث'
                : 'لم يتم إنشاء أي تقارير بعد'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-light-gray">
            {filteredReports.map((report) => (
              <div key={report.id} className="p-6 hover:bg-light-gray transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-dark">
                        {report.title || 'تقرير بدون عنوان'}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusColors[report.status] || statusColors.draft
                        }`}
                      >
                        {statusLabels[report.status] || report.status}
                      </span>
                      <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800">
                        {reportTypeLabels[report.report_type] || report.report_type}
                      </span>
                    </div>

                    {report.description && (
                      <p className="text-sm text-dark-lighter mb-3 line-clamp-2">
                        {report.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-dark-lighter">
                      {report.created_at && (
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          <span>
                            {new Date(report.created_at).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                      {report.created_by && (
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4" />
                          <span>
                            {report.created_by?.first_name} {report.created_by?.last_name}
                          </span>
                        </div>
                      )}
                      {report.file_url && (
                        <div className="flex items-center gap-2 text-sky-600">
                          <DocumentArrowDownIcon className="h-4 w-4" />
                          <span>ملف متاح للتحميل</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {report.file_url && (
                      <button
                        onClick={() => handleDownloadReport(report)}
                        className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                        تحميل
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Report Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-light p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-dark mb-4">إنشاء تقرير جديد</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  عنوان التقرير <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="مثال: تقرير شهري - يناير 2025"
                  className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">نوع التقرير</label>
                <select
                  value={formData.report_type}
                  onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
                  className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  {Object.entries(reportTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="وصف التقرير..."
                  className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">من تاريخ</label>
                  <input
                    type="date"
                    value={formData.date_from}
                    onChange={(e) => setFormData({ ...formData, date_from: e.target.value })}
                    className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">إلى تاريخ</label>
                  <input
                    type="date"
                    value={formData.date_to}
                    onChange={(e) => setFormData({ ...formData, date_to: e.target.value })}
                    className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              {formData.report_type === 'summary' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-dark">تضمين في التقرير:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.include_cases}
                        onChange={(e) =>
                          setFormData({ ...formData, include_cases: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-dark-lighter text-sky-600 focus:ring-sky-500"
                      />
                      <span className="text-sm text-dark">الحالات</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.include_sessions}
                        onChange={(e) =>
                          setFormData({ ...formData, include_sessions: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-dark-lighter text-sky-600 focus:ring-sky-500"
                      />
                      <span className="text-sm text-dark">الجلسات</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.include_appointments}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            include_appointments: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-dark-lighter text-sky-600 focus:ring-sky-500"
                      />
                      <span className="text-sm text-dark">المواعيد</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.include_evaluations}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            include_evaluations: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-dark-lighter text-sky-600 focus:ring-sky-500"
                      />
                      <span className="text-sm text-dark">التقييمات</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateReport}
                className="flex-1 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
              >
                إنشاء
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({
                    title: '',
                    report_type: 'summary',
                    description: '',
                    date_from: '',
                    date_to: '',
                    include_cases: true,
                    include_sessions: true,
                    include_appointments: true,
                    include_evaluations: true,
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
    </div>
  );
}

