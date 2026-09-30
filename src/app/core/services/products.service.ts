import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { Product, ProductDiscount, ProductFormPayload } from '../models';
import { environment } from '../../../environments/environment';
import { mapProduct, mapProducts } from '../api/api-mappers';
import { unwrapItem } from '../api/api-utils';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly apiUrl = `${environment.apiUrl}/api/Products`;

  constructor(private http: HttpClient) {}

  getNew(): Observable<Product[]> {
    return this.http.get<unknown>(`${this.apiUrl}/new`).pipe(map(mapProducts), catchError(() => of([])));
  }

  getDiscounted(): Observable<Product[]> {
    return this.http
      .get<unknown>(`${this.apiUrl}/discounted`)
      .pipe(map(mapProducts), catchError(() => of([])));
  }

  getAll(categoryId?: string | number): Observable<Product[]> {
    let params = new HttpParams();
    if (categoryId !== undefined && categoryId !== null && `${categoryId}` !== '') {
      params = params.set('categoryId', String(categoryId));
    }
    return this.http.get<unknown>(this.apiUrl, { params }).pipe(map(mapProducts), catchError(() => of([])));
  }

  getById(id: string): Observable<Product | undefined> {
    return this.http.get<unknown>(`${this.apiUrl}/${id}`).pipe(map((res) => mapProduct(unwrapItem(res))));
  }

  create(payload: ProductFormPayload, images: File[] = []): Observable<Product> {
    return this.http
      .post<unknown>(this.apiUrl, this.toFormData(payload, images))
      .pipe(map((res) => mapProduct(unwrapItem(res))));
  }

  update(id: string, payload: ProductFormPayload, images: File[] = []): Observable<Product> {
    return this.http
      .put<unknown>(`${this.apiUrl}/${id}`, this.toFormData(payload, images))
      .pipe(map((res) => mapProduct(unwrapItem(res))));
  }

  /** تحديث سريع من موديل العرض (صفحة العروض) مع الحفاظ على باقي بيانات المنتج */
  updateFromProduct(id: string, product: Partial<Product>): Observable<Product> {
    return this.update(id, this.productToPayload(product));
  }

  delete(id: string): Observable<boolean> {
    return this.http.delete<unknown>(`${this.apiUrl}/${id}`).pipe(map(() => true));
  }

  productToPayload(product: Partial<Product>): ProductFormPayload {
    let discounts: ProductDiscount[] = product.discounts || [];
    if (product.discountPercent !== undefined) {
      discounts =
        product.discountPercent > 0
          ? [
              {
                isPercentage: true,
                value: product.discountPercent,
                startDate: new Date().toISOString(),
                durationDays: 365,
              },
            ]
          : [];
    }
    const hasVariants = !!product.hasVariants && !!product.variants?.length;
    return {
      nameAr: product.name || '',
      nameEn: product.nameEn,
      descriptionAr: product.description,
      descriptionEn: product.descriptionEn,
      sku: product.sku && product.sku !== '—' ? product.sku : undefined,
      categoryId: Number(product.categoryId),
      brandId: product.brandId ? Number(product.brandId) : undefined,
      hasVariants,
      price: hasVariants ? undefined : product.basePrice ?? product.price,
      stockQuantity: hasVariants ? undefined : product.stock,
      isActive: product.showInApp !== false && product.status !== 'inactive',
      isNew: !!product.featured,
      specifications: (product.specs || []).map((s, i) => ({
        nameAr: s.label,
        nameEn: s.labelEn,
        valueAr: s.value,
        valueEn: s.valueEn,
        displayOrder: i + 1,
      })),
      variants: hasVariants
        ? (product.variants || []).map((v) => ({
            sku: v.sku || undefined,
            price: v.price,
            stockQuantity: v.stock,
            isActive: v.isActive !== false,
            isNew: !!v.isNew,
            attributes: Object.entries(v.attrs || {})
              .filter(([, value]) => !!value)
              .map(([nameAr, valueAr]) => ({
                nameAr,
                valueAr,
                nameEn: v.attrsEn?.[nameAr]?.nameEn,
                valueEn: v.attrsEn?.[nameAr]?.valueEn,
              })),
            priceTiers: v.priceTiers || [],
            discounts: v.discounts || [],
          }))
        : [],
      priceTiers: hasVariants ? [] : product.priceTiers || [],
      discounts,
    };
  }

  private toFormData(payload: ProductFormPayload, images: File[]): FormData {
    const fd = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      const name = key.charAt(0).toUpperCase() + key.slice(1);
      // الباك إند مابيربطش المفاتيح المفهرسة (Specifications[0].NameAr) — القوائم بتتبعت JSON
      if (Array.isArray(value)) fd.append(name, JSON.stringify(pascalize(value)));
      else appendField(fd, name, value);
    });
    images.forEach((file) => fd.append('Images', file, file.name));
    return fd;
  }
}

function pascalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(pascalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => [k.charAt(0).toUpperCase() + k.slice(1), pascalize(v)])
    );
  }
  return value;
}

/** ASP.NET [FromForm] binding: Variants[0].PriceTiers[1].Discounts[0].Value */
function appendField(fd: FormData, key: string, value: unknown): void {
  if (value === undefined || value === null || value === '') return;
  if (typeof value === 'number' && !Number.isFinite(value)) return;
  if (Array.isArray(value)) {
    value.forEach((item, i) => appendField(fd, `${key}[${i}]`, item));
    return;
  }
  if (typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
      const name = k.charAt(0).toUpperCase() + k.slice(1);
      appendField(fd, key ? `${key}.${name}` : name, v);
    });
    return;
  }
  fd.append(key, String(value));
}
