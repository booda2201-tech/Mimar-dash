import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, forkJoin, catchError, throwError, switchMap, from } from 'rxjs';
import {
  Customer,
  Brand,
  Category,
  Offer,
  NotificationItem,
  TeamMember,
  StatCardData,
  AppBanner,
  Advertisement,
  Product,
  MaterialList,
  MaterialListItem,
} from '../models';
import { DASHBOARD_STATS } from '../data/mock-data';
import { environment } from '../../../environments/environment';
import {
  flattenCategoryTree,
  mapAdvertisement,
  mapAdvertisements,
  mapBanner,
  mapBanners,
  mapBrand,
  mapBrands,
  mapCategories,
  mapCategory,
  mapCustomers,
  mapMaterialList,
  mapMaterialListItem,
  mapMaterialLists,
  mapOffers,
} from '../api/api-mappers';
import { ProductsService } from './products.service';
import { unwrapItem } from '../api/api-utils';

/** الصور الجديدة من الـ dropzone بتبقى data URL — روابط الصور القديمة بترجع null */
function dataUrlToFile(value: string | undefined, name: string): File | null {
  const match = value?.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
  if (!match) return null;
  const bytes = atob(match[2]);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);
  const ext = match[1].split('/')[1].replace('jpeg', 'jpg').replace('svg+xml', 'svg');
  return new File([buffer], `${name}.${ext}`, { type: match[1] });
}

function emptyList<T>(): Observable<T[]> {
  return of([] as T[]);
}

function dedupeCategories(list: Category[]): Category[] {
  const byId = new Map<string, Category>();
  list.forEach((c) => {
    const prev = byId.get(c.id);
    byId.set(c.id, prev ? { ...c, parentId: c.parentId ?? prev.parentId } : c);
  });
  return [...byId.values()];
}

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly apiUrl = `${environment.apiUrl}/api/Customers`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Customer[]> {
    return this.http.get<unknown>(this.apiUrl).pipe(map(mapCustomers), catchError(() => emptyList<Customer>()));
  }

  create(customer: Partial<Customer>): Observable<Customer> {
    return this.http.post<unknown>(this.apiUrl, customer).pipe(
      map((res) => mapCustomers({ data: [res] })[0] || (customer as Customer)),
      catchError((err) => throwError(() => err))
    );
  }

  update(id: string, customer: Partial<Customer>): Observable<Customer> {
    return this.http.put<unknown>(`${this.apiUrl}/${id}`, customer).pipe(
      map((res) => mapCustomers({ data: [res] })[0] || ({ ...customer, id } as Customer)),
      catchError((err) => throwError(() => err))
    );
  }

  delete(id: string): Observable<boolean> {
    return this.http.delete<unknown>(`${this.apiUrl}/${id}`).pipe(
      map(() => true),
      catchError((err) => throwError(() => err))
    );
  }
}

@Injectable({ providedIn: 'root' })
export class BrandsService {
  private readonly apiUrl = `${environment.apiUrl}/api/Brands`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Brand[]> {
    return this.http.get<unknown>(this.apiUrl).pipe(map(mapBrands), catchError(() => emptyList<Brand>()));
  }

  getById(id: string): Observable<Brand> {
    return this.http.get<unknown>(`${this.apiUrl}/${id}`).pipe(map(mapBrand));
  }

  create(brand: Partial<Brand>): Observable<Brand> {
    const body = {
      nameAr: brand.name,
      nameEn: brand.nameEn,
      descriptionAr: brand.description,
      descriptionEn: brand.descriptionEn,
      country: brand.country,
      isActive: brand.status !== 'inactive' && brand.showInApp !== false,
    };
    return this.http.post<unknown>(this.apiUrl, body).pipe(map(mapBrand));
  }

  update(id: string, brand: Partial<Brand>): Observable<Brand> {
    const body = {
      nameAr: brand.name,
      nameEn: brand.nameEn,
      descriptionAr: brand.description,
      descriptionEn: brand.descriptionEn,
      country: brand.country,
      isActive: brand.status !== 'inactive' && brand.showInApp !== false,
    };
    return this.http.put<unknown>(`${this.apiUrl}/${id}`, body).pipe(map(mapBrand));
  }

