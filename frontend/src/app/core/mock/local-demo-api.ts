import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { catchError, defer, from, map, throwError } from 'rxjs';
import { isPagesApiMissing } from '../config/api-url';

const STORAGE_KEY = 'edu_food_pages_demo_v1';
const DEMO_ADMIN_PHONE = '0812345678';
const DEMO_ADMIN_PASSWORD = 'Admin@EduFood2026';
const ACTIVE_STATUSES = ['รอร้านรับออร์เดอร์', 'ร้านรับออร์เดอร์แล้ว', 'กำลังเตรียมอาหาร', 'พร้อมรับอาหาร'];

type DemoState = {
  restaurants: any[];
  categories: any[];
  items: any[];
  orders: any[];
  accounts: any[];
  nextRestaurantId: number;
  nextCategoryId: number;
  nextItemId: number;
  nextOrderId: number;
};

function initialState(): DemoState {
  const restaurants = [
    { id: 1, name: 'ข้าวมันไก่ได้เฮียช้าง', cuisine_type: 'ข้าวมันไก่', description: 'ข้าวมันไก่หอม ๆ ไก่ต้มเนื้อนุ่มและไก่ทอดกรอบ พร้อมน้ำจิ้มสูตรเด็ด', image_url: 'https://images.unsplash.com/photo-1741241857887-321f7fbcacf2?w=800&auto=format&fit=crop&q=80', opening_time: '07:30', closing_time: '16:00', is_open: true, preparation_minutes: 10, slot_interval_minutes: 15, max_orders_per_slot: 12 },
    { id: 2, name: 'ร้านก๋วยเตี๋ยวเกี๊ยวหมูแดง', cuisine_type: 'ก๋วยเตี๋ยว & เกี๊ยว', description: 'บะหมี่ไข่ เกี๊ยวหมู และหมูแดง เสิร์ฟพร้อมน้ำซุปหอมกลมกล่อม', image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80', opening_time: '08:00', closing_time: '17:00', is_open: true, preparation_minutes: 12, slot_interval_minutes: 15, max_orders_per_slot: 10 },
    { id: 3, name: 'ร้านอาหารตามสั่ง (ป้าสมร ตึกครุฯ)', cuisine_type: 'อาหารตามสั่ง', description: 'อาหารจานเดียวทำสดใหม่ เลือกเนื้อสัตว์และระดับความเผ็ดได้', image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop&q=80', opening_time: '08:00', closing_time: '18:00', is_open: true, preparation_minutes: 15, slot_interval_minutes: 15, max_orders_per_slot: 8 },
  ];
  const categories = [
    { id: 1, restaurant_id: 1, name: 'ข้าวมันไก่จานเดี่ยว', sort_order: 1 }, { id: 2, restaurant_id: 1, name: 'ไก่สับเปล่า & ซุป', sort_order: 2 },
    { id: 3, restaurant_id: 2, name: 'เมนูก๋วยเตี๋ยว & บะหมี่', sort_order: 1 }, { id: 4, restaurant_id: 2, name: 'เกี๊ยวและของทานเล่น', sort_order: 2 },
    { id: 5, restaurant_id: 3, name: 'อาหารจานเดียว', sort_order: 1 }, { id: 6, restaurant_id: 3, name: 'เมนูข้าว', sort_order: 2 },
  ];
  const simpleOptions = (name: string, values: string[]) => values.map((value, i) => ({ id: 0, option_name: name, option_value: value, additional_price: i > 0 && value.includes('พิเศษ') ? 15 : 0 }));
  const items = [
    { id: 1, restaurant_id: 1, category_id: 1, name: 'ข้าวมันไก่ต้ม', description: 'ข้าวมันหอม เสิร์ฟพร้อมไก่ตอนเนื้อนุ่ม น้ำจิ้มเต้าเจี้ยว และน้ำซุป', price: 50, image_url: restaurants[0].image_url, options: simpleOptions('ขนาดจาน', ['ธรรมดา', 'พิเศษ (+15 บาท)']) },
    { id: 2, restaurant_id: 1, category_id: 1, name: 'ข้าวมันไก่ทอด', description: 'ไก่ทอดกรอบนอกนุ่มในกับข้าวมันร้อน ๆ', price: 55, image_url: 'https://images.unsplash.com/photo-1567030422165-af7ea28f987c?w=600&auto=format&fit=crop&q=80', options: simpleOptions('ขนาดจาน', ['ธรรมดา', 'พิเศษ (+15 บาท)']) },
    { id: 3, restaurant_id: 1, category_id: 1, name: 'ข้าวมันไก่ผสม (ต้ม + ทอด)', description: 'อิ่มอร่อยทั้งไก่ต้มและไก่ทอดในจานเดียว', price: 60, image_url: restaurants[0].image_url, options: [] },
    { id: 4, restaurant_id: 1, category_id: 1, name: 'ข้าวมันไก่พิเศษ (จัมโบ้)', description: 'ไก่และข้าวเพิ่มพิเศษ อิ่มจุใจ', price: 70, image_url: restaurants[0].image_url, options: [] },
    { id: 5, restaurant_id: 1, category_id: 2, name: 'ซุปมะนาวดองไก่', description: 'น้ำซุปร้อน ๆ รสกลมกล่อม', price: 40, image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80', options: [] },
    { id: 6, restaurant_id: 2, category_id: 3, name: 'บะหมี่เกี๊ยวหมูแดง', description: 'บะหมี่ไข่ เกี๊ยวหมู และหมูแดง เสิร์ฟได้ทั้งน้ำและแห้ง', price: 60, image_url: restaurants[1].image_url, options: simpleOptions('รูปแบบ', ['น้ำซุปใส', 'แห้ง', 'ต้มยำ (+5 บาท)']) },
    { id: 7, restaurant_id: 2, category_id: 3, name: 'ก๋วยเตี๋ยวหมูแดง', description: 'หมูแดง ลูกชิ้น และน้ำซุปสูตรร้าน', price: 50, image_url: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=600&auto=format&fit=crop&q=80', options: simpleOptions('เลือกเส้น', ['เส้นเล็ก', 'เส้นใหญ่', 'หมี่ขาว', 'บะหมี่']) },
    { id: 8, restaurant_id: 2, category_id: 4, name: 'เกี๊ยวหมูแดงล้วน', description: 'เกี๊ยวหมูชิ้นโตพร้อมหมูแดง', price: 65, image_url: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600&auto=format&fit=crop&q=80', options: [] },
    { id: 9, restaurant_id: 2, category_id: 3, name: 'บะหมี่แห้งหมูแดงต้มยำ', description: 'บะหมี่คลุกซอสต้มยำ โรยหมูแดงและเครื่องแน่น', price: 60, image_url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80', options: [] },
    { id: 10, restaurant_id: 3, category_id: 5, name: 'ข้าวกะเพราหมูสับ', description: 'กะเพราผัดแห้งหอมกระทะ เลือกระดับความเผ็ดได้', price: 50, image_url: 'https://images.unsplash.com/photo-1669863329825-6e4e39ce752c?w=600&auto=format&fit=crop&q=80', options: simpleOptions('ระดับความเผ็ด', ['ไม่เผ็ด', 'เผ็ดน้อย', 'เผ็ดกลาง', 'เผ็ดมาก']) },
    { id: 11, restaurant_id: 3, category_id: 5, name: 'ข้าวคะน้าหมูกรอบ', description: 'หมูกรอบผัดคะน้าฮ่องกง', price: 65, image_url: 'https://images.unsplash.com/photo-1696906594893-e9995c4d7082?w=600&auto=format&fit=crop&q=80', options: [] },
    { id: 12, restaurant_id: 3, category_id: 5, name: 'ข้าวผัดพริกแกงหมูกรอบ', description: 'หมูกรอบผัดพริกแกงรสเข้มข้น', price: 65, image_url: 'https://images.unsplash.com/photo-1696906594893-e9995c4d7082?w=600&auto=format&fit=crop&q=80', options: [] },
    { id: 13, restaurant_id: 3, category_id: 6, name: 'ข้าวผัดหมู / ไก่', description: 'ข้าวผัดหอมกระทะ เลือกหมูหรือไก่ได้', price: 50, image_url: 'https://images.unsplash.com/photo-1768634003113-42903d7ffe1b?w=600&auto=format&fit=crop&q=80', options: simpleOptions('เลือกเนื้อสัตว์', ['หมู', 'ไก่']) },
    { id: 14, restaurant_id: 3, category_id: 6, name: 'ข้าวหมูกระเทียมพริกไทย', description: 'หมูผัดกระเทียมพริกไทยหอม ๆ', price: 55, image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80', options: [] },
    { id: 15, restaurant_id: 3, category_id: 6, name: 'ข้าวไข่เจียวทรงเครื่อง', description: 'ไข่เจียวร้อน ๆ เลือกหมูสับหรือกุ้งได้', price: 45, image_url: 'https://images.unsplash.com/photo-1629606600908-a51ec6c44fdd?w=600&auto=format&fit=crop&q=80', options: simpleOptions('เนื้อสัตว์ในไข่เจียว', ['หมูสับ', 'กุ้งสับ (+20 บาท)']) },
  ].map((item) => ({ ...item, description: item.description || '', is_available: true, options: item.options.map((option, i) => ({ ...option, id: item.id * 100 + i + 1 })) }));
  return { restaurants, categories, items, orders: [], accounts: [], nextRestaurantId: 4, nextCategoryId: 7, nextItemId: 16, nextOrderId: 1 };
}

function readState(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState;
      if (parsed.restaurants?.length && parsed.items?.length) return parsed;
    }
  } catch { /* create a clean local demo database if saved data is malformed */ }
  const seeded = initialState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveState(state: DemoState): void { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function success(data: any, message?: string): any { return { success: true, ...(message ? { message } : {}), data }; }
function publicRestaurant(restaurant: any): any {
  const { account_phone: _phone, ...safe } = restaurant;
  return { ...safe, is_open: Boolean(safe.is_open) };
}
function restaurantCounts(state: DemoState, restaurant: any): any {
  const account = state.accounts.find((item) => item.restaurant_id === restaurant.id);
  return { ...publicRestaurant(restaurant), account_phone: account?.phone || null, menu_count: state.items.filter((item) => item.restaurant_id === restaurant.id).length, active_orders_count: state.orders.filter((order) => order.restaurant_id === restaurant.id && ACTIVE_STATUSES.includes(order.status)).length };
}
function restaurantMenu(state: DemoState, id: number): any {
  const restaurant = state.restaurants.find((item) => item.id === id);
  if (!restaurant) throw { status: 404, message: 'ไม่พบร้านอาหารที่ระบุ' };
  return { restaurant: publicRestaurant(restaurant), categories: state.categories.filter((item) => item.restaurant_id === id).sort((a, b) => a.sort_order - b.sort_order), items: state.items.filter((item) => item.restaurant_id === id).map((item) => ({ ...item, price: Number(item.price), options: item.options || [] })) };
}
function fmtTime(minutes: number): string { return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`; }
function pickupSlots(state: DemoState, restaurant: any, date: string): any[] {
  const [openHour, openMinute] = restaurant.opening_time.split(':').map(Number);
  const [closeHour, closeMinute] = restaurant.closing_time.split(':').map(Number);
  const opening = openHour * 60 + openMinute;
  const closing = closeHour * 60 + closeMinute;
  const interval = Number(restaurant.slot_interval_minutes || 15);
  const maxOrders = Number(restaurant.max_orders_per_slot || 10);
  const today = new Date().toISOString().slice(0, 10);
  return Array.from({ length: Math.max(0, Math.ceil((closing - opening) / interval)) }, (_, i) => opening + i * interval)
    .filter((minute) => minute < closing)
    .map((minute) => {
      const time = fmtTime(minute);
      const reservedOrders = state.orders.filter((order) => order.restaurant_id === restaurant.id && order.pickup_date === date && order.pickup_time === time && order.status !== 'ยกเลิก').length;
      const remainingOrders = Math.max(0, maxOrders - reservedOrders);
      const isPast = date < today || (date === today && time <= new Date().toTimeString().slice(0, 5));
      const isAvailable = Boolean(restaurant.is_open) && !isPast && remainingOrders > 0;
      return { time, datetime: `${date}T${time}:00`, isAvailable, maxOrders, reservedOrders, remainingOrders, ...(!restaurant.is_open ? { reason: 'ร้านปิดรับออร์เดอร์' } : isPast ? { reason: 'เวลานี้ผ่านไปแล้ว' } : remainingOrders === 0 ? { reason: 'รอบนี้เต็มแล้ว' } : {}) };
    });
}
function orderWithRestaurant(state: DemoState, order: any): any {
  const restaurant = state.restaurants.find((item) => item.id === order.restaurant_id);
  return { ...order, restaurant_name: restaurant?.name || '', items: order.items || [] };
}
function orderDetail(state: DemoState, order: any): any {
  const restaurant = state.restaurants.find((item) => item.id === order.restaurant_id);
  return { order: { ...order, total: Number(order.total), subtotal: Number(order.subtotal) }, restaurant: publicRestaurant(restaurant), items: order.items || [], history: order.history || [] };
}
function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `EDU-${date}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
function matchOrderFilters(state: DemoState, params: URLSearchParams): any[] {
  let orders = [...state.orders];
  const restaurantId = params.get('restaurant_id');
  const status = params.get('status');
  const date = params.get('date');
  const search = params.get('search')?.toLowerCase().trim();
  if (restaurantId) orders = orders.filter((order) => order.restaurant_id === Number(restaurantId));
  if (status && status !== 'all') orders = orders.filter((order) => order.status === status);
  if (date) orders = orders.filter((order) => order.pickup_date === date);
  if (search) orders = orders.filter((order) => `${order.order_number} ${order.customer_name} ${order.customer_phone} ${order.restaurant_name}`.toLowerCase().includes(search));
  return orders.sort((a, b) => b.id - a.id).map(orderWithRestaurant.bind(null, state));
}

async function uploadedImage(request: HttpRequest<unknown>): Promise<string> {
  const form = request.body as FormData | null;
  const file = form?.get('image');
  if (!(file instanceof File)) throw { status: 400, message: 'กรุณาเลือกไฟล์ภาพ' };
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 1_000_000) throw { status: 400, message: 'โหมดเก็บข้อมูลในเบราว์เซอร์รองรับ JPG, PNG หรือ WEBP ไม่เกิน 1 MB' };
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject({ status: 400, message: 'อ่านไฟล์รูปภาพไม่สำเร็จ' });
    reader.readAsDataURL(file);
  });
}

async function handleRequest(request: HttpRequest<unknown>): Promise<any> {
  const url = new URL(request.url, window.location.origin);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const method = request.method.toUpperCase();
  const body: any = request.body || {};
  const state = readState();
  let match: RegExpMatchArray | null;

  if (method === 'GET' && path === '/api/health') return { status: 'healthy', mode: 'browser-demo' };
  if (method === 'GET' && path === '/api/restaurants') {
    let results = state.restaurants.filter((item) => item.is_open).map(publicRestaurant);
    const search = url.searchParams.get('search')?.toLowerCase().trim();
    const cuisine = url.searchParams.get('cuisine');
    if (search) results = results.filter((item) => `${item.name} ${item.description} ${item.cuisine_type}`.toLowerCase().includes(search));
    if (cuisine && cuisine !== 'all') results = results.filter((item) => item.cuisine_type === cuisine);
    return success(results);
  }
  if (method === 'GET' && (match = path.match(/^\/api\/restaurants\/(\d+)$/))) {
    const restaurant = state.restaurants.find((item) => item.id === Number(match![1]));
    if (!restaurant) throw { status: 404, message: 'ไม่พบร้านอาหารที่ระบุ' };
    return success(publicRestaurant(restaurant));
  }
  if (method === 'GET' && (match = path.match(/^\/api\/restaurants\/(\d+)\/menu$/))) return success(restaurantMenu(state, Number(match[1])));
  if (method === 'GET' && (match = path.match(/^\/api\/restaurants\/(\d+)\/pickup-slots$/))) {
    const restaurant = state.restaurants.find((item) => item.id === Number(match![1]));
    if (!restaurant) throw { status: 404, message: 'ไม่พบร้านอาหารที่ระบุ' };
    const date = url.searchParams.get('date') || new Date().toISOString().slice(0, 10);
    return success({ date, restaurant_id: restaurant.id, restaurant_name: restaurant.name, is_open: Boolean(restaurant.is_open), slots: pickupSlots(state, restaurant, date) });
  }

  if (method === 'POST' && path === '/api/orders') {
    const restaurant = state.restaurants.find((item) => item.id === Number(body.restaurant_id));
    if (!restaurant || !restaurant.is_open) throw { status: 400, message: 'ร้านนี้ปิดรับออร์เดอร์อยู่' };
    if (!body.customer_name?.trim() || !/^0\d{9}$/.test(String(body.customer_phone || '').replace(/[-\s]/g, '')) || !Array.isArray(body.items) || !body.items.length) throw { status: 400, message: 'กรุณาตรวจสอบชื่อ เบอร์โทรศัพท์ และรายการอาหาร' };
    const slot = pickupSlots(state, restaurant, body.pickup_date).find((item) => item.time === body.pickup_time);
    if (!slot?.isAvailable) throw { status: 400, message: slot?.reason || 'รอบเวลานี้ไม่ว่างแล้ว' };
    const items = body.items.map((line: any, index: number) => {
      const menuItem = state.items.find((item) => item.id === Number(line.menu_item_id) && item.restaurant_id === restaurant.id && item.is_available);
      if (!menuItem) throw { status: 400, message: 'มีรายการอาหารที่ไม่มีหรือหมดแล้ว กรุณาตรวจสอบตะกร้า' };
      const selected = Array.isArray(line.selected_options) ? line.selected_options : [];
      const optionPrice = selected.reduce((sum: number, option: any) => sum + Number(option.additional_price || 0), 0);
      const unitPrice = Number(menuItem.price) + optionPrice;
      const quantity = Math.max(1, Number(line.quantity || 1));
      return { id: index + 1, order_id: state.nextOrderId, menu_item_id: menuItem.id, menu_name_snapshot: menuItem.name, unit_price_snapshot: unitPrice, quantity, selected_options: selected, item_note: line.item_note || '', subtotal: unitPrice * quantity };
    });
    const subtotal = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    const order = { id: state.nextOrderId++, order_number: generateOrderNumber(), restaurant_id: restaurant.id, restaurant_name: restaurant.name, customer_name: body.customer_name.trim(), customer_phone: String(body.customer_phone).replace(/[-\s]/g, ''), pickup_date: body.pickup_date, pickup_time: body.pickup_time, pickup_datetime: `${body.pickup_date}T${body.pickup_time}:00`, subtotal, total: subtotal, note: body.note || '', status: 'รอร้านรับออร์เดอร์', cancel_reason: '', created_at: new Date().toISOString(), items, history: [{ id: 1, order_id: state.nextOrderId - 1, previous_status: null, new_status: 'รอร้านรับออร์เดอร์', changed_at: new Date().toISOString(), changed_by: 'ระบบทดลอง', note: '' }] };
    state.orders.push(order);
    try { saveState(state); } catch { throw { status: 507, message: 'พื้นที่จัดเก็บของเบราว์เซอร์เต็ม กรุณาลบข้อมูลเว็บไซต์แล้วลองใหม่' }; }
    return success({ order, items, restaurant: publicRestaurant(restaurant) }, 'สร้างคำสั่งซื้อสำเร็จ');
  }
  if (method === 'GET' && path === '/api/orders/track') {
    const order = state.orders.find((item) => item.order_number === url.searchParams.get('order_number')?.trim());
    if (!order) throw { status: 404, message: 'ไม่พบคำสั่งซื้อที่ตรงกับข้อมูล' };
    if (order.customer_phone !== String(url.searchParams.get('phone') || '').replace(/[-\s]/g, '')) throw { status: 403, message: 'เบอร์โทรศัพท์ไม่ตรงกับคำสั่งซื้อนี้' };
    return success(orderDetail(state, order));
  }

  if (method === 'POST' && path === '/api/admin/auth/login') {
    if (body.phone !== DEMO_ADMIN_PHONE || body.password !== DEMO_ADMIN_PASSWORD) throw { status: 401, message: 'โหมดทดลอง: ใช้เบอร์ 0812345678 และรหัสผ่าน Admin@EduFood2026' };
    return success({ token: 'pages-demo-admin', user: { id: 1, name: 'ผู้ดูแลระบบ (โหมดทดลอง)', phone: DEMO_ADMIN_PHONE, role: 'admin' } }, 'เข้าสู่ระบบโหมดทดลองสำเร็จ');
  }
  if (method === 'POST' && path === '/api/restaurant-portal/auth/login') {
    const account = state.accounts.find((item) => item.phone === String(body.phone || '').replace(/[-\s]/g, '') && item.password === body.password);
    if (!account) throw { status: 401, message: 'ไม่พบบัญชีร้านนี้ในเบราว์เซอร์นี้ กรุณาตั้งบัญชีผ่านหน้า Admin ก่อน' };
    const restaurant = state.restaurants.find((item) => item.id === account.restaurant_id);
    return success({ token: `pages-demo-shop-${restaurant.id}`, user: { id: 100 + restaurant.id, name: restaurant.name, phone: account.phone, role: 'restaurant', restaurant_id: restaurant.id, restaurant_name: restaurant.name } }, 'เข้าสู่ระบบร้านค้าสำเร็จ');
  }

  if (method === 'GET' && path === '/api/admin/dashboard') {
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = state.orders.filter((order) => order.pickup_date === today);
    const done = state.orders.filter((order) => order.status === 'รับอาหารแล้ว');
    const chartData = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(); date.setDate(date.getDate() - (6 - index));
      const key = date.toISOString().slice(0, 10); const dayOrders = state.orders.filter((order) => order.pickup_date === key);
      return { date: key, orders: dayOrders.length, revenue: dayOrders.filter((order) => order.status !== 'ยกเลิก').reduce((sum, order) => sum + order.total, 0) };
    });
    return success({ stats: { todayOrders: todayOrders.length, inProgressOrders: state.orders.filter((order) => ['รอร้านรับออร์เดอร์', 'ร้านรับออร์เดอร์แล้ว', 'กำลังเตรียมอาหาร'].includes(order.status)).length, readyOrders: state.orders.filter((order) => order.status === 'พร้อมรับอาหาร').length, totalRevenue: done.reduce((sum, order) => sum + order.total, 0), restaurantCount: state.restaurants.length }, chartData, recentOrders: [...state.orders].sort((a, b) => b.id - a.id).slice(0, 10).map(orderWithRestaurant.bind(null, state)) });
  }
  if (method === 'GET' && path === '/api/admin/restaurants') return success(state.restaurants.map((restaurant) => restaurantCounts(state, restaurant)));
  if (method === 'POST' && path === '/api/admin/restaurants') {
    const restaurant = { id: state.nextRestaurantId++, opening_time: '08:00', closing_time: '17:00', is_open: true, preparation_minutes: 15, slot_interval_minutes: 15, max_orders_per_slot: 10, ...body };
    state.restaurants.push(restaurant); saveState(state); return success(restaurantCounts(state, restaurant), 'เพิ่มร้านอาหารเรียบร้อยแล้ว');
  }
  if (method === 'PUT' && (match = path.match(/^\/api\/admin\/restaurants\/(\d+)$/))) {
    const restaurant = state.restaurants.find((item) => item.id === Number(match![1])); if (!restaurant) throw { status: 404, message: 'ไม่พบร้านอาหาร' };
    Object.assign(restaurant, body); saveState(state); return success(restaurantCounts(state, restaurant), 'อัปเดตข้อมูลร้านอาหารเรียบร้อยแล้ว');
  }
  if (method === 'PUT' && (match = path.match(/^\/api\/admin\/restaurants\/(\d+)\/account$/))) {
    const restaurantId = Number(match[1]); const account = state.accounts.find((item) => item.restaurant_id === restaurantId);
    const phone = String(body.phone || '').replace(/[-\s]/g, '');
    if (!/^0\d{9}$/.test(phone) || String(body.password || '').length < 8) throw { status: 400, message: 'กรุณากรอกเบอร์ 10 หลักและรหัสผ่านอย่างน้อย 8 ตัว' };
    if (state.accounts.some((item) => item.phone === phone && item !== account)) throw { status: 409, message: 'เบอร์โทรศัพท์นี้ถูกใช้กับร้านอื่นแล้ว' };
    const saved = { restaurant_id: restaurantId, phone, password: body.password };
    if (account) Object.assign(account, saved); else state.accounts.push(saved);
    saveState(state); return success({ restaurant_id: restaurantId, phone }, 'บันทึกบัญชีร้านแล้ว');
  }
  if (method === 'PATCH' && (match = path.match(/^\/api\/admin\/restaurants\/(\d+)\/status$/))) {
    const restaurant = state.restaurants.find((item) => item.id === Number(match![1])); if (!restaurant) throw { status: 404, message: 'ไม่พบร้านอาหาร' };
    restaurant.is_open = !restaurant.is_open; saveState(state); return success({ id: restaurant.id, is_open: restaurant.is_open }, restaurant.is_open ? 'เปิดร้านสำเร็จ' : 'ปิดร้านชั่วคราวสำเร็จ');
  }
  if (method === 'GET' && path === '/api/admin/categories') return success(state.categories.filter((item) => !url.searchParams.get('restaurant_id') || item.restaurant_id === Number(url.searchParams.get('restaurant_id'))));
  if (method === 'POST' && path === '/api/admin/categories') {
    const category = { id: state.nextCategoryId++, restaurant_id: Number(body.restaurant_id), name: body.name, sort_order: Number(body.sort_order || 0) };
    state.categories.push(category); saveState(state); return success(category);
  }
  if (method === 'GET' && (match = path.match(/^\/api\/admin\/restaurants\/(\d+)\/menu$/))) return success(restaurantMenu(state, Number(match[1])));
  if (method === 'POST' && (match = path.match(/^\/api\/admin\/restaurants\/(\d+)\/menu$/))) {
    const item = { id: state.nextItemId++, restaurant_id: Number(match[1]), category_id: body.category_id || null, name: body.name, description: body.description || '', price: Number(body.price), image_url: body.image_url || '', is_available: body.is_available !== false, options: body.options || [] };
    state.items.push(item); saveState(state); return success(item, 'เพิ่มรายการอาหารสำเร็จ');
  }
  if (method === 'PUT' && (match = path.match(/^\/api\/admin\/menu\/(\d+)$/))) {
    const item = state.items.find((entry) => entry.id === Number(match![1])); if (!item) throw { status: 404, message: 'ไม่พบรายการอาหาร' };
    Object.assign(item, body, { options: body.options || item.options }); saveState(state); return success(item, 'อัปเดตเมนูสำเร็จ');
  }
  if (method === 'PATCH' && (match = path.match(/^\/api\/admin\/menu\/(\d+)\/availability$/))) {
    const item = state.items.find((entry) => entry.id === Number(match![1])); if (!item) throw { status: 404, message: 'ไม่พบรายการอาหาร' };
    item.is_available = !item.is_available; saveState(state); return success({ id: item.id, is_available: item.is_available });
  }
  if (method === 'DELETE' && (match = path.match(/^\/api\/admin\/menu\/(\d+)$/))) {
    state.items = state.items.filter((item) => item.id !== Number(match![1])); saveState(state); return success(null, 'ลบรายการอาหารสำเร็จ');
  }
  if (method === 'POST' && path === '/api/admin/uploads') return success({ image_url: await uploadedImage(request) });
  if (method === 'GET' && path === '/api/admin/orders') return success(matchOrderFilters(state, url.searchParams));
  if (method === 'GET' && path === '/api/restaurant-portal/orders') {
    const account = state.accounts.find((item) => item.phone === localStorage.getItem('edu_food_restaurant_user_phone'));
    const restaurantId = account?.restaurant_id || Number(localStorage.getItem('edu_food_restaurant_id'));
    if (!restaurantId) throw { status: 401, message: 'กรุณาเข้าสู่ระบบร้านค้าใหม่' };
    const query = new URLSearchParams(url.searchParams); query.set('restaurant_id', String(restaurantId));
    return success(matchOrderFilters(state, query));
  }
  if (method === 'GET' && (match = path.match(/^\/api\/(?:admin|restaurant-portal)\/orders\/(\d+)$/))) {
    const order = state.orders.find((item) => item.id === Number(match![1])); if (!order) throw { status: 404, message: 'ไม่พบคำสั่งซื้อ' };
    return success(orderDetail(state, order));
  }
  if (method === 'PATCH' && (match = path.match(/^\/api\/(?:admin|restaurant-portal)\/orders\/(\d+)\/status$/))) {
    const order = state.orders.find((item) => item.id === Number(match![1])); if (!order) throw { status: 404, message: 'ไม่พบคำสั่งซื้อ' };
    if (body.status === 'ยกเลิก' && !String(body.cancel_reason || '').trim()) throw { status: 400, message: 'กรุณาระบุเหตุผลการยกเลิกคำสั่งซื้อ' };
    const previous = order.status; order.status = body.status;
    if (body.cancel_reason) order.cancel_reason = body.cancel_reason;
    order.history.push({ id: order.history.length + 1, order_id: order.id, previous_status: previous, new_status: order.status, changed_at: new Date().toISOString(), changed_by: 'ผู้ดูแล/ร้านค้าในเครื่องนี้', note: body.note || body.cancel_reason || '' });
    saveState(state); return success(order, `อัปเดตสถานะเป็น "${body.status}" เรียบร้อยแล้ว`);
  }
  throw { status: 404, message: `ไม่พบฟังก์ชันโหมดทดลอง: ${method} ${path}` };
}

export const localDemoApiInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isPagesApiMissing() || !new URL(request.url, window.location.origin).pathname.startsWith('/api/')) return next(request);
  return defer(() => from(handleRequest(request))).pipe(
    map((body) => new HttpResponse({ status: 200, body })),
    catchError((error: any) => throwError(() => error instanceof HttpErrorResponse ? error : new HttpErrorResponse({ status: error?.status || 400, statusText: error?.message || 'Local demo error', error: { success: false, message: error?.message || 'เกิดข้อผิดพลาดในโหมดทดลอง' }, url: request.url })))
  );
};
