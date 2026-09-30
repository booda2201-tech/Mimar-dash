import { Injectable, ElementRef } from '@angular/core';
import gsap from 'gsap';

@Injectable({ providedIn: 'root' })
export class AnimationService {
  fadeUpStagger(elements: Element | Element[] | string, delay = 0): gsap.core.Tween | null {
    const targets = typeof elements === 'string' ? document.querySelectorAll(elements) : elements;
    if (!targets || (targets as NodeList).length === 0) {
      return null;
    }
    return gsap.from(targets, {
      opacity: 0,
      y: 24,
      duration: 0.55,
      stagger: 0.05,
      delay,
      ease: 'power2.out',
      clearProps: 'all',
    });
  }

  countUp(el: HTMLElement, end: number, duration = 1.4, suffix = '', prefix = ''): void {
    const obj = { val: 0 };
    gsap.to(obj, {
      val: end,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = `${prefix}${Math.round(obj.val).toLocaleString('en-US')}${suffix}`;
      },
    });
  }

  pageTransition(el: HTMLElement): void {
    gsap.fromTo(
      el,
      { opacity: 0, x: 16 },
      { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }
    );
  }

  sidebarSlide(el: HTMLElement, open: boolean): void {
    gsap.to(el, {
      x: open ? 0 : '100%',
      duration: 0.35,
      ease: 'power3.out',
    });
  }

  pulse(el: ElementRef | HTMLElement): void {
    const target = el instanceof ElementRef ? el.nativeElement : el;
    gsap.fromTo(target, { scale: 1 }, { scale: 0.96, duration: 0.1, yoyo: true, repeat: 1 });
  }
}
