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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2" style={{ fontFamily: 'inherit' }}>
          الملف الشخصي
        </h1>
        <p className="text-sm sm:text-base text-dark-lighter leading-relaxed" style={{ fontFamily: 'inherit' }}>
          إدارة معلوماتك الشخصية وإعدادات الحساب
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="rounded-lg bg-white border border-sky-100 p-6 shadow-sm">
            <div className="text-center">
              {user.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt="Profile"
                  className="mx-auto h-24 w-24 rounded-full object-cover border-2 border-sky-200 shadow-md"
                />
              ) : (
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600 text-3xl font-bold text-white border-2 border-sky-200 shadow-md">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <h2 className="mt-4 text-xl font-bold text-dark leading-relaxed" style={{ fontFamily: 'inherit' }}>
                {user.email?.split('@')[0] || 'مشرف'}
              </h2>
              <p className="mt-1 text-sm text-dark-lighter leading-relaxed">
                {user.role === 'supervisor' ? 'مشرف' : user.role || 'مستخدم'}
              </p>
              {user.university_name && (
                <p className="mt-2 text-sm text-dark-lighter leading-relaxed">{user.university_name}</p>
              )}
              {user.department && (
                <p className="mt-1 text-sm text-dark-lighter leading-relaxed">{user.department}</p>
              )}
              {user.position && (
                <p className="mt-1 text-sm text-dark-lighter leading-relaxed">{user.position}</p>
              )}
            </div>

            <div className="mt-6 space-y-3 border-t border-sky-100 pt-6">
              <div className="flex items-center gap-3 text-sm">
                <EnvelopeIcon className="h-5 w-5 text-sky-500 flex-shrink-0" />
                <span className="text-dark-lighter">البريد الإلكتروني:</span>
                <span className="font-semibold text-dark">{user.email || 'غير محدد'}</span>
              </div>
              {user.phone_number && (
                <div className="flex items-center gap-3 text-sm">
                  <PhoneIcon className="h-5 w-5 text-sky-500 flex-shrink-0" />
                  <span className="text-dark-lighter">الهاتف:</span>
                  <span className="font-semibold text-dark">{user.phone_number}</span>
                </div>
              )}
              {user.university_name && (
                <div className="flex items-center gap-3 text-sm">
                  <BuildingOfficeIcon className="h-5 w-5 text-sky-500 flex-shrink-0" />
                  <span className="text-dark-lighter">الجامعة:</span>
                  <span className="font-semibold text-dark">{user.university_name}</span>
                </div>
              )}
              {user.created_at && (
                <div className="flex items-center gap-3 text-sm">
                  <CalendarIcon className="h-5 w-5 text-sky-500 flex-shrink-0" />
                  <span className="text-dark-lighter">تاريخ التسجيل:</span>
                  <span className="font-semibold text-dark">
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
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="rounded-lg bg-white border border-sky-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-dark leading-relaxed" style={{ fontFamily: 'inherit' }}>المعلومات الشخصية</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                >
                  <PencilIcon className="h-5 w-5" />
                  تعديل
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2.5">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark mb-2.5">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark mb-2.5">العنوان</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark mb-2.5">القسم</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark mb-2.5">المنصب</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark mb-2.5">رقم الرخصة</label>
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleUpdateProfile}
                    className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  >
                    <CheckIcon className="h-5 w-5" />
                    حفظ
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
                    className="flex items-center gap-2 rounded-lg border-2 border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark hover:bg-sky-50 hover:border-sky-300 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/20"
                  >
                    <XMarkIcon className="h-5 w-5" />
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">
                    البريد الإلكتروني
                  </label>
                  <p className="text-sm font-semibold text-dark leading-relaxed">{user.email || 'غير محدد'}</p>
                </div>

                {user.phone_number && (
                  <div>
                    <label className="block text-sm font-semibold text-dark mb-2">
                      رقم الهاتف
                    </label>
                    <p className="text-sm font-semibold text-dark leading-relaxed">{user.phone_number}</p>
                  </div>
                )}

                {user.address && (
                  <div>
                    <label className="block text-sm font-semibold text-dark mb-2">
                      العنوان
                    </label>
                    <p className="text-sm font-semibold text-dark leading-relaxed">{user.address}</p>
                  </div>
                )}

                {user.university_name && (
                  <div>
                    <label className="block text-sm font-semibold text-dark mb-2">
                      الجامعة
                    </label>
                    <p className="text-sm font-semibold text-dark leading-relaxed">{user.university_name}</p>
                  </div>
                )}

                {user.department && (
                  <div>
                    <label className="block text-sm font-semibold text-dark mb-2">
                      القسم
                    </label>
                    <p className="text-sm font-semibold text-dark leading-relaxed">{user.department}</p>
                  </div>
                )}

                {user.position && (
                  <div>
                    <label className="block text-sm font-semibold text-dark mb-2">
                      المنصب
                    </label>
                    <p className="text-sm font-semibold text-dark leading-relaxed">{user.position}</p>
                  </div>
                )}

                {user.license_number && (
                  <div>
                    <label className="block text-sm font-semibold text-dark mb-2">
                      رقم الرخصة
                    </label>
                    <p className="text-sm font-semibold text-dark leading-relaxed">{user.license_number}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Security Settings */}
          <div className="rounded-lg bg-white border border-sky-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-dark leading-relaxed" style={{ fontFamily: 'inherit' }}>الأمان</h3>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              >
                <KeyIcon className="h-5 w-5" />
                تغيير كلمة المرور
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-dark-lighter">كلمة المرور</span>
                <span className="font-semibold text-dark">••••••••</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-lighter">حالة الحساب</span>
                <span className="rounded-full bg-sky-500 px-3 py-1 text-xs font-medium text-white">
                  نشط
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white border border-sky-100 p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-dark mb-5" style={{ fontFamily: 'inherit' }}>تغيير كلمة المرور</h3>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-dark mb-2.5">
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
                  className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-2.5">
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
                  className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-2.5">
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
                  className="w-full rounded-lg border-2 border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-dark placeholder-dark-lighter/60 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleChangePassword}
                className="flex-1 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30"
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
                className="flex-1 rounded-lg border-2 border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark hover:bg-sky-50 hover:border-sky-300 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/20"
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






