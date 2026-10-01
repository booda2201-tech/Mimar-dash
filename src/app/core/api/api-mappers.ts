import {
  Brand,
  Category,
  Product,
  ProductSpec,
  StatusType,
  Offer,
  OfferTier,
  OfferVariant,
  Order,
  OrderAddress,
  OrderLineItem,
  Customer,
  AppBanner,
  Advertisement,
  MaterialList,
  MaterialListItem,
  ProductDiscount,
  ProductPriceTier,
  QuotationFile,
  QuotationItem,
  QuotationOffer,
  QuotationRequest,
  QuotationStatus,
} from '../models';
import { asRecord, bool, displayPersonName, labelOf, num, pick, str, unwrapItem, unwrapList } from './api-utils';

export function mapCategory(raw: unknown): Category {
  const r = asRecord(raw);
  const name = str(pick(r, 'nameAr', 'NameAr', 'name', 'Name'));
  const nameEn = str(pick(r, 'nameEn', 'NameEn'));
  const parent = pick(r, 'parentCategoryId', 'ParentCategoryId', 'parentId', 'ParentId');
  const active = bool(pick(r, 'isActive', 'IsActive'), true);
  return {
    id: str(pick(r, 'id', 'Id'), String(Date.now())),
    name,
    nameEn: nameEn || undefined,
    slug: str(pick(r, 'slug', 'Slug'), nameEn || name).toLowerCase().replace(/\s+/g, '-'),
    products: num(pick(r, 'productsCount', 'ProductsCount', 'products', 'Products')),
    icon: str(pick(r, 'icon', 'Icon'), 'category'),
    status: (active ? 'active' : 'inactive') as StatusType,
    description: str(pick(r, 'descriptionAr', 'DescriptionAr', 'description', 'Description')),
    descriptionEn: str(pick(r, 'descriptionEn', 'DescriptionEn')) || undefined,
    showInApp: active,
    sortOrder: num(pick(r, 'displayOrder', 'DisplayOrder', 'sortOrder', 'SortOrder'), 0),
    parentId: parent === null || parent === undefined || parent === '' ? null : str(parent),
    image: str(pick(r, 'imageUrl', 'ImageUrl', 'image', 'Image')) || undefined,
    parentName: str(pick(r, 'parentCategoryNameAr', 'ParentCategoryNameAr', 'parentName')) || undefined,
    childrenCount: num(pick(r, 'childrenCount', 'ChildrenCount'), 0),
    createdAt: str(pick(r, 'createdAt', 'CreatedAt')) || undefined,
  };
}

export function mapCategories(payload: unknown): Category[] {
  return unwrapList(payload).map(mapCategory);
}

export function flattenCategoryTree(payload: unknown, parentId: string | null = null): Category[] {
  const nodes = unwrapList(payload);
  const out: Category[] = [];
  nodes.forEach((node) => {
    const mapped = mapCategory(node);
    if (parentId && !mapped.parentId) mapped.parentId = parentId;
    out.push(mapped);
    const children = pick(node, 'children', 'Children', 'subCategories', 'SubCategories');
    if (Array.isArray(children) && children.length) {
      out.push(...flattenCategoryTree(children, mapped.id));
    }
  });
  return out;
}

export function mapBrand(raw: unknown): Brand {
  const r = asRecord(raw);
  const active = bool(pick(r, 'isActive', 'IsActive'), true);
  const image = str(
    pick(r, 'logoUrl', 'LogoUrl', 'imageUrl', 'ImageUrl', 'mainImageUrl', 'MainImageUrl', 'logo', 'Logo')
  );
  return {
    id: str(pick(r, 'id', 'Id'), String(Date.now())),
    name: str(pick(r, 'nameAr', 'NameAr', 'name', 'Name')),
    nameEn: str(pick(r, 'nameEn', 'NameEn', 'name', 'Name')),
    country: str(pick(r, 'country', 'Country', 'originCountry', 'OriginCountry'), '—'),
    category: str(pick(r, 'category', 'Category', 'categoryName', 'CategoryName'), '—'),
    description: str(pick(r, 'descriptionAr', 'DescriptionAr', 'description', 'Description')),
    descriptionEn: str(pick(r, 'descriptionEn', 'DescriptionEn')) || undefined,
    products: num(pick(r, 'productsCount', 'ProductsCount', 'products', 'Products')),
    status: (active ? 'active' : 'inactive') as StatusType,
    showInApp: active,
    image: image || undefined,
  };
}

export function mapBrands(payload: unknown): Brand[] {
  return unwrapList(payload).map(mapBrand);
}

