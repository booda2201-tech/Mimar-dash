import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  template: `
    <app-modal [open]="open" [title]="title" maxWidth="420px" (close)="cancel.emit()">
      <p class="text-sm text-gray-600 mb-6">{{ message }}</p>
      <div class="flex items-center justify-end gap-3">
        <button type="button" class="btn-outline" (click)="cancel.emit()">{{ cancelText }}</button>
        <button
          type="button"
          [class]="danger ? 'btn-danger' : 'btn-primary'"
          (click)="confirm.emit()"
        >
          {{ confirmText }}
        </button>
      </div>
    </app-modal>
  `,
})
export class ConfirmDialogComponent {
  @Input() open = false;
  @Input() title = 'تأكيد العملية';
  @Input() message = 'هل أنت متأكد من المتابعة؟';
  @Input() confirmText = 'تأكيد';
  @Input() cancelText = 'إلغاء';
  @Input() danger = false;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
