import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { SelectComponent, SelectOption } from '../../shared/components/select/select.component';
import { NotificationsService } from '../../core/services/data.services';
import { AnimationService } from '../../core/services/animation.service';
import { ToastService } from '../../core/services/toast.service';
import { NotificationItem, StatCardData } from '../../core/models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, StatCardComponent, SelectComponent],
  templateUrl: './notifications.component.html',
})
export class NotificationsComponent implements OnInit, AfterViewInit {
  loading = true;
  items: NotificationItem[] = [];
  filter: NotificationItem['type'] | 'all' = 'all';

  stats: StatCardData[] = [
    { title: 'تنبيهات نشطة', value: 0, change: 'بانتظار API', changeType: 'neutral', icon: 'notifications_active', animate: true },
    { title: 'مخزون حرج', value: 0, change: 'بانتظار API', changeType: 'neutral', icon: 'inventory', animate: true },
    { title: 'تحصيلات مستحقة', value: 0, change: 'بانتظار API', changeType: 'neutral', icon: 'receipt', animate: true },
    { title: 'معدل استجابة SMS/Push', value: 0, change: 'بانتظار API', changeType: 'neutral', icon: 'sms', suffix: '%', animate: true },
  ];

  audienceOptions: SelectOption[] = [
    { value: 'all', label: 'جميع المستخدمين' },
    { value: 'contractors', label: 'المقاولين' },
    { value: 'agents', label: 'الوكلاء' },
    { value: 'drivers', label: 'السائقين' },
  ];

  form = this.fb.group({
    audience: ['all', Validators.required],
    channels: this.fb.group({
      push: [true],
      sms: [false],
      email: [true],
    }),
    title: ['', [Validators.required, Validators.minLength(3)]],
    message: ['', [Validators.required, Validators.maxLength(240)]],
    deepLink: [''],
    coupon: [''],
  });

  constructor(
    private service: NotificationsService,
    private fb: FormBuilder,
    private animation: AnimationService,
    private host: ElementRef,
    public toast: ToastService
  ) {}

  ngOnInit(): void {
    this.service.getAll().subscribe((d) => {
      this.items = d;
      this.loading = false;
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.animation.fadeUpStagger(this.host.nativeElement.querySelectorAll('.anim-item')), 80);
  }

  get filtered(): NotificationItem[] {
    return this.filter === 'all' ? this.items : this.items.filter((i) => i.type === this.filter);
  }

  markAll(): void {
    this.service.markAllRead().subscribe(() => {
      this.items = this.items.map((i) => ({ ...i, read: true }));
      this.toast.success('تم تحديد جميع الإشعارات كمقروءة');
    });
  }

  send(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('أكمل عنوان ونص الإشعار');
      return;
    }
    this.toast.success('تم جدولة/إرسال التنبيه الجماعي');
    this.form.patchValue({ title: '', message: '', coupon: '', deepLink: '' });
  }

  priorityClass(p: string): string {
    if (p === 'high') return 'border-r-red-500';
    if (p === 'medium') return 'border-r-amber-500';
    return 'border-r-blue-400';
  }
}
