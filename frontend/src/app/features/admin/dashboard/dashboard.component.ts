import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { DashboardData } from '../../../core/models/food.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="font-heading font-extrabold text-2xl text-slate-900">
            แผงควบคุมหลัก (Dashboard)
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            สรุปภาพรวมคำสั่งซื้อ ยอดขาย และสถานะการจัดเตรียมอาหารประจำวัน
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            (click)="fetchDashboard()"
            class="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            รีเฟรชข้อมูล
          </button>
          <a
            routerLink="/admin/orders"
            class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-brand-500/20"
          >
            📋 จัดการออร์เดอร์ทั้งหมด
          </a>
        </div>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-pulse">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="h-28 bg-white rounded-2xl border border-slate-200"></div>
          }
        </div>
      }

      @if (!isLoading() && data()) {
        <!-- Metric Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <!-- Card 1: Today Orders -->
          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500">คำสั่งซื้อวันนี้</span>
              <span class="p-2 rounded-xl bg-orange-50 text-brand-600 text-sm">📦</span>
            </div>
            <div class="mt-3">
              <span class="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900">
                {{ data()!.stats.todayOrders }}
              </span>
              <span class="text-xs text-slate-500 ml-1">ออร์เดอร์</span>
            </div>
          </div>

          <!-- Card 2: In-Progress Orders -->
          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500">กำลังดำเนินการ</span>
              <span class="p-2 rounded-xl bg-indigo-50 text-indigo-600 text-sm">🍳</span>
            </div>
            <div class="mt-3">
              <span class="font-heading font-extrabold text-2xl sm:text-3xl text-indigo-600">
                {{ data()!.stats.inProgressOrders }}
              </span>
              <span class="text-xs text-slate-500 ml-1">ออร์เดอร์</span>
            </div>
          </div>

          <!-- Card 3: Ready for Pickup -->
          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500">พร้อมรับอาหาร</span>
              <span class="p-2 rounded-xl bg-emerald-50 text-emerald-600 text-sm">🛍️</span>
            </div>
            <div class="mt-3">
              <span class="font-heading font-extrabold text-2xl sm:text-3xl text-emerald-600">
                {{ data()!.stats.readyOrders }}
              </span>
              <span class="text-xs text-slate-500 ml-1">ออร์เดอร์</span>
            </div>
          </div>

          <!-- Card 4: Total Revenue -->
          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500">ยอดขายรวม (ชำระแล้ว)</span>
              <span class="p-2 rounded-xl bg-amber-50 text-amber-600 text-sm">💰</span>
            </div>
            <div class="mt-3">
              <span class="font-heading font-extrabold text-2xl sm:text-3xl text-amber-600">
                ฿{{ data()!.stats.totalRevenue }}
              </span>
            </div>
          </div>

          <!-- Card 5: Restaurants Count -->
          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500">ร้านอาหารทั้งหมด</span>
              <span class="p-2 rounded-xl bg-slate-100 text-slate-700 text-sm">🏬</span>
            </div>
            <div class="mt-3">
              <span class="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900">
                {{ data()!.stats.restaurantCount }}
              </span>
              <span class="text-xs text-slate-500 ml-1">ร้านค้า</span>
            </div>
          </div>
        </div>

        <!-- Chart Section: 7-Day Orders Summary -->
        <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="font-heading font-bold text-base text-slate-900">
                สรุปจำนวนคำสั่งซื้อย้อนหลัง 7 วัน
              </h2>
              <p class="text-xs text-slate-500">เปรียบเทียบจำนวนออร์เดอร์และยอดขายในแต่ละวัน</p>
            </div>
          </div>

          <!-- Bar Chart Visualization -->
          <div class="pt-6">
            <div class="grid grid-cols-7 gap-2 sm:gap-4 items-end h-56 pt-6 border-b border-slate-200 pb-2">
              @for (day of data()!.chartData; track day.date) {
                <div class="flex flex-col items-center gap-2 h-full justify-end group">
                  <!-- Value Tooltip -->
                  <div class="text-[10px] text-slate-500 font-semibold group-hover:text-brand-600 transition">
                    {{ day.orders }} ออร์เดอร์
                    <div class="text-[9px] text-slate-400 font-normal">฿{{ day.revenue }}</div>
                  </div>

                  <!-- Bar -->
                  <div class="w-full max-w-[40px] bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end h-full">
                    <div
                      class="bg-gradient-to-t from-brand-500 to-amber-400 w-full rounded-t-xl transition-all duration-500 group-hover:brightness-110"
                      [style.height.%]="getBarHeight(day.orders)"
                    ></div>
                  </div>

                  <!-- Date Label -->
                  <span class="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                    {{ formatShortDate(day.date) }}
                  </span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Recent Orders Table -->
        <div class="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div class="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 class="font-heading font-bold text-base text-slate-900">
                คำสั่งซื้อล่าสุด (Recent Orders)
              </h2>
              <p class="text-xs text-slate-500">รายการสั่งอาหาร 10 ลำดับล่าสุดในระบบ</p>
            </div>
            <a routerLink="/admin/orders" class="text-xs text-brand-600 hover:underline font-semibold">
              ดูทั้งหมด →
            </a>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50/70 border-b border-slate-100 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th class="py-3 px-4">หมายเลขออร์เดอร์</th>
                  <th class="py-3 px-4">ร้านอาหาร</th>
                  <th class="py-3 px-4">ผู้สั่ง / เบอร์โทร</th>
                  <th class="py-3 px-4">เวลานัดรับ</th>
                  <th class="py-3 px-4">ยอดรวม</th>
                  <th class="py-3 px-4">สถานะ</th>
                  <th class="py-3 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (order of data()!.recentOrders; track order.id) {
                  <tr class="hover:bg-slate-50/60 transition">
                    <td class="py-3 px-4 font-mono font-bold text-brand-700">
                      {{ order.order_number }}
                    </td>
                    <td class="py-3 px-4 font-medium text-slate-800">
                      {{ order.restaurant_name }}
                    </td>
                    <td class="py-3 px-4">
                      <div class="font-semibold text-slate-800">{{ order.customer_name }}</div>
                      <div class="text-[11px] text-slate-400">{{ order.customer_phone }}</div>
                    </td>
                    <td class="py-3 px-4">
                      <div class="font-medium text-slate-800">{{ order.pickup_date }}</div>
                      <div class="text-[11px] text-brand-600 font-bold">{{ order.pickup_time }} น.</div>
                    </td>
                    <td class="py-3 px-4 font-heading font-bold text-slate-900">
                      ฿{{ order.total }}
                    </td>
                    <td class="py-3 px-4">
                      <app-status-badge [status]="order.status"></app-status-badge>
                    </td>
                    <td class="py-3 px-4 text-right">
                      <a
                        [routerLink]="['/admin/orders']"
                        [queryParams]="{ search: order.order_number }"
                        class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                      >
                        จัดการ →
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  data = signal<DashboardData | null>(null);
  isLoading = signal<boolean>(true);

  constructor(private apiService: ApiService, private toastService: ToastService) {}

  ngOnInit() {
    this.fetchDashboard();
  }

  fetchDashboard() {
    this.isLoading.set(true);
    this.apiService.getAdminDashboard().subscribe({
      next: (res) => {
        if (res.success) {
          this.data.set(res.data);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.error('ไม่สามารถโหลดข้อมูล Dashboard ได้');
      },
    });
  }

  getBarHeight(ordersCount: number): number {
    const list = this.data()?.chartData || [];
    const max = Math.max(...list.map((d) => d.orders), 5);
    return Math.min(100, Math.max(10, (ordersCount / max) * 100));
  }

  formatShortDate(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    return `${parts[2]}/${parts[1]}`;
  }
}
