import { Knex } from 'knex';
import { db } from '../db/knex';

export interface PickupSlotInfo {
  time: string; // HH:MM
  datetime: string; // ISO string
  isAvailable: boolean;
  maxOrders: number;
  reservedOrders: number;
  remainingOrders: number;
  reason?: string;
}

export function isValidPickupTime(
  restaurant: any,
  slotDate: string,
  slotTime: string,
  now = new Date()
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(slotDate) || !/^\d{2}:\d{2}$/.test(slotTime)) return false;
  const parsedDate = new Date(`${slotDate}T00:00:00Z`);
  if (!Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== slotDate) return false;
  const pickup = new Date(`${slotDate}T${slotTime}:00+07:00`);
  if (!Number.isFinite(pickup.getTime()) || pickup.getTime() <= now.getTime()) return false;

  const [hour, minute] = slotTime.split(':').map(Number);
  if (hour > 23 || minute > 59) return false;
  const interval = Number(restaurant.slot_interval_minutes) || 15;
  const [openHour, openMinute] = String(restaurant.opening_time || '08:00').split(':').map(Number);
  const [closeHour, closeMinute] = String(restaurant.closing_time || '17:00').split(':').map(Number);
  const slotMinutes = hour * 60 + minute;
  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;
  if (slotMinutes < openMinutes || slotMinutes + interval > closeMinutes || (slotMinutes - openMinutes) % interval !== 0) return false;

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const current = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const today = `${current.year}-${current.month}-${current.day}`;
  const currentMinutes = Number(current.hour) * 60 + Number(current.minute);
  return slotDate > today || (slotDate === today && slotMinutes >= currentMinutes + (Number(restaurant.preparation_minutes) || 15));
}

/**
 * Generates slot times in HH:MM format between opening and closing time
 */
export function generateTimeIntervals(
  openTime: string,
  closeTime: string,
  intervalMinutes: number
): string[] {
  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);

  const startTotalMinutes = openHour * 60 + openMin;
  const endTotalMinutes = closeHour * 60 + closeMin;

  const slots: string[] = [];
  for (let m = startTotalMinutes; m <= endTotalMinutes - intervalMinutes; m += intervalMinutes) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}

/**
 * Get all pickup slots for a restaurant on a specific date (YYYY-MM-DD)
 */
export async function getAvailableSlots(
  restaurantId: number,
  slotDate: string
): Promise<{ restaurant: any; slots: PickupSlotInfo[] }> {
  const restaurant = await db('restaurants').where({ id: restaurantId }).first();
  if (!restaurant) {
    throw new Error('ไม่พบข้อมูลร้านอาหาร');
  }

  if (!restaurant.is_open) {
    return {
      restaurant,
      slots: [],
    };
  }

  const interval = restaurant.slot_interval_minutes || 15;
  const maxPerSlot = restaurant.max_orders_per_slot || 10;
  const prepMinutes = restaurant.preparation_minutes || 15;

  const times = generateTimeIntervals(
    restaurant.opening_time || '08:00',
    restaurant.closing_time || '17:00',
    interval
  );

  // Fetch reserved counts from DB for this date
  const reservedSlots = await db('restaurant_pickup_slots')
    .where({ restaurant_id: restaurantId, slot_date: slotDate });

  const reservedMap = new Map<string, { reserved: number; max: number }>();
  for (const s of reservedSlots) {
    reservedMap.set(s.slot_time, { reserved: s.reserved_orders, max: s.max_orders });
  }

  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const current = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const todayStr = `${current.year}-${current.month}-${current.day}`;
  const currentMinutesFromMidnight = Number(current.hour) * 60 + Number(current.minute);
  const isToday = slotDate === todayStr;
  const isPastDate = slotDate < todayStr;

  const slots: PickupSlotInfo[] = times.map((t) => {
    const [h, m] = t.split(':').map(Number);
    const slotTotalMinutes = h * 60 + m;
    const slotDateObj = new Date(`${slotDate}T${t}:00+07:00`);

    const reservedData = reservedMap.get(t);
    const reservedOrders = reservedData ? reservedData.reserved : 0;
    const maxOrders = reservedData ? reservedData.max : maxPerSlot;
    const remainingOrders = Math.max(0, maxOrders - reservedOrders);

    let isAvailable = true;
    let reason: string | undefined;

    if (isPastDate) {
      isAvailable = false;
      reason = 'วันที่ผ่านมาแล้ว';
    } else if (isToday && slotTotalMinutes < currentMinutesFromMidnight + prepMinutes) {
      isAvailable = false;
      reason = 'เลยเวลารอบรับอาหารแล้ว หรือเวลาเตรียมอาหารไม่เพียงพอ';
    } else if (remainingOrders <= 0) {
      isAvailable = false;
      reason = 'คิวรับอาหารในช่วงเวลานี้เต็มแล้ว';
    }

    return {
      time: t,
      datetime: slotDateObj.toISOString(),
      isAvailable,
      maxOrders,
      reservedOrders,
      remainingOrders,
      reason,
    };
  });

  return { restaurant, slots };
}

/**
 * Reserve slot atomically within a transaction
 */
export async function reservePickupSlot(
  trx: Knex.Transaction,
  restaurantId: number,
  slotDate: string,
  slotTime: string,
  maxOrdersPerSlot: number
): Promise<void> {
  const pickupDatetime = new Date(`${slotDate}T${slotTime}:00+07:00`);
  await trx('restaurant_pickup_slots').insert({
    restaurant_id: restaurantId,
    slot_date: slotDate,
    slot_time: slotTime,
    pickup_datetime: pickupDatetime,
    max_orders: maxOrdersPerSlot,
    reserved_orders: 0,
  }).onConflict(['restaurant_id', 'slot_date', 'slot_time']).ignore();

  const reserved = await trx('restaurant_pickup_slots')
    .where({ restaurant_id: restaurantId, slot_date: slotDate, slot_time: slotTime })
    .whereRaw('reserved_orders < max_orders')
    .update({ reserved_orders: trx.raw('reserved_orders + 1') });
  if (!reserved) throw new Error(`ช่วงเวลารับอาหาร ${slotTime} เต็มแล้ว กรุณาเลือกรอบเวลาอื่น`);
}
