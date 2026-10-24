import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-order-track',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StatusBadgeComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div class="text-center max-w-xl mx-auto mb-8">
        <h1 class="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900">
          ติดตามสถานะคำสั่งซื้อ
        </h1>
        <p class="text-xs text-slate-500 mt-1">
          กรอกหมายเลขคำสั่งซื้อและเบอร์โทรศัพท์ที่ใช้สั่ง เพื่อตรวจสอบขั้นตอนการจัดเตรียมอาหาร
        </p>
      </div>

      <!-- Tracking Lookup Form Card -->
      <div class="bg-white rounded-3xl p-6 border border-orange-100 shadow-sm mb-8">
        <form (ngSubmit)="searchOrder()" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                หมายเลขคำสั่งซื้อ (Order Number) <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                [(ngModel)]="orderNumber"
                name="orderNumber"
                placeholder="เช่น EDU-20261024-XXXX"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 font-mono"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                เบอร์โทรศัพท์ที่ใช้สั่งอาหาร <span class="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                [(ngModel)]="phoneNumber"
                name="phoneNumber"
                placeholder="เช่น 0812345678"
                class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500"
              />
            </div>
          </div>

          <div class="flex items-center justify-end">
            <button
              type="submit"
              [disabled]="isLoading()"
              class="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-brand-500/20 transition cursor-pointer"
            >
              @if (isLoading()) {
                <svg class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>กำลังค้นหา...</span>
              } @else {
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <span>ตรวจสอบสถานะ</span>
              }
            </button>
          </div>
        </form>
      </div>

      <!-- Search Result Section -->
      @if (orderResult()) {
        <div class="space-y-6">
          <!-- Main Status Card -->
          <div class="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-md">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <span class="text-[11px] text-slate-400 uppercase tracking-wider">คำสั่งซื้อ</span>
                <h2 class="font-heading font-extrabold text-xl text-slate-900 select-all">
                  {{ orderResult().order.order_number }}
                </h2>
                <p class="text-xs text-brand-600 font-medium mt-0.5">
                  ร้าน: {{ orderResult().restaurant?.name }}
                </p>
              </div>

              <div class="flex items-center gap-3">
                <app-status-badge [status]="orderResult().order.status"></app-status-badge>
                <button
                  (click)="searchOrder()"
                  title="รีเฟรชสถานะ"
                  class="p-2 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-orange-50 border border-slate-200 transition cursor-pointer"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Visual Stepper Progress Bar (for normal flow) -->
            @if (orderResult().order.status !== 'ยกเลิก') {
              <div class="py-6">
                <div class="grid grid-cols-5 gap-2 relative">
                  @for (step of statusSteps; track step.key; let idx = $index) {
                    <div class="flex flex-col items-center text-center">
                      <!-- Step Circle -->
                      <div
                        class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition mb-1.5"
                        [ngClass]="{
                          'bg-fresh-500 text-white shadow-md shadow-fresh-500/30': isStepCompleted(step.key),
                          'bg-brand-500 text-white ring-4 ring-brand-100 animate-pulse': isStepCurrent(step.key),
                          'bg-slate-100 text-slate-400 border border-slate-200': !isStepCompleted(step.key) && !isStepCurrent(step.key)
                        }"
                      >
                        @if (isStepCompleted(step.key)) {
                          ✓
                        } @else {
                          {{ idx + 1 }}
                        }
                      </div>

                      <span
                        class="text-[10px] leading-tight font-medium"
                        [ngClass]="{
                          'text-brand-600 font-bold': isStepCurrent(step.key),
                          'text-slate-800': isStepCompleted(step.key),
                          'text-slate-400': !isStepCompleted(step.key) && !isStepCurrent(step.key)
                        }"
                      >
                        {{ step.label }}
                      </span>
                    </div>
                  }
                </div>
              </div>
            } @else {
              <!-- Cancelled State Banner -->
              <div class="my-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <div class="font-bold flex items-center gap-1.5 mb-1">
                  <span>❌</span>
                  <span>คำสั่งซื้อนี้ถูกยกเลิกแล้ว</span>
                </div>
                @if (orderResult().order.cancel_reason) {
                  <p class="text-rose-700">สาเหตุ: {{ orderResult().order.cancel_reason }}</p>
                }
              </div>
            }

            <!-- Pickup Datetime Box -->
            <div class="bg-orange-50/60 rounded-2xl p-4 border border-orange-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shrink-0">
                  ⏰
                </div>
                <div>
                  <div class="text-[11px] text-slate-500">กำหนดเวลารับอาหาร</div>
                  <div class="font-heading font-bold text-slate-900 text-sm">
                    {{ orderResult().order.pickup_date }} เวลา {{ orderResult().order.pickup_time }} น.
                  </div>
                </div>
              </div>
              <div class="text-left sm:text-right">
                <div class="text-[11px] text-slate-500">ผู้สั่ง</div>
                <div class="font-semibold text-slate-800">
                  {{ orderResult().order.customer_name }} ({{ orderResult().order.customer_phone }})
                </div>
              </div>
            </div>

            <!-- Items Breakdown Table -->
            <div class="mt-6">
              <h3 class="font-heading font-bold text-sm text-slate-900 mb-3">
                รายการอาหารที่สั่ง
              </h3>
              <div class="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden text-xs">
                @for (item of orderResult().items; track item.id) {
                  <div class="p-3.5 flex items-start justify-between gap-4 hover:bg-slate-50/50 transition">
                    <div>
                      <div class="font-semibold text-slate-800">
                        {{ item.menu_name_snapshot }}
                        <span class="text-brand-600 font-bold ml-1">x{{ item.quantity }}</span>
                      </div>
                      @if (item.selected_options && item.selected_options.length > 0) {
                        <div class="mt-1 flex flex-wrap gap-1">
                          @for (opt of item.selected_options; track opt.option_value) {
                            <span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              {{ opt.option_name }}: {{ opt.option_value }}
                              @if (opt.additional_price > 0) {
                                (+฿{{ opt.additional_price }})
                              }
                            </span>
                          }
                        </div>
                      }
                      @if (item.item_note) {
                        <div class="text-[11px] text-slate-400 mt-1 italic">
                          โน้ต: "{{ item.item_note }}"
                        </div>
                      }
                    </div>

                    <div class="text-right shrink-0">
                      <span class="font-heading font-bold text-slate-900 text-sm">฿{{ item.subtotal }}</span>
                      <div class="text-[10px] text-slate-400">฿{{ item.unit_price_snapshot }} / จาน</div>
                    </div>
                  </div>
                }
              </div>

              <!-- Total Row -->
              <div class="mt-4 flex items-baseline justify-between px-2">
                <span class="font-heading font-bold text-slate-800 text-sm">ยอดชำระเมื่อรับอาหาร</span>
                <span class="font-heading font-extrabold text-2xl text-brand-600">
                  ฿{{ orderResult().order.total }}
                </span>
              </div>
            </div>

            <!-- Status History Timeline -->
            @if (orderResult().history && orderResult().history.length > 0) {
              <div class="mt-8 pt-6 border-t border-slate-100">
                <h3 class="font-heading font-bold text-sm text-slate-900 mb-3">
                  ประวัติการปรับสถานะออร์เดอร์
                </h3>
                <div class="space-y-3 pl-2 text-xs">
                  @for (h of orderResult().history; track h.id) {
                    <div class="flex items-start gap-3 border-l-2 border-orange-200 pl-4 py-1">
                      <div class="flex-1">
                        <span class="font-semibold text-slate-800">{{ h.new_status }}</span>
                        @if (h.note) {
                          <span class="text-slate-500 ml-2 italic">({{ h.note }})</span>
                        }
                      </div>
                      <span class="text-[11px] text-slate-400 shrink-0">
                        {{ formatTime(h.changed_at) }}
                      </span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class OrderTrackComponent implements OnInit {
  orderNumber: string = '';
  phoneNumber: string = '';
  isLoading = signal<boolean>(false);
  orderResult = signal<any>(null);

  statusSteps = [
    { key: 'รอร้านรับออร์เดอร์', label: '1. รอรับ' },
    { key: 'ร้านรับออร์เดอร์แล้ว', label: '2. รับแล้ว' },
    { key: 'กำลังเตรียมอาหาร', label: '3. กำลังปรุง' },
    { key: 'พร้อมรับอาหาร', label: '4. พร้อมรับ' },
    { key: 'รับอาหารแล้ว', label: '5. รับแล้ว' },
  ];

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['order_number']) {
        this.orderNumber = params['order_number'];
      }
      if (params['phone']) {
        this.phoneNumber = params['phone'];
      }
      if (this.orderNumber && this.phoneNumber) {
        this.searchOrder();
      }
    });
  }

  searchOrder() {
    if (!this.orderNumber.trim() || !this.phoneNumber.trim()) {
      this.toastService.error('กรุณากรอกทั้งหมายเลขคำสั่งซื้อและเบอร์โทรศัพท์');
      return;
    }

    this.isLoading.set(true);
    this.apiService.trackOrder(this.orderNumber, this.phoneNumber).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.orderResult.set(res.data);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.orderResult.set(null);
        const msg = err.error?.message || 'ไม่พบคำสั่งซื้อที่ตรงกับข้อมูล';
        this.toastService.error(msg);
      },
    });
  }

  isStepCompleted(stepKey: string): boolean {
    const cur = this.orderResult()?.order?.status;
    const orderIndex = this.statusSteps.findIndex((s) => s.key === cur);
    const stepIndex = this.statusSteps.findIndex((s) => s.key === stepKey);
    return orderIndex > stepIndex;
  }

  isStepCurrent(stepKey: string): boolean {
    return this.orderResult()?.order?.status === stepKey;
  }

  formatTime(isoString: string): string {
    if (!isoString) return '';
    const d = new Date(isoString);
    return `${d.toLocaleDateString('th-TH')} ${d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`;
  }
}
