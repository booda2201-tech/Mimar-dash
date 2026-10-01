import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { QuotationsService, apiErrorMessage } from '../../core/services/quotations.service';
import { MaterialListsService } from '../../core/services/data.services';
import { AnimationService } from '../../core/services/animation.service';
import { ToastService } from '../../core/services/toast.service';
import { QuotationFile, QuotationItem, QuotationRequest, QuotationStatus, StatCardData } from '../../core/models';
import { environment } from '../../../environments/environment';

type Tab = 'all' | QuotationStatus;

const STATUS_META: Record<QuotationStatus, { label: string; badge: string }> = {
  pending: { label: 'بانتظار التسعير', badge: 'pending' },
  offered: { label: 'تم إرسال العرض', badge: 'info' },
  accepted: { label: 'مقبول', badge: 'approved' },
  rejected: { label: 'مرفوض', badge: 'rejected' },
  ordered: { label: 'تحوّل لطلب', badge: 'completed' },
  expired: { label: 'منتهي الصلاحية', badge: 'inactive' },
  cancelled: { label: 'ملغي', badge: 'cancelled' },
};

@Component({
  selector: 'app-quotations',
  standalone: true,
  imports: [CommonModule, FormsModule, StatCardComponent, ModalComponent, StatusBadgeComponent],
  templateUrl: './quotations.component.html',
  styleUrls: ['./quotations.component.scss']
})
export class QuotationsComponent implements OnInit, AfterViewInit {
  loading = true;
  requests: QuotationRequest[] = [];
  filtered: QuotationRequest[] = [];
  searchTerm = '';
  tab: Tab = 'all';

  selected: QuotationRequest | null = null;
  showDetail = false;
  detailLoading = false;
  acting: 'offer' | 'accept' | 'reject' | null = null;

  priceDraft: Record<string, number | null> = {};
  offerTotal: number | null = null;
  offerNotes = '';
  offerValidUntil = '';

