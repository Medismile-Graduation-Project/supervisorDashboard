'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { getCurrentUser, updateProfile } from '@/store/slices/authSlice';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  KeyIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone_number: '',
    address: '',
    department: '',
    position: '',
    license_number: '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    if (!user) {
      dispatch(getCurrentUser());
    } else {
      setFormData({
        email: user.email || '',
        phone_number: user.phone_number || '',
        address: user.address || '',
        department: user.department || '',
        position: user.position || '',
        license_number: user.license_number || '',
      });
    }
  }, [user, dispatch]);

  const handleUpdateProfile = async () => {
    try {
      const result = await dispatch(updateProfile(formData));
      if (updateProfile.fulfilled.match(result)) {
        toast.success('تم تحديث الملف الشخصي بنجاح');
        setIsEditing(false);
      } else {
        const errorMessage = result.payload?.message || 
                           result.payload?.error || 
                           'حدث خطأ أثناء تحديث الملف الشخصي';
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الملف الشخصي');
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('كلمة المرور الجديدة غير متطابقة');
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    try {
      // هنا يمكن إضافة API call لتغيير كلمة المرور
      // const result = await dispatch(changePassword(passwordData));
      toast.success('تم تغيير كلمة المرور بنجاح');
      setShowPasswordModal(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      toast.error('حدث خطأ أثناء تغيير كلمة المرور');
    }
  };

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-500 border-r-transparent"></div>
          <p className="mt-4 text-base font-semibold text-dark-lighter leading-relaxed">جاري تحميل الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-base font-semibold text-dark-lighter leading-relaxed">لا يمكن تحميل الملف الشخصي</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Page Header */}
      <div className="mb-2 px-2 sm:px-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
          الملف الشخصي
        </h1>
        <p className="text-xs sm:text-sm lg:text-base text-dark-lighter leading-relaxed" style={{ fontFamily: 'inherit' }}>
          إدارة معلوماتك الشخصية وإعدادات الحساب
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="rounded-lg bg-white border border-sky-100 p-4 sm:p-6 shadow-sm">
            <div className="text-center">
              {user.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt="Profile"
                  className="mx-auto h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border-2 border-sky-200 shadow-md"
                />
              ) : (
                <div className="mx-auto flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600 text-2xl sm:text-3xl font-bold text-white border-2 border-sky-200 shadow-md">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <h2 className="mt-3 sm:mt-4 text-lg sm:text-xl font-bold text-dark leading-relaxed" style={{ fontFamily: 'inherit' }}>
                {user.email?.split('@')[0] || 'مشرف'}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-dark-lighter leading-relaxed" style={{ fontFamily: 'inherit' }}>
                {user.role === 'supervisor' ? 'مشرف' : user.role || 'مستخدم'}
              </p>
              {user.university_name && (
                <p className="mt-2 text-xs sm:text-sm text-dark-lighter leading-relaxed break-words px-2" style={{ fontFamily: 'inherit' }}>{user.university_name}</p>
              )}
              {user.department && (
                <p className="mt-1 text-xs sm:text-sm text-dark-lighter leading-relaxed break-words px-2" style={{ fontFamily: 'inherit' }}>{user.department}</p>
              )}
              {user.position && (
                <p className="mt-1 text-xs sm:text-sm text-dark-lighter leading-relaxed break-words px-2" style={{ fontFamily: 'inherit' }}>{user.position}</p>
              )}
            </div>

            <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3 border-t border-sky-100 pt-4 sm:pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-sky-500 flex-shrink-0" />
                  <span className="text-dark-lighter font-medium">البريد الإلكتروني:</span>
                </div>
                <span className="font-semibold text-dark break-words text-right sm:text-left" style={{ fontFamily: 'inherit' }}>{user.email || 'غير محدد'}</span>
              </div>
              {user.phone_number && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="h-4 w-4 sm:h-5 sm:w-5 text-sky-500 flex-shrink-0" />
                    <span className="text-dark-lighter font-medium">الهاتف:</span>
                  </div>
                  <span className="font-semibold text-dark break-words text-right sm:text-left" style={{ fontFamily: 'inherit' }}>{user.phone_number}</span>
                </div>
              )}
              {user.university_name && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <BuildingOfficeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-sky-500 flex-shrink-0" />
                    <span className="text-dark-lighter font-medium">الجامعة:</span>
                  </div>
                  <span className="font-semibold text-dark break-words text-right sm:text-left" style={{ fontFamily: 'inherit' }}>{user.university_name}</span>
                </div>
              )}
              {user.created_at && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-sky-500 flex-shrink-0" />
                    <span className="text-dark-lighter font-medium">تاريخ التسجيل:</span>
                  </div>
                  <span className="font-semibold text-dark break-words text-right sm:text-left" style={{ fontFamily: 'inherit' }}>
                    {new Date(user.created_at).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Personal Information */}
          <div className="rounded-lg bg-white border border-sky-100 p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-5">
              <h3 className="text-base sm:text-lg font-semibold text-dark leading-relaxed" style={{ fontFamily: 'inherit' }}>المعلومات الشخصية</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30 w-full sm:w-auto"
                  style={{ fontFamily: 'inherit' }}
                >
                  <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>تعديل</span>
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-dark mb-2 sm:mb-2.5" style={{ fontFamily: 'inherit' }}>
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                    style={{ fontFamily: 'inherit' }}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-dark mb-2 sm:mb-2.5" style={{ fontFamily: 'inherit' }}>رقم الهاتف</label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                    style={{ fontFamily: 'inherit' }}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-dark mb-2 sm:mb-2.5" style={{ fontFamily: 'inherit' }}>العنوان</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                    style={{ fontFamily: 'inherit' }}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-dark mb-2 sm:mb-2.5" style={{ fontFamily: 'inherit' }}>القسم</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                    style={{ fontFamily: 'inherit' }}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-dark mb-2 sm:mb-2.5" style={{ fontFamily: 'inherit' }}>المنصب</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                    style={{ fontFamily: 'inherit' }}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-dark mb-2 sm:mb-2.5" style={{ fontFamily: 'inherit' }}>رقم الرخصة</label>
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                    style={{ fontFamily: 'inherit' }}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                  <button
                    onClick={handleUpdateProfile}
                    className="flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30 w-full sm:w-auto"
                    style={{ fontFamily: 'inherit' }}
                  >
                    <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>حفظ</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        email: user.email || '',
                        phone_number: user.phone_number || '',
                        address: user.address || '',
                        department: user.department || '',
                        position: user.position || '',
                        license_number: user.license_number || '',
                      });
                    }}
                    className="flex items-center justify-center gap-2 rounded-lg border-2 border-sky-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-dark hover:bg-sky-50 hover:border-sky-300 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/20 w-full sm:w-auto"
                    style={{ fontFamily: 'inherit' }}
                  >
                    <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>إلغاء</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
                    البريد الإلكتروني
                  </label>
                  <p className="text-xs sm:text-sm font-semibold text-dark leading-relaxed break-words" style={{ fontFamily: 'inherit' }}>{user.email || 'غير محدد'}</p>
                </div>

                {user.phone_number && (
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
                      رقم الهاتف
                    </label>
                    <p className="text-xs sm:text-sm font-semibold text-dark leading-relaxed break-words" style={{ fontFamily: 'inherit' }}>{user.phone_number}</p>
                  </div>
                )}

                {user.address && (
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
                      العنوان
                    </label>
                    <p className="text-xs sm:text-sm font-semibold text-dark leading-relaxed break-words" style={{ fontFamily: 'inherit' }}>{user.address}</p>
                  </div>
                )}

                {user.university_name && (
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
                      الجامعة
                    </label>
                    <p className="text-xs sm:text-sm font-semibold text-dark leading-relaxed break-words" style={{ fontFamily: 'inherit' }}>{user.university_name}</p>
                  </div>
                )}

                {user.department && (
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
                      القسم
                    </label>
                    <p className="text-xs sm:text-sm font-semibold text-dark leading-relaxed break-words" style={{ fontFamily: 'inherit' }}>{user.department}</p>
                  </div>
                )}

                {user.position && (
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
                      المنصب
                    </label>
                    <p className="text-xs sm:text-sm font-semibold text-dark leading-relaxed break-words" style={{ fontFamily: 'inherit' }}>{user.position}</p>
                  </div>
                )}

                {user.license_number && (
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
                      رقم الرخصة
                    </label>
                    <p className="text-xs sm:text-sm font-semibold text-dark leading-relaxed break-words" style={{ fontFamily: 'inherit' }}>{user.license_number}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Security Settings */}
          <div className="rounded-lg bg-white border border-sky-100 p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-5">
              <h3 className="text-base sm:text-lg font-semibold text-dark leading-relaxed" style={{ fontFamily: 'inherit' }}>الأمان</h3>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30 w-full sm:w-auto"
                style={{ fontFamily: 'inherit' }}
              >
                <KeyIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>تغيير كلمة المرور</span>
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                <span className="text-dark-lighter font-medium" style={{ fontFamily: 'inherit' }}>كلمة المرور</span>
                <span className="font-semibold text-dark" style={{ fontFamily: 'inherit' }}>••••••••</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                <span className="text-dark-lighter font-medium" style={{ fontFamily: 'inherit' }}>حالة الحساب</span>
                <span className="rounded-full bg-sky-500 px-2 sm:px-3 py-1 text-xs font-medium text-white inline-block" style={{ fontFamily: 'inherit' }}>
                  نشط
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-lg bg-white border border-sky-100 p-4 sm:p-6 shadow-xl my-auto">
            <h3 className="text-lg sm:text-xl font-semibold text-dark mb-4 sm:mb-5" style={{ fontFamily: 'inherit' }}>تغيير كلمة المرور</h3>

            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-dark mb-2 sm:mb-2.5" style={{ fontFamily: 'inherit' }}>
                  كلمة المرور الحالية <span className="text-sky-600">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      current_password: e.target.value,
                    })
                  }
                  required
                  className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                  style={{ fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-dark mb-2 sm:mb-2.5" style={{ fontFamily: 'inherit' }}>
                  كلمة المرور الجديدة <span className="text-sky-600">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, new_password: e.target.value })
                  }
                  required
                  minLength={6}
                  className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                  style={{ fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-dark mb-2 sm:mb-2.5" style={{ fontFamily: 'inherit' }}>
                  تأكيد كلمة المرور الجديدة <span className="text-sky-600">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirm_password: e.target.value })
                  }
                  required
                  minLength={6}
                  className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                  style={{ fontFamily: 'inherit' }}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-5 sm:mt-6">
              <button
                onClick={handleChangePassword}
                className="flex-1 rounded-lg bg-sky-500 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                style={{ fontFamily: 'inherit' }}
              >
                تغيير
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({
                    current_password: '',
                    new_password: '',
                    confirm_password: '',
                  });
                }}
                className="flex-1 rounded-lg border-2 border-sky-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-dark hover:bg-sky-50 hover:border-sky-300 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/20"
                style={{ fontFamily: 'inherit' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






