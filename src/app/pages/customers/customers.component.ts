import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { CustomersService } from '../../core/services/data.services';
import { OrdersService } from '../../core/services/orders.service';
import { AnimationService } from '../../core/services/animation.service';
import { Customer, Order, StatCardData, StatusType } from '../../core/models';

export interface CustomerProfile extends Customer {
  orderList: Order[];
  lastItems: string;
}

interface PaymentSlice {
  method: string;
  count: number;
  total: number;
}

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, StatCardComponent, ModalComponent, StatusBadgeComponent],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss'],
})
export class CustomersComponent implements OnInit, AfterViewInit {
  loading = true;
  profiles: CustomerProfile[] = [];
  filtered: CustomerProfile[] = [];
  selected: CustomerProfile | null = null;
  selectedPayments: PaymentSlice[] = [];
  showProfile = false;
  searchTerm = '';
  mobileLimit = 15;
  sortKey: 'spent' | 'orders' | 'recent' = 'spent';
  readonly sortOptions: { key: 'spent' | 'orders' | 'recent'; label: string; icon: string }[] = [
    { key: 'spent', label: 'الأعلى إنفاقاً', icon: 'payments' },
    { key: 'orders', label: 'الأكثر طلبات', icon: 'receipt_long' },
    { key: 'recent', label: 'الأحدث', icon: 'schedule' },
  ];

  stats: StatCardData[] = [
    { title: 'عملاء التطبيق', value: 0, change: 'من طلبات التطبيق', changeType: 'neutral', icon: 'groups', animate: true },
    { title: 'إجمالي الطلبات', value: 0, change: 'عبر التطبيق', changeType: 'neutral', icon: 'local_shipping', animate: true },
    { title: 'إجمالي المدفوعات', value: 0, change: 'من طلبات التطبيق', changeType: 'neutral', icon: 'payments', suffix: ' ر.س', animate: true },
    { title: 'متوسط إنفاق العميل', value: 0, change: 'لكل عميل', changeType: 'neutral', icon: 'monitoring', suffix: ' ر.س', animate: true },
  ];

  constructor(
    private customersService: CustomersService,
    private ordersService: OrdersService,
    private animation: AnimationService,
    private host: ElementRef
  ) {}