  delete(id: string): Observable<boolean> {
    return this.http.delete<unknown>(`${this.apiUrl}/${id}`).pipe(map(() => true));
  }
}

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly apiUrl = `${environment.apiUrl}/api/Categories`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Category[]> {
    const fromTree = this.http.get<unknown>(`${this.apiUrl}/tree`).pipe(
      map((res) => flattenCategoryTree(res)),
      catchError(() => emptyList<Category>())
    );
    return this.http.get<unknown>(this.apiUrl).pipe(
      map((res) => dedupeCategories(flattenCategoryTree(res))),
      catchError(() => emptyList<Category>()),
      switchMap((list) => (list.length ? of(list) : fromTree.pipe(map(dedupeCategories))))
    );
  }

  create(category: Partial<Category>): Observable<Category> {
    return this.http.post<unknown>(this.apiUrl, this.toFormData(category)).pipe(map((res) => mapCategory(unwrapItem(res))));
  }

  update(id: string, category: Partial<Category>): Observable<Category> {
    return this.http
      .put<unknown>(`${this.apiUrl}/${id}`, this.toFormData(category))
      .pipe(map((res) => mapCategory(unwrapItem(res))));
  }

  private toFormData(category: Partial<Category>): FormData {
    const fd = new FormData();
    fd.append('NameAr', category.name || '');
    fd.append('NameEn', category.nameEn || '');
    fd.append('DescriptionAr', category.description || '');
    fd.append('DescriptionEn', category.descriptionEn || '');
    if (category.parentId) fd.append('ParentCategoryId', String(category.parentId));
    fd.append('IsActive', String(category.status !== 'inactive' && category.showInApp !== false));
    if (category.sortOrder != null) fd.append('DisplayOrder', String(category.sortOrder));
    const file = dataUrlToFile(category.image, 'category');
    if (file) fd.append('Image', file, file.name);
    return fd;
  }

  delete(id: string): Observable<boolean> {
    return this.http.delete<unknown>(`${this.apiUrl}/${id}`).pipe(map(() => true));
  }
}

@Injectable({ providedIn: 'root' })
export class OffersService {
  private readonly productsUrl = `${environment.apiUrl}/api/Products`;
  private readonly offersUrl = `${environment.apiUrl}/api/Offers`;

  constructor(private http: HttpClient) {}

  /** العروض الحقيقية = منتجات مخفضة من الباك اند */
  getAll(): Observable<Offer[]> {
    return this.http.get<unknown>(`${this.productsUrl}/discounted`).pipe(
      map(mapOffers),
      catchError(() =>
        this.http.get<unknown>(this.offersUrl).pipe(map(mapOffers), catchError(() => emptyList<Offer>()))
      )
    );
  }
}

@Injectable({ providedIn: 'root' })
export class AppContentService {
  private readonly bannersUrl = `${environment.apiUrl}/api/Banners`;

  constructor(
    private http: HttpClient,
    private categories: CategoriesService,
    private products: ProductsService
  ) {}

  getBanners(): Observable<AppBanner[]> {
    return this.http.get<unknown>(this.bannersUrl).pipe(map(mapBanners), catchError(() => emptyList<AppBanner>()));
  }

  /** منتجات جديدة من الـ API لواجهة الهوم */
  getNewArrivals(): Observable<Product[]> {
    return this.products.getNew().pipe(catchError(() => emptyList<Product>()));
  }

  saveBanner(banner: Partial<AppBanner> & { id?: string }): Observable<AppBanner> {
    const body = {
      titleAr: banner.title,
      titleEn: banner.titleEn,
      subtitleAr: banner.subtitle,
      subtitleEn: banner.subtitleEn,
      ctaAr: banner.cta,
      ctaEn: banner.ctaEn,
      placement: banner.placement,
      isActive: banner.status !== 'inactive',
      sortOrder: banner.sortOrder,
      imageUrl: banner.imageHint,
    };
    if (banner.id) {
      return this.http.put<unknown>(`${this.bannersUrl}/${banner.id}`, body).pipe(map(mapBanner));
    }
    return this.http.post<unknown>(this.bannersUrl, body).pipe(map(mapBanner));
  }

