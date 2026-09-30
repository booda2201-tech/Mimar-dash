import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  showPassword = false;
  submitting = false;

  form = this.fb.group({
    email: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true],
  });

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toast: ToastService,
    private auth: AuthService
  ) {}

  get emailCtrl() {
    return this.form.get('email');
  }

  get passwordCtrl() {
    return this.form.get('password');
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('يرجى إدخال بيانات الدخول بشكل صحيح');
      return;
    }
    this.submitting = true;
    const emailOrPhone = (this.form.value.email || '').trim();
    const password = this.form.value.password || '';
    this.auth.login(emailOrPhone, password).subscribe({
      next: () => {
        this.submitting = false;
        this.toast.success('تم تسجيل الدخول بنجاح');
        this.router.navigateByUrl('/dashboard');
      },
      error: (err) => {
        this.submitting = false;
        const status = err?.status;
        if (status === 401 || status === 400) {
          this.toast.error('بيانات الدخول غير صحيحة');
        } else {
          this.toast.error('فشل الدخول — تأكد أن الباك اند شغال وعنوان الـ proxy صحيح');
        }
      },
    });
  }
}
