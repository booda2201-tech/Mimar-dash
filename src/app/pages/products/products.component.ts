import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { SelectComponent, SelectOption } from '../../shared/components/select/select.component';
import { ProductsService } from '../../core/services/products.service';
import { CategoriesService, BrandsService } from '../../core/services/data.services';
import { ToastService } from '../../core/services/toast.service';
import { AnimationService } from '../../core/services/animation.service';
import { LayoutService } from '../../core/services/layout.service';
import {
  Product,
  ProductDiscount,
  ProductFormPayload,
  ProductPriceTier,
  ProductVariant,
  StatCardData,
  TableColumn,
  Category,
  Brand,
} from '../../core/models';
import {
  assistProduct,
  BotDiscount,
  BotProductJson,
  cleanSpecText,
  fold,
  isBasicSpec,
  parseBotJson,
  stripLabel,
} from './product-assistant';
import { GeminiAiService, GeminiProduct } from '../../core/services/gemini-ai.service';
import { STARTER_PRODUCTS, StarterProduct, StarterProductGroup } from './products-starter';
import { STARTER_DETAILS } from './products-starter-details';

type ModalMode = 'add' | 'edit' | 'view';

interface GalleryImage {
  preview: string;
  file?: File;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StatCardComponent,
    DataTableComponent,
    ModalComponent,
    ConfirmDialogComponent,
    StatusBadgeComponent,
    SelectComponent,
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
})
export class ProductsComponent implements OnInit, AfterViewInit, OnDestroy {
  loading = true;
  saving = false;
  products: Product[] = [];
  showForm = false;
  showView = false;
  showConfirm = false;
  mode: ModalMode = 'add';
  selected: Product | null = null;
  selectedId: string | null = null;
  readonly inputUnitPresets = ['m2', 'm3', 'm', 'kg', 'ton', 'L'];
  viewImage = '';
  viewDescLang: 'ar' | 'en' = 'ar';
  expandedVariant: number | null = null;
  private subs: Subscription[] = [];

  stats: StatCardData[] = [
    { title: 'إجمالي الأصناف', value: 0, change: 'من الـ API', changeType: 'neutral', icon: 'inventory', animate: true },
    { title: 'متوفرة للطلب', value: 0, change: 'نشط', changeType: 'up', icon: 'check_circle', animate: true },
    { title: 'مخزون منخفض', value: 0, change: '≤ 5', changeType: 'down', icon: 'warning', animate: true },
    { title: 'نفد من المخزون', value: 0, change: '0 متبقي', changeType: 'down', icon: 'error', animate: true },
  ];