  deleteBanner(id: string): Observable<boolean> {
    return this.http.delete<unknown>(`${this.bannersUrl}/${id}`).pipe(map(() => true));
  }

  getHomeCategories(): Observable<Category[]> {
    return this.categories.getAll().pipe(
      map((cats) =>
        cats
          .filter((c) => !c.parentId && c.showInApp !== false)
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      )
    );
  }
}

@Injectable({ providedIn: 'root' })
export class AdvertisementsService {
  private readonly apiUrl = `${environment.apiUrl}/api/Advertisements`;

  constructor(private http: HttpClient) {}

  /** /manage للأدمن بيرجّع كل الإعلانات (المتوقفة والمنتهية كمان) — العام بيرجّع الشغال بس */
  getAll(): Observable<Advertisement[]> {
    return this.http.get<unknown>(`${this.apiUrl}/manage`).pipe(
      map(mapAdvertisements),
      catchError(() =>
        this.http.get<unknown>(this.apiUrl).pipe(map(mapAdvertisements), catchError(() => emptyList<Advertisement>()))
      )
    );
  }

  create(ad: Partial<Advertisement>): Observable<Advertisement> {
    return this.withImageFile(ad).pipe(
      switchMap((file) => this.http.post<unknown>(this.apiUrl, this.toFormData(ad, file))),
      map((res) => mapAdvertisement(unwrapItem(res)))
    );
  }

  /** لو الصورة متغيرتش مش بنبعت Image، والمفروض الباك اند يسيب القديمة */
  update(id: string, ad: Partial<Advertisement>): Observable<Advertisement> {
    return this.http
      .put<unknown>(`${this.apiUrl}/${id}`, this.toFormData(ad, dataUrlToFile(ad.image, 'advertisement')))
      .pipe(map((res) => mapAdvertisement(unwrapItem(res))));
  }

  delete(id: string): Observable<boolean> {
    return this.http.delete<unknown>(`${this.apiUrl}/${id}`).pipe(map(() => true));
  }

  /** صورة المنتج بتيجي رابط — الـ API عايز ملف، فبننزّلها ونرفعها */
  private withImageFile(ad: Partial<Advertisement>): Observable<File | null> {
    const file = dataUrlToFile(ad.image, 'advertisement');
    if (file || !ad.image) return of(file);
    return from(fetch(ad.image).then((res) => (res.ok ? res.blob() : Promise.reject(res.status)))).pipe(
      map((blob) => new File([blob], `advertisement.${(blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')}`, { type: blob.type || 'image/jpeg' })),
      catchError(() => of(null))
    );
  }

  private toFormData(ad: Partial<Advertisement>, image: File | null): FormData {
    const fd = new FormData();
    const add = (key: string, value: unknown) => {
      if (value !== null && value !== undefined && value !== '') fd.append(key, String(value));
    };
    add('TitleAr', ad.title);
    add('TitleEn', ad.titleEn);
    add('DescriptionAr', ad.description);
    add('DescriptionEn', ad.descriptionEn);
    add('StartDate', ad.startDate);
    add('EndDate', ad.endDate);
    add('IsActive', ad.active !== false);
    add('DisplayOrder', ad.sortOrder ?? 0);
    (ad.productIds || []).forEach((id) => add('ProductIds', id));
    if (image) fd.append('Image', image, image.name);
    return fd;
  }
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly apiUrl = `${environment.apiUrl}/api/Notifications`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<NotificationItem[]> {
    return this.http.get<unknown>(this.apiUrl).pipe(
      map(() => [] as NotificationItem[]),
      catchError(() => emptyList<NotificationItem>())
    );
  }

  markAllRead(): Observable<boolean> {
    return this.http.post<unknown>(`${this.apiUrl}/mark-all-read`, {}).pipe(
      map(() => true),
      catchError(() => of(true))
    );
  }
}

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly apiUrl = `${environment.apiUrl}/api/Team`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<TeamMember[]> {
    return this.http.get<unknown>(this.apiUrl).pipe(
      map(() => [] as TeamMember[]),
      catchError(() => emptyList<TeamMember>())
    );
  }
}

