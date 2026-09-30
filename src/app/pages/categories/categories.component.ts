import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { SelectComponent, SelectOption } from '../../shared/components/select/select.component';
import { ImageDropzoneComponent } from '../../shared/components/image-dropzone/image-dropzone.component';
import { CategoriesService } from '../../core/services/data.services';
import { ProductsService } from '../../core/services/products.service';
import { AnimationService } from '../../core/services/animation.service';
import { ToastService } from '../../core/services/toast.service';
import { Category } from '../../core/models';
import { firstValueFrom } from 'rxjs';
import { STARTER_PACKS, StarterCategory, StarterPack } from './categories-starter';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StatusBadgeComponent,
    ModalComponent,
    ConfirmDialogComponent,
    SelectComponent,
    ImageDropzoneComponent,
  ],
  templateUrl: './categories.component.html',
  styles: [
    `
      :host {
        display: block;
      }
      .ct-summary,
      .ct-back {
        display: none;
      }
      .rc-head {
        display: flex;
        align-items: flex-start;
        gap: 0.8rem;
      }
      .rc-thumb {
        position: relative;
        flex-shrink: 0;
        width: 3.75rem;
        height: 3.75rem;
        border-radius: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(145deg, rgba(11, 74, 58, 0.1), rgba(200, 162, 75, 0.14));
        color: #0b4a3a;
        box-shadow: 0 6px 16px rgba(11, 74, 58, 0.12);
      }
      .rc-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 1rem;
      }
      .rc-thumb .material-symbols-outlined {
        font-size: 1.6rem;
      }
      .rc-dot {
        position: absolute;
        bottom: -0.15rem;
        inset-inline-end: -0.15rem;
        width: 0.9rem;
        height: 0.9rem;
        border-radius: 999px;
        background: #10b981;
        border: 2.5px solid #fff;
      }
      .rc-dot.is-off {
        background: #ef4444;
      }
      .rc-info {
        flex: 1;
        min-width: 0;
      }
      .rc-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 800;
        line-height: 1.35;
        color: #0b4a3a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .rc-en {
        margin: 0.05rem 0 0;
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        color: #9ca3af;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .rc-meta {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.35rem;
        margin-top: 0.45rem;
      }
      .rc-date {
        display: inline-flex;
        align-items: center;
        gap: 0.2rem;
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
        background: #f3f5f4;
        font-size: 0.68rem;
        font-weight: 700;
        color: #6b7280;
      }
      .rc-date .material-symbols-outlined {
        font-size: 0.8rem;
      }
      .rc-actions {
        display: flex;
        gap: 0.35rem;
        flex-shrink: 0;
      }
      .rc-btn {
        width: 2.15rem;
        height: 2.15rem;
        border: 1px solid rgba(11, 74, 58, 0.08);
        border-radius: 0.7rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #f3f7f5;
        color: #0b4a3a;
        cursor: pointer;
        transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease;
      }
      .rc-btn .material-symbols-outlined {
        font-size: 1.05rem;
      }
      .rc-btn:hover {
        background: #0b4a3a;
        color: #fff;
      }
      .rc-btn.is-danger {
        background: #fef2f2;
        border-color: rgba(220, 38, 38, 0.1);
        color: #dc2626;
      }
      .rc-btn.is-danger:hover {
        background: #dc2626;
        color: #fff;
      }
      .rc-btn:active {
        transform: scale(0.92);
      }
      .rc-desc {
        display: flex;
        align-items: flex-start;
        gap: 0.4rem;
        margin: 0.75rem 0 0;
        padding: 0.55rem 0.7rem;
        border-radius: 0.75rem;
        background: #f8faf9;
        font-size: 0.78rem;
        font-weight: 600;
        line-height: 1.5;
        color: #4b5563;
      }
      .rc-desc .material-symbols-outlined {
        flex-shrink: 0;
        margin-top: 0.1rem;
        font-size: 0.95rem;
        color: #c8a24b;
      }
      .st-intro {
        margin: 0 0 0.9rem;
        font-size: 0.82rem;
        line-height: 1.6;
        color: #6b7280;
      }
      .st-list {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }
      .st-pack {
        position: relative;
        display: flex;
        align-items: flex-start;
        gap: 0.8rem;
        padding: 0.75rem;
        border-radius: 1rem;
        border: 1.5px solid rgba(11, 74, 58, 0.1);
        background: #fff;
        cursor: pointer;
        transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
      }
      .st-pack:hover {
        border-color: rgba(11, 74, 58, 0.25);
      }
      .st-pack.is-on {
        border-color: #0b4a3a;
        background: #f5faf7;
        box-shadow: 0 6px 16px rgba(11, 74, 58, 0.08);
      }
      .st-pack input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }
      .st-cover {
        flex-shrink: 0;
        width: 4.25rem;
        height: 4.25rem;
        border-radius: 0.85rem;
        object-fit: cover;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      .st-body {
        flex: 1;
        min-width: 0;
      }
      .st-head {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .st-head strong {
        font-size: 0.95rem;
        font-weight: 800;
        color: #0b4a3a;
      }
      .st-tag {
        padding: 0.1rem 0.5rem;
        border-radius: 999px;
        font-size: 0.66rem;
        font-weight: 800;
        color: #6b7280;
        background: #f3f4f6;
      }
      .st-tag.is-new {
        color: #8a6a1f;
        background: #fdf3d7;
      }
      .st-body p {
        margin: 0.25rem 0 0.5rem;
        font-size: 0.75rem;
        line-height: 1.55;
        color: #6b7280;
      }
      .st-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.3rem;
      }
      .st-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.15rem 0.5rem 0.15rem 0.15rem;
        border-radius: 999px;
        background: #fff;
        border: 1px solid rgba(11, 74, 58, 0.12);
        font-size: 0.7rem;
        font-weight: 700;
        color: #374151;
      }
      .st-chip img {
        width: 1.35rem;
        height: 1.35rem;
        border-radius: 999px;
        object-fit: cover;
      }
      .st-chip.is-exists {
        color: #9ca3af;
        background: #f9fafb;
      }
      .st-chip .material-symbols-outlined {
        font-size: 0.85rem;
        color: #10b981;
      }
      .st-check {
        flex-shrink: 0;
        font-size: 1.4rem;
        color: #cbd5e1;
        transition: color 0.2s ease;
      }
      .st-pack.is-on .st-check {
        color: #0b4a3a;
      }
      .st-progress {
        margin-top: 0.9rem;
      }
      .st-bar {
        height: 0.45rem;
        border-radius: 999px;
        background: #eef1f0;
        overflow: hidden;
      }
      .st-bar span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #0b4a3a, #13705a);
        transition: width 0.35s ease;
      }
      .st-progress small {
        display: block;
        margin-top: 0.35rem;
        font-size: 0.72rem;
        font-weight: 700;
        color: #6b7280;
      }
      @media (max-width: 767px) {
        .ct-new.is-ghost {
          width: 2.4rem;
          padding: 0;
          justify-content: center;
          background: rgba(255, 255, 255, 0.14);
          color: #dfc17b;
          box-shadow: none;
        }
        .st-cover {
          width: 3.25rem;
          height: 3.25rem;
        }
        .page-head {
          gap: 0;
        }
        .page-head .ct-add-desk,
        .ct-stats {
          display: none !important;
        }
        .title-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .page-head .title-row h1 {
          font-size: 1.2rem;
          line-height: 1.5rem;
        }
        .page-head .title-row p {
          display: block;
          margin-top: 0.15rem;
          font-size: 0.72rem;
          line-height: 1.15rem;
          color: #9ca3af;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ct-back {
          flex-shrink: 0;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.85rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(11, 74, 58, 0.12);
          background: #fff;
          color: #0b4a3a;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(11, 74, 58, 0.06);
          transition: transform 0.15s ease, background 0.2s ease;
        }
        .ct-back .material-symbols-outlined {
          font-size: 1.25rem;
        }
        .ct-back:active {
          transform: scale(0.92);
          background: #eef4f1;
        }
        .ct-summary {
          position: relative;
          overflow: hidden;
          display: block;
          padding: 1rem 1rem 0.85rem;
          border-radius: 1.3rem;
          color: #fff;
          background: radial-gradient(circle at 0% 0%, rgba(223, 193, 123, 0.35) 0%, transparent 45%),
            linear-gradient(135deg, #0b4a3a 0%, #0f5c48 60%, #13705a 100%);
          box-shadow: 0 12px 28px rgba(11, 74, 58, 0.22);
        }
        .ct-summary::after {
          content: '';
          position: absolute;
          width: 9rem;
          height: 9rem;
          inset-inline-end: -3rem;
          bottom: -4.5rem;
          border-radius: 999px;
          border: 1.5rem solid rgba(255, 255, 255, 0.05);
          pointer-events: none;
        }
        .ct-main {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .ct-main small {
          display: block;
          font-size: 0.72rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.7);
        }
        .ct-main strong {
          font-size: 1.6rem;
          font-weight: 800;
          line-height: 1.2;
          white-space: nowrap;
        }
        .ct-main em {
          font-style: normal;
          font-size: 0.8rem;
          font-weight: 700;
          color: #dfc17b;
        }
        .ct-new {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          height: 2.4rem;
          padding: 0 0.85rem;
          border: 0;
          border-radius: 0.85rem;
          background: #dfc17b;
          color: #073328;
          font-family: inherit;
          font-size: 0.8rem;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.15);
          transition: transform 0.15s ease;
        }
        .ct-new .material-symbols-outlined {
          font-size: 1.1rem;
        }
        .ct-new:active {
          transform: scale(0.95);
        }
        .ct-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          margin-top: 0.85rem;
          padding: 0.6rem 0.25rem;
          border-radius: 0.95rem;
          background: rgba(255, 255, 255, 0.1);
        }
        .ct-grid > div {
          min-width: 0;
          text-align: center;
        }
        .ct-grid > div + div {
          border-inline-start: 1px solid rgba(255, 255, 255, 0.14);
        }
        .ct-grid strong {
          display: block;
          font-size: 1rem;
          font-weight: 800;
        }
        .ct-grid small {
          font-size: 0.66rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
        }
      }
    `,
  ],
})
export class CategoriesComponent implements OnInit, AfterViewInit {
  loading = true;
  saving = false;
  categories: Category[] = [];
  productCounts = new Map<string, number>();
  search = '';
  collapsed = new Set<string>();
  showForm = false;
  showConfirm = false;
  mode: 'add' | 'edit' = 'add';
  selected: Category | null = null;

