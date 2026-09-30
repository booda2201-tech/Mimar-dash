import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { SelectComponent, SelectOption } from '../../../shared/components/select/select.component';
import { ProductsService } from '../../../core/services/products.service';
import { CustomersService } from '../../../core/services/data.services';
import { OrdersService } from '../../../core/services/orders.service';
import { ToastService } from '../../../core/services/toast.service';
import { apiErrorMessage } from '../../../core/services/quotations.service';
import { AdminOrderPayload, Customer, Order, Product, ProductPriceTier, ProductVariant } from '../../../core/models';

interface OrderLine {
  key: number;
  productId: string;
  variantId: string;
  quantity: number;
}

@Component({
  selector: 'app-create-order',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, SelectComponent],
  templateUrl: './create-order.component.html',
  styleUrls: ['./create-order.component.scss'],
})
export class CreateOrderComponent implements OnChanges {
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();
  @Output() created = new EventEmitter<Order>();

  saving = false;
  submitted = false;
  products: Product[] = [];
  customers: Customer[] = [];
  productOptions: SelectOption[] = [];
  customerOptions: SelectOption[] = [];
  pickedCustomer: string | null = null;

  customer = { fullName: '', phoneNumber: '', email: '' };
  address = { governorate: '', city: '', area: '', street: '', buildingNumber: '', floor: '', apartment: '', landmark: '', label: '' };
  notes = '';
  lines: OrderLine[] = [];

  private nextKey = 1;
  private loaded = false;