function mapSpecs(raw: unknown): ProductSpec[] {
  if (!raw) return [];
  if (typeof raw === 'string') {
    try {
      return mapSpecs(JSON.parse(raw));
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => {
    const row = asRecord(s);
    return {
      label: str(pick(row, 'label', 'Label', 'nameAr', 'NameAr', 'specAr', 'SpecAr', 'key', 'Key')),
      value: str(pick(row, 'value', 'Value', 'valueAr', 'ValueAr')),
      labelEn: str(pick(row, 'labelEn', 'LabelEn', 'nameEn', 'NameEn', 'specEn', 'SpecEn')) || undefined,
      valueEn: str(pick(row, 'valueEn', 'ValueEn')) || undefined,
    };
  }).filter((s) => s.label || s.value || s.labelEn || s.valueEn);
}

function todayIso(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString();
}

/** يقبل `discounts: [...]` الكاملة أو `discount: {type, value}` الحالي (بدون تواريخ) */
function mapDiscounts(row: Record<string, unknown>): ProductDiscount[] {
  const list = pick(row, 'discounts', 'Discounts');
  if (Array.isArray(list) && list.length) {
    return list.map((d) => {
      const r = asRecord(d);
      const type = str(pick(r, 'type', 'Type')).toLowerCase();
      const start = str(pick(r, 'startDate', 'StartDate'), todayIso());
      const end = str(pick(r, 'endDate', 'EndDate'));
      let duration = num(pick(r, 'durationDays', 'DurationDays'));
      if (!duration && end) {
        duration = Math.max(1, Math.round((Date.parse(end) - Date.parse(start)) / 86400000));
      }
      return {
        isPercentage: type ? type === 'percentage' : bool(pick(r, 'isPercentage', 'IsPercentage'), true),
        value: num(pick(r, 'value', 'Value')),
        startDate: start,
        durationDays: duration || 30,
      };
    });
  }
  const current = asRecord(pick(row, 'discount', 'Discount') || pick(row, 'currentDiscount', 'CurrentDiscount'));
  const value = num(pick(current, 'value', 'Value'));
  if (!value) return [];
  const type = str(pick(current, 'type', 'Type')).toLowerCase();
  return [
    {
      isPercentage: type ? type === 'percentage' : bool(pick(current, 'isPercentage', 'IsPercentage'), true),
      value,
      startDate: todayIso(),
      durationDays: 30,
    },
  ];
}

function mapPriceTiers(row: Record<string, unknown>): ProductPriceTier[] {
  const list = pick(row, 'priceTiers', 'PriceTiers');
  if (!Array.isArray(list)) return [];
  return list.map((t) => {
    const r = asRecord(t);
    const max = pick(r, 'maxQuantity', 'MaxQuantity');
    const unitPrice = num(pick(r, 'unitPrice', 'UnitPrice'));
    return {
      minQuantity: num(pick(r, 'minQuantity', 'MinQuantity'), 1),
      maxQuantity: max === undefined || max === null ? undefined : num(max),
      unitPrice,
      discounts: mapDiscounts(r),
      finalUnitPrice: num(pick(r, 'finalUnitPrice', 'FinalUnitPrice'), unitPrice),
      discountLabel: discountText(pick(r, 'discount', 'Discount', 'currentDiscount', 'CurrentDiscount')),
    };
  });
}

export function mapProduct(raw: unknown): Product {
  const r = asRecord(raw);
  const active = bool(pick(r, 'isActive', 'IsActive'), true);
  const stock = num(pick(r, 'stockQuantity', 'StockQuantity', 'stock', 'Stock'));
  const categoryObj = asRecord(pick(r, 'category', 'Category'));
  const brandObj = asRecord(pick(r, 'brand', 'Brand'));
  const name = str(pick(r, 'nameAr', 'NameAr', 'name', 'Name'));
  const brandName = str(pick(brandObj, 'nameAr', 'NameAr', 'name', 'Name') || pick(r, 'brandName', 'BrandName'));
  const categoryName = str(
    pick(categoryObj, 'nameAr', 'NameAr', 'name', 'Name') || pick(r, 'categoryName', 'CategoryName')
  );
  const imagesRaw = pick(r, 'images', 'Images');
  let images: string[] = [];
  if (Array.isArray(imagesRaw)) images = imagesRaw.map((x) => str(x));
  else if (typeof imagesRaw === 'string' && imagesRaw) images = imagesRaw.split(',').map((s) => s.trim());
  const main = str(pick(r, 'mainImageUrl', 'MainImageUrl', 'imageUrl', 'ImageUrl'));
  if (main && !images.includes(main)) images = [main, ...images];

  const variantsRaw = pick(r, 'variants', 'Variants');
  const variants = Array.isArray(variantsRaw)
    ? variantsRaw.map((v) => {
        const row = asRecord(v);
        const attrs: Record<string, string> = {};
        const attrsEn: Record<string, { nameEn?: string; valueEn?: string }> = {};
        const attributes = pick(row, 'attributes', 'Attributes');
        if (Array.isArray(attributes)) {
          attributes.forEach((a) => {
            const attr = asRecord(a);
            const key = str(pick(attr, 'nameAr', 'NameAr', 'name', 'Name'));
            const val = str(pick(attr, 'valueAr', 'ValueAr', 'value', 'Value'));
            if (!key) return;
            attrs[key] = val;
            attrsEn[key] = {
              nameEn: str(pick(attr, 'nameEn', 'NameEn')) || undefined,
              valueEn: str(pick(attr, 'valueEn', 'ValueEn')) || undefined,
            };
          });
        }
        return {
          id: str(pick(row, 'id', 'Id')) || undefined,
          attrs,
          attrsEn,
          price: num(pick(row, 'price', 'Price', 'finalPrice', 'FinalPrice')),
          stock: num(pick(row, 'stockQuantity', 'StockQuantity', 'stock', 'Stock')),
          sku: str(pick(row, 'sku', 'Sku')),
          isActive: bool(pick(row, 'isActive', 'IsActive'), true),
          isNew: bool(pick(row, 'isNew', 'IsNew')),
          priceTiers: mapPriceTiers(row),
          discounts: mapDiscounts(row),
          finalPrice: num(pick(row, 'finalPrice', 'FinalPrice'), num(pick(row, 'price', 'Price'))),
          discountLabel: discountText(pick(row, 'discount', 'Discount', 'currentDiscount', 'CurrentDiscount')),
        };
      })
    : [];
  const basePrice = num(pick(r, 'price', 'Price'), num(pick(r, 'finalPrice', 'FinalPrice')));
  const found = findDiscount(r, basePrice);

  return {
    id: str(pick(r, 'id', 'Id'), String(Date.now())),
    sku: str(pick(r, 'sku', 'Sku', 'SKU'), '—'),
    name,
    nameEn: str(pick(r, 'nameEn', 'NameEn')) || undefined,
    category: categoryName || '—',
    categoryId: str(pick(r, 'categoryId', 'CategoryId') || pick(categoryObj, 'id', 'Id')) || undefined,
    price: num(pick(r, 'finalPrice', 'FinalPrice', 'price', 'Price')),
    basePrice,
    isNew: bool(pick(r, 'isNew', 'IsNew')),
    discountLabel: found ? (found.kind === 'amount' ? `${found.value.toLocaleString('en-US')} ر.س` : `${found.value}%`) : undefined,
    discountSource: found?.source,
    discountNote: found?.note,
    cost: num(pick(r, 'cost', 'Cost', 'costPrice', 'CostPrice')),
    stock,
    quotationQuantity: optNum(pick(r, 'quotationQuantity', 'QuotationQuantity')),
    sales: num(pick(r, 'sales', 'Sales')),
    rating: num(pick(r, 'rating', 'Rating')),
    status: (!active ? 'inactive' : stock <= 0 ? 'out' : stock < 20 ? 'low' : 'active') as StatusType,
    unit: str(pick(r, 'unit', 'Unit'), 'قطعة'),
    supplier: brandName,
    description: str(pick(r, 'descriptionAr', 'DescriptionAr', 'description', 'Description')),
    descriptionEn: str(pick(r, 'descriptionEn', 'DescriptionEn')) || undefined,
    specs: mapSpecs(pick(r, 'specifications', 'Specifications', 'specs', 'Specs')),
    showInApp: active,
    featured: bool(pick(r, 'isNew', 'IsNew', 'featured', 'Featured')),
    image: images[0] || main || undefined,
    images,
    brand: brandName,
    brandId: str(pick(r, 'brandId', 'BrandId') || pick(brandObj, 'id', 'Id')) || undefined,
    brandEn: str(pick(brandObj, 'nameEn', 'NameEn')) || undefined,
    hasVariants: bool(pick(r, 'hasVariants', 'HasVariants')) || variants.length > 0,
    variants,
    variantProps: variants.length ? Object.keys(variants[0].attrs || {}) : undefined,
    priceTiers: mapPriceTiers(r),
    discounts: mapDiscounts(r),
    discountPercent: (() => {
      const discountObj = asRecord(pick(r, 'discount', 'Discount') || {});
      const price = num(pick(r, 'price', 'Price'));
      const final = num(pick(r, 'finalPrice', 'FinalPrice'), price);
      let discount = num(pick(discountObj, 'value', 'Value'));
      const dtype = str(pick(discountObj, 'type', 'Type')).toLowerCase();
      if (dtype === 'amount' && price > 0) return Math.round((discount / price) * 100);
      if (discount) return Math.round(discount);
      if (price > final && price > 0) return Math.round(((price - final) / price) * 100);
      return 0;
    })(),
  };
}

export function mapProducts(payload: unknown): Product[] {
  return unwrapList(payload).map(mapProduct);
}

/** منتجات مخفضة من الـ API → عروض الداشبورد */
interface FoundDiscount {
  source: 'product' | 'variant' | 'priceTier';
  kind: 'percentage' | 'amount';
  value: number;
  percent: number;
  note: string;
}

function readDiscount(
  raw: unknown,
  basePrice: number,
  source: FoundDiscount['source'],
  note: string
): FoundDiscount | null {
  const d = asRecord(raw);
  const value = num(pick(d, 'value', 'Value'));
  if (!value) return null;
  const kind = str(pick(d, 'type', 'Type')).toLowerCase() === 'amount' ? 'amount' : 'percentage';
  const percent = kind === 'amount' ? (basePrice > 0 ? Math.round((value / basePrice) * 100) : 0) : Math.round(value);
  return { source, kind, value, percent, note };
}

function tierRange(tier: Record<string, unknown>): string {
  const min = num(pick(tier, 'minQuantity', 'MinQuantity'));
  const max = pick(tier, 'maxQuantity', 'MaxQuantity');
  return max == null ? `من ${min} قطعة` : `${min}–${num(max)} قطعة`;
}

function variantName(variant: Record<string, unknown>): string {
  const attrs = pick<unknown[]>(variant, 'attributes', 'Attributes');
  const parts = Array.isArray(attrs) ? attrs.map((a) => str(pick(asRecord(a), 'valueAr', 'ValueAr'))).filter(Boolean) : [];
  return parts.join(' / ') || str(pick(variant, 'sku', 'Sku'));
}

/** الخصم ممكن يكون على المنتج أو على نوع أو على شريحة كمية — بنرجّع أكبرهم بالأولوية دي */
function findDiscount(r: Record<string, unknown>, price: number): FoundDiscount | null {
  const own = readDiscount(pick(r, 'discount', 'Discount'), price, 'product', 'على المنتج كله');
  if (own) return own;

  const best = (list: (FoundDiscount | null)[]) =>
    list.filter((d): d is FoundDiscount => !!d).sort((a, b) => b.percent - a.percent)[0] || null;

  const variants = (pick<unknown[]>(r, 'variants', 'Variants') || []).map(asRecord);
  const fromVariant = best(
    variants.map((v) =>
      readDiscount(pick(v, 'discount', 'Discount'), num(pick(v, 'price', 'Price')), 'variant', `على نوع ${variantName(v)}`)
    )
  );
  if (fromVariant) return fromVariant;

  const tierDiscounts = (tiers: unknown, owner: string) =>
    (Array.isArray(tiers) ? tiers : []).map(asRecord).map((t) =>
      readDiscount(
        pick(t, 'discount', 'Discount'),
        num(pick(t, 'unitPrice', 'UnitPrice')),
        'priceTier',
        `عند شراء ${tierRange(t)}${owner}`
      )
    );
  return best([
    ...tierDiscounts(pick(r, 'priceTiers', 'PriceTiers'), ''),
    ...variants.flatMap((v) => tierDiscounts(pick(v, 'priceTiers', 'PriceTiers'), ` (${variantName(v)})`)),
  ]);
}

function discountText(raw: unknown): string | undefined {
  const d = asRecord(raw);
  const value = num(pick(d, 'value', 'Value'));
  if (!value) return undefined;
  const isAmount = str(pick(d, 'type', 'Type')).toLowerCase() === 'amount';
  return isAmount ? `${value.toLocaleString('en-US')} ر.س` : `${value}%`;
}

function mapOfferTiers(raw: unknown): OfferTier[] {
  return (Array.isArray(raw) ? raw : []).map(asRecord).map((t) => {
    const unitPrice = num(pick(t, 'unitPrice', 'UnitPrice'));
    return {
      range: tierRange(t),
      unitPrice,
      finalUnitPrice: num(pick(t, 'finalUnitPrice', 'FinalUnitPrice'), unitPrice),
      discountLabel: discountText(pick(t, 'discount', 'Discount')),
    };
  });
}

function mapOfferVariants(raw: unknown): OfferVariant[] {
  return (Array.isArray(raw) ? raw : []).map(asRecord).map((v) => {
    const price = num(pick(v, 'price', 'Price'));
    return {
      name: variantName(v),
      sku: str(pick(v, 'sku', 'Sku')) || undefined,
      price,
      finalPrice: num(pick(v, 'finalPrice', 'FinalPrice'), price),
      discountLabel: discountText(pick(v, 'discount', 'Discount')),
      stock: num(pick(v, 'stockQuantity', 'StockQuantity')),
      isNew: bool(pick(v, 'isNew', 'IsNew')),
      tiers: mapOfferTiers(pick(v, 'priceTiers', 'PriceTiers')),
    };
  });
}

export function mapDiscountedToOffer(raw: unknown): Offer {
  const r = asRecord(raw);
  const price = num(pick(r, 'price', 'Price'));
  const final = num(pick(r, 'finalPrice', 'FinalPrice'), price);
  const found = findDiscount(r, price);
  let discount = found?.percent ?? 0;
  if (!found && price > final && price > 0) {
    discount = Math.round(((price - final) / price) * 100);
  }
  return {
    category: labelOf(pick(r, 'category', 'Category')) || undefined,
    brand: labelOf(pick(r, 'brand', 'Brand')) || undefined,
    isNew: bool(pick(r, 'isNew', 'IsNew')),
    variants: mapOfferVariants(pick(r, 'variants', 'Variants')),
    tiers: mapOfferTiers(pick(r, 'priceTiers', 'PriceTiers')),
    discountSource: found?.source,
    discountKind: found?.kind,
    discountValue: found?.value,
    discountNote: found?.note,
    price,
    finalPrice: final,
    id: str(pick(r, 'id', 'Id'), String(Date.now())),
    title: str(pick(r, 'nameAr', 'NameAr', 'name', 'Name')),
    titleEn: str(pick(r, 'nameEn', 'NameEn')) || undefined,
    type: 'discount',
    code: str(pick(r, 'sku', 'Sku')) || undefined,
    discount,
    startDate: '—',
    endDate: '—',
    status: (bool(pick(r, 'isActive', 'IsActive'), true) ? 'active' : 'inactive') as StatusType,
    usage: num(pick(r, 'stockQuantity', 'StockQuantity', 'stock', 'Stock')),
    image:
      str(pick(r, 'mainImageUrl', 'MainImageUrl', 'imageUrl', 'ImageUrl')) ||
      (Array.isArray(pick(r, 'images', 'Images'))
        ? str((pick(r, 'images', 'Images') as unknown[])[0])
        : '') ||
      undefined,
  };
}

export function mapOffers(payload: unknown): Offer[] {
  return unwrapList(payload).map(mapDiscountedToOffer);
}

const PAYMENT_LABELS: Record<string, string> = {
  cashondelivery: 'الدفع عند الاستلام',
  cash_on_delivery: 'الدفع عند الاستلام',
  cash: 'نقدي',
  cod: 'الدفع عند الاستلام',
  card: 'بطاقة',
  creditcard: 'بطاقة ائتمان',
  debitcard: 'بطاقة مدى',
  mada: 'مدى',
  visa: 'فيزا',
  mastercard: 'ماستركارد',
  applepay: 'Apple Pay',
  stcpay: 'STC Pay',
  banktransfer: 'تحويل بنكي',
  transfer: 'تحويل بنكي',
  sadad: 'سداد',
  wallet: 'المحفظة',
  unpaid: 'غير مدفوع',
};

/** الباك: Pending = 0 · Confirmed = 1 · Delivered = 2 · Cancelled = 3 */
const ORDER_STATUS_MAP: Record<string, StatusType> = {
  pending: 'pending',
  new: 'pending',
  confirmed: 'confirmed',
  approved: 'confirmed',
  processing: 'confirmed',
  shipping: 'confirmed',
  delivered: 'completed',
  completed: 'completed',
  cancelled: 'cancelled',
  canceled: 'cancelled',
  0: 'pending',
  1: 'confirmed',
  2: 'completed',
  3: 'cancelled',
};

function addressOf(value: unknown): string {
  if (!value) return '—';
  if (typeof value === 'string') return value.trim() || '—';
  const rec = asRecord(value);
  const parts = [
    pick(rec, 'city', 'City'),
    pick(rec, 'district', 'District', 'area', 'Area', 'neighborhood', 'Neighborhood'),
    pick(rec, 'street', 'Street', 'addressLine1', 'AddressLine1', 'line1', 'Line1'),
  ]
    .map((part) => str(part))
    .filter((part) => part && part !== '—');
  return parts.join('، ') || labelOf(value, '—');
}

function paymentLabel(value: unknown): string {
  const raw = str(value);
  if (!raw || raw === '—') return '—';
  const key = raw.toLowerCase().replace(/[\s-]/g, '');
  return PAYMENT_LABELS[key] || raw;
}

const ADMIN_SOURCES = new Set([
  'admin',
  'dashboard',
  'staff',
  'csr',
  'agent',
  'manual',
  'backoffice',
  'customerservice',
  'customersupport',
  'company',
]);

const APP_SOURCES = new Set(['app', 'mobile', 'android', 'ios', 'customer', 'client', 'user']);

function orderSourceOf(r: Record<string, unknown>, user: Record<string, unknown>): 'app' | 'admin' {
  const raw = str(
    pick(
      r,
      'source',
      'Source',
      'channel',
      'Channel',
      'origin',
      'Origin',
      'platform',
      'Platform',
      'createdFrom',
      'CreatedFrom',
      'orderSource',
      'OrderSource'
    )
  );
  const key = raw.toLowerCase().replace(/[\s_-]/g, '');
  if (ADMIN_SOURCES.has(key)) return 'admin';
  if (APP_SOURCES.has(key)) return 'app';
  if (bool(pick(r, 'isAdminOrder', 'IsAdminOrder', 'createdByAdmin', 'CreatedByAdmin', 'isManual', 'IsManual'))) {
    return 'admin';
  }
  const role = str(pick(r, 'createdByRole', 'CreatedByRole') || pick(user, 'role', 'Role', 'userType', 'UserType')).toLowerCase();
  if (/(admin|staff|agent|csr|employee)/.test(role)) return 'admin';
  return 'app';
}

function personName(...values: unknown[]): string {
  return displayPersonName(...values);
}

function orderCreatedByIdOf(r: Record<string, unknown>): string | undefined {
  const nested = asRecord(pick(r, 'createdByUser', 'CreatedByUser', 'createdBy', 'CreatedBy') || {});
  const id = str(
    pick(r, 'createdById', 'CreatedById', 'staffId', 'StaffId', 'adminId', 'AdminId', 'agentId', 'AgentId') ||
      pick(nested, 'id', 'Id')
  );
  return id && id !== '—' ? id : undefined;
}

function orderCreatedByOf(r: Record<string, unknown>, user: Record<string, unknown>): string {
  const nested = pick(r, 'createdByUser', 'CreatedByUser', 'staff', 'Staff', 'agent', 'Agent');
  const name = personName(
    pick(r, 'createdByName', 'CreatedByName', 'staffName', 'StaffName', 'agentName', 'AgentName', 'adminName', 'AdminName', 'placedByName', 'PlacedByName'),
    nested,
    pick(r, 'createdBy', 'CreatedBy')
  );
  if (name) return name;
  const raw = str(
    pick(r, 'createdByName', 'CreatedByName', 'staffName', 'StaffName', 'createdBy', 'CreatedBy') ||
      pick(asRecord(nested), 'userName', 'UserName', 'name', 'Name')
  );
  if (raw && raw !== '—' && raw !== 'خدمة العملاء') return raw;
  if (orderSourceOf(r, user) === 'admin') return '';
  return personName(pick(r, 'customerName', 'CustomerName'), pick(user, 'fullName', 'FullName', 'name', 'Name')) || 'العميل من التطبيق';
}

function orderStatusOf(value: unknown): StatusType {
  if (value && typeof value === 'object') {
    const rec = asRecord(value);
    const named = pick(rec, 'nameEn', 'NameEn', 'name', 'Name', 'status', 'Status', 'code', 'Code', 'key', 'Key');
    if (named !== undefined && named !== null && typeof named !== 'object') {
      return orderStatusOf(named);
    }
    const numeric = pick(rec, 'value', 'Value', 'id', 'Id');
    if (numeric !== undefined && numeric !== null) return orderStatusOf(numeric);
  }
  const raw = str(value, 'pending');
  const key = raw.toLowerCase().replace(/[\s_-]/g, '');
  return ORDER_STATUS_MAP[key] || 'pending';
}

function mapOrderLine(raw: Record<string, unknown>): OrderLineItem {
  const product = asRecord(pick(raw, 'product', 'Product') || {});
  const variant = asRecord(pick(raw, 'productVariant', 'ProductVariant', 'variant', 'Variant') || {});
  const quantity = num(pick(raw, 'quantity', 'Quantity', 'qty', 'Qty'), 1) || 1;
  const attrs = listOf(variant, 'attributes', 'Attributes', 'attributeValues', 'AttributeValues')
    .map((a) => str(pick(a, 'valueAr', 'ValueAr', 'value', 'Value', 'nameAr', 'NameAr')))
    .filter((v) => v && v !== '—');
  const unitPrice =
    optNum(pick(raw, 'finalUnitPrice', 'FinalUnitPrice', 'unitPriceAfterDiscount', 'UnitPriceAfterDiscount', 'unitPrice', 'UnitPrice', 'price', 'Price')) ?? 0;
  const original = positive(optNum(pick(raw, 'originalUnitPrice', 'OriginalUnitPrice', 'baseUnitPrice', 'BaseUnitPrice', 'listPrice', 'ListPrice')));
  const total =
    positive(optNum(pick(raw, 'finalTotal', 'FinalTotal', 'lineTotal', 'LineTotal', 'totalPrice', 'TotalPrice', 'total', 'Total', 'subTotal', 'SubTotal'))) ??
    unitPrice * quantity;
  const variantName =
    str(pick(raw, 'variantNameAr', 'VariantNameAr', 'variantName', 'VariantName', 'variantDescription', 'VariantDescription')) ||
    str(pick(variant, 'nameAr', 'NameAr', 'name', 'Name')) ||
    attrs.join(' / ');
  return {
    name:
      str(pick(raw, 'productNameAr', 'ProductNameAr', 'productName', 'ProductName', 'nameAr', 'NameAr', 'name', 'Name')) ||
      str(pick(product, 'nameAr', 'NameAr', 'name', 'Name'), 'منتج'),
    variant: variantName && variantName !== '—' ? variantName : undefined,
    sku: str(pick(raw, 'sku', 'Sku', 'SKU') || pick(variant, 'sku', 'Sku') || pick(product, 'sku', 'Sku')) || undefined,
    image:
      str(pick(raw, 'imageUrl', 'ImageUrl', 'productImage', 'ProductImage', 'mainImageUrl', 'MainImageUrl') ||
        pick(product, 'mainImageUrl', 'MainImageUrl', 'imageUrl', 'ImageUrl')) || undefined,
    quantity,
    unitPrice,
    originalUnitPrice: original && original > unitPrice ? original : undefined,
    total,
    discountLabel: str(pick(raw, 'discountLabel', 'DiscountLabel', 'appliedDiscount', 'AppliedDiscount')) || undefined,
  };
}

function orderAddressOf(value: unknown): OrderAddress | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const a = asRecord(value);
  const s = (...keys: string[]) => {
    const v = str(pick(a, ...keys));
    return v && v !== '—' ? v : undefined;
  };
  const address: OrderAddress = {
    label: s('label', 'Label', 'title', 'Title'),
    governorate: s('governorate', 'Governorate', 'state', 'State', 'region', 'Region'),
    city: s('city', 'City'),
    area: s('area', 'Area', 'district', 'District', 'neighborhood', 'Neighborhood'),
    street: s('street', 'Street', 'addressLine1', 'AddressLine1'),
    buildingNumber: s('buildingNumber', 'BuildingNumber', 'building', 'Building'),
    floor: s('floor', 'Floor'),
    apartment: s('apartment', 'Apartment', 'flat', 'Flat'),
    landmark: s('landmark', 'Landmark'),
  };
  return Object.values(address).some(Boolean) ? address : undefined;
}

