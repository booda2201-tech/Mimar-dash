import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { SelectComponent, SelectOption } from '../../shared/components/select/select.component';
import { AdvertisementsService, CategoriesService } from '../../core/services/data.services';
import { ProductsService } from '../../core/services/products.service';
import { AnimationService } from '../../core/services/animation.service';
import { ToastService } from '../../core/services/toast.service';
import { Advertisement, Category, Product, ProductDiscount, ProductPriceTier, ProductVariant, StatCardData } from '../../core/models';

interface NestedDiscountEdit {
  source: 'variant' | 'priceTier';
  note: string;
  base: number;
  discount: ProductDiscount | null;
  variantId?: string;
  variantSku?: string;
  minQuantity?: number;
  unitPrice?: number;
  tierOnVariant: boolean;
}

@Component({
  selector: 'app-app-content',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    StatCardComponent,
    ModalComponent,
    ConfirmDialogComponent,
    SelectComponent,
  ],
  templateUrl: './app-content.component.html',
  styleUrls: ['./app-content.component.scss'],
})
export class AppContentComponent implements OnInit, AfterViewInit {
  loading = true;
  categories: Category[] = [];
  products: Product[] = [];
  newArrivals: Product[] = [];
  ads: Advertisement[] = [];
  discounted: Product[] = [];
  showPick = false;
  showDiscount = false;
  discountTarget: Product | null = null;
  discountNote = '';
  removeTarget: Product | null = null;
  dcAll = false;
  readonly durationPresets = [7, 14, 30, 90];
  busyId: string | null = null;
  naAll = false;
  naPage = 1;
  readonly naPageSize = 12;
  private nestedEdit: NestedDiscountEdit | null = null;
  private discountBaseOverride: number | null = null;
  private keptStart = '';

  get naPages(): number {
    return Math.max(1, Math.ceil(this.newArrivals.length / this.naPageSize));
  }

  get naCurrent(): number {
    return Math.min(this.naPage, this.naPages);
  }

  get naPaged(): Product[] {
    const start = (this.naCurrent - 1) * this.naPageSize;
    return this.newArrivals.slice(start, start + this.naPageSize);
  }

  get naRange(): { from: number; to: number } {
    const from = (this.naCurrent - 1) * this.naPageSize + 1;
    return { from, to: Math.min(from + this.naPageSize - 1, this.newArrivals.length) };
  }

  /** أرقام الصفحات مع null مكان الفجوات (…) */
  get naPageList(): (number | null)[] {
    const total = this.naPages;
    const cur = this.naCurrent;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = new Set([1, total, cur - 1, cur, cur + 1].filter((n) => n >= 1 && n <= total));
    const sorted = [...pages].sort((a, b) => a - b);
    return sorted.flatMap((n, i) => (i && n - sorted[i - 1] > 1 ? [null, n] : [n]));
  }

