export type AdStatus = 'pending' | 'approved' | 'rejected';

/** طلب إعلان من تاجر — بيتطابق مع /api/AdvertisementRequests */
export interface AdRequestItem {
  id: string;
  /** requestNumber — الكود اللي التاجر بيتابع بيه الطلب (M-10001) */
  trackingCode: string;
  applicantName: string;
  companyName: string;
  /** اسم العرض في الواجهة: الشركة، ولو فاضية اسم مقدم الطلب */
  merchantName: string;
  merchantPhone: string;
  companySummary?: string;
  adTitle?: string;
  /** الصورة الأصلية اللي التاجر رفعها */
  imageUrl?: string;
  /** الصورة المعتمدة للعرض في التطبيق (بيرفعها الأدمن) */
  displayImageUrl?: string;
  /** اللي بيظهر في الكروت: صورة العرض لو موجودة، وإلا الأصلية */
  bannerUrl: string;
  facebookUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
  status: AdStatus;
  rejectionReason?: string;
  reviewedAt?: string;
  /** آخر يوم ظهور (YYYY-MM-DD) */
  activeUntil?: string;
  createdAt: string;
}

export interface AdApprovalPayload {
  activeUntil: string;
}

export const AD_STATUS_LABELS: Record<AdStatus, string> = {
  pending: 'بانتظار المراجعة',
  approved: 'معتمد',
  rejected: 'مرفوض',
};

export type AdLinkKind = 'website' | 'instagram' | 'facebook';

export interface AdLink {
  kind: AdLinkKind;
  label: string;
  icon: string;
  url: string;
}

const LINK_META: Record<AdLinkKind, { label: string; icon: string }> = {
  website: { label: 'الموقع', icon: 'language' },
  instagram: { label: 'إنستجرام', icon: 'photo_camera' },
  facebook: { label: 'فيسبوك', icon: 'thumb_up' },
};

/** روابط التاجر الصالحة بس (بنشيل الفاضي والقيم الافتراضية زي https://string/) */
export function adLinksOf(item: AdRequestItem): AdLink[] {
  const raw: [AdLinkKind, string | undefined][] = [
    ['website', item.websiteUrl],
    ['instagram', item.instagramUrl],
    ['facebook', item.facebookUrl],
  ];
  return raw
    .map(([kind, value]) => [kind, normalizeUrl(value)] as const)
    .filter((entry): entry is readonly [AdLinkKind, string] => !!entry[1])
    .map(([kind, url]) => ({ kind, url, ...LINK_META[kind] }));
}

function normalizeUrl(value?: string): string {
  const v = (value || '').trim();
  if (!v || /^https?:\/\/string\/?$/i.test(v)) return '';
  return /^https?:\/\//i.test(v) ? v : `https://${v.replace(/^\/+/, '')}`;
}