export function mapOrder(raw: unknown): Order {
  const r = asRecord(raw);
  const user = asRecord(pick(r, 'user', 'User', 'customer', 'Customer', 'client', 'Client') || {});
  const companyObj = asRecord(pick(r, 'company', 'Company') || {});
  const itemsRaw = pick(r, 'items', 'Items', 'orderItems', 'OrderItems', 'orderLines', 'OrderLines');
  const lines = listOf(r, 'items', 'Items', 'orderItems', 'OrderItems', 'orderLines', 'OrderLines').map(mapOrderLine);
  const itemCount = lines.length
    ? lines.reduce((s, l) => s + l.quantity, 0)
    : num(pick(r, 'quantity', 'Quantity', 'itemsCount', 'ItemsCount', 'totalItems', 'TotalItems'));
  const addressRaw = pick(r, 'shippingAddress', 'ShippingAddress', 'deliveryAddress', 'DeliveryAddress', 'address', 'Address');
  const linesTotal = lines.reduce((s, l) => s + l.total, 0);
  const total =
    positive(optNum(pick(r, 'finalTotal', 'FinalTotal', 'grandTotal', 'GrandTotal', 'totalAmount', 'TotalAmount', 'total', 'Total', 'totalPrice', 'TotalPrice'))) ??
    linesTotal;
  const itemsSummary = lines.length
    ? lines.map((l) => `${l.name}${l.variant ? ` (${l.variant})` : ''} × ${l.quantity}`).join('، ')
    : '';
  const extra = {
    dbId: str(pick(r, 'id', 'Id')) || undefined,
    lines: lines.length ? lines : undefined,
    subtotal: positive(optNum(pick(r, 'subTotal', 'SubTotal', 'subtotal', 'itemsTotal', 'ItemsTotal'))) ?? (lines.length ? linesTotal : undefined),
    discount: positive(optNum(pick(r, 'discountAmount', 'DiscountAmount', 'totalDiscount', 'TotalDiscount', 'discount', 'Discount'))),
    shippingFee: optNum(pick(r, 'shippingFee', 'ShippingFee', 'shippingCost', 'ShippingCost', 'deliveryFee', 'DeliveryFee')),
    tax: positive(optNum(pick(r, 'tax', 'Tax', 'taxAmount', 'TaxAmount', 'vat', 'Vat'))),
    notes: str(pick(r, 'notes', 'Notes', 'note', 'Note', 'customerNotes', 'CustomerNotes')) || undefined,
    paymentStatus: labelOf(pick(r, 'paymentStatus', 'PaymentStatus'), '') || undefined,
    address: orderAddressOf(addressRaw),
    updatedAt: str(pick(r, 'updatedAt', 'UpdatedAt')) || undefined,
  };
  return {
    ...extra,
    id: str(pick(r, 'orderNumber', 'OrderNumber', 'id', 'Id'), String(Date.now())),
    tracking: str(
      pick(r, 'trackingNumber', 'TrackingNumber', 'tracking', 'Tracking', 'shipmentNumber', 'ShipmentNumber'),
      '—'
    ),
    customer: str(
      pick(r, 'customerName', 'CustomerName', 'fullName', 'FullName') ||
        pick(user, 'fullName', 'FullName', 'name', 'Name', 'nameAr', 'NameAr'),
      '—'
    ),
    company: str(
      pick(r, 'companyName', 'CompanyName') ||
        pick(companyObj, 'nameAr', 'NameAr', 'name', 'Name', 'companyName', 'CompanyName') ||
        pick(user, 'companyName', 'CompanyName', 'company', 'Company') ||
        pick(r, 'company', 'Company', 'customer', 'Customer'),
      '—'
    ),
    items:
      itemsSummary ||
      str(pick(r, 'itemsSummary', 'ItemsSummary') || (Array.isArray(itemsRaw) ? '' : itemsRaw), itemCount ? `${itemCount} أصناف` : '—'),
    quantity: itemCount,
    total,
    payment: paymentLabel(pick(r, 'paymentMethod', 'PaymentMethod', 'payment', 'Payment')),
    status: orderStatusOf(pick(r, 'status', 'Status')),
    date: str(pick(r, 'createdAt', 'CreatedAt', 'date', 'Date', 'orderDate', 'OrderDate'), '—'),
    location: addressOf(
      pick(r, 'location', 'Location', 'address', 'Address', 'shippingAddress', 'ShippingAddress', 'deliveryAddress', 'DeliveryAddress')
    ),
    customerId:
      str(pick(r, 'userId', 'UserId', 'customerId', 'CustomerId') || pick(user, 'id', 'Id')) || undefined,
    phone:
      str(
        pick(r, 'phone', 'Phone', 'customerPhone', 'CustomerPhone', 'phoneNumber', 'PhoneNumber') ||
          pick(user, 'phone', 'Phone', 'phoneNumber', 'PhoneNumber')
      ) || undefined,
    email: str(pick(r, 'email', 'Email') || pick(user, 'email', 'Email')) || undefined,
    source: orderSourceOf(r, user),
    createdBy: orderCreatedByOf(r, user) || undefined,
    createdById: orderCreatedByIdOf(r),
    driverName: str(pick(r, 'driverName', 'DriverName')) || undefined,
    driverPhone: str(pick(r, 'driverPhone', 'DriverPhone')) || undefined,
    eta: str(pick(r, 'eta', 'Eta', 'ETA')) || undefined,
  };
}

