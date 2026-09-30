import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { DetailViewComponent, DetailField } from '../../shared/components/detail-view/detail-view.component';
import { SelectComponent, SelectOption } from '../../shared/components/select/select.component';
import { TeamService } from '../../core/services/data.services';
import { AnimationService } from '../../core/services/animation.service';
import { ToastService } from '../../core/services/toast.service';
import { TeamMember, StatCardData, TableColumn } from '../../core/models';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StatCardComponent,
    DataTableComponent,
    ModalComponent,
    ConfirmDialogComponent,
    DetailViewComponent,
    SelectComponent,
  ],
  templateUrl: './team.component.html',
})
export class TeamComponent implements OnInit, AfterViewInit {
  loading = true;
  members: TeamMember[] = [];
  showModal = false;
  showView = false;
  showConfirm = false;
  showRoles = false;
  mode: 'add' | 'edit' = 'add';
  selected: TeamMember | null = null;
  viewFields: DetailField[] = [];

  stats: StatCardData[] = [
    { title: 'المشرفون النشطون', value: 0, change: 'بانتظار API', changeType: 'neutral', icon: 'group', animate: true },
    { title: 'الأدوار المعتمدة', value: 0, change: 'بانتظار API', changeType: 'neutral', icon: 'shield', animate: true },
    { title: 'الجلسات المفتوحة', value: 0, change: 'بانتظار API', changeType: 'neutral', icon: 'devices', animate: true },
    { title: 'معدل تفعيل 2FA', value: 0, change: 'بانتظار API', changeType: 'neutral', icon: 'security', suffix: '%', animate: true },
  ];

  roles = [
    { name: 'Super Admin', desc: 'صلاحيات كاملة على المنصة', perms: 32 },
    { name: 'مدير المبيعات', desc: 'الطلبات والعملاء والعروض', perms: 18 },
    { name: 'مدير المستودع', desc: 'المخزون والمنتجات والتوريد', perms: 14 },
    { name: 'المالية', desc: 'المحفظة والفواتير والتقارير', perms: 12 },
    { name: 'اللوجستيات', desc: 'الشحن والأسطول والتتبع', perms: 10 },
  ];

  roleOptions: SelectOption[] = [
    'Super Admin',
    'مدير المبيعات',
    'مدير المستودع',
    'المحاسبة',
    'مشرف التوصيل',
    'دعم العملاء',
  ].map((r) => ({ label: r, value: r }));

  statusOptions: SelectOption[] = [
    { value: 'active', label: 'نشط' },
    { value: 'inactive', label: 'موقوف' },
  ];

  columns: TableColumn[] = [
    { key: 'name', label: 'المسؤول', sortable: true },
    { key: 'email', label: 'البريد' },
    { key: 'role', label: 'الدور', sortable: true },
    { key: 'department', label: 'القسم' },
    { key: 'lastActive', label: 'آخر نشاط' },
    { key: 'status', label: 'الحالة', type: 'status' },
    { key: 'actions', label: 'إجراءات', type: 'actions' },
  ];

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    role: ['مدير المبيعات', Validators.required],
    department: ['المبيعات', Validators.required],
    status: ['active' as TeamMember['status'], Validators.required],
    twoFa: [true],
  });

  constructor(
    private service: TeamService,
    private fb: FormBuilder,
    private animation: AnimationService,
    private host: ElementRef,
    public toast: ToastService
  ) {}

  get formTitle(): string {
    return this.mode === 'edit' ? 'تعديل عضو الفريق' : 'إضافة عضو جديد';
  }

  ngOnInit(): void {
    this.service.getAll().subscribe((d) => {
      this.members = d;
      this.loading = false;
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.animation.fadeUpStagger(this.host.nativeElement.querySelectorAll('.anim-item')), 80);
  }

  openAdd(): void {
    this.mode = 'add';
    this.selected = null;
    this.form.reset({ role: 'مدير المبيعات', department: 'المبيعات', status: 'active', twoFa: true });
    this.showModal = true;
  }

  openEdit(m: TeamMember): void {
    this.mode = 'edit';
    this.selected = m;
    this.form.reset({
      name: m.name,
      email: m.email,
      phone: m.phone,
      role: m.role,
      department: m.department,
      status: m.status,
      twoFa: true,
    });
    this.showModal = true;
  }

  openView(m: TeamMember): void {
    this.selected = m;
    this.viewFields = [
      { label: 'البريد', value: m.email },
      { label: 'الجوال', value: m.phone },
      { label: 'الدور', value: m.role },
      { label: 'القسم', value: m.department },
      { label: 'آخر نشاط', value: m.lastActive, span: 2 },
      { label: 'الحالة', value: m.status, type: 'status', span: 2 },
    ];
    this.showView = true;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('أكمل بيانات العضو بشكل صحيح');
      return;
    }
    const v = this.form.getRawValue();
    if (this.mode === 'edit' && this.selected) {
      this.members = this.members.map((m) =>
        m.id === this.selected!.id
          ? {
              ...m,
              name: v.name!,
              email: v.email!,
              phone: v.phone!,
              role: v.role!,
              department: v.department!,
              status: v.status as TeamMember['status'],
            }
          : m
      );
      this.toast.success('تم تحديث بيانات العضو');
    } else {
      this.members = [
        {
          id: 'T' + Date.now(),
          name: v.name!,
          email: v.email!,
          phone: v.phone!,
          role: v.role!,
          department: v.department!,
          lastActive: 'الآن',
          status: (v.status as TeamMember['status']) || 'active',
        },
        ...this.members,
      ];
      this.toast.success('تمت إضافة عضو الفريق');
    }
    this.showModal = false;
  }

  onAction(e: { action: string; row: Record<string, unknown> }): void {
    const m = e.row as unknown as TeamMember;
    if (e.action === 'edit') this.openEdit(m);
    else if (e.action === 'delete') {
      this.selected = m;
      this.showConfirm = true;
    } else this.openView(m);
  }

  confirmDelete(): void {
    if (!this.selected) return;
    this.members = this.members.filter((m) => m.id !== this.selected!.id);
    this.showConfirm = false;
    this.toast.success('تم حذف العضو');
  }

  err(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!(c && c.touched && c.invalid);
  }
}
