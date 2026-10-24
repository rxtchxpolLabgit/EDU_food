import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="mt-auto bg-slate-900 text-slate-400 border-t border-slate-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Col 1 -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <div class="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold">
                EDU
              </div>
              <span class="font-heading font-bold text-lg text-white">EDU Food Order</span>
            </div>
            <p class="text-xs leading-relaxed text-slate-400">
              ระบบสั่งอาหารออนไลน์ ตึกครุศาสตร์ สั่งง่าย รับไว ไม่ต้องรอคิว พัฒนาเพื่ออำนวยความสะดวกแก่นักศึกษา อาจารย์ และบุคลากรภายในมหาวิทยาลัย
            </p>
            <div class="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs font-medium">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              เปิดให้บริการทุกวันทำการ 07:30 - 18:00 น.
            </div>
          </div>

          <!-- Col 2 -->
          <div>
            <h4 class="font-heading font-semibold text-sm text-white mb-3">ร้านอาหารแนะนำ</h4>
            <ul class="space-y-2 text-xs">
              <li class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                <span>ข้าวมันไก่ได้เฮียช้าง (ไก่ตอนสูตรไหหลำ)</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                <span>ร้านก๋วยเตี๋ยวเกี๊ยวหมูแดง (เส้นสดทำเอง)</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                <span>ร้านอาหารตามสั่ง (ป้าสมร ตึกครุฯ)</span>
              </li>
            </ul>
          </div>

          <!-- Col 3 -->
          <div>
            <h4 class="font-heading font-semibold text-sm text-white mb-3">เมนูลัด</h4>
            <div class="flex flex-col space-y-2 text-xs">
              <a routerLink="/" class="hover:text-white transition">หน้าหลักสั่งอาหาร</a>
              <a routerLink="/track" class="hover:text-white transition">ตรวจสอบสถานะคำสั่งซื้อ</a>
              <a routerLink="/shop/login" class="hover:text-white transition">เข้าสู่ระบบร้านค้าเพื่อรับออร์เดอร์</a>
              <a routerLink="/admin/login" class="hover:text-white transition">เข้าสู่ระบบผู้ดูแล (Admin)</a>
            </div>
          </div>
        </div>

        <div class="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 EDU Food Order — ตึกครุศาสตร์. สงวนลิขสิทธิ์ทั้งหมด.</p>
          <p class="mt-2 sm:mt-0">ระบบสาธิตสำหรับการสั่งอาหารล่วงหน้าภายในมหาวิทยาลัย</p>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {}
