import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin, catchError, of } from 'rxjs';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { SelectComponent, SelectOption } from '../../shared/components/select/select.component';
import { ImageDropzoneComponent } from '../../shared/components/image-dropzone/image-dropzone.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import {
  CollectionItem,
  CollectionStage,
  CollectionsService,
  ProductCollection,
} from '../../core/services/collections.service';
import { CategoriesService } from '../../core/services/data.services';
import { ProductsService } from '../../core/services/products.service';
import { AnimationService } from '../../core/services/animation.service';
import { ToastService } from '../../core/services/toast.service';
import { Category, Product, StatCardData } from '../../core/models';

type Draft = Omit<ProductCollection, 'id'>;
type StatusKey = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    ConfirmDialogComponent,
    SelectComponent,
    ImageDropzoneComponent,
    StatCardComponent,
  ],
  templateUrl: './collections.component.html',
  styleUrls: ['./collections.component.scss'],
})
export class CollectionsComponent implements OnInit, AfterViewInit {
  loading = true;
  collections: ProductCollection[] = [];
  searchTerm = '';
  statusFilter: StatusKey = 'all';
  readonly filters: { k: StatusKey; l: string }[] = [
    { k: 'all', l: 'الكل' },
    { k: 'active', l: 'ظاهرة' },
    { k: 'inactive', l: 'مخفية' },
  ];
  stats: StatCardData[] = this.buildStats();

  viewing: ProductCollection | null = null;
  showForm = false;
  showConfirm = false;
  saving = false;
  mode: 'add' | 'edit' = 'add';
  selected: ProductCollection | null = null;
  draft: Draft = this.emptyDraft();
  submitted = false;
  busyToggle = new Set<string>();

  categories: Category[] = [];
  products: Product[] = [];
  categoryOptions: SelectOption[] = [];
  productOptions: SelectOption[] = [];
  pickerReset = 0;

  constructor(
    private service: CollectionsService,
    private categoriesService: CategoriesService,
    private productsService: ProductsService,
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
    this.router.navigateByUrl('/dashboard');
  }

