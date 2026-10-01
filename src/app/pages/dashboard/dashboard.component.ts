import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import { catchError, forkJoin, of } from 'rxjs';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { ChartWrapperComponent } from '../../shared/components/chart-wrapper/chart-wrapper.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { CategoriesService, MaterialListsService } from '../../core/services/data.services';
import { OrdersService } from '../../core/services/orders.service';
import { ProductsService } from '../../core/services/products.service';
import { QuotationsService } from '../../core/services/quotations.service';
import { AuthService } from '../../core/services/auth.service';
import { AnimationService } from '../../core/services/animation.service';
import { Category, MaterialList, Order, Product, QuotationRequest, StatCardData } from '../../core/models';

type Period = 'today' | 'week' | 'month';

const STATUS_GROUPS: { key: string; label: string; color: string; match: string[] }[] = [
  { key: 'pending', label: 'معلقة', color: '#C8A24B', match: ['pending'] },
  { key: 'active', label: 'قيد التنفيذ', color: '#2D6A4F', match: ['confirmed', 'processing', 'shipped', 'approved', 'active'] },
  { key: 'done', label: 'مكتملة', color: '#0B4A3A', match: ['completed', 'delivered'] },
  { key: 'cancelled', label: 'ملغية', color: '#E5A3A3', match: ['cancelled', 'rejected'] },
];