  readonly starterPacks = STARTER_PACKS;
  showStarter = false;
  starterPicked = new Set<string>();
  starterBusy = false;
  starterDone = 0;
  starterTotal = 0;

  form = this.fb.group({
    parentId: [''],
    name: ['', [Validators.required, Validators.minLength(2)]],
    nameEn: [''],
    description: [''],
    descriptionEn: [''],
    image: [''],
    order: [1 as number | null, [Validators.min(0)]],
    active: [true],
  });

  constructor(
    private service: CategoriesService,
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
    this.router.navigateByUrl('/dashboard');
  }

  get formTitle(): string {
    if (this.mode === 'edit') return 'تعديل الفئة';
    return this.form.get('parentId')?.value ? 'إضافة فئة فرعية' : 'إضافة فئة رئيسية';
  }

  get roots(): Category[] {
    const q = this.search.trim().toLowerCase();
    return this.sorted(this.categories.filter((c) => !c.parentId || !this.byId(c.parentId))).filter(
      (root) => !q || this.matches(root, q) || this.descendants(root.id).some((d) => this.matches(d, q))
    );
  }

  get mainCount(): number {
    return this.categories.filter((c) => !c.parentId).length;
  }

  get subCount(): number {
    return this.categories.filter((c) => !!c.parentId).length;
  }

