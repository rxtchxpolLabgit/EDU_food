import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col">
      <!-- Admin Top Bar -->
      <header class="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <!-- Brand -->
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center font-bold text-white shadow-sm">
                EDU
              </div>
              <div>
                <span class="font-heading font-bold text-base text-white tracking-tight">
                  EDU Food Order
                </span>
                <span class="text-[10px] text-amber-400 font-medium ml-2 px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                  Admin Portal
                </span>
              </div>
            </div>

            <!-- Current User & Logout -->
            <div class="flex items-center gap-4">
              <span class="text-xs text-slate-300 hidden sm:inline">
                👤 {{ authService.currentUser()?.name }}
              </span>
              <a
                routerLink="/"
                target="_blank"
                class="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                ดูหน้าเว็บหลัก ↗
              </a>
              <button
                (click)="authService.logout()"
                class="text-xs text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg hover:bg-rose-950/40 border border-rose-900/50 transition cursor-pointer"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>

        <!-- Admin Sub-navigation Tabs -->
        <div class="bg-slate-800/80 border-t border-slate-700/60 overflow-x-auto">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 py-2">
            <a
              routerLink="/admin/dashboard"
              routerLinkActive="bg-brand-500 text-white font-semibold"
              [routerLinkActiveOptions]="{ exact: true }"
              class="px-3.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition flex items-center gap-1.5 whitespace-nowrap"
            >
              📊 ภาพรวม (Dashboard)
            </a>
            <a
              routerLink="/admin/orders"
              routerLinkActive="bg-brand-500 text-white font-semibold"
              class="px-3.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition flex items-center gap-1.5 whitespace-nowrap"
            >
              📋 คำสั่งซื้อ (Orders)
            </a>
            <a
              routerLink="/admin/restaurants"
              routerLinkActive="bg-brand-500 text-white font-semibold"
              class="px-3.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition flex items-center gap-1.5 whitespace-nowrap"
            >
              🏬 ร้านอาหาร (Restaurants)
            </a>
            <a
              routerLink="/admin/menu"
              routerLinkActive="bg-brand-500 text-white font-semibold"
              class="px-3.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition flex items-center gap-1.5 whitespace-nowrap"
            >
              🍲 เมนูอาหาร (Menus)
            </a>
          </div>
        </div>
      </header>

      <!-- Main Admin Content Outlet -->
      <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
})
export class AdminLayoutComponent {
  constructor(public authService: AuthService) {}
}
