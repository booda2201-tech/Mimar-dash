import {
  Component,
  Input,
  AfterViewInit,
  ElementRef,
  ViewChild,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCardData } from '../../../core/models';
import { AnimationService } from '../../../core/services/animation.service';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.scss'],
})
export class StatCardComponent implements AfterViewInit, OnChanges {
  @Input() data!: StatCardData;
  @Input() loading = false;
  @ViewChild('valueEl') valueEl!: ElementRef<HTMLElement>;

  private animated = false;

  constructor(private animation: AnimationService) {}

  ngAfterViewInit(): void {
    this.tryAnimate();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && !changes['data'].firstChange) {
      this.animated = false;
      setTimeout(() => this.tryAnimate(), 50);
    }
  }

  get numeric(): boolean {
    return typeof this.data?.value === 'number';
  }

  private tryAnimate(): void {
    if (this.animated || this.loading || !this.data || !this.valueEl) {
      return;
    }
    if (this.data.animate && typeof this.data.value === 'number') {
      this.animation.countUp(
        this.valueEl.nativeElement,
        this.data.value,
        1.3,
        this.data.suffix || '',
        this.data.prefix || ''
      );
      this.animated = true;
    }
  }
}
