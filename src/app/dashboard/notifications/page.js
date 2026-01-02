'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  fetchNotifications,
  fetchNotificationById,
  markNotificationAsRead,
  updateNotificationStatus,
  markAllAsRead,
  clearCurrentNotification,
} from '@/store/slices/notificationsSlice';
import {
  BellIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const priorityLabels = {
  low: 'منخفضة',
  normal: 'عادية',
  high: 'عالية',
  critical: 'حرجة',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const statusLabels = {
  pending: 'قيد الانتظار',
  accepted: 'مقبولة',
  rejected: 'مرفوضة',
  info: 'معلوماتية',
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
};

const getNotificationIcon = (notificationType) => {
  if (notificationType?.includes('report')) return CheckCircleIcon;
  if (notificationType?.includes('session')) return ClockIcon;
  if (notificationType?.includes('case')) return InformationCircleIcon;
  if (notificationType?.includes('content')) return BellIcon;
  if (notificationType?.includes('evaluation')) return CheckCircleIcon;
  if (notificationType?.includes('system') || notificationType?.includes('security'))
    return ExclamationTriangleIcon;
  return BellIcon;
};

export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { notifications = [], loading, unreadCount, currentNotification } = useAppSelector(
    (state) => state.notifications
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);
  const [localFilters, setLocalFilters] = useState({
    is_read: '',
    priority: '',
    status: '',
    notification_type: '',
  });

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  useEffect(() => {
    if (selectedNotificationId) {
      dispatch(fetchNotificationById(selectedNotificationId));
    }
  }, [selectedNotificationId, dispatch]);

  const filteredNotifications = Array.isArray(notifications)
    ? notifications.filter((notification) => {
        const matchesSearch =
          notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notification.message?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRead =
          localFilters.is_read === '' ||
          (localFilters.is_read === 'read' && notification.is_read) ||
          (localFilters.is_read === 'unread' && !notification.is_read);

        const matchesPriority =
          !localFilters.priority || notification.priority === localFilters.priority;

        const matchesStatus =
          !localFilters.status || notification.status === localFilters.status;

        const matchesType =
          !localFilters.notification_type ||
          notification.notification_type === localFilters.notification_type;

        return matchesSearch && matchesRead && matchesPriority && matchesStatus && matchesType;
      })
    : [];

  const handleMarkAsRead = async (notificationId) => {
    try {
      const result = await dispatch(markNotificationAsRead(notificationId));
      if (markNotificationAsRead.fulfilled.match(result)) {
        toast.success('تم تمييز الإشعار كمقروء');
        dispatch(fetchNotifications());
      } else {
        toast.error('فشل تحديث الإشعار');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الإشعار');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await dispatch(markAllAsRead());
      if (markAllAsRead.fulfilled.match(result)) {
        toast.success('تم تمييز جميع الإشعارات كمقروءة');
        dispatch(fetchNotifications());
      } else {
        // إذا لم يكن endpoint موجود، نقوم بتمييز كل إشعار على حدة
        const unreadNotifications = notifications.filter((n) => !n.is_read);
        for (const notification of unreadNotifications) {
          await dispatch(markNotificationAsRead(notification.id));
        }
        toast.success('تم تمييز جميع الإشعارات كمقروءة');
        dispatch(fetchNotifications());
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الإشعارات');
    }
  };

  const handleUpdateStatus = async (notificationId, status) => {
    try {
      const result = await dispatch(
        updateNotificationStatus({ notificationId, status, response_message: '' })
      );
      if (updateNotificationStatus.fulfilled.match(result)) {
        toast.success('تم تحديث حالة الإشعار');
        dispatch(fetchNotifications());
        if (selectedNotificationId === notificationId) {
          setShowDetailsModal(false);
        }
      } else {
        toast.error('فشل تحديث حالة الإشعار');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث حالة الإشعار');
    }
  };

  const handleNotificationClick = async (notification) => {
    setSelectedNotificationId(notification.id);
    setShowDetailsModal(true);

    // تمييز كمقروء إذا لم يكن مقروءاً
    if (!notification.is_read) {
      await dispatch(markNotificationAsRead(notification.id));
    }
  };

  const handleNavigateToTarget = (notification) => {
    if (notification.target_type && notification.target_object_id) {
      switch (notification.target_type) {
        case 'report':
          router.push(`/dashboard/reports`);
          break;
        case 'case':
          router.push(`/dashboard/cases/${notification.target_object_id}`);
          break;
        case 'session':
          router.push(`/dashboard/cases/${notification.case?.id || ''}`);
          break;
        case 'content':
          router.push(`/dashboard/content`);
          break;
        case 'evaluation':
          router.push(`/dashboard/evaluations`);
          break;
        default:
          break;
      }
    }
    setShowDetailsModal(false);
  };

  const stats = {
    total: Array.isArray(notifications) ? notifications.length : 0,
    unread: unreadCount,
    read: Array.isArray(notifications)
      ? notifications.filter((n) => n.is_read).length
      : 0,
    high: Array.isArray(notifications)
      ? notifications.filter((n) => n.priority === 'high' || n.priority === 'critical').length
      : 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">الإشعارات</h1>
          <p className="mt-1 text-sm text-dark-lighter">
            عرض وإدارة جميع الإشعارات الخاصة بك
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
          >
            <CheckCircleIcon className="h-5 w-5" />
            تمييز الكل كمقروء
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">إجمالي الإشعارات</p>
              <p className="mt-1 text-2xl font-bold text-dark">{stats.total}</p>
            </div>
            <BellIcon className="h-8 w-8 text-sky-500" />
          </div>
        </div>
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">غير مقروءة</p>
              <p className="mt-1 text-2xl font-bold text-dark">{stats.unread}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-red-500"></div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">مقروءة</p>
              <p className="mt-1 text-2xl font-bold text-dark">{stats.read}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-green-500"></div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">عالية الأولوية</p>
              <p className="mt-1 text-2xl font-bold text-dark">{stats.high}</p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-dark-lighter" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث في الإشعارات..."
            className="block w-full rounded-lg border border-dark-lighter bg-light py-2 pr-10 pl-4 text-sm text-dark placeholder-dark-lighter focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
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
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-2">الحالة</label>
              <select
                value={localFilters.is_read}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, is_read: e.target.value })
                }
                className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="">الكل</option>
                <option value="read">مقروءة</option>
                <option value="unread">غير مقروءة</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-2">الأولوية</label>
              <select
                value={localFilters.priority}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, priority: e.target.value })
                }
                className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="">الكل</option>
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-2">حالة الإشعار</label>
              <select
                value={localFilters.status}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, status: e.target.value })
                }
                className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="">الكل</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-2">النوع</label>
              <select
                value={localFilters.notification_type}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, notification_type: e.target.value })
                }
                className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="">الكل</option>
                <option value="report_submitted">تقرير جديد</option>
                <option value="session_needs_review">جلسة تحتاج مراجعة</option>
                <option value="community_content_pending">محتوى معلق</option>
                <option value="case_created">حالة جديدة</option>
                <option value="system_alert">تنبيه النظام</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="rounded-lg bg-light border border-light-gray overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent"></div>
            <p className="mt-4 text-sm text-dark-lighter">جاري تحميل الإشعارات...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <BellIcon className="mx-auto h-12 w-12 text-dark-lighter" />
            <p className="mt-4 text-sm font-medium text-dark">لا توجد إشعارات</p>
            <p className="mt-1 text-sm text-dark-lighter">
              {searchTerm || Object.values(localFilters).some((f) => f)
                ? 'لا توجد إشعارات تطابق معايير البحث'
                : 'لا توجد إشعارات حتى الآن'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-light-gray">
            {filteredNotifications.map((notification) => {
              const NotificationIcon = getNotificationIcon(notification.notification_type);

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-6 hover:bg-light-gray transition-colors cursor-pointer ${
                    !notification.is_read ? 'bg-sky-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          !notification.is_read
                            ? 'bg-sky-100 text-sky-600'
                            : 'bg-light-gray text-dark-lighter'
                        }`}
                      >
                        <NotificationIcon className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-dark">
                              {notification.title}
                            </h3>
                            {!notification.is_read && (
                              <span className="h-2 w-2 rounded-full bg-sky-500"></span>
                            )}
                          </div>
                          <p className="text-sm text-dark-lighter mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                priorityColors[notification.priority] || priorityColors.normal
                              }`}
                            >
                              {priorityLabels[notification.priority] || notification.priority}
                            </span>
                            {notification.status && (
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  statusColors[notification.status] || statusColors.info
                                }`}
                              >
                                {statusLabels[notification.status] || notification.status}
                              </span>
                            )}
                            <span className="text-xs text-dark-lighter">
                              {new Date(notification.created_at).toLocaleDateString('ar-SA', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {!notification.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              className="rounded-lg border border-dark-lighter bg-light px-3 py-1.5 text-xs font-medium text-dark hover:bg-light-gray transition-colors"
                            >
                              تمييز كمقروء
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notification Details Modal */}
      {showDetailsModal && currentNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-light p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-dark mb-4">تفاصيل الإشعار</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-lighter mb-1">العنوان</label>
                <p className="text-base font-semibold text-dark">{currentNotification.title}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-lighter mb-1">الرسالة</label>
                <p className="text-sm text-dark whitespace-pre-wrap">
                  {currentNotification.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-lighter mb-1">
                    الأولوية
                  </label>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      priorityColors[currentNotification.priority] || priorityColors.normal
                    }`}
                  >
                    {priorityLabels[currentNotification.priority] || currentNotification.priority}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-lighter mb-1">الحالة</label>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusColors[currentNotification.status] || statusColors.info
                    }`}
                  >
                    {statusLabels[currentNotification.status] || currentNotification.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-lighter mb-1">النوع</label>
                  <p className="text-sm text-dark">{currentNotification.notification_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-lighter mb-1">
                    تاريخ الإنشاء
                  </label>
                  <p className="text-sm text-dark">
                    {new Date(currentNotification.created_at).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {currentNotification.payload && Object.keys(currentNotification.payload).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-dark-lighter mb-1">
                    معلومات إضافية
                  </label>
                  <div className="rounded-lg bg-light-gray p-3">
                    <pre className="text-xs text-dark whitespace-pre-wrap">
                      {JSON.stringify(currentNotification.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {currentNotification.proposed_changes &&
                Object.keys(currentNotification.proposed_changes).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-dark-lighter mb-1">
                      التغييرات المقترحة
                    </label>
                    <div className="rounded-lg bg-light-gray p-3">
                      <pre className="text-xs text-dark whitespace-pre-wrap">
                        {JSON.stringify(currentNotification.proposed_changes, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
            </div>

            <div className="flex gap-3 mt-6">
              {currentNotification.target_type && currentNotification.target_object_id && (
                <button
                  onClick={() => handleNavigateToTarget(currentNotification)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
                >
                  الانتقال للكائن المرتبط
                </button>
              )}
              {currentNotification.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(currentNotification.id, 'accepted')}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    قبول
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(currentNotification.id, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                  >
                    <XCircleIcon className="h-5 w-5" />
                    رفض
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedNotificationId(null);
                  dispatch(clearCurrentNotification());
                }}
                className="flex-1 rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm font-medium text-dark hover:bg-light-gray transition-colors"
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




