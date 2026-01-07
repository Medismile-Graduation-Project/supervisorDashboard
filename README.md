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

### للإنتاج (Railway / Render)

قم بتعيين متغير البيئة في منصة الاستضافة (Railway أو Render):

```
NEXT_PUBLIC_API_URL=https://medismile1-production.up.railway.app/api
```

### للتطوير المحلي (اختياري)

إذا كنت تريد تشغيل المشروع محلياً، أنشئ ملف `.env.local`:

```
NEXT_PUBLIC_API_URL=https://medismile1-production.up.railway.app/api
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
