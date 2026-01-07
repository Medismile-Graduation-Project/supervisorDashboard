# هيكل المشروع

## ملفات Layout (تكون .js دائماً)
- `src/app/layout.js` - Layout الرئيسي
- `src/app/providers.js` - Redux Provider
- `src/app/dashboard/layout.js` - Layout الداشبورد
- `src/components/Layout/DashboardLayout.js` - Layout مكون الداشبورد
- `src/components/Layout/Sidebar.js` - الشريط الجانبي
- `src/components/Layout/Header.js` - رأس الصفحة

## ملفات Redux (تكون .js دائماً)
- `src/store/store.js` - Redux Store
- `src/store/slices/authSlice.js` - Auth Slice
- `src/store/slices/casesSlice.js` - Cases Slice
- `src/store/slices/sessionsSlice.js` - Sessions Slice
- `src/store/slices/appointmentsSlice.js` - Appointments Slice
- `src/store/slices/evaluationsSlice.js` - Evaluations Slice
- `src/store/slices/contentSlice.js` - Content Slice
- `src/store/slices/reportsSlice.js` - Reports Slice
- `src/store/slices/notificationsSlice.js` - Notifications Slice

## ملفات API Services (تكون .js دائماً)
- `src/lib/axios.js` - Axios Configuration

## ملفات Hooks (تكون .js دائماً)
- `src/hooks/useAppDispatch.js` - Redux Dispatch Hook
- `src/hooks/useAppSelector.js` - Redux Selector Hook

## الصفحات (يمكن أن تكون .js أو .jsx)
- `src/app/page.js` - الصفحة الرئيسية
- `src/app/login/page.js` - صفحة تسجيل الدخول
- `src/app/dashboard/page.js` - صفحة الداشبورد
- `src/app/cases/page.js` - صفحة الحالات (سيتم إنشاؤها)
- `src/app/sessions/page.js` - صفحة الجلسات (سيتم إنشاؤها)
- `src/app/appointments/page.js` - صفحة المواعيد (سيتم إنشاؤها)
- `src/app/evaluations/page.js` - صفحة التقييمات (سيتم إنشاؤها)
- `src/app/content/page.js` - صفحة المحتوى (سيتم إنشاؤها)
- `src/app/reports/page.js` - صفحة التقارير (سيتم إنشاؤها)
- `src/app/profile/page.js` - صفحة الملف الشخصي (سيتم إنشاؤها)

## ملاحظات مهمة
- جميع ملفات Layout و Redux و API Services **يجب أن تكون .js**
- الصفحات يمكن أن تكون .js أو .jsx حسب الحاجة
- المكونات (Components) يمكن أن تكون .js أو .jsx































