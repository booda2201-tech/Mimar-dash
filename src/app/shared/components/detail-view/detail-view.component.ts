import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

export interface DetailField {
  label: string;
  value: string | number | null | undefined;
  type?: 'text' | 'currency' | 'status' | 'badge';
  span?: 1 | 2;
}

@Component({
  selector: 'app-detail-view',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  template: `
    <div class="detail-shell" *ngIf="fields?.length || image || images?.length">
      <div class="detail-gallery" *ngIf="image || images?.length">
        <img class="detail-main-img" [src]="image || images[0]" [alt]="title || 'صورة'" />
        <div class="detail-thumbs" *ngIf="(images?.length || 0) > 1">
          <img *ngFor="let img of images" [src]="img" alt="" />
        </div>
      </div>

      <div class="detail-hero" *ngIf="title || subtitle">
        <div class="detail-icon" *ngIf="icon">
          <span class="material-symbols-outlined">{{ icon }}</span>
        </div>
        <div class="min-w-0">
          <h4 class="detail-title" *ngIf="title">{{ title }}</h4>
          <p class="detail-sub" *ngIf="subtitle">{{ subtitle }}</p>
        </div>
        <app-status-badge *ngIf="status" [status]="status"></app-status-badge>
      </div>

      <div class="detail-grid">
        <div
          class="detail-item"
          *ngFor="let f of fields"
          [class.span-2]="f.span === 2"
        >
          <span class="detail-label">{{ f.label }}</span>
          <ng-container [ngSwitch]="f.type">
            <app-status-badge *ngSwitchCase="'status'" [status]="$any(f.value)"></app-status-badge>
            <span *ngSwitchCase="'currency'" class="detail-value font-extrabold text-brand-primary">
              {{ asCurrency(f.value) }}
            </span>
            <span *ngSwitchDefault class="detail-value">{{ f.value || '—' }}</span>
          </ng-container>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .detail-shell {
        display: flex;
        flex-direction: column;
        gap: 1.1rem;
      }
      .detail-gallery {
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
      }
      .detail-main-img {
        width: 100%;
        max-height: 220px;
        object-fit: cover;
        border-radius: 1rem;
        background: #f3f4f6;
        border: 1px solid rgba(11, 74, 58, 0.08);
      }
      .detail-thumbs {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
      }
      .detail-thumbs img {
        width: 52px;
        height: 52px;
        object-fit: cover;
        border-radius: 0.55rem;
        border: 1px solid rgba(11, 74, 58, 0.08);
      }
      .detail-hero {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        padding: 1rem;
        border-radius: 1rem;
        background: linear-gradient(135deg, rgba(11, 74, 58, 0.06), rgba(200, 162, 75, 0.1));
        border: 1px solid rgba(11, 74, 58, 0.08);
      }
      .detail-icon {
        width: 2.75rem;
        height: 2.75rem;
        border-radius: 0.85rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: #073328;
        background: linear-gradient(145deg, #dfc17b, #c8a24b);
      }
      .detail-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 800;
        color: #0b4a3a;
      }
      .detail-sub {
        margin: 0.2rem 0 0;
        font-size: 0.8125rem;
        color: #6b7280;
        font-weight: 600;
      }
      .detail-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
      }
      .detail-item {
        padding: 0.85rem 0.95rem;
        border-radius: 0.9rem;
        background: #f8faf9;
        border: 1px solid rgba(11, 74, 58, 0.06);
      }
      .detail-item.span-2 {
        grid-column: span 2;
      }
      .detail-label {
        display: block;
        font-size: 0.75rem;
        font-weight: 800;
        color: #9ca3af;
        margin-bottom: 0.3rem;
      }
      .detail-value {
        font-size: 0.9375rem;
        font-weight: 700;
        color: #111827;
        word-break: break-word;
      }
      @media (max-width: 640px) {
        .detail-shell {
          gap: 0.7rem;
        }
        .detail-main-img {
          max-height: none;
          aspect-ratio: 2.4 / 1;
          border-radius: 0.85rem;
        }
        .detail-thumbs img {
          width: 40px;
          height: 40px;
        }
        .detail-hero {
          gap: 0.6rem;
          padding: 0.6rem 0.7rem;
          border-radius: 0.85rem;
        }
        .detail-icon {
          width: 2.1rem;
          height: 2.1rem;
          border-radius: 0.65rem;
        }
        .detail-icon .material-symbols-outlined {
          font-size: 1.1rem;
        }
        .detail-hero > .min-w-0 {
          flex: 1;
        }
        .detail-title {
          font-size: 0.9rem;
          line-height: 1.35;
        }
        .detail-sub {
          font-size: 0.72rem;
        }
        .detail-grid {
          grid-template-columns: 1fr;
          gap: 0;
          border-radius: 0.85rem;
          border: 1px solid rgba(11, 74, 58, 0.08);
          background: #f8faf9;
          overflow: hidden;
        }
        .detail-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.6rem 0.8rem;
          border: 0;
          border-radius: 0;
          background: transparent;
        }
        .detail-item + .detail-item {
          border-top: 1px solid rgba(11, 74, 58, 0.06);
        }
        .detail-label {
          flex-shrink: 0;
          margin: 0;
          font-size: 0.72rem;
        }
        .detail-value {
          min-width: 0;
          font-size: 0.8125rem;
          text-align: left;
        }
        .detail-item.span-2 {
          grid-column: span 1;
          flex-direction: column;
          align-items: stretch;
          gap: 0.2rem;
        }
        .detail-item.span-2 .detail-value {
          text-align: start;
        }
      }
    `,
  ],
})
export class DetailViewComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() icon = '';
  @Input() status = '';
  @Input() image = '';
  @Input() images: string[] = [];
  @Input() fields: DetailField[] = [];

  asCurrency(value: unknown): string {
    return Number(value || 0).toLocaleString('en-US') + ' د.ك';
  }
}