export function mapOrders(payload: unknown): Order[] {
  return unwrapList(payload).map(mapOrder);
}

export function mapCustomer(raw: unknown): Customer {
  const r = asRecord(raw);
  return {
    id: str(pick(r, 'id', 'Id'), String(Date.now())),
    name: str(pick(r, 'name', 'Name', 'fullName', 'FullName'), '—'),
    company: str(pick(r, 'company', 'Company', 'companyName', 'CompanyName'), '—'),
    phone: str(pick(r, 'phone', 'Phone', 'phoneNumber', 'PhoneNumber'), '—'),
    email: str(pick(r, 'email', 'Email'), '—'),
    city: str(pick(r, 'city', 'City'), '—'),
    type: str(pick(r, 'type', 'Type', 'role', 'Role'), '—'),
    orders: num(pick(r, 'orders', 'Orders', 'ordersCount', 'OrdersCount')),
    spent: num(pick(r, 'spent', 'Spent', 'totalSpent', 'TotalSpent')),
    status: (bool(pick(r, 'isActive', 'IsActive'), true) ? 'active' : 'inactive') as StatusType,
  };
}

export function mapCustomers(payload: unknown): Customer[] {
  return unwrapList(payload).map(mapCustomer);
}

export function mapBanner(raw: unknown): AppBanner {
  const r = asRecord(raw);
  return {
    id: str(pick(r, 'id', 'Id'), String(Date.now())),
    title: str(pick(r, 'titleAr', 'TitleAr', 'title', 'Title', 'nameAr', 'NameAr')),
    titleEn: str(pick(r, 'titleEn', 'TitleEn', 'nameEn', 'NameEn')) || undefined,
    subtitle: str(pick(r, 'subtitleAr', 'SubtitleAr', 'subtitle', 'Subtitle', 'descriptionAr', 'DescriptionAr')),
    subtitleEn: str(pick(r, 'subtitleEn', 'SubtitleEn', 'descriptionEn', 'DescriptionEn')) || undefined,
    cta: str(pick(r, 'ctaAr', 'CtaAr', 'cta', 'Cta'), 'تسوق الآن'),
    ctaEn: str(pick(r, 'ctaEn', 'CtaEn')) || undefined,
    placement: (str(pick(r, 'placement', 'Placement'), 'hero') as AppBanner['placement']) || 'hero',
    status: (bool(pick(r, 'isActive', 'IsActive'), true) ? 'active' : 'inactive') as StatusType,
    sortOrder: num(pick(r, 'sortOrder', 'SortOrder', 'displayOrder', 'DisplayOrder')),
    imageHint: str(pick(r, 'imageUrl', 'ImageUrl', 'imageHint', 'ImageHint')) || undefined,
  };
}

