import { Injectable, signal, computed } from '@angular/core';
import { CartItem, CartItemOption } from '../models/food.models';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private storageKey = 'edu_food_cart_data';

  restaurantId = signal<number | null>(null);
  restaurantName = signal<string | null>(null);
  items = signal<CartItem[]>([]);
  orderNote = signal<string>('');

  itemCount = computed(() => {
    return this.items().reduce((sum, item) => sum + item.quantity, 0);
  });

  totalAmount = computed(() => {
    return this.items().reduce((sum, item) => sum + item.subtotal, 0);
  });

  hasItems = computed(() => this.items().length > 0);

  constructor(private toastService: ToastService) {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.restaurantId.set(parsed.restaurantId || null);
          this.restaurantName.set(parsed.restaurantName || null);
          this.items.set(parsed.items || []);
          this.orderNote.set(parsed.orderNote || '');
        } catch (e) {
          console.error('Failed to parse cart storage', e);
          this.clearCart();
        }
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      const data = {
        restaurantId: this.restaurantId(),
        restaurantName: this.restaurantName(),
        items: this.items(),
        orderNote: this.orderNote(),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    }
  }

  /**
   * Adds an item to the cart. If from a different restaurant, returns a confirmation request.
   */
  addItem(
    restaurant: { id: number; name: string },
    item: {
      id: number;
      name: string;
      price: number;
      image_url: string;
    },
    quantity: number,
    selectedOptions: CartItemOption[],
    itemNote?: string
  ): { success: boolean; needsConfirmation?: boolean; currentRestaurant?: string } {
    const currentRestId = this.restaurantId();

    // Check if cart has items from another restaurant
    if (currentRestId && currentRestId !== restaurant.id && this.items().length > 0) {
      return {
        success: false,
        needsConfirmation: true,
        currentRestaurant: this.restaurantName() || 'ร้านก่อนหน้า',
      };
    }

    // Set restaurant
    this.restaurantId.set(restaurant.id);
    this.restaurantName.set(restaurant.name);

    // Calculate item unit price = base_price + sum of addons
    const addonsTotal = selectedOptions.reduce((sum, opt) => sum + Number(opt.additional_price || 0), 0);
    const unitPrice = Number(item.price) + addonsTotal;
    const subtotal = unitPrice * quantity;

    // Generate unique key for this combination of item + options + note
    const optionsHash = selectedOptions.map((o) => `${o.option_name}:${o.option_value}`).sort().join('|');
    const cartItemId = `${item.id}-${optionsHash}-${itemNote || ''}`;

    const currentItems = [...this.items()];
    const existingIndex = currentItems.findIndex((ci) => ci.id === cartItemId);

    if (existingIndex > -1) {
      currentItems[existingIndex].quantity += quantity;
      currentItems[existingIndex].subtotal = currentItems[existingIndex].quantity * currentItems[existingIndex].unit_price;
    } else {
      currentItems.push({
        id: cartItemId,
        menu_item_id: item.id,
        name: item.name,
        base_price: Number(item.price),
        unit_price: unitPrice,
        quantity: quantity,
        image_url: item.image_url,
        selected_options: selectedOptions,
        item_note: itemNote,
        subtotal: subtotal,
      });
    }

    this.items.set(currentItems);
    this.saveToStorage();
    this.toastService.success(`เพิ่ม "${item.name}" ลงในตะกร้าแล้ว`);

    return { success: true };
  }

  updateQuantity(cartItemId: string, change: number) {
    const currentItems = [...this.items()];
    const index = currentItems.findIndex((ci) => ci.id === cartItemId);

    if (index > -1) {
      const newQty = currentItems[index].quantity + change;
      if (newQty <= 0) {
        this.removeItem(cartItemId);
        return;
      }
      currentItems[index].quantity = newQty;
      currentItems[index].subtotal = currentItems[index].quantity * currentItems[index].unit_price;
      this.items.set(currentItems);
      this.saveToStorage();
    }
  }

  removeItem(cartItemId: string) {
    const item = this.items().find((i) => i.id === cartItemId);
    const filtered = this.items().filter((i) => i.id !== cartItemId);
    this.items.set(filtered);

    if (filtered.length === 0) {
      this.clearCart();
    } else {
      this.saveToStorage();
    }

    if (item) {
      this.toastService.info(`ลบ "${item.name}" ออกจากตะกร้าแล้ว`);
    }
  }

  setOrderNote(note: string) {
    this.orderNote.set(note);
    this.saveToStorage();
  }

  clearCart() {
    this.restaurantId.set(null);
    this.restaurantName.set(null);
    this.items.set([]);
    this.orderNote.set('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }
}
