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
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.auth.token;
    const isAuthCall = /\/Auth\/(login|register)/i.test(req.url);
    const withAuth = token && !isAuthCall
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(withAuth).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && !isAuthCall) {
          this.auth.logout();
          this.router.navigateByUrl('/login');
        }
        return throwError(() => err);
      })
    );
  }
}
