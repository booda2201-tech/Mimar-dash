import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { AdApprovalPayload, AdRequestItem } from '../models';
import { mapAdRequest, mapAdRequests } from '../api/api-mappers';
import { pick, unwrapItem } from '../api/api-utils';
import { environment } from '../../../environments/environment';

const DEMO_KEY = 'mimar.adRequests.demo.v3';
const SAMPLES_KEY = 'mimar.adRequests.samples';
const DEMO_PREFIX = 'DEMO-AD-';

function isoDaysAgo(days: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 15, 0, 0);
  return d.toISOString();
}

function dayOffset(days: number): string {
  return isoDaysAgo(-days).slice(0, 10);
}

function demo(
  n: number,
  data: Partial<AdRequestItem> & Pick<AdRequestItem, 'companyName' | 'applicantName' | 'merchantPhone' | 'status' | 'createdAt'>
): AdRequestItem {
  const image = data.imageUrl || '';
  return {
    id: `${DEMO_PREFIX}${n}`,
    trackingCode: `M-${n}`,
    merchantName: data.companyName || data.applicantName,
    bannerUrl: data.displayImageUrl || image,
    ...data,
  };
}

function buildDemoRequests(): AdRequestItem[] {
  const img = (name: string) => `assets/seed/products/${name}.jpg`;
  return [
    demo(20018, {
      applicantName: 'عبدالله الهندال',
      companyName: 'مؤسسة الهندال لمواد البناء',
      merchantPhone: '99881122',
      companySummary:
        'توريد أسمنت وحديد ورمل للمشاريع السكنية والتجارية في كل مناطق الكويت، مع توصيل للموقع خلال 24 ساعة وأسعار خاصة للمقاولين.',
      adTitle: 'خصم 10% على الأسمنت المقاوم للأملاح',
      imageUrl: img('p-cement-bag-2'),
      websiteUrl: 'https://alhendal-building.com',
      instagramUrl: 'https://instagram.com/alhendal.kw',
      facebookUrl: 'https://facebook.com/alhendal.kw',
      status: 'pending',
      createdAt: isoDaysAgo(0, 9),
    }),
    demo(20017, {
      applicantName: 'سارة العتيبي',
      companyName: 'دهانات الخليج',
      merchantPhone: '66554433',
      companySummary: 'دهانات داخلية وخارجية وعوازل حرارية، وخدمة مطابقة الألوان في الفرع خلال 10 دقايق.',
      adTitle: 'تشكيلة ألوان الخريف الجديدة',
      imageUrl: img('p-matte-paint-3'),
      websiteUrl: 'https://gulfpaints.com',
      instagramUrl: 'https://instagram.com/gulfpaints',
      status: 'pending',
      createdAt: isoDaysAgo(0, 7),
    }),
    demo(20016, {
      applicantName: 'محمد النوري',
      companyName: 'النور للأدوات الكهربائية',
      merchantPhone: '50117788',
      companySummary: 'كل مستلزمات الكهرباء والإنارة الموفرة: كشافات LED، لوحات توزيع، كابلات معتمدة.',
      adTitle: 'إضاءة LED للمكاتب بضمان سنتين',
      imageUrl: img('p-led-panel-2'),
      facebookUrl: 'https://facebook.com/alnoor.electric',
      status: 'pending',
      createdAt: isoDaysAgo(1, 15),
    }),
    demo(20015, {
      applicantName: 'نورة الرشيدي',
      companyName: 'بيت الأرضيات',
      merchantPhone: '97004411',
      companySummary: 'باركيه لامينيت وبورسلين إسباني وتركيب على يد فنيين معتمدين.',
      adTitle: 'باركيه لامينيت 8 مم بسعر التركيب',
      imageUrl: img('p-laminate-2'),
      websiteUrl: 'https://floorhouse.kw',
      instagramUrl: 'https://instagram.com/floorhouse.kw',
      status: 'pending',
      createdAt: isoDaysAgo(2, 11),
    }),
    demo(20012, {
      applicantName: 'خالد المطيري',
      companyName: 'حديد الكويت الوطنية',
      merchantPhone: '22446688',
      companySummary: 'مصنع حديد تسليح بمقاسات من 8 لـ 32 مم، مطابق للمواصفات الكويتية.',
      adTitle: 'حديد تسليح بسعر المصنع',
      imageUrl: img('p-rebar-12-3'),
      displayImageUrl: img('p-rebar-12-2'),
      websiteUrl: 'https://kwsteel.com',
      facebookUrl: 'https://facebook.com/kwsteel',
      status: 'approved',
      reviewedAt: isoDaysAgo(3, 12),
      activeUntil: dayOffset(18),
      createdAt: isoDaysAgo(5, 16),
    }),
    demo(20010, {
      applicantName: 'أحمد الكندري',
      companyName: 'الرواد للأدوات الصحية',
      merchantPhone: '99003344',
      companySummary: 'خلاطات وسخانات وأطقم حمامات من ماركات أوروبية بضمان الوكيل.',
      adTitle: 'خلاطات أوروبية بخصم 15%',
      imageUrl: img('p-basin-mixer-2'),
      displayImageUrl: img('p-basin-mixer-3'),
      instagramUrl: 'https://instagram.com/alrowad.sanitary',
      status: 'approved',
      reviewedAt: isoDaysAgo(7, 10),
      activeUntil: dayOffset(4),
      createdAt: isoDaysAgo(8, 13),
    }),
    demo(20007, {
      applicantName: 'يوسف الشمري',
      companyName: 'جبس بورد الخليج',
      merchantPhone: '65332211',
      companySummary: 'ألواح جبس عادي ومقاوم للرطوبة وبروفايلات أسقف معلقة.',
      adTitle: 'عرض الأسقف المعلقة',
      imageUrl: img('p-gypsum-board-2'),
      websiteUrl: 'https://gulfgypsum.com',
      status: 'approved',
      reviewedAt: isoDaysAgo(40, 10),
      activeUntil: dayOffset(-6),
      createdAt: isoDaysAgo(42, 9),
    }),
    demo(20004, {
      applicantName: 'فهد الصباح',
      companyName: 'متجر البيت الذكي',
      merchantPhone: '60001212',
      companySummary: 'مفاتيح وأفياش ذكية وأنظمة تحكم في الإضاءة عن طريق الموبايل.',
      adTitle: 'مفاتيح ذكية بشاحن USB',
      imageUrl: img('p-socket-usb-3'),
      instagramUrl: 'https://instagram.com/smarthome.kw',
      status: 'rejected',
      rejectionReason: 'الصورة فيها نص صغير جداً ومش واضح على شاشة الموبايل. برجاء رفع تصميم بخط أكبر وبدون لوجوهات تانية.',
      reviewedAt: isoDaysAgo(10, 13),
      createdAt: isoDaysAgo(12, 18),
    }),
  ];
}

