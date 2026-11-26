import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isAuthCall = /\/Auth\/(login|register|forgot-password|verify-reset-code|reset-password)/i.test(req.url);

    if (!isAuthCall && this.auth.hasExpiredToken()) {
      this.auth.endSession('expired');
      return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Session expired', url: req.url }));
    }

    const token = this.auth.token;
    const withAuth =
      token && !isAuthCall ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

    return next.handle(withAuth).pipe(
      catchError((err: HttpErrorResponse) => {
        if (!isAuthCall && err.status === 401) {
          this.auth.endSession('unauthorized');
        }
        return throwError(() => err);
      })
    );
  }
}
