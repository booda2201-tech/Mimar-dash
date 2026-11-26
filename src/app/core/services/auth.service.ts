import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { mapAuthToken } from '../api/api-mappers';
import { asRecord, displayPersonName, isAccountHandle, pick, str, unwrapItem } from '../api/api-utils';
import { ToastService } from './toast.service';

export interface AuthUser {
  id?: string;
  fullName: string;
  userName?: string;
  email: string;
  phoneNumber?: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  resetToken: string | null;
  newPassword: string;
  confirmPassword: string;
}

/**
 * مسارات استعادة كلمة المرور تحت /api/Auth — مش موجودة في الباك اند لسه (بترجع 404).
 * لو الباك اند اختار أسماء تانية، غيّرها هنا بس.
 */
export const PASSWORD_RESET_ENDPOINTS = {
  request: 'forgot-password',
  verify: 'verify-reset-code',
  reset: 'reset-password',
} as const;

const TOKEN_KEY = 'mimar_admin_token';
const USER_KEY = 'mimar_admin_user';
const SESSION_ENDED_KEY = 'mimar_session_ended';
const DEFAULT_STAFF_NAME = 'م. عبد الرحمن';
/** نخلّي مهلة بسيطة قبل الانتهاء عشان مانبعتش طلب بتوكن على وشك يخلص */
const EXPIRY_SKEW_MS = 10_000;

