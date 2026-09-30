import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { mapAuthToken } from '../api/api-mappers';
import { asRecord, displayPersonName, isAccountHandle, pick, str, unwrapItem } from '../api/api-utils';

export interface AuthUser {
  id?: string;
  fullName: string;
  userName?: string;
  email: string;
  phoneNumber?: string;
}

const TOKEN_KEY = 'mimar_admin_token';
const USER_KEY = 'mimar_admin_user';
const DEFAULT_STAFF_NAME = 'م. عبد الرحمن';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = `${environment.apiUrl}/api/Auth`;
  private userSubject = new BehaviorSubject<AuthUser | null>(this.readUser());
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get isLoggedIn(): boolean {
    return !!this.token;
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
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.userSubject.next(null);
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
    return user;
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
