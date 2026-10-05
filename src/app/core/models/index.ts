export type StatusType =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'completed'
  | 'cancelled'
  | 'shipping'
  | 'processing'
  | 'low'
  | 'out'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'approved'
  | 'confirmed'
  | 'rejected';

export interface StatCardData {
  title: string;
  value: number | string;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon: string;
  suffix?: string;
  prefix?: string;
  animate?: boolean;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  type?: 'text' | 'status' | 'currency' | 'actions' | 'custom' | 'image' | 'date' | 'source';
}

export interface ProductSpec {
  label: string;
  value: string;
  labelEn?: string;
  valueEn?: string;
}

export interface ProductDiscount {
  isPercentage: boolean;
  value: number;
  /** ISO — مثال 2026-09-27T00:00:00Z */
  startDate: string;
  durationDays: number;
}

export interface ProductPriceTier {
  minQuantity: number;
  maxQuantity?: number;
  unitPrice: number;
  discounts: ProductDiscount[];
  /** للعرض بس — سعر الوحدة بعد خصم الشريحة */
  finalUnitPrice?: number;
  discountLabel?: string;
}

export interface ProductVariant {
  id?: string;
  attrs?: Record<string, string>;
  attrsEn?: Record<string, { nameEn?: string; valueEn?: string }>;
  price: number;
  stock: number;
  sku: string;
  isActive?: boolean;
  isNew?: boolean;
  priceTiers?: ProductPriceTier[];
  discounts?: ProductDiscount[];
  finalPrice?: number;
  discountLabel?: string;
  color?: string;
  size?: string;
  material?: string;
}

/** جسم POST/PUT /api/Products كما يطلبه الباك اند (multipart/form-data) */
export interface ProductFormPayload {
  nameAr: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  sku?: string;
  categoryId: number;
  brandId?: number;
  hasVariants: boolean;
  price?: number;
  stockQuantity?: number;
  /** الكمية اللي من عندها العميل بيطلب عرض سعر */
  quotationQuantity?: number;
  /** حاسبة الكمية — المساحة/الكمية اللي بتغطيها الوحدة الواحدة */
  coveragePerUnit?: number;
  /** حاسبة الكمية — وحدة إدخال العميل (m2, m3, m ...) */
  inputUnit?: string;
  isActive: boolean;
  isNew: boolean;
  specifications: {
    nameAr: string;
    nameEn?: string;
    valueAr: string;
    valueEn?: string;
    displayOrder?: number;
  }[];
  variants: {
    sku?: string;
    price: number;
    stockQuantity: number;
    isActive: boolean;
    isNew: boolean;
    attributes: { nameAr: string; nameEn?: string; valueAr: string; valueEn?: string }[];
    priceTiers: ProductPriceTier[];
    discounts: ProductDiscount[];
  }[];
  priceTiers: ProductPriceTier[];
  discounts: ProductDiscount[];
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  nameEn?: string;
  category: string;
  categoryId?: string;
  /** السعر النهائي بعد الخصم (للعرض) */
  price: number;
  /** سعر المنتج الأساسي قبل الخصم — ده اللي بيتبعت في التعديل */
  basePrice?: number;
  isNew?: boolean;
  discountLabel?: string;
  discountSource?: 'product' | 'variant' | 'priceTier';
  discountNote?: string;
  cost: number;
  stock: number;
  /** الكمية اللي من عندها العميل بيطلب عرض سعر */
  quotationQuantity?: number;
  coveragePerUnit?: number;
  inputUnit?: string;
  /** عنصر "وصل حديثاً" بيمثل نوع جديد جوه منتج مش المنتج كله */
  variantOf?: { productId: string; variantId: string; label: string };
  sales: number;
  rating: number;
  status: StatusType;
  unit: string;
  supplier: string;
  image?: string;
  images?: string[];
  description?: string;
  descriptionEn?: string;
  specs?: ProductSpec[];
  badges?: string[];
  badgesEn?: string[];
  relatedIds?: string[];
  showInApp?: boolean;
  featured?: boolean;
  brand?: string;
  brandId?: string;
  brandEn?: string;
  keywords?: string[];
  keywordsEn?: string[];
  hasVariants?: boolean;
  variantProps?: string[];
  variants?: ProductVariant[];
  /** نسبة خصم المنتج من الـ API */
  discountPercent?: number;
  priceTiers?: ProductPriceTier[];
  discounts?: ProductDiscount[];
}

