export interface Restaurant {
  id: number;
  name: string;
  cuisine_type: string;
  description: string;
  image_url: string;
  opening_time: string;
  closing_time: string;
  is_open: boolean;
  preparation_minutes: number;
  slot_interval_minutes: number;
  max_orders_per_slot: number;
  menu_count?: number;
  active_orders_count?: number;
}

export interface MenuCategory {
  id: number;
  restaurant_id: number;
  name: string;
  sort_order: number;
}

export interface MenuOption {
  id?: number;
  option_name: string;
  option_value: string;
  additional_price: number;
}

export interface MenuItem {
  id: number;
  restaurant_id: number;
  category_id?: number | null;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  options?: MenuOption[];
}

export interface CartItemOption {
  option_id?: number;
  option_name: string;
  option_value: string;
  additional_price: number;
}

export interface CartItem {
  id: string; // unique cart item key
  menu_item_id: number;
  name: string;
  base_price: number;
  unit_price: number;
  quantity: number;
  image_url: string;
  selected_options: CartItemOption[];
  item_note?: string;
  subtotal: number;
}

export interface PickupSlot {
  time: string;
  datetime: string;
  isAvailable: boolean;
  maxOrders: number;
  reservedOrders: number;
  remainingOrders: number;
  reason?: string;
}

export interface OrderItem {
  id?: number;
  menu_item_id: number;
  menu_name_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  selected_options: CartItemOption[];
  item_note?: string;
  subtotal: number;
}

export interface OrderStatusHistory {
  id: number;
  order_id: number;
  previous_status: string | null;
  new_status: string;
  changed_at: string;
  changed_by: string;
  note?: string;
}

export type OrderStatus =
  | 'รอร้านรับออร์เดอร์'
  | 'ร้านรับออร์เดอร์แล้ว'
  | 'กำลังเตรียมอาหาร'
  | 'พร้อมรับอาหาร'
  | 'รับอาหารแล้ว'
  | 'ยกเลิก';

export interface Order {
  id: number;
  order_number: string;
  restaurant_id: number;
  restaurant_name?: string;
  customer_name: string;
  customer_phone: string;
  pickup_date: string;
  pickup_time: string;
  pickup_datetime: string;
  subtotal: number;
  total: number;
  note?: string;
  status: OrderStatus;
  cancel_reason?: string;
  created_at: string;
  items?: OrderItem[];
  history?: OrderStatusHistory[];
}

export interface DashboardData {
  stats: {
    todayOrders: number;
    inProgressOrders: number;
    readyOrders: number;
    totalRevenue: number;
    restaurantCount: number;
  };
  chartData: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  recentOrders: Order[];
}
