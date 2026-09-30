import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly sidebarOpenSubject = new BehaviorSubject<boolean>(false);
  readonly sidebarOpen$ = this.sidebarOpenSubject.asObservable();

  private readonly loadingSubject = new BehaviorSubject<boolean>(true);
  readonly loading$ = this.loadingSubject.asObservable();

  private readonly createProductSubject = new Subject<void>();
  readonly createProduct$ = this.createProductSubject.asObservable();

  private lockCount = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) this.closeSidebar();
      });
    }
  }

  toggleSidebar(): void {
    if (this.sidebarOpenSubject.value) this.closeSidebar();
    else this.openSidebar();
  }

  closeSidebar(): void {
    if (!this.sidebarOpenSubject.value) return;
    this.sidebarOpenSubject.next(false);
    this.unlockScroll();
  }

  openSidebar(): void {
    if (this.sidebarOpenSubject.value) return;
    this.sidebarOpenSubject.next(true);
    this.lockScroll();
  }

  requestCreateProduct(): void {
    this.createProductSubject.next();
  }

  setLoading(value: boolean): void {
    this.loadingSubject.next(value);
  }

  lockScroll(): void {
    this.lockCount++;
    if (typeof document !== 'undefined') {
      document.body.classList.add('scroll-locked');
    }
  }

  unlockScroll(): void {
    this.lockCount = Math.max(0, this.lockCount - 1);
    if (this.lockCount === 0 && typeof document !== 'undefined') {
      document.body.classList.remove('scroll-locked');
    }
  }
}
