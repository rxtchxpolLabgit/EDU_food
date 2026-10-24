import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Restaurant } from '../../../core/models/food.models';

@Component({
  selector: 'app-restaurants-manage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="font-heading font-extrabold text-2xl text-slate-900">
            จัดการร้านอาหาร (Restaurants)
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            ตั้งค่าเวลาเปิด-ปิด กำหนดรอบเวลารับอาหาร และความจุออร์เดอร์สูงสุดต่อรอบ
          </p>
        </div>

        <button
          (click)="openAddModal()"
          class="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-brand-500/20 transition cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          เพิ่มร้านอาหารใหม่
        </button>
      </div>

      <!-- Restaurants List Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (rest of restaurants(); track rest.id) {
          <div class="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition flex flex-col justify-between">
            <div>
              <!-- Header Image -->
              <div class="relative h-44 bg-slate-100 overflow-hidden">
                <img
                  [src]="rest.image_url"
                  [alt]="rest.name"
                  class="w-full h-full object-cover"
                />
                <!-- Open/Close Switch -->
                <div class="absolute top-3 right-3">
                  <button
                    (click)="toggleStatus(rest)"
                    class="px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                    [ngClass]="{
                      'bg-emerald-500 text-white': rest.is_open,
                      'bg-rose-600 text-white': !rest.is_open
                    }"
                  >
                    <span class="w-2 h-2 rounded-full bg-white" [ngClass]="{ 'animate-ping': rest.is_open }"></span>
                    <span>{{ rest.is_open ? 'เปิดรับออร์เดอร์' : 'ปิดชั่วคราว' }}</span>
                  </button>
                </div>
                <!-- Cuisine -->
                <div class="absolute bottom-3 left-3 bg-slate-900/80 text-white text-[11px] px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                  {{ rest.cuisine_type }}
                </div>
              </div>

              <!-- Body -->
              <div class="p-5 space-y-3">
                <h3 class="font-heading font-bold text-lg text-slate-900">
                  {{ rest.name }}
                </h3>
                <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {{ rest.description }}
                </p>

                <!-- Configuration Table Summary -->
                <div class="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-xs space-y-1.5">
                  <div class="flex justify-between">
                    <span class="text-slate-500">เวลาทำการ:</span>
                    <span class="font-semibold text-slate-800">{{ rest.opening_time }} - {{ rest.closing_time }} น.</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-500">เวลาเตรียมอาหาร:</span>
                    <span class="font-semibold text-slate-800">{{ rest.preparation_minutes }} นาที</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-500">ช่วงรอบเวลารับ:</span>
                    <span class="font-semibold text-brand-700">ทุกๆ {{ rest.slot_interval_minutes }} นาที</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-500">รับสูงสุดต่อรอบ:</span>
                    <span class="font-semibold text-slate-800">{{ rest.max_orders_per_slot }} ออร์เดอร์</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Action -->
            <div class="p-5 pt-0 border-t border-slate-100 mt-2">
              <button
                (click)="openEditModal(rest)"
                class="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                แก้ไขข้อมูลและการตั้งค่า
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Add/Edit Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div class="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200">
            <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 class="font-heading font-bold text-lg text-slate-900">
                {{ modalIsEdit ? 'แก้ไขข้อมูลร้านอาหาร' : 'เพิ่มร้านอาหารใหม่' }}
              </h3>
              <button (click)="showModal.set(false)" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form (ngSubmit)="saveRestaurant()" class="space-y-4 text-xs">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">ชื่อร้านอาหาร *</label>
                <input
                  type="text"
                  [(ngModel)]="formModel.name"
                  name="name"
                  required
                  placeholder="เช่น ข้าวมันไก่ได้เฮียช้าง"
                  class="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 focus:bg-white focus:border-brand-500"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">ประเภทอาหาร *</label>
                <input
                  type="text"
                  [(ngModel)]="formModel.cuisine_type"
                  name="cuisine_type"
                  required
                  placeholder="เช่น ข้าวมันไก่, อาหารตามสั่ง, ก๋วยเตี๋ยว"
                  class="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 focus:bg-white focus:border-brand-500"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">คำอธิบายรายละเอียดร้าน</label>
                <textarea
                  [(ngModel)]="formModel.description"
                  name="description"
                  rows="2"
                  placeholder="สูตรโบราณ ข้าวหอมมะลินุ่ม..."
                  class="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 focus:bg-white focus:border-brand-500"
                ></textarea>
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">URL รูปภาพหน้าร้าน</label>
                <input
                  type="url"
                  [(ngModel)]="formModel.image_url"
                  name="image_url"
                  placeholder="https://images.unsplash.com/..."
                  class="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 focus:bg-white focus:border-brand-500"
                />
                <label class="mt-2 flex cursor-pointer items-center gap-2 text-xs font-semibold text-brand-700">
                  <input type="file" accept="image/jpeg,image/png,image/webp" (change)="uploadImage($event)" [disabled]="uploadingImage()" class="max-w-full text-xs" />
                  {{ uploadingImage() ? 'กำลังอัปโหลด…' : 'หรือเลือกภาพจากเครื่อง (JPG, PNG, WEBP ไม่เกิน 5 MB)' }}
                </label>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">เวลาเปิดร้าน</label>
                  <input
                    type="time"
                    [(ngModel)]="formModel.opening_time"
                    name="opening_time"
                    class="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:border-brand-500"
                  />
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">เวลาปิดร้าน</label>
                  <input
                    type="time"
                    [(ngModel)]="formModel.closing_time"
                    name="closing_time"
                    class="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:border-brand-500"
                  />
                </div>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">เวลาเตรียม (นาที)</label>
                  <input
                    type="number"
                    [(ngModel)]="formModel.preparation_minutes"
                    name="preparation_minutes"
                    min="1"
                    class="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:border-brand-500"
                  />
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">ช่วงรอบ (นาที)</label>
                  <input
                    type="number"
                    [(ngModel)]="formModel.slot_interval_minutes"
                    name="slot_interval_minutes"
                    min="5"
                    step="5"
                    class="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:border-brand-500"
                  />
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">จำกัดต่อรอบ</label>
                  <input
                    type="number"
                    [(ngModel)]="formModel.max_orders_per_slot"
                    name="max_orders_per_slot"
                    min="1"
                    class="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white focus:border-brand-500"
                  />
                </div>
              </div>

              <div class="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isOpenCheck"
                  [(ngModel)]="formModel.is_open"
                  name="is_open"
                  class="w-4 h-4 text-brand-600 rounded"
                />
                <label for="isOpenCheck" class="font-semibold text-slate-800">เปิดให้บริการรับออร์เดอร์ตอนนี้</label>
              </div>

              <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  (click)="showModal.set(false)"
                  class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  class="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-md shadow-brand-500/20"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class RestaurantsManageComponent implements OnInit {
  restaurants = signal<Restaurant[]>([]);
  uploadingImage = signal(false);
  showModal = signal<boolean>(false);
  modalIsEdit: boolean = false;
  activeId: number | null = null;

  formModel: any = {
    name: '',
    cuisine_type: '',
    description: '',
    image_url: '',
    opening_time: '08:00',
    closing_time: '17:00',
    is_open: true,
    preparation_minutes: 15,
    slot_interval_minutes: 15,
    max_orders_per_slot: 10,
  };

  constructor(private apiService: ApiService, private toastService: ToastService) {}

  ngOnInit() {
    this.fetchRestaurants();
  }

  fetchRestaurants() {
    this.apiService.getAdminRestaurants().subscribe({
      next: (res) => {
        if (res.success) {
          this.restaurants.set(res.data);
        }
      },
    });
  }

  toggleStatus(rest: Restaurant) {
    this.apiService.toggleRestaurantStatus(rest.id).subscribe({
      next: (res) => {
        if (res.success) {
          rest.is_open = res.data.is_open;
          this.toastService.success(res.message || 'บันทึกสถานะเรียบร้อย');
        }
      },
    });
  }

  openAddModal() {
    this.modalIsEdit = false;
    this.activeId = null;
    this.formModel = {
      name: '',
      cuisine_type: '',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
      opening_time: '08:00',
      closing_time: '17:00',
      is_open: true,
      preparation_minutes: 15,
      slot_interval_minutes: 15,
      max_orders_per_slot: 10,
    };
    this.showModal.set(true);
  }

  openEditModal(rest: Restaurant) {
    this.modalIsEdit = true;
    this.activeId = rest.id;
    this.formModel = { ...rest };
    this.showModal.set(true);
  }

  saveRestaurant() {
    if (this.modalIsEdit && this.activeId) {
      this.apiService.updateRestaurant(this.activeId, this.formModel).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.success('อัปเดตร้านอาหารเรียบร้อยแล้ว');
            this.showModal.set(false);
            this.fetchRestaurants();
          }
        },
      });
    } else {
      this.apiService.createRestaurant(this.formModel).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.success('เพิ่มร้านอาหารเรียบร้อยแล้ว');
            this.showModal.set(false);
            this.fetchRestaurants();
          }
        },
      });
    }
  }

  uploadImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadingImage.set(true);
    this.apiService.uploadImage(file).subscribe({
      next: (res) => {
        this.formModel.image_url = res.data.image_url;
        this.toastService.success('อัปโหลดรูปภาพแล้ว กรุณาบันทึกข้อมูลร้าน');
        this.uploadingImage.set(false);
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'อัปโหลดรูปภาพไม่สำเร็จ');
        this.uploadingImage.set(false);
      },
    });
    input.value = '';
  }
}
