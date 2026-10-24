import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div class="max-w-md w-full bg-white rounded-3xl p-8 border border-orange-100 shadow-xl space-y-6">
        <!-- Header -->
        <div class="text-center space-y-2">
          <div class="w-14 h-14 mx-auto rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-slate-900/10">
            ⚙️
          </div>
          <h1 class="font-heading font-extrabold text-2xl text-slate-900">
            เข้าสู่ระบบผู้ดูแลระบบ (Admin)
          </h1>
          <p class="text-xs text-slate-500">
            EDU Food Order — ระบบจัดการร้านอาหาร ตึกครุศาสตร์
          </p>
          <p class="text-xs text-slate-600">
            แอดมินดูแลทุกร้าน ส่วนร้านค้าใช้บัญชีแยกเพื่อรับออร์เดอร์ของร้านตนเอง
          </p>
        </div>

        <!-- Admin account details -->
        <div class="bg-orange-50 border border-orange-200/80 rounded-2xl p-4 text-xs text-slate-700 space-y-1">
          <div class="font-bold text-brand-800 flex items-center gap-1.5">
            <span>🔑</span>
            <span>บัญชีผู้ดูแลระบบ</span>
          </div>
          <div class="text-[11px] text-slate-600">
            • เบอร์โทรศัพท์: <code class="bg-white px-1.5 py-0.5 rounded border border-orange-200 font-mono font-bold text-brand-700">0812345678</code>
          </div>
          <div class="text-[11px] text-slate-600">
            • ใช้รหัสผ่านที่กำหนดไว้ใน <code class="bg-white px-1.5 py-0.5 rounded border border-orange-200 font-mono font-bold text-brand-700">ADMIN_DEFAULT_PASSWORD</code> ในไฟล์ .env
          </div>
        </div>

        <!-- Login Form -->
        <form (ngSubmit)="onLogin()" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              เบอร์โทรศัพท์ผู้ดูแล
            </label>
            <input
              type="tel"
              [(ngModel)]="phone"
              name="phone"
              required
              placeholder="0812345678"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              รหัสผ่าน (Password)
            </label>
            <input
              type="password"
              [(ngModel)]="password"
              name="password"
              required
              placeholder="••••••••••••"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500"
            />
          </div>

          <button
            type="submit"
            [disabled]="isLoading()"
            class="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 transition cursor-pointer"
          >
            @if (isLoading()) {
              <svg class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>กำลังตรวจสอบสิทธิ์...</span>
            } @else {
              <span>เข้าสู่ระบบจัดการ</span>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            }
          </button>
        </form>

        <div class="text-center pt-2">
          <a routerLink="/" class="text-xs text-slate-500 hover:text-brand-600 transition">
            ← กลับหน้าหลักสำหรับผู้ใช้งาน
          </a>
        </div>
      </div>
    </div>
  `,
})
export class AdminLoginComponent {
  phone: string = '0812345678';
  password: string = '';
  isLoading = signal<boolean>(false);

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  onLogin() {
    if (!this.phone.trim() || !this.password) {
      this.toastService.error('กรุณากรอกเบอร์โทรศัพท์และรหัสผ่าน');
      return;
    }

    this.isLoading.set(true);
    this.authService.login(this.phone, this.password).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.toastService.success('ยินดีต้อนรับเข้าสู่ระบบจัดการ');
          this.router.navigate(['/admin/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || 'เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง';
        this.toastService.error(msg);
      },
    });
  }
}