const CATEGORY_COLORS = ['#0B4A3A', '#C8A24B', '#2D6A4F', '#95D5B2', '#D4A373', '#ADB5BD'];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatCardComponent, ChartWrapperComponent, StatusBadgeComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  loading = true;
  period: Period = 'month';
  readonly periods: { k: Period; l: string }[] = [
    { k: 'today', l: 'اليوم' },
    { k: 'week', l: '7 أيام' },
    { k: 'month', l: '30 يوم' },
  ];
  readonly compact = typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;

  allOrders: Order[] = [];
  products: Product[] = [];
  categories: Category[] = [];
  quotations: QuotationRequest[] = [];
  recentLists: MaterialList[] = [];

  stats: StatCardData[] = [];
  salesData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  statusData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  statusLegend: { label: string; color: string; count: number }[] = [];
  categoryBars: { name: string; count: number; pct: number; color: string }[] = [];
  topProducts: { name: string; stock: number; image?: string; category: string; price: number }[] = [];
  stockAlerts: { name: string; stock: number; sku?: string }[] = [];

  placeholderStat: StatCardData = { title: '', value: 0, icon: 'payments' };

  /** عدد الطلبات في كل عمود، بيظهر في الـ tooltip */
  private salesCounts: number[] = [];

  readonly salesOptions: ChartConfiguration['options'] = {
    layout: { padding: { top: 8 } },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        rtl: true,
        displayColors: false,
        padding: 10,
        cornerRadius: 10,
        backgroundColor: '#073328',
        titleColor: '#F0D78A',
        titleFont: { family: 'Cairo', weight: 'bold' },
        bodyFont: { family: 'Cairo', size: 13 },
        callbacks: {
          label: (ctx) => [
            `${Number(ctx.parsed.y).toLocaleString('en-US')} ر.س`,
            `${this.salesCounts[ctx.dataIndex] || 0} طلب`,
          ],
        },
      },
    },
    scales: {
      x: {
        reverse: true,
        grid: { display: false },
        border: { color: 'rgba(11,74,58,0.12)' },
        ticks: { font: { family: 'Cairo', size: 11 }, color: '#9ca3af', maxRotation: 0, autoSkipPadding: 14 },
      },
      y: {
        position: 'right',
        beginAtZero: true,
        grace: '10%',
        grid: { color: 'rgba(11,74,58,0.06)' },
        border: { display: false },
        ticks: { font: { family: 'Cairo', size: 11 }, color: '#9ca3af', maxTicksLimit: 5, callback: (v) => this.shortMoney(Number(v)) },
      },
    },
  };

  readonly statusOptions: ChartConfiguration<'doughnut'>['options'] = {
    cutout: '74%',
    plugins: { legend: { display: false }, tooltip: { bodyFont: { family: 'Cairo' } } },
  };

  constructor(
    private ordersService: OrdersService,
    private productsService: ProductsService,
    private categoriesService: CategoriesService,
    private quotationsService: QuotationsService,
    private materialLists: MaterialListsService,
    private auth: AuthService,
    private animation: AnimationService,
    private host: ElementRef
  ) {}

  get staffName(): string {
    return this.auth.staffName;
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 17) return 'نهارك سعيد';
    return 'مساء الخير';
  }

  get todayLabel(): string {
    return new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  get periodLabel(): string {
    return this.period === 'today' ? 'النهارده' : this.period === 'week' ? 'آخر 7 أيام' : 'آخر 30 يوم';
  }

  get periodOrders(): Order[] {
    const from = this.periodStart().getTime();
    return this.allOrders.filter((o) => this.time(o.date) >= from);
  }

  get latestOrders(): Order[] {
    return this.allOrders.slice(0, 6);
  }

  get pendingQuotes(): QuotationRequest[] {
    return this.quotations.filter((q) => q.status === 'pending' || (q.status === 'offered' && q.currentOfferBy === 'customer'));
  }

  get revenue(): number {
    return this.periodOrders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0);
  }

  ngOnInit(): void {
    const safe = <T>(obs: import('rxjs').Observable<T[]>) => obs.pipe(catchError(() => of([] as T[])));
    forkJoin({
      orders: safe(this.ordersService.getAll()),
      products: safe(this.productsService.getAll()),
      categories: safe(this.categoriesService.getAll()),
      quotations: safe(this.quotationsService.getAll()),
      lists: safe(this.materialLists.getAll()),
    }).subscribe(({ orders, products, categories, quotations, lists }) => {
      this.allOrders = [...orders].sort((a, b) => this.time(b.date) - this.time(a.date));
      this.products = products;
      this.categories = categories;
      this.quotations = [...quotations].sort((a, b) => this.time(b.createdAt) - this.time(a.createdAt));
      this.recentLists = lists.slice(0, 4);
      this.buildStatic();
      this.refresh();
      this.loading = false;
      setTimeout(() => this.animation.fadeUpStagger(this.host.nativeElement.querySelectorAll('.anim-late')), 30);
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.animation.fadeUpStagger(this.host.nativeElement.querySelectorAll('.anim-item')), 100);
  }

  setPeriod(p: Period): void {
    if (this.period === p) return;
    this.period = p;
    this.refresh();
  }

  /** الأجزاء اللي بتتغير مع الفترة */
  private refresh(): void {
    const orders = this.periodOrders;
    const pending = orders.filter((o) => o.status === 'pending').length;
    const activeProducts = this.products.filter((p) => p.status === 'active').length;
    const offered = this.quotations.filter((q) => q.status === 'offered' && q.currentOfferBy === 'admin').length;
    this.stats = [
      {
        title: `مبيعات ${this.periodLabel}`,
        value: this.revenue,
        suffix: ' ر.س',
        change: `${orders.filter((o) => o.status !== 'cancelled').length} طلب غير ملغي`,
        changeType: 'up',
        icon: 'payments',
        animate: true,
      },
      {
        title: 'الطلبات',
        value: orders.length,
        change: pending ? `${pending} معلق محتاج متابعة` : 'مفيش طلبات معلقة',
        changeType: pending ? 'down' : 'neutral',
        icon: 'local_shipping',
        animate: true,
      },
      {
        title: 'عروض سعر محتاجة رد',
        value: this.pendingQuotes.length,
        change: `${offered} عرض مستني العميل`,
        changeType: 'neutral',
        icon: 'request_quote',
        animate: true,
      },
      {
        title: 'المنتجات النشطة',
        value: activeProducts,
        change: this.stockAlerts.length ? `${this.stockAlerts.length} مخزونها قليل` : `من ${this.products.length} منتج`,
        changeType: this.stockAlerts.length ? 'down' : 'neutral',
        icon: 'inventory_2',
        animate: true,
      },
    ];
    this.buildSales(orders);
    this.buildStatus(orders);
  }

  private buildSales(orders: Order[]): void {
    const buckets = this.buckets();
    const revenue = buckets.map(() => 0);
    const count = buckets.map(() => 0);
    orders.forEach((o) => {
      const t = this.time(o.date);
      const i = buckets.findIndex((b) => t >= b.from && t < b.to);
      if (i < 0) return;
      count[i]++;
      if (o.status !== 'cancelled') revenue[i] += o.total || 0;
    });
    this.salesCounts = count;
    const peak = Math.max(...revenue);
    this.salesData = {
      labels: buckets.map((b) => b.label),
      datasets: [
        {
          label: 'المبيعات',
          data: revenue,
          backgroundColor: (ctx: { chart: { ctx: CanvasRenderingContext2D; chartArea?: { top: number; bottom: number } }; raw: unknown }) => {
            const area = ctx.chart.chartArea;
            if (!area) return '#0B4A3A';
            const g = ctx.chart.ctx.createLinearGradient(0, area.bottom, 0, area.top);
            const isPeak = peak > 0 && ctx.raw === peak;
            g.addColorStop(0, isPeak ? '#B8923F' : '#13705A');
            g.addColorStop(1, isPeak ? '#F0D78A' : '#0B4A3A');
            return g;
          },
          hoverBackgroundColor: '#C8A24B',
          borderRadius: { topLeft: 8, topRight: 8 },
          borderSkipped: 'bottom',
          barPercentage: 0.7,
          categoryPercentage: 0.8,
          maxBarThickness: this.period === 'month' ? 18 : 34,
          minBarLength: 0,
        },
      ],
    } as unknown as ChartConfiguration['data'];
  }

  private buildStatus(orders: Order[]): void {
    this.statusLegend = STATUS_GROUPS.map((g) => ({
      label: g.label,
      color: g.color,
      count: orders.filter((o) => g.match.includes(String(o.status))).length,
    }));
    this.statusData = {
      labels: this.statusLegend.map((s) => s.label),
      datasets: [
        {
          data: this.statusLegend.some((s) => s.count) ? this.statusLegend.map((s) => s.count) : [1],
          backgroundColor: this.statusLegend.some((s) => s.count) ? this.statusLegend.map((s) => s.color) : ['#EEF2F0'],
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    } as ChartConfiguration['data'];
  }

  /** الأجزاء الثابتة: المنتجات والفئات والتنبيهات */
  private buildStatic(): void {
    this.topProducts = [...this.products]
      .sort((a, b) => (b.stock || 0) - (a.stock || 0))
      .slice(0, 5)
      .map((p) => ({ name: p.name, stock: p.stock ?? 0, image: p.image || p.images?.[0], category: p.category, price: p.price || 0 }));

    this.stockAlerts = this.products
      .filter((p) => p.status === 'active' && (p.stock ?? 0) <= 10)
      .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
      .slice(0, 5)
      .map((p) => ({ name: p.name, stock: p.stock ?? 0, sku: p.sku }));

    const roots = this.categories.filter((c) => !c.parentId);
    const counts = roots
      .map((c) => {
        const ids = new Set([String(c.id), ...this.categories.filter((s) => String(s.parentId) === String(c.id)).map((s) => String(s.id))]);
        return { name: c.name, count: this.products.filter((p) => ids.has(String(p.categoryId))).length };
      })
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
    const max = Math.max(1, ...counts.map((c) => c.count));
    this.categoryBars = counts.map((c, i) => ({ ...c, pct: Math.round((c.count / max) * 100), color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }));
  }

  private periodStart(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    if (this.period === 'week') d.setDate(d.getDate() - 6);
    if (this.period === 'month') d.setDate(d.getDate() - 29);
    return d;
  }

  private buckets(): { from: number; to: number; label: string }[] {
    const start = this.periodStart();
    if (this.period === 'today') {
      return Array.from({ length: 12 }, (_, i) => {
        const from = new Date(start);
        from.setHours(i * 2);
        return { from: from.getTime(), to: from.getTime() + 2 * 3600_000, label: `${i * 2}:00` };
      });
    }
    const days = this.period === 'week' ? 7 : 30;
    return Array.from({ length: days }, (_, i) => {
      const from = new Date(start);
      from.setDate(start.getDate() + i);
      const to = new Date(from);
      to.setDate(from.getDate() + 1);
      const label =
        this.period === 'week'
          ? from.toLocaleDateString('ar-EG', { weekday: 'short' })
          : from.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
      return { from: from.getTime(), to: to.getTime(), label };
    });
  }

  quoteAmount(q: QuotationRequest): number | undefined {
    return q.requestedTotal ?? q.catalogTotal;
  }

  relative(value?: string): string {
    const t = this.time(value);
    if (!t) return '';
    const mins = Math.round((Date.now() - t) / 60000);
    if (mins < 60) return `من ${Math.max(mins, 1)} دقيقة`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `من ${hours} ساعة`;
    return `من ${Math.round(hours / 24)} يوم`;
  }

  initial(name?: string): string {
    return (name || '؟').trim().charAt(0) || '؟';
  }

  shortMoney(v: number): string {
    if (v >= 1_000_000) return `${+(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1000) return `${+(v / 1000).toFixed(1)}K`;
    return String(v);
  }

  private time(value?: string): number {
    const t = value ? new Date(value).getTime() : 0;
    return isNaN(t) ? 0 : t;
  }
}
