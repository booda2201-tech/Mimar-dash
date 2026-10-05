import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError, throwError } from 'rxjs';
import { AdminOrderPayload, Order } from '../models';
import { environment } from '../../../environments/environment';
import { mapOrder, mapOrders } from '../api/api-mappers';
import { unwrapItem } from '../api/api-utils';

const ORDER_STATUS_NAMES: Partial<Record<Order['status'], string>> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Delivered',
  cancelled: 'Cancelled',
};

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly apiUrl = `${environment.apiUrl}/api/Orders`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Order[]> {
    return this.http.get<unknown>(this.apiUrl).pipe(map(mapOrders), catchError(() => of([])));
  }

  getById(id: string): Observable<Order | undefined> {
    return this.http.get<unknown>(`${this.apiUrl}/${id}`).pipe(
      map((res) => mapOrder(unwrapItem(res))),
      catchError(() => of(undefined))
    );
  }

  /** PUT /api/Orders/{id}/status — Pending = 0 · Confirmed = 1 · Delivered = 2 · Cancelled = 3 */
  updateStatus(id: string, status: Order['status']): Observable<unknown> {
    return this.http.put<unknown>(`${this.apiUrl}/${id}/status`, { status: ORDER_STATUS_NAMES[status] ?? 'Pending' });
  }

  /** POST /api/Orders/{id}/cancel */
  cancel(id: string): Observable<unknown> {
    return this.http.post<unknown>(`${this.apiUrl}/${id}/cancel`, {});
  }

  /** POST /api/Orders/admin — طلب بيعمله الأدمن نيابة عن عميل */
  createAdmin(payload: AdminOrderPayload): Observable<Order> {
    return this.http.post<unknown>(`${this.apiUrl}/admin`, payload).pipe(map((res) => mapOrder(unwrapItem(res))));
  }

  create(order: Partial<Order>): Observable<Order> {
    return this.http.post<unknown>(this.apiUrl, order).pipe(
      map(mapOrder),
      catchError((err) => throwError(() => err))
    );
  }

  update(id: string, order: Partial<Order>): Observable<Order> {
    return this.http.put<unknown>(`${this.apiUrl}/${id}`, order).pipe(
      map(mapOrder),
      catchError((err) => throwError(() => err))
    );
  }

  delete(id: string): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' }).pipe(
      map(() => true),
      catchError((err) => throwError(() => err))
    );
  }
}
