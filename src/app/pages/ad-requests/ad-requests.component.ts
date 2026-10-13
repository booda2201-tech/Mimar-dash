import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { AdRequestsService } from '../../core/services/ad-requests.service';
import { AnimationService } from '../../core/services/animation.service';
import { ToastService } from '../../core/services/toast.service';
import { AD_STATUS_LABELS, AdLink, AdRequestItem, AdStatus, adLinksOf } from '../../core/models';

type StatusFilter = 'all' | AdStatus;
type LiveState = 'live' | 'expired';

const QUICK_REASONS = [
  'جودة الصورة ضعيفة أو المقاس غير مناسب للتطبيق',
  'المحتوى مخالف لسياسة الإعلانات في معمار',
  'الروابط المرفقة لا تعمل أو غير آمنة',
  'لا توجد مساحة إعلانية متاحة خلال الفترة دي',
  'بيانات الشركة غير مكتملة أو غير موثقة',
];

const MAX_IMAGE_MB = 5;

@Component({
  selector: 'app-ad-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, ModalComponent],
  templateUrl: './ad-requests.component.html',
  styleUrls: ['./ad-requests.component.scss'],
})
export class AdRequestsComponent implements OnInit, AfterViewInit {
  loading = true;
  saving = false;
  uploading = false;
  requests: AdRequestItem[] = [];

  search = '';
  statusFilter: StatusFilter = 'pending';

  selected: AdRequestItem | null = null;
  showReview = false;
  showApprove = false;
  showReject = false;
  imageZoom = false;
  showOriginal = false;

  readonly statusLabels = AD_STATUS_LABELS;
  readonly quickReasons = QUICK_REASONS;
  readonly reasonMax = 400;
  readonly durationPresets = [7, 14, 30, 60, 90];

  readonly statusFilters: { key: StatusFilter; label: string; icon: string }[] = [
    { key: 'pending', label: 'بانتظار المراجعة', icon: 'hourglass_top' },
    { key: 'approved', label: 'معتمد', icon: 'verified' },
    { key: 'rejected', label: 'مرفوض', icon: 'block' },
    { key: 'all', label: 'الكل', icon: 'apps' },
  ];

  approveForm = this.fb.group({
    activeUntil: this.fb.nonNullable.control('', Validators.required),
  });

