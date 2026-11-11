# هايبر تك — HYPER TECH

<div dir="rtl">

## متجر إلكترونيات احترافي متكامل · Production-Ready E-Commerce

**هايبر تك** — متجر إلكترونيات المنصورة: واجهة عربية RTL بتصميم فاخر (Warm Ivory / Editorial Light Mode)،
حركات GSAP متقدمة، لوحة تحكم كاملة، طلبات عبر واتساب، صيانة أجهزة، تجميعات PC، ونظام نسخ احتياطي.

> **جاهز للنشر على Vercel** — انظر دليل النشر السريع بالأسفل (`النشر على Vercel`).
> ملف `.env.example` جاهز، وسكربتات البناء مُهيّأة تلقائيًا لـ Vercel.

---

## جدول المحتويات

1. [المزايا](#المزايا)
2. [التقنيات](#التقنيات)
3. [هيكل المشروع](#هيكل-المشروع)
4. [التشغيل المحلي](#التشغيل-المحلي)
5. [متغيرات البيئة](#متغيرات-البيئة)
6. [النشر على Vercel — خطوة بخطوة](#النشر-على-vercel)
7. [لوحة التحكم](#لوحة-التحكم)
8. [السكربتات المتاحة](#السكربتات-المتاحة)
9. [استكشاف الأخطاء](#استكشاف-الأخطاء)

---

## المزايا

### واجهة المتجر (Storefront)
- **تصميم فاخر Light Mode**: نظام ألوان Warm Ivory (`#F7F5F0`) + Deep Charcoal، خطوط عربية/لاتينية ثنائية، ظلال ناعمة وحدود دقيقة.
- **حركات GSAP 3.15 متقدمة**: Hero سينمائي، ستارة انتقالات بين الصفحات، عدّادات أرقام عربية-هندية (٠١٢٣)، كشف تدريجي للكلمات يحافظ على تشكيل العربية — كلها تحترم `prefers-reduced-motion`.
- **سبا أحادي الصفحة**: راوتر hash-based (`#/store`, `#/product/...`, `#/admin`) بدون إعادة تحميل، مع انتقالات ستارة.
- **7 فئات + تجميعات PC**: لابتوبات، تجميعات PC، كارت شاشة، كيبوردات، ماوسات، رامات، تخزين، اكسسوارات.
- **فلترة وفرز حقيقيان**: بحث فوري، فلترة بالفئة/الماركة/التوفر، نطاق سعري، فرز بالسعر/التقييم/الأحدث، مع تحديث الـ URL.
- **صفحة منتج غنية**: معرض صور، مواصفات، شارات أداء، منتجات ذات صلة، حالة المخزون.
- **سلة + إتمام طلب**: سلة تفاعلية، حساب إجمالي من الخادم (لا يُثق بالمتصفح)، طلب عبر واتساب مع رسالة منسّقة.
- **قسم "ماركات نثق فيها"**: لوحات عرض طباعية للعلامات الكبرى (HP · Dell · ASUS) بعدّادات منتجات حقيقية، وقابلة للنقر للفلترة.
- **بحث فوري (⌘K)**: لوحة بحث بالمنتجات والفئات.

### لوحة التحكم (Admin)
- تسجيل دخول آمن (scrypt + كوكيز موقّعة HMAC، 8 ساعات، تحديد معدل المحاولات).
- إدارة كاملة: منتجات، فئات، تجميعات PC، طلبات، طلبات صيانة، إعدادات المتجر.
- رفع صور مباشر إلى Cloudinary بتوقيع رقمي و شريط تقدم حقيقي.
- **مركز نسخ احتياطي**: تقرير PDF عربي RTL كامل (jsPDF + html2canvas) يُرفع إلى Cloudinary، مع سجل نسخ وتحميل عبر بروكسي آمن.
- **إعادة تعيين آمنة**: تتطلب نسخة احتياطية متحققًا من وصولها + عبارة تأكيد `RESET-STORE`.
- **سجل تدقيق (Audit Log)** لكل عمليات الدخول والتعديل والنسخ.

### الخدمات
- طلبات صيانة أجهزة (لابتوب/كمبيوتر/موبايل) مع تتبع حالة.
- زر واتساب عائم مباشر لرقم المتجر.

---

## التقنيات

| الطبقة | التقنية |
|---|---|
| الإطار | **Next.js 16** (App Router) + **React 19** + TypeScript 5 |
| الواجهة | Tailwind CSS 4 + shadcn/ui (New York) + Lucide icons |
| الحركات | **GSAP 3.15** + ScrollTrigger، Lenis smooth scroll، Framer Motion |
| الحالة | Zustand (متجر العميل) + راوتر hash مخصص |
| قاعدة البيانات | **Neon PostgreSQL** + **Prisma 6** |
| الصور | **Cloudinary** (رفع موقّع من المتصفح مباشرة) |
| الأمان | scrypt + HMAC cookies + zod validation + rate limiting |

---

## هيكل المشروع

```
├── prisma/schema.prisma        # مخطط قاعدة البيانات (PostgreSQL)
├── scripts/seed-neon.ts        # بذر الكتالوج + نقل الصور إلى Cloudinary
├── public/                     # الشعار + صور المنتجات والأجواء
└── src/
    ├── app/
    │   ├── page.tsx            # نقطة الدخول الوحيدة (SPA)
    │   ├── layout.tsx          # RTL + الخطوط + الميتا
    │   ├── globals.css         # نظام التصميم (ألوان، ظلال، شبكات)
    │   └── api/                # كل مسارات الـ API
    │       ├── bootstrap/      # الترطيب الأولي للمتجر
    │       ├── orders/ · maintenance/   # الطلبات العامة
    │       └── admin/          # مسارات الإدارة (محمية بجلسة)
    ├── components/
    │   ├── home/               # Hero، الأقسام، الماركات
    │   ├── store/ · product/   # الكتالوج والفلترة وبطاقة المنتج
    │   ├── cart/               # السلة، إتمام الطلب، لوحة الإضافة
    │   ├── admin/              # لوحة التحكم كاملة
    │   ├── layout/             # الهيدر، الفوتر، البحث، واتساب
    │   └── motion/             # مكونات GSAP المشتركة
    ├── lib/
    │   ├── db.ts               # عميل Prisma
    │   ├── repositories.ts     # طبقة الوصول للبيانات (API-first)
    │   ├── server/             # الأمان، التحقق، serializers، Cloudinary
    │   ├── store/              # Zustand stores (بيانات + سلة + واجهة)
    │   └── data/seed.ts        # بذرة الكتالوج الأصلية
    └── types/index.ts          # نماذج المجال (Product, Category, ...)
```

---

## التشغيل المحلي

### المتطلبات
- **Bun** (موصى به) أو Node.js 20+
- حساب Neon PostgreSQL + حساب Cloudinary (روابط بالأسفل)

### الخطوات

```bash
# 1) تثبيت الحزم
bun install                        # يشغّل prisma generate تلقائيًا (postinstall)

# 2) إعداد البيئة
cp .env.example .env               # ثم املأ القيم (انظر الجدول بالأسفل)

# 3) إنشاء الجداول في قاعدة البيانات
bunx prisma db push

# 4) البذر الأولي (منتجات + فئات + تجميعات + إعدادات + نقل الصور إلى Cloudinary)
bun run seed                       # سكربت idempotent — آمن لإعادة التشغيل

# 5) التطوير
bun run dev                        # http://localhost:3000
```

---

## متغيرات البيئة

انسخ من `.env.example` واملأ:

| المتغير | الوصف | مطلوب |
|---|---|---|
| `DATABASE_URL` | رابط Neon PostgreSQL — استخدم نقطة النهاية **المجمّعة** (`-pooler`) مع `&pgbouncer=true` | ✅ |
| `CLOUDINARY_CLOUD_NAME` | اسم سحابة Cloudinary | ✅ |
| `CLOUDINARY_API_KEY` | مفتاح Cloudinary API | ✅ |
| `CLOUDINARY_API_SECRET` | سر Cloudinary (خادم فقط — لا يُعرض للمتصفح أبدًا) | ✅ |
| `ADMIN_INITIAL_USERNAME` | اسم مستخدم المدير — يُنشأ مرة واحدة عند أول إقلاع | ✅ |
| `ADMIN_INITIAL_PASSWORD` | كلمة مرور المدير الأولية — **غيّرها بعد أول دخول** | ✅ |
| `SESSION_SECRET` | سر توقيع الجلسات — `openssl rand -hex 32` | ✅ |
| `NEXT_PUBLIC_APP_URL` | الرابط العام للتطبيق | اختياري |

---

## النشر على Vercel

> المشروع **مُهيّأ بالكامل لـ Vercel**: سكربت البناء `prisma generate && next build` يعمل
> مباشرة، ووضع `standalone` يُعطّل تلقائيًا على Vercel عبر متغير `VERCEL`.

### الخطوة 1 — جهّز الحسابات المجانية
1. **قاعدة البيانات**: [neon.tech](https://neon.tech) → أنشئ مشروعًا → انسخ **Pooled connection string** (الرابط الذي يحتوي `-pooler`).
2. **الصور**: [cloudinary.com](https://cloudinary.com) → Dashboard → انسخ Cloud name / API Key / API Secret.

### الخطوة 2 — جهّز قاعدة البيانات والبذر (مرة واحدة، من جهازك)
```bash
# على جهازك المحلي، بملف .env يشير إلى قاعدة الإنتاج:
bunx prisma db push        # إنشاء الجداول
bun run seed               # بذر الكتالوج + رفع الصور إلى Cloudinary
```

### الخطوة 3 — ارفع المشروع إلى GitHub
```bash
git init && git add . && git commit -m "HYPER TECH v1.0"
git remote add origin https://github.com/USERNAME/hypertech.git
git push -u origin main
```
> `.env` مستثنى تلقائيًا (`.gitignore`) — الأسرار لا تُرفع للمستودع أبدًا.

### الخطوة 4 — أنشئ مشروع Vercel
1. ادخل [vercel.com/new](https://vercel.com/new) → **Import** المستودع.
2. Framework: **Next.js** (يُكتشف تلقائيًا) — لا تلمس Build Command.
3. افتح **Settings → Environment Variables** وأضف (لكل من Production و Preview):

| المتغير | القيمة |
|---|---|
| `DATABASE_URL` | رابط Neon **المجمّع** (`...-pooler...` + `&pgbouncer=true`) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | بيانات Cloudinary |
| `ADMIN_INITIAL_USERNAME` | مثل `admin@hypertech.com` |
| `ADMIN_INITIAL_PASSWORD` | كلمة مرور قوية |
| `SESSION_SECRET` | ناتج `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |

4. اضغط **Deploy** — أول نشر يستغرق 2–4 دقائق.

### الخطوة 5 — تحقق من النجاح
```
✓ https://YOUR-DOMAIN/api/bootstrap     → يرجع JSON (منتجات + فئات)
✓ https://YOUR-DOMAIN                   → المتجر يعمل بالعربية
✓ https://YOUR-DOMAIN/#/admin           → دخول المدير يعمل
```

### بعد أول نشر (مهم)
- **غيّر كلمة مرور المدير** فورًا من `#/admin` (أو حدّث `AdminUser` في القاعدة).
- أي تعديل مستقبلي: `git push` → Vercel يعيد النشر تلقائيًا.

---

## لوحة التحكم

- **الدخول**: `https://YOUR-DOMAIN/#/admin` (أو محليًا `http://localhost:3000/#/admin`)
- **البيانات الأولية**: من متغيري `ADMIN_INITIAL_USERNAME` / `ADMIN_INITIAL_PASSWORD`.
- الجلسة تدوم 8 ساعات، ثم تسجيل خروج تلقائي.

**الأقسام**: نظرة عامة (إحصائيات) · المنتجات · الفئات · التجميعات · الطلبات · الصيانة · النسخ الاحتياطي · الإعدادات.

---

## السكربتات المتاحة

| الأمر | الوظيفة |
|---|---|
| `bun run dev` | خادم التطوير على المنفذ 3000 |
| `bun run build` | **بناء الإنتاج (Vercel-compatible)** — `prisma generate` + `next build` |
| `bun run build:local` | بناء standalone للاستضافة الذاتية |
| `bun run start` | تشغيل نسخة standalone محليًا |
| `bun run seed` | بذر قاعدة البيانات + نقل الصور إلى Cloudinary |
| `bun run lint` | فحص ESLint |
| `bunx prisma db push` | مزامنة المخطط مع القاعدة |
| `bunx prisma studio` | متصفح قاعدة بيانات مرئي |

---

## استكشاف الأخطاء

| المشكلة | الحل |
|---|---|
| `P1001: Can't reach database` | تأكد من `DATABASE_URL` — استخدم `-pooler` مع `sslmode=require` على Vercel |
| المتجر فارغ بعد النشر | نفّذ `bunx prisma db push` ثم `bun run seed` ضد قاعدة الإنتاج (الخطوة 2) |
| رفع الصور يفشل | تحقق من متغيرات `CLOUDINARY_*` الثلاثة في Vercel |
| `SESSION_SECRET` غير معرف | أضفه في Vercel → Settings → Environment Variables وأعد النشر |
| عدم القدرة على دخول المدير | الجلسات موقّعة — تأكد أن `SESSION_SECRET` ثابت عبر كل النشرات |

---

## الوثائق الإضافية

- `DEPLOYMENT.md` — دليل النشر المتقدم (المعمارية، تدفق البيانات، الأمان)
- `PHASE_02_BACKEND_HANDOFF.md` — توثيق طبقة الخادم بالتفصيل
- `CONVENTIONS.md` — اصطلاحات الكود

---

**© هايبر تك — HYPER TECH** · متجر إلكترونيات المنصورة

</div>