@Injectable({ providedIn: 'root' })
export class MaterialListsService {
  private readonly apiUrl = `${environment.apiUrl}/api/MaterialLists`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<MaterialList[]> {
    return this.http.get<unknown>(this.apiUrl).pipe(map(mapMaterialLists));
  }

  getById(id: string): Observable<MaterialList> {
    return this.http.get<unknown>(`${this.apiUrl}/${id}`).pipe(map((res) => mapMaterialList(unwrapItem(res))));
  }

  create(list: Partial<MaterialList>): Observable<MaterialList> {
    const body = {
      nameAr: list.name,
      nameEn: list.nameEn || list.name,
      descriptionAr: list.description,
      description: list.description,
      projectName: list.projectName,
      notes: list.description,
    };
    return this.http.post<unknown>(this.apiUrl, body).pipe(map((res) => mapMaterialList(unwrapItem(res))));
  }

  update(id: string, list: Partial<MaterialList>): Observable<MaterialList> {
    const body = {
      nameAr: list.name,
      nameEn: list.nameEn || list.name,
      descriptionAr: list.description,
      description: list.description,
      projectName: list.projectName,
      notes: list.description,
      isActive: list.status !== 'inactive',
    };
    return this.http
      .put<unknown>(`${this.apiUrl}/${id}`, body)
      .pipe(map((res) => mapMaterialList(unwrapItem(res))));
  }

  delete(id: string): Observable<boolean> {
    return this.http.delete<unknown>(`${this.apiUrl}/${id}`).pipe(map(() => true));
  }

  addItem(
    listId: string,
    item: { productId: string; quantity: number; notes?: string }
  ): Observable<MaterialListItem> {
    return this.http
      .post<unknown>(`${this.apiUrl}/${listId}/items`, item)
      .pipe(map((res) => mapMaterialListItem(unwrapItem(res))));
  }

  updateItem(
    listId: string,
    itemId: string,
    item: { quantity?: number; notes?: string; productId?: string }
  ): Observable<MaterialListItem> {
    return this.http
      .put<unknown>(`${this.apiUrl}/${listId}/items/${itemId}`, item)
      .pipe(map((res) => mapMaterialListItem(unwrapItem(res))));
  }

  deleteItem(listId: string, itemId: string): Observable<boolean> {
    return this.http.delete<unknown>(`${this.apiUrl}/${listId}/items/${itemId}`).pipe(map(() => true));
  }
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(
    private products: ProductsService,
    private brands: BrandsService,
    private categories: CategoriesService,
    private materialLists: MaterialListsService
  ) {}

  getStats(): Observable<StatCardData[]> {
    return forkJoin({
      products: this.products.getAll().pipe(catchError(() => emptyList<Product>())),
      brands: this.brands.getAll().pipe(catchError(() => emptyList<Brand>())),
      categories: this.categories.getAll().pipe(catchError(() => emptyList<Category>())),
      materialLists: this.materialLists.getAll().pipe(catchError(() => emptyList<MaterialList>())),
    }).pipe(
      map(({ products, brands, categories, materialLists }) => {
        const roots = categories.filter((c) => !c.parentId);
        const neu = DASHBOARD_STATS.map((s) => ({ ...s }));
        neu[0] = {
          ...neu[0],
          value: products.length,
          change: `${products.filter((p) => p.status === 'active').length} نشط`,
        };
        neu[1] = {
          ...neu[1],
          value: brands.length,
          change: `${brands.filter((b) => b.status === 'active').length} نشط`,
        };
        neu[2] = { ...neu[2], value: categories.length, change: `${roots.length} رئيسية` };
        neu[3] = {
          title: 'قوائم المواد',
          value: materialLists.length,
          change: `${materialLists.reduce((s, l) => s + (l.itemsCount || 0), 0)} صنف`,
          changeType: 'neutral',
          icon: 'list_alt',
          animate: true,
        };
        return neu;
      })
    );
  }
}
