import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  Restaurant,
  MenuItem,
  MenuCategory,
  CartItemOption,
} from '../../../core/models/food.models';

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="pb-20">
      <!-- Loading State -->
      @if (isLoading()) {
        <div class="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-6">
          <div class="h-64 bg-slate-200 rounded-3xl"></div>
          <div class="h-8 bg-slate-200 rounded w-1/3"></div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="h-32 bg-slate-200 rounded-2xl"></div>
            <div class="h-32 bg-slate-200 rounded-2xl"></div>
          </div>
        </div>
      }

      @if (!isLoading() && restaurant()) {
        <!-- Restaurant Header Banner -->
        <div class="relative bg-slate-900 text-white overflow-hidden">
          <div class="absolute inset-0 opacity-30">
            <img
              [src]="restaurant()!.image_url"
              [alt]="restaurant()!.name"
              class="w-full h-full object-cover blur-xs scale-105"
            />
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent"></div>

          <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <a
              routerLink="/"
              class="inline-flex items-center gap-1.5 text-xs text-orange-200 hover:text-white mb-4 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-md transition"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
              กลับหน้าร้านอาหารทั้งหมด
            </a>

            <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div class="max-w-2xl">
                <div class="flex items-center gap-2 mb-2">
                  <span class="px-2.5 py-0.5 rounded-full bg-brand-500 text-white text-[11px] font-semibold">
                    {{ restaurant()!.cuisine_type }}
                  </span>
                  @if (restaurant()!.is_open) {
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-white text-[11px] font-semibold">
                      <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                      เปิดรับออร์เดอร์
                    </span>
                  } @else {
                    <span class="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-semibold">
                      ร้านปิดชั่วคราว
                    </span>
                  }
                </div>

                <h1 class="text-2xl sm:text-4xl font-heading font-extrabold tracking-tight">
                  {{ restaurant()!.name }}
                </h1>
                <p class="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  {{ restaurant()!.description }}
                </p>

                <!-- Tags / Info -->
                <div class="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-300">
                  <div class="flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>เวลาเปิด: {{ restaurant()!.opening_time }} - {{ restaurant()!.closing_time }} น.</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    <span>เวลาเตรียมอาหาร: ~{{ restaurant()!.preparation_minutes }} นาที</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-fresh-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                    </svg>
                    <span>จองรอบเวลารับได้ทุกๆ {{ restaurant()!.slot_interval_minutes }} นาที</span>
                  </div>
                </div>
              </div>

              <!-- Cart Summary Pill for quick jump -->
              @if (cartService.itemCount() > 0 && cartService.restaurantId() === restaurant()!.id) {
                <a
                  routerLink="/cart"
                  class="bg-brand-500 hover:bg-brand-600 text-white px-5 py-3 rounded-2xl shadow-lg shadow-brand-500/30 flex items-center gap-3 transition transform hover:scale-105"
                >
                  <div class="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-sm">
                    {{ cartService.itemCount() }}
                  </div>
                  <div class="text-left">
                    <div class="text-[11px] text-orange-100">มีรายการในตะกร้า</div>
                    <div class="text-sm font-bold">฿{{ cartService.totalAmount() }} • ไปที่ตะกร้า</div>
                  </div>
                </a>
              }
            </div>
          </div>
        </div>

        <!-- Sticky Categories Bar & Search -->
        <div class="sticky top-16 z-30 bg-[#fbf7ee]/95 backdrop-blur-md border-b border-orange-100 py-3 shadow-xs">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <!-- Category Tabs -->
            <div class="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                (click)="selectedCategory.set(null)"
                class="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer"
                [ngClass]="{
                  'bg-brand-500 text-white shadow-xs': selectedCategory() === null,
                  'bg-white text-slate-700 hover:bg-orange-50 border border-slate-200': selectedCategory() !== null
                }"
              >
                เมนูทั้งหมด ({{ menuItems().length }})
              </button>
              @for (cat of categories(); track cat.id) {
                <button
                  (click)="selectedCategory.set(cat.id)"
                  class="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer"
                  [ngClass]="{
                    'bg-brand-500 text-white shadow-xs': selectedCategory() === cat.id,
                    'bg-white text-slate-700 hover:bg-orange-50 border border-slate-200': selectedCategory() !== cat.id
                  }"
                >
                  {{ cat.name }}
                </button>
              }
            </div>

            <!-- Search in restaurant -->
            <div class="w-full sm:w-64 relative">
              <input
                type="text"
                [(ngModel)]="searchMenu"
                placeholder="ค้นหาเมนูในร้านนี้..."
                class="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500"
              />
              <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Menu Items List -->
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          @if (filteredMenuItems().length === 0) {
            <div class="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 max-w-md mx-auto">
              <span class="text-4xl">🍽️</span>
              <h3 class="font-heading font-bold text-slate-800 mt-2 text-base">ไม่พบเมนูที่ค้นหา</h3>
              <p class="text-xs text-slate-500 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่น</p>
            </div>
          }

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (item of filteredMenuItems(); track item.id) {
              <div
                class="bg-white rounded-2xl overflow-hidden border border-orange-100/70 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                [ngClass]="{ 'opacity-60': !item.is_available }"
              >
                <div>
                  <!-- Image -->
                  <div class="relative h-44 overflow-hidden bg-slate-100">
                    <img
                      [src]="item.image_url"
                      [alt]="item.name"
                      class="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <!-- Availability Pill -->
                    <div class="absolute top-3 right-3">
                      @if (item.is_available) {
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500 text-white shadow-xs">
                          พร้อมขาย
                        </span>
                      } @else {
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-600 text-white shadow-xs">
                          หมดชั่วคราว
                        </span>
                      }
                    </div>
                  </div>

                  <!-- Item Content -->
                  <div class="p-4">
                    <div class="flex items-start justify-between gap-2">
                      <h3 class="font-heading font-bold text-base text-slate-900 leading-snug">
                        {{ item.name }}
                      </h3>
                      <span class="font-heading font-bold text-brand-600 text-base shrink-0">
                        ฿{{ item.price }}
                      </span>
                    </div>
                    <p class="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {{ item.description }}
                    </p>

                    @if (item.options && item.options.length > 0) {
                      <div class="mt-2 flex flex-wrap gap-1">
                        <span class="inline-flex items-center text-[10px] text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                          ⚡ มี {{ item.options.length }} ตัวเลือกเพิ่มเติม
                        </span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Footer Action -->
                <div class="p-4 pt-0">
                  <button
                    (click)="openCustomizationModal(item)"
                    [disabled]="!item.is_available || !restaurant()!.is_open"
                    class="w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    [ngClass]="{
                      'bg-brand-500 hover:bg-brand-600 text-white shadow-sm shadow-brand-500/20 active:scale-98 cursor-pointer': item.is_available && restaurant()!.is_open,
                      'bg-slate-100 text-slate-400 cursor-not-allowed': !item.is_available || !restaurant()!.is_open
                    }"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    <span>{{ !restaurant()!.is_open ? 'ร้านปิด' : (!item.is_available ? 'หมดแล้ว' : 'เลือกตัวเลือก & สั่ง') }}</span>
                  </button>
                </div>
              </div>
            }
          </div>
        </main>
      }

      <!-- Item Customization Modal -->
      @if (activeModalItem()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div class="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-orange-100 flex flex-col">
            <!-- Modal Header with Image -->
            <div class="relative h-48 bg-slate-100 shrink-0">
              <img
                [src]="activeModalItem()!.image_url"
                [alt]="activeModalItem()!.name"
                class="w-full h-full object-cover"
              />
              <button
                (click)="closeModal()"
                class="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/70 text-white flex items-center justify-center hover:bg-slate-900 transition"
              >
                ✕
              </button>
            </div>

            <div class="p-6 flex-1 flex flex-col justify-between space-y-6">
              <div>
                <div class="flex items-baseline justify-between">
                  <h3 class="font-heading font-bold text-xl text-slate-900">
                    {{ activeModalItem()!.name }}
                  </h3>
                  <span class="font-heading font-bold text-xl text-brand-600">
                    ฿{{ activeModalItem()!.price }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-1">
                  {{ activeModalItem()!.description }}
                </p>

                <!-- Options / Addons List -->
                @if (modalOptionGroups().length > 0) {
                  <div class="mt-5 space-y-4 pt-4 border-t border-slate-100">
                    @for (group of modalOptionGroups(); track group.groupName) {
                      <div>
                        <h4 class="font-heading font-semibold text-xs text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                          {{ group.groupName }}
                        </h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          @for (opt of group.options; track opt.option_value) {
                            <label
                              class="flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-xs transition"
                              [ngClass]="{
                                'border-brand-500 bg-orange-50/60 text-brand-900 font-semibold ring-1 ring-brand-500': isOptionSelected(opt),
                                'border-slate-200 hover:border-slate-300 text-slate-700': !isOptionSelected(opt)
                              }"
                            >
                              <div class="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  [checked]="isOptionSelected(opt)"
                                  (change)="toggleOption(opt, group.groupName)"
                                  class="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                                />
                                <span>{{ opt.option_value }}</span>
                              </div>
                              @if (opt.additional_price > 0) {
                                <span class="text-brand-600 font-medium">+฿{{ opt.additional_price }}</span>
                              } @else {
                                <span class="text-slate-400 font-normal">ฟรี</span>
                              }
                            </label>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }

                <!-- Special Note Input -->
                <div class="mt-4 pt-4 border-t border-slate-100">
                  <label class="block text-xs font-semibold text-slate-700 mb-1">
                    หมายเหตุเพิ่มเติม (เช่น ไม่ใส่ผัก, เผ็ดน้อย)
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="modalItemNote"
                    placeholder="ระบุข้อความพิเศษสำหรับเมนูนี้..."
                    class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500"
                  />
                </div>
              </div>

              <!-- Quantity & Add Button -->
              <div class="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <!-- Quantity Counter -->
                <div class="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                  <button
                    (click)="changeModalQuantity(-1)"
                    [disabled]="modalQuantity <= 1"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white disabled:opacity-30 transition font-bold"
                  >
                    -
                  </button>
                  <span class="w-10 text-center font-heading font-bold text-sm text-slate-800">
                    {{ modalQuantity }}
                  </span>
                  <button
                    (click)="changeModalQuantity(1)"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white transition font-bold"
                  >
                    +
                  </button>
                </div>

                <!-- Add Button -->
                <button
                  (click)="confirmAddToCart()"
                  class="flex-1 py-3 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs flex items-center justify-between shadow-lg shadow-brand-500/25 transition transform active:scale-98 cursor-pointer"
                >
                  <span>เพิ่มลงตะกร้า</span>
                  <span class="font-bold font-heading text-sm">฿{{ modalTotal() }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Conflict Confirmation Modal (1 restaurant per order constraint) -->
      @if (showConflictModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-orange-100 text-center">
            <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h3 class="font-heading font-bold text-lg text-slate-900">เปลี่ยนร้านอาหารในตะกร้า?</h3>
            <p class="text-xs text-slate-500 mt-2 leading-relaxed">
              ในตะกร้ามีรายการอาหารจากร้าน <span class="font-bold text-brand-600">"{{ conflictingRestaurantName }}"</span> อยู่แล้ว<br/>
              (ระบบจำกัดการสั่ง 1 ร้านต่อ 1 คำสั่งซื้อ เพื่อความสะดวกในการรับอาหาร)
            </p>
            <div class="mt-6 flex items-center gap-3">
              <button
                (click)="showConflictModal.set(false)"
                class="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                คงรายการเดิมไว้
              </button>
              <button
                (click)="confirmClearAndAdd()"
                class="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-sm transition"
              >
                ล้างและสั่งร้านนี้
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class RestaurantDetailComponent implements OnInit {
  restaurantId!: number;
  restaurant = signal<Restaurant | null>(null);
  categories = signal<MenuCategory[]>([]);
  menuItems = signal<MenuItem[]>([]);
  isLoading = signal<boolean>(true);

  selectedCategory = signal<number | null>(null);
  searchMenu: string = '';

  // Customization Modal State
  activeModalItem = signal<MenuItem | null>(null);
  selectedModalOptions = signal<CartItemOption[]>([]);
  modalQuantity: number = 1;
  modalItemNote: string = '';

  // Conflict Modal State
  showConflictModal = signal<boolean>(false);
  conflictingRestaurantName: string = '';
  pendingAddPayload: any = null;

  filteredMenuItems = computed(() => {
    let items = this.menuItems();
    const cat = this.selectedCategory();
    if (cat !== null) {
      items = items.filter((i) => i.category_id === cat);
    }
    if (this.searchMenu.trim()) {
      const q = this.searchMenu.toLowerCase().trim();
      items = items.filter(
        (i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
      );
    }
    return items;
  });

  modalOptionGroups = computed(() => {
    const item = this.activeModalItem();
    if (!item || !item.options) return [];

    const groupMap = new Map<string, any[]>();
    for (const opt of item.options) {
      const groupName = opt.option_name || 'ตัวเลือกเพิ่มเติม';
      if (!groupMap.has(groupName)) {
        groupMap.set(groupName, []);
      }
      groupMap.get(groupName)!.push(opt);
    }

    return Array.from(groupMap.entries()).map(([groupName, options]) => ({
      groupName,
      options,
    }));
  });

  modalTotal = computed(() => {
    const item = this.activeModalItem();
    if (!item) return 0;
    const base = Number(item.price);
    const addons = this.selectedModalOptions().reduce((sum, o) => sum + Number(o.additional_price || 0), 0);
    return (base + addons) * this.modalQuantity;
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    public cartService: CartService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.restaurantId = Number(id);
        this.fetchMenu();
      }
    });
  }

  fetchMenu() {
    this.isLoading.set(true);
    this.apiService.getRestaurantMenu(this.restaurantId).subscribe({
      next: (res) => {
        if (res.success) {
          this.restaurant.set(res.data.restaurant);
          this.categories.set(res.data.categories || []);
          this.menuItems.set(res.data.items || []);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.error('ไม่สามารถโหลดข้อมูลเมนูอาหารได้');
      },
    });
  }

  openCustomizationModal(item: MenuItem) {
    this.activeModalItem.set(item);
    this.selectedModalOptions.set([]);
    this.modalQuantity = 1;
    this.modalItemNote = '';
  }

  closeModal() {
    this.activeModalItem.set(null);
  }

  isOptionSelected(opt: any): boolean {
    return this.selectedModalOptions().some(
      (o) => o.option_name === opt.option_name && o.option_value === opt.option_value
    );
  }

  toggleOption(opt: any, groupName: string) {
    const current = [...this.selectedModalOptions()];
    const index = current.findIndex(
      (o) => o.option_name === opt.option_name && o.option_value === opt.option_value
    );

    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push({
        option_id: opt.id,
        option_name: opt.option_name,
        option_value: opt.option_value,
        additional_price: Number(opt.additional_price || 0),
      });
    }
    this.selectedModalOptions.set(current);
  }

  changeModalQuantity(change: number) {
    this.modalQuantity = Math.max(1, this.modalQuantity + change);
  }

  confirmAddToCart() {
    const item = this.activeModalItem();
    const rest = this.restaurant();
    if (!item || !rest) return;

    const payload = {
      restaurant: { id: rest.id, name: rest.name },
      item: { id: item.id, name: item.name, price: item.price, image_url: item.image_url },
      quantity: this.modalQuantity,
      options: this.selectedModalOptions(),
      note: this.modalItemNote,
    };

    const res = this.cartService.addItem(
      payload.restaurant,
      payload.item,
      payload.quantity,
      payload.options,
      payload.note
    );

    if (res.needsConfirmation) {
      this.pendingAddPayload = payload;
      this.conflictingRestaurantName = res.currentRestaurant || '';
      this.showConflictModal.set(true);
    } else {
      this.closeModal();
    }
  }

  confirmClearAndAdd() {
    this.cartService.clearCart();
    if (this.pendingAddPayload) {
      this.cartService.addItem(
        this.pendingAddPayload.restaurant,
        this.pendingAddPayload.item,
        this.pendingAddPayload.quantity,
        this.pendingAddPayload.options,
        this.pendingAddPayload.note
      );
      this.pendingAddPayload = null;
    }
    this.showConflictModal.set(false);
    this.closeModal();
  }
}
