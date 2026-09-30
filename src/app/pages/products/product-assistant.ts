/** عقد JSON الخاص ببوت معمار — نفس هيكل شاشة «إضافة منتج جديد» */
export interface BotDiscount {
  type: 'percentage' | 'fixed';
  value: number;
  startDate: string | null;
  durationDays: number;
}

export interface BotPriceTier {
  fromQty: number | null;
  toQty: number | null;
  unitPrice: number;
}

export interface BotSpec {
  specAr: string;
  valueAr: string;
  specEn: string;
  valueEn: string;
}

export interface BotVariant {
  attrs: Record<string, string>;
  price: number | null;
  stock: number | null;
  sku: string;
}

export interface BotProductJson {
  basicInfo: {
    nameAr: string;
    nameEn: string;
    descriptionAr: string;
    descriptionEn: string;
    category: string | null;
    brand: string | null;
    sku: string;
    flags: { isActive: boolean; isNew: boolean; hasVariants: boolean };
  };
  pricingAndInventory: {
    price: number | null;
    stock: number | null;
    priceTiers: BotPriceTier[];
    tierDiscount: (BotDiscount & { tierIndex?: number }) | null;
    productDiscount: BotDiscount | null;
  };
  specifications: BotSpec[];
  variantProps?: string[];
  variants?: BotVariant[];
}

export interface BotContext {
  categories: { name: string; nameEn?: string }[];
  brands: { name: string; nameEn?: string }[];
}

// ---------- labels & sanitizing ----------

type BasicField = 'nameAr' | 'nameEn' | 'descriptionAr' | 'descriptionEn' | 'sku' | 'price' | 'stock' | 'category' | 'brand';

/** يحدد لو عنوان الحقل (زي «اسم المنتج بالعربي» أو «Product name (EN)») يخص حقل أساسي */
export function basicFieldOf(label: string): BasicField | null {
  const f = fold(label).replace(/[*()\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
  const en = /(^|\s)en($|\s)|انجليزي|english/.test(f);
  if (/description|وصف/.test(f)) return en || /^description/.test(f) ? 'descriptionEn' : 'descriptionAr';
  if (/sku|رمز|كود|code/.test(f)) return 'sku';
  if (/(^|\s)(name|اسم|الاسم)($|\s)|product name|اسم المنتج|^المنتج/.test(f)) return en || /^(product )?name/.test(f) ? 'nameEn' : 'nameAr';
  if (/جمل|wholesale/.test(f)) return null;
  if (/سعر|price/.test(f)) return 'price';
  if (/مخزون|stock|(^|\s)(ال)?كميه($|\s)|quantity/.test(f)) return 'stock';
  if (/فئ|قسم|تصنيف|category/.test(f)) return 'category';
  if (/براند|ماركه|brand/.test(f)) return 'brand';
  return null;
}

/** بيشيل عنوان الحقل اللي اتنسخ مع القيمة، زي «اسم المنتج بالعربي: ...» */
export function stripLabel(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value).trim();
  for (let i = 0; i < 2; i++) {
    const m = text.match(/^([^:：\n]{1,40}?)\s*\*?\s*[:：]\s*/);
    if (!m || !basicFieldOf(m[1])) break;
    text = text.slice(m[0].length).trim();
  }
  return text;
}

/** مواصفة اسمها في الحقيقة حقل أساسي (اسم/وصف/سعر/مخزون/SKU/فئة/براند/خصم) */
export function isBasicSpec(spec: { specAr?: string; specEn?: string; valueAr?: string; valueEn?: string }): boolean {
  const labels = [spec.specAr, spec.specEn].filter((l): l is string => !!l);
  const all = [...labels, spec.valueAr, spec.valueEn].filter((l): l is string => !!l);
  return (
    labels.some((l) => !!basicFieldOf(l) || isSpecHeader(l)) ||
    all.some((l) => /خصم|تخفيض|discount|سعر الجمل|أسعار الجمل|اسعار الجمل|wholesale|نسب[ةه]\s*\d+\s*%/i.test(l))
  );
}

const SPEC_PREFIX =
  /^\s*(?:\d+\s*[.)\-–]\s*|[-•*]\s*|(?:ال)?مواصف[ةه]\s*[:：]?\s*|(?:ال)?قيم[ةه]\s*[:：]?\s*|spec\s*\(en\)\s*[:：]?\s*|value\s*\(en\)\s*[:：]?\s*|spec\s*[:：]\s*|value\s*[:：]\s*)/i;

/** «1. المواصفة وحدة البيع» ← «وحدة البيع»، «القيمة كيس» ← «كيس» */
export function cleanSpecText(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value).trim();
  for (let i = 0; i < 4 && SPEC_PREFIX.test(text); i++) text = text.replace(SPEC_PREFIX, '').trim();
  // أي ذيل إنجليزي ملزوق: «كيس | Value (EN): bag»
  text = text.split(/\s*\|\s*|\s*\b(?:spec|value)\s*\(en\)\s*[:：]?/i)[0];
  return text.replace(/^[:：|\-–]\s*/, '').trim();
}

/** عناوين جدول المواصفات نفسها زي «المواصفة | القيمة» أو «Spec | Value» */
function isSpecHeader(label: string): boolean {
  return /^(?:المواصف[ةه]|المواصفات|مواصف[ةه]|القيم[ةه]|spec(?:ification)?s?|value|spec \(en\)|value \(en\))$/i.test(
    fold(label).replace(/\s*\*$/, '')
  );
}

/** سطور «عنوان: قيمة» للحقول الأساسية — بتتشال من النص وترجع كقيم جاهزة */
function labeledFields(text: string): { text: string; fields: Partial<Record<BasicField, string>> } {
  const fields: Partial<Record<BasicField, string>> = {};
  const kept: string[] = [];
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([^:：\n]{1,40}?)\s*\*?\s*[:：]\s*(.+)$/);
    const field = m ? basicFieldOf(m[1]) : null;
    if (m && field && !fields[field]) fields[field] = m[2].trim();
    else kept.push(line);
  }
  return { text: kept.join('\n'), fields };
}

