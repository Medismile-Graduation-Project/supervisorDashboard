# Supervisor Dashboard - MediSmile

لوحة تحكم المشرفين لنظام MediSmile

## المميزات

- إدارة الحالات السريرية
- مراجعة الجلسات العلاجية
- إدارة المواعيد
- التقييمات الأكاديمية
- إدارة المحتوى المجتمعي
- التقارير والإحصائيات

## التقنيات المستخدمة

- Next.js 15.5.2
- React 19.1.0
- Redux Toolkit
- Tailwind CSS
- Framer Motion
- Heroicons
- Axios

## البدء

```bash
# تثبيت الحزم
npm install

# تشغيل المشروع في وضع التطوير
npm run dev

# بناء المشروع للإنتاج
npm run build

# تشغيل المشروع بعد البناء
npm start
```

## متغيرات البيئة

أنشئ ملف `.env.local` وأضف:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## البنية

```
src/
├── app/              # Next.js App Router
│   ├── dashboard/    # صفحات الداشبورد
│   ├── cases/        # صفحات الحالات
│   ├── sessions/      # صفحات الجلسات
│   ├── appointments/ # صفحات المواعيد
│   ├── evaluations/  # صفحات التقييمات
│   ├── content/      # صفحات المحتوى
│   ├── reports/      # صفحات التقارير
│   └── profile/      # صفحة الملف الشخصي
├── components/       # المكونات المشتركة
├── store/            # Redux Store
├── services/         # API Services
├── hooks/            # Custom Hooks
└── lib/              # Utilities
```

## الترخيص

جميع الحقوق محفوظة © 2025 MediSmile
