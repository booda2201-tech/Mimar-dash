# معمار | لوحة التحكم الإدارية (Angular 16)

مشروع Angular 16 Standalone لتحويل تصاميم HTML الخاصة بمنصة **معمار** لمواد البناء إلى تطبيق حقيقي.

## التشغيل

```bash
cd mimar-admin
npm install
ng serve
```

ثم افتح: [http://localhost:4200](http://localhost:4200)

- تسجيل الدخول: `/login` (أي بيانات صالحة ≥ 6 أحرف لكلمة المرور)
- لوحة التحكم: `/dashboard`

## التقنيات

- Angular 16 (Standalone Components)
- Tailwind CSS + SCSS
- GSAP (أنيميشن)
- Chart.js (رسوم بيانية)
- خط Cairo + RTL كامل

## الصفحات

| المسار | الصفحة |
|--------|--------|
| `/login` | تسجيل الدخول |
| `/dashboard` | الرئيسية |
| `/products` | المنتجات (+ نموذج إضافة Reactive Forms) |
| `/orders` | الطلبات |
| `/customers` | العملاء |
| `/suppliers` | الموردون |
| `/categories` | الفئات |
| `/offers` | العروض والبنرات |
| `/wallet` | المحفظة |
| `/reports` | التقارير |
| `/notifications` | الإشعارات |
| `/settings` | الإعدادات |
| `/team` | فريق العمل والصلاحيات |

## الهيكل

```
src/app/
  core/          # models, mock data, services
  layout/        # MainLayout (Sidebar + Topbar)
  shared/        # مكونات مشتركة
  pages/         # صفحات التطبيق
```

الخدمات جاهزة بـ `HttpClient` ومسار `environment.apiUrl` للربط لاحقاً بـ API حقيقي.
