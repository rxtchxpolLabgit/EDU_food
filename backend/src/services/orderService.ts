import { db } from '../db/knex';
import { isValidPickupTime, reservePickupSlot } from './slotService';

export interface CreateOrderItemInput {
  menu_item_id: number;
  quantity: number;
  selected_options?: Array<{
    option_id?: number;
    option_name: string;
    option_value: string;
    additional_price?: number;
  }>;
  item_note?: string;
}

export interface CreateOrderInput {
  restaurant_id: number;
  customer_name: string;
  customer_phone: string;
  pickup_date: string; // YYYY-MM-DD
  pickup_time: string; // HH:MM
  note?: string;
  items: CreateOrderItemInput[];
}

/**
 * Generate a unique, friendly order number (e.g., EDU-20261024-8F3K)
 */
export function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `EDU-${dateStr}-${randomPart}`;
}

export async function createOrder(input: CreateOrderInput) {
  const { restaurant_id, customer_name, customer_phone, pickup_date, pickup_time, note, items } = input;

  return await db.transaction(async (trx) => {
    // 1. Verify restaurant
    const restaurant = await trx('restaurants').where({ id: restaurant_id }).first();
    if (!restaurant) {
      throw new Error('ไม่พบข้อมูลร้านอาหาร');
    }
    if (!restaurant.is_open) {
      throw new Error('ร้านอาหารปิดให้บริการในขณะนี้ ไม่สามารถสั่งอาหารได้');
    }
    if (!isValidPickupTime(restaurant, pickup_date, pickup_time)) {
      throw new Error('เวลารับอาหารไม่ถูกต้อง หมดเวลาแล้ว หรืออยู่นอกเวลาทำการของร้าน');
    }

    // 2. Reserve pickup slot atomically
    const maxOrdersPerSlot = restaurant.max_orders_per_slot || 10;
    await reservePickupSlot(trx, restaurant_id, pickup_date, pickup_time, maxOrdersPerSlot);

    // 3. Calculate prices server-side from Database
    let orderSubtotal = 0;
    const verifiedOrderItems: any[] = [];

    for (const item of items) {
      const menuItem = await trx('menu_items')
        .where({ id: item.menu_item_id, restaurant_id: restaurant_id })
        .first();

      if (!menuItem) {
        throw new Error(`ไม่พบรายการอาหารรหัส #${item.menu_item_id} ในร้านนี้`);
      }

      if (!menuItem.is_available) {
        throw new Error(`รายการอาหาร "${menuItem.name}" หมดชั่วคราว`);
      }

      const basePrice = Number(menuItem.price);
      let optionsTotalAdditional = 0;
      const verifiedOptions: any[] = [];

      if (Array.isArray(item.selected_options) && item.selected_options.length > 0) {
        // Query available options from DB
        const dbOptions = await trx('menu_options').where({ menu_item_id: menuItem.id });

        for (const selOpt of item.selected_options) {
          // Match by ID or by option_name & option_value
          const matchedDbOption = dbOptions.find(
            (o) =>
              (selOpt.option_id && o.id === selOpt.option_id) ||
              (o.option_name === selOpt.option_name && o.option_value === selOpt.option_value)
          );

          if (!matchedDbOption) throw new Error(`ตัวเลือกของเมนู "${menuItem.name}" ไม่ถูกต้อง`);
          if (verifiedOptions.some((option) => option.option_name === matchedDbOption.option_name)) {
            throw new Error(`เลือกตัวเลือก "${matchedDbOption.option_name}" ซ้ำกันไม่ได้`);
          }
          const addPrice = Number(matchedDbOption.additional_price || 0);
          optionsTotalAdditional += addPrice;
          verifiedOptions.push({
            option_id: matchedDbOption.id,
            option_name: matchedDbOption.option_name,
            option_value: matchedDbOption.option_value,
            additional_price: addPrice,
          });
        }
      }

      const unitPrice = basePrice + optionsTotalAdditional;
      const quantity = item.quantity;
      const itemSubtotal = unitPrice * quantity;
      orderSubtotal += itemSubtotal;

      verifiedOrderItems.push({
        menu_item_id: menuItem.id,
        menu_name_snapshot: menuItem.name,
        unit_price_snapshot: unitPrice,
        quantity: quantity,
        selected_options: JSON.stringify(verifiedOptions),
        item_note: item.item_note || '',
        subtotal: itemSubtotal,
      });
    }

    const orderTotal = orderSubtotal;
    const orderNumber = generateOrderNumber();
    const pickupDatetime = new Date(`${pickup_date}T${pickup_time}:00`);

    // 4. Insert order
    const [insertedOrder] = await trx('orders')
      .insert({
        order_number: orderNumber,
        restaurant_id: restaurant_id,
        customer_name: customer_name.trim(),
        customer_phone: customer_phone.trim(),
        pickup_date: pickup_date,
        pickup_time: pickup_time,
        pickup_datetime: pickupDatetime,
        subtotal: orderSubtotal,
        total: orderTotal,
        note: note ? note.trim() : null,
        status: 'รอร้านรับออร์เดอร์',
      })
      .returning('*');

    const orderId = typeof insertedOrder === 'object' ? insertedOrder.id : insertedOrder;

    // 5. Insert order items
    for (const itemRecord of verifiedOrderItems) {
      await trx('order_items').insert({
        order_id: orderId,
        ...itemRecord,
      });
    }

    // 6. Record status history
    await trx('order_status_history').insert({
      order_id: orderId,
      previous_status: null,
      new_status: 'รอร้านรับออร์เดอร์',
      changed_by: 'customer',
      note: 'สร้างคำสั่งซื้อสำเร็จ',
    });

    const fullOrder = await trx('orders').where({ id: orderId }).first();
    const itemsList = await trx('order_items').where({ order_id: orderId });

    return {
      order: fullOrder,
      items: itemsList.map((i) => ({
        ...i,
        selected_options: JSON.parse(i.selected_options || '[]'),
      })),
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        cuisine_type: restaurant.cuisine_type,
        image_url: restaurant.image_url,
      },
    };
  });
}