  rejectForm = this.fb.group({
    reason: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(10), Validators.maxLength(this.reasonMax)]),
  });

  constructor(
    private service: AdRequestsService,
    private fb: FormBuilder,
    private animation: AnimationService,
    private host: ElementRef<HTMLElement>,
    private toast: ToastService,
    private location: Location,
    private router: Router
  ) {}

  get demoMode(): boolean {
    return this.service.demoMode;
  }

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.animation.fadeUpStagger(Array.from(this.host.nativeElement.querySelectorAll('.anim-item'))), 60);
  }

  load(): void {
    this.loading = true;
    this.service.getAll().subscribe((list) => {
      this.requests = list;
      this.loading = false;
      if (!this.countOf('pending') && this.statusFilter === 'pending') this.statusFilter = 'all';
      if (this.selected) this.selected = list.find((r) => r.id === this.selected?.id) || null;
      this.animateRows();
    });
  }

  get showSamples(): boolean {
    return this.service.showSamples;
  }

  get sampleCount(): number {
    return this.requests.filter((r) => this.service.isSample(r)).length;
  }

  isSample(item: AdRequestItem): boolean {
    return this.service.isSample(item);
  }

  toggleSamples(): void {
    this.service.showSamples = !this.service.showSamples;
    this.toast.info(this.service.showSamples ? 'ظهرت الطلبات التجريبية' : 'اتخفت الطلبات التجريبية');
    this.load();
  }

  resetDemo(): void {
    const live = this.requests.filter((r) => !this.service.isSample(r));
    this.requests = [...live, ...this.service.resetDemo()];
    this.statusFilter = 'pending';
    this.toast.info('رجّعنا الطلبات التجريبية لحالتها الأولى');
    this.animateRows();
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
    this.router.navigateByUrl('/offers');
  }

  countOf(status: StatusFilter): number {
    return status === 'all' ? this.requests.length : this.requests.filter((r) => r.status === status).length;
  }

  get liveCount(): number {
    return this.requests.filter((r) => this.liveState(r) === 'live').length;
  }

  get visible(): AdRequestItem[] {
    const q = this.search.trim().toLowerCase();
    return this.requests
      .filter((r) => this.statusFilter === 'all' || r.status === this.statusFilter)
      .filter(
        (r) =>
          !q ||
          [r.trackingCode, r.companyName, r.applicantName, r.merchantPhone, r.adTitle].some((v) => (v || '').toLowerCase().includes(q))
      )
      .sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }

  get hasFilters(): boolean {
    return !!this.search.trim();
  }

  clearFilters(): void {
    this.search = '';
  }

  setStatus(key: StatusFilter): void {
    if (this.statusFilter === key) return;
    this.statusFilter = key;
    this.animateRows();
  }

  trackById(_: number, item: AdRequestItem): string {
    return item.id;
  }

  linksOf(item: AdRequestItem): AdLink[] {
    return adLinksOf(item);
  }

  whatsappOf(item: AdRequestItem): string {
    const digits = item.merchantPhone.replace(/\D/g, '');
    return `https://wa.me/${digits.length === 8 ? `965${digits}` : digits}`;
  }

  liveState(item: AdRequestItem): LiveState | null {
    if (item.status !== 'approved') return null;
    if (item.activeUntil && item.activeUntil < this.today()) return 'expired';
    return 'live';
  }

  liveLabel(item: AdRequestItem): string {
    const state = this.liveState(item);
    if (state === 'expired') return 'انتهت مدته';
    if (state === 'live') {
      if (!item.activeUntil) return 'ظاهر بدون تاريخ انتهاء';
      const left = this.daysBetween(this.today(), item.activeUntil) + 1;
      return left === 1 ? 'ظاهر · آخر يوم النهارده' : `ظاهر · فاضل ${left} يوم`;
    }
    return '';
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  timeAgo(value: string): string {
    const diff = Date.now() - new Date(value).getTime();
    const mins = Math.max(0, Math.round(diff / 60000));
    if (mins < 60) return mins <= 1 ? 'دلوقتي' : `من ${mins} دقيقة`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `من ${hours} ساعة`;
    const days = Math.round(hours / 24);
    return days === 1 ? 'إمبارح' : `من ${days} يوم`;
  }

  copyCode(item: AdRequestItem, event?: Event): void {
    event?.stopPropagation();
    navigator.clipboard?.writeText(item.trackingCode).then(
      () => this.toast.success(`اتنسخ الكود ${item.trackingCode}`),
      () => this.toast.error('مقدرناش ننسخ الكود')
    );
  }

  // ───── Review ─────

  openReview(item: AdRequestItem): void {
    this.selected = item;
    this.imageZoom = false;
    this.showOriginal = false;
    this.showReview = true;
  }

  closeReview(): void {
    this.showReview = false;
    this.imageZoom = false;
  }

  reviewImage(item: AdRequestItem): string {
    return this.showOriginal ? item.imageUrl || item.bannerUrl : item.bannerUrl;
  }

  onDisplayImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    const item = this.selected;
    if (!file || !item || this.uploading) return;
    if (!file.type.startsWith('image/')) {
      this.toast.error('اختار ملف صورة (JPG أو PNG أو WEBP)');
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      this.toast.error(`حجم الصورة لازم يكون أقل من ${MAX_IMAGE_MB} ميجا`);
      return;
    }
    this.uploading = true;
    const reader = new FileReader();
    reader.onload = () => {
      this.service.uploadDisplayImage(item, file, String(reader.result)).subscribe({
        next: (updated) => {
          this.uploading = false;
          this.showOriginal = false;
          this.replace(updated);
          this.toast.success('اترفعت صورة العرض');
        },
        error: (e) => {
          this.uploading = false;
          this.fail(e, 'فشل رفع صورة العرض');
        },
      });
    };
    reader.onerror = () => {
      this.uploading = false;
      this.toast.error('مقدرناش نقرا الصورة');
    };
    reader.readAsDataURL(file);
  }

  // ───── Approve ─────

  openApprove(item: AdRequestItem): void {
    this.selected = item;
    this.showReview = false;
    const current = item.activeUntil && item.activeUntil >= this.today() ? item.activeUntil : this.addDays(this.today(), 29);
    this.approveForm.reset({ activeUntil: current });
    this.showApprove = true;
  }

  get minDate(): string {
    return this.today();
  }

  get approvedDays(): number {
    const until = this.approveForm.controls.activeUntil.value;
    return until && until >= this.today() ? this.daysBetween(this.today(), until) + 1 : 0;
  }

  applyPreset(days: number): void {
    const c = this.approveForm.controls.activeUntil;
    c.setValue(this.addDays(this.today(), days - 1));
    c.markAsDirty();
  }

  isPreset(days: number): boolean {
    return this.approvedDays === days;
  }

  get untilInvalid(): boolean {
    const c = this.approveForm.controls.activeUntil;
    return (c.invalid || (!!c.value && c.value < this.today())) && (c.dirty || c.touched);
  }

  submitApprove(): void {
    const item = this.selected;
    if (!item || this.saving) return;
    const until = this.approveForm.controls.activeUntil.value;
    if (this.approveForm.invalid || until < this.today()) {
      this.approveForm.markAllAsTouched();
      this.toast.error('اختار تاريخ انتهاء من النهارده أو بعده');
      return;
    }
    this.saving = true;
    this.service.approve(item, { activeUntil: until }).subscribe({
      next: (updated) => {
        this.saving = false;
        this.showApprove = false;
        this.replace(updated);
        this.toast.success(`تم اعتماد إعلان ${updated.trackingCode}`);
      },
      error: (e) => this.fail(e, 'فشل اعتماد الإعلان'),
    });
  }

  // ───── Reject ─────

  openReject(item: AdRequestItem): void {
    this.selected = item;
    this.showReview = false;
    this.rejectForm.reset({ reason: item.rejectionReason || '' });
    this.showReject = true;
  }

  get reasonLength(): number {
    return this.rejectForm.controls.reason.value.length;
  }

  useReason(reason: string): void {
    const c = this.rejectForm.controls.reason;
    const current = c.value.trim();
    if (current.includes(reason)) return;
    c.setValue((current ? `${current}\n${reason}` : reason).slice(0, this.reasonMax));
    c.markAsDirty();
  }

  isReasonUsed(reason: string): boolean {
    return this.rejectForm.controls.reason.value.includes(reason);
  }

  submitReject(): void {
    const item = this.selected;
    if (!item || this.saving) return;
    if (this.rejectForm.invalid) {
      this.rejectForm.markAllAsTouched();
      this.toast.error('اكتب سبب واضح للرفض (10 حروف على الأقل)');
      return;
    }
    this.saving = true;
    this.service.reject(item, this.rejectForm.controls.reason.value.trim()).subscribe({
      next: (updated) => {
        this.saving = false;
        this.showReject = false;
        this.replace(updated);
        this.toast.success(`تم رفض ${updated.trackingCode} وإبلاغ التاجر بالسبب`);
      },
      error: (e) => this.fail(e, 'فشل رفض الإعلان'),
    });
  }

  // ───── Helpers ─────

  private replace(updated: AdRequestItem): void {
    this.requests = this.requests.map((r) => (r.id === updated.id ? updated : r));
    this.selected = updated;
  }

  private fail(e: { status?: number; error?: { message?: unknown; errors?: unknown } }, fallback: string): void {
    this.saving = false;
    const errors = e?.error?.errors;
    const first = Array.isArray(errors)
      ? errors[0]
      : errors && typeof errors === 'object'
        ? Object.values(errors as Record<string, unknown[]>)[0]?.[0]
        : undefined;
    const msg = first ?? e?.error?.message;
    this.toast.error(e?.status === 401 ? 'سجّل دخول تاني — الجلسة انتهت' : typeof msg === 'string' && msg ? msg : fallback);
  }

  private animateRows(): void {
    setTimeout(() => this.animation.fadeUpStagger(Array.from(this.host.nativeElement.querySelectorAll('.ar-row'))), 20);
  }

  private today(): string {
    return this.toIso(new Date());
  }

  private addDays(iso: string, days: number): string {
    const d = new Date(`${iso}T00:00:00`);
    d.setDate(d.getDate() + days);
    return this.toIso(d);
  }

  private daysBetween(from: string, to: string): number {
    return Math.round((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86400000);
  }

  private toIso(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