// ---------- text helpers ----------

const NUM = '(\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|\\d+(?:\\.\\d+)?)';
const CUR = '(?:ر\\.?\\s?س|ريال|جنيه|ج\\.?م|egp|sar)';
const UNIT = '(?:قطع[ةه]?|وحد[ةه]|وحدات|كيس|اكياس|أكياس|طن|متر|لوح|الواح|ألواح|كرتون[ةه]?|علب[ةه]?|pcs)';
const END = '(?=\\s|$|[،,.:])';

function normalize(raw: string): string {
  return raw
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x6f0))
    .replace(/٫/g, '.')
    .replace(/٪/g, '%')
    .replace(/ـ/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

export function fold(s: string): string {
  return (s || '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u0652]/g, '')
    .toLowerCase()
    .trim();
}

function toNum(s: string | undefined): number | null {
  if (!s) return null;
  const n = Number(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** يمسح الجزء اللي اتفهم عشان مايتقراش تاني كسعر أو اسم */
function blank(text: string, start: number, length: number, filler = ' ،'): string {
  return text.slice(0, start) + filler.padEnd(length, ' ').slice(0, Math.max(length, 1)) + text.slice(start + length);
}

const CLAUSE_END = /[،,\n]|\.(?=\s|$)/;

// ---------- dates ----------

interface FoundDate {
  iso: string;
  index: number;
}

function extractDates(text: string): { text: string; dates: FoundDate[] } {
  const dates: FoundDate[] = [];
  const today = new Date();
  const patterns: [RegExp, (m: RegExpExecArray) => Date | null][] = [
    [/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/g, (m) => new Date(+m[1], +m[2] - 1, +m[3])],
    [
      /(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/g,
      (m) => {
        const a = +m[1];
        const b = +m[2];
        // لو الرقم الأول > 12 يبقى يوم/شهر، غير كده نعتبره شهر/يوم زي حقل التاريخ
        return a > 12 ? new Date(+m[3], b - 1, a) : new Date(+m[3], a - 1, b);
      },
    ],
    [/(?:النهارد[ةه]|اليوم|today)/gi, () => today],
    [/(?:بكر[ةه]|غدا|غداً|tomorrow)/gi, () => new Date(today.getTime() + 86400000)],
  ];
  let out = text;
  for (const [re, make] of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(out))) {
      const d = make(m);
      if (d && !isNaN(d.getTime())) dates.push({ iso: isoDate(d), index: m.index });
      out = blank(out, m.index, m[0].length, ' ');
    }
  }
  dates.sort((a, b) => a.index - b.index);
  return { text: out, dates };
}

// ---------- price tiers ----------

interface FoundTier {
  fromQty: number;
  toQty: number | null;
  unitPrice: number;
  index: number;
}

function extractTiers(text: string): { text: string; tiers: FoundTier[] } {
  const tiers: FoundTier[] = [];
  const PRICE_WORD = '(?:بسعر(?:\\s*(?:ال)?وحد[ةه])?|سعر(?:\\s*(?:ال)?وحد[ةه])?|السعر|ب|=|:)';
  const TO = '(?:إلى|الى|لحد|حتى|لـ|ل|-|–|to)';
  const MORE = '(?:فأكثر|فاكثر|وأكثر|واكثر|فما فوق|وما فوق|او اكثر|أو أكثر|\\+)';
  const rules: [RegExp, (m: RegExpExecArray) => Omit<FoundTier, 'index'> | null][] = [
    // بسعر وحدة 275 من 1 إلى 10
    [
      new RegExp(
        `(?:بسعر|سعر)\\s*(?:ال)?(?:وحد[ةه])?\\s*${NUM}\\s*(?:${CUR}\\s*)?(?:لل?كمي[ةه]\\s*)?من\\s*${NUM}\\s*(?:${UNIT}\\s*)?(?:(?:${TO})\\s*${NUM}|(${MORE}))?`,
        'gi'
      ),
      (m) => ({ unitPrice: toNum(m[1])!, fromQty: toNum(m[2])!, toQty: m[4] ? null : toNum(m[3]) }),
    ],
    // من 1 إلى 10 بسعر 275 / من 11 فأكثر ب 260
    [
      new RegExp(
        `(?:من|from)\\s*${NUM}\\s*(?:${UNIT}\\s*)?(?:(?:${TO})\\s*(${NUM.slice(1, -1)}|بدون حد)|(${MORE}))\\s*(?:${UNIT}\\s*)?[،,]?\\s*${PRICE_WORD}\\s*${NUM}`,
        'gi'
      ),
      (m) => ({
        fromQty: toNum(m[1])!,
        toQty: m[3] || !m[2] || m[2] === 'بدون حد' ? null : toNum(m[2]),
        unitPrice: toNum(m[4])!,
      }),
    ],
    // 1-10: 275
    [
      new RegExp(`${NUM}\\s*[-–]\\s*${NUM}\\s*(?:${UNIT}\\s*)?(?::|=|بسعر|ب)\\s*${NUM}`, 'gi'),
      (m) => ({ fromQty: toNum(m[1])!, toQty: toNum(m[2]), unitPrice: toNum(m[3])! }),
    ],
    // أكثر من 50 بسعر 250
    [
      new RegExp(`(?:أكثر من|اكثر من|فوق|over)\\s*${NUM}\\s*(?:${UNIT}\\s*)?${PRICE_WORD}\\s*${NUM}`, 'gi'),
      (m) => ({ fromQty: toNum(m[1])! + 1, toQty: null, unitPrice: toNum(m[2])! }),
    ],
  ];

  let out = text;

  // سطور بعناوين: «من كمية: 1 | إلى كمية: بدون حد | سعر الوحدة: 275»
  let offset = 0;
  for (const line of text.split('\n')) {
    const price = line.match(new RegExp(`سعر\\s*(?:ال)?وحد[ةه]\\s*[:：]?\\s*${NUM}`));
    const from = line.match(new RegExp(`(?:من|أقل|اقل)\\s*(?:ال)?كمي[ةه]\\s*[:：]?\\s*${NUM}`));
    const to = line.match(new RegExp(`(?:إلى|الى|حتى|لحد|أقصى|اقصى)\\s*(?:ال)?كمي[ةه]\\s*[:：]?\\s*(${NUM.slice(1, -1)}|بدون حد|مفتوح|غير محدود|∞)`));
    if (price && (from || to || /شريح|جمل/.test(line))) {
      const unitPrice = toNum(price[1]);
      const toQty = to && /\d/.test(to[1]) ? toNum(to[1]) : null;
      if (unitPrice) tiers.push({ fromQty: from ? toNum(from[1]) || 0 : 0, toQty, unitPrice, index: offset });
      out = blank(out, offset, line.length);
    }
    offset += line.length + 1;
  }

  for (const [re, make] of rules) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(out))) {
      const tier = make(m);
      if (tier && tier.unitPrice > 0 && tier.fromQty > 0) tiers.push({ ...tier, index: m.index });
      out = blank(out, m.index, m[0].length);
    }
  }

  // «شريحة ... بسعر وحدة 275» من غير كميات
  const bare = new RegExp(`شريح[ةه][^،,.\\n]*?(?:بسعر|سعر)\\s*(?:ال)?(?:وحد[ةه])?\\s*${NUM}`, 'gi');
  let m: RegExpExecArray | null;
  while ((m = bare.exec(out))) {
    tiers.push({ fromQty: 0, toQty: null, unitPrice: toNum(m[1])!, index: m.index });
    out = blank(out, m.index, m[0].length);
  }

  tiers.sort((a, b) => a.index - b.index);
  tiers.forEach((t, i) => {
    if (t.fromQty > 0) return;
    const prev = tiers[i - 1];
    t.fromQty = prev?.toQty ? prev.toQty + 1 : prev ? prev.fromQty + 1 : 1;
  });
  return { text: out, tiers };
}