export interface AdminOrderPayload {
  customer: { fullName: string; phoneNumber: string; email?: string | null };
  items: { productId: number; productVariantId?: number | null; quantity: number }[];
  shippingAddress: {
    governorate: string;
    city: string;
    area?: string | null;
    street: string;
    buildingNumber?: string | null;
    floor?: string | null;
    apartment?: string | null;
    landmark?: string | null;
    label?: string | null;
  };
  notes?: string | null;
}

export interface TrackingStep {
  key: string;
  label: string;
  done: boolean;
  current?: boolean;
  time?: string;
}

export interface Order {
  id: string;
  tracking: string;
  customer: string;
  company: string;
  items: string;
  quantity: number;
  total: number;
  payment: string;
  status: StatusType;
  date: string;
  location: string;
  customerId?: string;
  phone?: string;
  email?: string;
  /** app = طلب من التطبيق · admin = طلب من خدمة العملاء */
  source?: 'app' | 'admin';
  createdBy?: string;
  createdById?: string;
  driverName?: string;
  driverPhone?: string;
  eta?: string;
  trackingSteps?: TrackingStep[];
  /** الـ id الحقيقي في الباك (id ممكن يكون orderNumber) */
  dbId?: string;
  lines?: OrderLineItem[];
  subtotal?: number;
  discount?: number;
  shippingFee?: number;
  tax?: number;
  notes?: string;
  paymentStatus?: string;
  address?: OrderAddress;
  updatedAt?: string;
}

export interface OrderLineItem {
  name: string;
  variant?: string;
  sku?: string;
  image?: string;
  quantity: number;
  unitPrice: number;
  originalUnitPrice?: number;
  total: number;
  discountLabel?: string;
}

export interface OrderAddress {
  label?: string;
  governorate?: string;
  city?: string;
  area?: string;
  street?: string;
  buildingNumber?: string;
  floor?: string;
  apartment?: string;
  landmark?: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  city: string;
  type: string;
  orders: number;
  spent: number;
  status: StatusType;
  lastOrderAt?: string;
}

export interface Brand {
  id: string;
  name: string;
  nameEn: string;
  country: string;
  category: string;
  description: string;
  descriptionEn?: string;
  products: number;
  status: StatusType;
  showInApp?: boolean;
  image?: string;
}

export interface Category {
  id: string;
  name: string;
  nameEn?: string;
  slug: string;
  products: number;
  icon: string;
  status: StatusType;
  description: string;
  descriptionEn?: string;
  showInApp?: boolean;
  sortOrder?: number;
  parentId?: string | null;
  image?: string;
  parentName?: string;
  childrenCount?: number;
  createdAt?: string;
}

export interface Offer {
  id: string;
  title: string;
  titleEn?: string;
  type: 'banner' | 'coupon' | 'discount';
  code?: string;
  discount: number;
  startDate: string;
  endDate: string;
  status: StatusType;
  usage: number;
  image?: string;
  discountSource?: 'product' | 'variant' | 'priceTier';
  discountKind?: 'percentage' | 'amount';
  discountValue?: number;
  discountNote?: string;
  price?: number;
  finalPrice?: number;
  category?: string;
  brand?: string;
  isNew?: boolean;
  variants?: OfferVariant[];
  tiers?: OfferTier[];
}

