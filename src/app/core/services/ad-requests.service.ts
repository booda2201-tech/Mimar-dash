import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AdApprovalPayload, AdRequestItem } from '../models';
import { mapAdRequest, mapAdRequests } from '../api/api-mappers';
import { pick, unwrapItem } from '../api/api-utils';
import { environment } from '../../../environments/environment';

const LEGACY_DEMO_KEYS = ['mimar.adRequests.demo', 'mimar.adRequests.demo.v2', 'mimar.adRequests.demo.v3', 'mimar.adRequests.samples'];

@Injectable({ providedIn: 'root' })
export class AdRequestsService {
  private readonly apiUrl = `${environment.apiUrl}/api/AdvertisementRequests`;

  constructor(private http: HttpClient) {
    LEGACY_DEMO_KEYS.forEach((key) => localStorage.removeItem(key));
  }

  getAll(): Observable<AdRequestItem[]> {
    return this.http.get<unknown>(this.apiUrl).pipe(map(mapAdRequests));
  }

  approve(item: AdRequestItem, payload: AdApprovalPayload): Observable<AdRequestItem> {
    const next: AdRequestItem = {
      ...item,
      status: 'approved',
      activeUntil: payload.activeUntil,
      rejectionReason: undefined,
      reviewedAt: new Date().toISOString(),
    };
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
    return this.http.post<unknown>(`${this.apiUrl}/${item.id}/reject`, { reason }).pipe(map((res) => this.merge(next, res)));
  }

  /** رفع/استبدال الصورة اللي هتظهر في التطبيق */
  uploadDisplayImage(item: AdRequestItem, file: File, previewUrl: string): Observable<AdRequestItem> {
    const fd = new FormData();
    fd.append('DisplayImage', file, file.name);
    fd.append('Image', file, file.name);
    return this.http.post<unknown>(`${this.apiUrl}/${item.id}/display-image`, fd).pipe(
      map((res) => {
        const body = unwrapItem(res);
        if (pick(body, 'id', 'Id')) return mapAdRequest(body);
        const url = String(pick(body, 'displayImageUrl', 'DisplayImageUrl', 'url', 'Url') || '') || previewUrl;
        return { ...item, displayImageUrl: url, bannerUrl: url };
      })
    );
  }

  /** لو الرد مفيهوش الطلب كامل (204 أو { success }) بنعتمد على النسخة المحلية */
  private merge(local: AdRequestItem, res: unknown): AdRequestItem {
    const body = unwrapItem(res);
    if (!pick(body, 'id', 'Id') || !pick(body, 'status', 'Status')) return local;
    return mapAdRequest(body);
  }
}
