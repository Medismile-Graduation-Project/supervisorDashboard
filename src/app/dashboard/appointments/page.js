'use client';

import { useEffect, useState } from 'react';
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
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const statusLabels = {
  scheduled: 'مجدولة',
  confirmed: 'مؤكدة',
  completed: 'مكتملة',
  cancelled: 'ملغاة',
  no_show: 'لم يحضر',
};

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-sky-100 text-sky-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-gray-100 text-gray-800',
};

export default function AppointmentsPage() {
  const dispatch = useAppDispatch();
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
    confirmed: Array.isArray(appointments) ? appointments.filter((a) => a.status === 'confirmed').length : 0,
    completed: Array.isArray(appointments) ? appointments.filter((a) => a.status === 'completed').length : 0,
    today: Array.isArray(appointments) ? appointments.filter((a) => {
      const today = new Date().toISOString().split('T')[0];
      return a.appointment_date?.startsWith(today);
    }).length : 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark">إدارة المواعيد</h1>
        <p className="mt-1 text-sm text-dark-lighter">
          عرض جميع المواعيد المرتبطة بالحالات المشرف عليها
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">إجمالي المواعيد</p>
              <p className="mt-1 text-2xl font-bold text-dark">{stats.total}</p>
            </div>
            <CalendarIcon className="h-8 w-8 text-sky-500" />
          </div>
        </div>
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">مجدولة</p>
              <p className="mt-1 text-2xl font-bold text-dark">{stats.scheduled}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-blue-500"></div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">مؤكدة</p>
              <p className="mt-1 text-2xl font-bold text-dark">{stats.confirmed}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-green-500"></div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">مكتملة</p>
              <p className="mt-1 text-2xl font-bold text-dark">{stats.completed}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-sky-500"></div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">اليوم</p>
              <p className="mt-1 text-2xl font-bold text-dark">{stats.today}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-orange-500"></div>
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
              placeholder="بحث في المواعيد..."
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
              <label className="block text-sm font-medium text-dark mb-2">الحالة السريرية</label>
              <select
                value={localFilters.case_id}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, case_id: e.target.value })
                }
                className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
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

      {/* Appointments List */}
      <div className="rounded-lg bg-light border border-light-gray overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent"></div>
            <p className="mt-4 text-sm text-dark-lighter">جاري تحميل المواعيد...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-8 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-dark-lighter" />
            <p className="mt-4 text-sm font-medium text-dark">لا توجد مواعيد</p>
            <p className="mt-1 text-sm text-dark-lighter">
              {searchTerm || localFilters.status || localFilters.case_id
                ? 'لا توجد مواعيد تطابق معايير البحث'
                : 'لا توجد مواعيد'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-light-gray">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="p-6 hover:bg-light-gray transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-dark">
                        {appointment.case?.title || 'موعد سريري'}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusColors[appointment.status] || statusColors.scheduled
                        }`}
                      >
                        {statusLabels[appointment.status] || appointment.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div className="flex items-center gap-2 text-sm text-dark-lighter">
                        <ClockIcon className="h-5 w-5" />
                        <span>
                          {new Date(appointment.appointment_date).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                          {appointment.appointment_time && ` - ${appointment.appointment_time}`}
                        </span>
                      </div>
                      {appointment.location && (
                        <div className="flex items-center gap-2 text-sm text-dark-lighter">
                          <BuildingOfficeIcon className="h-5 w-5" />
                          <span>{appointment.location}</span>
                        </div>
                      )}
                      {appointment.patient && (
                        <div className="flex items-center gap-2 text-sm text-dark-lighter">
                          <UserIcon className="h-5 w-5" />
                          <span>
                            {appointment.patient?.first_name} {appointment.patient?.last_name}
                          </span>
                        </div>
                      )}
                    </div>

                    {appointment.notes && (
                      <p className="mt-3 text-sm text-dark-lighter line-clamp-2">
                        {appointment.notes}
                      </p>
                    )}
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