  constructor(
    private productsService: ProductsService,
    private customersService: CustomersService,
    private orders: OrdersService,
    private toast: ToastService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      this.reset();
      if (!this.loaded) this.loadLookups();
    }
  }

  private loadLookups(): void {
    this.loaded = true;
    this.productsService.getAll().subscribe((list) => {
      this.products = list;
      this.productOptions = list.map((p) => ({
        value: p.id,
        label: p.name,
        display: p.name,
        hint: [p.sku !== '—' ? p.sku : '', this.money(p.price), p.status === 'inactive' ? 'غير نشط' : ''].filter(Boolean).join(' · '),
      }));
    });
    this.customersService.getAll().subscribe((list) => {
      this.customers = list;
      this.customerOptions = list.map((c) => ({
        value: c.id,
        label: c.name,
        hint: c.phone && c.phone !== '—' ? c.phone : undefined,
      }));
    });
  }

  private reset(): void {
    this.saving = false;
    this.submitted = false;
    this.pickedCustomer = null;
    this.customer = { fullName: '', phoneNumber: '', email: '' };
    this.address = { governorate: '', city: '', area: '', street: '', buildingNumber: '', floor: '', apartment: '', landmark: '', label: '' };
    this.notes = '';
    this.lines = [];
    this.addLine();
  }

  close(): void {
    if (this.saving) return;
    this.closed.emit();
  }

  useCustomer(id: string | number | null): void {
    const c = this.customers.find((x) => x.id === String(id));
    if (!c) return;
    this.customer = {
      fullName: c.name,
      phoneNumber: c.phone && c.phone !== '—' ? c.phone : '',
      email: c.email && c.email !== '—' ? c.email : '',
    };
    if (!this.address.city && c.city && c.city !== '—') this.address.city = c.city;
  }

  /* ---------- الأصناف ---------- */

  addLine(): void {
    this.lines = [...this.lines, { key: this.nextKey++, productId: '', variantId: '', quantity: 1 }];
  }

  removeLine(line: OrderLine): void {
    this.lines = this.lines.filter((l) => l.key !== line.key);
  }

  trackLine(_: number, line: OrderLine): number {
    return line.key;
  }

  onProduct(line: OrderLine): void {
    const variants = this.activeVariants(this.product(line));
    line.variantId = variants.length === 1 ? String(variants[0].id) : '';
  }

  step(line: OrderLine, delta: number): void {
    line.quantity = Math.max(1, (Number(line.quantity) || 1) + delta);
  }

  product(line: OrderLine): Product | undefined {
    return line.productId ? this.products.find((p) => p.id === String(line.productId)) : undefined;
  }

  private variant(line: OrderLine): ProductVariant | undefined {
    return line.variantId ? this.product(line)?.variants?.find((v) => String(v.id) === String(line.variantId)) : undefined;
  }

  private activeVariants(p?: Product): ProductVariant[] {
    return (p?.variants || []).filter((v) => v.id && v.isActive !== false);
  }

  variantOptions(line: OrderLine): SelectOption[] {
    return this.activeVariants(this.product(line)).map((v) => ({
      value: String(v.id),
      label: Object.values(v.attrs || {}).filter(Boolean).join(' / ') || v.sku,
      hint: `${this.money(v.finalPrice ?? v.price)} · متاح ${v.stock}`,
    }));
  }

  private tier(line: OrderLine): ProductPriceTier | undefined {
    const p = this.product(line);
    const v = this.variant(line);
    const tiers = v?.priceTiers?.length ? v.priceTiers : p?.priceTiers || [];
    const qty = Number(line.quantity) || 1;
    return tiers.find((t) => qty >= t.minQuantity && (t.maxQuantity == null || qty <= t.maxQuantity));
  }

  tierLabel(line: OrderLine): string {
    const t = this.tier(line);
    if (!t || t.minQuantity <= 1) return '';
    return t.maxQuantity ? `شريحة ${t.minQuantity}–${t.maxQuantity}` : `شريحة ${t.minQuantity}+`;
  }

  unitPrice(line: OrderLine): number {
    const p = this.product(line);
    if (!p) return 0;
    const v = this.variant(line);
    const t = this.tier(line);
    if (t) {
      if (t.discountLabel) return t.finalUnitPrice ?? t.unitPrice;
      const productRatio = p.discountSource === 'product' && p.basePrice ? p.price / p.basePrice : 1;
      return Math.round(t.unitPrice * productRatio * 100) / 100;
    }
    if (v) return v.finalPrice ?? v.price;
    return p.price;
  }

  lineTotal(line: OrderLine): number {
    return this.unitPrice(line) * (Number(line.quantity) || 0);
  }

  stockOf(line: OrderLine): number {
    return this.variant(line)?.stock ?? this.product(line)?.stock ?? 0;
  }

  get total(): number {
    return this.lines.reduce((s, l) => s + this.lineTotal(l), 0);
  }

  get totalQuantity(): number {
    return this.lines.reduce((s, l) => s + (this.product(l) ? Number(l.quantity) || 0 : 0), 0);
  }

  lineValid(line: OrderLine): boolean {
    if (!this.product(line) || !(Number(line.quantity) >= 1)) return false;
    return !this.variantOptions(line).length || !!this.variant(line);
  }

  money(value?: number): string {
    return `${(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} ر.س`;
  }

  /* ---------- الإرسال ---------- */

  private validationError(): string {
    if (this.customer.fullName.trim().length < 2) return 'اكتب اسم العميل';
    if (this.customer.phoneNumber.replace(/\D/g, '').length < 8) return 'اكتب رقم موبايل صحيح';
    if (this.customer.email && !/^\S+@\S+\.\S+$/.test(this.customer.email.trim())) return 'البريد الإلكتروني مش صحيح';
    if (!this.lines.length) return 'ضيف صنف واحد على الأقل';
    const bad = this.lines.find((l) => !this.lineValid(l));
    if (bad) return this.product(bad) ? 'اختار النوع والكمية لكل صنف' : 'اختار المنتج لكل صنف';
    if (!this.address.governorate.trim() || !this.address.city.trim() || !this.address.street.trim()) {
      return 'أكمل عنوان التوصيل (المحافظة، المدينة، الشارع)';
    }
    return '';
  }

  submit(): void {
    if (this.saving) return;
    this.submitted = true;
    const error = this.validationError();
    if (error) {
      this.toast.error(error);
      return;
    }
    const opt = (v: string) => v.trim() || null;
    const payload: AdminOrderPayload = {
      customer: {
        fullName: this.customer.fullName.trim(),
        phoneNumber: this.customer.phoneNumber.trim(),
        email: opt(this.customer.email),
      },
      items: this.lines.map((l) => ({
        productId: Number(l.productId),
        productVariantId: l.variantId ? Number(l.variantId) : null,
        quantity: Number(l.quantity),
      })),
      shippingAddress: {
        governorate: this.address.governorate.trim(),
        city: this.address.city.trim(),
        area: opt(this.address.area),
        street: this.address.street.trim(),
        buildingNumber: opt(this.address.buildingNumber),
        floor: opt(this.address.floor),
        apartment: opt(this.address.apartment),
        landmark: opt(this.address.landmark),
        label: opt(this.address.label),
      },
      notes: opt(this.notes),
    };

    this.saving = true;
    this.orders.createAdmin(payload).subscribe({
      next: (order) => {
        this.saving = false;
        this.toast.success('تم إنشاء الطلب');
        this.created.emit(order);
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err?.status === 401 ? 'سجّل الدخول بحساب أدمن' : apiErrorMessage(err, 'فشل إنشاء الطلب'));
      },
    });
  }
}