export interface OfferVariant {
  name: string;
  sku?: string;
  price: number;
  finalPrice: number;
  discountLabel?: string;
  stock: number;
  isNew: boolean;
  tiers: OfferTier[];
}

export interface OfferTier {
  range: string;
  unitPrice: number;
  finalUnitPrice: number;
  discountLabel?: string;
}

export interface AppBanner {
  id: string;
  title: string;
  titleEn?: string;
  subtitle: string;
  subtitleEn?: string;
  cta: string;
  ctaEn?: string;
  placement: 'hero' | 'contractor' | 'consultant' | 'category' | 'new_arrivals';
  status: StatusType;
  sortOrder: number;
  imageHint?: string;
}

export interface Advertisement {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  image?: string;
  startDate: string;
  endDate?: string | null;
  active: boolean;
  /** الباك اند بيحسبها: نشط + جوه فترة العرض */
  running: boolean;
  sortOrder: number;
  productIds: string[];
  products: AdProduct[];
  createdAt?: string;
}

export interface AdProduct {
  id: string;
  name: string;
  nameEn?: string;
  image?: string;
  price?: number;
  active: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'operations' | 'inventory' | 'finance' | 'system';
  time: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  lastActive: string;
  status: StatusType;
  avatar?: string;
}

export interface MaterialListItem {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  quantity: number;
  unit?: string;
  notes?: string;
  price?: number;
}

export interface MaterialList {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  projectName?: string;
  ownerName?: string;
  itemsCount: number;
  items?: MaterialListItem[];
  shareToken?: string;
  status: StatusType;
  createdAt: string;
  updatedAt?: string;
}

export type QuotationStatus = 'pending' | 'offered' | 'accepted' | 'rejected' | 'ordered' | 'expired' | 'cancelled';

export interface QuotationItem {
  id: string;
  productId?: string;
  variantId?: string;
  productName: string;
  productSku?: string;
  variantName?: string;
  image?: string;
  unit?: string;
  quantity: number;
  /** سعر الكتالوج للوحدة */
  listPrice?: number;
  /** سعر الوحدة قبل خصم المنتج */
  originalPrice?: number;
  availability?: 'available' | 'partial' | 'unavailable';
  availableQuantity?: number;
  alternativesCount?: number;
  /** السعر اللي العميل/التاجر مقترحه للوحدة */
  requestedPrice?: number;
  /** آخر سعر عرضه الأدمن للوحدة */
  offeredPrice?: number;
  notes?: string;
}

export interface QuotationFile {
  id: string;
  name: string;
  url: string;
  isImage: boolean;
}

export interface QuotationOffer {
  id: string;
  total: number;
  notes?: string;
  validUntil?: string;
  createdAt?: string;
  createdBy?: string;
  by: 'customer' | 'admin';
}

export interface QuotationRequest {
  id: string;
  number: string;
  type: 'products' | 'files' | 'materialList';
  status: QuotationStatus;
  rawStatus: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerType?: string;
  isTrader: boolean;
  /** إجمالي أسعار الكتالوج (السعر التقريبي اللي ظهر للعميل) */
  catalogTotal?: number;
  /** آخر عرض على الطلب: من العميل ولا من الأدمن */
  currentOfferBy?: 'customer' | 'admin';
  materialListId?: string;
  materialListName?: string;
  materialListNotes?: string;
  notes?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
  validUntil?: string;
  isExpired: boolean;
  productsCount: number;
  totalQuantity: number;
  attachmentsCount: number;
  requestedTotal?: number;
  offeredTotal?: number;
  items: QuotationItem[];
  files: QuotationFile[];
  offers: QuotationOffer[];
}

export interface QuotationOfferPayload {
  items: { itemId: string; productId?: string; variantId?: string; quantity: number; unitPrice: number }[];
  totalPrice: number;
  validUntil?: string;
  notes?: string;
}

export interface NavItem {
  label: string;
  route: string;
  icon: string;
}
