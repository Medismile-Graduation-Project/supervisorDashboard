'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  fetchAppointments,
  createAppointment,
  updateAppointment,
} from '@/store/slices/appointmentsSlice';
import { fetchCases } from '@/store/slices/casesSlice';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
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
  const { appointments, loading } = useAppSelector((state) => state.appointments);
  const { cases } = useAppSelector((state) => state.cases);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [localFilters, setLocalFilters] = useState({
    status: '',
    case_id: '',
    date_from: '',
    date_to: '',
  });
  const [formData, setFormData] = useState({
    case: '',
    appointment_date: '',
    appointment_time: '',
    location: '',
    notes: '',
    status: 'scheduled',
  });

  useEffect(() => {
    dispatch(fetchAppointments());
    dispatch(fetchCases());
  }, [dispatch]);

  const filteredAppointments = appointments.filter((appointment) => {
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
  });

  const handleCreateAppointment = async () => {
    try {
      const result = await dispatch(createAppointment(formData));
      if (createAppointment.fulfilled.match(result)) {
        toast.success('تم إنشاء الموعد بنجاح');
        setShowCreateModal(false);
        setFormData({
          case: '',
          appointment_date: '',
          appointment_time: '',
          location: '',
          notes: '',
          status: 'scheduled',
        });
        dispatch(fetchAppointments());
      } else {
        toast.error(result.payload?.message || 'فشل إنشاء الموعد');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء الموعد');
    }
  };

  const handleUpdateAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      const result = await dispatch(
        updateAppointment({ appointmentId: selectedAppointment.id, data: formData })
      );
      if (updateAppointment.fulfilled.match(result)) {
        toast.success('تم تحديث الموعد بنجاح');
        setShowEditModal(false);
        setSelectedAppointment(null);
        dispatch(fetchAppointments());
      } else {
        toast.error(result.payload?.message || 'فشل تحديث الموعد');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الموعد');
    }
  };

  const handleEditClick = (appointment) => {
    setSelectedAppointment(appointment);
    setFormData({
      case: appointment.case || '',
      appointment_date: appointment.appointment_date
        ? new Date(appointment.appointment_date).toISOString().split('T')[0]
        : '',
      appointment_time: appointment.appointment_time || '',
      location: appointment.location || '',
      notes: appointment.notes || '',
      status: appointment.status || 'scheduled',
    });
    setShowEditModal(true);
  };

  const stats = {
    total: appointments.length,
    scheduled: appointments.filter((a) => a.status === 'scheduled').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    today: appointments.filter((a) => {
      const today = new Date().toISOString().split('T')[0];
      return a.appointment_date?.startsWith(today);
    }).length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">إدارة المواعيد</h1>
          <p className="mt-1 text-sm text-dark-lighter">
            عرض وإدارة جميع المواعيد المرتبطة بالحالات المشرف عليها
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              case: '',
              appointment_date: '',
              appointment_time: '',
              location: '',
              notes: '',
              status: 'scheduled',
            });
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          موعد جديد
        </button>
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
                {cases.map((caseItem) => (
                  <option key={caseItem.id} value={caseItem.id}>
                    {caseItem.title}
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
                : 'لم يتم إنشاء أي مواعيد بعد'}
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

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(appointment)}
                      className="flex items-center gap-2 rounded-lg border border-dark-lighter bg-light px-3 py-2 text-sm font-medium text-dark hover:bg-light-gray transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                      تعديل
                    </button>
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
            <h3 className="text-lg font-semibold text-dark mb-4">إنشاء موعد جديد</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  الحالة السريرية <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.case}
                  onChange={(e) => setFormData({ ...formData, case: e.target.value })}
                  required
                  className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">اختر الحالة</option>
                  {cases.map((caseItem) => (
                    <option key={caseItem.id} value={caseItem.id}>
                      {caseItem.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    تاريخ الموعد <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.appointment_date}
                    onChange={(e) =>
                      setFormData({ ...formData, appointment_date: e.target.value })
                    }
                    required
                    className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">وقت الموعد</label>
                  <input
                    type="time"
                    value={formData.appointment_time}
                    onChange={(e) =>
                      setFormData({ ...formData, appointment_time: e.target.value })
                    }
                    className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">الموقع</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="مثال: عيادة الأسنان - الطابق الثاني"
                  className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">الحالة</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  placeholder="أضف ملاحظات إضافية..."
                  className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateAppointment}
                className="flex-1 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
              >
                إنشاء
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({
                    case: '',
                    appointment_date: '',
                    appointment_time: '',
                    location: '',
                    notes: '',
                    status: 'scheduled',
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
      {showEditModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-light p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-dark mb-4">تعديل الموعد</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  الحالة السريرية <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.case}
                  onChange={(e) => setFormData({ ...formData, case: e.target.value })}
                  required
                  className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">اختر الحالة</option>
                  {cases.map((caseItem) => (
                    <option key={caseItem.id} value={caseItem.id}>
                      {caseItem.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    تاريخ الموعد <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.appointment_date}
                    onChange={(e) =>
                      setFormData({ ...formData, appointment_date: e.target.value })
                    }
                    required
                    className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">وقت الموعد</label>
                  <input
                    type="time"
                    value={formData.appointment_time}
                    onChange={(e) =>
                      setFormData({ ...formData, appointment_time: e.target.value })
                    }
                    className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">الموقع</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="مثال: عيادة الأسنان - الطابق الثاني"
                  className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">الحالة</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  placeholder="أضف ملاحظات إضافية..."
                  className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateAppointment}
                className="flex-1 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
              >
                حفظ التغييرات
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedAppointment(null);
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

