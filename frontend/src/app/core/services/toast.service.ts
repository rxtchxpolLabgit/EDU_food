import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  toasts = signal<ToastMessage[]>([]);

  show(type: 'success' | 'error' | 'info', message: string, title?: string, duration: number = 3500) {
    const id = Date.now() + Math.random();
    const newToast: ToastMessage = { id, type, title, message };
    this.toasts.update((current) => [...current, newToast]);

    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  success(message: string, title: string = 'สำเร็จ') {
    this.show('success', message, title);
  }

  error(message: string, title: string = 'เกิดข้อผิดพลาด') {
    this.show('error', message, title, 4500);
  }

  info(message: string, title: string = 'แจ้งเตือน') {
    this.show('info', message, title);
  }

  remove(id: number) {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
