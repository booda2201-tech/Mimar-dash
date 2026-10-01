import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { switchMap, of, throwError } from 'rxjs';
import { RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { SelectComponent, SelectOption } from '../../shared/components/select/select.component';
import { OffersService } from '../../core/services/data.services';
import { ProductsService } from '../../core/services/products.service';
import { AnimationService } from '../../core/services/animation.service';
import { ToastService } from '../../core/services/toast.service';
import { Offer, StatCardData } from '../../core/models';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    StatusBadgeComponent,
    StatCardComponent,
    ModalComponent,
    ConfirmDialogComponent,
    SelectComponent,
  ],
  templateUrl: './offers.component.html',
  styleUrls: ['./offers.component.scss']
})
export class OffersComponent implements OnInit, AfterViewInit {
  loading = true;
  saving = false;
  offers: Offer[] = [];
  visibleOffers: Offer[] = [];
  searchTerm = '';
  sourceFilter: 'all' | NonNullable<Offer['discountSource']> = 'all';
  readonly sourceFilters: { key: OffersComponent['sourceFilter']; label: string }[] = [
    { key: 'all', label: 'الكل' },
    { key: 'product', label: 'على المنتج' },
    { key: 'variant', label: 'على نوع' },
    { key: 'priceTier', label: 'خصم كمية' },
  ];
  showForm = false;
  showView = false;
  showConfirm = false;
  mode: 'add' | 'edit' = 'add';
  selected: Offer | null = null;

  stats: StatCardData[] = [
    { title: 'عروض نشطة', value: 0, change: 'ظاهرة في التطبيق', changeType: 'neutral', icon: 'sell', animate: true },
    { title: 'متوسط الخصم', value: 0, change: 'على العروض النشطة', changeType: 'neutral', icon: 'percent', suffix: '%', animate: true },
    { title: 'مخزون العروض', value: 0, change: 'وحدة متاحة', changeType: 'neutral', icon: 'inventory_2', animate: true },
    { title: 'منتجات مخفضة', value: 0, change: 'إجمالي العروض', changeType: 'neutral', icon: 'local_offer', animate: true },
  ];

  banners: { tag: string; title: string; desc: string }[] = [];

