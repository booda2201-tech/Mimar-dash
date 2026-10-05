import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutService } from '../../../core/services/layout.service';
import gsap from 'gsap';

@Component({
  selector: 'app-loading-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="visible"
      #loader
      class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-brand-primary"
    >
      <div class="text-center">
        <div
          class="w-28 h-28 mx-auto mb-6 rounded-2xl bg-white shadow-lg flex items-center justify-center logo-box overflow-hidden p-1.5"
        >
          <img src="assets/brand/mimar-logo.jpg" alt="معمار" class="w-full h-full object-contain" />
        </div>
        <p class="text-emerald-100/90 text-sm font-medium mb-4">جاري تحميل لوحة التحكم...</p>
        <div class="w-40 h-1.5 mx-auto rounded-full bg-white/10 overflow-hidden">
          <div class="h-full w-1/2 rounded-full bg-brand-gold bar"></div>
        </div>
      </div>
    </div>
  `,
})
export class LoadingScreenComponent implements AfterViewInit, OnDestroy {
  visible = true;

  constructor(private layout: LayoutService) {}

  private loops: gsap.core.Tween[] = [];

  ngAfterViewInit(): void {
    this.loops = [
      gsap.to('.logo-box', {
        scale: 1.05,
        duration: 0.8,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      }),
      gsap.to('.bar', {
        x: 80,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      }),
    ];

    setTimeout(() => {
      this.stopLoops();
      this.visible = false;
      this.layout.setLoading(false);
    }, 1600);
  }

  ngOnDestroy(): void {
    this.stopLoops();
  }

  private stopLoops(): void {
    this.loops.forEach((tween) => tween.kill());
    this.loops = [];
  }
}
