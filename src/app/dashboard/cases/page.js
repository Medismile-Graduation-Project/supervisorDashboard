'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { fetchCases, setFilters } from '@/store/slices/casesSlice';
import { fetchAssignmentRequests } from '@/store/slices/casesSlice';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const statusLabels = {
  new: 'جديدة',
  pending_assignment: 'في انتظار الإسناد',
  assigned: 'مسندة',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتملة',
  closed: 'مغلقة',
};

const priorityLabels = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  urgent: 'عاجلة',
};

const priorityColors = {
  low: 'bg-sky-100 text-sky-700',
  medium: 'bg-sky-200 text-sky-800',
  high: 'bg-sky-300 text-sky-900',
  urgent: 'bg-sky-500 text-white',
};

const statusColors = {
  new: 'bg-sky-50 text-sky-700',
  pending_assignment: 'bg-sky-100 text-sky-800',
  assigned: 'bg-sky-200 text-sky-800',
  in_progress: 'bg-sky-400 text-white',
  completed: 'bg-sky-500 text-white',
  closed: 'bg-dark-lighter text-light',
};

export default function CasesPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { cases = [], loading, filters } = useAppSelector((state) => state.cases);
  const { assignmentRequests = [] } = useAppSelector((state) => state.cases);
  const { user } = useAppSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    status: '',
    priority: '',
  });

  useEffect(() => {
    // التحقق من وجود بيانات المستخدم قبل جلب الحالات
    if (user?.id && user?.university) {
      dispatch(fetchCases());
      dispatch(fetchAssignmentRequests({ status: 'pending' }));
    }
  }, [dispatch, user]);

  // Debug: التحقق من البيانات
  useEffect(() => {
    console.log('Cases State:', { 
      cases, 
      casesLength: cases?.length, 
      isArray: Array.isArray(cases),
      loading,
      user: { id: user?.id, university: user?.university }
    });
  }, [cases, loading, user]);

  useEffect(() => {
    dispatch(setFilters(localFilters));
  }, [localFilters, dispatch]);

  const filteredCases = Array.isArray(cases) ? cases.filter((caseItem) => {
    // التحقق من أن الحالة تنتمي للمشرف والجامعة الصحيحة
    const matchesSupervisor = !user?.id || 
      caseItem.supervisor?.id === user.id || 
      caseItem.supervisor_id === user.id;
    
    const matchesUniversity = !user?.university || 
      caseItem.university_id === user.university;
    
    // إذا لم تطابق الحالة المشرف أو الجامعة، لا نعرضها
    if (!matchesSupervisor || !matchesUniversity) {
      return false;
    }

    const matchesSearch =
      caseItem.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.patient?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.patient?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !localFilters.status || caseItem.status === localFilters.status;
    const matchesPriority = !localFilters.priority || caseItem.priority === localFilters.priority;

    return matchesSearch && matchesStatus && matchesPriority;
  }) : [];

  const pendingAssignmentsCount = Array.isArray(assignmentRequests) 
    ? assignmentRequests.filter((r) => r.status === 'pending').length 
    : 0;

  // التحقق من وجود بيانات المستخدم
  if (!user?.id || !user?.university) {
    return (
      <div className="space-y-6">
        <div className="mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
            إدارة الحالات
          </h1>
        </div>
        <div className="rounded-lg bg-white border border-sky-100 p-12 text-center shadow-sm">
          <p className="text-base font-semibold text-dark" style={{ fontFamily: 'inherit' }}>
            جاري تحميل بيانات المستخدم...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
          إدارة الحالات
        </h1>
        <p className="text-sm sm:text-base text-dark-lighter leading-relaxed" style={{ fontFamily: 'inherit' }}>
          عرض وإدارة جميع الحالات المشرف عليها
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white border border-sky-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-lighter mb-2" style={{ fontFamily: 'inherit' }}>
                إجمالي الحالات
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-dark" style={{ fontFamily: 'inherit' }}>
                {cases.length}
              </p>
            </div>
            <div className="flex-shrink-0">
              <FolderIcon className="h-8 w-8 text-sky-500" />
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white border border-sky-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-lighter mb-2" style={{ fontFamily: 'inherit' }}>
                قيد التنفيذ
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-dark" style={{ fontFamily: 'inherit' }}>
                {cases.filter((c) => c.status === 'in_progress').length}
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
                مكتملة
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-dark" style={{ fontFamily: 'inherit' }}>
                {cases.filter((c) => c.status === 'completed').length}
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-sky-200 flex items-center justify-center flex-shrink-0">
              <div className="h-4 w-4 rounded-full bg-sky-600"></div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white border border-sky-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-lighter mb-2" style={{ fontFamily: 'inherit' }}>
                طلبات الإسناد
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-dark" style={{ fontFamily: 'inherit' }}>
                {pendingAssignmentsCount}
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
              placeholder="بحث في الحالات..."
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
          <div className="mt-5 grid grid-cols-1 gap-4 border-t border-sky-100 pt-5 md:grid-cols-2">
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
                الأولوية
              </label>
              <select
                value={localFilters.priority}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, priority: e.target.value })
                }
                className="w-full rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm text-dark focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all"
                style={{ fontFamily: 'inherit' }}
              >
                <option value="">جميع الأولويات</option>
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Cases List */}
      <div className="rounded-lg bg-white border border-sky-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent"></div>
            <p className="mt-4 text-sm text-dark-lighter" style={{ fontFamily: 'inherit' }}>
              جاري تحميل الحالات...
            </p>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="p-12 text-center">
            <FolderIcon className="mx-auto h-12 w-12 text-dark-lighter" />
            <p className="mt-4 text-base font-semibold text-dark" style={{ fontFamily: 'inherit' }}>
              لا توجد حالات
            </p>
            <p className="mt-2 text-sm text-dark-lighter leading-relaxed" style={{ fontFamily: 'inherit' }}>
              {searchTerm || localFilters.status || localFilters.priority
                ? 'لا توجد حالات تطابق معايير البحث'
                : 'لم يتم إنشاء أي حالات بعد'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-sky-100">
            {filteredCases.map((caseItem) => (
              <Link
                key={caseItem.id}
                href={`/dashboard/cases/${caseItem.id}`}
                className="block p-5 sm:p-6 hover:bg-sky-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                      <h3 className="text-base sm:text-lg font-semibold text-dark" style={{ fontFamily: 'inherit' }}>
                        {caseItem.title}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                          statusColors[caseItem.status] || statusColors.new
                        }`}
                        style={{ fontFamily: 'inherit' }}
                      >
                        {statusLabels[caseItem.status] || caseItem.status}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                          priorityColors[caseItem.priority] || priorityColors.medium
                        }`}
                        style={{ fontFamily: 'inherit' }}
                      >
                        {priorityLabels[caseItem.priority] || caseItem.priority}
                      </span>
                    </div>
                    <p className="text-sm text-dark-lighter line-clamp-2 mb-4 leading-relaxed" style={{ fontFamily: 'inherit' }}>
                      {caseItem.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-dark-lighter flex-wrap" style={{ fontFamily: 'inherit' }}>
                      <span>
                        المريض:{' '}
                        <span className="font-medium text-dark">
                          {caseItem.patient?.first_name} {caseItem.patient?.last_name}
                        </span>
                      </span>
                      {caseItem.student && (
                        <span>
                          الطالب:{' '}
                          <span className="font-medium text-dark">
                            {caseItem.student?.first_name} {caseItem.student?.last_name}
                          </span>
                        </span>
                      )}
                      <span>
                        {new Date(caseItem.created_at).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {caseItem.is_public && (
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 whitespace-nowrap" style={{ fontFamily: 'inherit' }}>
                        عامة
                      </span>
                    )}
                    {pendingAssignmentsCount > 0 &&
                      caseItem.status === 'pending_assignment' && (
                        <span className="rounded-full bg-sky-200 px-3 py-1 text-xs font-semibold text-sky-800 whitespace-nowrap" style={{ fontFamily: 'inherit' }}>
                          {Array.isArray(assignmentRequests) 
                            ? assignmentRequests.filter(
                                (r) => r.case === caseItem.id && r.status === 'pending'
                              ).length 
                            : 0}{' '}
                          طلب إسناد
                        </span>
                      )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}