  ngOnInit(): void {
    this.load();
    forkJoin({
      categories: this.categoriesService.getAll().pipe(catchError(() => of([] as Category[]))),
      products: this.productsService.getAll().pipe(catchError(() => of([] as Product[]))),
    }).subscribe(({ categories, products }) => {
      this.categories = categories;
      this.products = products;
      const byId = new Map(categories.map((c) => [String(c.id), c]));
      this.categoryOptions = categories.map((c) => {
        const parent = c.parentId ? byId.get(String(c.parentId)) : undefined;
        return {
          value: String(c.id),
          label: parent ? `${parent.name} › ${c.name}` : c.name,
          display: c.name,
          hint: `${c.products || 0}`,
        };
      });
      this.productOptions = products.map((p) => ({
        value: String(p.id),
        label: p.name,
        hint: this.money(p.price),
      }));
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.animate(), 80);
  }

  load(): void {
    this.loading = true;
    this.service.getAll().subscribe((list) => {
      this.collections = list;
      this.stats = this.buildStats();
      this.loading = false;
      setTimeout(() => this.animate(), 50);
    });
  }

  private animate(): void {
    this.animation.fadeUpStagger(this.host.nativeElement.querySelectorAll('.anim-item'));
  }

  get filtered(): ProductCollection[] {
    const q = this.searchTerm.trim().toLowerCase();
    return this.collections.filter((c) => {
      if (this.statusFilter === 'active' && !c.active) return false;
      if (this.statusFilter === 'inactive' && c.active) return false;
      if (!q) return true;
      return [c.name, c.nameEn, c.badge, ...c.stages.map((s) => s.name)].some((v) => (v || '').toLowerCase().includes(q));
    });
  }

  private buildStats(): StatCardData[] {
    const list = this.collections || [];
    const active = list.filter((c) => c.active).length;
    return [
      { title: 'إجمالي المجموعات', value: list.length, change: 'باقات التطبيق', changeType: 'neutral', icon: 'package_2', animate: true },
      { title: 'ظاهرة في التطبيق', value: active, change: `${list.length - active} مخفية`, changeType: 'up', icon: 'visibility', animate: true },
      { title: 'إجمالي المراحل', value: this.totalStages, change: 'خطوات داخل المجموعات', changeType: 'neutral', icon: 'stairs', animate: true },
      {
        title: 'العناصر المربوطة',
        value: this.totalOf(),
        change: `${this.totalOf('Category')} فئة · ${this.totalOf('Product')} منتج`,
        changeType: 'neutral',
        icon: 'inventory_2',
        animate: true,
      },
    ];
  }

  totalOf(type?: CollectionItem['type']): number {
    return (this.collections || []).reduce((sum, c) => sum + this.itemCount(c, type), 0);
  }

  statusCount(key: StatusKey): number {
    if (key === 'all') return this.collections.length;
    return this.collections.filter((c) => (key === 'active' ? c.active : !c.active)).length;
  }

  get totalStages(): number {
    return this.collections.reduce((sum, c) => sum + c.stages.length, 0);
  }

  itemCount(c: { stages: CollectionStage[] }, type?: CollectionItem['type']): number {
    return c.stages.reduce((sum, s) => sum + s.items.filter((i) => !type || i.type === type).length, 0);
  }

  money(value?: number): string {
    return `${(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} ر.س`;
  }

  trackById(_: number, c: ProductCollection): string {
    return c.id;
  }

  /* ---------- عرض ---------- */

  openView(c: ProductCollection): void {
    this.viewing = c;
  }

  editFromView(): void {
    const c = this.viewing;
    this.viewing = null;
    if (c) this.openEdit(c);
  }

  /* ---------- إضافة / تعديل ---------- */

  private emptyDraft(): Draft {
    return {
      name: '',
      nameEn: '',
      description: '',
      descriptionEn: '',
      image: '',
      badge: '',
      badgeEn: '',
      active: true,
      sortOrder: this.collections?.length ? Math.max(...this.collections.map((c) => c.sortOrder)) + 1 : 1,
      stages: [this.emptyStage(1)],
    };
  }

  private emptyStage(order: number): CollectionStage {
    return { sortOrder: order, name: '', nameEn: '', description: '', descriptionEn: '', items: [] };
  }

  get formTitle(): string {
    return this.mode === 'edit' ? 'تعديل المجموعة' : 'مجموعة جديدة';
  }

  openAdd(): void {
    this.mode = 'add';
    this.selected = null;
    this.draft = this.emptyDraft();
    this.submitted = false;
    this.showForm = true;
  }

  openEdit(c: ProductCollection): void {
    this.mode = 'edit';
    this.selected = c;
    const { id: _id, ...rest } = c;
    this.draft = {
      ...rest,
      stages: c.stages.map((s) => ({ ...s, items: s.items.map((i) => ({ ...i })) })),
    };
    if (!this.draft.stages.length) this.draft.stages = [this.emptyStage(1)];
    this.submitted = false;
    this.showForm = true;
  }

  addStage(): void {
    this.draft.stages = [...this.draft.stages, this.emptyStage(this.draft.stages.length + 1)];
    setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>('.cf-stage-name');
      inputs[inputs.length - 1]?.focus();
    });
  }

  removeStage(index: number): void {
    this.draft.stages = this.draft.stages.filter((_, i) => i !== index);
  }

  moveStage(index: number, dir: -1 | 1): void {
    const target = index + dir;
    if (target < 0 || target >= this.draft.stages.length) return;
    const list = [...this.draft.stages];
    [list[index], list[target]] = [list[target], list[index]];
    this.draft.stages = list;
  }

  addItem(stage: CollectionStage, type: CollectionItem['type'], value: string | number | null): void {
    if (value == null || value === '') return;
    const refId = String(value);
    this.pickerReset++;
    if (stage.items.some((i) => i.type === type && i.refId === refId)) {
      this.toast.error(type === 'Product' ? 'المنتج ده موجود في المرحلة' : 'الفئة دي موجودة في المرحلة');
      return;
    }
    if (type === 'Category') {
      const c = this.categories.find((x) => String(x.id) === refId);
      if (!c) return;
      stage.items = [
        ...stage.items,
        {
          type,
          refId,
          sortOrder: stage.items.length + 1,
          name: c.name,
          nameEn: c.nameEn,
          image: c.image,
          active: c.status !== 'inactive',
          productsCount: c.products,
        },
      ];
    } else {
      const p = this.products.find((x) => String(x.id) === refId);
      if (!p) return;
      stage.items = [
        ...stage.items,
        {
          type,
          refId,
          sortOrder: stage.items.length + 1,
          name: p.name,
          nameEn: p.nameEn,
          image: p.image,
          active: p.status !== 'inactive',
          price: p.basePrice ?? p.price,
          finalPrice: p.price,
        },
      ];
    }
  }

  removeItem(stage: CollectionStage, index: number): void {
    stage.items = stage.items.filter((_, i) => i !== index);
  }

  get draftItems(): number {
    return this.itemCount(this.draft);
  }

  get draftErrors(): string[] {
    const out: string[] = [];
    if (this.draft.name.trim().length < 2) out.push('اسم المجموعة');
    if (!this.draft.image) out.push('صورة الغلاف');
    if (!this.draft.stages.length) out.push('مرحلة واحدة على الأقل');
    this.draft.stages.forEach((s, i) => {
      if (!s.name.trim()) out.push(`اسم المرحلة ${i + 1}`);
    });
    return out;
  }

  save(): void {
    this.submitted = true;
    const errors = this.draftErrors;
    if (errors.length) {
      this.toast.error(`ناقص: ${errors.join('، ')}`);
      return;
    }
    const payload: Draft = {
      ...this.draft,
      name: this.draft.name.trim(),
      nameEn: this.draft.nameEn.trim(),
      badge: this.draft.badge.trim(),
      badgeEn: this.draft.badgeEn.trim(),
      image: this.draft.image.trim(),
      sortOrder: Number(this.draft.sortOrder) || 0,
      stages: this.draft.stages.map((s, i) => ({ ...s, sortOrder: i + 1, name: s.name.trim() })),
    };
    this.saving = true;
    const editing = this.mode === 'edit' && this.selected;
    const req = editing ? this.service.update(this.selected!.id, payload) : this.service.create(payload);
    req.subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.toast.success(editing ? 'تم تحديث المجموعة' : 'تمت إضافة المجموعة');
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(this.apiError(err, editing ? 'فشل تحديث المجموعة' : 'فشلت إضافة المجموعة'));
      },
    });
  }

  toggleActive(c: ProductCollection): void {
    if (this.busyToggle.has(c.id)) return;
    this.busyToggle.add(c.id);
    const { id, ...rest } = c;
    this.service.update(id, { ...rest, active: !c.active }).subscribe({
      next: () => {
        this.busyToggle.delete(id);
        this.collections = this.collections.map((x) => (x.id === id ? { ...x, active: !c.active } : x));
        this.stats = this.buildStats();
        this.toast.success(c.active ? 'المجموعة اتخفت من التطبيق' : 'المجموعة ظاهرة في التطبيق');
      },
      error: (err) => {
        this.busyToggle.delete(id);
        this.toast.error(this.apiError(err, 'فشل تغيير حالة المجموعة'));
      },
    });
  }

  openDelete(c: ProductCollection): void {
    this.selected = c;
    this.showConfirm = true;
  }

  confirmDelete(): void {
    if (!this.selected) return;
    const id = this.selected.id;
    this.service.delete(id).subscribe({
      next: () => {
        this.collections = this.collections.filter((c) => c.id !== id);
        this.stats = this.buildStats();
        this.toast.success('تم حذف المجموعة');
        this.showConfirm = false;
        this.selected = null;
      },
      error: (err) => this.toast.error(this.apiError(err, 'فشل حذف المجموعة')),
    });
  }

  private apiError(err: unknown, fallback: string): string {
    const body = err instanceof HttpErrorResponse ? err.error : null;
    if (body && typeof body === 'object') {
      const errors = (body as Record<string, unknown>)['errors'];
      if (errors && typeof errors === 'object') {
        const text = Object.values(errors as Record<string, unknown>).flat().map(String).join(' · ');
        if (text) return text;
      }
      const message = (body as Record<string, unknown>)['message'];
      if (typeof message === 'string' && message) return message;
    }
    return fallback;
  }
}