export function mapBanners(payload: unknown): AppBanner[] {
  return unwrapList(payload).map(mapBanner);
}

export function mapAdvertisement(raw: unknown): Advertisement {
  const r = asRecord(raw);
  const products = pick<unknown>(r, 'products', 'Products');
  const productList = Array.isArray(products) ? products.map(asRecord) : [];
  const rawIds = pick<unknown>(r, 'productIds', 'ProductIds');
  const singleId = pick(r, 'productId', 'ProductId');
  const productIds = (
    Array.isArray(rawIds)
      ? rawIds
      : productList.length
        ? productList.map((p) => pick(p, 'id', 'Id', 'productId', 'ProductId'))
        : singleId != null
          ? [singleId]
          : []
  )
    .filter((id) => id !== null && id !== undefined && id !== '')
    .map((id) => str(id));
  const active = bool(pick(r, 'isActive', 'IsActive'), true);
  const endDate = str(pick(r, 'endDate', 'EndDate'));
  return {
    id: str(pick(r, 'id', 'Id'), String(Date.now())),
    title: str(pick(r, 'titleAr', 'TitleAr', 'title', 'Title')),
    titleEn: str(pick(r, 'titleEn', 'TitleEn')) || undefined,
    description: str(pick(r, 'descriptionAr', 'DescriptionAr', 'description', 'Description')),
    descriptionEn: str(pick(r, 'descriptionEn', 'DescriptionEn')) || undefined,
    image: str(pick(r, 'imageUrl', 'ImageUrl', 'image', 'Image')) || undefined,
    startDate: str(pick(r, 'startDate', 'StartDate')).slice(0, 10),
    endDate: endDate ? endDate.slice(0, 10) : null,
    active,
    running: bool(pick(r, 'isRunning', 'IsRunning'), active),
    sortOrder: num(pick(r, 'displayOrder', 'DisplayOrder', 'sortOrder', 'SortOrder')),
    productIds,
    products: productList.map((p) => ({
      id: str(pick(p, 'id', 'Id', 'productId', 'ProductId')),
      name: str(pick(p, 'nameAr', 'NameAr', 'name', 'Name')),
      nameEn: str(pick(p, 'nameEn', 'NameEn')) || undefined,
      image: str(pick(p, 'mainImageUrl', 'MainImageUrl', 'imageUrl', 'ImageUrl')) || undefined,
      price: num(pick(p, 'price', 'Price')) || undefined,
      active: bool(pick(p, 'isActive', 'IsActive'), true),
    })),
    createdAt: str(pick(r, 'createdAt', 'CreatedAt')) || undefined,
  };
}

