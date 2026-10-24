import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Restaurant } from '../../../core/models/food.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div>
      <!-- Hero Banner -->
      <section class="relative bg-gradient-to-b from-orange-100/70 via-cream-100 to-cream-50 pt-10 pb-14 border-b border-orange-100/60 overflow-hidden">
        <div class="absolute inset-0 opacity-15 pointer-events-none">
          <div class="absolute -top-12 -right-12 w-96 h-96 rounded-full bg-brand-400 blur-3xl"></div>
          <div class="absolute bottom-0 -left-12 w-80 h-80 rounded-full bg-amber-300 blur-2xl"></div>
        </div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div class="max-w-3xl text-center mx-auto">
            <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 border border-brand-200 text-brand-700 text-xs font-semibold mb-3">
              <span class="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
              ศูนย์อาหารตึกครุศาสตร์ มหาวิทยาลัย
            </span>
            <h1 class="text-3xl sm:text-5xl font-heading font-extrabold text-slate-900 tracking-tight leading-tight">
              สั่งง่าย รับไว <span class="text-brand-600 underline decoration-brand-300 decoration-wavy">ไม่ต้องรอคิว</span>
            </h1>
            <p class="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
              เลือกร้านโปรด สั่งอาหารล่วงหน้า และกำหนดเวลารับได้ตามรอบเวลาเรียน ลดเวลาแออัดในชั่วโมงเร่งด่วน พร้อมรับประทานได้ทันที
            </p>

            <!-- Search Bar -->
            <div class="mt-7 max-w-xl mx-auto flex items-center bg-white p-2 rounded-2xl shadow-lg shadow-orange-950/5 border border-orange-100">
              <div class="pl-3 text-slate-400">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <input
                type="text"
                [(ngModel)]="searchKeyword"
                (ngModelChange)="filterRestaurants()"
                placeholder="ค้นหาร้านอาหาร หรือประเภทอาหาร..."
                class="w-full px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              @if (searchKeyword) {
                <button
                  (click)="searchKeyword = ''; filterRestaurants()"
                  class="px-2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ล้าง
                </button>
              }
            </div>

            <!-- Cuisine Quick Filters -->
            <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
              @for (cat of cuisineCategories; track cat.id) {
                <button
                  (click)="selectCuisine(cat.id)"
                  class="px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer"
                  [ngClass]="{
                    'bg-brand-600 text-white shadow-sm shadow-brand-500/30': selectedCuisine === cat.id,
                    'bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80': selectedCuisine !== cat.id
                  }"
                >
                  {{ cat.name }}
                </button>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- Restaurants Section -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl sm:text-2xl font-heading font-bold text-slate-900">ร้านอาหารทั้งหมด</h2>
            <p class="text-xs text-slate-500 mt-0.5">เลือกร้านเพื่อดูรายการเมนูและสั่งอาหารล่วงหน้า</p>
          </div>
          <span class="text-xs text-slate-500 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            พบ {{ filteredRestaurants().length }} ร้าน
          </span>
        </div>

        <!-- Loading State -->
        @if (isLoading()) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (i of [1, 2, 3]; track i) {
              <div class="bg-white rounded-2xl p-4 border border-orange-100 animate-pulse space-y-4">
                <div class="h-48 bg-slate-200 rounded-xl"></div>
                <div class="h-5 bg-slate-200 rounded w-2/3"></div>
                <div class="h-4 bg-slate-200 rounded w-full"></div>
                <div class="h-10 bg-slate-200 rounded-xl"></div>
              </div>
            }
          </div>
        }

        <!-- Empty State -->
        @if (!isLoading() && filteredRestaurants().length === 0) {
          <div class="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200 max-w-md mx-auto">
            <div class="w-16 h-16 mx-auto rounded-full bg-orange-50 flex items-center justify-center text-brand-500 mb-3">
              <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
            </div>
            <h3 class="font-heading font-bold text-slate-800 text-base">ไม่พบร้านอาหารที่ค้นหา</h3>
            <p class="text-xs text-slate-500 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นดูนะ</p>
            <button
              (click)="resetFilters()"
              class="mt-4 px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition"
            >
              แสดงร้านทั้งหมด
            </button>
          </div>
        }

        <!-- Restaurants Grid -->
        @if (!isLoading() && filteredRestaurants().length > 0) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (rest of filteredRestaurants(); track rest.id) {
              <div class="bg-white rounded-2xl overflow-hidden border border-orange-100/80 shadow-xs hover:shadow-xl hover:shadow-orange-950/5 hover:-translate-y-1 transition duration-300 flex flex-col group">
                <!-- Cover Image & Status Badge -->
                <div class="relative h-48 overflow-hidden bg-slate-100">
                  <img
                    [src]="rest.image_url"
                    [alt]="rest.name"
                    class="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />
                  <!-- Cuisine Pill -->
                  <div class="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span>🍲</span>
                    <span>{{ rest.cuisine_type }}</span>
                  </div>

                  <!-- Open/Closed Status Badge -->
                  <div class="absolute top-3 right-3">
                    @if (rest.is_open) {
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/90 backdrop-blur-md text-white shadow-xs">
                        <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                        เปิดให้บริการ
                      </span>
                    } @else {
                      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-700/90 backdrop-blur-md text-white shadow-xs">
                        ปิดชั่วคราว
                      </span>
                    }
                  </div>
                </div>

                <!-- Info Body -->
                <div class="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 class="font-heading font-bold text-lg text-slate-900 group-hover:text-brand-600 transition">
                      {{ rest.name }}
                    </h3>
                    <p class="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {{ rest.description }}
                    </p>
                  </div>

                  <div class="mt-4 pt-4 border-t border-slate-100">
                    <!-- Hours and prep time -->
                    <div class="flex items-center justify-between text-xs text-slate-500 mb-4">
                      <div class="flex items-center gap-1">
                        <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span>{{ rest.opening_time }} - {{ rest.closing_time }} น.</span>
                      </div>
                      <div class="flex items-center gap-1 text-brand-600 font-medium">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                        <span>เตรียม ~{{ rest.preparation_minutes }} นาที</span>
                      </div>
                    </div>

                    <!-- Action Button -->
                    <a
                      [routerLink]="['/restaurant', rest.id]"
                      class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition"
                      [ngClass]="{
                        'bg-brand-500 hover:bg-brand-600 text-white shadow-sm shadow-brand-500/25': rest.is_open,
                        'bg-slate-100 text-slate-400 hover:bg-slate-200 cursor-not-allowed': !rest.is_open
                      }"
                    >
                      <span>{{ rest.is_open ? 'ดูเมนูอาหาร' : 'ร้านปิดให้บริการ' }}</span>
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </section>
    </div>
  `,
})
export class HomeComponent implements OnInit {
  restaurants = signal<Restaurant[]>([]);
  filteredRestaurants = signal<Restaurant[]>([]);
  isLoading = signal<boolean>(true);

  searchKeyword: string = '';
  selectedCuisine: string = 'all';

  cuisineCategories = [
    { id: 'all', name: 'ทั้งหมด' },
    { id: 'ข้าวมันไก่', name: 'ข้าวมันไก่' },
    { id: 'ก๋วยเตี๋ยวและเกี๊ยวหมูแดง', name: 'ก๋วยเตี๋ยว & เกี๊ยว' },
    { id: 'อาหารตามสั่ง', name: 'อาหารตามสั่ง' },
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.fetchRestaurants();
  }

  fetchRestaurants() {
    this.isLoading.set(true);
    this.apiService.getRestaurants().subscribe({
      next: (res) => {
        if (res.success) {
          this.restaurants.set(res.data);
          this.filteredRestaurants.set(res.data);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  selectCuisine(cuisineId: string) {
    this.selectedCuisine = cuisineId;
    this.filterRestaurants();
  }

  filterRestaurants() {
    let list = this.restaurants();

    if (this.selectedCuisine !== 'all') {
      list = list.filter((r) => r.cuisine_type === this.selectedCuisine);
    }

    if (this.searchKeyword.trim()) {
      const q = this.searchKeyword.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.cuisine_type.toLowerCase().includes(q)
      );
    }

    this.filteredRestaurants.set(list);
  }

  resetFilters() {
    this.searchKeyword = '';
    this.selectedCuisine = 'all';
    this.filteredRestaurants.set(this.restaurants());
  }
}
