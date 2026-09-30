import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { ChartWrapperComponent } from '../../shared/components/chart-wrapper/chart-wrapper.component';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { SelectComponent, SelectOption } from '../../shared/components/select/select.component';
import { AnimationService } from '../../core/services/animation.service';
import { ToastService } from '../../core/services/toast.service';
import { BrandsService, CategoriesService } from '../../core/services/data.services';
import { ProductsService } from '../../core/services/products.service';
import { StatCardData, TableColumn } from '../../core/models';
import { REPORTS_BAR_DATA, CATEGORY_CHART_DATA } from '../../core/data/mock-data';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StatCardComponent,
    ChartWrapperComponent,
    DataTableComponent,
    ModalComponent,
    SelectComponent,
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit, AfterViewInit {
  barData = REPORTS_BAR_DATA;
  doughnutData = CATEGORY_CHART_DATA;
  showSchedule = false;
  showExport = false;
  isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;

  stats: StatCardData[] = [
    { title: 'قيمة المخزون', value: 0, change: 'من Products', changeType: 'neutral', icon: 'scale', suffix: ' ر.س', animate: true },
    { title: 'متوسط سعر المنتج', value: 0, change: 'من Products', changeType: 'neutral', icon: 'payments', suffix: ' ر.س', animate: true },
    { title: 'إجمالي المخزون', value: 0, change: 'وحدة', changeType: 'neutral', icon: 'autorenew', animate: true },
    { title: 'البراندات النشطة', value: 0, change: 'من Brands', changeType: 'neutral', icon: 'sentiment_satisfied', animate: true },
  ];

  regions: { name: string; pct: number }[] = [];

  topCustomers: {
    name: string;
    type: string;
    orders: number;
    spent: number;
    payment: string;
    status: string;
    image?: string;
  }[] = [];

  columns: TableColumn[] = [
    { key: 'image', label: 'الصورة', type: 'image', width: '72px' },
    { key: 'name', label: 'البراند', sortable: true },
    { key: 'type', label: 'الدولة' },
    { key: 'orders', label: 'منتجات', sortable: true },
    { key: 'spent', label: 'قيمة تقديرية', type: 'currency', sortable: true },
    { key: 'payment', label: 'الحالة' },
    { key: 'status', label: 'الظهور', type: 'status' },
  ];

  reportTypeOptions: SelectOption[] = [
    { value: 'sales', label: 'المبيعات مقابل التكاليف' },
    { value: 'inventory', label: 'دوران المخزون والمستودعات' },
    { value: 'customers', label: 'كبار العملاء والمقاولين' },
    { value: 'geo', label: 'التوزيع الجغرافي' },
    { value: 'fleet', label: 'جاهزية الأسطول' },
    { value: 'full', label: 'تقرير تنفيذي شامل' },
  ];

  frequencyOptions: SelectOption[] = [
    { value: 'daily', label: 'يومياً' },
    { value: 'weekly', label: 'أسبوعياً' },
    { value: 'monthly', label: 'شهرياً' },
    { value: 'quarterly', label: 'ربع سنوي' },
  ];

  formatOptions: SelectOption[] = [
    { value: 'pdf', label: 'PDF' },
    { value: 'excel', label: 'Excel' },
    { value: 'both', label: 'PDF + Excel' },
  ];

  dayOptions: SelectOption[] = [
    { value: 'sunday', label: 'الأحد' },
    { value: 'monday', label: 'الإثنين' },
    { value: 'tuesday', label: 'الثلاثاء' },
    { value: 'wednesday', label: 'الأربعاء' },
    { value: 'thursday', label: 'الخميس' },
  ];

  scheduleForm = this.fb.group({
    reportType: ['sales', Validators.required],
    frequency: ['weekly', Validators.required],
    format: ['pdf', Validators.required],
    weekday: ['sunday'],
    time: ['08:00', Validators.required],
    startDate: [new Date().toISOString().slice(0, 10), Validators.required],
    email: ['abdulrahman@mimar.sa', [Validators.required, Validators.email]],
    cc: [''],
    notes: [''],
  });

  exportForm = this.fb.group({
    reportType: ['full', Validators.required],
    format: ['both', Validators.required],
    range: ['last30', Validators.required],
  });

  rangeOptions: SelectOption[] = [
    { value: 'last7', label: 'آخر 7 أيام' },
    { value: 'last30', label: 'آخر 30 يوم' },
    { value: 'quarter', label: 'الربع الحالي' },
    { value: 'year', label: 'منذ بداية السنة' },
  ];

  scheduledJobs: { title: string; freq: string; format: string; to: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private animation: AnimationService,
    private host: ElementRef,
    private toast: ToastService,
    private products: ProductsService,
    private brands: BrandsService,
    private categories: CategoriesService,
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
    forkJoin({
      products: this.products.getAll(),
      brands: this.brands.getAll(),
      categories: this.categories.getAll(),
    }).subscribe(({ products, brands, categories }) => {
      const inventoryValue = products.reduce((s, p) => s + (p.price || 0) * (p.stock || 0), 0);
      const avgPrice =
        products.length > 0 ? Math.round(products.reduce((s, p) => s + (p.price || 0), 0) / products.length) : 0;
      const stockUnits = products.reduce((s, p) => s + (p.stock || 0), 0);
      this.stats = [
        { ...this.stats[0], value: Math.round(inventoryValue) },
        { ...this.stats[1], value: avgPrice },
        { ...this.stats[2], value: stockUnits },
        { ...this.stats[3], value: brands.filter((b) => b.status === 'active').length },
      ];

      const roots = categories.filter((c) => !c.parentId);
      const counts = roots.map(
        (c) =>
          products.filter(
            (p) =>
              p.categoryId === c.id ||
              categories.some((sub) => sub.parentId === c.id && p.categoryId === sub.id)
          ).length
      );
      const total = counts.reduce((a, b) => a + b, 0) || 1;
      this.regions = roots.map((c, i) => ({
        name: c.name,
        pct: Math.round((counts[i] / total) * 100),
      }));
      this.doughnutData = {
        ...CATEGORY_CHART_DATA,
        labels: roots.map((c) => c.name),
        datasets: [{ ...CATEGORY_CHART_DATA.datasets[0], data: counts }],
      };
      this.barData = {
        ...REPORTS_BAR_DATA,
        labels: brands.map((b) => b.name),
        datasets: [
          {
            ...REPORTS_BAR_DATA.datasets[0],
            label: 'منتجات البراند',
            data: brands.map((b) => products.filter((p) => p.brandId === b.id || p.brand === b.name).length),
          },
        ],
      };
      this.topCustomers = brands
        .map((b) => {
          const brandProducts = products.filter((p) => p.brandId === b.id || p.brand === b.name);
          return {
            name: b.name,
            type: b.country || '—',
            orders: brandProducts.length,
            spent: brandProducts.reduce((s, p) => s + (p.price || 0) * (p.stock || 0), 0),
            payment: b.status === 'active' ? 'نشط' : 'موقوف',
            status: b.status,
            image: b.image || brandProducts.find((p) => p.image)?.image,
          };
        })
        .sort((a, b) => b.spent - a.spent);
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.animation.fadeUpStagger(this.host.nativeElement.querySelectorAll('.anim-item')), 80);
  }

  openSchedule(): void {
    this.scheduleForm.reset({
      reportType: 'sales',
      frequency: 'weekly',
      format: 'pdf',
      weekday: 'sunday',
      time: '08:00',
      startDate: new Date().toISOString().slice(0, 10),
      email: 'abdulrahman@mimar.sa',
      cc: '',
      notes: '',
    });
    this.showSchedule = true;
  }

  openExport(): void {
    this.exportForm.reset({
      reportType: 'full',
      format: 'both',
      range: 'last30',
    });
    this.showExport = true;
  }

  err(control: string): boolean {
    const c = this.scheduleForm.get(control);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  get showWeekday(): boolean {
    return this.scheduleForm.value.frequency === 'weekly';
  }

  saveSchedule(): void {
    if (this.scheduleForm.invalid) {
      this.scheduleForm.markAllAsTouched();
      this.toast.error('أكمل بيانات الجدولة');
      return;
    }
    const v = this.scheduleForm.getRawValue();
    const typeLabel = this.reportTypeOptions.find((o) => o.value === v.reportType)?.label || 'تقرير';
    const freqLabel = this.frequencyOptions.find((o) => o.value === v.frequency)?.label || '';
    this.scheduledJobs = [
      {
        title: typeLabel,
        freq: `${freqLabel} · ${v.time}`,
        format: String(v.format || 'PDF').toUpperCase(),
        to: v.email || '',
      },
      ...this.scheduledJobs,
    ];
    this.showSchedule = false;
    this.toast.success('تم جدولة التقرير بنجاح');
  }

  confirmExport(): void {
    if (this.exportForm.invalid) {
      this.exportForm.markAllAsTouched();
      return;
    }
    const format = this.exportForm.value.format;
    this.showExport = false;
    this.toast.success(format === 'excel' ? 'جاري تجهيز ملف Excel...' : format === 'pdf' ? 'جاري تجهيز ملف PDF...' : 'جاري تصدير PDF و Excel...');
  }

  removeJob(index: number): void {
    this.scheduledJobs = this.scheduledJobs.filter((_, i) => i !== index);
    this.toast.info('تم إيقاف الجدولة');
  }
}
