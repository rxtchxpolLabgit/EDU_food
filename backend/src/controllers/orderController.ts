import { Request, Response, NextFunction } from 'express';
import { db } from '../db/knex';
import { createOrder as processCreateOrder } from '../services/orderService';
import { isValidThaiPhone } from '../middleware/validator';

export async function createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await processCreateOrder(req.body);

    res.status(201).json({
      success: true,
      message: 'สร้างคำสั่งซื้อสำเร็จ',
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message || 'ไม่สามารถสร้างคำสั่งซื้อได้',
    });
  }
}

export async function trackOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orderNumber = req.query.order_number as string;
    const phone = req.query.phone as string;

    if (!orderNumber || !phone) {
      res.status(400).json({
        success: false,
        message: 'กรุณาระบุทั้งหมายเลขออร์เดอร์และเบอร์โทรศัพท์เพื่อตรวจสอบ',
      });
      return;
    }

    const cleanPhone = phone.replace(/[-\s]/g, '');

    const order = await db('orders')
      .where('order_number', orderNumber.trim())
      .first();

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'ไม่พบคำสั่งซื้อที่ตรงกับข้อมูล กรุณาตรวจสอบหมายเลขออร์เดอร์อีกครั้ง',
      });
      return;
    }

    // Verify phone matches
    const orderPhoneClean = order.customer_phone.replace(/[-\s]/g, '');
    if (orderPhoneClean !== cleanPhone) {
      res.status(403).json({
        success: false,
        message: 'เบอร์โทรศัพท์ไม่ตรงกับข้อมูลในคำสั่งซื้อนี้',
      });
      return;
    }

    // Fetch items
    const items = await db('order_items').where({ order_id: order.id });
    const formattedItems = items.map((i) => ({
      ...i,
      unit_price_snapshot: Number(i.unit_price_snapshot),
      subtotal: Number(i.subtotal),
      selected_options: JSON.parse(i.selected_options || '[]'),
    }));

    // Fetch history
    const history = await db('order_status_history')
      .where({ order_id: order.id })
      .orderBy('id', 'asc');

    // Fetch restaurant
    const restaurant = await db('restaurants')
      .where({ id: order.restaurant_id })
      .select('id', 'name', 'cuisine_type', 'image_url', 'opening_time', 'closing_time')
      .first();

    res.json({
      success: true,
      data: {
        order: {
          ...order,
          subtotal: Number(order.subtotal),
          total: Number(order.total),
        },
        restaurant,
        items: formattedItems,
        history,
      },
    });
  } catch (err) {
    next(err);
  }
}
