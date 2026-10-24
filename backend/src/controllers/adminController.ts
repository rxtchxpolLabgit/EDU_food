import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/knex';
import { config } from '../config';
import { AuthenticatedRequest } from '../middleware/auth';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      res.status(400).json({
        success: false,
        message: 'กรุณากรอกเบอร์โทรศัพท์และรหัสผ่าน',
      });
      return;
    }

    const cleanPhone = phone.replace(/[-\s]/g, '');
    const user = await db('users').where({ phone: cleanPhone }).first();

    if (!user || user.role !== 'admin') {
      res.status(401).json({
        success: false,
        message: 'เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง หรือคุณไม่มีสิทธิ์ผู้ดูแลระบบ',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง',
      });
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getDashboardStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const today = new Date().toISOString().slice(0, 10);

    // Today's orders
    const todayOrdersRes = await db('orders')
      .where('pickup_date', today)
      .count<{ count: string | number }>('id as count')
      .first();
    const todayOrdersCount = Number(todayOrdersRes?.count || 0);

    // In-progress orders
    const inProgressRes = await db('orders')
      .whereIn('status', ['รอร้านรับออร์เดอร์', 'ร้านรับออร์เดอร์แล้ว', 'กำลังเตรียมอาหาร'])
      .count<{ count: string | number }>('id as count')
      .first();
    const inProgressCount = Number(inProgressRes?.count || 0);

    // Ready for pickup
    const readyRes = await db('orders')
      .where('status', 'พร้อมรับอาหาร')
      .count<{ count: string | number }>('id as count')
      .first();
    const readyCount = Number(readyRes?.count || 0);

    // Total completed / revenue
    const revenueRes = await db('orders')
      .where('status', 'รับอาหารแล้ว')
      .sum<{ total: string | number }>('total as total')
      .first();
    const totalRevenue = Number(revenueRes?.total || 0);

    // Restaurants count
    const restRes = await db('restaurants')
      .count<{ count: string | number }>('id as count')
      .first();
    const restaurantCount = Number(restRes?.count || 0);

    // Recent 10 orders
    const recentOrders = await db('orders')
      .join('restaurants', 'orders.restaurant_id', 'restaurants.id')
      .select(
        'orders.*',
        'restaurants.name as restaurant_name'
      )
      .orderBy('orders.id', 'desc')
      .limit(10);

    // Last 7 days orders aggregate
    const last7Days: { date: string; orders: number; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);

      const dayOrder = await db('orders')
        .where('pickup_date', dateStr)
        .count<{ count: string | number }>('id as count')
        .first();

      const dayRev = await db('orders')
        .where('pickup_date', dateStr)
        .whereNot('status', 'ยกเลิก')
        .sum<{ total: string | number }>('total as total')
        .first();

      last7Days.push({
        date: dateStr,
        orders: Number(dayOrder?.count || 0),
        revenue: Number(dayRev?.total || 0),
      });
    }

    res.json({
      success: true,
      data: {
        stats: {
          todayOrders: todayOrdersCount,
          inProgressOrders: inProgressCount,
          readyOrders: readyCount,
          totalRevenue: totalRevenue,
          restaurantCount: restaurantCount,
        },
        chartData: last7Days,
        recentOrders: recentOrders.map((o) => ({
          ...o,
          total: Number(o.total),
          subtotal: Number(o.subtotal),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getAdminRestaurants(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const restaurants = await db('restaurants').select('*').orderBy('id', 'asc');

    // Attach counts for menu items and active orders
    const results = await Promise.all(
      restaurants.map(async (r) => {
        const menuCount = await db('menu_items').where({ restaurant_id: r.id }).count<{ count: string | number }>('id as count').first();
        const activeOrdersCount = await db('orders')
          .where({ restaurant_id: r.id })
          .whereIn('status', ['รอร้านรับออร์เดอร์', 'ร้านรับออร์เดอร์แล้ว', 'กำลังเตรียมอาหาร', 'พร้อมรับอาหาร'])
          .count<{ count: string | number }>('id as count').first();

        return {
          ...r,
          is_open: Boolean(r.is_open),
          menu_count: Number(menuCount?.count || 0),
          active_orders_count: Number(activeOrdersCount?.count || 0),
        };
      })
    );

    res.json({
      success: true,
      data: results,
    });
  } catch (err) {
    next(err);
  }
}

export async function createRestaurant(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      name,
      cuisine_type,
      description,
      image_url,
      opening_time,
      closing_time,
      is_open,
      preparation_minutes,
      slot_interval_minutes,
      max_orders_per_slot,
    } = req.body;

    if (!name || !cuisine_type) {
      res.status(400).json({
        success: false,
        message: 'กรุณากรอกชื่อร้านและประเภทอาหาร',
      });
      return;
    }

    const [newId] = await db('restaurants')
      .insert({
        name: name.trim(),
        cuisine_type: cuisine_type.trim(),
        description: description || '',
        image_url: image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
        opening_time: opening_time || '08:00',
        closing_time: closing_time || '17:00',
        is_open: is_open !== undefined ? is_open : true,
        preparation_minutes: preparation_minutes ? Number(preparation_minutes) : 15,
        slot_interval_minutes: slot_interval_minutes ? Number(slot_interval_minutes) : 15,
        max_orders_per_slot: max_orders_per_slot ? Number(max_orders_per_slot) : 10,
      })
      .returning('id');

    const id = typeof newId === 'object' ? newId.id : newId;
    const created = await db('restaurants').where({ id }).first();

    res.status(201).json({
      success: true,
      message: 'เพิ่มร้านอาหารเรียบร้อยแล้ว',
      data: created,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateRestaurant(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const updateData: any = {};

    const allowedFields = [
      'name',
      'cuisine_type',
      'description',
      'image_url',
      'opening_time',
      'closing_time',
      'is_open',
      'preparation_minutes',
      'slot_interval_minutes',
      'max_orders_per_slot',
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    await db('restaurants').where({ id }).update(updateData);
    const updated = await db('restaurants').where({ id }).first();

    res.json({
      success: true,
      message: 'อัปเดตข้อมูลร้านอาหารเรียบร้อยแล้ว',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function toggleRestaurantStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const restaurant = await db('restaurants').where({ id }).first();

    if (!restaurant) {
      res.status(404).json({ success: false, message: 'ไม่พบร้านอาหาร' });
      return;
    }

    const newStatus = !restaurant.is_open;
    await db('restaurants').where({ id }).update({ is_open: newStatus });

    res.json({
      success: true,
      message: newStatus ? 'เปิดร้านสำเร็จ' : 'ปิดร้านชั่วคราวสำเร็จ',
      data: { id: restaurant.id, is_open: newStatus },
    });
  } catch (err) {
    next(err);
  }
}

// Categories
export async function getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { restaurant_id } = req.query;
    let query = db('menu_categories').orderBy('sort_order', 'asc');
    if (restaurant_id) {
      query = query.where({ restaurant_id });
    }
    const categories = await query;
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { restaurant_id, name, sort_order } = req.body;
    if (!restaurant_id || !name) {
      res.status(400).json({ success: false, message: 'กรุณาระบุรหัสร้านและชื่อหมวดหมู่' });
      return;
    }
    const [catId] = await db('menu_categories').insert({
      restaurant_id,
      name: name.trim(),
      sort_order: sort_order || 0,
    }).returning('id');

    const id = typeof catId === 'object' ? catId.id : catId;
    const created = await db('menu_categories').where({ id }).first();
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
}

// Menus
export async function createMenuItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { restaurant_id, category_id, name, description, price, image_url, is_available, options } = req.body;

    if (!restaurant_id || !name || price === undefined) {
      res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลอาหารให้ครบถ้วน (ร้าน, ชื่ออาหาร, ราคา)',
      });
      return;
    }

    const inserted = await db.transaction(async (trx) => {
      const [newId] = await trx('menu_items')
        .insert({
          restaurant_id,
          category_id: category_id || null,
          name: name.trim(),
          description: description || '',
          price: Number(price),
          image_url: image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
          is_available: is_available !== undefined ? Boolean(is_available) : true,
        })
        .returning('id');

      const itemId = typeof newId === 'object' ? newId.id : newId;

      if (Array.isArray(options) && options.length > 0) {
        await trx('menu_options').insert(
          options.map((o: any) => ({
            menu_item_id: itemId,
            option_name: o.option_name,
            option_value: o.option_value,
            additional_price: Number(o.additional_price || 0),
          }))
        );
      }

      const item = await trx('menu_items').where({ id: itemId }).first();
      const itemOptions = await trx('menu_options').where({ menu_item_id: itemId });
      return { ...item, price: Number(item.price), options: itemOptions };
    });

    res.status(201).json({
      success: true,
      message: 'เพิ่มรายการอาหารสำเร็จ',
      data: inserted,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateMenuItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { name, category_id, description, price, image_url, is_available, options } = req.body;

    const item = await db('menu_items').where({ id }).first();
    if (!item) {
      res.status(404).json({ success: false, message: 'ไม่พบรายการอาหาร' });
      return;
    }

    const updated = await db.transaction(async (trx) => {
      const updateData: any = {};
      if (name !== undefined) updateData.name = name.trim();
      if (category_id !== undefined) updateData.category_id = category_id || null;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = Number(price);
      if (image_url !== undefined) updateData.image_url = image_url;
      if (is_available !== undefined) updateData.is_available = Boolean(is_available);

      if (Object.keys(updateData).length > 0) {
        await trx('menu_items').where({ id }).update(updateData);
      }

      if (Array.isArray(options)) {
        await trx('menu_options').where({ menu_item_id: id }).delete();
        if (options.length > 0) {
          await trx('menu_options').insert(
            options.map((o: any) => ({
              menu_item_id: id,
              option_name: o.option_name,
              option_value: o.option_value,
              additional_price: Number(o.additional_price || 0),
            }))
          );
        }
      }

      const resItem = await trx('menu_items').where({ id }).first();
      const resOptions = await trx('menu_options').where({ menu_item_id: id });
      return { ...resItem, price: Number(resItem.price), options: resOptions };
    });

    res.json({
      success: true,
      message: 'อัปเดตรายการอาหารสำเร็จ',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function toggleMenuItemAvailability(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const item = await db('menu_items').where({ id }).first();
    if (!item) {
      res.status(404).json({ success: false, message: 'ไม่พบรายการอาหาร' });
      return;
    }

    const newStatus = !item.is_available;
    await db('menu_items').where({ id }).update({ is_available: newStatus });

    res.json({
      success: true,
      message: newStatus ? 'เปิดขายเมนูนี้แล้ว' : 'ปิดการขาย/อาหารหมดชั่วคราว',
      data: { id: item.id, is_available: newStatus },
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteMenuItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const item = await db('menu_items').where({ id }).first();
    if (!item) {
      res.status(404).json({ success: false, message: 'ไม่พบรายการอาหาร' });
      return;
    }

    await db('menu_items').where({ id }).delete();

    res.json({
      success: true,
      message: 'ลบรายการอาหารสำเร็จ',
    });
  } catch (err) {
    next(err);
  }
}

// Orders Management
export async function getAdminOrders(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { restaurant_id, status, date, search, page = 1, limit = 50 } = req.query;

    let query = db('orders')
      .join('restaurants', 'orders.restaurant_id', 'restaurants.id')
      .select('orders.*', 'restaurants.name as restaurant_name');

    if (restaurant_id) {
      query = query.where('orders.restaurant_id', restaurant_id);
    }

    if (status && status !== 'all') {
      query = query.where('orders.status', status);
    }

    if (date) {
      query = query.where('orders.pickup_date', date);
    }

    if (search && typeof search === 'string') {
      query = query.where(function () {
        this.where('orders.order_number', 'like', `%${search}%`)
          .orWhere('orders.customer_name', 'like', `%${search}%`)
          .orWhere('orders.customer_phone', 'like', `%${search}%`)
          .orWhere('restaurants.name', 'like', `%${search}%`);
      });
    }

    const offset = (Number(page) - 1) * Number(limit);
    const orders = await query.orderBy('orders.id', 'desc').limit(Number(limit)).offset(offset);

    // Attach items preview to each order
    const orderIds = orders.map((o) => o.id);
    const allItems = orderIds.length > 0 ? await db('order_items').whereIn('order_id', orderIds) : [];

    const ordersWithItems = orders.map((order) => {
      const items = allItems.filter((i) => i.order_id === order.id).map((i) => ({
        ...i,
        unit_price_snapshot: Number(i.unit_price_snapshot),
        subtotal: Number(i.subtotal),
        selected_options: JSON.parse(i.selected_options || '[]'),
      }));

      return {
        ...order,
        subtotal: Number(order.subtotal),
        total: Number(order.total),
        items,
      };
    });

    res.json({
      success: true,
      data: ordersWithItems,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAdminOrderById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const order = await db('orders')
      .where('orders.id', id)
      .first();

    if (!order) {
      res.status(404).json({ success: false, message: 'ไม่พบคำสั่งซื้อ' });
      return;
    }

    const restaurant = await db('restaurants').where({ id: order.restaurant_id }).first();
    const items = await db('order_items').where({ order_id: order.id });
    const history = await db('order_status_history').where({ order_id: order.id }).orderBy('id', 'asc');

    res.json({
      success: true,
      data: {
        order: {
          ...order,
          subtotal: Number(order.subtotal),
          total: Number(order.total),
        },
        restaurant,
        items: items.map((i) => ({
          ...i,
          unit_price_snapshot: Number(i.unit_price_snapshot),
          subtotal: Number(i.subtotal),
          selected_options: JSON.parse(i.selected_options || '[]'),
        })),
        history,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { status, cancel_reason, note } = req.body;

    const validStatuses = [
      'รอร้านรับออร์เดอร์',
      'ร้านรับออร์เดอร์แล้ว',
      'กำลังเตรียมอาหาร',
      'พร้อมรับอาหาร',
      'รับอาหารแล้ว',
      'ยกเลิก',
    ];

    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `สถานะออร์เดอร์ไม่ถูกต้อง ต้องเป็นหนึ่งใน: ${validStatuses.join(', ')}`,
      });
      return;
    }
    if (status === 'ยกเลิก' && (typeof cancel_reason !== 'string' || !cancel_reason.trim())) {
      res.status(400).json({ success: false, message: 'กรุณาระบุเหตุผลการยกเลิกคำสั่งซื้อ' });
      return;
    }

    let previousStatus = '';
    let notFound = false;
    await db.transaction(async (trx) => {
      const order = await trx('orders').where({ id }).forUpdate().first();
      if (!order) {
        notFound = true;
        return;
      }
      previousStatus = order.status;
      const updateData: any = { status };
      if (status === 'ยกเลิก' && cancel_reason) {
        updateData.cancel_reason = cancel_reason;
      }

      await trx('orders').where({ id }).update(updateData);
      if (status === 'ยกเลิก' && previousStatus !== 'ยกเลิก') {
        await trx('restaurant_pickup_slots')
          .where({ restaurant_id: order.restaurant_id, slot_date: order.pickup_date, slot_time: order.pickup_time })
          .where('reserved_orders', '>', 0)
          .decrement('reserved_orders', 1);
      }

      await trx('order_status_history').insert({
        order_id: Number(id),
        previous_status: previousStatus,
        new_status: status,
        changed_by: req.user?.name || 'admin',
        note: status === 'ยกเลิก' ? (cancel_reason || note || '') : (note || ''),
      });
    });

    if (notFound) {
      res.status(404).json({ success: false, message: 'ไม่พบคำสั่งซื้อ' });
      return;
    }

    const updated = await db('orders').where({ id }).first();

    res.json({
      success: true,
      message: `อัปเดตสถานะเป็น "${status}" เรียบร้อยแล้ว`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}
