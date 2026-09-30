import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutService } from '../../../core/services/layout.service';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="open"
      class="modal-root"
      (click)="onBackdrop($event)"
    >
      <div class="modal-backdrop"></div>
      <div
        class="modal-panel"
        [style.maxWidth]="maxWidth"
        role="dialog"
        aria-modal="true"
      >
        <div class="modal-handle" aria-hidden="true"></div>
        <div class="modal-header">
          <h3>{{ title }}</h3>
          <button type="button" class="modal-close" (click)="close.emit()" aria-label="إغلاق">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="modal-body">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-root {
        position: fixed;
        inset: 0;
        z-index: 80;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding: 0;
      }

      .modal-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(11, 74, 58, 0.45);
        backdrop-filter: blur(4px);
      }

      .modal-panel {
        position: relative;
        width: 100%;
        max-height: min(92vh, 920px);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: #fff;
        border-radius: 1.35rem 1.35rem 0 0;
        box-shadow: 0 -12px 40px rgba(11, 74, 58, 0.2);
        padding-bottom: env(safe-area-inset-bottom, 0px);
        animation: sheetUp 0.22s ease;
      }

      .modal-handle {
        display: block;
        width: 2.5rem;
        height: 0.28rem;
        margin: 0.55rem auto 0;
        border-radius: 99px;
        background: rgba(11, 74, 58, 0.18);
        flex-shrink: 0;
      }

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.85rem 1.1rem;
        border-bottom: 1px solid rgba(11, 74, 58, 0.08);
        flex-shrink: 0;
        background: #fff;
      }

      .modal-header h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 800;
        color: #0b4a3a;
      }

      .modal-close {
        width: 2.25rem;
        height: 2.25rem;
        border: 0;
        border-radius: 0.7rem;
        background: transparent;
        color: #6b7280;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .modal-close:hover {
        background: #f3f4f6;
      }

      .modal-body {
        padding: 0.9rem;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }

      @keyframes sheetUp {
        from {
          opacity: 0.6;
          transform: translateY(24px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (min-width: 768px) {
        .modal-root {
          align-items: center;
          padding: 1rem;
        }

        .modal-panel {
          border-radius: 1.15rem;
          max-height: 90vh;
          padding-bottom: 0;
          animation: modalIn 0.18s ease;
        }

        .modal-handle {
          display: none;
        }

        .modal-header {
          padding: 1.15rem 1.25rem;
        }

        .modal-header h3 {
          font-size: 1.125rem;
        }

        .modal-body {
          padding: 1.25rem;
        }
      }

      @keyframes modalIn {
        from {
          opacity: 0;
          transform: translateY(10px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `,
  ],
})
export class ModalComponent implements OnChanges, OnDestroy {
  @Input() open = false;
  @Input() title = '';
  @Input() maxWidth = '560px';
  @Output() close = new EventEmitter<void>();

  private locked = false;

  constructor(private layout: LayoutService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) {
      if (this.open) this.lock();
      else this.unlock();
    }
  }

  ngOnDestroy(): void {
    this.unlock();
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.open) this.close.emit();
  }

  private lock(): void {
    if (this.locked) return;
    this.layout.lockScroll();
    this.locked = true;
  }

  private unlock(): void {
    if (!this.locked) return;
    this.layout.unlockScroll();
    this.locked = false;
  }
}
