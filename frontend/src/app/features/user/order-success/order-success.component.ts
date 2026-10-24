import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  template: `
    <div class="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-xl text-center space-y-6">
        <!-- Success Icon -->
        <div class="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
          <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
        </div>

        <div>
          <span class="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            ส่งคำสั่งซื้อเรียบร้อยแล้ว
          </span>
          <h1 class="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 mt-1">
            ขอบคุณสำหรับการสั่งอาหาร!
          </h1>
          <p class="text-xs text-slate-500 mt-1">
            ร้านค้าได้รับรายการสั่งอาหารของคุณแล้ว กรุณาไปรับอาหารตามเวลานัดหมาย
          </p>
        </div>

        <!-- Order Number Highlight Card -->
        <div class="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-4 sm:p-5">
          <div class="text-[11px] text-slate-500 uppercase tracking-wider">หมายเลขคำสั่งซื้อ (Order Number)</div>
          <div class="font-heading font-extrabold text-2xl sm:text-3xl text-brand-600 mt-1 select-all tracking-wider">
            {{ orderNumber() }}
          </div>
          <div class="mt-2 flex items-center justify-center gap-2">
            <app-status-badge [status]="orderData()?.order?.status || 'รอร้านรับออร์เดอร์'"></app-status-badge>
          </div>
        </div>

        <!-- Order Details Card -->
        @if (orderData()) {
          <div class="text-left bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3 text-xs">
            <div class="flex justify-between border-b border-slate-200 pb-2">
              <span class="text-slate-500">ร้านอาหาร:</span>
              <span class="font-bold text-slate-900">{{ orderData().restaurant?.name }}</span>
            </div>
            <div class="flex justify-between border-b border-slate-200 pb-2">
              <span class="text-slate-500">ผู้สั่งอาหาร:</span>
              <span class="font-semibold text-slate-800">{{ orderData().order?.customer_name }}</span>
            </div>
            <div class="flex justify-between border-b border-slate-200 pb-2">
              <span class="text-slate-500">เบอร์โทรศัพท์:</span>
              <span class="font-semibold text-slate-800">{{ orderData().order?.customer_phone }}</span>
            </div>
            <div class="flex justify-between border-b border-slate-200 pb-2 text-brand-700 font-medium">
              <span>เวลานัดรับอาหาร:</span>
              <span class="font-bold">{{ orderData().order?.pickup_date }} เวลา {{ orderData().order?.pickup_time }} น.</span>
            </div>

            <!-- Items -->
            <div class="pt-1">
              <div class="text-slate-500 mb-1 font-semibold">รายการอาหาร:</div>
              @for (item of orderData().items; track item.id || item.menu_item_id) {
                <div class="flex justify-between py-1">
                  <span>{{ item.menu_name_snapshot }} x{{ item.quantity }}</span>
                  <span class="font-bold">฿{{ item.subtotal }}</span>
                </div>
              }
            </div>

            <div class="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm">
              <span class="font-bold text-slate-900">ยอดรวมทั้งสิ้น:</span>
              <span class="font-heading font-extrabold text-lg text-brand-600">฿{{ orderData().order?.total }}</span>
            </div>
          </div>
        }

        <!-- Payment Reminder Box -->
        <div class="bg-amber-50 rounded-xl p-3 border border-amber-200 text-xs text-amber-800 flex items-center justify-center gap-2">
          <span>💵</span>
          <span>กรุณาชำระเงินสดหรือโอนเงินกับทางร้านค้าเมื่อมารับอาหาร</span>
        </div>

        <!-- Action Buttons -->
        <div class="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <a
            routerLink="/"
            class="w-full sm:flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
          >
            กลับหน้าหลัก
          </a>
          <button
            (click)="goToTracking()"
            class="w-full sm:flex-1 py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition cursor-pointer"
          >
            ดูรายละเอียด & ติดตามออร์เดอร์
          </button>
        </div>
      </div>
    </div>
  `,
})
export class OrderSuccessComponent implements OnInit {
  orderNumber = signal<string>('');
  orderData = signal<any>(null);

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const num = params.get('orderNumber');
      if (num) {
        this.orderNumber.set(num);
      }
    });

    const state = history.state;
    if (state && state.orderData) {
      this.orderData.set(state.orderData);
    }
  }

  goToTracking() {
    const data = this.orderData();
    const phone = data?.order?.customer_phone || '';
    this.router.navigate(['/track'], {
      queryParams: {
        order_number: this.orderNumber(),
        phone: phone,
      },
    });
  }
}
