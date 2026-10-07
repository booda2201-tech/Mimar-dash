import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { OrdersService } from '../../core/services/orders.service';
import { apiErrorMessage } from '../../core/services/quotations.service';
import { CreateOrderComponent } from './create-order/create-order.component';
import { ToastService } from '../../core/services/toast.service';
import { AnimationService } from '../../core/services/animation.service';
import { AuthService } from '../../core/services/auth.service';
import { displayPersonName, isAccountHandle } from '../../core/api/api-utils';
import { Order, StatCardData, StatusType } from '../../core/models';

type SourceFilter = 'all' | 'app' | 'admin';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatCardComponent,
    StatusBadgeComponent,
    ModalComponent,
    ConfirmDialogComponent,
    CreateOrderComponent,
  ],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
})
export class OrdersComponent implements OnInit, AfterViewInit {
  loading = true;
  orders: Order[] = [];
  filtered: Order[] = [];
  selected: Order | null = null;
  tab: StatusType | 'all' = 'all';
  sourceFilter: SourceFilter = 'all';
  showView = false;
  viewLoading = false;
  showTrack = false;
  showCreate = false;
  showConfirm = false;
  tabs: { key: StatusType | 'all'; label: string; count: number }[] = [
    { key: 'all', label: 'الكل', count: 0 },
    { key: 'pending', label: 'معلق', count: 0 },
    { key: 'confirmed', label: 'مؤكد', count: 0 },
    { key: 'completed', label: 'تم التسليم', count: 0 },
    { key: 'cancelled', label: 'ملغي', count: 0 },
  ];

  readonly statusLabels: Record<string, string> = {
    pending: 'معلق',
    confirmed: 'مؤكد',
    completed: 'تم التسليم',
    cancelled: 'ملغي',
  };

  stats: StatCardData[] = [
    { title: 'قيمة الطلبات', value: 0, change: 'جاري التحميل', changeType: 'neutral', icon: 'payments', suffix: ' د.ك', animate: true },
    { title: 'طلبات معلّقة', value: 0, change: 'جاري التحميل', changeType: 'neutral', icon: 'hourglass_top', animate: true },
    { title: 'طلبات مؤكدة', value: 0, change: 'جاري التحميل', changeType: 'neutral', icon: 'task_alt', animate: true },
    { title: 'معدل التسليم', value: 0, change: 'جاري التحميل', changeType: 'neutral', icon: 'verified', suffix: '%', animate: true },
  ];

  statusBusy = false;
  mobileSearch = '';
  mobileLimit = 10;

  get mobileOrders(): Order[] {
    const q = this.mobileSearch.trim().toLowerCase();
    if (!q) return this.filtered;
    return this.filtered.filter((o) =>
      [o.id, o.customer, o.company, o.items, o.phone, o.createdBy].some((v) => (v || '').toLowerCase().includes(q))
    );
  }

  deskSearch = '';
  deskPage = 1;
  readonly deskPageSize = 10;
  sortKey: 'id' | 'total' | '' = '';
  sortDir: 'asc' | 'desc' = 'desc';

  get deskOrders(): Order[] {
    const q = this.deskSearch.trim().toLowerCase();
    let rows = q
      ? this.filtered.filter((o) =>
          [o.id, o.customer, o.company, o.items, o.phone, o.createdBy].some((v) => (v || '').toLowerCase().includes(q))
        )
      : this.filtered;
    if (this.sortKey) {
      const key = this.sortKey;
      const dir = this.sortDir === 'asc' ? 1 : -1;
      const val = (o: Order) => (key === 'total' ? o.total || 0 : Number(o.id) || 0);
      rows = [...rows].sort((a, b) => (val(a) - val(b)) * dir);
    }
    return rows;
  }

  get deskPages(): number {
    return Math.max(1, Math.ceil(this.deskOrders.length / this.deskPageSize));
  }

  get deskPaged(): Order[] {
    const page = Math.min(this.deskPage, this.deskPages);
    const start = (page - 1) * this.deskPageSize;
    return this.deskOrders.slice(start, start + this.deskPageSize);
  }

  get deskPageList(): number[] {
    return Array.from({ length: this.deskPages }, (_, i) => i + 1);
  }

  sortBy(key: 'id' | 'total'): void {
    if (this.sortKey === key) this.sortDir = this.sortDir === 'desc' ? 'asc' : 'desc';
    else {
      this.sortKey = key;
      this.sortDir = 'desc';
    }
    this.deskPage = 1;
  }

  sortIcon(key: 'id' | 'total'): string {
    if (this.sortKey !== key) return 'unfold_more';
    return this.sortDir === 'desc' ? 'arrow_downward' : 'arrow_upward';
  }

