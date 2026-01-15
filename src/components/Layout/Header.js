'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { BellIcon, MagnifyingGlassIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { logout } from '@/store/slices/authSlice';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { fetchNotifications, markNotificationAsRead } from '@/store/slices/notificationsSlice';
import { searchAcrossAll, setQuery, clearSearch } from '@/store/slices/searchSlice';
import SearchDropdown from '@/components/Search/SearchDropdown';
import Image from 'next/image';

export default function Header({ onMenuClick }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, initialized } = useAppSelector((state) => state.auth);
  const { notifications, unreadCount, loading } = useAppSelector((state) => state.notifications);
  const { query: searchQuery, results: searchResults, loading: searchLoading } = useAppSelector((state) => state.search);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    setMounted(true);
    // جلب الإشعارات عند تحميل المكون
    if (initialized && user) {
      dispatch(fetchNotifications({ limit: 5 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, user]);

  // تحديث الإشعارات كل 30 ثانية (فقط إذا كان المستخدم مسجل دخول)
  useEffect(() => {
    if (!initialized || !user) return;

    const interval = setInterval(() => {
      dispatch(fetchNotifications({ limit: 5 }));
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, user]);

  const handleNotificationClick = async (notification) => {
    // تمييز الإشعار كمقروء
    if (!notification.is_read) {
      await dispatch(markNotificationAsRead(notification.id));
    }

    // الانتقال للكائن المرتبط
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
          router.push(`/dashboard/notifications`);
      }
    } else {
      router.push(`/dashboard/notifications`);
    }

    setShowNotificationsMenu(false);
  };

  const handleLogout = async () => {
    await dispatch(logout());
    router.push('/login');
  };

  // Debounce search function
  useEffect(() => {
    let timeout;
    if (searchInput && searchInput.trim().length >= 2) {
      timeout = setTimeout(() => {
        dispatch(setQuery(searchInput.trim()));
        dispatch(searchAcrossAll(searchInput.trim()));
        setShowSearchDropdown(true);
      }, 300);
    } else if (searchInput.trim().length === 0) {
      dispatch(clearSearch());
      setShowSearchDropdown(false);
    }
    return () => clearTimeout(timeout);
  }, [searchInput, dispatch]);

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
  };

  const handleSearchInputFocus = () => {
    if (searchQuery && searchResults.total > 0) {
      setShowSearchDropdown(true);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim().length >= 2) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchInput.trim())}`);
      setShowSearchDropdown(false);
      setShowSearch(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 sm:h-16 items-center justify-between bg-white border-b border-sky-100 shadow-sm px-3 sm:px-4 lg:px-6">
      {/* Left Side - Menu Button (Mobile) & Logo */}
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-dark-lighter hover:bg-sky-50 hover:text-dark transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/20"
          aria-label="فتح القائمة"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-sky-200 bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
            <Image
              src="/Screenshot_٢٠٢٥٠٩٠٨-١٢٣٢٥٥.jpg"
              alt="MediSmile Logo"
              width={32}
              height={32}
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <h1 className="text-sm sm:text-base font-bold text-dark hidden sm:block" style={{ fontFamily: 'inherit' }}>
            MediSmile
          </h1>
        </div>
      </div>

      {/* Right Side - Search, Notifications, User */}
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-shrink-0">
        {/* Search - Desktop */}
        <div className="hidden md:block relative w-48 lg:w-64 min-w-0">
          <form onSubmit={handleSearchSubmit}>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 z-10">
              <MagnifyingGlassIcon className="h-5 w-5 text-dark-lighter" />
            </div>
            <input
              type="text"
              placeholder="ابحث في النظام..."
              value={searchInput}
              onChange={handleSearchInputChange}
              onFocus={handleSearchInputFocus}
              className="block w-full rounded-lg border border-sky-200 bg-sky-50 py-2 sm:py-2.5 pr-10 pl-4 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all"
              style={{ fontFamily: 'inherit' }}
            />
          </form>
          {showSearchDropdown && searchQuery && (
            <SearchDropdown
              results={searchResults}
              loading={searchLoading}
              query={searchQuery}
              onClose={() => setShowSearchDropdown(false)}
            />
          )}
        </div>

        {/* Search Button - Mobile */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="md:hidden p-2 rounded-lg text-dark-lighter hover:bg-sky-50 hover:text-dark transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/20"
          aria-label="البحث"
        >
          <MagnifyingGlassIcon className="h-5 w-5" />
        </button>

        {/* Mobile Search Bar */}
        {showSearch && (
          <div className="md:hidden fixed top-14 left-0 right-0 bg-white border-b border-sky-100 shadow-md px-4 py-3 z-40">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-dark-lighter" />
                </div>
                <input
                  type="text"
                  placeholder="ابحث في النظام..."
                  value={searchInput}
                  onChange={handleSearchInputChange}
                  onFocus={handleSearchInputFocus}
                  className="block w-full rounded-lg border-2 border-sky-200 bg-sky-50 py-2.5 pr-10 pl-4 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all"
                  style={{ fontFamily: 'inherit' }}
                  autoFocus
                />
              </div>
            </form>
            {showSearchDropdown && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-1">
                <SearchDropdown
                  results={searchResults}
                  loading={searchLoading}
                  query={searchQuery}
                  onClose={() => {
                    setShowSearchDropdown(false);
                    setShowSearch(false);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotificationsMenu(!showNotificationsMenu);
              setShowUserMenu(false);
              setShowSearch(false);
              setShowSearchDropdown(false);
            }}
            className="relative rounded-lg p-2 sm:p-2.5 text-dark-lighter hover:bg-sky-50 hover:text-dark transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/20"
            aria-label="الإشعارات"
          >
            <BellIcon className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 left-0 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] sm:text-xs font-bold text-white shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotificationsMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowNotificationsMenu(false)}
              />
              <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-lg bg-white border border-sky-200 shadow-xl z-20 max-h-96 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-sky-200">
                  <h3 className="text-sm font-semibold text-dark" style={{ fontFamily: 'inherit' }}>الإشعارات</h3>
                  <button
                    onClick={() => {
                      router.push('/dashboard/notifications');
                      setShowNotificationsMenu(false);
                    }}
                    className="text-xs text-sky-500 hover:text-sky-600 font-medium transition-colors"
                    style={{ fontFamily: 'inherit' }}
                  >
                    عرض الكل
                  </button>
                </div>
                <div className="overflow-y-auto flex-1">
                  {loading ? (
                    <div className="p-6 text-center">
                      <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-sky-500 border-r-transparent"></div>
                    </div>
                  ) : notifications && notifications.length > 0 ? (
                    <div className="divide-y divide-sky-100">
                      {notifications.slice(0, 5).map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full text-right px-4 py-3 hover:bg-sky-50 transition-colors ${
                            !notification.is_read ? 'bg-sky-50/50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${
                                !notification.is_read ? 'bg-sky-500' : 'bg-transparent'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-dark truncate" style={{ fontFamily: 'inherit' }}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-dark-lighter mt-1.5 line-clamp-2 leading-relaxed" style={{ fontFamily: 'inherit' }}>
                                {notification.message}
                              </p>
                              <p className="text-xs text-dark-lighter mt-1.5" style={{ fontFamily: 'inherit' }}>
                                {new Date(notification.created_at).toLocaleDateString('ar-SA', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-sm text-dark-lighter" style={{ fontFamily: 'inherit' }}>لا توجد إشعارات</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotificationsMenu(false);
              setShowSearch(false);
              setShowSearchDropdown(false);
            }}
            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-sky-400 text-white text-xs sm:text-sm font-semibold hover:bg-sky-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/20 flex-shrink-0"
          >
            {mounted && initialized
              ? user?.first_name?.[0] || user?.username?.[0]?.toUpperCase() || 'A'
              : 'A'}
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute left-0 mt-2 w-40 sm:w-48 rounded-lg bg-white border border-sky-200 shadow-xl z-20">
                <div className="py-1.5">
                  <button
                    onClick={() => {
                      router.push('/dashboard/profile');
                      setShowUserMenu(false);
                    }}
                    className="block w-full text-right px-4 py-2.5 text-sm text-dark hover:bg-sky-50 transition-colors focus:outline-none"
                    style={{ fontFamily: 'inherit' }}
                  >
                    الملف الشخصي
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-right px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors focus:outline-none"
                    style={{ fontFamily: 'inherit' }}
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

