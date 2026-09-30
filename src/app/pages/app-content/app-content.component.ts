import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { SelectComponent, SelectOption } from '../../shared/components/select/select.component';
import { AdvertisementsService, CategoriesService } from '../../core/services/data.services';
import { ProductsService } from '../../core/services/products.service';
import { AnimationService } from '../../core/services/animation.service';
import { ToastService } from '../../core/services/toast.service';
import { Advertisement, Category, Product, StatCardData } from '../../core/models';

@Component({
  selector: 'app-app-content',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, StatCardComponent, ModalComponent, SelectComponent],
  templateUrl: './app-content.component.html',
  styleUrls: ['./app-content.component.scss'],
})
export class AppContentComponent implements OnInit, AfterViewInit {
  loading = true;
  categories: Category[] = [];
  products: Product[] = [];
  newArrivals: Product[] = [];
  ads: Advertisement[] = [];
  showPick = false;
  busyId: string | null = null;
  naAll = false;

  stats: StatCardData[] = [
    { title: 'إعلانات ظاهرة', value: 0, change: 'تظهر أعلى التطبيق', changeType: 'neutral', icon: 'campaign', animate: true },
    { title: 'أقسام في الهوم', value: 0, change: 'ظاهرة للمستخدم', changeType: 'neutral', icon: 'category', animate: true },
    { title: 'وصل حديثاً', value: 0, change: 'منتجات معلّمة كجديد', changeType: 'neutral', icon: 'new_releases', animate: true },
    { title: 'إجمالي الإعلانات', value: 0, change: 'من محتوى التطبيق', changeType: 'neutral', icon: 'ads_click', animate: true },
  ];

  pickForm = this.fb.group({
    productId: ['', Validators.required],
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
    }).subscribe({
      next: ({ products, arrivals, categories, ads }) => {
        this.products = products;
        this.categories = categories.filter((c) => !c.parentId);
        this.ads = ads;
        const byId = new Map<string, Product>();
        [...arrivals, ...products.filter((p) => p.featured)].forEach((p) => byId.set(String(p.id), p));
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
    this.setArrival(product, false);
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