  trackOrder(_: number, o: Order): string {
    return o.id;
  }

  shortDate(value?: string): string {
    if (!value || value === '—') return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
  }

  private stepsFor(order: Order) {
    const s = order.status;
    if (s === 'cancelled') {
      return [
        { key: 'created', label: 'تم إنشاء الطلب', done: true },
        { key: 'cancelled', label: 'تم إلغاء الطلب', done: true },
      ];
    }
    const confirmed = s === 'confirmed' || s === 'completed';
    const delivered = s === 'completed';
    return [
      { key: 'created', label: 'تم إنشاء الطلب', done: true },
      { key: 'confirmed', label: confirmed ? 'تم تأكيد الطلب' : 'في انتظار التأكيد', done: confirmed, current: !confirmed },
      { key: 'delivered', label: delivered ? 'تم التسليم للعميل' : 'التسليم للعميل', done: delivered, current: confirmed && !delivered },
    ];
  }

  constructor(
    private ordersService: OrdersService,
    private toast: ToastService,
    private animation: AnimationService,
    private host: ElementRef,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  sourceCount(key: SourceFilter): number {
    if (key === 'all') return this.orders.length;
    return this.orders.filter((o) => (o.source || 'app') === key).length;
  }

  sourceLabel(order: Order | null): string {
    return order?.source === 'admin' ? 'خدمة العملاء' : 'التطبيق';
  }

  createdByLabel(order: Order | null): string {
    if (!order) return '—';
    if (order.source === 'admin') return this.staffDisplayName(order);
    return displayPersonName(order.createdBy, order.customer) || 'العميل من التطبيق';
  }

  currentStaffName(): string {
    return this.auth.staffName;
  }

  ngOnInit(): void {
    this.ordersService.getAll().subscribe((data) => {
      this.orders = data.map((order) => this.hydrateOrder(order));
      this.applyTab();
      this.refreshStats();
      this.loading = false;
      this.selected = this.filtered[0] || null;
      this.openFromLink();
    });
  }

  /** فتح طلب مباشرة من رابط زي /orders?view=12 (من الرئيسية مثلاً) */
  private openFromLink(): void {
    const key = this.route.snapshot.queryParamMap.get('view');
    if (!key) return;
    const order = this.orders.find((o) => String(o.id) === key || String(o.dbId) === key);
    this.router.navigate([], { relativeTo: this.route, queryParams: { view: null }, queryParamsHandling: 'merge', replaceUrl: true });
    if (order) this.openView(order);
    else this.toast.error('الطلب ده مش موجود أو اتمسح');
  }

  select(order: Order): void {
    this.selected = this.hydrateOrder(order);
    if (window.matchMedia('(max-width: 1535px)').matches) this.showTrack = true;
  }

  statusLabel(status: string): string {
    return this.statusLabels[status] || '';
  }

  canConfirm(order: Order | null): boolean {
    return order?.status === 'pending';
  }

  canDeliver(order: Order | null): boolean {
    return order?.status === 'confirmed';
  }

  canCancel(order: Order | null): boolean {
    return order?.status === 'pending' || order?.status === 'confirmed';
  }

  setStatus(order: Order, status: StatusType): void {
    if (this.statusBusy) return;
    this.statusBusy = true;
    this.ordersService.updateStatus(order.dbId || order.id, status).subscribe({
      next: () => {
        this.statusBusy = false;
        this.patchOrder(order, status);
        this.toast.success(status === 'confirmed' ? 'تم تأكيد الطلب' : 'تم تسجيل تسليم الطلب');
      },
      error: (err) => {
        this.statusBusy = false;
        this.toast.error(apiErrorMessage(err, 'فشل تغيير حالة الطلب'));
      },
    });
  }

  askCancel(order: Order): void {
    this.selected = order;
    this.showConfirm = true;
  }

  confirmCancel(): void {
    const order = this.selected;
    if (!order || this.statusBusy) return;
    this.statusBusy = true;
    this.ordersService.cancel(order.dbId || order.id).subscribe({
      next: () => {
        this.statusBusy = false;
        this.showConfirm = false;
        this.patchOrder(order, 'cancelled');
        this.toast.success('تم إلغاء الطلب');
      },
      error: (err) => {
        this.statusBusy = false;
        this.toast.error(apiErrorMessage(err, 'فشل إلغاء الطلب'));
      },
    });
  }

  private patchOrder(order: Order, status: StatusType): void {
    const next = this.withSteps({ ...order, status, trackingSteps: undefined });
    this.orders = this.orders.map((o) => (o.id === order.id ? next : o));
    if (this.selected?.id === order.id) this.selected = next;
    this.applyTab();
    this.refreshStats();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.animation.fadeUpStagger(this.host.nativeElement.querySelectorAll('.anim-item')), 80);
  }