/** «سعر الجملة: 275» (واختياري «من 50 قطعة») — بيتحول لأول شريحة */
function extractWholesale(text: string): { text: string; tier: { fromQty: number | null; unitPrice: number } | null } {
  const re = new RegExp(
    `(?:سعر|أسعار|اسعار)\\s*(?:ال)?جمل[ةه](?:(?!كمي|من\\s|\\|)[^\\d\\n،,]){0,30}?${NUM}\\s*(?:${CUR}\\s*)?(?:(?:من|لل?كمي[ةه]|ابتداء من|ابتداءً من)\\s*${NUM})?`,
    'i'
  );
  const m = re.exec(text);
  if (!m) return { text, tier: null };
  const unitPrice = toNum(m[1]);
  return {
    text: blank(text, m.index, m[0].length),
    tier: unitPrice ? { fromQty: toNum(m[2]), unitPrice } : null,
  };
}

// ---------- discounts ----------

interface FoundDiscount extends BotDiscount {
  index: number;
  scope: 'tier' | 'product';
}

function durationOf(window: string): number | null {
  const m = window.match(
    new RegExp(`(?:لمد[ةه]|مد[ةه]|لـ|ل)?\\s*${NUM}?\\s*(يوم|ايام|أيام|اسبوع|أسبوع|اسابيع|أسابيع|شهر|شهور|اشهر|أشهر|سن[ةه]|days?|weeks?|months?)`, 'i')
  );
  if (!m) return null;
  const n = toNum(m[1]) ?? 1;
  const unit = fold(m[2]);
  if (/اسبوع|اسابيع|week/.test(unit)) return n * 7;
  if (/شهر|شهور|اشهر|month/.test(unit)) return n * 30;
  if (/سنه/.test(unit)) return n * 365;
  return n;
}

function extractDiscounts(text: string, dates: FoundDate[]): { text: string; discounts: FoundDiscount[] } {
  const discounts: FoundDiscount[] = [];
  const PCT = '(%|في\\s*الم(?:ي|ائ)[ةه]|بالم(?:ي|ائ)[ةه])';
  const rules = [
    new RegExp(
      `(?:خصم|تخفيض|discount)\\s*(?:بنسب[ةه]|نسب[ةه]|بقيم[ةه]|قيم[ةه]|قيمته|قدره|نسبته)?\\s*(?:هو|[:=])?\\s*${NUM}\\s*(?:${PCT}|(${CUR}))?`,
      'gi'
    ),
    new RegExp(`${NUM}\\s*${PCT}\\s*(?:خصم|تخفيض)()`, 'gi'),
    // «نسبة 10%» لوحدها بتتفهم خصم على المنتج
    new RegExp(`(?:ب)?نسب[ةه]\\s*(?:[:=])?\\s*${NUM}\\s*${PCT}()`, 'gi'),
  ];
  let out = text;
  for (const re of rules) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(out))) {
      const value = toNum(m[1]) ?? 0;
      const after = out.slice(m.index + m[0].length);
      let cut = after.search(CLAUSE_END);
      if (cut < 0) cut = after.length;
      const next = after.slice(cut + 1);
      const nextCut = next.search(CLAUSE_END);
      const nextClause = nextCut < 0 ? next : next.slice(0, nextCut);
      if (/لمد|مد[ةه]|يوم|ايام|أيام|شهر|اسبوع|أسبوع|يبدأ|تبدأ|ابتداء/.test(nextClause)) cut += 1 + nextClause.length;
      const nextDiscount = after.search(/خصم|تخفيض/);
      if (nextDiscount >= 0 && nextDiscount < cut) cut = nextDiscount;
      const window = after.slice(0, cut);
      const before = out.slice(Math.max(0, m.index - 25), m.index);
      const scope: FoundDiscount['scope'] = /شريح/.test(window) || /شريح/.test(before) ? 'tier' : 'product';
      const type: BotDiscount['type'] = m[2] ? 'percentage' : m[3] ? 'fixed' : value <= 100 ? 'percentage' : 'fixed';
      const end = m.index + m[0].length + window.length;
      const date = dates.find((d) => d.index >= m!.index && d.index <= end);
      discounts.push({ type, value, startDate: date?.iso ?? null, durationDays: durationOf(window) ?? 30, index: m.index, scope });
      out = blank(out, m.index, m[0].length + window.length);
    }
  }
  return { text: out, discounts };
}

