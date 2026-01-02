'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  HomeIcon,
  FolderIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  BellIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  FolderIcon as FolderIconSolid,
  CalendarIcon as CalendarIconSolid,
  ClipboardDocumentCheckIcon as ClipboardDocumentCheckIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  BellIcon as BellIconSolid,
  UserIcon as UserIconSolid,
} from '@heroicons/react/24/solid';

const navigation = [
  { name: 'الرئيسية', href: '/dashboard', icon: HomeIcon, iconSolid: HomeIconSolid },
  { name: 'الحالات', href: '/dashboard/cases', icon: FolderIcon, iconSolid: FolderIconSolid },
  { name: 'الجلسات', href: '/dashboard/sessions', icon: ClipboardDocumentCheckIcon, iconSolid: ClipboardDocumentCheckIconSolid },
  { name: 'المواعيد', href: '/dashboard/appointments', icon: CalendarIcon, iconSolid: CalendarIconSolid },
  { name: 'التقييمات', href: '/dashboard/evaluations', icon: DocumentTextIcon, iconSolid: DocumentTextIconSolid },
  { name: 'المحتوى', href: '/dashboard/content', icon: ChatBubbleLeftRightIcon, iconSolid: ChatBubbleLeftRightIconSolid },
  { name: 'التقارير', href: '/dashboard/reports', icon: ChartBarIcon, iconSolid: ChartBarIconSolid },
  { name: 'الإشعارات', href: '/dashboard/notifications', icon: BellIcon, iconSolid: BellIconSolid },
  { name: 'الملف الشخصي', href: '/dashboard/profile', icon: UserIcon, iconSolid: UserIconSolid },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { unreadCount } = useAppSelector((state) => state.notifications);

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r border-sky-100 shadow-sm">
      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = isActive ? item.iconSolid : item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative
                ${
                  isActive
                    ? 'bg-sky-50 text-sky-600 border-r-2 border-sky-500'
                    : 'text-dark-lighter hover:bg-sky-50 hover:text-sky-600'
                }
              `}
              style={{ fontFamily: 'inherit' }}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 transition-colors ${
                isActive 
                  ? 'text-sky-600' 
                  : 'text-dark-lighter group-hover:text-sky-600'
              }`} />
              <span className="flex-1 text-right">{item.name}</span>
              {item.name === 'الإشعارات' && unreadCount > 0 && (
                <span className={`absolute left-2 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                  isActive 
                    ? 'bg-sky-500 text-white' 
                    : 'bg-sky-400 text-white'
                } shadow-sm`}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