@Injectable({ providedIn: 'root' })
export class AdRequestsService {
  private readonly apiUrl = `${environment.apiUrl}/api/AdvertisementRequests`;

  /** true لما الـ endpoint مش متاح وبنشتغل على بيانات تجريبية محلية */
  demoMode = false;

  constructor(private http: HttpClient) {}

  /** طلبات تجريبية بتتعرض جنب الحقيقية عشان التجربة — محفوظة على الجهاز بس */
  get showSamples(): boolean {
    return localStorage.getItem(SAMPLES_KEY) !== 'off';
  }

  set showSamples(value: boolean) {
    localStorage.setItem(SAMPLES_KEY, value ? 'on' : 'off');
  }

  isSample(item: AdRequestItem): boolean {
    return this.isDemo(item.id);
  }

  getAll(): Observable<AdRequestItem[]> {
    return this.http.get<unknown>(this.apiUrl).pipe(
      map((res) => {
        this.demoMode = false;
        const live = mapAdRequests(res);
        return this.showSamples ? [...live, ...this.readDemo()] : live;
      }),
      catchError(() => {
        this.demoMode = true;
        return of(this.readDemo());
      })
    );
  }

  approve(item: AdRequestItem, payload: AdApprovalPayload): Observable<AdRequestItem> {
    const next: AdRequestItem = {
      ...item,
      status: 'approved',
      activeUntil: payload.activeUntil,
      rejectionReason: undefined,
      reviewedAt: new Date().toISOString(),
    };
    if (this.isDemo(item.id)) return of(this.writeDemo(next));
    return this.http
      .post<unknown>(`${this.apiUrl}/${item.id}/approve`, { activeUntil: `${payload.activeUntil}T23:59:59` })
      .pipe(map((res) => this.merge(next, res)));
  }

  reject(item: AdRequestItem, reason: string): Observable<AdRequestItem> {
    const next: AdRequestItem = {
      ...item,
      status: 'rejected',
      rejectionReason: reason,
      activeUntil: undefined,
      reviewedAt: new Date().toISOString(),
    };
    if (this.isDemo(item.id)) return of(this.writeDemo(next));
    return this.http.post<unknown>(`${this.apiUrl}/${item.id}/reject`, { reason }).pipe(map((res) => this.merge(next, res)));
  }

  /** رفع/استبدال الصورة اللي هتظهر في التطبيق */
  uploadDisplayImage(item: AdRequestItem, file: File, previewUrl: string): Observable<AdRequestItem> {
    if (this.isDemo(item.id)) {
      return of(this.writeDemo({ ...item, displayImageUrl: previewUrl, bannerUrl: previewUrl }));
    }
    const fd = new FormData();
    fd.append('DisplayImage', file, file.name);
    fd.append('Image', file, file.name);
    return this.http.post<unknown>(`${this.apiUrl}/${item.id}/display-image`, fd).pipe(
      map((res) => {
        const body = unwrapItem(res);
        const url = String(pick(body, 'displayImageUrl', 'DisplayImageUrl', 'url', 'Url') || '');
        if (pick(body, 'id', 'Id')) return mapAdRequest(body);
        const finalUrl = url || previewUrl;
        return { ...item, displayImageUrl: finalUrl, bannerUrl: finalUrl };
      })
    );
  }

  /** بيرجّع الطلبات التجريبية لحالتها الأولى */
  resetDemo(): AdRequestItem[] {
    localStorage.removeItem(DEMO_KEY);
    return this.readDemo();
  }

  private isDemo(id: string): boolean {
    return id.startsWith(DEMO_PREFIX);
  }

  /** لو الرد مفيهوش الطلب كامل (204 أو { success }) بنعتمد على النسخة المحلية */
  private merge(local: AdRequestItem, res: unknown): AdRequestItem {
    const body = unwrapItem(res);
    if (!pick(body, 'id', 'Id') || !pick(body, 'status', 'Status')) return local;
    return mapAdRequest(body);
  }

  private readDemo(): AdRequestItem[] {
    try {
      const saved = JSON.parse(localStorage.getItem(DEMO_KEY) || 'null');
      if (Array.isArray(saved) && saved.length) return saved as AdRequestItem[];
    } catch {
      /* corrupted storage falls through to a fresh seed */
    }
    const seed = buildDemoRequests();
    localStorage.setItem(DEMO_KEY, JSON.stringify(seed));
    return seed;
  }

  private writeDemo(item: AdRequestItem): AdRequestItem {
    const list = this.readDemo().map((x) => (x.id === item.id ? item : x));
    localStorage.setItem(DEMO_KEY, JSON.stringify(list));
    return item;
  }
}