// ---------- categories & brands ----------

const CATEGORY_HINTS: { keys: string[]; catKeys: string[]; prefix: string }[] = [
  { keys: ['اسمنت', 'بورتلاند', 'جص', 'cement'], catKeys: ['اسمنت', 'مواد ربط', 'مواد بناء', 'cement', 'building'], prefix: 'CEM' },
  { keys: ['حديد', 'تسليح', 'صلب', 'rebar', 'steel'], catKeys: ['حديد', 'صلب', 'steel'], prefix: 'STL' },
  { keys: ['دهان', 'بويه', 'معجون', 'طلاء', 'ورنيش', 'paint'], catKeys: ['دهان', 'طلاء', 'تشطيب', 'paint'], prefix: 'PNT' },
  { keys: ['طوب', 'بلوك', 'بلك', 'brick', 'block'], catKeys: ['طوب', 'بلوك', 'مواد بناء', 'brick', 'block'], prefix: 'BLK' },
  {
    keys: ['حوض', 'خلاط', 'حنفيه', 'مرحاض', 'كرسي افرنجي', 'دش', 'شطاف', 'سيفون', 'mixer', 'sink'],
    catKeys: ['صحي', 'سباك', 'حمام', 'sanitary', 'plumbing'],
    prefix: 'SAN',
  },
  { keys: ['ماسوره', 'مواسير', 'محبس', 'كوع', 'pvc', 'بي في سي'], catKeys: ['سباك', 'صرف', 'صحي', 'plumbing'], prefix: 'PLB' },
  {
    keys: ['سيراميك', 'بورسلين', 'بورسلان', 'رخام', 'بلاط', 'جرانيت', 'سقيه', 'باركيه', 'tile'],
    catKeys: ['ارضيات', 'سيراميك', 'رخام', 'بلاط', 'tiles', 'floor'],
    prefix: 'TIL',
  },
  { keys: ['خشب', 'ابلكاش', 'mdf', 'باب', 'wood'], catKeys: ['خشب', 'نجار', 'wood'], prefix: 'WD' },
  { keys: ['عازل', 'عزل', 'بيتومين', 'insulation'], catKeys: ['عزل', 'insulation'], prefix: 'INS' },
  { keys: ['رمل', 'حصي', 'ركام', 'بحص', 'زلط', 'sand'], catKeys: ['رمل', 'ركام', 'sand', 'aggregate'], prefix: 'AGG' },
  { keys: ['كابل', 'سلك', 'مفتاح', 'فيشه', 'لمبه', 'cable'], catKeys: ['كهرب', 'electric'], prefix: 'ELC' },
];

function hintOf(ftext: string) {
  return CATEGORY_HINTS.find((h) => h.keys.some((k) => ftext.includes(fold(k))));
}

function pickCategory(text: string, cats: BotContext['categories']): string | null {
  const f = fold(text);
  const explicit = text.match(/(?:الفئ[ةه]|القسم|التصنيف|category)\s*[:=]?\s*([^،,.\n]+)/i)?.[1]?.trim();
  if (explicit) {
    const e = fold(explicit);
    const hit = cats.find((c) => fold(c.name) === e) || cats.find((c) => fold(c.name).includes(e) || e.includes(fold(c.name)));
    return hit?.name ?? explicit;
  }
  const direct = cats
    .filter((c) => (c.name && f.includes(fold(c.name))) || (c.nameEn && f.includes(c.nameEn.toLowerCase())))
    .sort((a, b) => b.name.length - a.name.length)[0];
  if (direct) return direct.name;
  const hint = hintOf(f);
  if (!hint) return null;
  const hit = cats.find(
    (c) => hint.catKeys.some((k) => fold(c.name).includes(fold(k))) || (c.nameEn && hint.catKeys.some((k) => c.nameEn!.toLowerCase().includes(k)))
  );
  return hit?.name ?? null;
}

function pickBrand(text: string, brands: BotContext['brands']): string | null {
  const f = fold(text);
  const known = brands
    .filter((b) => (b.name && f.includes(fold(b.name))) || (b.nameEn && f.includes(b.nameEn.toLowerCase())))
    .sort((a, b) => b.name.length - a.name.length)[0];
  if (known) return known.name;
  const explicit = text.match(
    /(?:الماركه|الماركة|ماركة|ماركه|البراند|براند|brand|من شرك[ةه]|شرك[ةه]|انتاج|إنتاج|تصنيع)\s*[:=]?\s*([^،,.\n]+?)(?=\s*(?:،|,|\.|$|\n|بسعر|سعر|السعر|مخزون|المخزون|خصم))/i
  );
  if (explicit?.[1]?.trim()) return explicit[1].trim();
  const firstClause = text.split(CLAUSE_END)[0];
  const from = firstClause.match(/\sمن\s+(?!\d|لل?كمي|اول|أول)([\u0600-\u06FFA-Za-z][^\d]{1,40}?)\s*$/);
  return from?.[1]?.trim() || null;
}

// ---------- names & translation ----------

