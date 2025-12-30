'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { fetchCases } from '@/store/slices/casesSlice';
import { fetchSessionsNeedingReview } from '@/store/slices/sessionsSlice';
import { fetchAssignmentRequests } from '@/store/slices/casesSlice';
import { fetchPendingContent } from '@/store/slices/contentSlice';
import { fetchNotifications } from '@/store/slices/notificationsSlice';
import {
  FolderIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { cases = [], assignmentRequests = [] } = useAppSelector((state) => state.cases);
  const { sessionsNeedingReview = [] } = useAppSelector((state) => state.sessions);
  const { pendingContent = [] } = useAppSelector((state) => state.content);
  const { notifications = [], unreadCount = 0 } = useAppSelector((state) => state.notifications);

  useEffect(() => {
    // جلب البيانات عند تحميل الصفحة
    dispatch(fetchCases());
    dispatch(fetchAssignmentRequests({ status: 'pending' }));
    dispatch(fetchSessionsNeedingReview());
    dispatch(fetchPendingContent());
    dispatch(fetchNotifications());
  }, [dispatch]);

  // إحصائيات سريعة
  const stats = [
    {
      name: 'الحالات المشرف عليها',
      value: Array.isArray(cases) ? cases.length : 0,
      icon: FolderIcon,
      color: 'bg-sky-500',
      href: '/dashboard/cases',
    },
    {
      name: 'طلبات الإسناد المعلقة',
      value: Array.isArray(assignmentRequests) 
        ? assignmentRequests.filter((r) => r.status === 'pending').length 
        : 0,
      icon: DocumentTextIcon,
      color: 'bg-yellow-500',
      href: '/dashboard/cases?tab=assignments',
    },
    {
      name: 'جلسات تحتاج مراجعة',
      value: Array.isArray(sessionsNeedingReview) ? sessionsNeedingReview.length : 0,
      icon: ClipboardDocumentCheckIcon,
      color: 'bg-orange-500',
      href: '/dashboard/sessions?status=needs_review',
    },
    {
      name: 'محتوى معلق للموافقة',
      value: Array.isArray(pendingContent) ? pendingContent.length : 0,
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-purple-500',
      href: '/dashboard/content?status=pending',
    },
  ];

  // توزيع الحالات حسب الحالة
  const casesByStatus = {
    new: Array.isArray(cases) ? cases.filter((c) => c.status === 'new').length : 0,
    pending_assignment: Array.isArray(cases) 
      ? cases.filter((c) => c.status === 'pending_assignment').length 
      : 0,
    assigned: Array.isArray(cases) ? cases.filter((c) => c.status === 'assigned').length : 0,
    in_progress: Array.isArray(cases) 
      ? cases.filter((c) => c.status === 'in_progress').length 
      : 0,
    completed: Array.isArray(cases) ? cases.filter((c) => c.status === 'completed').length : 0,
    closed: Array.isArray(cases) ? cases.filter((c) => c.status === 'closed').length : 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark">لوحة التحكم</h1>
        <p className="mt-1 text-sm text-dark-lighter">
          نظرة عامة على الحالات والأنشطة
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <a
              key={stat.name}
              href={stat.href}
              className="group relative overflow-hidden rounded-lg bg-light border border-light-gray p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-dark-lighter">{stat.name}</p>
                  <p className="mt-2 text-3xl font-bold text-dark">{stat.value}</p>
                </div>
                <div className={`${stat.color} rounded-lg p-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Cases by Status */}
        <div className="rounded-lg bg-light border border-light-gray p-6">
          <h2 className="text-lg font-semibold text-dark mb-4">توزيع الحالات</h2>
          <div className="space-y-3">
            {Object.entries(casesByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-dark-lighter capitalize">{status}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 bg-light-gray rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full"
                      style={{
                        width: `${cases.length > 0 ? (count / cases.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-dark w-8 text-left">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg bg-light border border-light-gray p-6">
          <h2 className="text-lg font-semibold text-dark mb-4">الإشعارات الحديثة</h2>
          <div className="space-y-3">
            {Array.isArray(notifications) && notifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  !notification.is_read ? 'bg-sky-50 border border-sky-100' : 'bg-light-gray'
                }`}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-dark">{notification.title}</p>
                  <p className="text-xs text-dark-lighter mt-1">{notification.message}</p>
                  <p className="text-xs text-dark-lighter mt-1">
                    {new Date(notification.created_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="h-2 w-2 rounded-full bg-sky-500 mt-2" />
                )}
              </div>
            ))}
            {notifications.length === 0 && (
              <p className="text-sm text-dark-lighter text-center py-4">
                لا توجد إشعارات
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

