import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { SelectComponent, SelectOption } from '../../shared/components/select/select.component';
import { ImageDropzoneComponent } from '../../shared/components/image-dropzone/image-dropzone.component';
import { AdvertisementsService } from '../../core/services/data.services';
import { ProductsService } from '../../core/services/products.service';
import { AnimationService } from '../../core/services/animation.service';
import { ToastService } from '../../core/services/toast.service';
import { AdProduct, Advertisement, Product } from '../../core/models';

type AdFilter = 'all' | 'running' | 'stopped';

@Component({
  selector: 'app-advertisements',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent, ConfirmDialogComponent, SelectComponent, ImageDropzoneComponent],
  templateUrl: './advertisements.component.html',
  styleUrls: ['./advertisements.component.scss'],
})
export class AdvertisementsComponent implements OnInit, AfterViewInit {
  loading = true;
  saving = false;
  ads: Advertisement[] = [];
  products: Product[] = [];
  productOptions: SelectOption[] = [];
  filter: AdFilter = 'all';
  showForm = false;
  showConfirm = false;
  mode: 'add' | 'edit' = 'add';
  selected: Advertisement | null = null;

  filters: { key: AdFilter; label: string }[] = [
    { key: 'all', label: 'الكل' },
    { key: 'running', label: 'ظاهر في التطبيق' },
    { key: 'stopped', label: 'متوقف / منتهي' },
  ];

  pickerValue = '';

  showProducts = false;
  productsAd: Advertisement | null = null;
  productsDraft: string[] = [];
  productsPicker = '';
  savingProducts = false;

  form = this.fb.group({
    productIds: new FormControl<string[]>([], {
      nonNullable: true,
      validators: (c: AbstractControl) => (c.value?.length ? null : { required: true }),
    }),
    title: ['', [Validators.required, Validators.minLength(2)]],
    titleEn: [''],
    description: [''],
    descriptionEn: [''],
    image: ['', Validators.required],
    startDate: [this.today(), Validators.required],
    endDate: [''],
    sortOrder: [1],
    active: [true],
  });