const DICT: Record<string, string> = {
  اسمنت: 'Cement', بورتلاند: 'Portland', حديد: 'Steel', تسليح: 'Rebar', صلب: 'Steel', دهان: 'Paint', بويه: 'Paint',
  طلاء: 'Paint', ابيض: 'White', اسود: 'Black', رمادي: 'Grey', احمر: 'Red', ازرق: 'Blue', اخضر: 'Green', بيج: 'Beige',
  داخلي: 'Interior', خارجي: 'Exterior', مائي: 'Water-based', زيتي: 'Oil-based', طوب: 'Brick', احمر_طوب: 'Red Brick',
  بلوك: 'Block', سيراميك: 'Ceramic', بورسلين: 'Porcelain', بورسلان: 'Porcelain', رخام: 'Marble', جرانيت: 'Granite',
  بلاط: 'Tiles', ارضيات: 'Floor', حوائط: 'Wall', حائط: 'Wall', سقيه: 'Grout', رمل: 'Sand', خشب: 'Wood',
  ماسوره: 'Pipe', مواسير: 'Pipes', محبس: 'Valve', خلاط: 'Mixer', مطبخ: 'Kitchen', حمام: 'Bathroom', حوض: 'Sink',
  غسيل: 'Wash', عازل: 'Insulation', عزل: 'Insulation', جبس: 'Gypsum', مقاوم: 'Resistant', رطوبه: 'Moisture',
  كلاسيك: 'Classic', مجموعه: 'Collection', جديده: 'New', جديد: 'New', كيس: 'Bag', لوح: 'Sheet', سلك: 'Wire',
  كابل: 'Cable', مسمار: 'Nails', غراء: 'Adhesive', لاصق: 'Adhesive', معجون: 'Putty', مفتاح: 'Switch', لمبه: 'Bulb',
  باب: 'Door', شباك: 'Window', المنيوم: 'Aluminum', نحاس: 'Copper', بلاستيك: 'Plastic', ستانلس: 'Stainless',
  مقاس: 'Size', عادي: 'Standard', سريع: 'Rapid', التصلب: 'Hardening', تصلب: 'Hardening',
};

const UNIT_EN: Record<string, string> = {
  كجم: 'kg', كيلو: 'kg', كغ: 'kg', جم: 'g', مم: 'mm', ملي: 'mm', سم: 'cm', م: 'm', متر: 'm', لتر: 'L', طن: 'ton',
  بوصه: 'inch', كيس: 'bag', قطعه: 'piece', وحده: 'unit', لوح: 'sheet', لفه: 'roll', جالون: 'gallon', طبليه: 'pallet',
  'م²': 'm²', 'م2': 'm²', 'م³': 'm³', 'م3': 'm³', كرتونه: 'carton', علبه: 'box',
};

function translateWord(word: string): string | null {
  const w = fold(word).replace(/^و/, '');
  const bare = w.replace(/^(ال|لل|بال)/, '');
  return DICT[w] ?? DICT[bare] ?? null;
}

const VALUE_EN: Record<string, string> = {
  سنه: '1 year', سنتين: '2 years', سنتان: '2 years', سنوات: 'years', شهر: '1 month', شهرين: '2 months', شهور: 'months',
  نعم: 'Yes', لا: 'No', مطفي: 'Matte', لامع: 'Glossy', ساده: 'Plain',
  خرسانات: 'Concrete', خرسانه: 'Concrete', بناء: 'Construction', البناء: 'Construction', مباني: 'Buildings',
  اساسات: 'Foundations', تشطيبات: 'Finishing', مصر: 'Egypt', السعوديه: 'Saudi Arabia', الصين: 'China', تركيا: 'Turkey',
};

/** لو كلمة ماتترجمتش بنسيب الإنجليزي فاضي بدل ترجمة ناقصة */
function translateValue(value: string): string {
  const out: string[] = [];
  for (const tok of value.split(/\s+/).filter(Boolean)) {
    if (/^[\d.,x×*/-]+$/.test(tok) || /^[A-Za-z0-9._-]+$/.test(tok)) {
      out.push(tok);
      continue;
    }
    const f = fold(tok);
    const lookup = (w: string) => UNIT_EN[w] ?? VALUE_EN[w] ?? translateWord(w);
    const en = lookup(f);
    if (en) {
      out.push(en);
      continue;
    }
    const joined = f.startsWith('و') ? lookup(f.slice(1)) : null;
    if (!joined) return '';
    out.push('&', joined);
  }
  return out.join(' ');
}

/** ترجمة تقريبية: الأسماء العربي بتبدأ بالموصوف، فبنعكس ترتيب الكلمات المعروفة */
function translateName(name: string): string {
  const tokens = name.split(/\s+/).filter(Boolean);
  const words: string[] = [];
  const measures: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (/^\d/.test(tok)) {
      const unit = tokens[i + 1] ? UNIT_EN[fold(tokens[i + 1])] : undefined;
      measures.push(unit ? `${tok} ${unit}` : tok);
      if (unit) i++;
      continue;
    }
    if (/^[A-Za-z]/.test(tok)) {
      words.push(tok);
      continue;
    }
    const en = translateWord(tok);
    if (en) words.push(en);
  }
  if (!words.length) return '';
  return [...words.reverse(), ...measures].join(' ');
}

const FILLER =
  /^(?:(?:و)?(?:أضف|اضف|إضافة|اضافة|ضيف|ضيفلي|نزل|انزل|عايز|عاوز|محتاج|أريد|اريد|يا بوت|لو سمحت|من فضلك|منتج جديد|منتج|اسمه|اسم المنتج|هو)\s+)+/u;

const NAME_STOP =
  /\s(?:بسعر|السعر|سعر|سعره|المخزون|مخزون|الكمي[ةه]|خصم|تخفيض|شريح[ةه]|شرائح|الفئ[ةه]|القسم|ماركة|الماركة|ماركه|براند|البراند|من شرك[ةه]|شرك[ةه]|كود|sku|الوصف|وصف|متوفر|متاح|الألوان|الوان|المقاسات|نشط|مخفي)(?=\s|$)/i;

function pickName(text: string, brand: string | null): string {
  const explicit = text.match(/(?:اسم المنتج|الاسم|name)\s*[:=]\s*([^،,\n]+)/i)?.[1]?.trim();
  if (explicit) return explicit;
  const clauses = text.split(/[،,\n]|\.(?=\s|$)/);
  for (const raw of clauses) {
    let c = ` ${raw.trim()} `.replace(FILLER, ' ').trim();
    c = c.replace(FILLER, '').trim();
    const stop = ` ${c}`.search(NAME_STOP);
    if (stop >= 0) c = ` ${c}`.slice(0, stop).trim();
    if (brand) {
      const at = fold(c).indexOf(fold(brand));
      if (at > 0) c = c.slice(0, at).trim();
    }
    const fromAt = c.search(/\sمن\s+(?!\d)/);
    if (fromAt > 0) c = c.slice(0, fromAt).trim();
    c = c.replace(/\s+(?:من|و|ب|في)$/u, '').replace(/^[-–:،,\s]+|[-–:،,\s]+$/g, '');
    if (c.length >= 2 && /[\u0600-\u06FFA-Za-z]/.test(c)) return c.slice(0, 80);
  }
  return '';
}

