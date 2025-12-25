'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { logout } from '@/store/slices/authSlice';
import { useAppDispatch } from '@/hooks/useAppDispatch';

export default function Header() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, initialized } = useAppSelector((state) => state.auth);
  const { unreadCount } = useAppSelector((state) => state.notifications);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await dispatch(logout());
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between bg-dark border-b border-dark-light px-6">
      {/* Search */}
      <div className="flex flex-1 items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-light-lighter" />
          </div>
          <input
            type="text"
            placeholder="بحث..."
            className="block w-full rounded-lg border border-dark-light bg-dark-light py-2 pr-10 pl-4 text-sm text-light placeholder-light-lighter focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-light-lighter hover:bg-dark-light hover:text-light transition-colors">
          <BellIcon className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute top-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-dark-light transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600 text-sm font-semibold text-white shadow-lg">
              {mounted && initialized
                ? user?.first_name?.[0] || user?.username?.[0]?.toUpperCase() || 'U'
                : 'U'}
            </div>
            {mounted && initialized && (
              <div className="hidden text-right md:block">
                <p className="text-sm font-semibold text-light">
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user?.username || 'مشرف'}
                </p>
                <p className="text-xs text-light-lighter">
                  {user?.role === 'supervisor' ? 'مشرف' : user?.role || 'مستخدم'}
                </p>
              </div>
            )}
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute left-0 mt-2 w-48 rounded-lg bg-dark-light border border-dark-lighter shadow-lg z-20">
                <div className="py-1">
                  <button
                    onClick={() => {
                      router.push('/dashboard/profile');
                      setShowUserMenu(false);
                    }}
                    className="block w-full text-right px-4 py-2 text-sm text-light hover:bg-dark transition-colors"
                  >
                    الملف الشخصي
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-right px-4 py-2 text-sm text-red-400 hover:bg-dark transition-colors"
                  >
                    تسجيل الخروج
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

