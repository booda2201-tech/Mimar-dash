import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { LayoutService } from '../../../core/services/layout.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent {
  @ViewChild('profileWrap') profileWrap?: ElementRef<HTMLElement>;
  menuOpen = false;

  constructor(
    public layout: LayoutService,
    private router: Router,
    private auth: AuthService
  ) {}

  readonly todayHijri = this.formatDate('ar-SA-u-ca-islamic-umalqura-nu-arab');
  readonly todayGregorian = this.formatDate('ar-EG-u-ca-gregory-nu-arab');

  private formatDate(locale: string): string {
    try {
      return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    } catch {
      return new Date().toLocaleDateString('ar');
    }
  }

  get staffName(): string {
    return this.auth.staffName;
  }

  get staffInitial(): string {
    const name = this.staffName.replace(/^م\.\s*/, '').trim();
    return name.charAt(0) || 'ع';
  }

  addProduct(): void {
    this.closeMenu();
    const openForm = () => setTimeout(() => this.layout.requestCreateProduct(), 0);
    if (this.router.url.startsWith('/products')) {
      openForm();
      return;
    }
    void this.router.navigateByUrl('/products').then(() => openForm());
  }

  toggleProfile(event: MouseEvent): void {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  logout(): void {
    this.closeMenu();
    void this.router.navigateByUrl('/login');
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    if (!this.menuOpen) return;
    const el = this.profileWrap?.nativeElement;
    if (el && !el.contains(event.target as Node)) {
      this.closeMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.closeMenu();
  }
}
