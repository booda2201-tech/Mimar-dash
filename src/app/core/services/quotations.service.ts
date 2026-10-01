import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { QuotationOfferPayload, QuotationRequest } from '../models';
import { mapQuotationRequest, mapQuotationRequests } from '../api/api-mappers';
import { asRecord, pick, str, unwrapItem } from '../api/api-utils';

/** رسالة الخطأ اللي راجعة من الباك (message أو errors[]) */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const body = asRecord((err as HttpErrorResponse)?.error);
  const errors = pick<unknown>(body, 'errors', 'Errors');
  if (Array.isArray(errors) && errors.length) return errors.map((e) => str(e)).filter(Boolean).join(' · ') || fallback;
  if (errors && typeof errors === 'object') {
    const flat = Object.values(errors as Record<string, unknown>)
      .flatMap((v) => (Array.isArray(v) ? v : [v]))
      .map((v) => str(v))
      .filter(Boolean);
    if (flat.length) return flat.join(' · ');
  }
  return str(pick(body, 'message', 'Message', 'title', 'Title')) || fallback;
}

@Injectable({ providedIn: 'root' })
export class QuotationsService {
  private readonly apiUrl = `${environment.apiUrl}/api/QuotationRequests`;

  constructor(private http: HttpClient) {}

  getAll(status?: string): Observable<QuotationRequest[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<unknown>(this.apiUrl, { params }).pipe(map(mapQuotationRequests));
  }

  getById(id: string): Observable<QuotationRequest> {
    return this.http.get<unknown>(`${this.apiUrl}/${id}`).pipe(map((res) => mapQuotationRequest(unwrapItem(res))));
  }

  sendOffer(id: string, payload: QuotationOfferPayload): Observable<unknown> {
    const body = {
      amount: payload.totalPrice,
      totalPrice: payload.totalPrice,
      totalAmount: payload.totalPrice,
      validUntil: payload.validUntil || null,
      notes: payload.notes || null,
      items: payload.items.map((i) => ({
        itemId: Number(i.itemId) || i.itemId,
        quotationRequestItemId: Number(i.itemId) || i.itemId,
        productId: i.productId ? Number(i.productId) || i.productId : null,
        variantId: i.variantId ? Number(i.variantId) || i.variantId : null,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    };
    return this.http.post<unknown>(`${this.apiUrl}/${id}/offers`, body);
  }

  accept(id: string, notes?: string): Observable<unknown> {
    return this.action(id, 'accept', { notes: notes || null });
  }

  reject(id: string, reason: string): Observable<unknown> {
    return this.action(id, 'reject', { reason, rejectionReason: reason });
  }

  /** accept/reject: POST، ولو الباك مش قابله نجرب PUT */
  private action(id: string, name: 'accept' | 'reject', body: Record<string, unknown>): Observable<unknown> {
    const url = `${this.apiUrl}/${id}/${name}`;
    return this.http.post<unknown>(url, body).pipe(
      catchError((err: HttpErrorResponse) =>
        err?.status === 405 || err?.status === 404 ? this.http.put<unknown>(url, body) : throwError(() => err)
      )
    );
  }
}
