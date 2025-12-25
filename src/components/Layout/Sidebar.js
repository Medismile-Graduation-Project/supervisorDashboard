'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  FolderIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
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
  { name: 'الملف الشخصي', href: '/dashboard/profile', icon: UserIcon, iconSolid: UserIconSolid },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col bg-dark border-l border-dark-light">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-dark-light px-4">
        <h1 className="text-xl font-bold text-light">MediSmile</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = isActive ? item.iconSolid : item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                ${
                  isActive
                    ? 'bg-sky-600 text-white'
                    : 'text-light-lighter hover:bg-dark-light hover:text-light'
                }
              `}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-dark-light p-4">
        <p className="text-xs text-light-lighter text-center">
          © 2025 MediSmile
        </p>
      </div>
    </div>
  );
}