export type SessionEndReason = 'expired' | 'unauthorized';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = `${environment.apiUrl}/api/Auth`;
  private userSubject = new BehaviorSubject<AuthUser | null>(this.readUser());
  user$ = this.userSubject.asObservable();
  private endingSession = false;
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private toast: ToastService
  ) {
    // بعد ما Angular يخلّص الـ DI — عشان ماننادهوش أثناء الـ constructor
    queueMicrotask(() => this.watchTokenExpiry());
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get isLoggedIn(): boolean {
    const token = this.token;
    return !!token && !isJwtExpired(token, EXPIRY_SKEW_MS);
  }

  get user(): AuthUser | null {
    return this.userSubject.value;
  }

  get staffName(): string {
    return this.user?.fullName || DEFAULT_STAFF_NAME;
  }

  login(emailOrPhone: string, password: string): Observable<AuthUser> {
    return this.http.post<unknown>(`${this.base}/login`, { emailOrPhone, password }).pipe(
      map((res) => this.persistSession(res, emailOrPhone))
    );
  }

  /** بيبعت كود التحقق على البريد */
  requestPasswordReset(email: string): Observable<unknown> {
    return this.http.post(`${this.base}/${PASSWORD_RESET_ENDPOINTS.request}`, { email });
  }

  /** بيرجّع توكن إعادة التعيين لو السيرفر بيرجّعه — وإلا الكود نفسه بيتبعت في الخطوة الأخيرة */
  verifyResetCode(email: string, code: string): Observable<string | null> {
    return this.http.post<unknown>(`${this.base}/${PASSWORD_RESET_ENDPOINTS.verify}`, { email, code }).pipe(
      map((res) => {
        const r = unwrapItem(res);
        return str(pick(r, 'resetToken', 'ResetToken', 'token', 'Token')) || null;
      })
    );
  }

  resetPassword(payload: ResetPasswordPayload): Observable<unknown> {
    return this.http.post(`${this.base}/${PASSWORD_RESET_ENDPOINTS.reset}`, payload);
  }

  me(): Observable<AuthUser | null> {
    if (!this.token) return throwError(() => new Error('no token'));
    return this.http.get<unknown>(`${this.base}/me`).pipe(
      map((res) => {
        const user = this.mapUser(res, this.user?.email || '');
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.userSubject.next(user);
        return user;
      })
    );
  }

  logout(): void {
    this.clearExpiryWatch();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.userSubject.next(null);
  }

  /**
   * يمسح الجلسة ويرجّع المستخدم لصفحة الدخول برسالة واضحة.
   * بيتنادى لما التوكن يخلص أو السيرفر يرجّع 401.
   */
  endSession(reason: SessionEndReason = 'expired'): void {
    if (this.endingSession) return;
    const hadSession = !!this.token || !!this.user;
    if (!hadSession) {
      if (!this.router.url.startsWith('/login') && !this.router.url.startsWith('/forgot-password')) {
        this.router.navigateByUrl('/login');
      }
      return;
    }

    this.endingSession = true;
    this.logout();
    sessionStorage.setItem(SESSION_ENDED_KEY, reason);
    const message =
      reason === 'unauthorized'
        ? 'لازم تسجّل دخول تاني عشان تكمل'
        : 'انتهت جلستك — سجّل دخول تاني عشان تكمل';
    this.toast.warning(message);
    const goLogin = () => {
      this.endingSession = false;
      if (!this.router.url.startsWith('/login')) this.router.navigateByUrl('/login');
    };
    if (this.router.url.startsWith('/login')) {
      this.endingSession = false;
      return;
    }
    this.router.navigateByUrl('/login').then(goLogin, goLogin);
  }

  /** لو فيه رسالة انتهاء جلسة من التوجيه السابق */
  consumeSessionEndedMessage(): string | null {
    const reason = sessionStorage.getItem(SESSION_ENDED_KEY) as SessionEndReason | null;
    if (!reason) return null;
    sessionStorage.removeItem(SESSION_ENDED_KEY);
    return reason === 'unauthorized'
      ? 'لازم تسجّل دخول تاني عشان تكمل'
      : 'انتهت جلستك — سجّل دخول تاني عشان تكمل';
  }

  /** true لو التوكن موجود بس خلص أو بايظ */
  hasExpiredToken(): boolean {
    const token = this.token;
    return !!token && isJwtExpired(token, EXPIRY_SKEW_MS);
  }

  matchesStaff(createdBy?: string, createdById?: string): boolean {
    const me = this.user;
    if (createdById && me?.id && String(createdById) === String(me.id)) return true;
    const raw = (createdBy || '').trim().toLowerCase();
    if (!raw) return false;
    const mine = [me?.userName, me?.email, me?.fullName]
      .filter(Boolean)
      .map((value) => String(value).trim().toLowerCase());
    return mine.includes(raw);
  }

  private persistSession(payload: unknown, emailOrPhone: string): AuthUser {
    const token = mapAuthToken(payload);
    if (!token) throw new Error('لم يُرجع السيرفر توكن دخول');
    localStorage.setItem(TOKEN_KEY, token);
    const user = this.mapUser(payload, emailOrPhone);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.userSubject.next(user);
    this.watchTokenExpiry();
    return user;
  }

  private watchTokenExpiry(): void {
    this.clearExpiryWatch();
    const token = this.token;
    if (!token) return;
    const expMs = jwtExpiryMs(token);
    if (!expMs) return;
    const delay = expMs - Date.now() - EXPIRY_SKEW_MS;
    if (delay <= 0) {
      this.endSession('expired');
      return;
    }
    this.expiryTimer = setTimeout(() => this.endSession('expired'), delay);
  }

  private clearExpiryWatch(): void {
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
  }

  private mapUser(payload: unknown, fallbackEmail: string): AuthUser {
    const r = unwrapItem(payload);
    const nested = asRecord(pick(r, 'user', 'User') || r);
    const jwt = decodeJwtPayload(this.token || str(pick(r, 'token', 'Token', 'accessToken', 'AccessToken')));
    const given = str(
      pick(
        nested,
        'firstName',
        'FirstName',
        'givenName',
        'GivenName'
      ) ||
        pick(jwt, 'given_name', 'givenName', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname')
    );
    const family = str(
      pick(
        nested,
        'lastName',
        'LastName',
        'familyName',
        'FamilyName'
      ) ||
        pick(jwt, 'family_name', 'familyName', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname')
    );
    const fullName =
      displayPersonName(
        [given, family].filter(Boolean).join(' ').trim(),
        pick(nested, 'fullName', 'FullName', 'displayName', 'DisplayName', 'nameAr', 'NameAr'),
        pick(jwt, 'name', 'fullName', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'),
        pick(nested, 'name', 'Name')
      ) || DEFAULT_STAFF_NAME;
    const userName = str(
      pick(nested, 'userName', 'UserName', 'username', 'Username', 'login', 'Login') ||
        pick(jwt, 'unique_name', 'preferred_username', 'username')
    );
    const maybeHandle = str(pick(nested, 'name', 'Name'));
    return {
      id: str(pick(nested, 'id', 'Id') || pick(jwt, 'sub', 'nameid', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier')) || undefined,
      fullName,
      userName: userName || (isAccountHandle(maybeHandle) ? maybeHandle : undefined),
      email: str(pick(nested, 'email', 'Email') || pick(jwt, 'email'), fallbackEmail),
      phoneNumber: str(pick(nested, 'phoneNumber', 'PhoneNumber')) || undefined,
    };
  }

  private readUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AuthUser;
      return this.normalizeStoredUser(parsed);
    } catch {
      return null;
    }
  }

  private normalizeStoredUser(user: AuthUser): AuthUser {
    const fullName = displayPersonName(user.fullName) || DEFAULT_STAFF_NAME;
    const userName = user.userName || (isAccountHandle(user.fullName || '') ? user.fullName : undefined);
    const next = { ...user, fullName, userName };
    if (next.fullName !== user.fullName || next.userName !== user.userName) {
      localStorage.setItem(USER_KEY, JSON.stringify(next));
    }
    return next;
  }
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const part = token.split('.')[1];
    if (!part) return {};
    const padded = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return asRecord(JSON.parse(json));
  } catch {
    return {};
  }
}

function jwtExpiryMs(token: string): number | null {
  const exp = Number(decodeJwtPayload(token)['exp']);
  return Number.isFinite(exp) && exp > 0 ? exp * 1000 : null;
}

function isJwtExpired(token: string, skewMs = 0): boolean {
  const expMs = jwtExpiryMs(token);
  if (!expMs) return false;
  return Date.now() >= expMs - skewMs;
}
