import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../shared/components/topbar/topbar.component';
import { BottomNavComponent } from '../shared/components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent, BottomNavComponent],
  template: `
    <div class="app-shell">
      <app-sidebar></app-sidebar>
      <div class="app-main">
        <app-topbar></app-topbar>
        <main class="app-content">
          <router-outlet></router-outlet>
        </main>
      </div>
      <app-bottom-nav></app-bottom-nav>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        min-height: 100dvh;
      }

      .app-shell {
        min-height: 100vh;
        min-height: 100dvh;
      }

      .app-main {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        min-height: 100dvh;
        min-width: 0;
      }

      .app-content {
        flex: 1;
        padding: 0.85rem;
        padding-bottom: calc(5.25rem + env(safe-area-inset-bottom, 0px));
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
      }

      @media (min-width: 768px) {
        .app-content {
          padding: 1.25rem;
          padding-bottom: calc(5.5rem + env(safe-area-inset-bottom, 0px));
        }
      }

      @media (min-width: 1024px) {
        .app-main {
          margin-right: 6.5rem;
        }

        .app-content {
          padding: 2rem;
          padding-bottom: 2rem;
        }
      }
    `,
  ],
})
export class MainLayoutComponent {}