  constructor(
    private service: AdvertisementsService,
    private productsService: ProductsService,
    private fb: FormBuilder,
    private animation: AnimationService,
    private host: ElementRef,
    private toast: ToastService,
    private location: Location,
    private router: Router
  ) {}

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
    this.router.navigateByUrl('/app-content');
  }

  get formTitle(): string {
    return this.mode === 'edit' ? 'تعديل الإعلان' : 'إعلان جديد على منتج';
  }

  get visibleAds(): Advertisement[] {
    const list = [...this.ads].sort((a, b) => a.sortOrder - b.sortOrder);
    if (this.filter === 'running') return list.filter((a) => this.isLive(a));
    if (this.filter === 'stopped') return list.filter((a) => !this.isLive(a));
    return list;
  }

  get liveCount(): number {
    return this.ads.filter((a) => this.isLive(a)).length;
  }

  get linkedCount(): number {
    return this.ads.filter((a) => a.productIds.length).length;
  }

  get selectedProducts(): AdProduct[] {
    const known = this.selected?.products || [];
    return (this.form.value.productIds || []).map((id) => {
      const local = this.productById(id);
      if (local) return this.toAdProduct(local);
      return known.find((p) => p.id === String(id)) || { id: String(id), name: `منتج #${id}`, active: true };
    });
  }

  get pickerOptions(): SelectOption[] {
    const chosen = new Set((this.form.value.productIds || []).map(String));
    return this.productOptions.filter((o) => !chosen.has(String(o.value)));
  }

  ngOnInit(): void {
    this.load();
    this.productsService.getAll().subscribe((products) => {
      this.products = products;
      this.productOptions = products.map((p) => ({
        value: p.id,
        label: p.name,
        hint: p.price ? `${p.price} ج.م` : undefined,
      }));
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.animation.fadeUpStagger(this.host.nativeElement.querySelectorAll('.anim-item')), 80);
  }

  load(): void {
    this.loading = true;
    this.service.getAll().subscribe((ads) => {
      this.ads = ads;
      this.loading = false;
      setTimeout(() => this.animation.fadeUpStagger(this.host.nativeElement.querySelectorAll('.ad-card')), 30);
    });
  }

  isLive(ad: Advertisement): boolean {
    if (!ad.active) return false;
    const today = this.today();
    if (ad.startDate && ad.startDate > today) return false;
    if (ad.endDate && ad.endDate < today) return false;
    return true;
  }

  statusOf(ad: Advertisement): { label: string; cls: string } {
    const today = this.today();
    if (!ad.active) return { label: 'متوقف', cls: 'bg-gray-100 text-gray-600' };
    if (ad.startDate && ad.startDate > today) return { label: 'مجدول', cls: 'bg-sky-50 text-sky-700' };
    if (ad.endDate && ad.endDate < today) return { label: 'منتهي', cls: 'bg-red-50 text-red-600' };
    return { label: 'ظاهر الآن', cls: 'bg-emerald-50 text-emerald-700' };
  }

  productById(id: string | null | undefined): Product | undefined {
    return id ? this.products.find((p) => String(p.id) === String(id)) : undefined;
  }

  linkedProducts(ad: Advertisement): AdProduct[] {
    if (ad.products.length) return ad.products;
    return ad.productIds.map((id) => {
      const local = this.productById(id);
      return local ? this.toAdProduct(local) : { id, name: `منتج #${id}`, active: true };
    });
  }

  readonly nameOf = (p: AdProduct): string => p.name;

  private toAdProduct(p: Product): AdProduct {
    return { id: String(p.id), name: p.name, nameEn: p.nameEn, image: p.image || p.images?.[0], price: p.price, active: p.status !== 'inactive' };
  }

  openAdd(): void {
    this.mode = 'add';
    this.selected = null;
    this.pickerValue = '';
    this.form.reset({
      productIds: [],
      title: '',
      titleEn: '',
      description: '',
      descriptionEn: '',
      image: '',
      startDate: this.today(),
      endDate: '',
      sortOrder: this.ads.length ? Math.max(...this.ads.map((a) => a.sortOrder)) + 1 : 1,
      active: true,
    });
    this.showForm = true;
  }

  openEdit(ad: Advertisement): void {
    this.mode = 'edit';
    this.selected = ad;
    this.pickerValue = '';
    this.form.reset({
      productIds: [...ad.productIds],
      title: ad.title,
      titleEn: ad.titleEn || '',
      description: ad.description,
      descriptionEn: ad.descriptionEn || '',
      image: ad.image || '',
      startDate: ad.startDate || this.today(),
      endDate: ad.endDate || '',
      sortOrder: ad.sortOrder,
      active: ad.active,
    });
    this.showForm = true;
  }

  /** أول منتج بيملى الخانات الفاضية من بياناته، من غير ما يمسح اللي اتكتب */
  addProduct(id: string | number | null): void {
    const p = this.productById(id == null ? null : String(id));
    setTimeout(() => (this.pickerValue = ''));
    if (!p) return;
    const ids = this.form.value.productIds || [];
    const control = this.form.controls.productIds;
    control.setValue([...ids, String(p.id)]);
    control.markAsTouched();
    if (ids.length) return;
    const v = this.form.value;
    this.form.patchValue({
      title: v.title || p.name,
      titleEn: v.titleEn || p.nameEn || '',
      description: v.description || p.description || '',
      descriptionEn: v.descriptionEn || p.descriptionEn || '',
      image: v.image || p.image || p.images?.[0] || '',
    });
  }

  openProducts(ad: Advertisement): void {
    this.productsAd = ad;
    this.productsDraft = [...ad.productIds];
    this.productsPicker = '';
    this.showProducts = true;
  }

  get draftProducts(): AdProduct[] {
    const known = this.productsAd?.products || [];
    return this.productsDraft.map((id) => {
      const local = this.productById(id);
      if (local) return this.toAdProduct(local);
      return known.find((p) => p.id === id) || { id, name: `منتج #${id}`, active: true };
    });
  }

  get draftOptions(): SelectOption[] {
    const chosen = new Set(this.productsDraft);
    return this.productOptions.filter((o) => !chosen.has(String(o.value)));
  }

  addDraftProduct(id: string | number | null): void {
    setTimeout(() => (this.productsPicker = ''));
    if (id == null || id === '') return;
    if (!this.productsDraft.includes(String(id))) this.productsDraft = [...this.productsDraft, String(id)];
  }

  removeDraftProduct(id: string): void {
    this.productsDraft = this.productsDraft.filter((x) => x !== id);
  }

  saveProducts(): void {
    const ad = this.productsAd;
    if (!ad) return;
    this.savingProducts = true;
    this.service.update(ad.id, { ...ad, productIds: this.productsDraft }).subscribe({
      next: () => {
        this.savingProducts = false;
        this.showProducts = false;
        this.toast.success('تم تحديث منتجات الإعلان');
        this.load();
      },
      error: (e) => {
        this.savingProducts = false;
        const first = e?.error?.errors?.[0] ?? e?.error?.message;
        this.toast.error(typeof first === 'string' && first ? first : 'فشل حفظ منتجات الإعلان');
      },
    });
  }

  removeProduct(id: string): void {
    const control = this.form.controls.productIds;
    control.setValue((control.value || []).filter((x) => String(x) !== String(id)));
    control.markAsTouched();
  }

  openDelete(ad: Advertisement): void {
    this.selected = ad;
    this.showConfirm = true;
  }

  err(control: string): boolean {
    const c = this.form.get(control);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('اختار المنتج وكمّل العنوان والصورة');
      return;
    }
    const v = this.form.getRawValue();
    if (v.endDate && v.startDate && v.endDate < v.startDate) {
      this.toast.error('تاريخ النهاية لازم يكون بعد البداية');
      return;
    }
    const payload: Partial<Advertisement> = {
      productIds: v.productIds || [],
      title: v.title!.trim(),
      titleEn: v.titleEn?.trim() || undefined,
      description: v.description?.trim() || '',
      descriptionEn: v.descriptionEn?.trim() || undefined,
      image: v.image || undefined,
      startDate: v.startDate!,
      endDate: v.endDate || null,
      sortOrder: Number(v.sortOrder) || 0,
      active: !!v.active,
    };

    this.saving = true;
    const req =
      this.mode === 'edit' && this.selected ? this.service.update(this.selected.id, payload) : this.service.create(payload);
    req.subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.toast.success(this.mode === 'edit' ? 'تم تحديث الإعلان' : 'تم نشر الإعلان');
        this.load();
      },
      error: (e) => {
        this.saving = false;
        const first = e?.error?.errors?.[0] ?? e?.error?.message;
        const apiMsg = typeof first === 'string' ? first : '';
        this.toast.error(e?.status === 401 ? 'سجّل دخول تاني — الجلسة انتهت' : apiMsg || 'فشل حفظ الإعلان');
      },
    });
  }

  toggleActive(ad: Advertisement): void {
    const next = !ad.active;
    this.service.update(ad.id, { ...ad, active: next }).subscribe({
      next: () => {
        this.ads = this.ads.map((a) => (a.id === ad.id ? { ...a, active: next } : a));
        this.toast.success(next ? 'الإعلان رجع يظهر في التطبيق' : 'الإعلان اتوقف');
      },
      error: () => this.toast.error('فشل تغيير حالة الإعلان'),
    });
  }

  confirmDelete(): void {
    if (!this.selected) return;
    const id = this.selected.id;
    this.service.delete(id).subscribe({
      next: () => {
        this.ads = this.ads.filter((a) => a.id !== id);
        this.showConfirm = false;
        this.selected = null;
        this.toast.success('تم حذف الإعلان');
      },
      error: () => this.toast.error('فشل حذف الإعلان'),
    });
  }

  private today(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
