import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuardService {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.auth.isLoggedIn) return true;
    this.router.navigateByUrl('/login');
    return false;
  }
}

export const authGuard: CanActivateFn = () => inject(AuthGuardService).canActivate();