  searchTerm = '';
  catalogView: 'cards' | 'table' = 'cards';
  mobileLimit = 12;
  page = 1;
  pageSize = 12;
  readonly pageSizes = [12, 24, 48];
  sheetProduct: Product | null = null;
  private readonly mobileQuery = typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)') : null;
  isMobile = !!this.mobileQuery?.matches;
  private readonly onMobileChange = (e: MediaQueryListEvent) => {
    this.isMobile = e.matches;
    this.cdRef.detectChanges();
  };
  catalogFilter: 'all' | 'discount' | 'new' | 'variants' | 'low' = 'all';
  categoryFilter = '';
  categoryFilterCtrl = new FormControl<string | number>('', { nonNullable: true });
  categoryFilterOptions: SelectOption[] = [];
  private categoryScope: Set<string> | null = null;
  readonly catalogFilters: { key: ProductsComponent['catalogFilter']; label: string }[] = [
    { key: 'all', label: 'الكل' },
    { key: 'discount', label: 'عليها خصم' },
    { key: 'new', label: 'جديد' },
    { key: 'variants', label: 'بأنواع' },
    { key: 'low', label: 'مخزون قليل' },
  ];

  columns: TableColumn[] = [
    { key: 'image', label: 'الصورة', type: 'image', width: '72px' },
    { key: 'sku', label: 'رمز SKU', sortable: true },
    { key: 'name', label: 'المنتج', sortable: true },
    { key: 'category', label: 'الفئة', sortable: true },
    { key: 'brand', label: 'البراند', sortable: true },
    { key: 'price', label: 'السعر بعد الخصم', sortable: true, type: 'currency' },
    { key: 'stock', label: 'المخزون', sortable: true },
    { key: 'status', label: 'الحالة', type: 'status' },
    { key: 'actions', label: 'إجراءات', type: 'actions' },
  ];

  gallery: GalleryImage[] = [];
  mainImage = 0;
  variantProps: string[] = ['اللون', 'المقاس', 'الخامة'];
  addingProp = false;
  newProp = '';
  assistText = '';
  assisting = false;
  botOpen = typeof window !== 'undefined' && window.innerWidth >= 1400;
  readonly botExamples = [
    { label: 'أسمنت', text: 'إسمنت بورتلاند 50 كجم من أسمنت اليمامة، سعر 28.5، مخزون 12500' },
    { label: 'دهان', text: 'دهان داخلي أبيض مطفي 18 لتر من جوتن، سعر 320، مخزون 400، خصم 10%' },
    { label: 'سيراميك', text: 'سيراميك أرضيات 60×60 رمادي، سعر المتر 45، مخزون 3000 متر' },
  ];

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    nameEn: [''],
    description: [''],
    descriptionEn: [''],
    sku: [''],
    category: ['', Validators.required],
    brand: [''],
    price: [null as number | null, [Validators.required, Validators.min(0.01)]],
    stock: [null as number | null, [Validators.required, Validators.min(0)]],
    quotationQuantity: [null as number | null, [Validators.min(1)]],
    coveragePerUnit: [null as number | null, [Validators.min(0.0001)]],
    inputUnit: ['', [Validators.maxLength(20)]],
    showInApp: [true],
    featured: [false],
    hasVariants: [false],
    specs: this.fb.array([this.specGroup()]),
    variants: this.fb.array([this.variantGroup()]),
    priceTiers: this.fb.array([] as FormGroup[]),
    discounts: this.fb.array([] as FormGroup[]),
  });

  categoryOptions: SelectOption[] = [];
  categories: Category[] = [];
  brands: Brand[] = [];
  brandOptions: SelectOption[] = [];

  readonly starterGroups = STARTER_PRODUCTS;
  showStarter = false;
  starterBusy = false;
  starterDone = 0;
  starterTotal = 0;
  starterMode: 'import' | 'enrich' = 'import';

  constructor(
    private productsService: ProductsService,
    private categoriesService: CategoriesService,
    private brandsService: BrandsService,
    private fb: FormBuilder,
    private toast: ToastService,
    private animation: AnimationService,
    private host: ElementRef,
    private layout: LayoutService,
    private cdRef: ChangeDetectorRef,
    private gemini: GeminiAiService
  ) {}

  get formTitle(): string {
    if (this.mode === 'edit') return 'تعديل المنتج';
    return 'إضافة منتج جديد';
  }

  get specs(): FormArray {
    return this.form.get('specs') as FormArray;
  }

  get variants(): FormArray {
    return this.form.get('variants') as FormArray;
  }

  get priceTiers(): FormArray {
    return this.form.get('priceTiers') as FormArray;
  }

  get discounts(): FormArray {
    return this.form.get('discounts') as FormArray;
  }

  get images(): string[] {
    return this.gallery.map((g) => g.preview);
  }

  asGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  arr(control: AbstractControl, name: string): FormArray {
    return control.get(name) as FormArray;
  }

  // ---------- form groups ----------

  specGroup(nameAr = '', valueAr = '', nameEn = '', valueEn = '') {
    return this.fb.group({ nameAr: [nameAr], valueAr: [valueAr], nameEn: [nameEn], valueEn: [valueEn] });
  }

  discountGroup(d?: Partial<ProductDiscount>) {
    return this.fb.group({
      type: [d?.isPercentage === false ? 'amount' : 'percent'],
      value: [d?.value ?? null, [Validators.required, Validators.min(0.01)]],
      startDate: [(d?.startDate || new Date().toISOString()).slice(0, 10), Validators.required],
      durationDays: [d?.durationDays ?? 30, [Validators.required, Validators.min(1)]],
    });
  }

  tierGroup(t?: Partial<ProductPriceTier>) {
    return this.fb.group({
      minQuantity: [t?.minQuantity ?? 1, [Validators.required, Validators.min(1)]],
      maxQuantity: [t?.maxQuantity ?? null],
      unitPrice: [t?.unitPrice ?? null, [Validators.required, Validators.min(0.01)]],
      discounts: this.fb.array((t?.discounts || []).map((d) => this.discountGroup(d))),
    });
  }

  variantGroup(v?: Partial<ProductVariant>) {
    const legacy: Record<string, string> = {
      اللون: v?.attrs?.['اللون'] || v?.color || '',
      المقاس: v?.attrs?.['المقاس'] || v?.size || '',
      الخامة: v?.attrs?.['الخامة'] || v?.material || '',
    };
    const attrs = this.fb.group({});
    this.variantProps.forEach((prop) => {
      attrs.addControl(prop, this.fb.control(v?.attrs?.[prop] ?? legacy[prop] ?? ''));
    });
    return this.fb.group({
      attrs,
      attrsEn: [v?.attrsEn || {}],
      price: [v?.price ?? null],
      stock: [v?.stock ?? null],
      sku: [v?.sku || ''],
      isActive: [v?.isActive !== false],
      isNew: [!!v?.isNew],
      priceTiers: this.fb.array((v?.priceTiers || []).map((t) => this.tierGroup(t))),
      discounts: this.fb.array((v?.discounts || []).map((d) => this.discountGroup(d))),
    });
  }

  addDiscount(target: FormArray): void {
    target.push(this.discountGroup());
  }

  removeDiscount(target: FormArray, index: number): void {
    target.removeAt(index);
  }

  addTier(target: FormArray): void {
    const last = target.length ? (target.at(target.length - 1).value as { maxQuantity?: number | null }) : null;
    const nextMin = last?.maxQuantity ? Number(last.maxQuantity) + 1 : target.length ? null : 1;
    target.push(this.tierGroup({ minQuantity: nextMin ?? 1 }));
  }

  removeTier(target: FormArray, index: number): void {
    target.removeAt(index);
  }

  toggleVariant(index: number): void {
    this.expandedVariant = this.expandedVariant === index ? null : index;
  }

  variantLabel(index: number): string {
    const attrs = (this.variants.at(index)?.get('attrs')?.value ?? {}) as Record<string, string>;
    const parts = Object.values(attrs).map((v) => String(v ?? '').trim()).filter(Boolean);
    return parts.length ? `(${parts.join(' · ')})` : `رقم ${index + 1}`;
  }

  // ---------- assistant ----------

  async fillFromAssistant(sample?: string): Promise<void> {
    if (sample) this.assistText = sample;
    const text = this.assistText.trim();
    if (text.length < 3 || this.assisting) {
      if (!this.assisting) this.toast.error('اكتب وصف المنتج في سطر أو سطرين');
      return;
    }

    const pasted = parseBotJson(text);
    if (pasted) {
      this.applyBotJson(pasted);
      return;
    }

    if (this.gemini.enabled) {
      this.assisting = true;
      this.cdRef.detectChanges();
      try {
        const ai = await this.gemini.parseProduct(text, {
          categories: this.categories.map((c) => c.name),
          brands: this.brands.map((b) => b.name),
        });
        this.applyBotJson(this.fromGemini(ai));
        return;
      } catch (err) {
        console.error('Gemini error', err);
        this.toast.warning('تعذر الوصول لـ Gemini — تم استخدام المحلل المحلي');
      } finally {
        this.assisting = false;
        this.cdRef.detectChanges();
      }
    }

    const local = assistProduct(text, {
      categories: this.categories.map((c) => ({ name: c.name, nameEn: c.nameEn })),
      brands: this.brands.map((b) => ({ name: b.name, nameEn: b.nameEn })),
    });
    if (local) this.applyBotJson(local);
  }

  private fromGemini(ai: GeminiProduct): Partial<BotProductJson> {
    const wholesale = Number(ai.wholesaleUnitPrice ?? (ai as { wholesalePrice?: number }).wholesalePrice) || 0;
    const percent = Number(ai.discountPercent) || 0;
    return {
      basicInfo: {
        nameAr: ai.nameAr,
        nameEn: ai.nameEn,
        descriptionAr: ai.descriptionAr,
        descriptionEn: ai.descriptionEn,
        category: ai.category,
        brand: ai.brand,
        sku: ai.sku,
        flags: { isActive: true, isNew: true, hasVariants: false },
      },
      pricingAndInventory: {
        price: ai.price,
        stock: ai.stock,
        priceTiers: wholesale > 0 ? [{ fromQty: ai.wholesaleMinQty || null, toQty: null, unitPrice: wholesale }] : [],
        tierDiscount: null,
        productDiscount:
          percent > 0 ? { type: 'percentage', value: Math.min(percent, 100), startDate: null, durationDays: 30 } : null,
      },
      specifications: ai.specifications || [],
    };
  }

  /** يطبّق JSON بوت معمار على الفورم بالكامل */
  applyBotJson(data: Partial<BotProductJson>): void {
    const info = data.basicInfo;
    const pricing = data.pricingAndInventory;
    const flags = info?.flags;
    const text = (v: unknown) => stripLabel(v);
    const num = (v: unknown) => {
      if (v === null || v === undefined || v === '') return null;
      const n = Number(String(v).replace(/[^\d.-]/g, ''));
      return Number.isFinite(n) ? n : null;
    };
    const discount = (d: Partial<BotDiscount> | null | undefined): Partial<ProductDiscount> | null => {
      const value = num(d?.value);
      if (!d || !value || value <= 0) return null;
      const date = text(d.startDate);
      return {
        isPercentage: d.type !== 'fixed',
        value,
        startDate: /^\d{4}-\d{2}-\d{2}/.test(date) ? date : undefined,
        durationDays: num(d.durationDays) || 30,
      };
    };

    const categoryId = this.resolveCategory(text(info?.category));
    const brandId = this.resolveBrand(text(info?.brand));
    const hasVariants = !!flags?.hasVariants;

    if (data.variantProps?.length) this.variantProps = [...data.variantProps];

    this.form.patchValue({
      name: text(info?.nameAr),
      nameEn: text(info?.nameEn),
      description: text(info?.descriptionAr),
      descriptionEn: text(info?.descriptionEn),
      category: categoryId,
      brand: brandId,
      sku: text(info?.sku),
      showInApp: flags?.isActive !== false,
      featured: flags?.isNew !== false,
      hasVariants,
      price: num(pricing?.price),
      stock: num(pricing?.stock),
    });

    this.priceTiers.clear();
    (pricing?.priceTiers || []).forEach((t) => {
      const unitPrice = num(t?.unitPrice);
      if (!unitPrice) return;
      const tier = this.tierGroup({ maxQuantity: num(t.toQty) ?? undefined, unitPrice });
      // لو الكمية مش معروفة بنسيبها فاضية عشان الأدمن يحددها
      tier.get('minQuantity')!.setValue(num(t.fromQty));
      this.priceTiers.push(tier);
    });
    const loose = { ...(data as Record<string, unknown>), ...((pricing ?? {}) as Record<string, unknown>) };
    const wholesale = num(loose['wholesalePrice'] ?? loose['wholesaleUnitPrice']);
    if (wholesale && wholesale > 0) {
      if (!this.priceTiers.length) {
        const tier = this.tierGroup({ unitPrice: wholesale });
        tier.get('minQuantity')!.setValue(num(loose['wholesaleMinQty']));
        this.priceTiers.push(tier);
      } else {
        this.priceTiers.at(0).patchValue({ unitPrice: wholesale });
      }
    }
    const tierDiscount = discount(pricing?.tierDiscount);
    if (tierDiscount && this.priceTiers.length) {
      const index = Math.min(Math.max(num(pricing?.tierDiscount?.tierIndex) ?? 0, 0), this.priceTiers.length - 1);
      this.arr(this.priceTiers.at(index), 'discounts').push(this.discountGroup(tierDiscount));
    }

    this.discounts.clear();
    const productDiscount = discount(pricing?.productDiscount) ?? (this.priceTiers.length ? null : tierDiscount);
    if (productDiscount) this.discounts.push(this.discountGroup(productDiscount));

    this.specs.clear();
    const specRows: { specAr: string; valueAr: string; specEn: string; valueEn: string }[] = [];
    (data.specifications || []).forEach((s) => {
      const row = {
        specAr: cleanSpecText(s?.specAr),
        valueAr: cleanSpecText(s?.valueAr),
        specEn: cleanSpecText(s?.specEn),
        valueEn: cleanSpecText(s?.valueEn),
      };
      if (!row.specAr || !row.valueAr || isBasicSpec(row)) return;
      const dup = specRows.find((r) => fold(r.specAr) === fold(row.specAr));
      if (dup) {
        dup.specEn ||= row.specEn;
        dup.valueEn ||= row.valueEn;
      } else specRows.push(row);
    });
    specRows.forEach((s) => this.specs.push(this.specGroup(s.specAr, s.valueAr, s.specEn, s.valueEn)));
    if (!this.specs.length) this.specs.push(this.specGroup());

    this.variants.clear();
    const variants = hasVariants && data.variants?.length ? data.variants : [{}];
    variants.forEach((v) => this.variants.push(this.variantGroup(v as Partial<ProductVariant>)));
    this.expandedVariant = null;

    this.applyVariantValidators(hasVariants);
    this.form.markAsDirty();
    this.cdRef.detectChanges();

    const missing: string[] = [];
    if (!text(info?.nameAr)) missing.push('اسم المنتج');
    if (!categoryId) missing.push(info?.category ? `الفئة «${text(info.category)}» مش موجودة` : 'الفئة');
    if (info?.brand && !brandId) missing.push(`البراند «${text(info.brand)}» مش موجود`);
    if (!hasVariants && num(pricing?.price) === null) missing.push('السعر');
    if (!hasVariants && num(pricing?.stock) === null) missing.push('المخزون');
    if (missing.length) this.toast.warning(`تم التعبئة — ناقص: ${missing.join('، ')}`);
    else this.toast.success('تم تعبئة النموذج، راجع الحقول قبل الحفظ');
  }

  private resolveCategory(name: string): string {
    if (!name) return '';
    const f = fold(name);
    const byId = this.categories.find((c) => c.id === name);
    const hit =
      byId ||
      this.categories.find((c) => fold(c.name) === f || fold(c.nameEn || '') === f) ||
      this.categories.find((c) => !!c.name && (fold(c.name).includes(f) || f.includes(fold(c.name))));
    return hit?.id || '';
  }

  private resolveBrand(name: string): string {
    if (!name) return '';
    const f = fold(name);
    const hit =
      this.brands.find((b) => b.id === name) ||
      this.brands.find((b) => fold(b.name) === f || fold(b.nameEn || '') === f) ||
      this.brands.find((b) => !!b.name && (fold(b.name).includes(f) || f.includes(fold(b.name))));
    return hit?.id || '';
  }

  // ---------- variant props ----------

  startAddProp(): void {
    this.addingProp = true;
    this.newProp = '';
  }

  commitProp(): void {
    const name = this.newProp.trim();
    this.addingProp = false;
    this.newProp = '';
    if (!name || this.variantProps.includes(name)) return;
    this.variantProps = [...this.variantProps, name];
    this.variants.controls.forEach((row) => {
      (row.get('attrs') as FormGroup).addControl(name, this.fb.control(''));
    });
  }

  removeProp(name: string): void {
    this.variantProps = this.variantProps.filter((p) => p !== name);
    this.variants.controls.forEach((row) => {
      (row.get('attrs') as FormGroup).removeControl(name);
    });
  }

  addSpec(): void {
    this.specs.push(this.specGroup());
  }

  removeSpec(index: number): void {
    if (this.specs.length === 1) {
      this.specs.at(0).reset({ nameAr: '', valueAr: '', nameEn: '', valueEn: '' });
      return;
    }
    this.specs.removeAt(index);
  }

  addVariant(): void {
    this.variants.push(this.variantGroup());
  }

  removeVariant(index: number): void {
    if (this.variants.length === 1) return;
    this.variants.removeAt(index);
    if (this.expandedVariant === index) this.expandedVariant = null;
    else if (this.expandedVariant !== null && this.expandedVariant > index) this.expandedVariant--;
  }

  // ---------- images ----------

  onImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []).filter((f) => f.type.startsWith('image/'));
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') this.gallery = [...this.gallery, { preview: reader.result, file }];
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  setMain(index: number): void {
    this.mainImage = index;
  }

  removeImage(index: number): void {
    this.gallery = this.gallery.filter((_, i) => i !== index);
    if (this.mainImage >= this.gallery.length) this.mainImage = 0;
  }

  // ---------- lifecycle ----------

  ngOnInit(): void {
    this.mobileQuery?.addEventListener('change', this.onMobileChange);
    this.load();
    this.categoriesService.getAll().subscribe((categories) => {
      this.categories = categories;
      this.categoryOptions = this.categoryTreeOptions(categories);
      this.refreshCategoryFilter();
    });
    this.brandsService.getAll().subscribe((brands) => {
      this.brands = brands;
      this.brandOptions = this.brands.map((b) => ({
        value: b.id,
        label: b.nameEn ? `${b.name} · ${b.nameEn}` : b.name,
      }));
    });
    this.subs.push(
      this.form.get('hasVariants')!.valueChanges.subscribe((has) => this.applyVariantValidators(!!has)),
      this.layout.createProduct$.subscribe(() => this.openAdd())
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.animation.fadeUpStagger(this.host.nativeElement.querySelectorAll('.anim-item')), 80);
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.mobileQuery?.removeEventListener('change', this.onMobileChange);
  }

  /** price و stockQuantity مطلوبين بس لو المنتج من غير أنواع */
  private applyVariantValidators(hasVariants: boolean): void {
    const price = this.form.get('price')!;
    const stock = this.form.get('stock')!;
    if (hasVariants) {
      price.clearValidators();
      stock.clearValidators();
    } else {
      price.setValidators([Validators.required, Validators.min(0.01)]);
      stock.setValidators([Validators.required, Validators.min(0)]);
    }
    price.updateValueAndValidity({ emitEvent: false });
    stock.updateValueAndValidity({ emitEvent: false });
  }

  load(): void {
    this.loading = true;
    this.productsService.getAll().subscribe((data) => {
      this.products = data;
      this.refreshStats(data);
      this.refreshCategoryFilter();
      this.loading = false;
    });
  }

  private refreshStats(data: Product[]): void {
    const active = data.filter((p) => p.status === 'active' || (p.stock ?? 0) > 5).length;
    const low = data.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5).length;
    const out = data.filter((p) => (p.stock ?? 0) <= 0 || p.status === 'out').length;
    this.stats = [
      { ...this.stats[0], value: data.length },
      { ...this.stats[1], value: active },
      { ...this.stats[2], value: low },
      { ...this.stats[3], value: out },
    ];
  }

  private resetArrays(product?: Product): void {
    this.specs.clear();
    const specs = product?.specs?.length ? product.specs : [{ label: '', value: '' }];
    specs.forEach((s) => this.specs.push(this.specGroup(s.label, s.value, s.labelEn || '', s.valueEn || '')));

    this.variants.clear();
    const variants = product?.variants?.length ? product.variants : [{}];
    variants.forEach((v) => this.variants.push(this.variantGroup(v)));

    this.priceTiers.clear();
    (product?.priceTiers || []).forEach((t) => this.priceTiers.push(this.tierGroup(t)));

    this.discounts.clear();
    (product?.discounts || []).forEach((d) => this.discounts.push(this.discountGroup(d)));
  }

  openAdd(): void {
    this.mode = 'add';
    this.selected = null;
    this.gallery = [];
    this.mainImage = 0;
    this.expandedVariant = null;
    this.variantProps = ['اللون', 'المقاس', 'الخامة'];
    this.addingProp = false;
    this.assistText = '';
    this.form.reset({
      name: '',
      nameEn: '',
      description: '',
      descriptionEn: '',
      sku: '',
      category: '',
      brand: '',
      price: null,
      stock: null,
      quotationQuantity: null,
      coveragePerUnit: null,
      inputUnit: '',
      showInApp: true,
      featured: false,
      hasVariants: false,
    });
    this.resetArrays();
    this.applyVariantValidators(false);
    this.form.enable();
    this.showForm = true;
  }

  openEdit(product: Product): void {
    this.mode = 'edit';
    this.selected = product;
    this.gallery = (product.images || []).map((preview) => ({ preview }));
    this.mainImage = 0;
    this.expandedVariant = null;
    this.variantProps = product.variantProps?.length ? [...product.variantProps] : ['اللون', 'المقاس', 'الخامة'];
    this.addingProp = false;
    this.form.reset({
      name: product.name,
      nameEn: product.nameEn || '',
      description: product.description || '',
      descriptionEn: product.descriptionEn || '',
      sku: product.sku === '—' ? '' : product.sku,
      category: product.categoryId || '',
      brand: product.brandId || '',
      price: product.basePrice ?? product.price,
      stock: product.stock,
      quotationQuantity: product.quotationQuantity ?? null,
      coveragePerUnit: product.coveragePerUnit ?? null,
      inputUnit: product.inputUnit || '',
      showInApp: product.showInApp !== false,
      featured: !!(product.isNew ?? product.featured),
      hasVariants: !!product.hasVariants,
    });
    this.resetArrays(product);
    this.applyVariantValidators(!!product.hasVariants);
    this.form.enable();
    this.showForm = true;
  }

  openView(product: Product): void {
    if (this.selected?.id !== product.id) {
      this.viewImage = '';
      this.viewDescLang = 'ar';
    }
    this.selected = product;
    const gallery = this.viewGallery(product);
    if (!gallery.includes(this.viewImage)) this.viewImage = gallery[0] || '';
    this.showView = true;
  }

  viewGallery(p: Product): string[] {
    return [...new Set([p.image, ...(p.images || [])].filter((src): src is string => !!src))];
  }

  viewHasDiscount(p: Product): boolean {
    return (p.basePrice ?? p.price) > p.price;
  }

  viewSavePercent(p: Product): number {
    const base = p.basePrice ?? p.price;
    return base > 0 && base > p.price ? Math.round(((base - p.price) / base) * 100) : p.discountPercent || 0;
  }

  viewStockTone(p: Product): 'ok' | 'low' | 'out' {
    return p.stock <= 0 ? 'out' : p.stock <= 5 ? 'low' : 'ok';
  }

  calcUnitsFor(amount: number): number {
    const coverage = Number(this.form.value.coveragePerUnit);
    return coverage > 0 ? Math.ceil(amount / coverage) : 0;
  }

  tierRange(t: ProductPriceTier): string {
    return t.maxQuantity ? `${t.minQuantity}–${t.maxQuantity}` : `${t.minQuantity}+`;
  }

  // ---------- payload ----------

  private discountsOut(raw: unknown[] | undefined): ProductDiscount[] {
    return ((raw || []) as { type: string; value: unknown; startDate: string; durationDays: unknown }[])
      .map((d) => ({
        isPercentage: d.type !== 'amount',
        value: Number(d.value) || 0,
        startDate: new Date(`${d.startDate}T00:00:00Z`).toISOString(),
        durationDays: Number(d.durationDays) || 1,
      }))
      .filter((d) => d.value > 0);
  }

  private tiersOut(raw: unknown[] | undefined): ProductPriceTier[] {
    return ((raw || []) as { minQuantity: unknown; maxQuantity: unknown; unitPrice: unknown; discounts: unknown[] }[])
      .map((t) => {
        const max = t.maxQuantity === null || t.maxQuantity === '' ? undefined : Number(t.maxQuantity);
        return {
          minQuantity: Number(t.minQuantity) || 1,
          maxQuantity: Number.isFinite(max) ? max : undefined,
          unitPrice: Number(t.unitPrice) || 0,
          discounts: this.discountsOut(t.discounts),
        };
      })
      .filter((t) => t.unitPrice > 0);
  }

  private payloadFromForm(): ProductFormPayload {
    const raw = this.form.getRawValue() as Record<string, any>;
    const hasVariants = !!raw['hasVariants'];

    const specifications = (raw['specs'] || [])
      .map((s: Record<string, string>) => ({
        nameAr: (s['nameAr'] || '').trim(),
        nameEn: (s['nameEn'] || '').trim() || undefined,
        valueAr: (s['valueAr'] || '').trim(),
        valueEn: (s['valueEn'] || '').trim() || undefined,
      }))
      .filter((s: { nameAr: string; valueAr: string }) => s.nameAr && s.valueAr)
      .map((s: ProductFormPayload['specifications'][number], i: number) => ({ ...s, displayOrder: i + 1 }));

    const variants: ProductFormPayload['variants'] = hasVariants
      ? (raw['variants'] || []).map((v: Record<string, any>) => {
          const attrsEn = (v['attrsEn'] || {}) as ProductVariant['attrsEn'];
          return {
            sku: (v['sku'] || '').trim() || undefined,
            price: Number(v['price']) || 0,
            stockQuantity: Number(v['stock']) || 0,
            isActive: v['isActive'] !== false,
            isNew: !!v['isNew'],
            attributes: this.variantProps
              .filter((prop) => (v['attrs']?.[prop] || '').trim())
              .map((prop) => ({
                nameAr: prop,
                valueAr: String(v['attrs'][prop]).trim(),
                nameEn: attrsEn?.[prop]?.nameEn,
                valueEn: attrsEn?.[prop]?.valueEn,
              })),
            priceTiers: this.tiersOut(v['priceTiers']),
            discounts: this.discountsOut(v['discounts']),
          };
        })
      : [];

    return {
      nameAr: (raw['name'] || '').trim(),
      nameEn: (raw['nameEn'] || '').trim() || undefined,
      descriptionAr: (raw['description'] || '').trim() || undefined,
      descriptionEn: (raw['descriptionEn'] || '').trim() || undefined,
      sku: (raw['sku'] || '').trim() || undefined,
      categoryId: Number(raw['category']),
      brandId: raw['brand'] ? Number(raw['brand']) : undefined,
      hasVariants,
      price: hasVariants ? undefined : Number(raw['price']),
      stockQuantity: hasVariants ? undefined : Number(raw['stock']),
      quotationQuantity: Number(raw['quotationQuantity']) > 0 ? Number(raw['quotationQuantity']) : undefined,
      coveragePerUnit: Number(raw['coveragePerUnit']) > 0 ? Number(raw['coveragePerUnit']) : undefined,
      inputUnit: (raw['inputUnit'] || '').trim() || undefined,
      isActive: !!raw['showInApp'],
      isNew: !!raw['featured'],
      specifications,
      variants,
      priceTiers: hasVariants ? [] : this.tiersOut(raw['priceTiers']),
      discounts: this.discountsOut(raw['discounts']),
    };
  }

  private validatePayload(p: ProductFormPayload): string | null {
    if (!Number.isFinite(p.categoryId) || p.categoryId <= 0) return 'اختر الفئة';
    const parent = this.categories.find((c) => String(c.id) === String(p.categoryId));
    if (parent && this.categories.some((c) => String(c.parentId) === String(parent.id))) {
      return `«${parent.name}» فيها فئات فرعية — اختار فئة فرعية من جواها`;
    }
    if (p.hasVariants) {
      if (!p.variants.length) return 'أضف نوعاً واحداً على الأقل';
      const bad = p.variants.findIndex((v) => !v.attributes.length || v.price <= 0);
      if (bad >= 0) return `النوع رقم ${bad + 1}: املأ خاصية واحدة على الأقل وسعراً أكبر من صفر`;
    }
    const tierSets = [p.priceTiers, ...p.variants.map((v) => v.priceTiers)];
    for (const tiers of tierSets) {
      const sorted = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);
      for (let i = 0; i < sorted.length; i++) {
        const t = sorted[i];
        if (t.maxQuantity !== undefined && t.maxQuantity < t.minQuantity) {
          return `شريحة الكمية ${t.minQuantity}: الحد الأقصى أقل من الحد الأدنى`;
        }
        const next = sorted[i + 1];
        if (next && (t.maxQuantity === undefined || t.maxQuantity >= next.minQuantity)) {
          return 'شرائح الكمية متداخلة — راجع الحد الأدنى والأقصى';
        }
      }
    }
    const allDiscounts = [
      ...p.discounts,
      ...p.priceTiers.flatMap((t) => t.discounts),
      ...p.variants.flatMap((v) => [...v.discounts, ...v.priceTiers.flatMap((t) => t.discounts)]),
    ];
    if (allDiscounts.some((d) => d.isPercentage && d.value > 100)) return 'نسبة الخصم لا يمكن أن تتجاوز 100%';
    return null;
  }

  private orderedFiles(): File[] {
    const ordered = this.gallery.length
      ? [this.gallery[this.mainImage], ...this.gallery.filter((_, i) => i !== this.mainImage)]
      : [];
    return ordered.map((g) => g.file).filter((f): f is File => !!f);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('يرجى تعبئة جميع الحقول المطلوبة بشكل صحيح');
      return;
    }
    const payload = this.payloadFromForm();
    const problem = this.validatePayload(payload);
    if (problem) {
      this.toast.error(problem);
      return;
    }
    const files = this.orderedFiles();
    if (this.mode === 'add' && !files.length) {
      this.toast.error('أضف صورة واحدة على الأقل للمنتج');
      return;
    }

    this.saving = true;
    const req =
      this.mode === 'edit' && this.selected
        ? this.productsService.update(this.selected.id, payload, files)
        : this.productsService.create(payload, files);

    req.subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.toast.success(this.mode === 'edit' ? 'تم تحديث المنتج بنجاح' : 'تم إضافة المنتج بنجاح');
        this.load();
      },
      error: (err) => {
        this.saving = false;
        if (err?.status === 401) this.toast.error('سجّل الدخول بحساب أدمن');
        else this.toast.error(this.apiError(err) || 'فشل حفظ المنتج من الـ API');
      },
    });
  }

  // ---------- starter products ----------

  openStarter(): void {
    this.starterDone = 0;
    this.showStarter = true;
  }

  starterCategory(group: StarterProductGroup): Category | undefined {
    const parent = this.categories.find((c) => !c.parentId && fold(c.name) === fold(group.parent));
    const names = [fold(group.category), fold(group.categoryEn)];
    return this.categories.find(
      (c) =>
        (!parent || c.parentId === parent.id) &&
        (names.includes(fold(c.name)) || names.includes(fold(c.nameEn || '')))
    );
  }

  starterExists(item: StarterProduct): boolean {
    const names = [fold(item.name), fold(item.nameEn)];
    return this.products.some(
      (p) => (!!p.sku && p.sku === item.sku) || names.includes(fold(p.name)) || names.includes(fold(p.nameEn || ''))
    );
  }

  starterMissing(group: StarterProductGroup): StarterProduct[] {
    return this.starterCategory(group) ? group.products.filter((p) => !this.starterExists(p)) : [];
  }

  get starterPending(): number {
    return this.starterGroups.reduce((sum, g) => sum + this.starterMissing(g).length, 0);
  }

  get starterNoCategory(): number {
    return this.starterGroups.filter((g) => !this.starterCategory(g)).length;
  }

  async importStarter(): Promise<void> {
    const jobs = this.starterGroups.flatMap((g) => {
      const category = this.starterCategory(g);
      return category ? this.starterMissing(g).map((item) => ({ item, categoryId: Number(category.id) })) : [];
    });
    this.starterTotal = jobs.length;
    if (!jobs.length) {
      this.toast.info('كل المنتجات الجاهزة موجودة بالفعل');
      return;
    }
    this.starterBusy = true;
    this.starterDone = 0;
    let failed = 0;
    let lastError = '';

    for (const { item, categoryId } of jobs) {
      try {
        const rich = !!STARTER_DETAILS[item.sku];
        const paths = rich ? [item.image, ...this.starterGallery(item)] : [item.image];
        const files = (await Promise.all(paths.map((p) => this.assetFile(p)))).filter((f): f is File => !!f);
        await firstValueFrom(this.productsService.create(this.starterPayload(item, categoryId, rich), files));
        this.starterDone++;
      } catch (err) {
        failed++;
        lastError = this.apiError(err as { error?: unknown }) || lastError;
      }
    }

    this.starterBusy = false;
    this.showStarter = false;
    this.load();
    if (failed) this.toast.error(`اتضاف ${this.starterDone} منتج، وفشل ${failed}${lastError ? ' — ' + lastError : ''}`);
    else this.toast.success(`تمت إضافة ${this.starterDone} منتج بالصور والمواصفات`);
  }

  get starterEnrichable(): number {
    return this.starterGroups.reduce((sum, g) => sum + g.products.filter((p) => this.starterMatch(p)).length, 0);
  }

  private starterMatch(item: StarterProduct): Product | undefined {
    return this.products.find((p) => !!p.sku && p.sku === item.sku);
  }

  private starterGallery(item: StarterProduct): string[] {
    return [2, 3].map((n) => item.image.replace(/\.jpg$/, `-${n}.jpg`));
  }

  async enrichStarter(): Promise<void> {
    const jobs = this.starterGroups
      .flatMap((g) => g.products)
      .map((item) => ({ item, product: this.starterMatch(item) }))
      .filter((j): j is { item: StarterProduct; product: Product } => !!j.product && !!STARTER_DETAILS[j.item.sku])
      .filter(({ product }) => (product.images?.length || 0) < 3 || !product.priceTiers?.length);
    if (!jobs.length) {
      this.toast.info('كل المنتجات الجاهزة متحدثة بالتفاصيل والصور');
      return;
    }

    this.starterTotal = jobs.length;
    this.starterDone = 0;
    this.starterBusy = true;
    this.starterMode = 'enrich';
    let failed = 0;
    let lastError = '';

    for (const { item, product } of jobs) {
      try {
        const payload = this.starterPayload(item, Number(product.categoryId), true);
        // الباك إند بيستبدل كل صور المنتج بالمرفوعة في التعديل
        const files =
          (product.images?.length || 0) >= 3
            ? []
            : (await Promise.all([item.image, ...this.starterGallery(item)].map((p) => this.assetFile(p)))).filter(
                (f): f is File => !!f
              );
        await firstValueFrom(this.productsService.update(product.id, payload, files));
        this.starterDone++;
      } catch (err) {
        failed++;
        lastError = this.apiError(err as { error?: unknown }) || lastError;
      }
    }

    this.starterBusy = false;
    this.starterMode = 'import';
    this.showStarter = false;
    this.load();
    if (failed) this.toast.error(`اتحدث ${this.starterDone} منتج، وفشل ${failed}${lastError ? ' — ' + lastError : ''}`);
    else this.toast.success(`اتحدثت تفاصيل ${this.starterDone} منتج وبقى لكل منتج 3 صور`);
  }

  private starterPayload(item: StarterProduct, categoryId: number, rich = false): ProductFormPayload {
    const details = rich ? STARTER_DETAILS[item.sku] : undefined;
    const specs = details ? [...item.specs, ...details.specs] : item.specs;
    const tiers = details?.tiers || [];
    return {
      nameAr: item.name,
      nameEn: item.nameEn,
      descriptionAr: details?.description || item.description,
      descriptionEn: details?.descriptionEn || item.descriptionEn,
      sku: item.sku,
      categoryId,
      hasVariants: false,
      price: item.price,
      stockQuantity: item.stock,
      isActive: true,
      isNew: !!item.isNew,
      specifications: specs.map((s, i) => ({
        nameAr: s.label,
        nameEn: s.labelEn,
        valueAr: s.value,
        valueEn: s.valueEn,
        displayOrder: i + 1,
      })),
      variants: [],
      priceTiers: tiers.map(([min, pct], i) => ({
        minQuantity: min,
        maxQuantity: tiers[i + 1] ? tiers[i + 1][0] - 1 : undefined,
        unitPrice: Math.round(item.price * (100 - pct)) / 100,
        discounts: [],
      })),
      discounts: [],
    };
  }

  private async assetFile(path: string): Promise<File | null> {
    try {
      const blob = await (await fetch(path)).blob();
      return new File([blob], path.split('/').pop() || 'product.jpg', { type: blob.type || 'image/jpeg' });
    } catch {
      return null;
    }
  }

  private apiError(err: { error?: unknown }): string {
    const body = err?.error as Record<string, unknown> | undefined;
    if (!body || typeof body !== 'object') return '';
    const errors = body['errors'];
    if (Array.isArray(errors) && errors.length) return errors.map(String).join(' · ');
    if (errors && typeof errors === 'object') {
      return Object.values(errors as Record<string, unknown>)
        .flat()
        .map(String)
        .join(' · ');
    }
    return typeof body['message'] === 'string' ? (body['message'] as string) : '';
  }

  get visibleProducts(): Product[] {
    const q = this.searchTerm.trim().toLowerCase();
    return this.products.filter((p) => {
      if (!this.matchesFilter(p, this.catalogFilter)) return false;
      if (!this.inCategory(p)) return false;
      if (!q) return true;
      return [p.name, p.nameEn, p.sku, p.category, p.brand].some((v) => String(v || '').toLowerCase().includes(q));
    });
  }

  filterCount(key: ProductsComponent['catalogFilter']): number {
    return this.products.filter((p) => this.inCategory(p) && this.matchesFilter(p, key)).length;
  }

  get categoryFilterName(): string {
    return this.categories.find((c) => String(c.id) === this.categoryFilter)?.name || '';
  }

  setCategoryFilter(value: string | number | null): void {
    this.categoryFilter = value == null ? '' : String(value);
    this.categoryScope = this.categoryFilter ? this.descendantIds(this.categoryFilter) : null;
    if (!this.categoryFilter) this.categoryFilterCtrl.setValue('', { emitEvent: false });
    this.resetPaging();
  }

  resetPaging(): void {
    this.mobileLimit = 12;
    this.page = 1;
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.visibleProducts.length / this.pageSize));
  }

  get currentPage(): number {
    return Math.min(this.page, this.pageCount);
  }

  get pageRange(): { from: number; to: number } {
    const total = this.visibleProducts.length;
    const from = total ? (this.currentPage - 1) * this.pageSize + 1 : 0;
    return { from, to: Math.min(this.currentPage * this.pageSize, total) };
  }

  get pageNumbers(): (number | null)[] {
    const count = this.pageCount;
    const cur = this.currentPage;
    if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
    const out: (number | null)[] = [1];
    const start = Math.max(2, cur - 1);
    const end = Math.min(count - 1, cur + 1);
    if (start > 2) out.push(null);
    for (let n = start; n <= end; n++) out.push(n);
    if (end < count - 1) out.push(null);
    out.push(count);
    return out;
  }

  goToPage(n: number): void {
    const next = Math.min(Math.max(1, n), this.pageCount);
    if (next === this.currentPage) return;
    this.page = next;
    document.querySelector('.pc-toolbar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  setPageSize(size: number): void {
    this.pageSize = size;
    this.page = 1;
  }

  private inCategory(p: Product): boolean {
    if (!this.categoryScope) return true;
    if (p.categoryId != null && p.categoryId !== '') return this.categoryScope.has(String(p.categoryId));
    return p.category === this.categoryFilterName;
  }

  private descendantIds(rootId: string): Set<string> {
    const out = new Set<string>([rootId]);
    let added = true;
    while (added) {
      added = false;
      for (const c of this.categories) {
        if (c.parentId && out.has(String(c.parentId)) && !out.has(String(c.id))) {
          out.add(String(c.id));
          added = true;
        }
      }
    }
    return out;
  }

  private refreshCategoryFilter(): void {
    if (this.categoryFilter) this.categoryScope = this.descendantIds(this.categoryFilter);
    const countFor = (id: string) => {
      const scope = this.descendantIds(id);
      return this.products.filter((p) =>
        p.categoryId != null && p.categoryId !== '' ? scope.has(String(p.categoryId)) : false
      ).length;
    };
    this.categoryFilterOptions = [
      { value: '', label: 'كل الفئات', hint: `${this.products.length}` },
      ...this.categoryOptions.map((o) => ({ ...o, disabled: false, hint: `${countFor(String(o.value))}` })),
    ];
  }

  private matchesFilter(p: Product, key: ProductsComponent['catalogFilter']): boolean {
    switch (key) {
      case 'discount':
        return !!p.discountLabel;
      case 'new':
        return !!p.isNew || !!p.variants?.some((v) => v.isNew);
      case 'variants':
        return !!p.variants?.length;
      case 'low':
        return p.status === 'low' || p.status === 'out';
      default:
        return true;
    }
  }

  act(action: 'view' | 'edit' | 'delete', product: Product): void {
    this.onRowAction({ action, row: product as unknown as Record<string, unknown> });
  }

  get effectiveView(): 'cards' | 'table' {
    return this.isMobile ? 'cards' : this.catalogView;
  }

  get pagedProducts(): Product[] {
    const list = this.visibleProducts;
    if (this.isMobile) return list.slice(0, this.mobileLimit);
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  openSheet(product: Product): void {
    this.sheetProduct = product;
  }

  sheetAct(action: 'view' | 'edit' | 'delete'): void {
    const product = this.sheetProduct;
    this.sheetProduct = null;
    if (product) this.act(action, product);
  }

  trackById(_: number, p: Product): string {
    return p.id;
  }

  money(value?: number): string {
    return `${(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} ر.س`;
  }

  tierCount(p: Product): number {
    return (p.priceTiers?.length || 0) + (p.variants || []).reduce((s, v) => s + (v.priceTiers?.length || 0), 0);
  }

  variantTitle(v: ProductVariant): string {
    const parts = Object.values(v.attrs || {}).filter(Boolean);
    return parts.join(' / ') || v.sku || 'نوع';
  }

  specsPreview(p: Product): string {
    return (p.specs || [])
      .slice(0, 2)
      .map((s) => `${s.label}: ${s.value}`)
      .join(' · ');
  }

  sourceShort(p: Product): string {
    return p.discountSource === 'variant' ? 'على نوع' : p.discountSource === 'priceTier' ? 'بالجملة' : '';
  }

  onRowAction(event: { action: string; row: Record<string, unknown> }): void {
    const product = event.row as unknown as Product;
    if (event.action === 'delete') {
      this.selectedId = product.id;
      this.selected = product;
      this.showConfirm = true;
    } else if (event.action === 'edit') {
      this.productsService.getById(product.id).subscribe({
        next: (full) => this.openEdit(full ? { ...product, ...full } : product),
        error: () => this.openEdit(product),
      });
    } else {
      this.openView(product);
      this.productsService.getById(product.id).subscribe({
        next: (full) => {
          if (full && this.showView && this.selected?.id === product.id) this.openView({ ...product, ...full });
        },
        error: () => undefined,
      });
    }
  }

  switchViewToEdit(): void {
    if (!this.selected) return;
    this.showView = false;
    this.openEdit(this.selected);
  }

  confirmDelete(): void {
    if (!this.selectedId) return;
    this.productsService.delete(this.selectedId).subscribe(() => {
      this.products = this.products.filter((p) => p.id !== this.selectedId);
      this.showConfirm = false;
      this.toast.success('تم حذف المنتج');
    });
  }

  err(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!(c && c.touched && c.invalid);
  }

  private categoryTreeOptions(list: Category[]): SelectOption[] {
    const ids = new Set(list.map((c) => c.id));
    const byOrder = (a: Category, b: Category) =>
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name, 'ar');
    const childrenOf = (parentId: string | null) =>
      list
        .filter((c) => (parentId ? c.parentId === parentId : !c.parentId || !ids.has(c.parentId)))
        .sort(byOrder);

    const out: SelectOption[] = [];
    const walk = (parentId: string | null, depth: number, path: string[]) => {
      for (const c of childrenOf(parentId)) {
        const fullPath = [...path, c.name];
        const subCount = list.filter((x) => x.parentId === c.id).length;
        out.push({
          value: c.id,
          label: c.name,
          depth,
          display: fullPath.join(' › '),
          disabled: subCount > 0,
          hint: c.status === 'inactive' ? 'مخفية' : subCount ? `${subCount} فرعية` : undefined,
        });
        if (depth < 5) walk(c.id, depth + 1, fullPath);
      }
    };
    walk(null, 0, []);
    return out;
  }
}
