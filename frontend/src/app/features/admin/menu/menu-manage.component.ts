import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Restaurant, MenuItem, MenuCategory, MenuOption } from '../../../core/models/food.models';
import { isPagesApiMissing } from '../../../core/config/api-url';

@Component({
  selector: 'app-menu-manage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="font-heading font-extrabold text-2xl text-slate-900">
            จัดการเมนูอาหาร (Menus & Addons)
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            เพิ่ม แก้ไข ตั้งราคา เมนูหมดชั่วคราว และกำหนดตัวเลือกพิเศษ (เช่น เพิ่มไข่ดาว, ระดับความเผ็ด)
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            (click)="openAddCategoryModal()"
            class="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
          >
            + เพิ่มหมวดหมู่
          </button>
          <button
            (click)="openAddMenuModal()"
            [disabled]="!selectedRestaurantId"
            class="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:bg-slate-200 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-brand-500/20 transition cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            เพิ่มเมนูอาหารใหม่
          </button>
        </div>
      </div>

      <!-- Restaurant Selector Bar -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="text-xs font-semibold text-slate-700 shrink-0">เลือกร้านอาหารที่ต้องการจัดการ:</span>
          <select
            [(ngModel)]="selectedRestaurantId"
            (ngModelChange)="onRestaurantChange()"
            class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand-500"
          >
            @for (rest of restaurants(); track rest.id) {
              <option [value]="rest.id">{{ rest.name }} ({{ rest.cuisine_type }})</option>
            }
          </select>
        </div>

        <div class="text-xs text-slate-500">
          มีทั้งหมด <span class="font-bold text-brand-600">{{ menuItems().length }}</span> เมนูในร้านนี้
        </div>
      </div>

      <!-- Menus Table -->
      <div class="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th class="py-3 px-4">รูปภาพ</th>
                <th class="py-3 px-4">ชื่อเมนูอาหาร</th>
                <th class="py-3 px-4">หมวดหมู่</th>
                <th class="py-3 px-4">ราคาพื้นฐาน</th>
                <th class="py-3 px-4">ตัวเลือกเสริม (Options)</th>
                <th class="py-3 px-4">สถานะการขาย</th>
                <th class="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (item of menuItems(); track item.id) {
                <tr class="hover:bg-slate-50/60 transition">
                  <td class="py-3 px-4">
                    <img
                      [src]="item.image_url"
                      [alt]="item.name"
                      class="w-12 h-12 rounded-xl object-cover bg-slate-100"
                    />
                  </td>
                  <td class="py-3 px-4">
                    <div class="font-bold text-slate-900 text-sm">{{ item.name }}</div>
                    <div class="text-[11px] text-slate-400 line-clamp-1 max-w-xs">{{ item.description }}</div>
                  </td>
                  <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {{ getCategoryName(item.category_id) }}
                    </span>
                  </td>
                  <td class="py-3 px-4 font-heading font-bold text-brand-600 text-sm">
                    ฿{{ item.price }}
                  </td>
                  <td class="py-3 px-4">
                    @if (item.options && item.options.length > 0) {
                      <div class="flex flex-wrap gap-1 max-w-xs">
                        @for (opt of item.options.slice(0, 3); track opt.option_value) {
                          <span class="text-[10px] bg-orange-50 text-brand-700 px-1.5 py-0.5 rounded border border-orange-100">
                            {{ opt.option_value }} (+฿{{ opt.additional_price }})
                          </span>
                        }
                        @if (item.options.length > 3) {
                          <span class="text-[10px] text-slate-400 self-center">+{{ item.options.length - 3 }}</span>
                        }
                      </div>
                    } @else {
                      <span class="text-slate-400 text-[11px]">- ไม่มีตัวเลือก -</span>
                    }
                  </td>
                  <td class="py-3 px-4">
                    <button
                      (click)="toggleAvailability(item)"
                      class="px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer"
                      [ngClass]="{
                        'bg-emerald-50 text-emerald-700 border border-emerald-200': item.is_available,
                        'bg-rose-50 text-rose-700 border border-rose-200': !item.is_available
                      }"
                    >
                      {{ item.is_available ? '● พร้อมขาย' : '○ หมดชั่วคราว' }}
                    </button>
                  </td>
                  <td class="py-3 px-4 text-right space-x-1">
                    <button
                      (click)="openEditMenuModal(item)"
                      class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition cursor-pointer"
                    >
                      แก้ไข
                    </button>
                    <button
                      (click)="deleteItem(item)"
                      class="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold transition cursor-pointer"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Menu Item Modal -->
      @if (showMenuModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div class="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="font-heading font-bold text-lg text-slate-900">
                {{ modalIsEdit ? 'แก้ไขรายการอาหาร' : 'เพิ่มรายการอาหารใหม่' }}
              </h3>
              <button (click)="showMenuModal.set(false)" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form (ngSubmit)="saveMenuItem()" class="space-y-4 text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">ชื่อรายการอาหาร *</label>
                  <input
                    type="text"
                    [(ngModel)]="menuForm.name"
                    name="name"
                    required
                    placeholder="เช่น ข้าวมันไก่ต้ม, บะหมี่หมูแดง"
                    class="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:border-brand-500"
                  />
                </div>

                <div>
                  <label class="block font-semibold text-slate-700 mb-1">หมวดหมู่อาหาร</label>
                  <select
                    [(ngModel)]="menuForm.category_id"
                    name="category_id"
                    class="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:border-brand-500"
                  >
                    <option [ngValue]="null">-- ไม่ระบุหมวดหมู่ --</option>
                    @for (cat of categories(); track cat.id) {
                      <option [ngValue]="cat.id">{{ cat.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">ราคาพื้นฐาน (บาท) *</label>
                  <input
                    type="number"
                    [(ngModel)]="menuForm.price"
                    name="price"
                    required
                    min="0"
                    step="0.5"
                    class="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:border-brand-500"
                  />
                </div>

                <div>
                  <label class="block font-semibold text-slate-700 mb-1">URL รูปภาพอาหาร</label>
                  <input
                    type="url"
                    [(ngModel)]="menuForm.image_url"
                    name="image_url"
                    placeholder="https://images.unsplash.com/..."
                    class="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:border-brand-500"
                  />
                  <label class="mt-2 flex cursor-pointer items-center gap-2 text-xs font-semibold text-brand-700">
                    <input type="file" accept="image/jpeg,image/png,image/webp" (change)="uploadImage($event)" [disabled]="uploadingImage()" class="max-w-full text-xs" />
                    {{ uploadingImage() ? 'กำลังบันทึก…' : 'หรือเลือกภาพจากเครื่อง (JPG, PNG, WEBP ไม่เกิน ' + (localDemoMode ? '1' : '5') + ' MB)' }}
                  </label>
                </div>
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">คำอธิบายรายละเอียดอาหาร</label>
                <textarea
                  [(ngModel)]="menuForm.description"
                  name="description"
                  rows="2"
                  placeholder="รสชาติกลมกล่อม สูตรพิเศษ..."
                  class="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:border-brand-500"
                ></textarea>
              </div>

              <!-- Options & Addons Builder -->
              <div class="pt-3 border-t border-slate-100">
                <div class="flex items-center justify-between mb-2">
                  <div>
                    <h4 class="font-heading font-bold text-slate-800 text-sm">
                      ตัวเลือกเพิ่มเติม (Options / Add-ons)
                    </h4>
                    <p class="text-[11px] text-slate-400">
                      เช่น ระดับความเผ็ด, เพิ่มไข่ดาว (+10), พิเศษ (+10)
                    </p>
                  </div>
                  <button
                    type="button"
                    (click)="addOptionRow()"
                    class="px-2.5 py-1 rounded-lg bg-orange-50 text-brand-600 hover:bg-orange-100 font-semibold text-xs border border-orange-200 transition cursor-pointer"
                  >
                    + เพิ่มตัวเลือก
                  </button>
                </div>

                <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
                  @for (opt of menuForm.options; track $index; let idx = $index) {
                    <div class="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <input
                        type="text"
                        [(ngModel)]="opt.option_name"
                        [name]="'opt_group_' + idx"
                        placeholder="กลุ่ม (เช่น ตัวเลือกไข่, เส้น)"
                        class="flex-1 px-2.5 py-1.5 border rounded-lg bg-white text-xs"
                      />
                      <input
                        type="text"
                        [(ngModel)]="opt.option_value"
                        [name]="'opt_val_' + idx"
                        placeholder="ชื่อตัวเลือก (เช่น ไข่ดาว, เผ็ดมาก)"
                        class="flex-1 px-2.5 py-1.5 border rounded-lg bg-white text-xs"
                      />
                      <div class="flex items-center gap-1 w-28">
                        <span class="text-slate-400 text-xs">+฿</span>
                        <input
                          type="number"
                          [(ngModel)]="opt.additional_price"
                          [name]="'opt_price_' + idx"
                          min="0"
                          placeholder="0"
                          class="w-full px-2 py-1.5 border rounded-lg bg-white text-xs font-bold"
                        />
                      </div>
                      <button
                        type="button"
                        (click)="removeOptionRow(idx)"
                        class="text-slate-400 hover:text-rose-600 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  }
                  @if (menuForm.options.length === 0) {
                    <div class="text-center py-4 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      ยังไม่มีตัวเลือกเสริมสำหรับเมนูนี้
                    </div>
                  }
                </div>
              </div>

              <div class="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="menuAvailCheck"
                  [(ngModel)]="menuForm.is_available"
                  name="is_available"
                  class="w-4 h-4 text-brand-600 rounded"
                />
                <label for="menuAvailCheck" class="font-semibold text-slate-800">
                  พร้อมขายในระบบทันที
                </label>
              </div>

              <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  (click)="showMenuModal.set(false)"
                  class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  class="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-md shadow-brand-500/20"
                >
                  บันทึกเมนูอาหาร
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Add Category Modal -->
      @if (showCategoryModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div class="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 class="font-heading font-bold text-base text-slate-900">เพิ่มหมวดหมู่อาหารใหม่</h3>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">ชื่อหมวดหมู่ *</label>
              <input
                type="text"
                [(ngModel)]="newCategoryName"
                placeholder="เช่น เมนูจานด่วน, เครื่องดื่ม"
                class="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white text-xs"
              />
            </div>
            <div class="flex items-center justify-end gap-2 pt-2">
              <button
                (click)="showCategoryModal.set(false)"
                class="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
              >
                ยกเลิก
              </button>
              <button
                (click)="saveCategory()"
                class="px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-semibold shadow-sm"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class MenuManageComponent implements OnInit {
  localDemoMode = isPagesApiMissing();
  restaurants = signal<Restaurant[]>([]);
  categories = signal<MenuCategory[]>([]);
  menuItems = signal<MenuItem[]>([]);
  uploadingImage = signal(false);
  selectedRestaurantId: number | null = null;

  showMenuModal = signal<boolean>(false);
  modalIsEdit: boolean = false;
  activeItemId: number | null = null;

  menuForm: any = {
    name: '',
    category_id: null,
    price: 50,
    description: '',
    image_url: '',
    is_available: true,
    options: [],
  };

  showCategoryModal = signal<boolean>(false);
  newCategoryName: string = '';

  constructor(private apiService: ApiService, private toastService: ToastService) {}

  ngOnInit() {
    this.apiService.getAdminRestaurants().subscribe({
      next: (res) => {
        if (res.success && res.data.length > 0) {
          this.restaurants.set(res.data);
          this.selectedRestaurantId = res.data[0].id;
          this.onRestaurantChange();
        }
      },
    });
  }

  onRestaurantChange() {
    if (!this.selectedRestaurantId) return;
    this.apiService.getRestaurantMenu(this.selectedRestaurantId).subscribe({
      next: (res) => {
        if (res.success) {
          this.categories.set(res.data.categories || []);
          this.menuItems.set(res.data.items || []);
        }
      },
    });
  }

  getCategoryName(catId?: number | null): string {
    if (!catId) return 'ทั่วไป';
    const found = this.categories().find((c) => c.id === catId);
    return found ? found.name : 'ทั่วไป';
  }

  toggleAvailability(item: MenuItem) {
    this.apiService.toggleMenuItemAvailability(item.id).subscribe({
      next: (res) => {
        if (res.success) {
          item.is_available = res.data.is_available;
          this.toastService.success(res.message || 'บันทึกสถานะเรียบร้อย');
        }
      },
    });
  }

  openAddMenuModal() {
    this.modalIsEdit = false;
    this.activeItemId = null;
    this.menuForm = {
      name: '',
      category_id: this.categories().length > 0 ? this.categories()[0].id : null,
      price: 50,
      description: '',
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      is_available: true,
      options: [],
    };
    this.showMenuModal.set(true);
  }

  openEditMenuModal(item: MenuItem) {
    this.modalIsEdit = true;
    this.activeItemId = item.id;
    this.menuForm = {
      name: item.name,
      category_id: item.category_id,
      price: item.price,
      description: item.description,
      image_url: item.image_url,
      is_available: item.is_available,
      options: item.options ? JSON.parse(JSON.stringify(item.options)) : [],
    };
    this.showMenuModal.set(true);
  }

  addOptionRow() {
    this.menuForm.options.push({
      option_name: 'ตัวเลือกเพิ่มเติม',
      option_value: '',
      additional_price: 0,
    });
  }

  removeOptionRow(index: number) {
    this.menuForm.options.splice(index, 1);
  }

  saveMenuItem() {
    if (!this.selectedRestaurantId) return;

    if (this.modalIsEdit && this.activeItemId) {
      this.apiService.updateMenuItem(this.activeItemId, this.menuForm).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.success('อัปเดตเมนูอาหารเรียบร้อย');
            this.showMenuModal.set(false);
            this.onRestaurantChange();
          }
        },
      });
    } else {
      this.apiService.createMenuItem(this.selectedRestaurantId, this.menuForm).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.success('เพิ่มเมนูอาหารเรียบร้อย');
            this.showMenuModal.set(false);
            this.onRestaurantChange();
          }
        },
      });
    }
  }

  uploadImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (this.localDemoMode && file.size > 1_000_000) {
      this.toastService.error('โหมดนี้บันทึกรูปในเบราว์เซอร์ได้ไม่เกิน 1 MB');
      input.value = '';
      return;
    }
    this.uploadingImage.set(true);
    this.apiService.uploadImage(file).subscribe({
      next: (res) => {
        this.menuForm.image_url = res.data.image_url;
        this.toastService.success('อัปโหลดรูปภาพแล้ว กรุณาบันทึกเมนู');
        this.uploadingImage.set(false);
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'อัปโหลดรูปภาพไม่สำเร็จ');
        this.uploadingImage.set(false);
      },
    });
    input.value = '';
  }

  deleteItem(item: MenuItem) {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบเมนู "${item.name}"?`)) {
      this.apiService.deleteMenuItem(item.id).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.success(res.message || 'บันทึกสถานะเรียบร้อย');
            this.onRestaurantChange();
          }
        },
      });
    }
  }

  openAddCategoryModal() {
    this.newCategoryName = '';
    this.showCategoryModal.set(true);
  }

  saveCategory() {
    if (!this.selectedRestaurantId || !this.newCategoryName.trim()) return;

    this.apiService.createCategory(this.selectedRestaurantId, this.newCategoryName.trim()).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.success('เพิ่มหมวดหมู่สำเร็จ');
          this.showCategoryModal.set(false);
          this.onRestaurantChange();
        }
      },
    });
  }
}
