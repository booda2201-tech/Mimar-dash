import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { ChartWrapperComponent } from '../../shared/components/chart-wrapper/chart-wrapper.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { CategoriesService, DashboardService, MaterialListsService } from '../../core/services/data.services';
import { OrdersService } from '../../core/services/orders.service';
import { ProductsService } from '../../core/services/products.service';
import { AuthService } from '../../core/services/auth.service';
import { AnimationService } from '../../core/services/animation.service';
import { StatCardData, Order, MaterialList } from '../../core/models';
import { SALES_CHART_DATA, CATEGORY_CHART_DATA } from '../../core/data/mock-data';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatCardComponent, ChartWrapperComponent, StatusBadgeComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  loading = true;
  stats: StatCardData[] = [];
  orders: Order[] = [];
  recentLists: MaterialList[] = [];
  salesData = SALES_CHART_DATA;
  categoryData = CATEGORY_CHART_DATA;
  period: 'today' | 'week' | 'month' = 'today';
  readonly compact = typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;
  placeholderStat: StatCardData = {
    title: '',
    value: 0,
    icon: 'payments',
  };

  lineOptions: ChartConfiguration['options'] = {
    plugins: {
      legend: { display: false },
    },
    elements: {
      line: { borderWidth: 3, tension: 0.45 },
      point: { radius: 3, hoverRadius: 5, backgroundColor: '#C8A24B', borderColor: '#fff', borderWidth: 2 },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Cairo', size: 11 } } },
      y: {
        grid: { color: 'rgba(11,74,58,0.06)' },
        ticks: { font: { family: 'Cairo', size: 11 } },
        border: { display: false },
      },
    },
  };

  doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        rtl: true,
        labels: {
          font: { family: 'Cairo', size: 12, weight: 'bold' },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 14,
        },
      },
    },
  };

  topProducts: {
    name: string;
    stock: number;
    kind: 'new' | 'live' | 'off';
    image?: string;
    category: string;
    price: number;
  }[] = [];
  alerts: { title: string; desc: string; type: string }[] = [];

  constructor(
    private dashboard: DashboardService,
    private ordersService: OrdersService,
    private productsService: ProductsService,
    private categoriesService: CategoriesService,
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

  get ordersTotal(): number {
    return this.orders.reduce((sum, order) => sum + (order.total || 0), 0);
  }

  get pendingOrders(): number {
    return this.orders.filter((order) => order.status === 'pending').length;
  }

  statValue(index: number): number {
    return Number(this.stats[index]?.value || 0);
  }

  ngOnInit(): void {
    this.dashboard.getStats().subscribe((stats) => {
      this.stats = stats;
      this.loading = false;
    });
    this.ordersService.getAll().subscribe((orders) => {
      this.orders = orders.slice(0, 5);
    });
    this.materialLists.getAll().subscribe((lists) => {
      this.recentLists = lists.slice(0, 5);
    });
    forkJoin({
      products: this.productsService.getAll(),
      categories: this.categoriesService.getAll(),
    }).subscribe(({ products, categories }) => {
      this.topProducts = [...products]
        .sort((a, b) => (b.stock || 0) - (a.stock || 0))
        .slice(0, 5)
        .map((p) => ({
          name: p.name,
          stock: p.stock ?? 0,
          image: p.image || p.images?.[0],
          category: p.category,
          price: p.price || 0,
          kind: (p.featured ? 'new' : p.status === 'active' ? 'live' : 'off') as 'new' | 'live' | 'off',
        }));

      this.alerts = products
        .filter((p) => (p.stock ?? 0) <= 5)
        .slice(0, 5)
        .map((p) => ({
          title: (p.stock ?? 0) <= 0 ? `نفاد: ${p.name}` : `مخزون منخفض: ${p.name}`,
          desc: `المتبقي ${p.stock ?? 0} · SKU ${p.sku || '—'}`,
          type: (p.stock ?? 0) <= 0 ? 'danger' : 'warning',
        }));

      const roots = categories.filter((c) => !c.parentId);
      const labels = roots.map((c) => c.name);
      const data = roots.map(
        (c) => products.filter((p) => p.categoryId === c.id || categories.some((sub) => sub.parentId === c.id && p.categoryId === sub.id)).length
      );
      this.categoryData = {
        ...CATEGORY_CHART_DATA,
        labels,
        datasets: [{ ...CATEGORY_CHART_DATA.datasets[0], data }],
      };
      this.salesData = { ...SALES_CHART_DATA };
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.animation.fadeUpStagger(this.host.nativeElement.querySelectorAll('.anim-item'));
    }, 100);
  }
}
