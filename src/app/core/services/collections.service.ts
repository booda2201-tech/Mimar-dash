import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, from, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { dataUrlToFile } from './data.services';
import { asRecord, bool, num, pick, str, unwrapItem, unwrapList } from '../api/api-utils';

export type CollectionItemType = 'Category' | 'Product';

export interface CollectionItem {
  id?: string;
  type: CollectionItemType;
  sortOrder: number;
  refId: string;
  name: string;
  nameEn?: string;
  image?: string;
  active: boolean;
  /** للمنتج */
  price?: number;
  finalPrice?: number;
  /** للفئة */
  productsCount?: number;
  startingPrice?: number;
}

export interface CollectionStage {
  id?: string;
  sortOrder: number;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  items: CollectionItem[];
}

export interface ProductCollection {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  image: string;
  badge: string;
  badgeEn: string;
  active: boolean;
  sortOrder: number;
  stages: CollectionStage[];
}

function mapItem(raw: Record<string, unknown>, index: number): CollectionItem {
  const type: CollectionItemType = /product/i.test(str(pick(raw, 'type'))) ? 'Product' : 'Category';
  const ref = asRecord(pick(raw, type === 'Product' ? 'product' : 'category'));
  return {
    id: str(pick(raw, 'id')) || undefined,
    type,
    sortOrder: num(pick(raw, 'sortOrder'), index + 1),
    refId: str(pick(ref, 'id') ?? pick(raw, type === 'Product' ? 'productId' : 'categoryId')),
    name: str(pick(ref, 'nameAr', 'name'), '—'),
    nameEn: str(pick(ref, 'nameEn')),
    image: str(pick(ref, 'imageUrl', 'image')) || undefined,
    active: bool(pick(ref, 'isActive'), true),
    price: type === 'Product' ? num(pick(ref, 'price')) : undefined,
    finalPrice: type === 'Product' ? num(pick(ref, 'finalPrice', 'price')) : undefined,
    productsCount: type === 'Category' ? num(pick(ref, 'productsCount')) : undefined,
    startingPrice: type === 'Category' ? num(pick(ref, 'startingPrice')) : undefined,
  };
}

function mapStage(raw: Record<string, unknown>, index: number): CollectionStage {
  const items = (pick<unknown[]>(raw, 'items') || []).map((i, k) => mapItem(asRecord(i), k));
  return {
    id: str(pick(raw, 'id')) || undefined,
    sortOrder: num(pick(raw, 'sortOrder'), index + 1),
    name: str(pick(raw, 'nameAr', 'name')),
    nameEn: str(pick(raw, 'nameEn')),
    description: str(pick(raw, 'descriptionAr', 'description')),
    descriptionEn: str(pick(raw, 'descriptionEn')),
    items: items.sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export function mapCollection(raw: Record<string, unknown>): ProductCollection {
  const stages = (pick<unknown[]>(raw, 'stages') || []).map((s, i) => mapStage(asRecord(s), i));
  return {
    id: str(pick(raw, 'id')),
    name: str(pick(raw, 'nameAr', 'name')),
    nameEn: str(pick(raw, 'nameEn')),
    description: str(pick(raw, 'descriptionAr', 'description')),
    descriptionEn: str(pick(raw, 'descriptionEn')),
    image: str(pick(raw, 'imageUrl', 'image')),
    badge: str(pick(raw, 'badgeTextAr', 'badgeText')),
    badgeEn: str(pick(raw, 'badgeTextEn')),
    active: bool(pick(raw, 'isActive'), true),
    sortOrder: num(pick(raw, 'displayOrder', 'sortOrder')),
    stages: stages.sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

@Injectable({ providedIn: 'root' })
export class CollectionsService {
  private readonly apiUrl = `${environment.apiUrl}/api/Collections`;

  constructor(private http: HttpClient) {}

  /** /manage بيرجّع المتوقفة كمان — العام بيرجّع الظاهرة في التطبيق بس */
  getAll(): Observable<ProductCollection[]> {
    const toList = (res: unknown) =>
      unwrapList(res)
        .map(mapCollection)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    return this.http.get<unknown>(`${this.apiUrl}/manage`).pipe(
      map(toList),
      catchError(() => this.http.get<unknown>(this.apiUrl).pipe(map(toList), catchError(() => of([]))))
    );
  }

  create(collection: Omit<ProductCollection, 'id'>): Observable<ProductCollection> {
    return this.withImageFile(collection.image).pipe(
      switchMap((file) => this.http.post<unknown>(this.apiUrl, this.toFormData(collection, file))),
      map((res) => this.fromResponse(res, collection))
    );
  }

  /** لو الصورة متغيرتش مش بنبعت Image، والباك اند بيسيب القديمة */
  update(id: string, collection: Omit<ProductCollection, 'id'>): Observable<ProductCollection> {
    return this.http
      .put<unknown>(`${this.apiUrl}/${id}`, this.toFormData(collection, dataUrlToFile(collection.image, 'collection')))
      .pipe(map((res) => this.fromResponse(res, collection, id)));
  }

  delete(id: string): Observable<boolean> {
    return this.http.delete<unknown>(`${this.apiUrl}/${id}`).pipe(map(() => true));
  }

  private fromResponse(res: unknown, sent: Omit<ProductCollection, 'id'>, id = ''): ProductCollection {
    const item = unwrapItem(res);
    return pick(item, 'id') != null ? mapCollection(item) : { ...sent, id };
  }

  /** الصورة لو رابط قديم (زي النسخ من مجموعة) بننزّلها ونرفعها كملف */
  private withImageFile(image: string): Observable<File | null> {
    const file = dataUrlToFile(image, 'collection');
    if (file || !image) return of(file);
    return from(fetch(image).then((res) => (res.ok ? res.blob() : Promise.reject(res.status)))).pipe(
      map((blob) => new File([blob], `collection.${(blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')}`, { type: blob.type || 'image/jpeg' })),
      catchError(() => of(null))
    );
  }

  private toFormData(c: Omit<ProductCollection, 'id'>, image: File | null): FormData {
    const fd = new FormData();
    fd.append('NameAr', c.name);
    fd.append('NameEn', c.nameEn || c.name);
    fd.append('DescriptionAr', c.description || '');
    fd.append('DescriptionEn', c.descriptionEn || c.description || '');
    fd.append('BadgeTextAr', c.badge || '');
    fd.append('BadgeTextEn', c.badgeEn || c.badge || '');
    fd.append('IsActive', String(c.active));
    fd.append('DisplayOrder', String(c.sortOrder || 0));
    fd.append(
      'Stages',
      JSON.stringify(
        c.stages.map((s, i) => ({
          nameAr: s.name,
          nameEn: s.nameEn || s.name,
          descriptionAr: s.description,
          descriptionEn: s.descriptionEn || s.description,
          sortOrder: i + 1,
          items: s.items.map((it, k) => ({
            type: it.type,
            categoryId: it.type === 'Category' ? Number(it.refId) || it.refId : null,
            productId: it.type === 'Product' ? Number(it.refId) || it.refId : null,
            sortOrder: k + 1,
          })),
        }))
      )
    );
    if (image) fd.append('Image', image, image.name);
    return fd;
  }
}
