import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900">
            ตะกร้าสินค้าของคุณ
          </h1>
          @if (cartService.restaurantName()) {
            <p class="text-xs text-brand-600 font-medium mt-1 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-brand-500"></span>
              สั่งจากร้าน: <span class="font-bold underline">{{ cartService.restaurantName() }}</span>
            </p>
          }
        </div>

        @if (cartService.hasItems()) {
          <button
            (click)="cartService.clearCart()"
            class="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            ล้างตะกร้าทั้งหมด
          </button>
        }
      </div>

      <!-- Empty State -->
      @if (!cartService.hasItems()) {
        <div class="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200 max-w-md mx-auto shadow-xs">
          <div class="w-20 h-20 mx-auto rounded-3xl bg-orange-50 text-brand-500 flex items-center justify-center mb-4">
            <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
          </div>
          <h2 class="font-heading font-bold text-slate-800 text-lg">ยังไม่มีรายการอาหารในตะกร้า</h2>
          <p class="text-xs text-slate-500 mt-1 leading-relaxed">
            เลือกร้านอาหารที่ชอบ แล้วเพิ่มเมนูแสนอร่อยลงในตะกร้าเพื่อสั่งล่วงหน้าได้เลย!
          </p>
          <a
            routerLink="/"
            class="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition cursor-pointer"
          >
            <span>ไปเลือกร้านอาหาร</span>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </a>
        </div>
      }

      <!-- Cart Item List -->
      @if (cartService.hasItems()) {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Items List Column (2 cols) -->
          <div class="lg:col-span-2 space-y-4">
            @for (item of cartService.items(); track item.id) {
              <div class="bg-white rounded-2xl p-4 sm:p-5 border border-orange-100/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <!-- Item Image and Details -->
                <div class="flex items-start gap-4 flex-1">
                  <img
                    [src]="item.image_url"
                    [alt]="item.name"
                    class="w-20 h-20 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-100"
                  />
                  <div>
                    <h3 class="font-heading font-bold text-slate-900 text-sm sm:text-base">
                      {{ item.name }}
                    </h3>
                    <div class="text-xs text-brand-600 font-semibold mt-0.5">
                      ฿{{ item.unit_price }} / ชิ้น
                    </div>

                    <!-- Selected Addons/Options -->
                    @if (item.selected_options.length > 0) {
                      <div class="mt-2 flex flex-wrap gap-1">
                        @for (opt of item.selected_options; track opt.option_value) {
                          <span class="text-[10px] bg-orange-50 border border-orange-200/80 text-brand-800 px-2 py-0.5 rounded-md font-medium">
                            {{ opt.option_name }}: {{ opt.option_value }}
                            @if (opt.additional_price > 0) {
                              (+฿{{ opt.additional_price }})
                            }
                          </span>
                        }
                      </div>
                    }

                    <!-- Item Note -->
                    @if (item.item_note) {
                      <div class="text-[11px] text-slate-500 mt-1 italic">
                        💬 หมายเหตุ: "{{ item.item_note }}"
                      </div>
                    }
                  </div>
                </div>

                <!-- Quantity Controls & Subtotal -->
                <div class="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div class="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                    <button
                      (click)="cartService.updateQuantity(item.id, -1)"
                      class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white transition text-xs font-bold"
                    >
                      -
                    </button>
                    <span class="w-8 text-center font-heading font-bold text-xs text-slate-800">
                      {{ item.quantity }}
                    </span>
                    <button
                      (click)="cartService.updateQuantity(item.id, 1)"
                      class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white transition text-xs font-bold"
                    >
                      +
                    </button>
                  </div>

                  <div class="text-right min-w-[70px]">
                    <div class="font-heading font-bold text-slate-900 text-sm">
                      ฿{{ item.subtotal }}
                    </div>
                    <button
                      (click)="cartService.removeItem(item.id)"
                      class="text-[11px] text-slate-400 hover:text-rose-600 transition"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              </div>
            }

            <!-- Overall Order Note -->
            <div class="bg-white rounded-2xl p-4 border border-orange-100/80 shadow-xs">
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                📝 หมายเหตุรวมสำหรับทั้งคำสั่งซื้อ (ถ้ามี)
              </label>
              <textarea
                [ngModel]="cartService.orderNote()"
                (ngModelChange)="cartService.setOrderNote($event)"
                rows="2"
                placeholder="เช่น ขอช้อนส้อม 2 ชุด, หรือแจ้งความต้องการทั่วไป..."
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500"
              ></textarea>
            </div>
          </div>

          <!-- Order Summary Column (1 col) -->
          <div class="lg:col-span-1">
            <div class="bg-white rounded-3xl p-6 border border-orange-100 shadow-md sticky top-24 space-y-4">
              <h2 class="font-heading font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
                สรุปคำสั่งซื้อ
              </h2>

              <div class="space-y-2 text-xs">
                <div class="flex justify-between text-slate-600">
                  <span>จำนวนรายการอาหาร</span>
                  <span class="font-semibold text-slate-800">{{ cartService.itemCount() }} ชิ้น</span>
                </div>
                <div class="flex justify-between text-slate-600">
                  <span>ยอดรวมค่าอาหาร</span>
                  <span class="font-semibold text-slate-800">฿{{ cartService.totalAmount() }}</span>
                </div>
                <div class="flex justify-between text-slate-600">
                  <span>ค่าบริการระบบ</span>
                  <span class="font-semibold text-fresh-600">ฟรี (สำหรับตึกครุฯ)</span>
                </div>
              </div>

              <div class="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span class="font-heading font-bold text-slate-900 text-sm">ยอดชำระทั้งสิ้น</span>
                <span class="font-heading font-extrabold text-2xl text-brand-600">
                  ฿{{ cartService.totalAmount() }}
                </span>
              </div>

              <div class="bg-amber-50 rounded-xl p-3 border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2">
                <span>ℹ️</span>
                <span>ชำระเงินโดยตรงกับทางร้านค้าเมื่อมารับอาหารตามรอบเวลา</span>
              </div>

              <a
                routerLink="/checkout"
                class="w-full py-3.5 px-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 transition transform active:scale-98 cursor-pointer"
              >
                <span>ดำเนินการเลือกเวลารับอาหาร</span>
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </a>

              <a
                [routerLink]="['/restaurant', cartService.restaurantId()]"
                class="w-full block text-center text-xs text-brand-600 hover:underline pt-2 font-medium"
              >
                + เพิ่มรายการอาหารอื่นจากร้านนี้
              </a>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class CartComponent {
  constructor(public cartService: CartService) {}
}
