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
      color: 'bg-sky-400',
      href: '/dashboard/cases?tab=assignments',
    },
    {
      name: 'جلسات تحتاج مراجعة',
      value: Array.isArray(sessionsNeedingReview) ? sessionsNeedingReview.length : 0,
      icon: ClipboardDocumentCheckIcon,
      color: 'bg-sky-600',
      href: '/dashboard/sessions?status=needs_review',
    },
    {
      name: 'محتوى معلق للموافقة',
      value: Array.isArray(pendingContent) ? pendingContent.length : 0,
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-sky-500',
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
      <div className="mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
          لوحة التحكم
        </h1>
        <p className="text-sm sm:text-base text-dark-lighter leading-relaxed" style={{ fontFamily: 'inherit' }}>
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
              className="group relative overflow-hidden rounded-lg bg-white border border-sky-100 p-5 sm:p-6 hover:shadow-md hover:border-sky-200 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark-lighter mb-2" style={{ fontFamily: 'inherit' }}>
                    {stat.name}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-dark" style={{ fontFamily: 'inherit' }}>
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} rounded-lg p-3 flex-shrink-0 shadow-sm`}>
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
        <div className="rounded-lg bg-white border border-sky-100 p-5 sm:p-6 shadow-sm">
          <h2 className="text-lg sm:text-xl font-semibold text-dark mb-5" style={{ fontFamily: 'inherit' }}>
            توزيع الحالات
          </h2>
          <div className="space-y-4">
            {Object.entries(casesByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-dark-lighter flex-shrink-0" style={{ fontFamily: 'inherit' }}>
                  {status === 'new' && 'جديدة'}
                  {status === 'pending_assignment' && 'في انتظار الإسناد'}
                  {status === 'assigned' && 'مُسندة'}
                  {status === 'in_progress' && 'قيد التنفيذ'}
                  {status === 'completed' && 'مكتملة'}
                  {status === 'closed' && 'مغلقة'}
                </span>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-2.5 flex-1 bg-sky-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${cases.length > 0 ? (count / cases.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-dark w-8 text-left flex-shrink-0" style={{ fontFamily: 'inherit' }}>
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg bg-white border border-sky-100 p-5 sm:p-6 shadow-sm">
          <h2 className="text-lg sm:text-xl font-semibold text-dark mb-5" style={{ fontFamily: 'inherit' }}>
            الإشعارات الحديثة
          </h2>
          <div className="space-y-3">
            {Array.isArray(notifications) && notifications.length > 0 ? (
              notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-3.5 rounded-lg transition-colors ${
                    !notification.is_read 
                      ? 'bg-sky-50 border border-sky-200' 
                      : 'bg-light-gray border border-transparent'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark mb-1.5" style={{ fontFamily: 'inherit' }}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-dark-lighter leading-relaxed mb-2" style={{ fontFamily: 'inherit' }}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-dark-lighter" style={{ fontFamily: 'inherit' }}>
                      {new Date(notification.created_at).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="h-2.5 w-2.5 rounded-full bg-sky-500 mt-1.5 flex-shrink-0" />
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-dark-lighter" style={{ fontFamily: 'inherit' }}>
                  لا توجد إشعارات
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