export function mapAdvertisements(payload: unknown): Advertisement[] {
  return unwrapList(payload).map(mapAdvertisement);
}

export function mapMaterialListItem(raw: unknown): MaterialListItem {
  const r = asRecord(raw);
  const product = asRecord(pick(r, 'product', 'Product') || {});
  return {
    id: str(pick(r, 'id', 'Id', 'itemId', 'ItemId'), String(Date.now())),
    productId: str(
      pick(r, 'productId', 'ProductId') || pick(product, 'id', 'Id'),
      ''
    ),
    productName:
      str(
        pick(r, 'productName', 'ProductName', 'nameAr', 'NameAr', 'name', 'Name') ||
          pick(product, 'nameAr', 'NameAr', 'name', 'Name')
      ) || undefined,
    productSku:
      str(pick(r, 'sku', 'Sku', 'productSku', 'ProductSku') || pick(product, 'sku', 'Sku')) ||
      undefined,
    quantity: num(pick(r, 'quantity', 'Quantity', 'qty', 'Qty'), 1),
    unit: str(pick(r, 'unit', 'Unit') || pick(product, 'unit', 'Unit')) || undefined,
    notes: str(pick(r, 'notes', 'Notes', 'note', 'Note')) || undefined,
    price: num(pick(r, 'price', 'Price', 'unitPrice', 'UnitPrice') || pick(product, 'price', 'Price')) || undefined,
  };
}

export function mapMaterialList(raw: unknown): MaterialList {
  const r = asRecord(raw);
  const itemsRaw = pick(r, 'items', 'Items', 'materialListItems', 'MaterialListItems');
  const items = Array.isArray(itemsRaw) ? itemsRaw.map(mapMaterialListItem) : undefined;
  const owner = asRecord(pick(r, 'user', 'User', 'owner', 'Owner') || {});
  const active = bool(pick(r, 'isActive', 'IsActive'), true);
  const statusRaw = str(pick(r, 'status', 'Status'));
  return {
    id: str(pick(r, 'id', 'Id'), String(Date.now())),
    name: str(
      pick(
        r,
        'nameAr',
        'NameAr',
        'name',
        'Name',
        'title',
        'Title',
        'titleAr',
        'TitleAr',
        'listName',
        'ListName',
        'listNameAr',
        'ListNameAr'
      )
    ),
    nameEn: str(pick(r, 'nameEn', 'NameEn', 'titleEn', 'TitleEn')) || undefined,
    description:
      str(pick(r, 'descriptionAr', 'DescriptionAr', 'description', 'Description', 'notes', 'Notes')) ||
      undefined,
    projectName: str(pick(r, 'projectName', 'ProjectName', 'project', 'Project')) || undefined,
    ownerName:
      str(
        pick(r, 'ownerName', 'OwnerName', 'userName', 'UserName', 'customerName', 'CustomerName') ||
          pick(owner, 'fullName', 'FullName', 'name', 'Name')
      ) || undefined,
    itemsCount: num(
      pick(r, 'itemsCount', 'ItemsCount', 'itemCount', 'ItemCount'),
      items?.length || 0
    ),
    items,
    shareToken: str(pick(r, 'shareToken', 'ShareToken', 'token', 'Token')) || undefined,
    status: (statusRaw
      ? (statusRaw.toLowerCase() as StatusType)
      : active
        ? 'active'
        : 'inactive') as StatusType,
    createdAt: str(pick(r, 'createdAt', 'CreatedAt', 'date', 'Date'), '—'),
    updatedAt: str(pick(r, 'updatedAt', 'UpdatedAt')) || undefined,
  };
}

export function mapMaterialLists(payload: unknown): MaterialList[] {
  return unwrapList(payload).map(mapMaterialList);
}

