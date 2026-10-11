import { Component, ElementRef, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';

type Step = 'email' | 'code' | 'password' | 'done';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pass && confirm && pass !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['../login/login.component.scss', './forgot-password.component.scss'],
})
export class ForgotPasswordComponent implements OnDestroy {
  @ViewChildren('codeBox') codeBoxes?: QueryList<ElementRef<HTMLInputElement>>;

  readonly steps: { key: Exclude<Step, 'done'>; label: string }[] = [
    { key: 'email', label: 'البريد' },
    { key: 'code', label: 'كود التحقق' },
    { key: 'password', label: 'كلمة جديدة' },
  ];

  step: Step = 'email';
  submitting = false;
  showPassword = false;
  digits: string[] = Array(CODE_LENGTH).fill('');
  codeError = false;
  resendIn = 0;
  private resetToken: string | null = null;
  private timer?: ReturnType<typeof setInterval>;

  emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  passwordForm = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch }
  );

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toast: ToastService,
    private auth: AuthService
  ) {}

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  get email(): string {
    return (this.emailForm.value.email || '').trim();
  }

  get code(): string {
    return this.digits.join('');
  }

  get stepIndex(): number {
    return this.step === 'done' ? this.steps.length : this.steps.findIndex((s) => s.key === this.step);
  }

  get strength(): number {
    const v = this.passwordForm.value.password || '';
    if (!v) return 0;
    let score = 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
    if (/\d/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    return Math.max(1, score);
  }

  get strengthLabel(): string {
    return ['', 'ضعيفة', 'متوسطة', 'جيدة', 'قوية'][this.strength];
  }

  get strengthColor(): string {
    return ['', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500', 'bg-brand-primary'][this.strength];
  }

  get mismatch(): boolean {
    return this.passwordForm.hasError('mismatch') && !!this.passwordForm.get('confirmPassword')?.touched;
  }

  fieldInvalid(form: 'email' | 'password', name: string): boolean {
    const group: AbstractControl = form === 'email' ? this.emailForm : this.passwordForm;
    const c = group.get(name);
    return !!c && c.invalid && c.touched;
  }

  /* ---------- الخطوة 1: إرسال الكود ---------- */

  sendCode(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.auth.requestPasswordReset(this.email).subscribe({
      next: () => {
        this.submitting = false;
        this.digits = Array(CODE_LENGTH).fill('');
        this.codeError = false;
        this.step = 'code';
        this.startResendTimer();
        this.toast.success('تم إرسال كود التحقق إلى بريدك');
        setTimeout(() => this.focusBox(0));
      },
      error: (err) => {
        this.submitting = false;
        this.toast.error(this.errorMessage(err, 'تعذّر إرسال الكود'));
      },
    });
  }

  resend(): void {
    if (this.resendIn > 0 || this.submitting) return;
    this.sendCode();
  }

  changeEmail(): void {
    clearInterval(this.timer);
    this.resendIn = 0;
    this.step = 'email';
  }

  /* ---------- الخطوة 2: التحقق من الكود ---------- */

  onDigitInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');
    if (value.length > 1) {
      this.fillFrom(index, value);
      return;
    }
    this.digits[index] = value;
    input.value = value;
    this.codeError = false;
    if (value && index < CODE_LENGTH - 1) this.focusBox(index + 1);
    if (this.code.length === CODE_LENGTH) this.verifyCode();
  }

  onDigitKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.digits[index] && index > 0) {
      event.preventDefault();
      this.digits[index - 1] = '';
      this.focusBox(index - 1);
    } else if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      event.preventDefault();
      this.focusBox(index + 1);
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusBox(index - 1);
    }
  }

  onPaste(event: ClipboardEvent): void {
    const text = (event.clipboardData?.getData('text') || '').replace(/\D/g, '');
    if (!text) return;
    event.preventDefault();
    this.fillFrom(0, text);
  }

  verifyCode(): void {
    if (this.code.length !== CODE_LENGTH) {
      this.codeError = true;
      return;
    }
    if (this.submitting) return;
    this.submitting = true;
    this.auth.verifyResetCode(this.email, this.code).subscribe({
      next: (token) => {
        this.submitting = false;
        this.resetToken = token;
        this.step = 'password';
      },
      error: (err) => {
        this.submitting = false;
        this.codeError = true;
        this.toast.error(err?.status === 400 ? 'الكود غير صحيح أو منتهي الصلاحية' : this.errorMessage(err, 'تعذّر التحقق من الكود'));
      },
    });
  }

  /* ---------- الخطوة 3: كلمة المرور الجديدة ---------- */

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  savePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.submitting = true;
    const v = this.passwordForm.getRawValue();
    this.auth
      .resetPassword({
        email: this.email,
        code: this.code,
        resetToken: this.resetToken,
        newPassword: v.password || '',
        confirmPassword: v.confirmPassword || '',
      })
      .subscribe({
        next: () => {
          this.submitting = false;
          clearInterval(this.timer);
          this.step = 'done';
        },
        error: (err) => {
          this.submitting = false;
          this.toast.error(this.errorMessage(err, 'تعذّر تغيير كلمة المرور'));
        },
      });
  }

  goToLogin(): void {
    this.router.navigateByUrl('/login');
  }

  /* ---------- مساعدات ---------- */

  private fillFrom(start: number, value: string): void {
    for (let i = 0; i < value.length && start + i < CODE_LENGTH; i++) this.digits[start + i] = value[i];
    this.codeError = false;
    const next = Math.min(start + value.length, CODE_LENGTH - 1);
    setTimeout(() => {
      this.codeBoxes?.forEach((box, i) => (box.nativeElement.value = this.digits[i]));
      this.focusBox(next);
      if (this.code.length === CODE_LENGTH) this.verifyCode();
    });
  }

  private focusBox(index: number): void {
    const box = this.codeBoxes?.get(index)?.nativeElement;
    box?.focus();
    box?.select();
  }

  private startResendTimer(): void {
    clearInterval(this.timer);
    this.resendIn = RESEND_SECONDS;
    this.timer = setInterval(() => {
      this.resendIn--;
      if (this.resendIn <= 0) clearInterval(this.timer);
    }, 1000);
  }

  private errorMessage(err: any, fallback: string): string {
    if (err?.status === 404) return 'خدمة استعادة كلمة المرور غير مفعّلة على السيرفر بعد';
    if (!err?.status) return 'تعذّر الاتصال بالسيرفر — تأكد من الإنترنت';
    const body = err?.error;
    if (typeof body?.message === 'string' && body.message.trim()) return body.message;
    if (Array.isArray(body?.errors) && body.errors.length) return String(body.errors[0]);
    return fallback;
  }
}
