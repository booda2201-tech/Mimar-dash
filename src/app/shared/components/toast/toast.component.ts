import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let t of toast.toasts$ | async"
        class="min-w-[280px] max-w-sm px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-3 bg-white animate-[slideIn_0.3s_ease]"
        [ngClass]="{
          'border-emerald-200 text-emerald-800': t.type === 'success',
          'border-red-200 text-red-800': t.type === 'error',
          'border-amber-200 text-amber-800': t.type === 'warning',
          'border-blue-200 text-blue-800': t.type === 'info'
        }"
      >
        <span class="material-symbols-outlined text-[20px]">
          {{
            t.type === 'success'
              ? 'check_circle'
              : t.type === 'error'
              ? 'error'
              : t.type === 'warning'
              ? 'warning'
              : 'info'
          }}
        </span>
        <span class="flex-1">{{ t.message }}</span>
        <button type="button" class="opacity-60 hover:opacity-100" (click)="toast.dismiss(t.id)">
          <span class="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(-12px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `,
  ],
})
export class ToastComponent {
  constructor(public toast: ToastService) {}
}
