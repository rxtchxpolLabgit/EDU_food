import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Order, Restaurant } from '../../../core/models/food.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-orders-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="font-heading font-extrabold text-2xl text-slate-900">
            จัดการคำสั่งซื้อ (Orders Management)
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            ติดตามสถานะออร์เดอร์ รับคำสั่งซื้อ อัปเดตขั้นตอนการทำอาหาร และพิมพ์ใบเตรียมอาหาร
          </p>
        </div>

        <button
          (click)="fetchOrders()"
          class="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          รีเฟรชออร์เดอร์
        </button>
      </div>

      <!-- Filters Bar -->
      <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <!-- Search Input -->
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 mb-1">ค้นหา (เลขออร์เดอร์ / ชื่อ / เบอร์)</label>
            <input
              type="text"
              [(ngModel)]="searchKeyword"
              (ngModelChange)="onFilterChange()"
              placeholder="พิมพ์คำค้นหา..."
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500"
            />
          </div>

          <!-- Restaurant Filter -->
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 mb-1">ร้านอาหาร</label>
            <select
              [(ngModel)]="selectedRestaurant"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-brand-500"
            >
              <option value="">ทุกร้านอาหาร</option>
              @for (r of restaurants(); track r.id) {
                <option [value]="r.id">{{ r.name }}</option>
              }
            </select>
          </div>

          <!-- Status Filter -->
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 mb-1">สถานะคำสั่งซื้อ</label>
            <select
              [(ngModel)]="selectedStatus"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-brand-500"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="รอร้านรับออร์เดอร์">รอร้านรับออร์เดอร์</option>
              <option value="ร้านรับออร์เดอร์แล้ว">ร้านรับออร์เดอร์แล้ว</option>
              <option value="กำลังเตรียมอาหาร">กำลังเตรียมอาหาร</option>
              <option value="พร้อมรับอาหาร">พร้อมรับอาหาร</option>
              <option value="รับอาหารแล้ว">รับอาหารแล้ว (สำเร็จ)</option>
              <option value="ยกเลิก">ยกเลิก</option>
            </select>
          </div>

          <!-- Date Filter -->
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 mb-1">วันที่รับอาหาร</label>
            <input
              type="date"
              [(ngModel)]="selectedDate"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>พบคำสั่งซื้อทั้งหมด {{ orders().length }} รายการ</span>
          @if (searchKeyword || selectedRestaurant || selectedStatus !== 'all' || selectedDate) {
            <button (click)="resetFilters()" class="text-brand-600 hover:underline font-semibold cursor-pointer">
              ล้างตัวกรองทั้งหมด
            </button>
          }
        </div>
      </div>

      <!-- Orders Table -->
      <div class="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th class="py-3 px-4">เลขออร์เดอร์</th>
                <th class="py-3 px-4">ร้านอาหาร</th>
                <th class="py-3 px-4">ผู้สั่ง / เบอร์ติดต่อ</th>
                <th class="py-3 px-4">เวลานัดรับ</th>
                <th class="py-3 px-4">รายการอาหาร</th>
                <th class="py-3 px-4">ยอดรวม</th>
                <th class="py-3 px-4">สถานะ</th>
                <th class="py-3 px-4 text-right">การจัดการสถานะ & ตั๋ว</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (order of orders(); track order.id) {
                <tr class="hover:bg-slate-50/60 transition">
                  <!-- Order Number -->
                  <td class="py-3 px-4 font-mono font-bold text-brand-700 whitespace-nowrap">
                    {{ order.order_number }}
                  </td>

                  <!-- Restaurant -->
                  <td class="py-3 px-4 font-semibold text-slate-800">
                    {{ order.restaurant_name }}
                  </td>

                  <!-- Customer -->
                  <td class="py-3 px-4">
                    <div class="font-semibold text-slate-900">{{ order.customer_name }}</div>
                    <div class="text-[11px] text-slate-500">{{ order.customer_phone }}</div>
                  </td>

                  <!-- Pickup Time -->
                  <td class="py-3 px-4 whitespace-nowrap">
                    <div class="font-medium text-slate-800">{{ order.pickup_date }}</div>
                    <div class="text-[11px] text-brand-600 font-bold">{{ order.pickup_time }} น.</div>
                  </td>

                  <!-- Items Summary -->
                  <td class="py-3 px-4 max-w-xs">
                    @if (order.items && order.items.length > 0) {
                      <div class="line-clamp-2 text-slate-700">
                        @for (it of order.items; track it.id; let last = $last) {
                          <span>{{ it.menu_name_snapshot }} x{{ it.quantity }}</span>@if (!last) {<span>, </span>}
                        }
                      </div>
                    }
                    @if (order.note) {
                      <div class="text-[10px] text-amber-700 italic mt-0.5">💬 {{ order.note }}</div>
                    }
                  </td>

                  <!-- Total -->
                  <td class="py-3 px-4 font-heading font-extrabold text-slate-900 text-sm whitespace-nowrap">
                    ฿{{ order.total }}
                  </td>

                  <!-- Status -->
                  <td class="py-3 px-4 whitespace-nowrap">
                    <app-status-badge [status]="order.status"></app-status-badge>
                  </td>

                  <!-- Actions -->
                  <td class="py-3 px-4 text-right whitespace-nowrap space-x-1">
                    <!-- Quick advance button -->
                    @if (getNextStatus(order.status)) {
                      <button
                        (click)="advanceStatus(order)"
                        class="px-2.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-2xs transition cursor-pointer"
                        [title]="'เปลี่ยนเป็น: ' + getNextStatus(order.status)"
                      >
                        {{ getNextStatusLabel(order.status) }}
                      </button>
                    }

                    <!-- Detail / Print Slip button -->
                    <button
                      (click)="viewOrderDetails(order)"
                      class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                      title="ดูรายละเอียดและพิมพ์ใบเตรียมอาหาร"
                    >
                      🖨️ ตั๋วครัว
                    </button>

                    <!-- Cancel button -->
                    @if (order.status !== 'ยกเลิก' && order.status !== 'รับอาหารแล้ว') {
                      <button
                        (click)="openCancelModal(order)"
                        class="px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-xs transition cursor-pointer"
                        title="ยกเลิกออร์เดอร์"
                      >
                        ✕
                      </button>
                    }
                  </td>
                </tr>
              }

              @if (orders().length === 0) {
                <tr>
                  <td colspan="8" class="text-center py-10 text-slate-400">
                    ไม่พบข้อมูลคำสั่งซื้อที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Detail & Printable Ticket Modal -->
      @if (activeOrderModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print animate-fadeIn">
          <div class="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="font-heading font-bold text-base text-slate-900">
                รายละเอียดคำสั่งซื้อ / ใบเตรียมอาหาร
              </h3>
              <button (click)="activeOrderModal.set(null)" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <!-- Receipt Content (Thermal Ticket Format) -->
            <div id="printable-receipt" class="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-mono space-y-2">
              <div class="text-center border-b border-dashed border-slate-300 pb-2">
                <div class="font-bold text-sm">EDU FOOD ORDER</div>
                <div class="text-[11px] font-semibold text-slate-700">{{ activeOrderModal()!.restaurant_name }}</div>
                <div class="text-[10px] text-slate-500 mt-1">ตึกครุศาสตร์ มหาวิทยาลัย</div>
              </div>

              <div class="py-1 border-b border-dashed border-slate-300 space-y-0.5 text-[11px]">
                <div>เลขออร์เดอร์: <span class="font-bold">{{ activeOrderModal()!.order_number }}</span></div>
                <div>เวลานัดรับ: <span class="font-bold">{{ activeOrderModal()!.pickup_date }} {{ activeOrderModal()!.pickup_time }} น.</span></div>
                <div>ลูกค้า: {{ activeOrderModal()!.customer_name }} ({{ activeOrderModal()!.customer_phone }})</div>
                <div>สถานะ: {{ activeOrderModal()!.status }}</div>
                @if (activeOrderModal()!.note) {
                  <div class="font-bold text-rose-600">โน้ต: {{ activeOrderModal()!.note }}</div>
                }
              </div>

              <div class="py-2 border-b border-dashed border-slate-300 space-y-2 text-[11px]">
                <div class="font-bold">รายการอาหารที่ต้องเตรียม:</div>
                @for (item of activeOrderModal()!.items; track item.id) {
                  <div>
                    <div class="flex justify-between font-bold">
                      <span>{{ item.menu_name_snapshot }} x{{ item.quantity }}</span>
                      <span>฿{{ item.subtotal }}</span>
                    </div>
                    @if (item.selected_options && item.selected_options.length > 0) {
                      <div class="text-[10px] text-slate-600 pl-2">
                        @for (o of item.selected_options; track o.option_value) {
                          <div>• {{ o.option_name }}: {{ o.option_value }} (+฿{{ o.additional_price }})</div>
                        }
                      </div>
                    }
                    @if (item.item_note) {
                      <div class="text-[10px] text-amber-800 pl-2 italic">
                        >> หมายเหตุ: {{ item.item_note }}
                      </div>
                    }
                  </div>
                }
              </div>

              <div class="pt-2 flex justify-between font-bold text-sm">
                <span>ยอดรวมทั้งสิ้น:</span>
                <span>฿{{ activeOrderModal()!.total }}</span>
              </div>
              <div class="text-center text-[10px] text-slate-500 pt-1">
                (ชำระเงินเมื่อรับอาหาร)
              </div>
            </div>

            <!-- Modal Action Buttons -->
            <div class="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                (click)="printReceipt()"
                class="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                🖨️ สั่งพิมพ์ใบเตรียมอาหาร (Thermal Slip)
              </button>
              <button
                type="button"
                (click)="activeOrderModal.set(null)"
                class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Cancel Order Modal -->
      @if (showCancelModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div class="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 class="font-heading font-bold text-base text-rose-600 flex items-center gap-2">
              <span>⚠️</span>
              <span>ยืนยันยกเลิกคำสั่งซื้อ</span>
            </h3>
            <p class="text-xs text-slate-600">
              เลขออร์เดอร์: <span class="font-bold">{{ cancelTargetOrder?.order_number }}</span>
            </p>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">เหตุผลในการยกเลิก *</label>
              <textarea
                [(ngModel)]="cancelReason"
                rows="2"
                placeholder="เช่น วัตถุดิบหมด, ร้านต้องปิดฉุกเฉิน..."
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-rose-500"
              ></textarea>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2">
              <button
                (click)="showCancelModal.set(false)"
                class="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                ย้อนกลับ
              </button>
              <button
                (click)="confirmCancelOrder()"
                class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm"
              >
                ยืนยันยกเลิกออร์เดอร์
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class OrdersManageComponent implements OnInit {
  orders = signal<Order[]>([]);
  restaurants = signal<Restaurant[]>([]);

  searchKeyword: string = '';
  selectedRestaurant: string = '';
  selectedStatus: string = 'all';
  selectedDate: string = '';

  activeOrderModal = signal<Order | null>(null);
  showCancelModal = signal<boolean>(false);
  cancelTargetOrder: Order | null = null;
  cancelReason: string = '';

  constructor(
    private apiService: ApiService,
    private toastService: ToastService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.apiService.getAdminRestaurants().subscribe({
      next: (res) => {
        if (res.success) {
          this.restaurants.set(res.data);
        }
      },
    });

    this.route.queryParams.subscribe((params) => {
      if (params['search']) {
        this.searchKeyword = params['search'];
      }
      this.fetchOrders();
    });
  }

  fetchOrders() {
    this.apiService
      .getAdminOrders({
        search: this.searchKeyword,
        restaurant_id: this.selectedRestaurant,
        status: this.selectedStatus,
        date: this.selectedDate,
      })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.orders.set(res.data);
          }
        },
      });
  }

  onFilterChange() {
    this.fetchOrders();
  }

  resetFilters() {
    this.searchKeyword = '';
    this.selectedRestaurant = '';
    this.selectedStatus = 'all';
    this.selectedDate = '';
    this.fetchOrders();
  }

  getNextStatus(curStatus: string): string | null {
    switch (curStatus) {
      case 'รอร้านรับออร์เดอร์':
        return 'ร้านรับออร์เดอร์แล้ว';
      case 'ร้านรับออร์เดอร์แล้ว':
        return 'กำลังเตรียมอาหาร';
      case 'กำลังเตรียมอาหาร':
        return 'พร้อมรับอาหาร';
      case 'พร้อมรับอาหาร':
        return 'รับอาหารแล้ว';
      default:
        return null;
    }
  }

  getNextStatusLabel(curStatus: string): string {
    switch (curStatus) {
      case 'รอร้านรับออร์เดอร์':
        return '✔ รับออร์เดอร์';
      case 'ร้านรับออร์เดอร์แล้ว':
        return '🍳 เริ่มปรุงอาหาร';
      case 'กำลังเตรียมอาหาร':
        return '🛍️ พร้อมรับอาหาร';
      case 'พร้อมรับอาหาร':
        return '✓ ลูกค้ารับแล้ว';
      default:
        return 'อัปเดต';
    }
  }

  advanceStatus(order: Order) {
    const nextStatus = this.getNextStatus(order.status);
    if (!nextStatus) return;

    this.apiService.updateOrderStatus(order.id, nextStatus).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.success(`อัปเดตสถานะเป็น "${nextStatus}" สำเร็จ`);
          this.fetchOrders();
        }
      },
    });
  }

  viewOrderDetails(order: Order) {
    this.activeOrderModal.set(order);
  }

  printReceipt() {
    window.print();
  }

  openCancelModal(order: Order) {
    this.cancelTargetOrder = order;
    this.cancelReason = '';
    this.showCancelModal.set(true);
  }

  confirmCancelOrder() {
    if (!this.cancelTargetOrder) return;

    this.apiService
      .updateOrderStatus(this.cancelTargetOrder.id, 'ยกเลิก', this.cancelReason || 'ทางร้านขอยกเลิกคำสั่งซื้อ')
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.info('ยกเลิกคำสั่งซื้อเรียบร้อยแล้ว');
            this.showCancelModal.set(false);
            this.fetchOrders();
          }
        },
      });
  }
}