  get categorizedProducts(): number {
    let total = 0;
    this.productCounts.forEach((n) => (total += n));
    return total;
  }

  /** الفئة الأم: رئيسية أو أي فئة رئيسية تانية (مستويين بس عشان التطبيق يفضل بسيط) */
  get parentOptions(): SelectOption[] {
    const self = this.mode === 'edit' ? this.selected?.id : null;
    return [
      { value: '', label: '— فئة رئيسية —' },
      ...this.sorted(this.categories.filter((c) => !c.parentId && c.id !== self)).map((c) => ({
        value: c.id,
        label: c.nameEn ? `${c.name} · ${c.nameEn}` : c.name,
      })),
    ];
  }

  ngOnInit(): void {
    this.load();
    this.productsService.getAll().subscribe((products) => {
      const counts = new Map<string, number>();
      products.forEach((p) => {
        if (p.categoryId) counts.set(String(p.categoryId), (counts.get(String(p.categoryId)) || 0) + 1);
      });
      this.productCounts = counts;
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.animation.fadeUpStagger(this.host.nativeElement.querySelectorAll('.anim-item')), 80);
  }

  load(): void {
    this.service.getAll().subscribe((d) => {
      this.categories = d;
      this.loading = false;
      setTimeout(() => this.animation.fadeUpStagger(this.host.nativeElement.querySelectorAll('.anim-item')), 50);
    });
  }

  childrenOf(id: string): Category[] {
    const q = this.search.trim().toLowerCase();
    return this.sorted(this.categories.filter((c) => c.parentId === id)).filter(
      (c) => !q || this.matches(c, q) || this.descendants(c.id).some((d) => this.matches(d, q)) || this.parentMatches(c, q)
    );
  }

  /** منتجات الفئة نفسها + كل الفئات اللي تحتها */
  productsIn(id: string): number {
    return [id, ...this.descendants(id).map((d) => d.id)].reduce((sum, cid) => sum + (this.productCounts.get(cid) || 0), 0);
  }

  toggle(id: string): void {
    if (this.collapsed.has(id)) this.collapsed.delete(id);
    else this.collapsed.add(id);
  }

  openAdd(parentId: string | null = null): void {
    this.mode = 'add';
    this.selected = null;
    const siblings = this.categories.filter((c) => (c.parentId || null) === (parentId || null));
    const nextOrder = siblings.reduce((max, c) => Math.max(max, c.sortOrder || 0), 0) + 1;
    this.form.reset({
      parentId: parentId || '',
      name: '',
      nameEn: '',
      description: '',
      descriptionEn: '',
      image: '',
      order: nextOrder,
      active: true,
    });
    if (parentId) this.collapsed.delete(parentId);
    this.showForm = true;
  }

  openEdit(c: Category): void {
    this.mode = 'edit';
    this.selected = c;
    this.form.reset({
      parentId: c.parentId || '',
      name: c.name,
      nameEn: c.nameEn || '',
      description: c.description || '',
      descriptionEn: c.descriptionEn || '',
      image: c.image || '',
      order: c.sortOrder ?? 1,
      active: c.status !== 'inactive',
    });
    this.showForm = true;
  }

  openDelete(c: Category): void {
    if (this.categories.some((x) => x.parentId === c.id) || (c.childrenCount || 0) > 0) {
      this.toast.error('احذف الفئات الفرعية أولاً، أو انقلها لفئة تانية');
      return;
    }
    if (this.productsIn(c.id) > 0) {
      this.toast.error('الفئة فيها منتجات — انقل المنتجات لفئة تانية الأول');
      return;
    }
    this.selected = c;
    this.showConfirm = true;
  }

  err(control: string): boolean {
    const c = this.form.get(control);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('اكتب اسم الفئة بالعربي');
      return;
    }
    const raw = this.form.getRawValue();
    const parentId = raw.parentId || null;
    const payload: Partial<Category> = {
      name: raw.name!.trim(),
      nameEn: (raw.nameEn || '').trim(),
      description: (raw.description || '').trim(),
      descriptionEn: (raw.descriptionEn || '').trim(),
      image: raw.image || undefined,
      status: raw.active ? 'active' : 'inactive',
      showInApp: !!raw.active,
      parentId,
      sortOrder: Math.max(0, Math.round(Number(raw.order) || 0)),
    };

    this.saving = true;
    const req =
      this.mode === 'edit' && this.selected ? this.service.update(this.selected.id, payload) : this.service.create(payload);
    req.subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.toast.success(this.mode === 'edit' ? 'تم تحديث الفئة' : 'تمت إضافة الفئة');
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err?.status === 401 ? 'سجّل الدخول بحساب أدمن' : 'فشل حفظ الفئة من الـ API');
      },
    });
  }

  confirmDelete(): void {
    if (!this.selected) return;
    const id = this.selected.id;
    this.service.delete(id).subscribe({
      next: () => {
        this.categories = this.categories.filter((c) => c.id !== id);
        this.toast.success('تم حذف الفئة');
        this.showConfirm = false;
        this.selected = null;
      },
      error: () => this.toast.error('فشل حذف الفئة من الـ API'),
    });
  }

  openStarter(): void {
    this.starterPicked = new Set(this.starterPacks.filter((p) => this.missingIn(p).length || !this.findRoot(p)).map((p) => p.key));
    this.showStarter = true;
  }

  toggleStarter(key: string): void {
    if (this.starterPicked.has(key)) this.starterPicked.delete(key);
    else this.starterPicked.add(key);
  }

  findRoot(pack: StarterPack): Category | undefined {
    const names = [pack.name, pack.nameEn, ...pack.aliases].map((n) => this.fold(n));
    return this.categories.find((c) => !c.parentId && (names.includes(this.fold(c.name)) || names.includes(this.fold(c.nameEn || ''))));
  }

  childExists(pack: StarterPack, child: StarterCategory): boolean {
    const root = this.findRoot(pack);
    if (!root) return false;
    const names = [this.fold(child.name), this.fold(child.nameEn)];
    return this.categories.some(
      (c) => c.parentId === root.id && (names.includes(this.fold(c.name)) || names.includes(this.fold(c.nameEn || '')))
    );
  }

  missingIn(pack: StarterPack): StarterCategory[] {
    return pack.children.filter((child) => !this.childExists(pack, child));
  }

  get starterPending(): number {
    return this.starterPacks
      .filter((p) => this.starterPicked.has(p.key))
      .reduce((sum, p) => sum + (this.findRoot(p) ? 0 : 1) + this.missingIn(p).length, 0);
  }

  async importStarter(): Promise<void> {
    const packs = this.starterPacks.filter((p) => this.starterPicked.has(p.key));
    this.starterTotal = this.starterPending;
    if (!this.starterTotal) {
      this.toast.info('كل الفئات المختارة موجودة بالفعل');
      return;
    }
    this.starterBusy = true;
    this.starterDone = 0;
    let failed = 0;

    for (const pack of packs) {
      let root = this.findRoot(pack);
      if (!root) {
        try {
          await firstValueFrom(this.service.create(await this.starterPayload(pack, null, this.nextOrder(null))));
          this.starterDone++;
        } catch {
          failed++;
        }
        this.categories = await firstValueFrom(this.service.getAll());
        root = this.findRoot(pack);
      }
      if (!root) continue;

      let order = this.nextOrder(root.id);
      for (const child of this.missingIn(pack)) {
        try {
          await firstValueFrom(this.service.create(await this.starterPayload(child, root.id, order++)));
          this.starterDone++;
        } catch {
          failed++;
        }
      }
    }

    this.starterBusy = false;
    this.showStarter = false;
    this.load();
    if (failed) this.toast.error(`اتضاف ${this.starterDone} فئة، وفشل ${failed}`);
    else this.toast.success(`تمت إضافة ${this.starterDone} فئة بالصور والوصف`);
  }

  private nextOrder(parentId: string | null): number {
    return this.categories.filter((c) => (c.parentId || null) === parentId).reduce((m, c) => Math.max(m, c.sortOrder || 0), 0) + 1;
  }

  private async starterPayload(item: StarterCategory, parentId: string | null, order: number): Promise<Partial<Category>> {
    return {
      name: item.name,
      nameEn: item.nameEn,
      description: item.description,
      descriptionEn: item.descriptionEn,
      image: await this.assetDataUrl(item.image),
      status: 'active',
      showInApp: true,
      parentId,
      sortOrder: order,
    };
  }

  private async assetDataUrl(path: string): Promise<string | undefined> {
    try {
      const blob = await (await fetch(path)).blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    } catch {
      return undefined;
    }
  }

  private fold(value: string): string {
    return (value || '')
      .trim()
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/^ال/, '')
      .replace(/\s+/g, ' ');
  }

  shortDate(value?: string): string {
    if (!value) return '';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private byId(id: string): Category | undefined {
    return this.categories.find((c) => c.id === id);
  }

  private descendants(id: string): Category[] {
    const direct = this.categories.filter((c) => c.parentId === id);
    return [...direct, ...direct.flatMap((c) => this.descendants(c.id))];
  }

  private sorted(list: Category[]): Category[] {
    return [...list].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name, 'ar'));
  }

  private matches(c: Category, q: string): boolean {
    return c.name.toLowerCase().includes(q) || (c.nameEn || '').toLowerCase().includes(q);
  }

  private parentMatches(c: Category, q: string): boolean {
    const parent = c.parentId ? this.byId(c.parentId) : undefined;
    return !!parent && this.matches(parent, q);
  }
}