  statusOptions: SelectOption[] = [
    { value: 'active', label: 'نشط' },
    { value: 'inactive', label: 'غير نشط' },
  ];

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    titleEn: [''],
    code: [{ value: '', disabled: true }],
    discount: [10, [Validators.required, Validators.min(0), Validators.max(100)]],
    status: ['active' as Offer['status'], Validators.required],
  });

  constructor(
    private service: OffersService,
    private products: ProductsService,
    private fb: FormBuilder,
    private animation: AnimationService,
    private host: ElementRef,
    private toast: ToastService
  ) {}

  get formTitle(): string {
    return this.mode === 'edit' ? 'تعديل عرض الخصم' : 'إنشاء عرض';
  }

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.animation.fadeUpStagger(this.host.nativeElement.querySelectorAll('.anim-item')), 80);
  }

  load(): void {
    this.loading = true;
    this.service.getAll().subscribe((d) => {
      this.offers = d.filter((o) => (o.discount || 0) > 0);
      this.refreshRows();
      this.refreshStats();
      this.banners = this.offers.slice(0, 3).map((o) => ({
        tag: this.sourceLabel(o),
        title: o.title,
        desc: `خصم ${this.discountLabel(o)} ${o.discountNote || ''}`.trim(),
      }));
      this.loading = false;
    });
  }

  refreshStats(): void {
    const active = this.offers.filter((o) => o.status === 'active');
    const avg =
      active.length > 0 ? Math.round(active.reduce((s, o) => s + (o.discount || 0), 0) / active.length) : 0;
    const stock = this.offers.reduce((s, o) => s + (o.usage || 0), 0);
    this.stats = [
      { ...this.stats[0], value: active.length },
      { ...this.stats[1], value: avg },
      { ...this.stats[2], value: stock },
      { ...this.stats[3], value: this.offers.length },
    ];
  }

  refreshRows(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.visibleOffers = this.offers.filter((o) => {
      if (this.sourceFilter !== 'all' && (o.discountSource || 'product') !== this.sourceFilter) return false;
      if (!term) return true;
      return [o.title, o.titleEn, o.code, o.category, o.brand].some((v) => (v || '').toLowerCase().includes(term));
    });
  }

  setSource(key: OffersComponent['sourceFilter']): void {
    this.sourceFilter = key;
    this.refreshRows();
  }

  sourceCount(key: OffersComponent['sourceFilter']): number {
    return key === 'all' ? this.offers.length : this.offers.filter((o) => (o.discountSource || 'product') === key).length;
  }

  sourceIcon(o: Offer): string {
    if (o.discountSource === 'variant') return 'style';
    if (o.discountSource === 'priceTier') return 'stacks';
    return 'sell';
  }

  isProductLevel(o: Offer): boolean {
    return !o.discountSource || o.discountSource === 'product';
  }

  tierCount(o: Offer): number {
    return (o.tiers?.length || 0) + (o.variants || []).reduce((sum, v) => sum + v.tiers.length, 0);
  }

  money(value?: number): string {
    return `${(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} ر.س`;
  }

  sourceLabel(o: Offer): string {
    if (o.discountSource === 'variant') return 'خصم على نوع';
    if (o.discountSource === 'priceTier') return 'خصم كمية';
    return 'خصم على المنتج';
  }

  discountLabel(o: Offer): string {
    if (o.discountKind === 'amount' && o.discountValue) return `${o.discountValue.toLocaleString('en-US')} ر.س`;
    return o.discount ? o.discount + '%' : '—';
  }

  openAdd(): void {
    this.toast.info('لإضافة خصم جديد: افتح المنتج من صفحة المنتجات وحدّد نسبة الخصم');
  }

  openEdit(o: Offer): void {
    this.mode = 'edit';
    this.selected = o;
    this.showView = false;
    this.form.reset({
      title: o.title,
      titleEn: o.titleEn || '',
      code: o.code || '',
      discount: o.discount || 0,
      status: o.status === 'inactive' ? 'inactive' : 'active',
    });
    this.showForm = true;
  }

  openView(o: Offer): void {
    this.selected = o;
    this.showView = true;
  }

  save(): void {
    if (this.mode !== 'edit' || !this.selected) {
      this.openAdd();
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('أكمل بيانات العرض');
      return;
    }
    const raw = this.form.getRawValue();
    const id = this.selected.id;
    this.saving = true;

    this.products
      .getById(id)
      .pipe(
        switchMap((product) => {
          if (!product) return throwError(() => new Error('product not found'));
          return this.products.updateFromProduct(id, {
            ...product,
            name: raw.title || product.name,
            nameEn: raw.titleEn || product.nameEn,
            discountPercent: Number(raw.discount) || 0,
            status: raw.status === 'inactive' ? 'inactive' : product.status === 'out' || product.status === 'low' ? product.status : 'active',
            showInApp: raw.status !== 'inactive',
          });
        })
      )
      .subscribe({
        next: () => {
          this.saving = false;
          this.showForm = false;
          this.toast.success('تم تحديث عرض الخصم');
          this.load();
        },
        error: (err) => {
          this.saving = false;
          if (err?.status === 401) {
            this.toast.error('سجّل الدخول بحساب أدمن لتعديل العروض');
          } else {
            this.toast.error('فشل تحديث الخصم من الـ API');
          }
        },
      });
  }

  askRemove(o: Offer): void {
    this.selected = o;
    this.showConfirm = true;
  }

  confirmDelete(): void {
    if (!this.selected) return;
    const id = this.selected.id;
    this.saving = true;
    this.products
      .getById(id)
      .pipe(
        switchMap((product) => {
          if (!product) return of(false);
          return this.products
            .updateFromProduct(id, { ...product, discountPercent: 0 })
            .pipe(switchMap(() => of(true)));
        })
      )
      .subscribe({
        next: (ok) => {
          this.saving = false;
          this.showConfirm = false;
          if (ok) {
            this.toast.success('تم إزالة الخصم من المنتج');
            this.load();
          } else {
            this.toast.error('تعذر إزالة الخصم');
          }
        },
        error: (err) => {
          this.saving = false;
          if (err?.status === 401) this.toast.error('سجّل الدخول بحساب أدمن');
          else this.toast.error('فشل إزالة الخصم من الـ API');
        },
      });
  }

  err(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!(c && c.touched && c.invalid);
  }
}
