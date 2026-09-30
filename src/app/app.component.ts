import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LoadingScreenComponent } from './shared/components/loading-screen/loading-screen.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LoadingScreenComponent, ToastComponent],
  template: `
    <app-loading-screen></app-loading-screen>
    <app-toast></app-toast>
    <router-outlet></router-outlet>
  `,
  styles: [],
})
export class AppComponent {
  title = 'معمار | لوحة التحكم';
}