// ---------- specs ----------

const SPEC_EN: Record<string, string> = {
  الوزن: 'Weight', المقاس: 'Size', الحجم: 'Volume', اللون: 'Color', الخامه: 'Material', 'بلد المنشا': 'Country of Origin',
  المنشا: 'Country of Origin', 'رتبه الاسمنت': 'Grade', الرتبه: 'Grade', 'نوع الاسمنت': 'Cement type', الضمان: 'Warranty', السمك: 'Thickness', الطول: 'Length', العرض: 'Width', القطر: 'Diameter',
  الارتفاع: 'Height', الاستخدام: 'Usage', 'وحده البيع': 'Selling unit', النوع: 'Type', الموديل: 'Model',
  'درجه المقاومه': 'Strength grade', الاعتماد: 'Certification',
};

const ORIGINS: [RegExp, string, string][] = [
  [/سعودي|السعودي[ةه]|saudi/i, 'السعودية', 'Saudi Arabia'],
  [/مصري|مصر(?=\s|$)|egypt/i, 'مصر', 'Egypt'],
  [/صيني|الصين|china/i, 'الصين', 'China'],
  [/تركي|تركيا|turk/i, 'تركيا', 'Turkey'],
  [/اماراتي|إماراتي|الامارات|الإمارات|uae/i, 'الإمارات', 'UAE'],
  [/ايطالي|إيطالي|ايطاليا|إيطاليا|ital/i, 'إيطاليا', 'Italy'],
  [/اسباني|إسباني|اسبانيا|إسبانيا|spain/i, 'إسبانيا', 'Spain'],
  [/الماني|ألماني|المانيا|ألمانيا|german/i, 'ألمانيا', 'Germany'],
];

const RESERVED_LABELS = [
  'السعر', 'سعر', 'المخزون', 'مخزون', 'الفئه', 'القسم', 'الماركه', 'البراند', 'الاسم', 'اسم المنتج', 'sku', 'الكود',
  'الوصف', 'الخصم', 'خصم', 'الكميه', 'name', 'description', 'price', 'stock', 'category', 'brand', 'الالوان', 'المقاسات',
  'شرائح الجمله', 'الشرائح', 'المواصفات', 'المنتج',
];

function unitOf(text: string): string | null {
  const f = fold(text);
  if (/م\s*³|م3|متر مكعب/.test(text)) return 'م³';
  if (/م\s*²|م2|متر مربع/.test(text)) return 'م²';
  const units = ['كيس', 'طن', 'جالون', 'ماسوره', 'لوح', 'لفه', 'طبليه', 'كرتونه', 'علبه', 'قطعه'];
  const hit = units.find((u) => f.includes(u));
  if (hit) return { ماسوره: 'ماسورة', لفه: 'لفة', طبليه: 'طبلية', كرتونه: 'كرتونة', علبه: 'علبة', قطعه: 'قطعة' }[hit] ?? hit;
  if (/كجم|كيلو/.test(text)) return 'كيس';
  return null;
}

const SPEC_CELL_LABELS: [RegExp, keyof BotSpec][] = [
  [/^(?:ال)?مواصف[ةه]\s*[:：]?\s*/i, 'specAr'],
  [/^(?:ال)?قيم[ةه]\s*[:：]?\s*/i, 'valueAr'],
  [/^spec\s*\(en\)\s*[:：]?\s*/i, 'specEn'],
  [/^value\s*\(en\)\s*[:：]?\s*/i, 'valueEn'],
];
const SLOT_ORDER: (keyof BotSpec)[] = ['specAr', 'valueAr', 'specEn', 'valueEn'];

/** يفك سطر مواصفة لخاناته، أو null لو السطر مش مواصفة منظمة */
function specRowOf(rawLine: string): { header: boolean; fields: Partial<BotSpec> } | null {
  const line = rawLine.replace(/^\s*(?:\d+\s*[.)\-–]\s*|[-•*]\s*)/, '').trim();
  if (!line) return null;
  const cells = line
    .split('|')
    .flatMap((c) => c.split(/\s+(?=(?:ال)?قيم[ةه](?:\s*[:：]|\s)|spec\s*\(en\)|value\s*\(en\))/i))
    .map((c) => c.trim())
    .filter(Boolean);
  const labeled = cells.some((c) => SPEC_CELL_LABELS.some(([re]) => re.test(c)));
  if (!labeled && (!line.includes('|') || cells.length < 2)) return null;
  if (cells.every((c) => isSpecHeader(c) || !cleanSpecText(c))) return { header: true, fields: {} };

  const fields: Partial<BotSpec> = {};
  const loose: string[] = [];
  for (const cell of cells) {
    const hit = SPEC_CELL_LABELS.find(([re]) => re.test(cell));
    if (hit) fields[hit[1]] = cell.replace(hit[0], '').trim();
    else loose.push(cell);
  }
  for (const cell of loose) {
    const slot = SLOT_ORDER.find((s) => fields[s] === undefined);
    if (slot) fields[slot] = cell;
  }
  return { header: false, fields };
}

