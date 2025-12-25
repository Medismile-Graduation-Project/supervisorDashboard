'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { getCurrentUser } from '@/store/slices/authSlice';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  KeyIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    department: '',
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
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        department: user.department || '',
      });
    }
  }, [user, dispatch]);

  const handleUpdateProfile = async () => {
    try {
      // هنا يمكن إضافة API call لتحديث الملف الشخصي
      // const result = await dispatch(updateProfile(formData));
      toast.success('تم تحديث الملف الشخصي بنجاح');
      setIsEditing(false);
      dispatch(getCurrentUser());
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
          <p className="mt-4 text-sm text-dark-lighter">جاري تحميل الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-lighter">لا يمكن تحميل الملف الشخصي</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark">الملف الشخصي</h1>
        <p className="mt-1 text-sm text-dark-lighter">
          إدارة معلوماتك الشخصية وإعدادات الحساب
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="rounded-lg bg-light border border-light-gray p-6">
            <div className="text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600 text-3xl font-bold text-white shadow-lg">
                {user.first_name?.[0] || user.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <h2 className="mt-4 text-xl font-bold text-dark">
                {user.first_name && user.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user.username || 'مشرف'}
              </h2>
              <p className="mt-1 text-sm text-dark-lighter">
                {user.role === 'supervisor' ? 'مشرف' : user.role || 'مستخدم'}
              </p>
              {user.department && (
                <p className="mt-2 text-sm text-dark-lighter">{user.department}</p>
              )}
            </div>

            <div className="mt-6 space-y-3 border-t border-light-gray pt-6">
              <div className="flex items-center gap-3 text-sm">
                <EnvelopeIcon className="h-5 w-5 text-dark-lighter" />
                <span className="text-dark-lighter">البريد الإلكتروني:</span>
                <span className="font-medium text-dark">{user.email || 'غير محدد'}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <PhoneIcon className="h-5 w-5 text-dark-lighter" />
                  <span className="text-dark-lighter">الهاتف:</span>
                  <span className="font-medium text-dark">{user.phone}</span>
                </div>
              )}
              {user.created_at && (
                <div className="flex items-center gap-3 text-sm">
                  <CalendarIcon className="h-5 w-5 text-dark-lighter" />
                  <span className="text-dark-lighter">تاريخ التسجيل:</span>
                  <span className="font-medium text-dark">
                    {new Date(user.created_at).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'long',
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
          <div className="rounded-lg bg-light border border-light-gray p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark">المعلومات الشخصية</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
                >
                  <PencilIcon className="h-5 w-5" />
                  تعديل
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      الاسم الأول
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">
                      اسم العائلة
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark mb-2">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark mb-2">القسم</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark mb-2">نبذة</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="اكتب نبذة عنك..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleUpdateProfile}
                    className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
                  >
                    <CheckIcon className="h-5 w-5" />
                    حفظ
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        first_name: user.first_name || '',
                        last_name: user.last_name || '',
                        email: user.email || '',
                        phone: user.phone || '',
                        bio: user.bio || '',
                        department: user.department || '',
                      });
                    }}
                    className="flex items-center gap-2 rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm font-medium text-dark hover:bg-light-gray transition-colors"
                  >
                    <XIcon className="h-5 w-5" />
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-lighter mb-1">
                      الاسم الأول
                    </label>
                    <p className="text-sm font-medium text-dark">
                      {user.first_name || 'غير محدد'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-lighter mb-1">
                      اسم العائلة
                    </label>
                    <p className="text-sm font-medium text-dark">
                      {user.last_name || 'غير محدد'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-lighter mb-1">
                    البريد الإلكتروني
                  </label>
                  <p className="text-sm font-medium text-dark">{user.email || 'غير محدد'}</p>
                </div>

                {user.phone && (
                  <div>
                    <label className="block text-sm font-medium text-dark-lighter mb-1">
                      رقم الهاتف
                    </label>
                    <p className="text-sm font-medium text-dark">{user.phone}</p>
                  </div>
                )}

                {user.department && (
                  <div>
                    <label className="block text-sm font-medium text-dark-lighter mb-1">
                      القسم
                    </label>
                    <p className="text-sm font-medium text-dark">{user.department}</p>
                  </div>
                )}

                {user.bio && (
                  <div>
                    <label className="block text-sm font-medium text-dark-lighter mb-1">
                      نبذة
                    </label>
                    <p className="text-sm text-dark whitespace-pre-wrap">{user.bio}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Security Settings */}
          <div className="rounded-lg bg-light border border-light-gray p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark">الأمان</h3>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
              >
                <KeyIcon className="h-5 w-5" />
                تغيير كلمة المرور
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-dark-lighter">كلمة المرور</span>
                <span className="font-medium text-dark">••••••••</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-lighter">حالة الحساب</span>
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  نشط
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-light p-6">
            <h3 className="text-lg font-semibold text-dark mb-4">تغيير كلمة المرور</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  كلمة المرور الحالية <span className="text-red-500">*</span>
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
                  className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  كلمة المرور الجديدة <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, new_password: e.target.value })
                  }
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  تأكيد كلمة المرور الجديدة <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirm_password: e.target.value })
                  }
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm text-dark focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleChangePassword}
                className="flex-1 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
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
                className="flex-1 rounded-lg border border-dark-lighter bg-light px-4 py-2 text-sm font-medium text-dark hover:bg-light-gray transition-colors"
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

