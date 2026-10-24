import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { RestaurantAuthService } from '../../core/services/restaurant-auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Order } from '../../core/models/food.models';

@Component({
  selector: 'app-shop-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-100">
      <header class="sticky top-0 z-10 bg-slate-900 text-white shadow-lg">
        <div class="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div><div class="text-[10px] text-indigo-300 font-semibold">หน้ารับออร์เดอร์ร้านค้า</div><h1 class="font-bold text-lg">{{ auth.currentUser()?.restaurant_name }}</h1></div>
          <button (click)="auth.logout()" class="rounded-lg border border-slate-600 px-3 py-2 text-xs hover:bg-slate-800">ออกจากระบบ</button>
        </div>
      </header>
      <main class="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div><h2 class="text-xl font-extrabold text-slate-900">ออร์เดอร์ของร้าน</h2><p class="text-xs text-slate-500 mt-1">แสดงเฉพาะรายการของร้านนี้ · รีเฟรชอัตโนมัติทุก 15 วินาที</p></div>
          <div class="flex items-center gap-2">
            <select [value]="statusFilter" (change)="setFilter($event)" class="rounded-xl border bg-white px-3 py-2 text-xs">
              <option value="all">ทุกสถานะ</option><option value="รอร้านรับออร์เดอร์">รอรับออร์เดอร์</option><option value="ร้านรับออร์เดอร์แล้ว">รับแล้ว</option><option value="กำลังเตรียมอาหาร">กำลังทำ</option><option value="พร้อมรับอาหาร">พร้อมรับ</option><option value="รับอาหารแล้ว">เสร็จแล้ว</option><option value="ยกเลิก">ยกเลิก</option>
            </select>
            <button (click)="fetchOrders()" class="rounded-xl bg-white border px-3 py-2 text-xs font-semibold">↻ รีเฟรช</button>
          </div>
        </div>
        @if (orders().length === 0) {
          <div class="rounded-3xl bg-white border border-slate-200 p-12 text-center"><div class="text-4xl">🧾</div><p class="mt-3 font-bold text-slate-700">ยังไม่มีออร์เดอร์</p><p class="text-xs text-slate-500 mt-1">เมื่อมีลูกค้าสั่งอาหาร รายการจะแสดงที่นี่</p></div>
        }
        <div class="space-y-4">
          @for (order of orders(); track order.id) {
            <article class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div class="px-4 sm:px-5 py-4 border-b flex flex-wrap justify-between gap-3 items-center">
                <div><div class="font-extrabold text-slate-900">#{{ order.order_number }}</div><div class="text-[11px] text-slate-500 mt-1">{{ order.customer_name }} · {{ order.customer_phone }}</div></div>
                <div class="text-right"><span class="inline-block rounded-full px-3 py-1 text-[11px] font-bold" [ngClass]="statusClass(order.status)">{{ order.status }}</span><div class="text-xs text-slate-600 mt-1">รับอาหาร {{ order.pickup_date }} เวลา {{ order.pickup_time }}</div></div>
              </div>
              <div class="p-4 sm:p-5">
                <div class="space-y-2">
                  @for (item of order.items || []; track item.id) {
                    <div class="flex justify-between gap-3 text-xs"><span class="text-slate-700">{{ item.quantity }} × {{ item.menu_name_snapshot }}<span class="block text-[10px] text-slate-400">{{ optionText(item.selected_options) }} {{ item.item_note ? '· ' + item.item_note : '' }}</span></span><span class="font-semibold text-slate-800">{{ item.subtotal | number:'1.2-2' }} ฿</span></div>
                  }
                </div>
                @if (order.note) { <div class="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">หมายเหตุ: {{ order.note }}</div> }
                <div class="mt-4 flex items-center justify-between border-t pt-3"><span class="text-xs text-slate-500">ยอดรวม</span><strong class="text-lg text-slate-900">{{ order.total | number:'1.2-2' }} ฿</strong></div>
                @if (nextStatus(order.status); as next) { <button (click)="advance(order, next)" class="mt-4 w-full sm:w-auto rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-3 text-xs font-bold text-white">{{ nextLabel(order.status) }}</button> }
              </div>
            </article>
          }
        </div>
      </main>
    </div>
  `,
})
export class ShopOrdersComponent implements OnInit, OnDestroy {
  orders = signal<Order[]>([]);
  statusFilter = 'all';
  private refreshTimer?: ReturnType<typeof setInterval>;
  constructor(public auth: RestaurantAuthService, private api: ApiService, private toast: ToastService) {}
  ngOnInit(): void {
    this.fetchOrders();
    this.refreshTimer = setInterval(() => this.fetchOrders(), 15000);
  }
  ngOnDestroy(): void { if (this.refreshTimer) clearInterval(this.refreshTimer); }
  fetchOrders(): void {
    this.api.getShopOrders({ status: this.statusFilter }).subscribe({
      next: (res) => this.orders.set(res.data || []),
      error: (err) => this.toast.error(err.error?.message || 'โหลดออร์เดอร์ไม่สำเร็จ'),
    });
  }
  setFilter(event: Event): void { this.statusFilter = (event.target as HTMLSelectElement).value; this.fetchOrders(); }
  nextStatus(status: string): string | null {
    const flow: Record<string, string> = { 'รอร้านรับออร์เดอร์': 'ร้านรับออร์เดอร์แล้ว', 'ร้านรับออร์เดอร์แล้ว': 'กำลังเตรียมอาหาร', 'กำลังเตรียมอาหาร': 'พร้อมรับอาหาร', 'พร้อมรับอาหาร': 'รับอาหารแล้ว' };
    return flow[status] || null;
  }
  nextLabel(status: string): string { return status === 'รอร้านรับออร์เดอร์' ? 'รับออร์เดอร์' : status === 'ร้านรับออร์เดอร์แล้ว' ? 'เริ่มเตรียมอาหาร' : status === 'กำลังเตรียมอาหาร' ? 'พร้อมให้ลูกค้ารับ' : 'ยืนยันว่าลูกค้ารับแล้ว'; }
  advance(order: Order, status: string): void {
    this.api.updateShopOrderStatus(order.id, status).subscribe({ next: () => { this.toast.success(`อัปเดตเป็น “${status}” แล้ว`); this.fetchOrders(); }, error: (err) => this.toast.error(err.error?.message || 'เปลี่ยนสถานะไม่สำเร็จ') });
  }
  optionText(options: any): string { return Array.isArray(options) ? options.map((o) => `${o.option_name}: ${o.option_value}`).join(', ') : ''; }
  statusClass(status: string): string { return status === 'รอร้านรับออร์เดอร์' ? 'bg-amber-100 text-amber-800' : status === 'พร้อมรับอาหาร' ? 'bg-emerald-100 text-emerald-800' : status === 'ยกเลิก' ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'; }
}
