'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { highlightMatches } from '@/utils/searchUtils';
import {
  FolderIcon,
  ClipboardDocumentCheckIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  ChartBarIcon,
  DocumentTextIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

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
  messages: () => `/dashboard/messaging`,
  notifications: () => `/dashboard/notifications`,
  reports: () => `/dashboard/reports`,
  evaluations: () => `/dashboard/evaluations`,
  content: () => `/dashboard/content`,
};

export default function SearchDropdown({ results, loading, query, onClose }) {
  const router = useRouter();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Don't close if clicking on the search input
        if (!event.target.closest('input[type="text"]')) {
          onClose?.();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (!query || query.trim().length < 2) {
    return null;
  }

  const handleItemClick = (category, item) => {
    const path = categoryPaths[category];
    if (path && item?.id) {
      router.push(path(item.id));
      onClose?.();
    } else if (path) {
      router.push(path());
      onClose?.();
    }
  };

  const getItemTitle = (item, category) => {
    switch (category) {
      case 'cases':
        return item.title || 'حالة بدون عنوان';
      case 'sessions':
        return item.case?.title || 'جلسة';
      case 'appointments':
        return item.case?.title || `موعد`;
      case 'messages':
        return item.case_id || `محادثة`;
      case 'notifications':
        return item.title || 'إشعار';
      case 'reports':
        return item.title || 'تقرير';
      case 'evaluations':
        return item.comment?.substring(0, 40) || 'تقييم';
      case 'content':
        return item.title || 'محتوى';
      default:
        return 'عنصر';
    }
  };

  const getItemSubtitle = (item, category) => {
    switch (category) {
      case 'cases':
        return item.description?.substring(0, 60) || '';
      case 'sessions':
        return item.notes?.substring(0, 60) || '';
      case 'appointments':
        return item.location || '';
      case 'messages':
        return item.last_message?.content?.substring(0, 60) || '';
      case 'notifications':
        return item.message?.substring(0, 60) || '';
      default:
        return '';
    }
  };

  // Render highlighted text
  const renderHighlightedText = (text, maxLength = 60) => {
    if (!text || !query) return text?.toString() || '';
    
    const textStr = text.toString();
    const truncated = textStr.length > maxLength 
      ? textStr.substring(0, maxLength) + '...' 
      : textStr;
    
    const parts = highlightMatches(truncated, query);
    
    return parts.map((part, index) => 
      part.isMatch ? (
        <mark key={index} className="bg-yellow-200 font-semibold text-dark">
          {part.text}
        </mark>
      ) : (
        <span key={index}>{part.text}</span>
      )
    );
  };

  const totalResults = results?.total || 0;
  const hasResults = totalResults > 0;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white border border-sky-200 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden flex flex-col"
    >
      {loading ? (
        <div className="p-6 text-center">
          <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-sky-500 border-r-transparent"></div>
          <p className="mt-2 text-sm text-dark-lighter" style={{ fontFamily: 'inherit' }}>
            جاري البحث...
          </p>
        </div>
      ) : hasResults ? (
        <>
          <div className="overflow-y-auto flex-1 p-2">
            {Object.entries(categoryLabels).map(([category, label]) => {
              const categoryResults = results?.[category] || [];
              if (categoryResults.length === 0) return null;

              const Icon = categoryIcons[category];

              return (
                <div key={category} className="mb-3 last:mb-0">
                  <div className="flex items-center gap-2 px-3 py-2 mb-2">
                    <Icon className="h-4 w-4 text-sky-600" />
                    <h3 className="text-xs font-semibold text-dark-lighter uppercase" style={{ fontFamily: 'inherit' }}>
                      {label}
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {categoryResults.slice(0, 3).map((item) => (
                      <button
                        key={item.id || Math.random()}
                        onClick={() => handleItemClick(category, item)}
                        className="w-full text-right px-3 py-2 rounded-lg hover:bg-sky-50 transition-colors group"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 p-1 rounded bg-sky-100 group-hover:bg-sky-200 transition-colors">
                            <Icon className="h-3 w-3 text-sky-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-dark line-clamp-1" style={{ fontFamily: 'inherit' }}>
                              {renderHighlightedText(getItemTitle(item, category), 50)}
                            </p>
                            {getItemSubtitle(item, category) && (
                              <p className="text-xs text-dark-lighter line-clamp-1 mt-0.5" style={{ fontFamily: 'inherit' }}>
                                {renderHighlightedText(getItemSubtitle(item, category), 50)}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-sky-200 p-2">
            <Link
              href={`/dashboard/search?q=${encodeURIComponent(query)}`}
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-sm font-medium text-sky-600 transition-colors"
              style={{ fontFamily: 'inherit' }}
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
              <span>عرض جميع النتائج ({totalResults})</span>
            </Link>
          </div>
        </>
      ) : (
        <div className="p-6 text-center">
          <MagnifyingGlassIcon className="h-8 w-8 text-dark-lighter mx-auto mb-2" />
          <p className="text-sm text-dark-lighter" style={{ fontFamily: 'inherit' }}>
            لا توجد نتائج لـ &quot;{query}&quot;
          </p>
        </div>
      )}
    </div>
  );
}

