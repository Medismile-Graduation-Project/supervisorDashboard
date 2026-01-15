'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { searchAcrossAll, setQuery, clearSearch } from '@/store/slices/searchSlice';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  FolderIcon,
  ClipboardDocumentCheckIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  ChartBarIcon,
  DocumentTextIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

const categoryIcons = {
  cases: FolderIcon,
  sessions: ClipboardDocumentCheckIcon,
  appointments: CalendarIcon,
  messages: ChatBubbleLeftRightIcon,
  notifications: BellIcon,
  reports: ChartBarIcon,
  evaluations: DocumentTextIcon,
  content: SparklesIcon,
};

const categoryLabels = {
  cases: 'الحالات',
  sessions: 'الجلسات',
  appointments: 'المواعيد',
  messages: 'المراسلة',
  notifications: 'الإشعارات',
  reports: 'التقارير',
  evaluations: 'التقييمات',
  content: 'المحتوى',
};

const categoryPaths = {
  cases: (id) => `/dashboard/cases/${id}`,
  sessions: (id) => `/dashboard/cases/${id}`,
  appointments: (id) => `/dashboard/appointments/${id}`,
  messages: (id) => `/dashboard/messaging`,
  notifications: () => `/dashboard/notifications`,
  reports: () => `/dashboard/reports`,
  evaluations: () => `/dashboard/evaluations`,
  content: () => `/dashboard/content`,
};

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { query, results, loading, recentSearches } = useAppSelector((state) => state.search);
  const [localQuery, setLocalQuery] = useState(query || '');

  // Handle query parameter from URL
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery && urlQuery.trim().length >= 2) {
      const trimmedQuery = urlQuery.trim();
      if (trimmedQuery !== localQuery) {
        setLocalQuery(trimmedQuery);
        dispatch(setQuery(trimmedQuery));
        dispatch(searchAcrossAll(trimmedQuery));
      }
    } else if (!urlQuery && localQuery) {
      // Clear if no query param
      setLocalQuery('');
      dispatch(clearSearch());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (query && query.length >= 2) {
      dispatch(searchAcrossAll(query));
    } else {
      dispatch(clearSearch());
    }
  }, [query, dispatch]);

  const handleSearch = (searchTerm) => {
    const trimmedQuery = searchTerm.trim();
    if (trimmedQuery.length >= 2) {
      dispatch(setQuery(trimmedQuery));
      dispatch(searchAcrossAll(trimmedQuery));
    } else {
      dispatch(clearSearch());
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(localQuery);
  };

  const handleClear = () => {
    setLocalQuery('');
    dispatch(clearSearch());
  };

  const handleRecentSearchClick = (recentQuery) => {
    setLocalQuery(recentQuery);
    dispatch(setQuery(recentQuery));
    dispatch(searchAcrossAll(recentQuery));
  };

  const renderResultItem = (item, category) => {
    const Icon = categoryIcons[category];
    const getTitle = () => {
      switch (category) {
        case 'cases':
          return item.title || 'حالة بدون عنوان';
        case 'sessions':
          return item.case?.title || 'جلسة';
        case 'appointments':
          return item.case?.title || `موعد - ${item.patient?.first_name || ''}`;
        case 'messages':
          return item.case_id || `محادثة`;
        case 'notifications':
          return item.title || 'إشعار';
        case 'reports':
          return item.title || 'تقرير';
        case 'evaluations':
          return item.comment?.substring(0, 50) || 'تقييم';
        case 'content':
          return item.title || 'محتوى';
        default:
          return 'عنصر';
      }
    };

    const getSubtitle = () => {
      switch (category) {
        case 'cases':
          return item.description?.substring(0, 100) || item.status || '';
        case 'sessions':
          return item.notes?.substring(0, 100) || item.student?.first_name || '';
        case 'appointments':
          return item.notes?.substring(0, 100) || item.location || '';
        case 'messages':
          return item.last_message?.content?.substring(0, 100) || '';
        case 'notifications':
          return item.message?.substring(0, 100) || '';
        case 'reports':
          return item.description?.substring(0, 100) || '';
        case 'evaluations':
          return item.status || '';
        case 'content':
          return item.description?.substring(0, 100) || '';
        default:
          return '';
      }
    };

    const handleItemClick = () => {
      const path = categoryPaths[category];
      if (path) {
        if (item.id) {
          router.push(path(item.id));
        } else {
          router.push(path());
        }
      }
    };

    return (
      <button
        key={item.id || Math.random()}
        onClick={handleItemClick}
        className="w-full text-right p-4 rounded-lg border border-sky-200 hover:bg-sky-50 hover:border-sky-300 transition-all group"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 rounded-lg bg-sky-100 group-hover:bg-sky-200 transition-colors">
            <Icon className="h-5 w-5 text-sky-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-dark mb-1 line-clamp-1" style={{ fontFamily: 'inherit' }}>
              {getTitle()}
            </h3>
            {getSubtitle() && (
              <p className="text-xs text-dark-lighter line-clamp-2" style={{ fontFamily: 'inherit' }}>
                {getSubtitle()}
              </p>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
          البحث
        </h1>
        <p className="text-sm text-dark-lighter" style={{ fontFamily: 'inherit' }}>
          ابحث عن الحالات، الجلسات، المواعيد، والمزيد
        </p>
      </div>

      {/* Search Bar */}
      <div className="rounded-lg bg-white border border-sky-100 p-5 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-dark-lighter" />
            </div>
            <input
              type="text"
              placeholder="ابحث عن أي شيء..."
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              className="block w-full rounded-lg border border-sky-200 bg-sky-50 px-4 py-3.5 pr-10 pl-4 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all"
              style={{ fontFamily: 'inherit' }}
              autoFocus
            />
            {localQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute inset-y-0 left-0 flex items-center pl-3 text-dark-lighter hover:text-dark transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || localQuery.trim().length < 2}
            className="w-full rounded-lg bg-sky-400 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ fontFamily: 'inherit' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>جاري البحث...</span>
              </span>
            ) : (
              'بحث'
            )}
          </button>
        </form>
      </div>

      {/* Recent Searches */}
      {!query && recentSearches.length > 0 && (
        <div className="rounded-lg bg-white border border-sky-100 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-dark mb-3" style={{ fontFamily: 'inherit' }}>
            عمليات البحث الأخيرة
          </h2>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((recentQuery, index) => (
              <button
                key={index}
                onClick={() => handleRecentSearchClick(recentQuery)}
                className="px-3 py-1.5 rounded-lg bg-sky-50 text-sm text-sky-600 hover:bg-sky-100 transition-colors"
                style={{ fontFamily: 'inherit' }}
              >
                {recentQuery}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {query && (
        <div className="space-y-6">
          {/* Results Summary */}
          {!loading && (
            <div className="text-sm text-dark-lighter" style={{ fontFamily: 'inherit' }}>
              {results.total > 0 ? (
                <>تم العثور على <span className="font-semibold text-dark">{results.total}</span> نتيجة</>
              ) : (
                'لم يتم العثور على نتائج'
              )}
            </div>
          )}

          {/* Results by Category */}
          {Object.entries(categoryLabels).map(([category, label]) => {
            const categoryResults = results[category] || [];
            if (categoryResults.length === 0) return null;

            return (
              <div key={category} className="rounded-lg bg-white border border-sky-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  {(() => {
                    const Icon = categoryIcons[category];
                    return <Icon className="h-5 w-5 text-sky-600" />;
                  })()}
                  <h2 className="text-base font-semibold text-dark" style={{ fontFamily: 'inherit' }}>
                    {label} ({categoryResults.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {categoryResults.map((item) => renderResultItem(item, category))}
                </div>
                {categoryResults.length >= 10 && (
                  <Link
                    href={categoryPaths[category]()}
                    className="block mt-4 text-center text-sm text-sky-600 hover:text-sky-700 font-medium"
                    style={{ fontFamily: 'inherit' }}
                  >
                    عرض المزيد من {label}
                  </Link>
                )}
              </div>
            );
          })}

          {/* No Results */}
          {!loading && results.total === 0 && (
            <div className="rounded-lg bg-white border border-sky-100 p-12 shadow-sm text-center">
              <MagnifyingGlassIcon className="h-12 w-12 text-dark-lighter mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
                لا توجد نتائج
              </h3>
              <p className="text-sm text-dark-lighter" style={{ fontFamily: 'inherit' }}>
                لم نتمكن من العثور على أي نتائج لـ &quot;{query}&quot;
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!query && recentSearches.length === 0 && (
        <div className="rounded-lg bg-white border border-sky-100 p-12 shadow-sm text-center">
          <MagnifyingGlassIcon className="h-12 w-12 text-dark-lighter mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
            ابدأ البحث
          </h3>
          <p className="text-sm text-dark-lighter" style={{ fontFamily: 'inherit' }}>
            اكتب كلمة البحث في الحقل أعلاه للعثور على الحالات، الجلسات، المواعيد والمزيد
          </p>
        </div>
      )}
    </div>
  );
}

