import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Chart,
  ChartConfiguration,
  ChartType,
  registerables,
} from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-chart-wrapper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full" [style.height]="height">
      <canvas #canvas></canvas>
    </div>
  `,
})
export class ChartWrapperComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() type: ChartType = 'line';
  @Input() data!: ChartConfiguration['data'];
  @Input() options: ChartConfiguration['options'] = {};
  @Input() height = '280px';
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['data'] || changes['type']) && this.chart) {
      this.render();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = undefined;
  }

  /** Chart.js بيعدّل في arrays الداتا نفسها، فلازم كل شارت ياخد نسخة خاصة بيه */
  private cloneData(data: ChartConfiguration['data']): ChartConfiguration['data'] {
    return {
      ...data,
      labels: data.labels ? [...data.labels] : undefined,
      datasets: (data.datasets || []).map((ds) => ({
        ...ds,
        data: Array.isArray(ds.data) ? [...ds.data] : ds.data,
      })) as ChartConfiguration['data']['datasets'],
    };
  }

  private render(): void {
    if (!this.canvas || !this.data) {
      return;
    }
    this.chart?.destroy();
    const defaults: ChartConfiguration['options'] = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1200, easing: 'easeOutQuart' },
      plugins: {
        legend: {
          position: 'bottom',
          rtl: true,
          labels: { font: { family: 'Cairo' }, usePointStyle: true },
        },
      },
      scales:
        this.type === 'doughnut' || this.type === 'pie'
          ? undefined
          : {
              x: {
                grid: { display: false },
                ticks: { font: { family: 'Cairo' } },
              },
              y: {
                grid: { color: '#F3F4F6' },
                ticks: { font: { family: 'Cairo' } },
              },
            },
    };

    this.chart = new Chart(this.canvas.nativeElement, {
      type: this.type,
      data: this.cloneData(this.data),
      options: {
        ...defaults,
        ...this.options,
        plugins: {
          ...defaults.plugins,
          ...(this.options?.plugins || {}),
          legend: {
            ...defaults.plugins?.legend,
            ...(this.options?.plugins?.legend || {}),
          },
        },
        scales:
          this.type === 'doughnut' || this.type === 'pie'
            ? undefined
            : {
                ...(defaults.scales || {}),
                ...(this.options?.scales || {}),
              },
      },
    });
  }
}