function pickSpecs(text: string): BotSpec[] {
  const specs: BotSpec[] = [];
  const push = (rawSpecAr: string, rawValueAr: string, rawSpecEn?: string, rawValueEn?: string) => {
    const specAr = cleanSpecText(rawSpecAr);
    const valueAr = cleanSpecText(rawValueAr);
    const specEn = rawSpecEn === undefined ? undefined : cleanSpecText(rawSpecEn) || undefined;
    const valueEn = rawValueEn === undefined ? undefined : cleanSpecText(rawValueEn) || undefined;
    if (!specAr || !valueAr || isBasicSpec({ specAr, valueAr, specEn, valueEn })) return;
    const dup = specs.find((s) => fold(s.specAr) === fold(specAr));
    if (dup) {
      dup.specEn ||= specEn ?? '';
      dup.valueEn ||= valueEn ?? '';
      return;
    }
    specs.push({
      specAr,
      valueAr,
      specEn: specEn ?? SPEC_EN[fold(specAr)] ?? '',
      valueEn: valueEn ?? (translateValue(valueAr) || ORIGINS.find(([re]) => re.test(valueAr))?.[2] || ''),
    });
  };

  // سطور منظمة بعناوين أو بـ «|»:
  // «1. المواصفة: الوزن | القيمة: 50 كجم | Spec (EN): Weight | Value (EN): 50 kg»
  // «الوزن | 50 كجم | Weight | 50 kg» أو بلوك كل حقل في سطر
  const kept: string[] = [];
  let block: Partial<BotSpec> | null = null;
  const flush = () => {
    if (block?.specAr && block.valueAr) push(block.specAr, block.valueAr, block.specEn, block.valueEn);
    block = null;
  };
  for (const line of text.split('\n')) {
    const row = specRowOf(line);
    if (!row) {
      kept.push(line);
      continue;
    }
    if (row.header) continue;
    if (row.fields.specAr !== undefined) {
      flush();
      block = { ...row.fields };
    } else {
      block = { ...(block ?? {}), ...row.fields };
    }
    if (block.specAr && block.valueAr && (block.valueEn !== undefined || line.includes('|'))) flush();
  }
  flush();
  text = kept.join('\n');

  const pairs = /([\u0600-\u06FFA-Za-z]{2,20}(?:\s[\u0600-\u06FFA-Za-z]{2,20})?)\s*:\s*([^،,|\n]+)/g;
  let m: RegExpExecArray | null;
  while ((m = pairs.exec(text))) {
    const label = m[1].trim();
    const value = ` ${m[2]}`.split(NAME_STOP)[0].trim();
    if (!value || RESERVED_LABELS.includes(fold(label)) || isBasicSpec({ specAr: label, valueAr: value })) continue;
    push(label, value);
  }

  const weight = text.match(new RegExp(`${NUM}\\s*(كجم|كيلو(?:جرام)?|كغ|kg)`, 'i'));
  if (weight) push('الوزن', `${weight[1]} كجم`, 'Weight', `${weight[1]} kg`);
  const volume = text.match(new RegExp(`${NUM}\\s*(لتر|ليتر|L)${END}`, 'i'));
  if (volume) push('الحجم', `${volume[1]} لتر`, 'Volume', `${volume[1]} L`);
  const size = text.match(/(\d+(?:\.\d+)?\s*[x×*]\s*\d+(?:\.\d+)?(?:\s*[x×*]\s*\d+(?:\.\d+)?)?)\s*(سم|مم|م|cm|mm)?/i);
  if (size) {
    const unit = size[2] || '';
    push('المقاس', `${size[1]}${unit ? ' ' + unit : ''}`, 'Size', `${size[1]}${unit ? ' ' + (UNIT_EN[fold(unit)] ?? unit) : ''}`);
  }
  const diameter = text.match(new RegExp(`(?:قطر|diameter)\\s*${NUM}\\s*(مم|ملي|سم|بوص[ةه])?`, 'i'));
  if (diameter) {
    const unit = diameter[2] ? fold(diameter[2]) : 'مم';
    push('القطر', `${diameter[1]} ${diameter[2] || 'مم'}`, 'Diameter', `${diameter[1]} ${UNIT_EN[unit] ?? unit}`);
  }
  const thickness = text.match(new RegExp(`(?:سمك|سماك[ةه]|thickness)\\s*${NUM}\\s*(مم|ملي|سم)?`, 'i'));
  if (thickness) {
    const unit = thickness[2] ? fold(thickness[2]) : 'مم';
    push('السمك', `${thickness[1]} ${thickness[2] || 'مم'}`, 'Thickness', `${thickness[1]} ${UNIT_EN[unit] ?? unit}`);
  }
  const origin = ORIGINS.find(([re]) => re.test(text));
  if (origin) push('بلد المنشأ', origin[1], 'Country of Origin', origin[2]);
  if (/حكوم|government/i.test(text)) push('الاعتماد', 'معتمد للمشاريع الحكومية', 'Certification', 'Approved for government projects');
  const unit = unitOf(text);
  if (unit) push('وحدة البيع', unit, 'Selling unit', UNIT_EN[fold(unit)] ?? unit);
  return specs;
}

// ---------- variants ----------

