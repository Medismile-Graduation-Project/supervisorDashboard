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
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const statusColors = {
  new: 'bg-gray-100 text-gray-800',
  pending_assignment: 'bg-blue-100 text-blue-800',
  assigned: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-sky-100 text-sky-800',
  completed: 'bg-green-100 text-green-800',
  closed: 'bg-gray-200 text-gray-600',
};

export default function CasesPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { cases = [], loading, filters } = useAppSelector((state) => state.cases);
  const { assignmentRequests = [] } = useAppSelector((state) => state.cases);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    status: '',
    priority: '',
  });

  useEffect(() => {
    dispatch(fetchCases());
    dispatch(fetchAssignmentRequests({ status: 'pending' }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(setFilters(localFilters));
  }, [localFilters, dispatch]);

  const filteredCases = Array.isArray(cases) ? cases.filter((caseItem) => {
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark">إدارة الحالات</h1>
        <p className="mt-1 text-sm text-dark-lighter">
          عرض وإدارة جميع الحالات المشرف عليها
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">إجمالي الحالات</p>
              <p className="mt-1 text-2xl font-bold text-dark">{cases.length}</p>
            </div>
            <FolderIcon className="h-8 w-8 text-sky-500" />
          </div>
        </div>
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">قيد التنفيذ</p>
              <p className="mt-1 text-2xl font-bold text-dark">
                {cases.filter((c) => c.status === 'in_progress').length}
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-sky-500"></div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">مكتملة</p>
              <p className="mt-1 text-2xl font-bold text-dark">
                {cases.filter((c) => c.status === 'completed').length}
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-green-500"></div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-light border border-light-gray p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-lighter">طلبات الإسناد</p>
              <p className="mt-1 text-2xl font-bold text-dark">{pendingAssignmentsCount}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
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
              placeholder="بحث في الحالات..."
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
          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-light-gray pt-4 md:grid-cols-2">
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
              <label className="block text-sm font-medium text-dark mb-2">الأولوية</label>
              <select
                value={localFilters.priority}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, priority: e.target.value })
                }
                className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
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
      <div className="rounded-lg bg-light border border-light-gray overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent"></div>
            <p className="mt-4 text-sm text-dark-lighter">جاري تحميل الحالات...</p>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="p-8 text-center">
            <FolderIcon className="mx-auto h-12 w-12 text-dark-lighter" />
            <p className="mt-4 text-sm font-medium text-dark">لا توجد حالات</p>
            <p className="mt-1 text-sm text-dark-lighter">
              {searchTerm || localFilters.status || localFilters.priority
                ? 'لا توجد حالات تطابق معايير البحث'
                : 'لم يتم إنشاء أي حالات بعد'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-light-gray">
            {filteredCases.map((caseItem) => (
              <Link
                key={caseItem.id}
                href={`/dashboard/cases/${caseItem.id}`}
                className="block p-6 hover:bg-light-gray transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-dark">{caseItem.title}</h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusColors[caseItem.status] || statusColors.new
                        }`}
                      >
                        {statusLabels[caseItem.status] || caseItem.status}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          priorityColors[caseItem.priority] || priorityColors.medium
                        }`}
                      >
                        {priorityLabels[caseItem.priority] || caseItem.priority}
                      </span>
                    </div>
                    <p className="text-sm text-dark-lighter line-clamp-2 mb-3">
                      {caseItem.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-dark-lighter">
                      <span>
                        المريض:{' '}
                        {caseItem.patient?.first_name} {caseItem.patient?.last_name}
                      </span>
                      {caseItem.student && (
                        <span>
                          الطالب: {caseItem.student?.first_name} {caseItem.student?.last_name}
                        </span>
                      )}
                      <span>
                        {new Date(caseItem.created_at).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {caseItem.is_public && (
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        عامة
                      </span>
                    )}
                    {pendingAssignmentsCount > 0 &&
                      caseItem.status === 'pending_assignment' && (
                        <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
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










