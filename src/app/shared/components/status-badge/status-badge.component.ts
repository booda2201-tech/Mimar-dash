import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusType } from '../../../core/models';

const STATUS_MAP: Record<string, { label: string; classes: string }> = {
  active: { label: 'نشط', classes: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  inactive: { label: 'غير نشط', classes: 'bg-gray-100 text-gray-600 border-gray-200' },
  pending: { label: 'معلق', classes: 'bg-amber-50 text-amber-800 border-amber-200' },
  completed: { label: 'مكتمل', classes: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  cancelled: { label: 'ملغي', classes: 'bg-red-50 text-red-800 border-red-200' },
  canceled: { label: 'ملغي', classes: 'bg-red-50 text-red-800 border-red-200' },
  shipping: { label: 'في الطريق', classes: 'bg-blue-50 text-blue-800 border-blue-200' },
  shipped: { label: 'في الطريق', classes: 'bg-blue-50 text-blue-800 border-blue-200' },
  intransit: { label: 'في الطريق', classes: 'bg-blue-50 text-blue-800 border-blue-200' },
  processing: { label: 'قيد التجهيز', classes: 'bg-amber-50 text-amber-800 border-amber-200' },
  preparing: { label: 'قيد التجهيز', classes: 'bg-amber-50 text-amber-800 border-amber-200' },
  inprogress: { label: 'قيد التجهيز', classes: 'bg-amber-50 text-amber-800 border-amber-200' },
  delivered: { label: 'تم التسليم', classes: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  low: { label: 'مخزون منخفض', classes: 'bg-amber-50 text-amber-800 border-amber-200' },
  out: { label: 'نفد', classes: 'bg-red-50 text-red-800 border-red-200' },
  success: { label: 'نجاح', classes: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  warning: { label: 'تحذير', classes: 'bg-amber-50 text-amber-800 border-amber-200' },
  danger: { label: 'خطر', classes: 'bg-red-50 text-red-800 border-red-200' },
  info: { label: 'معلومة', classes: 'bg-blue-50 text-blue-800 border-blue-200' },
  confirmed: { label: 'مؤكد', classes: 'bg-blue-50 text-blue-800 border-blue-200' },
  approved: { label: 'معتمد', classes: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  rejected: { label: 'مرفوض', classes: 'bg-red-50 text-red-800 border-red-200' },
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="status-badge"
      [ngClass]="meta.classes"
    >
      {{ label || meta.label }}
    </span>
  `,
  styles: [
    `
      .status-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.2rem 0.7rem;
        border-radius: 999px;
        border-width: 1px;
        font-size: 0.75rem;
        font-weight: 800;
        line-height: 1.3;
        white-space: nowrap;
        max-width: 100%;
      }
    `,
  ],
})
export class StatusBadgeComponent {
  @Input() status: StatusType | string = 'active';
  @Input() label = '';

  get meta() {
    const key = String(this.status ?? '')
      .trim()
      .toLowerCase()
      .replace(/[\s_-]/g, '');
    return STATUS_MAP[key] || STATUS_MAP[String(this.status)] || STATUS_MAP['pending'];
  }
}
