import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { SelectComponent, SelectOption } from '../../shared/components/select/select.component';
import { BrandsService } from '../../core/services/data.services';
import { AnimationService } from '../../core/services/animation.service';
import { ToastService } from '../../core/services/toast.service';
import { Brand } from '../../core/models';

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    StatusBadgeComponent,
    ModalComponent,
    ConfirmDialogComponent,
    SelectComponent,
  ],
  templateUrl: './brands.component.html',
  styleUrls: ['./brands.component.scss'],
})
export class BrandsComponent implements OnInit, AfterViewInit {
  loading = true;
  brands: Brand[] = [];
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  get filtered(): Brand[] {
    const q = this.searchTerm.trim().toLowerCase();
    return this.brands.filter((b) => {
      if (this.statusFilter === 'active' && b.status !== 'active') return false;
      if (this.statusFilter === 'inactive' && b.status === 'active') return false;
      if (!q) return true;
      return [b.name, b.nameEn, b.country, b.category].some((v) => (v || '').toLowerCase().includes(q));
    });
  }

  get totalProducts(): number {
    return this.brands.reduce((sum, b) => sum + (b.products || 0), 0);
  }

  statusCount(key: 'all' | 'active' | 'inactive'): number {
    if (key === 'all') return this.brands.length;
    return this.brands.filter((b) => (key === 'active' ? b.status === 'active' : b.status !== 'active')).length;
  }

  initial(b: Brand): string {
    return (b.nameEn || b.name || '?').trim().charAt(0).toUpperCase();
  }
  showForm = false;
  showConfirm = false;
  mode: 'add' | 'edit' = 'add';
  selected: Brand | null = null;

  countryOptions: SelectOption[] = [
    'السعودية',
    'الإمارات',
    'مصر',
    'تركيا',
    'الصين',
    'ألمانيا',
    'إيطاليا',
    'النرويج',
    'ماليزيا',
  ].map((c) => ({ value: c, label: c }));

  categoryOptions: SelectOption[] = [
    'إسمنت ومواد ربط',
    'حديد وصلب',
    'دهانات وتشطيب',
    'طوب وبلوك',
    'سباكة وصرف',
    'سيراميك ورخام',
    'أخشاب ونجارة',
    'عزل ومواد خاصة',
    'ركام ورمال',
    'كهرباء وإضاءة',
    'زجاج وألمنيوم',
  ].map((c) => ({ value: c, label: c }));

  statusOptions: SelectOption[] = [
    { value: 'active', label: 'نشط' },
    { value: 'inactive', label: 'غير نشط' },
    { value: 'pending', label: 'قيد المراجعة' },
  ];

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    nameEn: ['', [Validators.required, Validators.minLength(2)]],
    country: ['السعودية', Validators.required],
    category: ['', Validators.required],
    description: [''],
    descriptionEn: [''],
    products: [0, [Validators.required, Validators.min(0)]],
    status: ['active' as Brand['status'], Validators.required],
    showInApp: [true],
  });

  constructor(
    private service: BrandsService,
    private fb: FormBuilder,
    private animation: AnimationService,
    private host: ElementRef,
    private toast: ToastService
  ) {}

  get formTitle(): string {
    return this.mode === 'edit' ? 'تعديل البراند' : 'إضافة براند';
  }

  ngOnInit(): void {
    this.service.getAll().subscribe((d) => {
      this.brands = d;
      this.loading = false;
      setTimeout(() => this.animation.fadeUpStagger(this.host.nativeElement.querySelectorAll('.anim-item')), 50);
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.animation.fadeUpStagger(this.host.nativeElement.querySelectorAll('.anim-item')), 80);
  }

  openAdd(): void {
    this.mode = 'add';
    this.selected = null;
    this.form.reset({
      name: '',
      nameEn: '',
      country: 'السعودية',
      category: '',
      description: '',
      descriptionEn: '',
      products: 0,
      status: 'active',
      showInApp: true,
    });
    this.showForm = true;
  }

  private withOption(list: SelectOption[], value: string): SelectOption[] {
    if (!this.hasValue(value) || list.some((o) => o.value === value)) return list;
    return [{ value, label: value }, ...list];
  }

  openEdit(brand: Brand): void {
    this.mode = 'edit';
    this.selected = brand;
    this.countryOptions = this.withOption(this.countryOptions, brand.country);
    this.categoryOptions = this.withOption(this.categoryOptions, brand.category);
    this.form.reset({
      name: brand.name,
      nameEn: brand.nameEn,
      country: this.hasValue(brand.country) ? brand.country : '',
      category: this.hasValue(brand.category) ? brand.category : '',
      description: brand.description,
      descriptionEn: brand.descriptionEn || '',
      products: brand.products,
      status: brand.status,
      showInApp: brand.showInApp !== false,
    });
    this.showForm = true;
  }

  hasValue(value: string | undefined): boolean {
    return !!value && value.trim() !== '—';
  }

  openDelete(brand: Brand): void {
    this.selected = brand;
    this.showConfirm = true;
  }

  err(control: string): boolean {
    const c = this.form.get(control);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('أكمل بيانات البراند');
      return;
    }
    const raw = this.form.getRawValue();
    const payload: Partial<Brand> = {
      name: raw.name!,
      nameEn: raw.nameEn!,
      country: raw.country!,
      category: raw.category!,
      description: raw.description!,
      descriptionEn: raw.descriptionEn || '',
      products: Number(raw.products) || 0,
      status: (raw.status as Brand['status']) || 'active',
      showInApp: !!raw.showInApp,
    };

    if (this.mode === 'edit' && this.selected) {
      this.service.update(this.selected.id, payload).subscribe({
        next: (updated) => {
          this.brands = this.brands.map((b) => (b.id === this.selected!.id ? { ...b, ...updated } : b));
          this.toast.success('تم تحديث البراند');
          this.showForm = false;
        },
        error: () => this.toast.error('فشل تحديث البراند من الـ API'),
      });
    } else {
      this.service.create(payload).subscribe({
        next: (created) => {
          this.brands = [created, ...this.brands];
          this.toast.success('تمت إضافة البراند');
          this.showForm = false;
        },
        error: () => this.toast.error('فشلت إضافة البراند من الـ API'),
      });
    }
  }

  confirmDelete(): void {
    if (!this.selected) return;
    const id = this.selected.id;
    this.service.delete(id).subscribe({
      next: () => {
        this.brands = this.brands.filter((b) => b.id !== id);
        this.toast.success('تم حذف البراند');
        this.showConfirm = false;
        this.selected = null;
      },
      error: () => this.toast.error('فشل حذف البراند من الـ API'),
    });
  }
}
