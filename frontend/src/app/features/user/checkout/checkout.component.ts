import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { PickupSlot } from '../../../core/models/food.models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div class="mb-8">
        <a
          routerLink="/cart"
          class="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 mb-2 transition"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          กลับไปแก้ไขตะกร้า
        </a>
        <h1 class="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900">
          ระบุข้อมูลและเลือกรอบเวลารับอาหาร
        </h1>
        <p class="text-xs text-slate-500 mt-1">
          ระบบคำนวณรอบเวลารับตามเวลาเปิด-ปิด และกำลังการผลิตของร้านค้าเพื่อให้อาหารปรุงสดใหม่พอดีเวลา
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Input Form Section (2 cols) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Step 1: Customer Contact Info -->
          <div class="bg-white rounded-3xl p-6 border border-orange-100 shadow-xs space-y-4">
            <h2 class="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold">1</span>
              ข้อมูลผู้สั่งอาหาร
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Name Input -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อ-นามสกุล หรือชื่อเล่น <span class="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  [(ngModel)]="customerName"
                  placeholder="เช่น สมชาย ใจดี (นศ.ปี 3)"
                  class="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white transition"
                  [ngClass]="{
                    'border-rose-400 focus:border-rose-500 bg-rose-50/20': submitted && !customerName.trim(),
                    'border-slate-200 focus:border-brand-500': !submitted || customerName.trim()
                  }"
                />
                @if (submitted && !customerName.trim()) {
                  <p class="text-[11px] text-rose-500 mt-1">กรุณากรอกชื่อผู้สั่งอาหาร</p>
                }
              </div>

              <!-- Phone Input -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  เบอร์โทรศัพท์มือถือ (10 หลัก) <span class="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  [(ngModel)]="customerPhone"
                  placeholder="เช่น 0812345678"
                  maxlength="12"
                  class="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white transition"
                  [ngClass]="{
                    'border-rose-400 focus:border-rose-500 bg-rose-50/20': submitted && !isPhoneValid(),
                    'border-slate-200 focus:border-brand-500': !submitted || isPhoneValid()
                  }"
                />
                @if (submitted && !isPhoneValid()) {
                  <p class="text-[11px] text-rose-500 mt-1">เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก (เช่น 0812345678)</p>
                } @else {
                  <p class="text-[10px] text-slate-400 mt-1">ใช้สำหรับตรวจสอบและรับอาหารที่หน้าร้าน</p>
                }
              </div>
            </div>
          </div>

          <!-- Step 2: Date & Pickup Slot Picker -->
          <div class="bg-white rounded-3xl p-6 border border-orange-100 shadow-xs space-y-5">
            <div class="flex items-center justify-between">
              <h2 class="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold">2</span>
                เลือกรอบเวลารับอาหาร
              </h2>
              @if (selectedSlot) {
                <span class="text-xs font-bold text-fresh-700 bg-fresh-50 px-2.5 py-1 rounded-full border border-fresh-200">
                  เลือกแล้ว: {{ selectedSlot.time }} น.
                </span>
              }
            </div>

            <!-- Date Selector Tabs -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-2">เลือกวันที่รับ</label>
              <div class="grid grid-cols-3 gap-2">
                @for (d of availableDates; track d.date) {
                  <button
                    (click)="selectDate(d.date)"
                    class="py-2.5 px-3 rounded-2xl border text-xs font-semibold flex flex-col items-center justify-center transition cursor-pointer"
                    [ngClass]="{
                      'border-brand-500 bg-orange-50/80 text-brand-800 ring-2 ring-brand-500/20': selectedDate === d.date,
                      'border-slate-200 bg-white hover:bg-slate-50 text-slate-700': selectedDate !== d.date
                    }"
                  >
                    <span class="text-[10px] text-slate-500 font-normal">{{ d.dayLabel }}</span>
                    <span class="text-xs font-bold mt-0.5">{{ d.displayDate }}</span>
                  </button>
                }
              </div>
            </div>

            <!-- Slots Grid -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-xs font-semibold text-slate-700">
                  รอบเวลารับ (รอบละ 15 นาที) <span class="text-rose-500">*</span>
                </label>
                <div class="flex items-center gap-3 text-[10px] text-slate-500">
                  <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> ว่าง</span>
                  <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-400"></span> ใกล้เต็ม</span>
                  <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-slate-300"></span> เต็ม/หมดรอบ</span>
                </div>
              </div>

              <!-- Loading Slots -->
              @if (isLoadingSlots()) {
                <div class="grid grid-cols-3 sm:grid-cols-4 gap-2.5 animate-pulse py-4">
                  @for (i of [1,2,3,4,5,6,7,8]; track i) {
                    <div class="h-14 bg-slate-100 rounded-xl"></div>
                  }
                </div>
              }

              <!-- Slots List -->
              @if (!isLoadingSlots() && pickupSlots().length > 0) {
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto p-1">
                  @for (slot of pickupSlots(); track slot.time) {
                    <button
                      (click)="selectSlot(slot)"
                      [disabled]="!slot.isAvailable"
                      class="p-2.5 rounded-xl border text-left transition flex flex-col justify-between"
                      [ngClass]="{
                        'border-brand-500 bg-orange-500 text-white shadow-md shadow-brand-500/25 cursor-pointer': selectedSlot?.time === slot.time,
                        'border-slate-200 bg-white hover:border-brand-400 hover:bg-orange-50/30 text-slate-800 cursor-pointer': selectedSlot?.time !== slot.time && slot.isAvailable,
                        'border-slate-200 bg-slate-100/70 text-slate-400 cursor-not-allowed opacity-60': !slot.isAvailable
                      }"
                    >
                      <div class="flex items-center justify-between">
                        <span class="font-heading font-bold text-sm tracking-tight">
                          {{ slot.time }} น.
                        </span>
                        @if (selectedSlot?.time === slot.time) {
                          <span class="text-xs">✓</span>
                        }
                      </div>

                      <div class="mt-1 text-[10px]">
                        @if (slot.isAvailable) {
                          <span [ngClass]="selectedSlot?.time === slot.time ? 'text-white' : 'text-emerald-600'">
                            ว่าง ({{ slot.remainingOrders }}/{{ slot.maxOrders }})
                          </span>
                        } @else {
                          <span class="text-slate-400 line-clamp-1" [title]="slot.reason || 'ไม่ว่าง'">
                            {{ slot.reason || 'เต็มแล้ว' }}
                          </span>
                        }
                      </div>
                    </button>
                  }
                </div>
              }

              @if (submitted && !selectedSlot) {
                <p class="text-[11px] text-rose-500 mt-2">กรุณาเลือกรอบเวลารับอาหารที่ต้องการ</p>
              }
            </div>
          </div>
        </div>

        <!-- Order Summary & Confirmation Column (1 col) -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-3xl p-6 border border-orange-100 shadow-md sticky top-24 space-y-4">
            <h2 class="font-heading font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
              สรุปคำสั่งซื้อ
            </h2>

            <!-- Restaurant Banner -->
            <div class="bg-orange-50/70 p-3 rounded-2xl border border-orange-100 flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                ร้าน
              </div>
              <div class="overflow-hidden">
                <div class="text-[10px] text-slate-500">ร้านอาหาร</div>
                <div class="font-heading font-bold text-xs text-slate-900 truncate">
                  {{ cartService.restaurantName() }}
                </div>
              </div>
            </div>

            <!-- Items Brief List -->
            <div class="space-y-2 max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs pr-1">
              @for (item of cartService.items(); track item.id) {
                <div class="pt-2 first:pt-0 flex items-start justify-between gap-2">
                  <div class="flex-1">
                    <span class="font-semibold text-slate-800">{{ item.name }}</span>
                    <span class="text-slate-500 text-[11px] ml-1">x{{ item.quantity }}</span>
                    @if (item.selected_options.length > 0) {
                      <div class="text-[10px] text-slate-400">
                        {{ item.selected_options[0].option_value }}
                        @if (item.selected_options.length > 1) {
                          และอีก {{ item.selected_options.length - 1 }} อย่าง
                        }
                      </div>
                    }
                  </div>
                  <span class="font-heading font-bold text-slate-800 shrink-0">฿{{ item.subtotal }}</span>
                </div>
              }
            </div>

            <!-- Pickup Details Box -->
            @if (selectedSlot) {
              <div class="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 text-xs space-y-1">
                <div class="font-semibold text-emerald-900 flex items-center gap-1.5">
                  <span>⏰ เวลารับอาหาร:</span>
                  <span>{{ selectedDate }} เวลา {{ selectedSlot.time }} น.</span>
                </div>
                <p class="text-[11px] text-emerald-700">
                  กรุณาไปรับอาหารตามรอบเวลา เพื่อความสดใหม่และไม่ต้องรอนาน
                </p>
              </div>
            }

            <div class="pt-3 border-t border-slate-100 flex justify-between items-baseline">
              <span class="font-heading font-bold text-slate-900 text-sm">ยอดรวมทั้งสิ้น</span>
              <span class="font-heading font-extrabold text-2xl text-brand-600">
                ฿{{ cartService.totalAmount() }}
              </span>
            </div>

            <!-- Confirm Button -->
            <button
              (click)="submitOrder()"
              [disabled]="isSubmitting()"
              class="w-full py-4 px-4 rounded-2xl bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 transition transform active:scale-98 cursor-pointer"
            >
              @if (isSubmitting()) {
                <svg class="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>กำลังส่งคำสั่งซื้อ...</span>
              } @else {
                <span>ยืนยันคำสั่งซื้อ</span>
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              }
            </button>

            <p class="text-[11px] text-center text-slate-400">
              * ชำระเงินเมื่อรับอาหารที่หน้าร้าน
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CheckoutComponent implements OnInit {
  customerName: string = '';
  customerPhone: string = '';
  selectedDate: string = '';
  selectedSlot: PickupSlot | null = null;
  pickupSlots = signal<PickupSlot[]>([]);
  isLoadingSlots = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  submitted: boolean = false;

  availableDates: Array<{ date: string; dayLabel: string; displayDate: string }> = [];

  constructor(
    public cartService: CartService,
    private apiService: ApiService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    if (!this.cartService.hasItems() || !this.cartService.restaurantId()) {
      this.router.navigate(['/cart']);
      return;
    }

    this.setupAvailableDates();
  }

  setupAvailableDates() {
    const dates = [];
    const daysTh = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const monthsTh = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
    ];

    for (let i = 0; i < 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const dayLabel = i === 0 ? 'วันนี้' : (i === 1 ? 'พรุ่งนี้' : `วัน${daysTh[d.getDay()]}`);
      const displayDate = `${d.getDate()} ${monthsTh[d.getMonth()]}`;

      dates.push({ date: dateStr, dayLabel, displayDate });
    }

    this.availableDates = dates;
    this.selectedDate = dates[0].date;
    this.fetchSlots();
  }

  selectDate(dateStr: string) {
    this.selectedDate = dateStr;
    this.selectedSlot = null;
    this.fetchSlots();
  }

  fetchSlots() {
    const restId = this.cartService.restaurantId();
    if (!restId) return;

    this.isLoadingSlots.set(true);
    this.apiService.getPickupSlots(restId, this.selectedDate).subscribe({
      next: (res) => {
        if (res.success) {
          this.pickupSlots.set(res.data.slots);
        }
        this.isLoadingSlots.set(false);
      },
      error: () => {
        this.isLoadingSlots.set(false);
        this.toastService.error('ไม่สามารถโหลดรอบเวลารับอาหารได้');
      },
    });
  }

  selectSlot(slot: PickupSlot) {
    if (!slot.isAvailable) return;
    this.selectedSlot = slot;
  }

  isPhoneValid(): boolean {
    const clean = this.customerPhone.replace(/[-\s]/g, '');
    const thaiPhoneRegex = /^0[689]\d{8}$|^0\d{8,9}$/;
    return thaiPhoneRegex.test(clean);
  }

  submitOrder() {
    this.submitted = true;

    if (!this.customerName.trim()) {
      this.toastService.error('กรุณาระบุชื่อผู้สั่งอาหาร');
      return;
    }

    if (!this.isPhoneValid()) {
      this.toastService.error('กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (เบอร์ไทย 10 หลัก)');
      return;
    }

    if (!this.selectedSlot) {
      this.toastService.error('กรุณาเลือกรอบเวลารับอาหาร');
      return;
    }

    const restId = this.cartService.restaurantId();
    if (!restId) return;

    this.isSubmitting.set(true);

    const payload = {
      restaurant_id: restId,
      customer_name: this.customerName.trim(),
      customer_phone: this.customerPhone.trim(),
      pickup_date: this.selectedDate,
      pickup_time: this.selectedSlot.time,
      note: this.cartService.orderNote(),
      items: this.cartService.items().map((item) => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        selected_options: item.selected_options,
        item_note: item.item_note,
      })),
    };

    this.apiService.createOrder(payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.success) {
          this.cartService.clearCart();
          this.toastService.success('ส่งคำสั่งซื้อสำเร็จ!');
          this.router.navigate(['/order-success', res.data.order.order_number], {
            state: { orderData: res.data },
          });
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || 'ไม่สามารถสร้างคำสั่งซื้อได้ กรุณาลองใหม่อีกครั้ง';
        this.toastService.error(msg);
      },
    });
  }
}
