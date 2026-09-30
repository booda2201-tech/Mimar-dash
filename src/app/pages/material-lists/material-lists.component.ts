import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { DetailViewComponent, DetailField } from '../../shared/components/detail-view/detail-view.component';
import { SelectComponent, SelectOption } from '../../shared/components/select/select.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { MaterialListsService } from '../../core/services/data.services';
import { ProductsService } from '../../core/services/products.service';
import { AnimationService } from '../../core/services/animation.service';
import { ToastService } from '../../core/services/toast.service';
import { MaterialList, MaterialListItem, Product, StatCardData } from '../../core/models';
import { buildDemoMaterialLists, isDemoListId } from './demo-material-lists';

@Component({
  selector: 'app-material-lists',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    StatCardComponent,
    ModalComponent,
    ConfirmDialogComponent,
    DetailViewComponent,
    SelectComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './material-lists.component.html',
  styleUrls: ['./material-lists.component.scss'],
})
export class MaterialListsComponent implements OnInit, AfterViewInit {
  loading = true;
  saving = false;
  lists: MaterialList[] = [];
  filtered: MaterialList[] = [];
  searchTerm = '';
  tab: 'all' | 'active' | 'inactive' = 'all';
  showForm = false;
  showView = false;
  showItemForm = false;
  showConfirm = false;
  mode: 'add' | 'edit' = 'add';
  selected: MaterialList | null = null;
  viewFields: DetailField[] = [];
  productOptions: SelectOption[] = [];

  stats: StatCardData[] = [
    { title: 'إجمالي القوائم', value: 0, change: 'قوائم المشاريع', changeType: 'neutral', icon: 'list_alt', animate: true },
    { title: 'قوائم نشطة', value: 0, change: 'جاهزة للمتابعة', changeType: 'up', icon: 'check_circle', animate: true },
    { title: 'إجمالي الأصناف', value: 0, change: 'منتجات داخل القوائم', changeType: 'neutral', icon: 'inventory_2', animate: true },
    { title: 'قابلة للمشاركة', value: 0, change: 'لها رابط للمقاول', changeType: 'neutral', icon: 'share', animate: true },
  ];

  private catalog: Product[] = [];

