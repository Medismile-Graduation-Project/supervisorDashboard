# بنية المشروع - Supervisor Dashboard

## هيكل المجلدات

```
src/app/
├── layout.js              # Layout الرئيسي (Root Layout) - Providers + Toaster
├── page.js                # الصفحة الرئيسية (إعادة توجيه)
├── login/
│   └── page.js            # صفحة تسجيل الدخول
│
└── dashboard/             # صفحات الداشبورد
    ├── layout.js          # DashboardLayout (Sidebar + Header) - يطبق على جميع الصفحات الفرعية
    ├── page.js            # الصفحة الرئيسية للداشبورد
    │
    ├── cases/             # صفحات الحالات
    │   ├── page.js        # قائمة الحالات
    │   └── [id]/
    │       └── page.js    # تفاصيل الحالة
    │
    ├── sessions/          # صفحات الجلسات
    │   └── page.js        # مراجعة الجلسات
    │
    ├── appointments/      # صفحات المواعيد (سيتم إنشاؤها)
    ├── evaluations/       # صفحات التقييمات (سيتم إنشاؤها)
    ├── content/           # صفحات المحتوى (سيتم إنشاؤها)
    ├── reports/           # صفحات التقارير (سيتم إنشاؤها)
    └── profile/           # صفحة الملف الشخصي (سيتم إنشاؤها)
```

## كيف يعمل Layout في Next.js App Router

### 1. Root Layout (`app/layout.js`)
- يطبق على **جميع** الصفحات
- يحتوي على: Providers (Redux), Toaster, Fonts
- لا يحتوي على Sidebar أو Header

### 2. Dashboard Layout (`app/dashboard/layout.js`)
- يطبق على **جميع** الصفحات داخل `/dashboard/*`
- يحتوي على: DashboardLayout (Sidebar + Header)
- جميع الصفحات الفرعية (`/dashboard/cases`, `/dashboard/sessions`, إلخ) ترث هذا Layout

### 3. Layouts المكررة (تم حذفها)
- `app/cases/layout.js` - **تم حذفه** (لا حاجة - يستخدم layout من dashboard)
- `app/sessions/layout.js` - **تم حذفه** (لا حاجة - يستخدم layout من dashboard)

## لماذا لا يوجد Layout في cases/sessions؟

في Next.js App Router، Layouts تورث من المجلدات الأب:
- `/dashboard/cases` يستخدم `dashboard/layout.js`
- `/dashboard/sessions` يستخدم `dashboard/layout.js`

**لا حاجة لـ Layout منفصل** إلا إذا أردت layout مختلف.

## المجلد المكرر `app/app`

تم حذفه - كان مجلد مكرر غير ضروري.

## البنية النهائية

```
app/
├── layout.js          # Root Layout
├── page.js            # Home (redirect)
├── login/
│   └── page.js
└── dashboard/
    ├── layout.js      # DashboardLayout (Sidebar + Header)
    ├── page.js        # Dashboard Home
    ├── cases/
    │   ├── page.js
    │   └── [id]/
    │       └── page.js
    ├── sessions/
    │   └── page.js
    └── ... (باقي الصفحات)
```






