function optNum(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function positive(n: number | undefined): number | undefined {
  return n !== undefined && n > 0 ? n : undefined;
}

function listOf(r: Record<string, unknown>, ...keys: string[]): Record<string, unknown>[] {
  const value = pick(r, ...keys);
  if (Array.isArray(value)) return value.map(asRecord);
  const nested = asRecord(value)['$values'];
  return Array.isArray(nested) ? nested.map(asRecord) : [];
}

/** أول رقم في مفتاح اسمه بيطابق include ومش بيطابق exclude */
function findAmount(r: Record<string, unknown>, include: RegExp, exclude?: RegExp): number | undefined {
  for (const [key, value] of Object.entries(r)) {
    if (!include.test(key) || (exclude && exclude.test(key))) continue;
    const n = optNum(value);
    if (n !== undefined && typeof value !== 'boolean') return n;
  }
  return undefined;
}

const QTY_KEY = /^(quantity|qty|requestedQuantity)$/i;
const FILE_KEY = /(file|url|path)/i;
const PRICE_KEY = /(price|total|amount)/i;

/** كل المصفوفات جوه الرد (ومستوى واحد جوه الكائنات المتداخلة) */
function nestedArrays(r: Record<string, unknown>): Record<string, unknown>[][] {
  const out: Record<string, unknown>[][] = [];
  const visit = (obj: Record<string, unknown>, depth: number) => {
    Object.values(obj).forEach((value) => {
      if (Array.isArray(value)) {
        if (value.length && typeof value[0] === 'object') out.push(value.map(asRecord));
      } else if (value && typeof value === 'object' && depth < 2) {
        visit(asRecord(value), depth + 1);
      }
    });
  };
  visit(r, 0);
  return out;
}

function guessItems(r: Record<string, unknown>): Record<string, unknown>[] {
  return (
    nestedArrays(r).find((arr) =>
      arr.some((x) => Object.keys(x).some((k) => QTY_KEY.test(k) || /^product(id)?$/i.test(k)))
    ) || []
  );
}

function guessFiles(r: Record<string, unknown>): Record<string, unknown>[] {
  return (
    nestedArrays(r).find((arr) =>
      arr.some((x) => Object.keys(x).some((k) => FILE_KEY.test(k)) && !Object.keys(x).some((k) => QTY_KEY.test(k)))
    ) || []
  );
}

function guessOffers(r: Record<string, unknown>): Record<string, unknown>[] {
  const single = pick(r, 'offer', 'Offer', 'latestOffer', 'LatestOffer', 'currentOffer', 'CurrentOffer', 'lastOffer', 'LastOffer');
  if (single && typeof single === 'object' && !Array.isArray(single)) return [asRecord(single)];
  return (
    nestedArrays(r).find((arr) =>
      arr.some(
        (x) =>
          Object.keys(x).some((k) => PRICE_KEY.test(k)) &&
          !Object.keys(x).some((k) => QTY_KEY.test(k) || FILE_KEY.test(k))
      )
    ) || []
  );
}

export function normalizeQuotationStatus(raw: string, expired = false): QuotationStatus {
  const s = raw.toLowerCase().replace(/[\s_-]/g, '');
  if (['accepted', 'approved', 'confirmed'].includes(s)) return 'accepted';
  if (['rejected', 'declined', 'refused'].includes(s)) return 'rejected';
  if (['ordered', 'converted', 'convertedtoorder', 'completed'].includes(s)) return 'ordered';
  if (['cancelled', 'canceled'].includes(s)) return 'cancelled';
  if (['expired'].includes(s)) return 'expired';
  if (['offered', 'priced', 'quoted', 'offersent', 'responded', 'answered', 'replied'].includes(s)) {
    return expired ? 'expired' : 'offered';
  }
  return 'pending';
}

function mapQuotationItem(raw: Record<string, unknown>, index: number): QuotationItem {
  const product = asRecord(pick(raw, 'product', 'Product'));
  const variant = asRecord(pick(raw, 'variant', 'Variant', 'productVariant', 'ProductVariant'));
  const productId = str(pick(raw, 'productId', 'ProductId') ?? pick(product, 'id', 'Id')) || undefined;
  const variantAttrs = listOf(variant, 'attributes', 'Attributes')
    .map((a) => str(pick(a, 'valueAr', 'ValueAr', 'value', 'Value')))
    .filter(Boolean)
    .join(' · ');
  return {
    id: str(pick(raw, 'id', 'Id', 'itemId', 'ItemId'), productId || `line-${index}`),
    productId,
    variantId: str(pick(raw, 'variantId', 'VariantId', 'productVariantId', 'ProductVariantId') ?? pick(variant, 'id', 'Id')) || undefined,
    productName:
      str(pick(raw, 'productNameAr', 'ProductNameAr', 'productName', 'ProductName', 'nameAr', 'name')) ||
      str(pick(product, 'nameAr', 'NameAr', 'name', 'Name')) ||
      (productId ? `منتج #${productId}` : `صنف ${index + 1}`),
    productSku: str(pick(raw, 'sku', 'Sku', 'productSku', 'ProductSku') ?? pick(variant, 'sku', 'Sku') ?? pick(product, 'sku', 'Sku')) || undefined,
    variantName: str(pick(raw, 'variantName', 'VariantName', 'variantNameAr')) || variantAttrs || undefined,
    image:
      str(pick(raw, 'imageUrl', 'ImageUrl', 'productImageUrl', 'ProductImageUrl', 'mainImageUrl')) ||
      str(pick(product, 'mainImageUrl', 'MainImageUrl', 'imageUrl', 'ImageUrl')) ||
      undefined,
    unit: str(pick(raw, 'unit', 'Unit', 'unitAr', 'UnitAr') ?? pick(product, 'unitAr', 'unit')) || undefined,
    quantity: num(pick(raw, 'quantity', 'Quantity', 'qty', 'Qty'), 1),
    listPrice:
      optNum(
        pick(raw, 'catalogPrice', 'CatalogPrice', 'listPrice', 'ListPrice', 'originalPrice', 'OriginalPrice', 'productPrice', 'ProductPrice', 'currentPrice', 'CurrentPrice', 'unitPrice', 'UnitPrice', 'price', 'Price') ??
          pick(variant, 'finalPrice', 'price') ??
          pick(product, 'finalPrice', 'FinalPrice', 'price', 'Price')
      ) ?? findAmount(raw, /(catalog|list|original|current|product).*price/i),
    requestedPrice:
      optNum(
        pick(raw, 'requestedUnitPrice', 'RequestedUnitPrice', 'requestedPrice', 'RequestedPrice', 'proposedPrice', 'ProposedPrice', 'proposedUnitPrice', 'customerPrice', 'CustomerPrice', 'expectedPrice', 'ExpectedPrice', 'targetPrice', 'TargetPrice')
      ) ?? findAmount(raw, /(request|propos|expect|customer|suggest|target|budget).*(price|amount)/i),
    offeredPrice:
      optNum(
        pick(raw, 'offeredUnitPrice', 'OfferedUnitPrice', 'offeredPrice', 'OfferedPrice', 'quotedPrice', 'QuotedPrice', 'quotedUnitPrice', 'adminPrice', 'AdminPrice', 'approvedPrice', 'ApprovedPrice', 'finalUnitPrice', 'FinalUnitPrice')
      ) ?? findAmount(raw, /(offer|quot|admin|approv|agreed).*(price|amount)/i, /total/i),
    notes: str(pick(raw, 'notes', 'Notes', 'note', 'Note')) || undefined,
  };
}

/** صنف العميل في requestedItems: السعر اللي ظهرله من الكتالوج */
function mapRequestedItem(raw: Record<string, unknown>, index: number): QuotationItem {
  const base = mapQuotationItem(raw, index);
  const attrs = listOf(raw, 'attributes', 'Attributes')
    .map((a) => str(pick(a, 'valueAr', 'ValueAr', 'value', 'Value')))
    .filter(Boolean)
    .join(' · ');
  const unitPrice = optNum(pick(raw, 'unitPrice', 'UnitPrice'));
  const original = optNum(pick(raw, 'originalUnitPrice', 'OriginalUnitPrice'));
  return {
    ...base,
    variantName: base.variantName || attrs || undefined,
    listPrice: unitPrice ?? base.listPrice,
    originalPrice: original != null && unitPrice != null && original > unitPrice ? original : undefined,
    requestedPrice: undefined,
    offeredPrice: undefined,
    availability: availabilityOf(raw),
    availableQuantity: optNum(pick(raw, 'availableQuantity', 'AvailableQuantity')),
  };
}

/** بند بناه الأدمن في quotation.items (طلبات الملفات) */
function mapQuotedItem(raw: Record<string, unknown>, index: number): QuotationItem {
  const base = mapQuotationItem(raw, index);
  const name = str(pick(raw, 'productNameAr', 'ProductNameAr')) || str(pick(raw, 'requestedName', 'RequestedName'));
  return {
    ...base,
    productName: name || base.productName,
    quantity: num(pick(raw, 'requestedQuantity', 'RequestedQuantity', 'quantity', 'Quantity'), 1),
    listPrice: undefined,
    requestedPrice: undefined,
    offeredPrice: optNum(pick(raw, 'unitPrice', 'UnitPrice')),
    availability: availabilityOf(raw),
    availableQuantity: optNum(pick(raw, 'availableQuantity', 'AvailableQuantity')),
    alternativesCount: listOf(raw, 'alternatives', 'Alternatives').length || undefined,
  };
}

function availabilityOf(raw: Record<string, unknown>): QuotationItem['availability'] {
  const a = str(pick(raw, 'availability', 'Availability')).toLowerCase();
  return a === 'available' || a === 'partial' || a === 'unavailable' ? a : undefined;
}

function mapQuotationFile(raw: Record<string, unknown>, index: number): QuotationFile {
  const url = str(pick(raw, 'fileUrl', 'FileUrl', 'url', 'Url', 'path', 'Path', 'imageUrl', 'ImageUrl'));
  const name = str(pick(raw, 'fileName', 'FileName', 'originalName', 'OriginalName', 'name', 'Name')) || url.split('/').pop() || `ملف ${index + 1}`;
  const type = str(pick(raw, 'contentType', 'ContentType', 'fileType', 'FileType', 'type', 'Type')).toLowerCase();
  return {
    id: str(pick(raw, 'id', 'Id'), `file-${index}`),
    name,
    url,
    isImage: type.startsWith('image') || /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(url || name),
  };
}

function mapQuotationOffer(raw: Record<string, unknown>, index: number): QuotationOffer {
  const lines = listOf(raw, 'items', 'Items', 'lines', 'Lines');
  const linesTotal = lines.reduce(
    (sum, l) => sum + num(pick(l, 'unitPrice', 'UnitPrice', 'price', 'Price')) * num(pick(l, 'quantity', 'Quantity'), 1),
    0
  );
  return {
    id: str(pick(raw, 'id', 'Id'), `offer-${index}`),
    total: num(pick(raw, 'totalPrice', 'TotalPrice', 'total', 'Total', 'totalAmount', 'TotalAmount', 'amount', 'Amount', 'price', 'Price'), linesTotal),
    notes: str(pick(raw, 'notes', 'Notes', 'message', 'Message')) || undefined,
    validUntil: str(pick(raw, 'validUntil', 'ValidUntil', 'expiresAt', 'ExpiresAt')) || undefined,
    createdAt: str(pick(raw, 'createdAt', 'CreatedAt', 'date', 'Date')) || undefined,
    createdBy:
      str(pick(raw, 'createdByName', 'CreatedByName')) ||
      displayPersonName(pick(raw, 'createdBy', 'CreatedBy'), pick(raw, 'adminName', 'AdminName')) ||
      undefined,
    by: /customer|user|client/i.test(str(pick(raw, 'offeredBy', 'OfferedBy'))) ? 'customer' : 'admin',
  };
}

export function mapQuotationRequest(raw: unknown): QuotationRequest {
  const r = asRecord(raw);
  const customer = asRecord(pick(r, 'customer', 'Customer', 'user', 'User', 'requester', 'Requester'));
  const typeRaw = str(pick(r, 'type', 'Type', 'requestType', 'RequestType')).toLowerCase();
  const materialListId = str(pick(r, 'materialListId', 'MaterialListId')) || undefined;
  const quotation = asRecord(pick(r, 'quotation', 'Quotation'));
  const quotedItems = listOf(quotation, 'items', 'Items');
  const requestedItems = listOf(r, 'requestedItems', 'RequestedItems');
  const quotationOffers = listOf(quotation, 'offers', 'Offers');
  const knownItems = listOf(r, 'items', 'Items', 'products', 'Products', 'lines', 'Lines');
  const knownFiles = listOf(r, 'files', 'Files', 'attachments', 'Attachments');
  const knownOffers = listOf(r, 'offers', 'Offers', 'priceOffers', 'PriceOffers');
  const items = quotedItems.length
    ? quotedItems.map(mapQuotedItem)
    : requestedItems.length
      ? requestedItems.map(mapRequestedItem)
      : (knownItems.length ? knownItems : guessItems(r)).map(mapQuotationItem);
  const files = (knownFiles.length ? knownFiles : guessFiles(r)).map(mapQuotationFile);
  const offers = (quotationOffers.length ? quotationOffers : knownOffers.length ? knownOffers : guessOffers(r)).map(
    mapQuotationOffer
  );
  const hasRealOffers = quotationOffers.length > 0 || Object.keys(quotation).length > 0;
  const isExpired = bool(pick(r, 'isExpired', 'IsExpired'), false);
  const rawStatus = str(pick(r, 'status', 'Status'), 'pending');
  const customerType = str(
    pick(r, 'customerType', 'CustomerType', 'accountType', 'AccountType', 'userType', 'UserType') ??
      pick(customer, 'customerType', 'accountType', 'userType', 'role', 'Role', 'type')
  );
  const traderFlag = bool(pick(r, 'isTrader', 'IsTrader', 'isMerchant', 'IsMerchant') ?? pick(customer, 'isTrader', 'isMerchant'), false);
  const requestedFromItems = items.some((i) => i.requestedPrice != null)
    ? items.reduce((s, i) => s + (i.requestedPrice || 0) * i.quantity, 0)
    : undefined;
  const lastOffer = offers[offers.length - 1];
  const status = normalizeQuotationStatus(rawStatus, isExpired);
  /** totalPrice من غير عروض أدمن = السعر اللي العميل باعته */
  const declaredTotal = optNum(pick(r, 'totalPrice', 'TotalPrice', 'totalAmount', 'TotalAmount', 'selectedTotal', 'SelectedTotal'));
  const explicitRequested =
    optNum(pick(r, 'requestedTotal', 'RequestedTotal', 'proposedTotal', 'ProposedTotal', 'customerTotal', 'expectedTotal', 'requestedPrice', 'RequestedPrice', 'proposedPrice', 'ProposedPrice')) ??
    findAmount(r, /(request|propos|expect|customer|suggest|target|budget).*(price|total|amount)/i) ??
    requestedFromItems;
  const explicitOffered =
    optNum(pick(r, 'offeredTotal', 'OfferedTotal', 'quotedTotal', 'QuotedTotal', 'offerTotal', 'OfferTotal')) ??
    findAmount(r, /(offer|quot|admin|approv|agreed).*(price|total|amount)/i) ??
    lastOffer?.total;
  const declaredIsCustomer = status === 'pending' || explicitOffered !== undefined;
  const lastBy = (by: QuotationOffer['by']) => [...offers].reverse().find((o) => o.by === by)?.total;
  const catalogTotal =
    positive(optNum(pick(r, 'catalogSubTotal', 'CatalogSubTotal'))) ??
    positive(optNum(pick(quotation, 'itemsTotal', 'ItemsTotal')));

  return {
    id: str(pick(r, 'id', 'Id')),
    number: str(pick(r, 'number', 'Number', 'code', 'Code', 'referenceNumber'), `#${str(pick(r, 'id', 'Id'))}`),
    type: typeRaw.includes('file') ? 'files' : typeRaw.includes('list') || materialListId ? 'materialList' : 'products',
    status,
    rawStatus,
    customerName:
      displayPersonName(
        pick(r, 'customerName', 'CustomerName', 'userFullName', 'UserFullName', 'requesterName', 'RequesterName'),
        customer
      ) || str(pick(r, 'customerName', 'userName', 'UserName'), 'عميل'),
    customerPhone: str(pick(r, 'customerPhone', 'CustomerPhone', 'phoneNumber', 'PhoneNumber') ?? pick(customer, 'phoneNumber', 'PhoneNumber', 'phone')) || undefined,
    customerEmail: str(pick(customer, 'email', 'Email')) || undefined,
    catalogTotal,
    currentOfferBy: offers.length ? offers[offers.length - 1].by : undefined,
    customerType: customerType || undefined,
    isTrader: traderFlag || /trader|merchant|dealer|tajer|تاجر|contractor|مقاول|company|شركة/i.test(customerType),
    materialListId,
    materialListName: str(pick(r, 'materialListName', 'MaterialListName')) || undefined,
    materialListNotes: str(pick(r, 'materialListNotes', 'MaterialListNotes')) || undefined,
    notes: str(pick(r, 'notes', 'Notes')) || undefined,
    rejectionReason: str(pick(r, 'rejectionReason', 'RejectionReason')) || undefined,
    createdAt: str(pick(r, 'createdAt', 'CreatedAt')) || undefined,
    updatedAt: str(pick(r, 'updatedAt', 'UpdatedAt')) || undefined,
    validUntil: str(pick(r, 'validUntil', 'ValidUntil') ?? pick(quotation, 'validUntil', 'ValidUntil')) || lastOffer?.validUntil,
    isExpired,
    productsCount: num(pick(r, 'productsCount', 'ProductsCount', 'itemsCount', 'ItemsCount'), items.length),
    totalQuantity: num(pick(r, 'totalQuantity', 'TotalQuantity'), items.reduce((s, i) => s + i.quantity, 0)),
    attachmentsCount: num(pick(r, 'attachmentsCount', 'AttachmentsCount', 'filesCount', 'FilesCount'), files.length),
    requestedTotal: hasRealOffers
      ? positive(lastBy('customer'))
      : positive(explicitRequested) ?? (declaredIsCustomer ? positive(declaredTotal) : undefined),
    offeredTotal: hasRealOffers
      ? positive(lastBy('admin'))
      : positive(explicitOffered) ?? (declaredIsCustomer ? undefined : positive(declaredTotal)),
    items,
    files,
    offers,
  };
}

export function mapQuotationRequests(payload: unknown): QuotationRequest[] {
  return unwrapList(payload).map(mapQuotationRequest);
}

export function mapAuthToken(payload: unknown): string | null {
  const r = unwrapItem(payload);
  const token = pick<string>(
    r,
    'token',
    'Token',
    'accessToken',
    'AccessToken',
    'jwt',
    'Jwt',
    'bearerToken',
    'BearerToken'
  );
  if (token) return str(token);
  const nested = pick(r, 'data', 'Data');
  if (typeof nested === 'string' && nested.length > 20) return nested;
  if (nested && typeof nested === 'object') {
    const inner = asRecord(nested);
    const t = pick<string>(inner, 'token', 'Token', 'accessToken', 'AccessToken');
    return t ? str(t) : null;
  }
  return null;
}