  statusOptions: SelectOption[] = [
    { value: 'active', label: 'نشط' },
    { value: 'inactive', label: 'غير نشط' },
  ];

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    nameEn: [''],
    projectName: [''],
    description: [''],
    status: ['active' as MaterialList['status'], Validators.required],
  });

  itemForm = this.fb.group({
    productId: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(0.01)]],
    notes: [''],
  });

  constructor(
    private service: MaterialListsService,
    private products: ProductsService,
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
    this.router.navigateByUrl('/dashboard');
  }

  get formTitle(): string {
    return this.mode === 'edit' ? 'تعديل قائمة مواد' : 'قائمة مواد جديدة';
  }

  ngOnInit(): void {
    this.products.getAll().subscribe({
      next: (products) => {
        this.catalog = products;
        this.productOptions = products.map((p) => ({
          value: p.id,
          label: p.sku ? `${p.name} · ${p.sku}` : p.name,
        }));
        this.load();
      },
      error: () => this.load(),
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.animation.fadeUpStagger(this.host.nativeElement.querySelectorAll('.anim-item')), 80);
  }

  load(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (lists) => {
        this.lists = lists.length ? lists : buildDemoMaterialLists(this.catalog);
        this.applyFilter();
        this.refreshStats();
        this.loading = false;
      },
      error: () => {
        this.lists = buildDemoMaterialLists(this.catalog);
        this.applyFilter();
        this.refreshStats();
        this.loading = false;
      },
    });
  }

  refreshStats(): void {
    const active = this.lists.filter((l) => l.status === 'active').length;
    const items = this.lists.reduce((s, l) => s + (l.itemsCount || 0), 0);
    const shared = this.lists.filter((l) => !!l.shareToken).length;
    this.stats = [
      { ...this.stats[0], value: this.lists.length },
      { ...this.stats[1], value: active },
      { ...this.stats[2], value: items },
      { ...this.stats[3], value: shared },
    ];
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filtered = this.lists.filter((list) => {
      const byTab = this.tab === 'all' || list.status === this.tab;
      const hay = [list.name, list.projectName, list.ownerName, list.description]
        .map((v) => String(v || '').toLowerCase())
        .join(' ');
      return byTab && (!term || hay.includes(term));
    });
  }

  setTab(tab: 'all' | 'active' | 'inactive'): void {
    this.tab = tab;
    this.applyFilter();
  }

  tabCount(tab: 'all' | 'active' | 'inactive'): number {
    if (tab === 'all') return this.lists.length;
    return this.lists.filter((list) => list.status === tab).length;
  }

  initial(name?: string): string {
    const text = (name || 'ق').replace(/[.\s]/g, '');
    return text.charAt(0) || 'ق';
  }

  displayDate(value?: string): string {
    if (!value || value === '—') return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  previewItems(list: MaterialList): MaterialListItem[] {
    return (list.items || []).slice(0, 3);
  }

  openAdd(): void {
    this.mode = 'add';
    this.selected = null;
    this.form.reset({
      name: '',
      nameEn: '',
      projectName: '',
      description: '',
      status: 'active',
    });
    this.showForm = true;
  }

  openEdit(list: MaterialList): void {
    this.mode = 'edit';
    this.selected = list;
    this.showView = false;
    this.form.reset({
      name: list.name,
      nameEn: list.nameEn || '',
      projectName: list.projectName || '',
      description: list.description || '',
      status: list.status === 'inactive' ? 'inactive' : 'active',
    });
    this.showForm = true;
  }

  openView(list: MaterialList): void {
    this.selected = list;
    this.viewFields = [
      { label: 'الاسم بالإنجليزي', value: list.nameEn || '—', span: 2 },
      { label: 'المشروع', value: list.projectName || '—' },
      { label: 'المالك', value: list.ownerName || '—' },
      { label: 'عدد الأصناف', value: list.itemsCount },
      { label: 'تاريخ الإنشاء', value: list.createdAt || '—' },
      { label: 'الحالة', value: list.status, type: 'status' },
      { label: 'الوصف', value: list.description || '—', span: 2 },
    ];
    this.showView = true;
    if (isDemoListId(list.id)) return;
    this.service.getById(list.id).subscribe({
      next: (full) => {
        this.selected = { ...list, ...full, items: full.items || list.items || [] };
        this.viewFields = [
          { label: 'الاسم بالإنجليزي', value: this.selected.nameEn || '—', span: 2 },
          { label: 'المشروع', value: this.selected.projectName || '—' },
          { label: 'المالك', value: this.selected.ownerName || '—' },
          { label: 'عدد الأصناف', value: this.selected.itemsCount || this.selected.items?.length || 0 },
          { label: 'تاريخ الإنشاء', value: this.selected.createdAt || '—' },
          { label: 'الحالة', value: this.selected.status, type: 'status' },
          { label: 'الوصف', value: this.selected.description || '—', span: 2 },
        ];
      },
      error: () => undefined,
    });
  }

  openAddItem(): void {
    if (!this.selected) return;
    this.itemForm.reset({ productId: '', quantity: 1, notes: '' });
    this.showItemForm = true;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('أكمل بيانات القائمة');
      return;
    }
    const raw = this.form.getRawValue();
    const payload: Partial<MaterialList> = {
      name: raw.name || '',
      nameEn: raw.nameEn || '',
      projectName: raw.projectName || '',
      description: raw.description || '',
      status: (raw.status as MaterialList['status']) || 'active',
    };
    this.saving = true;

    if (this.mode === 'edit' && this.selected && isDemoListId(this.selected.id)) {
      this.lists = this.lists.map((list) =>
        list.id === this.selected!.id ? { ...list, ...payload, itemsCount: list.itemsCount } : list
      );
      this.finishLocalSave(this.mode === 'edit' ? 'تم تحديث القائمة التجريبية' : 'تم إنشاء القائمة');
      return;
    }

    const req =
      this.mode === 'edit' && this.selected
        ? this.service.update(this.selected.id, payload)
        : this.service.create(payload);

    req.subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.toast.success(this.mode === 'edit' ? 'تم تحديث القائمة' : 'تم إنشاء قائمة المواد');
        this.load();
      },
      error: () => {
        const local: MaterialList = {
          id: `DEMO-${Date.now()}`,
          name: payload.name || 'قائمة جديدة',
          nameEn: payload.nameEn,
          projectName: payload.projectName,
          description: payload.description,
          ownerName: 'م. عبد الرحمن',
          status: payload.status || 'active',
          createdAt: new Date().toISOString(),
          items: [],
          itemsCount: 0,
        };
        if (this.mode === 'edit' && this.selected) {
          this.lists = this.lists.map((list) => (list.id === this.selected!.id ? { ...list, ...payload } : list));
        } else {
          this.lists = [local, ...this.lists];
        }
        this.finishLocalSave(this.mode === 'edit' ? 'تم تحديث القائمة محلياً' : 'تم إنشاء قائمة تجريبية');
      },
    });
  }

  saveItem(): void {
    if (!this.selected) return;
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      this.toast.error('اختر منتجاً وكمية صحيحة');
      return;
    }
    const raw = this.itemForm.getRawValue();
    this.saving = true;
    const product = this.catalog.find((p) => String(p.id) === String(raw.productId));
    const applyLocal = () => {
      const nextItem: MaterialListItem = {
        id: `DI-${Date.now()}`,
        productId: String(raw.productId),
        productName: product?.name || `منتج #${raw.productId}`,
        productSku: product?.sku,
        quantity: Number(raw.quantity) || 1,
        unit: product?.unit,
        notes: raw.notes || undefined,
        price: product?.price,
      };
      this.patchSelectedItems([...(this.selected?.items || []), nextItem]);
      this.saving = false;
      this.showItemForm = false;
      this.toast.success('تمت إضافة الصنف للقائمة');
    };

    if (isDemoListId(this.selected.id)) {
      applyLocal();
      return;
    }

    this.service
      .addItem(this.selected.id, {
        productId: raw.productId || '',
        quantity: Number(raw.quantity) || 1,
        notes: raw.notes || undefined,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.showItemForm = false;
          this.toast.success('تمت إضافة الصنف للقائمة');
          this.openView(this.selected!);
          this.load();
        },
        error: () => applyLocal(),
      });
  }

  removeItem(item: MaterialListItem): void {
    if (!this.selected) return;
    const applyLocal = () => {
      this.patchSelectedItems((this.selected?.items || []).filter((row) => row.id !== item.id));
      this.toast.success('تم حذف الصنف');
    };
    if (isDemoListId(this.selected.id)) {
      applyLocal();
      return;
    }
    this.service.deleteItem(this.selected.id, item.id).subscribe({
      next: () => {
        this.toast.success('تم حذف الصنف');
        this.openView(this.selected!);
        this.load();
      },
      error: () => applyLocal(),
    });
  }

  askDelete(list: MaterialList): void {
    this.selected = list;
    this.showConfirm = true;
  }

  confirmDelete(): void {
    if (!this.selected) return;
    const id = this.selected.id;
    const applyLocal = () => {
      this.lists = this.lists.filter((list) => list.id !== id);
      this.showConfirm = false;
      this.selected = null;
      this.applyFilter();
      this.refreshStats();
      this.toast.success('تم حذف قائمة المواد');
    };
    if (isDemoListId(id)) {
      applyLocal();
      return;
    }
    this.service.delete(id).subscribe({
      next: applyLocal,
      error: applyLocal,
    });
  }

  listTotal(list: MaterialList | null): number {
    return (list?.items || []).reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
  }

  private patchSelectedItems(items: MaterialListItem[]): void {
    if (!this.selected) return;
    const next = { ...this.selected, items, itemsCount: items.length };
    this.selected = next;
    this.lists = this.lists.map((list) => (list.id === next.id ? next : list));
    this.applyFilter();
    this.refreshStats();
  }

  private finishLocalSave(message: string): void {
    this.saving = false;
    this.showForm = false;
    this.applyFilter();
    this.refreshStats();
    this.toast.success(message);
  }

  err(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!(c && c.touched && c.invalid);
  }

  itemErr(ctrl: string): boolean {
    const c = this.itemForm.get(ctrl);
    return !!(c && c.touched && c.invalid);
  }
}
