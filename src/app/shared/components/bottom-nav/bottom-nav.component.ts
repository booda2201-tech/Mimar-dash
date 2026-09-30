import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../../../core/services/layout.service';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="dock" [class.menu-open]="layout.sidebarOpen$ | async" aria-label="التنقل السريع">
      <a
        *ngFor="let item of items"
        [routerLink]="item.route"
        routerLinkActive="is-active"
        [routerLinkActiveOptions]="{ exact: item.exact }"
        #rla="routerLinkActive"
        class="dock-item"
        [attr.aria-label]="item.label"
        [attr.aria-current]="rla.isActive ? 'page' : null"
      >
        <span class="material-symbols-outlined">{{ item.icon }}</span>
        <span class="dock-label">{{ item.label }}</span>
      </a>
      <button
        type="button"
        class="dock-item"
        [class.is-active]="layout.sidebarOpen$ | async"
        (click)="layout.toggleSidebar()"
        aria-label="كل الصفحات"
      >
        <span class="material-symbols-outlined">apps</span>
        <span class="dock-label">المزيد</span>
      </button>
    </nav>
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      .dock {
        position: fixed;
        right: 0.75rem;
        left: 0.75rem;
        bottom: calc(0.65rem + env(safe-area-inset-bottom, 0px));
        z-index: 65;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.25rem;
        height: 3.6rem;
        padding: 0.4rem;
        border-radius: 1.4rem;
        background: linear-gradient(160deg, rgba(15, 107, 85, 0.96), rgba(6, 51, 40, 0.97));
        backdrop-filter: blur(16px) saturate(1.3);
        -webkit-backdrop-filter: blur(16px) saturate(1.3);
        border: 1px solid rgba(223, 193, 123, 0.18);
        box-shadow:
          0 14px 34px rgba(5, 41, 32, 0.32),
          inset 0 1px 0 rgba(255, 255, 255, 0.08);
      }

      .dock-item {
        flex: 1 1 0;
        min-width: 2.75rem;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        padding: 0 0.5rem;
        border: 0;
        border-radius: 1.05rem;
        background: transparent;
        color: rgba(255, 255, 255, 0.62);
        text-decoration: none;
        font-family: inherit;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition:
          flex-grow 0.35s cubic-bezier(0.22, 1, 0.36, 1),
          background 0.25s ease,
          color 0.2s ease,
          transform 0.15s ease;
      }

      .dock-item:active {
        transform: scale(0.94);
      }

      .dock-item:focus-visible {
        outline: 2px solid #dfc17b;
        outline-offset: 2px;
      }

      .dock-item .material-symbols-outlined {
        font-size: 1.4rem !important;
        line-height: 1 !important;
        flex-shrink: 0;
      }

      .dock-label {
        max-width: 0;
        overflow: hidden;
        white-space: nowrap;
        font-size: 0.78rem;
        font-weight: 800;
        opacity: 0;
        transition: max-width 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease;
      }

      .dock-item.is-active {
        flex-grow: 2.4;
        color: #073328;
        background: linear-gradient(145deg, #f3de9a, #c8a24b);
        box-shadow: 0 6px 16px rgba(200, 162, 75, 0.35);
      }

      .dock-item.is-active .material-symbols-outlined {
        font-variation-settings: 'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24;
      }

      .dock-item.is-active .dock-label {
        max-width: 6rem;
        opacity: 1;
      }

      .dock.menu-open a.dock-item.is-active {
        flex-grow: 1;
        color: #dfc17b;
        background: rgba(255, 255, 255, 0.08);
        box-shadow: none;
      }

      .dock.menu-open a.dock-item.is-active .dock-label {
        max-width: 0;
        opacity: 0;
      }

      @media (prefers-reduced-motion: reduce) {
        .dock-item,
        .dock-label {
          transition: none;
        }
      }

      @media (min-width: 1024px) {
        .dock {
          display: none;
        }
      }
    `,
  ],
})
export class BottomNavComponent {
  items = [
    { label: 'الرئيسية', route: '/dashboard', icon: 'space_dashboard', exact: true },
    { label: 'الطلبات', route: '/orders', icon: 'local_shipping', exact: false },
    { label: 'المنتجات', route: '/products', icon: 'inventory_2', exact: false },
    { label: 'العملاء', route: '/customers', icon: 'groups', exact: false },
  ];

  constructor(public layout: LayoutService) {}
}