  setTab(key: StatusType | 'all'): void {
    this.tab = key;
    this.deskPage = 1;
    this.applyTab();
  }

  setSource(key: SourceFilter): void {
    this.sourceFilter = key;
    this.deskPage = 1;
    this.applyTab();
  }

  applyTab(): void {
    this.filtered = this.orders.filter((o) => {
      const byStatus = this.tab === 'all' || o.status === this.tab;
      const bySource = this.sourceFilter === 'all' || (o.source || 'app') === this.sourceFilter;
      return byStatus && bySource;
    });
  }

  openAdd(): void {
    this.showCreate = true;
  }

  onCreated(created: Order): void {
    const staffName = this.currentStaffName();
    const order = this.hydrateOrder({
      ...created,
      source: 'admin',
      createdBy: displayPersonName(created.createdBy, staffName) || staffName,
      createdById: created.createdById || this.auth.user?.id,
    });
    this.orders = [order, ...this.orders.filter((o) => o.id !== order.id)];
    this.selected = order;
    this.applyTab();
    this.refreshStats();
    this.showCreate = false;
  }

  openView(order: Order): void {
    this.selected = order;
    this.showView = true;
    this.viewLoading = true;
    const key = order.dbId || order.id;
    this.ordersService.getById(key).subscribe((full) => {
      if (this.selected !== order) return;
      this.viewLoading = false;
      if (!full) return;
      const merged = { ...order } as Record<string, unknown>;
      Object.entries(full).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '' || v === '—' || v === 0) return;
        if (k === 'source' || k === 'createdBy' || k === 'createdById') return;
        merged[k] = v;
      });
      const next = this.hydrateOrder(merged as unknown as Order);
      this.selected = next;
      this.orders = this.orders.map((o) => (o === order ? next : o));
      this.applyTab();
    });
  }

  money(value?: number): string {
    return `${(value || 0).toLocaleString('en-US', { maximumFractionDigits: 3 })} د.ك`;
  }

  viewDate(value?: string): string {
    if (!value || value === '—') return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  addressRows(order: Order): { label: string; value: string }[] {
    const a = order.address;
    if (!a) return [];
    return [
      { label: 'المحافظة', value: a.governorate },
      { label: 'المدينة', value: a.city },
      { label: 'المنطقة', value: a.area },
      { label: 'الشارع', value: a.street },
      { label: 'العمارة', value: a.buildingNumber },
      { label: 'الدور', value: a.floor },
      { label: 'الشقة', value: a.apartment },
      { label: 'علامة مميزة', value: a.landmark },
    ].filter((row): row is { label: string; value: string } => !!row.value);
  }

  private refreshStats(): void {
    const count = (s: StatusType) => this.orders.filter((o) => o.status === s).length;
    const active = this.orders.filter((o) => o.status !== 'cancelled');
    const total = active.reduce((s, o) => s + (o.total || 0), 0);
    const pending = count('pending');
    const confirmed = count('confirmed');
    const done = count('completed');
    const rate = active.length ? Math.round((done / active.length) * 1000) / 10 : 0;
    this.stats = [
      { ...this.stats[0], value: total, change: `${active.length} طلب فعّال`, changeType: 'up' },
      { ...this.stats[1], value: pending, change: pending ? 'محتاجة تأكيد' : 'مفيش معلّق', changeType: pending ? 'down' : 'neutral' },
      { ...this.stats[2], value: confirmed, change: 'في انتظار التسليم', changeType: confirmed ? 'up' : 'neutral' },
      { ...this.stats[3], value: rate, change: `${count('cancelled')} ملغي`, changeType: 'up' },
    ];
    this.tabs = this.tabs.map((t) => ({
      ...t,
      count: t.key === 'all' ? this.orders.length : count(t.key as StatusType),
    }));
  }

  private hydrateOrder(order: Order): Order {
    const next =
      order.source === 'admin' ? { ...order, createdBy: this.staffDisplayName(order) } : order;
    return this.withSteps(next);
  }

  private staffDisplayName(order: Order): string {
    const nice = displayPersonName(order.createdBy);
    if (nice) return nice;
    if (this.auth.matchesStaff(order.createdBy, order.createdById)) return this.currentStaffName();
    if (order.createdBy && isAccountHandle(order.createdBy)) return this.currentStaffName();
    return this.currentStaffName();
  }

  private withSteps(order: Order): Order {
    return { ...order, trackingSteps: this.stepsFor(order) };
  }
}