import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RestaurantAuthService } from '../../core/services/restaurant-auth.service';

@Component({
  selector: 'app-shop-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <main class="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-10">
      <form (ngSubmit)="submit()" class="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-5">
        <div class="text-center">
          <div class="mx-auto w-14 h-14 rounded-2xl bg-indigo-600 text-white grid place-items-center text-2xl">🏪</div>
          <h1 class="mt-4 text-2xl font-extrabold text-slate-900">เข้าสู่ระบบร้านค้า</h1>
          <p class="mt-2 text-xs text-slate-500">บัญชีร้านจะดูและรับออร์เดอร์ของร้านตัวเองเท่านั้น</p>
        </div>
        @if (error()) { <div class="rounded-xl bg-rose-50 text-rose-700 px-3 py-2 text-xs">{{ error() }}</div> }
        <label class="block text-xs font-semibold text-slate-700">เบอร์โทรศัพท์
          <input [(ngModel)]="phone" name="phone" type="tel" required autocomplete="username" class="mt-1 w-full rounded-xl border bg-slate-50 px-3 py-3" placeholder="08xxxxxxxx" />
        </label>
        <label class="block text-xs font-semibold text-slate-700">รหัสผ่าน
          <input [(ngModel)]="password" name="password" type="password" required autocomplete="current-password" class="mt-1 w-full rounded-xl border bg-slate-50 px-3 py-3" />
        </label>
        <button [disabled]="loading()" class="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-3 text-sm font-bold">{{ loading() ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่หน้ารับออร์เดอร์' }}</button>
        <a routerLink="/" class="block text-center text-xs text-slate-500 hover:text-indigo-600">กลับหน้าสั่งอาหาร</a>
      </form>
    </main>
  `,
})
export class ShopLoginComponent {
  phone = '';
  password = '';
  loading = signal(false);
  error = signal('');

  constructor(private auth: RestaurantAuthService, private router: Router) {}

  submit(): void {
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.phone, this.password).subscribe({
      next: () => this.router.navigate(['/shop/orders']),
      error: (err) => {
        this.error.set(err.error?.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบเบอร์โทรศัพท์และรหัสผ่าน');
        this.loading.set(false);
      },
    });
  }
}
