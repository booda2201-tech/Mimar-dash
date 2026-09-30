import { AfterViewInit, Component, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AnimationService } from '../../core/services/animation.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

type SettingsTab = 'general' | 'logistics' | 'tax' | 'payments' | 'maintenance';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements AfterViewInit {
  tab: SettingsTab = 'general';

  tabs: { key: SettingsTab; label: string; icon: string; desc: string }[] = [
    { key: 'general', label: 'الإعدادات العامة', icon: 'tune', desc: 'هوية المنصة وبيانات التواصل الرسمية' },
    { key: 'logistics', label: 'اللوجستيات والأسطول', icon: 'local_shipping', desc: 'تتبع الشحنات وتسعير النقل والتفريغ' },
    { key: 'tax', label: 'الضرائب وZATCA', icon: 'receipt_long', desc: 'ضريبة القيمة المضافة والربط مع فاتورة' },
    { key: 'payments', label: 'بوابات الدفع', icon: 'credit_card', desc: 'تفعيل قنوات التحصيل المتاحة للمقاولين' },
    { key: 'maintenance', label: 'وضع الصيانة', icon: 'construction', desc: 'إيقاف مؤقت للواجهة دون تعطيل التوصيل الجاري' },
  ];

  paymentOptions = [
    { control: 'mada' as const, label: 'مدى', desc: 'بطاقات مدى المحلية', icon: 'account_balance' },
    { control: 'sadad' as const, label: 'سداد', desc: 'فواتير سداد الحكومية', icon: 'receipt' },
    { control: 'visa' as const, label: 'فيزا / ماستركارد', desc: 'بطاقات ائتمان دولية', icon: 'credit_card' },
    { control: 'credit60' as const, label: 'ائتمان آجل 60 يوم', desc: 'للمقاولين المعتمدين', icon: 'schedule' },
  ];

  form = this.fb.group({
    nameAr: ['معمار'],
    nameEn: ['MIMAR'],
    tagline: ['منصة مواد البناء للمقاولين'],
    adminName: ['م. عبد الرحمن'],
    cr: ['1010123456'],
    vat: ['300123456700003'],
    email: ['support@mimar.sa'],
    hotline: ['920012345'],
    city: ['الرياض'],
    address: ['حي النرجس، طريق الملك سلمان'],
    gps: [true],
    hydraulic: [true],
    nightDelivery: [false],
    kmRate: [4.75],
    tonRate: [28],
    minTrailer: [30],
    vatRate: [15],
    zatcaEnv: ['production'],
    mada: [true],
    sadad: [true],
    visa: [true],
    credit60: [true],
    maintenance: [false],
    maintenanceMsg: ['المنصة تحت صيانة مجدولة. نعود قريباً.'],
  });

  constructor(
    private fb: FormBuilder,
    private animation: AnimationService,
    private host: ElementRef,
    public toast: ToastService,
    private auth: AuthService,
    private router: Router
  ) {}

  mobileDetail = false;

  readonly mobileGroups: { title: string; tabs: SettingsTab[] }[] = [
    { title: 'الهوية والحساب', tabs: ['general'] },
    { title: 'التشغيل والتحصيل', tabs: ['logistics', 'payments', 'tax'] },
    { title: 'النظام', tabs: ['maintenance'] },
  ];

  get activeTab() {
    return this.tabs.find((t) => t.key === this.tab) ?? this.tabs[0];
  }

  get adminInitial(): string {
    const name = String(this.form.value.adminName || 'عبد الرحمن').replace(/^م\.\s*/, '').trim();
    return name.charAt(0) || 'ع';
  }

  get activePayments(): number {
    return this.paymentOptions.filter((p) => this.form.get(p.control)?.value).length;
  }

  tabOf(key: SettingsTab) {
    return this.tabs.find((t) => t.key === key) ?? this.tabs[0];
  }

  summary(key: SettingsTab): string {
    const v = this.form.value;
    switch (key) {
      case 'general':
        return [v.nameAr, v.city].filter(Boolean).join(' · ');
      case 'logistics':
        return [v.gps ? 'تتبع GPS' : '', v.hydraulic ? 'تفريغ هيدروليكي' : '', v.nightDelivery ? 'توصيل ليلي' : '']
          .filter(Boolean)
          .join(' · ') || 'كل الخيارات متوقفة';
      case 'payments':
        return `${this.activePayments} من ${this.paymentOptions.length} قنوات مفعّلة`;
      case 'tax':
        return `ضريبة ${v.vatRate}% · ${v.zatcaEnv === 'production' ? 'بيئة إنتاج' : 'بيئة تجريبية'}`;
      case 'maintenance':
        return v.maintenance ? 'المنصة في وضع الصيانة' : 'المنصة شغّالة طبيعي';
    }
  }

  openMobile(key: SettingsTab): void {
    this.tab = key;
    this.mobileDetail = true;
    window.scrollTo({ top: 0 });
  }

  closeMobile(): void {
    this.mobileDetail = false;
    window.scrollTo({ top: 0 });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.animation.fadeUpStagger(this.host.nativeElement.querySelectorAll('.anim-item')), 80);
  }

  setTab(key: SettingsTab): void {
    this.tab = key;
  }

  save(): void {
    this.toast.success('تم حفظ إعدادات المنصة بنجاح');
  }

  cancel(): void {
    this.form.reset({
      nameAr: 'معمار',
      nameEn: 'MIMAR',
      tagline: 'منصة مواد البناء للمقاولين',
      adminName: 'م. عبد الرحمن',
      cr: '1010123456',
      vat: '300123456700003',
      email: 'support@mimar.sa',
      hotline: '920012345',
      city: 'الرياض',
      address: 'حي النرجس، طريق الملك سلمان',
      gps: true,
      hydraulic: true,
      nightDelivery: false,
      kmRate: 4.75,
      tonRate: 28,
      minTrailer: 30,
      vatRate: 15,
      zatcaEnv: 'production',
      mada: true,
      sadad: true,
      visa: true,
      credit60: true,
      maintenance: false,
      maintenanceMsg: 'المنصة تحت صيانة مجدولة. نعود قريباً.',
    });
    this.toast.info('تم إلغاء التغييرات');
  }
}