  ngOnInit(): void {
    forkJoin({
      customers: this.customersService.getAll(),
      orders: this.ordersService.getAll(),
    }).subscribe(({ customers, orders }) => {
      this.profiles = this.buildProfiles(orders, customers);
      this.applySearch();
      this.refreshStats();
      this.loading = false;
      setTimeout(() => this.animation.fadeUpStagger(this.host.nativeElement.querySelectorAll('.anim-item')), 40);
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.animation.fadeUpStagger(this.host.nativeElement.querySelectorAll('.anim-item')), 80);
  }

  applySearch(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filtered = term
      ? this.profiles.filter((p) =>
          [p.name, p.company, p.phone, p.email, p.city].some((v) => String(v || '').toLowerCase().includes(term))
        )
      : [...this.profiles];
    this.mobileLimit = 15;
  }

  get mobileProfiles(): CustomerProfile[] {
    const list = [...this.filtered];
    if (this.sortKey === 'orders') return list.sort((a, b) => b.orders - a.orders || b.spent - a.spent);
    if (this.sortKey === 'recent') return list.sort((a, b) => this.time(b.lastOrderAt) - this.time(a.lastOrderAt));
    return list;
  }

  setSort(key: 'spent' | 'orders' | 'recent'): void {
    this.sortKey = key;
    this.mobileLimit = 15;
  }

  trackProfile(_: number, p: CustomerProfile): string {
    return p.id;
  }

  shortDate(value?: string): string {
    if (!value || value === '—') return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
  }

  subtitleOf(p: CustomerProfile): string {
    const company = (p.company || '').trim();
    if (company && company !== '—' && company !== p.name.trim()) return company;
    if (p.city && p.city !== '—') return p.city.split(/[،,]/)[0].trim();
    return '';
  }

  subIconOf(p: CustomerProfile): string {
    const company = (p.company || '').trim();
    if (company && company !== '—' && company !== p.name.trim()) return 'apartment';
    return p.city && p.city !== '—' ? 'location_on' : 'smartphone';
  }

  profileSub(p: CustomerProfile): string {
    const company = (p.company || '').trim();
    return company && company !== '—' && company !== p.name.trim() ? company : 'عميل من تطبيق معمار';
  }

  orderStatusLabel(status: StatusType): string {
    const labels: Partial<Record<StatusType, string>> = {
      pending: 'معلق',
      confirmed: 'مؤكد',
      completed: 'تم التسليم',
      cancelled: 'ملغي',
    };
    return labels[status] || '';
  }

  waLink(phone: string): string {
    let digits = (phone || '').replace(/\D/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);
    else if (digits.startsWith('05')) digits = '966' + digits.slice(1);
    return `https://wa.me/${digits}`;
  }

  openProfile(profile: CustomerProfile): void {
    this.selected = profile;
    this.selectedPayments = this.paymentSlices(profile);
    this.showProfile = true;
  }

  closeProfile(): void {
    this.showProfile = false;
  }

  initial(name: string): string {
    const text = (name || '').trim();
    return text ? text.charAt(0) : 'ع';
  }

  displayDate(value?: string): string {
    if (!value || value === '—') return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  paymentSlices(profile: CustomerProfile | null): PaymentSlice[] {
    if (!profile) return [];
    const map = new Map<string, PaymentSlice>();
    profile.orderList.forEach((order) => {
      const method = order.payment && order.payment !== '—' ? order.payment : 'غير محدد';
      const current = map.get(method) || { method, count: 0, total: 0 };
      current.count += 1;
      current.total += order.total || 0;
      map.set(method, current);
    });
    return [...map.values()].sort((a, b) => b.total - a.total);
  }

  lastOrder(profile: CustomerProfile): Order | null {
    return profile.orderList[0] || null;
  }

  statusOf(profile: CustomerProfile): StatusType {
    return profile.orderList.some((o) => o.status !== 'cancelled') ? 'active' : profile.status || 'inactive';
  }

  private buildProfiles(orders: Order[], customers: Customer[]): CustomerProfile[] {
    const grouped = new Map<string, CustomerProfile>();

    orders.forEach((order) => {
      const key = this.orderKey(order);
      const existing = grouped.get(key);
      if (existing) {
        existing.orderList.push(order);
        existing.orders += 1;
        existing.spent += order.total || 0;
        existing.phone = existing.phone && existing.phone !== '—' ? existing.phone : order.phone || existing.phone;
        existing.email = existing.email && existing.email !== '—' ? existing.email : order.email || existing.email;
        existing.company = existing.company && existing.company !== '—' ? existing.company : order.company;
        existing.city = existing.city && existing.city !== '—' ? existing.city : order.location;
        if (this.newer(order.date, existing.lastOrderAt)) {
          existing.lastOrderAt = order.date;
          existing.lastItems = order.items;
        }
        return;
      }
      grouped.set(key, {
        id: order.customerId || key,
        name: order.customer && order.customer !== '—' ? order.customer : order.company || 'عميل التطبيق',
        company: order.company && order.company !== '—' ? order.company : '—',
        phone: order.phone || '—',
        email: order.email || '—',
        city: order.location && order.location !== '—' ? order.location : '—',
        type: 'عميل التطبيق',
        orders: 1,
        spent: order.total || 0,
        status: 'active',
        lastOrderAt: order.date,
        lastItems: order.items,
        orderList: [order],
      });
    });

    customers.forEach((customer) => {
      const key = customer.id || customer.phone || customer.name;
      const existing = grouped.get(key) || [...grouped.values()].find((p) => this.samePerson(p, customer));
      if (existing) {
        existing.name = existing.name !== 'عميل التطبيق' ? existing.name : customer.name;
        existing.company = this.prefer(existing.company, customer.company);
        existing.phone = this.prefer(existing.phone, customer.phone);
        existing.email = this.prefer(existing.email, customer.email);
        existing.city = this.prefer(existing.city, customer.city);
        existing.type = customer.type && customer.type !== '—' ? customer.type : existing.type;
        existing.status = customer.status || existing.status;
        return;
      }
      if (!customer.orders && !customer.spent) return;
      grouped.set(key, {
        ...customer,
        lastOrderAt: customer.lastOrderAt,
        lastItems: '—',
        orderList: [],
      });
    });

    return [...grouped.values()]
      .map((profile) => ({
        ...profile,
        orderList: [...profile.orderList].sort((a, b) => this.time(b.date) - this.time(a.date)),
        orders: profile.orderList.length || profile.orders,
      }))
      .sort((a, b) => b.spent - a.spent || b.orders - a.orders);
  }

  private orderKey(order: Order): string {
    if (order.customerId) return `id:${order.customerId}`;
    if (order.phone) return `phone:${order.phone}`;
    if (order.email) return `email:${order.email.toLowerCase()}`;
    return `name:${(order.customer || order.company || 'unknown').toLowerCase()}`;
  }

  private samePerson(profile: CustomerProfile, customer: Customer): boolean {
    if (profile.id && customer.id && profile.id === customer.id) return true;
    if (profile.phone !== '—' && customer.phone && profile.phone === customer.phone) return true;
    if (profile.email !== '—' && customer.email && profile.email.toLowerCase() === customer.email.toLowerCase()) return true;
    return profile.name === customer.name && profile.company === customer.company;
  }

  private prefer(current: string, next?: string): string {
    if (current && current !== '—') return current;
    return next && next !== '—' ? next : current || '—';
  }

  private newer(date: string, current?: string): boolean {
    if (!current || current === '—') return true;
    return this.time(date) > this.time(current);
  }

  private time(value?: string): number {
    const parsed = value ? new Date(value).getTime() : 0;
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private refreshStats(): void {
    const orders = this.profiles.reduce((sum, p) => sum + p.orders, 0);
    const spent = this.profiles.reduce((sum, p) => sum + p.spent, 0);
    this.stats = [
      { ...this.stats[0], value: this.profiles.length, change: 'من طلبات التطبيق', changeType: 'up' },
      { ...this.stats[1], value: orders, change: 'عبر التطبيق', changeType: 'up' },
      { ...this.stats[2], value: spent, change: 'من طلبات التطبيق', changeType: 'up' },
      {
        ...this.stats[3],
        value: this.profiles.length ? Math.round(spent / this.profiles.length) : 0,
        change: 'لكل عميل',
        changeType: 'up',
      },
    ];
  }
}