  goNaPage(page: number, anchor?: HTMLElement): void {
    this.naPage = Math.min(Math.max(1, page), this.naPages);
    anchor?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  stats: StatCardData[] = [
    { title: 'إعلانات ظاهرة', value: 0, change: 'تظهر أعلى التطبيق', changeType: 'neutral', icon: 'campaign', animate: true },
    { title: 'أقسام في الرئيسية', value: 0, change: 'ظاهرة للمستخدم', changeType: 'neutral', icon: 'category', animate: true },
    { title: 'وصل حديثاً', value: 0, change: 'منتجات معلّمة كجديد', changeType: 'neutral', icon: 'new_releases', animate: true },
    { title: 'إجمالي الإعلانات', value: 0, change: 'من محتوى التطبيق', changeType: 'neutral', icon: 'ads_click', animate: true },
  ];

  pickForm = this.fb.group({
    productId: ['', Validators.required],
  });

  discountForm = this.fb.group({
    productId: ['', Validators.required],
    kind: ['percentage' as 'percentage' | 'amount'],
    value: [null as number | null, [Validators.required, Validators.min(0.01)]],
    durationDays: [30 as number | null, [Validators.required, Validators.min(1)]],
  });

  constructor(
    private productsService: ProductsService,
    private categoriesService: CategoriesService,
    private adsService: AdvertisementsService,
    private fb: FormBuilder,
    private toast: ToastService,
    private animation: AnimationService,
    private host: ElementRef
  ) {}

  get visibleCategoryCount(): number {
    return this.categories.filter((c) => this.isCategoryVisible(c)).length;
  }

  get liveAds(): Advertisement[] {
    return this.ads.filter((ad) => this.isAdLive(ad));
  }

  get pickOptions(): SelectOption[] {
    const taken = new Set(this.newArrivals.map((p) => String(p.id)));
    return this.products
      .filter((p) => !taken.has(String(p.id)) && p.status !== 'inactive')
      .map((p) => ({
        value: p.id,
        label: p.name,
        hint: p.sku && p.sku !== '—' ? p.sku : undefined,
      }));
  }

  get discountPickOptions(): SelectOption[] {
    const taken = new Set(this.discounted.map((p) => String(p.id)));
    return this.products
      .filter((p) => p.status !== 'inactive' && (!taken.has(String(p.id)) || p.id === this.discountTarget?.id))
      .map((p) => ({
        value: p.id,
        label: p.name,
        hint: this.money(p.basePrice ?? p.price),
      }));
  }

  get discountProduct(): Product | undefined {
    const id = String(this.discountForm.getRawValue().productId || '');
    return this.products.find((p) => String(p.id) === id) || (this.discountTarget?.id === id ? this.discountTarget : undefined);
  }

  get discountPreviewPrice(): number | null {
    const value = Number(this.discountForm.value.value);
    if (!this.discountProduct || !(value > 0)) return null;
    const base = this.discountBase;
    const next = this.discountForm.value.kind === 'amount' ? base - value : base * (1 - value / 100);
    return Math.max(0, Math.round(next * 100) / 100);
  }

  get discountBase(): number {
    if (this.discountBaseOverride != null) return this.discountBaseOverride;
    const p = this.discountProduct;
    return p ? p.basePrice ?? p.price : 0;
  }

  get discountEndPreview(): string {
    const days = Number(this.discountForm.value.durationDays);
    if (!(days > 0)) return '';
    return this.shortDate(new Date(Date.now() + days * 86400000).toISOString());
  }

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.animation.fadeUpStagger(this.host.nativeElement.querySelectorAll('.anim-item')), 80);
  }

  load(): void {
    this.loading = true;
    forkJoin({
      products: this.productsService.getAll(),
      arrivals: this.productsService.getNew(),
      categories: this.categoriesService.getAll(),
      ads: this.adsService.getAll().pipe(catchError(() => of([] as Advertisement[]))),
      discounted: this.productsService.getDiscounted(),
    }).subscribe({
      next: ({ products, arrivals, categories, ads, discounted }) => {
        this.products = products;
        this.setDiscounted(discounted);
        this.categories = categories.filter((c) => !c.parentId);
        this.ads = ads;
        const byId = new Map<string, Product>();
        [...arrivals, ...products.filter((p) => p.isNew ?? p.featured)]
          .filter((p) => p.id && p.name && p.name !== '—')
          .forEach((p) => {
            if (!byId.has(String(p.id))) byId.set(String(p.id), p);
          });
        this.newArrivals = [...byId.values()];
        this.refreshStats();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('تعذر تحميل محتوى التطبيق');
      },
    });
  }

  readonly brokenImages = new Set<string>();

  categoryIcon(category: Category): string {
    if (category.icon && category.icon !== 'category') return category.icon;
    const name = `${category.name} ${category.nameEn || ''}`.toLowerCase();
    const rules: [RegExp, string][] = [
      [/صحي|سباك|حمام|plumb|sanitary|bath/, 'plumbing'],
      [/دهان|بوي|طلاء|paint/, 'format_paint'],
      [/كهرب|إضاء|اضاء|electr|light/, 'bolt'],
      [/تشطيب|ديكور|finish|decor/, 'home_repair_service'],
      [/سيراميك|بلاط|رخام|أرضي|ارضي|ceramic|tile|floor|marble/, 'grid_view'],
      [/أسمنت|اسمنت|خرسان|cement|concrete/, 'foundation'],
      [/حديد|معادن|steel|iron|metal/, 'hardware'],
      [/خشب|أبواب|ابواب|wood|door/, 'door_front'],
      [/مطبخ|kitchen/, 'kitchen'],
      [/معدات|أدوات|ادوات|tool/, 'construction'],
      [/عزل|insulat/, 'roofing'],
    ];
    return rules.find(([re]) => re.test(name))?.[1] || 'category';
  }

  isCategoryVisible(category: Category): boolean {
    return category.showInApp !== false && category.status !== 'inactive';
  }

  isAdLive(ad: Advertisement): boolean {
    return this.adKind(ad) === 'live';
  }

  adKind(ad: Advertisement): 'live' | 'stopped' | 'scheduled' | 'expired' {
    if (!ad.active) return 'stopped';
    const today = new Date().toISOString().slice(0, 10);
    if (ad.startDate && ad.startDate > today) return 'scheduled';
    if (ad.endDate && ad.endDate < today) return 'expired';
    return 'live';
  }

  adStatus(ad: Advertisement): string {
    const kind = this.adKind(ad);
    if (kind === 'stopped') return 'متوقف';
    if (kind === 'scheduled') return 'مجدول';
    if (kind === 'expired') return 'منتهي';
    return 'ظاهر الآن';
  }

  shortDate(value?: string | null): string {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  adStatusIcon(ad: Advertisement): string {
    const kind = this.adKind(ad);
    if (kind === 'stopped') return 'pause_circle';
    if (kind === 'scheduled') return 'schedule';
    if (kind === 'expired') return 'event_busy';
    return 'check_circle';
  }

  scrollTo(section: HTMLElement): void {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  openPick(): void {
    this.pickForm.reset({ productId: '' });
    this.showPick = true;
  }

  addArrival(): void {
    if (this.pickForm.invalid) {
      this.pickForm.markAllAsTouched();
      this.toast.error('اختر منتجاً');
      return;
    }
    const id = String(this.pickForm.getRawValue().productId);
    const product = this.products.find((p) => String(p.id) === id);
    if (!product) return;
    this.setArrival(product, true);
  }

  removeArrival(product: Product): void {
    if (product.variantOf) this.unsetVariantArrival(product);
    else this.setArrival(product, false);
  }

  private unsetVariantArrival(item: Product): void {
    const ref = item.variantOf!;
    this.busyId = `prod-${item.id}`;
    this.productsService
      .getById(ref.productId)
      .pipe(
        switchMap((full) => {
          if (!full?.variants?.some((v) => String(v.id) === ref.variantId)) {
            throw new Error('variant not found');
          }
          return this.productsService.updateFromProduct(ref.productId, {
            ...full,
            variants: full.variants.map((v) => (String(v.id) === ref.variantId ? { ...v, isNew: false } : v)),
          });
        })
      )
      .subscribe({
        next: () => {
          this.newArrivals = this.newArrivals.filter((p) => p.id !== item.id);
          this.refreshStats();
          this.busyId = null;
          this.toast.success(`أُزيل ${item.name} من وصل حديثاً`);
        },
        error: () => {
          this.busyId = null;
          this.toast.error('فشل تحديث النوع');
        },
      });
  }

  toggleCategory(category: Category): void {
    const next = !this.isCategoryVisible(category);
    this.busyId = `cat-${category.id}`;
    this.categoriesService
      .update(category.id, {
        ...category,
        showInApp: next,
        status: next ? 'active' : 'inactive',
      })
      .subscribe({
        next: (updated) => {
          this.categories = this.categories.map((c) =>
            c.id === category.id ? { ...c, ...updated, showInApp: next, status: next ? 'active' : 'inactive' } : c
          );
          this.refreshStats();
          this.busyId = null;
          this.toast.success(next ? `ظهر قسم ${category.name} في التطبيق` : `اختفى قسم ${category.name} من التطبيق`);
        },
        error: () => {
          this.busyId = null;
          this.toast.error('فشل تحديث القسم');
        },
      });
  }

  toggleAd(ad: Advertisement): void {
    const next = !ad.active;
    this.busyId = `ad-${ad.id}`;
    this.adsService.update(ad.id, { ...ad, active: next }).subscribe({
      next: (updated) => {
        this.ads = this.ads.map((item) => (item.id === ad.id ? { ...item, ...updated, active: next } : item));
        this.refreshStats();
        this.busyId = null;
        this.toast.success(next ? 'الإعلان ظاهر في التطبيق' : 'تم إيقاف الإعلان');
      },
      error: () => {
        this.busyId = null;
        this.toast.error('فشل تحديث الإعلان');
      },
    });
  }

  money(value?: number): string {
    return `${(value || 0).toLocaleString('en-US', { maximumFractionDigits: 3 })} د.ك`;
  }

  isProductDiscount(p: Product): boolean {
    return !p.discountSource || p.discountSource === 'product';
  }

  discountSourceLabel(p: Product): string {
    if (p.discountSource === 'variant') return 'على نوع';
    if (p.discountSource === 'priceTier') return 'خصم كمية';
    return 'على المنتج';
  }

  discountBadge(p: Product): string {
    if (p.discountLabel) return p.discountLabel;
    return p.discountPercent ? `${p.discountPercent}%` : '';
  }

  discountEnd(p: Product): string {
    const d = p.discounts?.[0];
    if (!d?.startDate || !d.durationDays) return '';
    const start = Date.parse(d.startDate);
    if (Number.isNaN(start)) return '';
    return this.shortDate(new Date(start + d.durationDays * 86400000).toISOString());
  }

  openDiscount(product?: Product): void {
    this.discountTarget = product || null;
    this.nestedEdit = null;
    this.discountNote = '';
    this.discountBaseOverride = null;
    this.keptStart = '';
    if (!product) {
      this.fillDiscountForm(null, null);
      this.showDiscount = true;
      return;
    }
    if (this.isProductDiscount(product)) {
      this.fillDiscountForm(product, product.discounts?.[0] || null);
      this.showDiscount = true;
      return;
    }
    const openFrom = (full: Product) => {
      const spot = this.locateNested(full);
      const view: Product = {
        ...product,
        ...full,
        id: product.id,
        name: product.name || full.name,
        image: product.image || full.image,
        variantOf: product.variantOf,
        variants: full.variants?.length ? full.variants : product.variants,
        priceTiers: full.priceTiers?.length ? full.priceTiers : product.priceTiers,
        discounts: full.discounts?.length ? full.discounts : product.discounts,
      };
      this.discountTarget = view;
      if (spot) {
        this.nestedEdit = spot;
        this.discountNote = spot.note;
        this.discountBaseOverride = spot.base;
        this.fillDiscountForm(view, spot.discount);
      } else {
        this.fillDiscountForm(view, view.discounts?.[0] || null);
      }
      this.busyId = null;
      this.showDiscount = true;
    };
    if (this.locateNested(product)) {
      openFrom(product);
      return;
    }
    this.busyId = `open-${product.id}`;
    this.productsService
      .getById(product.variantOf?.productId || product.id)
      .pipe(catchError(() => of(undefined)))
      .subscribe((full) => openFrom(full || product));
  }

  private fillDiscountForm(product: Product | null, current: ProductDiscount | null): void {
    this.keptStart = current?.startDate || '';
    this.discountForm.reset({
      productId: product?.id || '',
      kind: current && !current.isPercentage ? 'amount' : 'percentage',
      value: current?.value ?? (!this.nestedEdit ? product?.discountPercent || null : null),
      durationDays: current?.durationDays || 30,
    });
    if (product) this.discountForm.controls.productId.disable();
    else this.discountForm.controls.productId.enable();
  }

  /** خصم الكمية أو النوع مش على المنتج نفسه — نلاقي الشريحة أو النوع اللي ظاهر في الكارت */
  private locateNested(p: Product): NestedDiscountEdit | null {
    if (this.isProductDiscount(p)) return null;

    const fromPrices = (was: number, now: number, label?: string): ProductDiscount | null => {
      if (!(was > now)) return null;
      const amount = /د\.ك|KD|KWD/i.test(label || '');
      const diff = Math.round((was - now) * 1000) / 1000;
      return {
        isPercentage: !amount,
        value: amount ? diff : Math.round((diff / was) * 1000) / 10,
        startDate: '',
        durationDays: 30,
      };
    };
    const variantLabel = (v: ProductVariant) => Object.values(v.attrs || {}).filter(Boolean).join(' / ') || v.sku;

    if (p.discountSource !== 'priceTier') {
      for (const v of p.variants || []) {
        const discount = v.discounts?.[0]?.value ? v.discounts[0] : fromPrices(v.price, v.finalPrice ?? v.price, v.discountLabel);
        if (!discount) continue;
        return {
          source: 'variant',
          note: `الخصم على النوع${variantLabel(v) ? ': ' + variantLabel(v) : ''}`,
          base: v.price,
          discount,
          variantId: v.id,
          variantSku: v.sku,
          tierOnVariant: false,
        };
      }
    }

    const scanTiers = (tiers: ProductPriceTier[] | undefined, variant?: ProductVariant): NestedDiscountEdit | null => {
      for (const t of tiers || []) {
        const final = t.finalUnitPrice ?? t.unitPrice;
        const discount = t.discounts?.[0]?.value ? t.discounts[0] : fromPrices(t.unitPrice, final, t.discountLabel);
        if (!discount) continue;
        const label = variant ? variantLabel(variant) : '';
        return {
          source: 'priceTier',
          note: `خصم الكمية من ${t.minQuantity} قطعة${label ? ' · ' + label : ''}`,
          base: t.unitPrice,
          discount,
          variantId: variant?.id,
          variantSku: variant?.sku,
          minQuantity: t.minQuantity,
          unitPrice: t.unitPrice,
          tierOnVariant: !!variant,
        };
      }
      return null;
    };

    return (
      scanTiers(p.priceTiers) ||
      (p.variants || []).reduce<NestedDiscountEdit | null>((found, v) => found || scanTiers(v.priceTiers, v), null)
    );
  }

  setDiscountKind(kind: 'percentage' | 'amount'): void {
    this.discountForm.patchValue({ kind });
  }

  saveDiscount(): void {
    if (this.discountForm.invalid) {
      this.discountForm.markAllAsTouched();
      this.toast.error('أكمل بيانات الخصم');
      return;
    }
    const raw = this.discountForm.getRawValue();
    const product = this.discountProduct;
    if (!product) return;
    const value = Number(raw.value);
    const base = this.discountBase;
    if (raw.kind === 'percentage' && value >= 100) {
      this.toast.error('نسبة الخصم لازم تكون أقل من 100%');
      return;
    }
    if (raw.kind === 'amount' && value >= base) {
      this.toast.error('قيمة الخصم لازم تكون أقل من سعر المنتج');
      return;
    }
    const discounts = [
      {
        isPercentage: raw.kind !== 'amount',
        value,
        startDate: this.keptStart || new Date().toISOString(),
        durationDays: Number(raw.durationDays) || 30,
      },
    ];
    if (this.nestedEdit) this.writeNestedDiscount(product, discounts);
    else this.writeDiscount(product, discounts);
  }

  confirmRemoveDiscount(): void {
    const target = this.removeTarget;
    if (!target) return;
    if (this.isProductDiscount(target)) this.writeDiscount(target, []);
    else this.clearNestedDiscounts(target);
  }

  /** يشيل خصومات الشرائح/الأنواع من غير ما يلمس باقي بيانات المنتج */
  private clearNestedDiscounts(product: Product): void {
    const productId = product.variantOf?.productId || product.id;
    this.busyId = `dc-${product.id}`;
    this.productsService
      .getById(productId)
      .pipe(
        switchMap((full) => {
          if (!full) throw new Error('not found');
          const clearTiers = (tiers?: ProductPriceTier[]) => (tiers || []).map((t) => ({ ...t, discounts: [] }));
          return this.productsService.updateFromProduct(productId, {
            ...full,
            discountPercent: undefined,
            discounts: full.discounts || [],
            priceTiers: clearTiers(full.priceTiers),
            variants: (full.variants || []).map((v) => ({
              ...v,
              priceTiers: clearTiers(v.priceTiers),
              discounts: product.discountSource === 'variant' ? [] : v.discounts || [],
            })),
          });
        }),
        switchMap(() => this.productsService.getDiscounted())
      )
      .subscribe({
        next: (list) => {
          this.products = this.products.map((p) =>
            p.id === productId ? { ...p, discountLabel: undefined, discountSource: undefined } : p
          );
          this.setDiscounted(list);
          this.busyId = null;
          this.removeTarget = null;
          this.toast.success(`تم إزالة الخصم من ${product.name}`);
        },
        error: (err) => {
          this.busyId = null;
          this.toast.error(err?.status === 401 ? 'سجّل الدخول بحساب أدمن' : 'فشل إزالة الخصم');
        },
      });
  }

  /** يعدّل خصم الشريحة أو النوع من غير ما يفتح صفحة المنتج */
  private writeNestedDiscount(product: Product, discounts: ProductDiscount[]): void {
    const edit = this.nestedEdit;
    if (!edit) return;
    const productId = product.variantOf?.productId || product.id;
    this.busyId = `dc-${product.id}`;
    this.productsService
      .getById(productId)
      .pipe(
        switchMap((full) => {
          if (!full) throw new Error('not found');
          const { discountPercent: _ignored, ...rest } = full;
          const sameVariant = (v: ProductVariant) =>
            (edit.variantId && v.id === edit.variantId) || (!!edit.variantSku && v.sku === edit.variantSku);
          const sameTier = (t: ProductPriceTier) => t.minQuantity === edit.minQuantity && t.unitPrice === edit.unitPrice;
          let touched = false;
          const next: Partial<Product> = { ...rest };
          if (edit.source === 'variant') {
            next.variants = (full.variants || []).map((v) => {
              if (!sameVariant(v)) return v;
              touched = true;
              return { ...v, discounts };
            });
          } else if (edit.tierOnVariant) {
            next.variants = (full.variants || []).map((v) => {
              if (!sameVariant(v)) return v;
              const priceTiers = (v.priceTiers || []).map((t) => {
                if (!sameTier(t)) return t;
                touched = true;
                return { ...t, discounts };
              });
              return { ...v, priceTiers };
            });
          } else {
            next.priceTiers = (full.priceTiers || []).map((t) => {
              if (!sameTier(t)) return t;
              touched = true;
              return { ...t, discounts };
            });
          }
          if (!touched) throw new Error('missing discount');
          return this.productsService.updateFromProduct(productId, next);
        }),
        switchMap(() => this.productsService.getDiscounted())
      )
      .subscribe({
        next: (list) => {
          this.setDiscounted(list);
          this.busyId = null;
          this.showDiscount = false;
          this.toast.success(`تم حفظ خصم ${product.name}`);
        },
        error: (err) => {
          this.busyId = null;
          this.toast.error(err?.status === 401 ? 'سجّل الدخول بحساب أدمن' : 'فشل حفظ الخصم');
        },
      });
  }

  private writeDiscount(product: Product, discounts: ProductDiscount[]): void {
    const removing = !discounts.length;
    this.busyId = `dc-${product.id}`;
    this.productsService
      .getById(product.id)
      .pipe(
        catchError(() => of(undefined)),
        switchMap((full) =>
          this.productsService.updateFromProduct(product.id, {
            ...product,
            ...(full || {}),
            discountPercent: undefined,
            discounts,
          })
        ),
        switchMap(() => this.productsService.getDiscounted())
      )
      .subscribe({
        next: (list) => {
          this.setDiscounted(list);
          this.busyId = null;
          this.showDiscount = false;
          this.removeTarget = null;
          this.toast.success(removing ? `تم إزالة الخصم من ${product.name}` : `تم حفظ خصم ${product.name}`);
        },
        error: (err) => {
          this.busyId = null;
          this.toast.error(err?.status === 401 ? 'سجّل الدخول بحساب أدمن' : 'فشل حفظ الخصم');
        },
      });
  }

  private setDiscounted(list: Product[]): void {
    const byId = new Map<string, Product>();
    list.forEach((p) => byId.set(String(p.id), p));
    this.products
      .filter((p) => p.discountLabel && !byId.has(String(p.id)))
      .forEach((p) => byId.set(String(p.id), p));
    this.discounted = [...byId.values()];
    this.hydrateDiscounted();
  }

  /** خصومات الكمية والأنواع بتيجي من القائمة من غير الشرائح — نجيب التفاصيل عشان نعرض السعر قبل/بعد */
  private hydrateDiscounted(): void {
    this.discounted
      .filter((p) => !this.isProductDiscount(p) && !this.dcPrice(p).was)
      .forEach((p) => {
        this.productsService
          .getById(p.id)
          .pipe(catchError(() => of(undefined)))
          .subscribe((full) => {
            if (!full) return;
            this.discounted = this.discounted.map((item) =>
              item.id === p.id
                ? { ...item, variants: full.variants, priceTiers: full.priceTiers, hasVariants: full.hasVariants }
                : item
            );
          });
      });
  }

  /** السعر بعد/قبل الخصم + ملاحظة لمصدر الخصم (نوع أو شريحة كمية) */
  dcPrice(p: Product): { now: number; was: number | null; note: string } {
    const base = p.basePrice ?? p.price;
    if (this.isProductDiscount(p) || base > p.price) {
      return { now: p.price, was: base > p.price ? base : null, note: '' };
    }
    const sources: { label: string; tiers: ProductPriceTier[]; price?: number; final?: number }[] = [
      { label: '', tiers: p.priceTiers || [] },
      ...(p.variants || []).map((v) => ({
        label: Object.values(v.attrs || {}).filter(Boolean).join(' / '),
        tiers: v.priceTiers || [],
        price: v.price,
        final: v.finalPrice,
      })),
    ];
    for (const s of sources) {
      const tier = s.tiers.find((t) => (t.finalUnitPrice ?? t.unitPrice) < t.unitPrice);
      if (tier) {
        const note = `عند ${tier.minQuantity}+ قطعة` + (s.label ? ` · ${s.label}` : '');
        return { now: tier.finalUnitPrice ?? tier.unitPrice, was: tier.unitPrice, note };
      }
      if (s.price !== undefined && s.final !== undefined && s.final < s.price) {
        return { now: s.final, was: s.price, note: s.label };
      }
    }
    return { now: p.price, was: null, note: '' };
  }

  private setArrival(product: Product, featured: boolean): void {
    this.busyId = `prod-${product.id}`;
    this.productsService.updateFromProduct(product.id, { ...product, featured }).subscribe({
      next: (updated) => {
        const next = { ...product, ...updated, featured };
        this.products = this.products.map((p) => (p.id === product.id ? next : p));
        this.newArrivals = featured
          ? [next, ...this.newArrivals.filter((p) => p.id !== product.id)]
          : this.newArrivals.filter((p) => p.id !== product.id);
        this.showPick = false;
        this.refreshStats();
        this.busyId = null;
        this.toast.success(featured ? `أُضيف ${product.name} إلى وصل حديثاً` : `أُزيل ${product.name} من وصل حديثاً`);
      },
      error: () => {
        this.busyId = null;
        this.toast.error('فشل تحديث المنتج');
      },
    });
  }

  private refreshStats(): void {
    const liveAds = this.liveAds.length;
    const visibleCats = this.visibleCategoryCount;
    this.stats = [
      { ...this.stats[0], value: liveAds, change: 'تظهر أعلى التطبيق', changeType: liveAds ? 'up' : 'neutral' },
      { ...this.stats[1], value: visibleCats, change: 'ظاهرة للمستخدم', changeType: visibleCats ? 'up' : 'neutral' },
      { ...this.stats[2], value: this.newArrivals.length, change: 'منتجات معلّمة كجديد', changeType: this.newArrivals.length ? 'up' : 'neutral' },
      { ...this.stats[3], value: this.ads.length, change: 'من محتوى التطبيق', changeType: this.ads.length ? 'up' : 'neutral' },
    ];
  }
}