  showReject = false;
  rejectReason = '';
  showAccept = false;

  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'الكل' },
    { key: 'pending', label: 'بانتظار التسعير' },
    { key: 'offered', label: 'تم إرسال العرض' },
    { key: 'accepted', label: 'مقبولة' },
    { key: 'rejected', label: 'مرفوضة' },
    { key: 'ordered', label: 'تحوّلت لطلب' },
    { key: 'expired', label: 'منتهية' },
  ];

  stats: StatCardData[] = [
    { title: 'طلبات التسعير', value: 0, change: 'كل الطلبات', changeType: 'neutral', icon: 'request_quote', animate: true },
    { title: 'بانتظار التسعير', value: 0, change: 'محتاجة رد', changeType: 'down', icon: 'hourglass_top', animate: true },
    { title: 'عروض مرسلة', value: 0, change: 'مستنية رد العميل', changeType: 'neutral', icon: 'outgoing_mail', animate: true },
    { title: 'عروض مقبولة', value: 0, change: 'مقبولة أو اتحولت لطلب', changeType: 'up', icon: 'task_alt', animate: true },
  ];

  constructor(
    private service: QuotationsService,
    private materialLists: MaterialListsService,
    private animation: AnimationService,
    private host: ElementRef,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.animation.fadeUpStagger(this.host.nativeElement.querySelectorAll('.anim-item')), 80);
  }

  load(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (list) => {
        this.requests = [...list].sort((a, b) => this.time(b.createdAt) - this.time(a.createdAt));
        this.afterLoad();
      },
      error: (err) => {
        this.requests = [];
        this.afterLoad();
        this.toast.error(err?.status === 401 ? 'سجّل الدخول بحساب أدمن' : apiErrorMessage(err, 'فشل تحميل طلبات التسعير'));
      },
    });
  }

  private afterLoad(): void {
    this.loading = false;
    this.applyFilter();
    this.refreshStats();
    setTimeout(() => this.animation.fadeUpStagger(this.host.nativeElement.querySelectorAll('.q-card')), 30);
  }

  refreshStats(): void {
    const count = (...s: QuotationStatus[]) => this.requests.filter((r) => s.includes(r.status)).length;
    this.stats = [
      { ...this.stats[0], value: this.requests.length },
      { ...this.stats[1], value: count('pending') },
      { ...this.stats[2], value: count('offered') },
      { ...this.stats[3], value: count('accepted', 'ordered') },
    ];
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filtered = this.requests.filter((r) => {
      if (this.tab !== 'all' && r.status !== this.tab) return false;
      if (!term) return true;
      return [r.number, r.customerName, r.customerPhone, r.materialListName, r.notes, ...r.items.map((i) => i.productName)]
        .map((v) => String(v || '').toLowerCase())
        .some((v) => v.includes(term));
    });
  }

  setTab(tab: Tab): void {
    this.tab = tab;
    this.applyFilter();
  }

  tabCount(tab: Tab): number {
    return tab === 'all' ? this.requests.length : this.requests.filter((r) => r.status === tab).length;
  }

  get visibleTabs(): { key: Tab; label: string }[] {
    return this.tabs.filter((t) => t.key === 'all' || t.key === 'pending' || t.key === 'offered' || this.tabCount(t.key) > 0);
  }

  statusLabel(s: QuotationStatus): string {
    return STATUS_META[s]?.label || s;
  }

  statusBadge(s: QuotationStatus): string {
    return STATUS_META[s]?.badge || 'pending';
  }

  typeLabel(q: QuotationRequest): string {
    return q.type === 'files' ? 'ملفات مرفوعة' : q.type === 'materialList' ? 'قائمة مواد' : 'منتجات';
  }

  typeIcon(q: QuotationRequest): string {
    return q.type === 'files' ? 'attach_file' : q.type === 'materialList' ? 'list_alt' : 'shopping_basket';
  }

  customerKind(q: QuotationRequest): string {
    return q.isTrader ? 'تاجر' : 'مستخدم';
  }

  initial(name?: string): string {
    return (name || 'ع').replace(/[.\s]/g, '').charAt(0) || 'ع';
  }

  money(value?: number | null): string {
    if (value === null || value === undefined) return '—';
    return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} ر.س`;
  }

  displayDate(value?: string): string {
    if (!value) return '—';
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  relative(value?: string): string {
    const t = this.time(value);
    if (!t) return '';
    const mins = Math.round((Date.now() - t) / 60000);
    if (mins < 1) return 'دلوقتي';
    if (mins < 60) return `من ${mins} دقيقة`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `من ${hours} ساعة`;
    const days = Math.round(hours / 24);
    return days < 30 ? `من ${days} يوم` : this.displayDate(value);
  }

  fileUrl(f: QuotationFile): string {
    if (!f.url || /^(https?:|data:|blob:)/i.test(f.url)) return f.url;
    return `${environment.apiUrl}${f.url.startsWith('/') ? '' : '/'}${f.url}`;
  }

  /* ------------ تفاصيل الطلب ------------ */

  open(q: QuotationRequest): void {
    this.selected = q;
    this.initDraft(q);
    this.showDetail = true;
    this.detailLoading = true;
    this.service.getById(q.id).subscribe({
      next: (full) => {
        const merged: QuotationRequest = {
          ...q,
          ...full,
          customerName: full.customerName !== 'عميل' ? full.customerName : q.customerName,
          items: full.items.length ? full.items : q.items,
          files: full.files.length ? full.files : q.files,
          offers: full.offers.length ? full.offers : q.offers,
        };
        this.applyDetail(merged);
        if (!merged.items.length && merged.materialListId) this.loadListItems(merged);
        else this.detailLoading = false;
      },
      error: () => {
        if (q.materialListId && !q.items.length) this.loadListItems(q);
        else this.detailLoading = false;
      },
    });
  }

  private applyDetail(q: QuotationRequest): void {
    this.selected = q;
    this.requests = this.requests.map((r) => (r.id === q.id ? q : r));
    this.initDraft(q);
  }

  /** طلب من قائمة مواد والـ API مرجعش الأصناف: نجيبها من القائمة نفسها */
  private loadListItems(q: QuotationRequest): void {
    this.materialLists.getById(q.materialListId!).subscribe({
      next: (list) => {
        const items: QuotationItem[] = (list.items || []).map((i) => ({
          id: i.id,
          productId: i.productId,
          productName: i.productName || `منتج #${i.productId}`,
          productSku: i.productSku,
          unit: i.unit,
          quantity: i.quantity,
          listPrice: i.price,
          notes: i.notes,
        }));
        if (this.selected?.id === q.id && items.length) this.applyDetail({ ...q, items });
        this.detailLoading = false;
      },
      error: () => (this.detailLoading = false),
    });
  }

  closeDetail(): void {
    this.showDetail = false;
    this.acting = null;
  }

  private initDraft(q: QuotationRequest): void {
    this.priceDraft = {};
    q.items.forEach((i) => (this.priceDraft[i.id] = i.offeredPrice ?? i.requestedPrice ?? i.listPrice ?? null));
    this.offerTotal = q.offeredTotal ?? q.requestedTotal ?? null;
    this.offerNotes = '';
    this.offerValidUntil = this.daysFromNow(7);
  }

  readonly validityOptions = [3, 7, 14, 30];

  get today(): string {
    return this.daysFromNow(0);
  }

  daysFromNow(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  canPrice(q: QuotationRequest | null): boolean {
    return !!q && ['pending', 'offered', 'expired'].includes(q.status);
  }

  /** الموافقة متاحة لما آخر عرض على الطلب يكون من العميل */
  canAcceptRequested(q: QuotationRequest | null): boolean {
    if (!q || q.requestedTotal == null || !['pending', 'offered'].includes(q.status)) return false;
    return q.currentOfferBy ? q.currentOfferBy === 'customer' : q.status === 'pending';
  }

  waitingCustomer(q: QuotationRequest | null): boolean {
    return !!q && q.status === 'offered' && q.currentOfferBy === 'admin';
  }

  hasOriginalPrices(q: QuotationRequest | null): boolean {
    return !!q && q.items.some((i) => i.originalPrice != null);
  }

  availabilityLabel(item: QuotationItem): string {
    if (item.availability === 'unavailable') return 'غير متوفر';
    if (item.availability === 'partial') return `متوفر ${item.availableQuantity ?? 0} بس`;
    return '';
  }

  /** يوزّع سعر العميل على الأصناف بنفس نسبة أسعار الكتالوج */
  matchCustomerTotal(): void {
    const q = this.selected;
    if (!q?.requestedTotal) return;
    const base = q.items.reduce((s, i) => s + (i.listPrice || 0) * i.quantity, 0);
    if (!base) return;
    const ratio = q.requestedTotal / base;
    q.items.forEach((i) => {
      if (i.listPrice != null) this.priceDraft[i.id] = Math.round(i.listPrice * ratio * 100) / 100;
    });
  }

  canReject(q: QuotationRequest | null): boolean {
    return !!q && ['pending', 'offered'].includes(q.status);
  }

  hasRequestedPrices(q: QuotationRequest | null): boolean {
    return !!q && q.items.some((i) => i.requestedPrice != null);
  }

  hasListPrices(q: QuotationRequest | null): boolean {
    return !!q && q.items.some((i) => i.listPrice != null);
  }

  lineTotal(item: QuotationItem): number {
    return (Number(this.priceDraft[item.id]) || 0) * (item.quantity || 0);
  }

  listTotal(q: QuotationRequest | null): number | null {
    if (!q) return null;
    if (q.catalogTotal != null) return q.catalogTotal;
    if (!this.hasListPrices(q)) return null;
    return q.items.reduce((s, i) => s + (i.listPrice || 0) * i.quantity, 0);
  }

  get draftTotal(): number {
    const q = this.selected;
    if (!q) return 0;
    if (!q.items.length) return Number(this.offerTotal) || 0;
    return q.items.reduce((s, i) => s + this.lineTotal(i), 0);
  }

  /** فرق سعر العميل عن سعر الكتالوج بالنسبة المئوية */
  diffPct(requested?: number, list?: number): number | null {
    if (requested == null || !list) return null;
    return Math.round(((requested - list) / list) * 100);
  }

  fillFrom(source: 'requested' | 'list'): void {
    this.selected?.items.forEach((i) => {
      const v = source === 'requested' ? i.requestedPrice : i.listPrice;
      if (v != null) this.priceDraft[i.id] = v;
    });
  }

  applyDiscount(pct: number): void {
    this.selected?.items.forEach((i) => {
      if (i.listPrice != null) this.priceDraft[i.id] = Math.round(i.listPrice * (1 - pct / 100) * 100) / 100;
    });
  }

  sendOffer(): void {
    const q = this.selected;
    if (!q || this.acting) return;
    const missing = q.items.filter((i) => !(Number(this.priceDraft[i.id]) > 0));
    if (q.items.length && missing.length) {
      this.toast.error(`حدد سعر لكل الأصناف (${missing.length} ناقص)`);
      return;
    }
    if (!(this.draftTotal > 0)) {
      this.toast.error('اكتب إجمالي عرض السعر');
      return;
    }
    this.acting = 'offer';
    this.service
      .sendOffer(q.id, {
        items: q.items.map((i) => ({
          itemId: i.id,
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
          unitPrice: Number(this.priceDraft[i.id]) || 0,
        })),
        totalPrice: Math.round(this.draftTotal * 100) / 100,
        validUntil: this.offerValidUntil ? new Date(`${this.offerValidUntil}T23:59:59`).toISOString() : undefined,
        notes: this.offerNotes.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.acting = null;
          this.toast.success(q.status === 'offered' ? 'تم تحديث عرض السعر' : 'تم إرسال عرض السعر للعميل');
          this.refreshSelected();
        },
        error: (err) => {
          this.acting = null;
          this.toast.error(apiErrorMessage(err, 'فشل إرسال عرض السعر'));
        },
      });
  }

  askAccept(): void {
    this.showAccept = true;
  }

  confirmAccept(): void {
    const q = this.selected;
    if (!q || this.acting) return;
    this.acting = 'accept';
    this.service.accept(q.id).subscribe({
      next: () => {
        this.acting = null;
        this.showAccept = false;
        this.toast.success('تمت الموافقة على السعر المطلوب');
        this.refreshSelected();
      },
      error: (err) => {
        this.acting = null;
        this.toast.error(apiErrorMessage(err, 'فشل قبول الطلب'));
      },
    });
  }

  askReject(): void {
    this.rejectReason = '';
    this.showReject = true;
  }

  confirmReject(): void {
    const q = this.selected;
    if (!q || this.acting) return;
    const reason = this.rejectReason.trim();
    if (reason.length < 3) {
      this.toast.error('اكتب سبب الرفض عشان يوصل للعميل');
      return;
    }
    this.acting = 'reject';
    this.service.reject(q.id, reason).subscribe({
      next: () => {
        this.acting = null;
        this.showReject = false;
        this.toast.success('تم رفض الطلب');
        this.refreshSelected();
      },
      error: (err) => {
        this.acting = null;
        this.toast.error(apiErrorMessage(err, 'فشل رفض الطلب'));
      },
    });
  }

  private refreshSelected(): void {
    const q = this.selected;
    this.load();
    if (q) this.open(q);
  }

  private time(value?: string): number {
    const t = value ? new Date(value).getTime() : 0;
    return isNaN(t) ? 0 : t;
  }
}