function listAfter(text: string, labels: string[]): string[] {
  for (const label of labels) {
    const m = text.match(new RegExp(`${label}\\s*[:=]?\\s*([^،,\\n]+)`, 'i'));
    if (m) {
      return m[1]
        .split(/\s*(?:\/|\||-|\sو|\sاو\s|\sأو\s)\s*/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

// ---------- main ----------

export function assistProduct(raw: string, ctx: BotContext): BotProductJson | null {
  const original = normalize(raw);
  if (original.length < 3) return null;

  const { text: body, fields } = labeledFields(original);
  const { text: noDates, dates } = extractDates(body);
  const { text: rangedFree, tiers } = extractTiers(noDates);
  const { text: noTiers, tier: wholesale } = extractWholesale(rangedFree);
  const { text: rest, discounts } = extractDiscounts(noTiers, dates);
  const firstNum = (v?: string) => toNum(normalize(v || '').match(new RegExp(NUM))?.[1]);

  const brand = fields.brand ? pickBrand(fields.brand, ctx.brands) ?? fields.brand : pickBrand(rest, ctx.brands);
  const category = fields.category ? pickCategory(`الفئة: ${fields.category}`, ctx.categories) : pickCategory(rest, ctx.categories);
  const nameAr = fields.nameAr || pickName(rest, brand);

  const price =
    firstNum(fields.price) ??
    toNum(rest.match(new RegExp(`(?:سعر البيع|السعر الأساسي|السعر الاساسي|السعر|سعره|بسعر|سعر|price)\\s*(?:هو|:|=)?\\s*${NUM}`, 'i'))?.[1]) ??
    toNum(rest.match(new RegExp(`${NUM}\\s*${CUR}`, 'i'))?.[1]) ??
    tiers[0]?.unitPrice ??
    null;
  const stock =
    firstNum(fields.stock) ??
    toNum(
      rest.match(new RegExp(`(?:المخزون|مخزون|الكمي[ةه] المتاح[ةه]|الكمي[ةه]|المتاح|متوفر منه|stock|qty)\\s*(?:هو|:|=)?\\s*${NUM}`, 'i'))?.[1]
    ) ?? toNum(rest.match(new RegExp(`${NUM}\\s*(?:${UNIT}\\s*)?(?:في المخزون|بالمخزون|متاح[ةه]?|متوفر[ةه]?)`, 'i'))?.[1]);

  const skuExplicit = fields.sku || body.match(/(?:sku|الكود|كود|رمز)\s*[:=]?\s*([A-Za-z0-9][A-Za-z0-9_-]{2,})/i)?.[1];
  const prefix = hintOf(fold(original))?.prefix ?? 'GEN';
  const sku = skuExplicit || `${prefix}-${nameAr.match(/\d+/)?.[0] || price || '01'}-${Date.now().toString().slice(-4)}`;

  const nameEn =
    fields.nameEn ||
    body.match(/(?:english name|name en|الاسم (?:الانجليزي|الإنجليزي|بالانجليزي|بالإنجليزي))\s*[:=]?\s*([^،,\n]+)/i)?.[1]?.trim() ||
    translateName(nameAr);

  const specifications = pickSpecs(rest);

  const descExplicit = fields.descriptionAr || body.match(/(?:الوصف|وصف)\s*[:=]\s*([^\n]+)/)?.[1]?.trim();
  const descEnExplicit = fields.descriptionEn || body.match(/(?:description|desc)\s*[:=]\s*([^\n]+)/i)?.[1]?.trim();
  const highlights = specifications.filter((s) => s.specAr !== 'وحدة البيع').slice(0, 3);
  const descriptionAr =
    descExplicit ||
    (nameAr
      ? `${nameAr}${brand ? ` من ${brand}` : ''}.${highlights.length ? ' ' + highlights.map((s) => `${s.specAr}: ${s.valueAr}`).join('، ') + '.' : ''} متاح للطلب عبر تطبيق معمار${tiers.length ? ' بأسعار جملة حسب الكمية' : ''}.`
      : '');
  const descriptionEn =
    descEnExplicit ||
    (nameEn
      ? `${nameEn}.${highlights.filter((s) => s.specEn && s.valueEn).length ? ' ' + highlights.filter((s) => s.specEn && s.valueEn).map((s) => `${s.specEn}: ${s.valueEn}`).join(', ') + '.' : ''} Available to order on the Mimar app${tiers.length ? ' with quantity-based wholesale pricing' : ''}.`
      : '');

  const colors = listAfter(rest, ['الألوان', 'الالوان', 'الوان', 'ألوان']);
  const sizes = listAfter(rest, ['المقاسات', 'مقاسات']);
  const materials = listAfter(rest, ['الخامات', 'خامات']);
  const hasVariants = colors.length > 1 || sizes.length > 1 || materials.length > 1;
  const variantProps = ['اللون', 'المقاس', 'الخامة'];
  const variants: BotVariant[] = [];
  if (hasVariants) {
    const cs = colors.length ? colors : [''];
    const ss = sizes.length ? sizes : [''];
    const ms = materials.length ? materials : [''];
    const count = cs.length * ss.length * ms.length;
    let n = 1;
    cs.forEach((c) =>
      ss.forEach((s) =>
        ms.forEach((mat) =>
          variants.push({
            attrs: { اللون: c, المقاس: s, الخامة: mat },
            price,
            stock: stock != null ? Math.max(1, Math.round(stock / count)) : null,
            sku: `${sku}-${n++}`,
          })
        )
      )
    );
  }

  const tierDiscountRaw = discounts.find((d) => d.scope === 'tier');
  const productDiscountRaw = discounts.find((d) => d.scope === 'product');
  const strip = (d: FoundDiscount): BotDiscount => ({ type: d.type, value: d.value, startDate: d.startDate, durationDays: d.durationDays });
  let tierIndex = 0;
  if (tierDiscountRaw) {
    const before = tiers.filter((t) => t.index < tierDiscountRaw.index);
    tierIndex = before.length ? tiers.indexOf(before[before.length - 1]) : 0;
  }

  return {
    basicInfo: {
      nameAr,
      nameEn,
      descriptionAr,
      descriptionEn,
      category,
      brand,
      sku,
      flags: {
        isActive: !/(غير نشط|مش نشط|مخفي|اخفيه|أخفيه|موقوف|غير مفعل|inactive)/i.test(original),
        isNew: !/(مش جديد|ليس جديد|غير جديد|منتج قديم)/.test(original),
        hasVariants,
      },
    },
    pricingAndInventory: {
      price,
      stock,
      priceTiers: tiers.length
        ? tiers.map(({ fromQty, toQty, unitPrice }) => ({ fromQty, toQty, unitPrice }))
        : wholesale
          ? [{ fromQty: wholesale.fromQty, toQty: null, unitPrice: wholesale.unitPrice }]
          : [],
      tierDiscount: tierDiscountRaw && tiers.length ? { ...strip(tierDiscountRaw), tierIndex } : null,
      productDiscount: productDiscountRaw ? strip(productDiscountRaw) : tierDiscountRaw && !tiers.length ? strip(tierDiscountRaw) : null,
    },
    specifications,
    variantProps,
    variants,
  };
}

/** يقبل JSON ملصوق (حتى لو جوه ```json) بنفس هيكل البوت */
export function parseBotJson(raw: string): Partial<BotProductJson> | null {
  const text = raw.trim();
  if (!text.includes('{')) return null;
  const body = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  try {
    const data = JSON.parse(body.replace(/\/\/[^\n"]*$/gm, ''));
    if (data && typeof data === 'object' && (data.basicInfo || data.pricingAndInventory || data.specifications)) return data;
  } catch {
    return null;
  }
  return null;
}
