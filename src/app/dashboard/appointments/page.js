'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  fetchAppointments,
} from '@/store/slices/appointmentsSlice';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const statusLabels = {
  scheduled: 'مجدولة',
  rescheduled: 'أعيد جدولتها',
  completed: 'مكتملة',
  cancelled: 'ملغاة',
  no_show: 'لم يحضر',
};

const statusColors = {
  scheduled: 'bg-sky-100 text-sky-800',
  rescheduled: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-gray-100 text-gray-800',
};

export default function AppointmentsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { appointments = [], loading } = useAppSelector((state) => state.appointments);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    status: '',
    case_id: '',
    date_from: '',
    date_to: '',
  });

  useEffect(() => {
    dispatch(fetchAppointments());
  }, [dispatch]);

  const filteredAppointments = Array.isArray(appointments) ? appointments.filter((appointment) => {
    const matchesSearch =
      appointment.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.case?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patient?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patient?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !localFilters.status || appointment.status === localFilters.status;
    const matchesCase = !localFilters.case_id || appointment.case === localFilters.case_id;

    const appointmentDate = new Date(appointment.appointment_date);
    const matchesDateFrom =
      !localFilters.date_from || appointmentDate >= new Date(localFilters.date_from);
    const matchesDateTo =
      !localFilters.date_to || appointmentDate <= new Date(localFilters.date_to);

    return matchesSearch && matchesStatus && matchesCase && matchesDateFrom && matchesDateTo;
  }) : [];


  const stats = {
    total: Array.isArray(appointments) ? appointments.length : 0,
    scheduled: Array.isArray(appointments) ? appointments.filter((a) => a.status === 'scheduled').length : 0,
    rescheduled: Array.isArray(appointments) ? appointments.filter((a) => a.status === 'rescheduled').length : 0,
    completed: Array.isArray(appointments) ? appointments.filter((a) => a.status === 'completed').length : 0,
    today: Array.isArray(appointments) ? appointments.filter((a) => {
      const today = new Date().toISOString().split('T')[0];
      const scheduledDate = a.scheduled_at || a.appointment_date;
      return scheduledDate && scheduledDate.startsWith(today);
    }).length : 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
          إدارة المواعيد
        </h1>
        <p className="text-sm sm:text-base text-dark-lighter leading-relaxed" style={{ fontFamily: 'inherit' }}>
          عرض جميع المواعيد المرتبطة بالحالات المشرف عليها
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg bg-white border border-sky-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-lighter mb-2" style={{ fontFamily: 'inherit' }}>
                إجمالي المواعيد
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-dark" style={{ fontFamily: 'inherit' }}>
                {stats.total}
              </p>
            </div>
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-sky-500" />
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white border border-sky-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-lighter mb-2" style={{ fontFamily: 'inherit' }}>
                مجدولة
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-dark" style={{ fontFamily: 'inherit' }}>
                {stats.scheduled}
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
              <div className="h-4 w-4 rounded-full bg-sky-500"></div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white border border-sky-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-lighter mb-2" style={{ fontFamily: 'inherit' }}>
                أعيد جدولتها
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-dark" style={{ fontFamily: 'inherit' }}>
                {stats.rescheduled}
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <div className="h-4 w-4 rounded-full bg-yellow-600"></div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white border border-sky-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-lighter mb-2" style={{ fontFamily: 'inherit' }}>
                مكتملة
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-dark" style={{ fontFamily: 'inherit' }}>
                {stats.completed}
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-sky-300 flex items-center justify-center flex-shrink-0">
              <div className="h-4 w-4 rounded-full bg-sky-700"></div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white border border-sky-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-lighter mb-2" style={{ fontFamily: 'inherit' }}>
                اليوم
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-dark" style={{ fontFamily: 'inherit' }}>
                {stats.today}
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
              <div className="h-4 w-4 rounded-full bg-sky-400"></div>
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
              placeholder="بحث في المواعيد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 pr-10 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all"
              style={{ fontFamily: 'inherit' }}
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm font-medium text-dark hover:bg-sky-50 hover:border-sky-300 transition-all focus:outline-none focus:ring-2 focus:ring-sky-400/20"
            style={{ fontFamily: 'inherit' }}
          >
            <FunnelIcon className="h-5 w-5" />
            فلترة
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-5 grid grid-cols-1 gap-4 border-t border-sky-100 pt-5 md:grid-cols-4">
            <div>
              <label className="block text-sm font-semibold text-dark mb-2.5" style={{ fontFamily: 'inherit' }}>
                الحالة
              </label>
              <select
                value={localFilters.status}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, status: e.target.value })
                }
                className="w-full rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all"
                style={{ fontFamily: 'inherit' }}
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
              <label className="block text-sm font-semibold text-dark mb-2.5" style={{ fontFamily: 'inherit' }}>
                الحالة السريرية
              </label>
              <select
                value={localFilters.case_id}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, case_id: e.target.value })
                }
                className="w-full rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all"
                style={{ fontFamily: 'inherit' }}
              >
                <option value="">جميع الحالات</option>
                {Array.isArray(appointments) && Array.from(new Set(appointments.map(a => a.case).filter(Boolean))).map((caseId) => {
                  const appointment = appointments.find(a => a.case === caseId);
                  return (
                    <option key={caseId} value={caseId}>
                      {appointment?.case?.title || `الحالة ${caseId}`}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark mb-2.5" style={{ fontFamily: 'inherit' }}>
                من تاريخ
              </label>
              <input
                type="date"
                value={localFilters.date_from}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, date_from: e.target.value })
                }
                className="w-full rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all"
                style={{ fontFamily: 'inherit' }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark mb-2.5" style={{ fontFamily: 'inherit' }}>
                إلى تاريخ
              </label>
              <input
                type="date"
                value={localFilters.date_to}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, date_to: e.target.value })
                }
                className="w-full rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all"
                style={{ fontFamily: 'inherit' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Appointments List */}
      <div className="rounded-lg bg-white border border-sky-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent"></div>
            <p className="mt-4 text-sm text-dark-lighter" style={{ fontFamily: 'inherit' }}>
              جاري تحميل المواعيد...
            </p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-dark-lighter" />
            <p className="mt-4 text-base font-semibold text-dark" style={{ fontFamily: 'inherit' }}>
              لا توجد مواعيد
            </p>
            <p className="mt-2 text-sm text-dark-lighter leading-relaxed" style={{ fontFamily: 'inherit' }}>
              {searchTerm || localFilters.status || localFilters.case_id || localFilters.date_from || localFilters.date_to
                ? 'لا توجد مواعيد تطابق معايير البحث'
                : 'لا توجد مواعيد'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-sky-100">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="p-5 sm:p-6 hover:bg-sky-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                      <h3 className="text-base sm:text-lg font-semibold text-dark" style={{ fontFamily: 'inherit' }}>
                        {appointment.case?.title || 'موعد سريري'}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                          statusColors[appointment.status] || statusColors.scheduled
                        }`}
                        style={{ fontFamily: 'inherit' }}
                      >
                        {statusLabels[appointment.status] || appointment.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <div className="flex items-center gap-2.5 text-sm text-dark-lighter">
                        <ClockIcon className="h-5 w-5 text-sky-500 flex-shrink-0" />
                        <span style={{ fontFamily: 'inherit' }}>
                          {appointment.scheduled_at
                            ? new Date(appointment.scheduled_at).toLocaleDateString('ar-SA', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : appointment.appointment_date
                            ? new Date(appointment.appointment_date).toLocaleDateString('ar-SA', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'غير محدد'}
                          {appointment.scheduled_at && (
                            <span className="font-medium text-dark mr-2">
                              - {new Date(appointment.scheduled_at).toLocaleTimeString('ar-SA', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                            </span>
                          )}
                          {!appointment.scheduled_at && appointment.appointment_time && (
                            <span className="font-medium text-dark mr-2">
                              - {appointment.appointment_time}
                            </span>
                          )}
                        </span>
                      </div>
                      {appointment.location && (
                        <div className="flex items-center gap-2.5 text-sm text-dark-lighter">
                          <BuildingOfficeIcon className="h-5 w-5 text-sky-500 flex-shrink-0" />
                          <span style={{ fontFamily: 'inherit' }}>{appointment.location}</span>
                        </div>
                      )}
                      {appointment.patient && (
                        <div className="flex items-center gap-2.5 text-sm text-dark-lighter">
                          <UserIcon className="h-5 w-5 text-sky-500 flex-shrink-0" />
                          <span style={{ fontFamily: 'inherit' }}>
                            <span className="font-medium text-dark">
                              {appointment.patient?.first_name} {appointment.patient?.last_name}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>

                    {appointment.notes && (
                      <p className="mt-4 text-sm text-dark-lighter line-clamp-2 leading-relaxed" style={{ fontFamily: 'inherit' }}>
                        {appointment.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => router.push(`/dashboard/appointments/${appointment.id}`)}
                      className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 transition-colors"
                      style={{ fontFamily: 'inherit' }}
                    >
                      <EyeIcon className="h-5 w-5" />
                      عرض التفاصيل
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}









