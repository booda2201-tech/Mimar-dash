import { Component, OnInit, AfterViewInit, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavItem } from '../../../core/models';
import { LayoutService } from '../../../core/services/layout.service';
import { AuthService } from '../../../core/services/auth.service';
import gsap from 'gsap';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, AfterViewInit {
  @ViewChild('navList') navList!: ElementRef<HTMLElement>;

  open = false;

  navItems: NavItem[] = [
    { label: 'الرئيسية', route: '/dashboard', icon: 'dashboard' },
    { label: 'المنتجات', route: '/products', icon: 'inventory_2' },
    { label: 'محتوى التطبيق', route: '/app-content', icon: 'smartphone' },
    { label: 'المجموعات', route: '/collections', icon: 'package_2' },
    { label: 'الطلبات', route: '/orders', icon: 'local_shipping' },
    { label: 'عروض السعر', route: '/quotations', icon: 'request_quote' },
    { label: 'العملاء', route: '/customers', icon: 'groups' },
    { label: 'قوائم المواد', route: '/material-lists', icon: 'list_alt' },
    { label: 'البراندات', route: '/brands', icon: 'workspace_premium' },
    { label: 'الفئات', route: '/categories', icon: 'category' },
    { label: 'العروض والبنرات', route: '/offers', icon: 'sell' },
  ];

  dragY = 0;
  dragging = false;
  private startX = 0;
  private startY = 0;

  constructor(public layout: LayoutService, private auth: AuthService) {}

  onTouchStart(e: TouchEvent): void {
    this.startX = e.touches[0].clientX;
    this.startY = e.touches[0].clientY;
    this.dragging = false;
  }

  onTouchMove(e: TouchEvent): void {
    const dx = e.touches[0].clientX - this.startX;
    const dy = e.touches[0].clientY - this.startY;
    if (!this.dragging && (Math.abs(dx) > Math.abs(dy) || dy < 8)) return;
    this.dragging = true;
    this.dragY = Math.max(0, dy);
  }

  onTouchEnd(): void {
    if (this.dragging && this.dragY > 70) this.close();
    this.dragging = false;
    this.dragY = 0;
  }

  get staffName(): string {
    return this.auth.staffName;
  }

  get staffInitial(): string {
    const name = this.staffName.replace(/[.\s]/g, '');
    return name.charAt(0) || 'م';
  }

  ngOnInit(): void {
    this.layout.sidebarOpen$.subscribe((v) => (this.open = v));
  }

  ngAfterViewInit(): void {
    const items = this.navList?.nativeElement?.querySelectorAll('.nav-item');
    if (!items?.length) return;
    gsap.from(items, {
      opacity: 0,
      y: 10,
      duration: 0.35,
      stagger: 0.03,
      delay: 0.15,
      ease: 'power2.out',
      clearProps: 'all',
    });
  }

  close(): void {
    this.layout.closeSidebar();
  }

  logout(): void {
    this.auth.logout();
    this.close();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.open) this.close();
  }
}
