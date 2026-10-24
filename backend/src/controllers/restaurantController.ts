import { Request, Response, NextFunction } from 'express';
import { db } from '../db/knex';
import { getAvailableSlots } from '../services/slotService';

export async function getRestaurants(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { search, cuisine } = req.query;

    let query = db('restaurants').select('*').orderBy('id', 'asc');

    if (search && typeof search === 'string') {
      query = query.where(function () {
        this.where('name', 'like', `%${search}%`)
          .orWhere('description', 'like', `%${search}%`)
          .orWhere('cuisine_type', 'like', `%${search}%`);
      });
    }

    if (cuisine && typeof cuisine === 'string' && cuisine !== 'all') {
      query = query.where('cuisine_type', cuisine);
    }

    const restaurants = await query;
    res.json({
      success: true,
      data: restaurants,
    });
  } catch (err) {
    next(err);
  }
}

export async function getRestaurantById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const restaurant = await db('restaurants').where({ id }).first();

    if (!restaurant) {
      res.status(404).json({
        success: false,
        message: 'ไม่พบร้านอาหารที่ระบุ',
      });
      return;
    }

    res.json({
      success: true,
      data: restaurant,
    });
  } catch (err) {
    next(err);
  }
}

export async function getRestaurantMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const restaurant = await db('restaurants').where({ id }).first();

    if (!restaurant) {
      res.status(404).json({
        success: false,
        message: 'ไม่พบร้านอาหารที่ระบุ',
      });
      return;
    }

    // Categories
    const categories = await db('menu_categories')
      .where({ restaurant_id: id })
      .orderBy('sort_order', 'asc');

    // Menu Items
    const items = await db('menu_items')
      .where({ restaurant_id: id })
      .orderBy('id', 'asc');

    // Menu Options
    const itemIds = items.map((i) => i.id);
    const options = itemIds.length > 0
      ? await db('menu_options').whereIn('menu_item_id', itemIds)
      : [];

    // Group options by item_id
    const optionsMap = new Map<number, any[]>();
    for (const opt of options) {
      if (!optionsMap.has(opt.menu_item_id)) {
        optionsMap.set(opt.menu_item_id, []);
      }
      optionsMap.get(opt.menu_item_id)!.push({
        id: opt.id,
        option_name: opt.option_name,
        option_value: opt.option_value,
        additional_price: Number(opt.additional_price),
      });
    }

    const itemsWithOptions = items.map((item) => ({
      ...item,
      price: Number(item.price),
      is_available: Boolean(item.is_available),
      options: optionsMap.get(item.id) || [],
    }));

    res.json({
      success: true,
      data: {
        restaurant,
        categories,
        items: itemsWithOptions,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getRestaurantPickupSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const dateParam = (req.query.date as string) || new Date().toISOString().slice(0, 10);

    const { restaurant, slots } = await getAvailableSlots(Number(id), dateParam);

    res.json({
      success: true,
      data: {
        date: dateParam,
        restaurant_id: Number(id),
        restaurant_name: restaurant.name,
        is_open: Boolean(restaurant.is_open),
        slots,
      },
    });
  } catch (err) {
    next(err);
  }
}
