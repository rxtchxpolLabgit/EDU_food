import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo & Brand -->
          <div class="flex items-center gap-3">
            <a routerLink="/" class="flex items-center gap-2 group">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
              </div>
              <div class="flex flex-col">
                <span class="font-heading font-bold text-lg text-slate-900 tracking-tight leading-none group-hover:text-brand-600 transition">
                  EDU Food Order
                </span>
                <span class="text-[11px] text-brand-600 font-medium tracking-wide flex items-center gap-1 mt-0.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-fresh-500"></span>
                  ตึกครุศาสตร์ มหาวิทยาลัย
                </span>
              </div>
            </a>
          </div>

          <!-- Desktop Navigation Links -->
          <nav class="hidden md:flex items-center gap-1">
            <a
              routerLink="/"
              routerLinkActive="bg-orange-50 text-brand-600 font-semibold"
              [routerLinkActiveOptions]="{ exact: true }"
              class="px-3.5 py-2 rounded-lg text-sm text-slate-700 hover:text-brand-600 hover:bg-orange-50/60 transition"
            >
              หน้าแรก
            </a>
            <a
              routerLink="/track"
              routerLinkActive="bg-orange-50 text-brand-600 font-semibold"
              class="px-3.5 py-2 rounded-lg text-sm text-slate-700 hover:text-brand-600 hover:bg-orange-50/60 transition flex items-center gap-1.5"
            >
              <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
              </svg>
              ติดตามออร์เดอร์
            </a>
            <a
              routerLink="/admin/dashboard"
              routerLinkActive="bg-slate-900 text-white font-semibold"
              class="ml-2 px-3.5 py-2 rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-1.5"
            >
              <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              ระบบจัดการร้าน (Admin)
            </a>
          </nav>

          <!-- Right Actions: Cart & Mobile Toggle -->
          <div class="flex items-center gap-3">
            <!-- Cart Button -->
            <a
              routerLink="/cart"
              class="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-brand-700 border border-orange-200 transition group"
            >
              <div class="relative">
                <svg class="w-5 h-5 text-brand-600 group-hover:scale-110 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
                @if (cartService.itemCount() > 0) {
                  <span class="absolute -top-2.5 -right-2.5 bg-brand-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-bounce">
                    {{ cartService.itemCount() }}
                  </span>
                }
              </div>
              <span class="text-xs font-semibold hidden sm:inline">ตะกร้า</span>
              @if (cartService.totalAmount() > 0) {
                <span class="text-xs font-bold text-brand-800 bg-white px-2 py-0.5 rounded-md border border-orange-200 hidden sm:inline">
                  ฿{{ cartService.totalAmount() }}
                </span>
              }
            </a>

            <!-- Mobile Menu Toggle Button -->
            <button
              (click)="mobileMenuOpen.set(!mobileMenuOpen())"
              class="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                @if (!mobileMenuOpen()) {
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                } @else {
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                }
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile Menu Dropdown -->
        @if (mobileMenuOpen()) {
          <div class="md:hidden border-t border-orange-100 py-3 space-y-1">
            <a
              routerLink="/"
              (click)="mobileMenuOpen.set(false)"
              class="block px-4 py-2.5 rounded-lg text-sm text-slate-800 hover:bg-orange-50 font-medium"
            >
              🏠 หน้าแรก
            </a>
            <a
              routerLink="/track"
              (click)="mobileMenuOpen.set(false)"
              class="block px-4 py-2.5 rounded-lg text-sm text-slate-800 hover:bg-orange-50 font-medium"
            >
              🔍 ติดตามออร์เดอร์
            </a>
            <a
              routerLink="/admin/dashboard"
              (click)="mobileMenuOpen.set(false)"
              class="block px-4 py-2.5 rounded-lg text-sm text-brand-700 bg-orange-50 font-medium"
            >
              ⚙️ ระบบจัดการร้าน (Admin)
            </a>
          </div>
        }
      </div>
    </header>
  `,
})
export class NavbarComponent {
  mobileMenuOpen = signal<boolean>(false);

  constructor(public cartService: CartService, public authService: AuthService) {}
}
