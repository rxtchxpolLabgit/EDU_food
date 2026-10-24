import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderStatus } from '../../../core/models/food.models';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shadow-xs transition"
      [ngClass]="getBadgeClass()"
    >
      <span class="w-2 h-2 rounded-full" [ngClass]="getDotClass()"></span>
      {{ status }}
    </span>
  `,
})
export class StatusBadgeComponent {
  @Input() status: OrderStatus | string = 'รอร้านรับออร์เดอร์';

  getBadgeClass(): string {
    switch (this.status) {
      case 'รอร้านรับออร์เดอร์':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'ร้านรับออร์เดอร์แล้ว':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'กำลังเตรียมอาหาร':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'พร้อมรับอาหาร':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400/20';
      case 'รับอาหารแล้ว':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'ยกเลิก':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  getDotClass(): string {
    switch (this.status) {
      case 'รอร้านรับออร์เดอร์':
        return 'bg-amber-500 animate-pulse';
      case 'ร้านรับออร์เดอร์แล้ว':
        return 'bg-sky-500';
      case 'กำลังเตรียมอาหาร':
        return 'bg-indigo-500 animate-pulse';
      case 'พร้อมรับอาหาร':
        return 'bg-emerald-500 animate-ping';
      case 'รับอาหารแล้ว':
        return 'bg-slate-400';
      case 'ยกเลิก':
        return 'bg-rose-500';
      default:
        return 'bg-slate-400';
    }
  }
}
