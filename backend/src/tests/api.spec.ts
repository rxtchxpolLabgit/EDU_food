import request from 'supertest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { app } from '../app';
import { db } from '../db/knex';
import { up, down } from '../db/migrate';
import { seed } from '../db/seed';

describe('EDU Food Order API Tests', () => {
  let adminToken = '';
  let testRestaurant: any;
  let testMenuItem: any;
  let testOption: any;

  beforeAll(async () => {
    // Setup test DB
    await up();
    await seed();

    // Login as Admin to get JWT
    const loginRes = await request(app)
      .post('/api/admin/auth/login')
      .send({
        phone: '0812345678',
        password: 'Admin@EduFood2026',
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.token).toBeDefined();
    adminToken = loginRes.body.data.token;

    // Fetch initial restaurant & menu
    const restRes = await request(app).get('/api/restaurants');
    expect(restRes.status).toBe(200);
    testRestaurant = restRes.body.data[0];

    const menuRes = await request(app).get(`/api/restaurants/${testRestaurant.id}/menu`);
    expect(menuRes.status).toBe(200);
    testMenuItem = menuRes.body.data.items[0];
    testOption = testMenuItem.options[0];
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('1. Public Restaurants & Menu API', () => {
    it('should list all initial restaurants', async () => {
      const res = await request(app).get('/api/restaurants');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter restaurants by cuisine', async () => {
      const res = await request(app).get('/api/restaurants?cuisine=ข้าวมันไก่');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].cuisine_type).toBe('ข้าวมันไก่');
    });

    it('should fetch restaurant menu with options', async () => {
      const res = await request(app).get(`/api/restaurants/${testRestaurant.id}/menu`);
      expect(res.status).toBe(200);
      expect(res.body.data.restaurant.name).toBe(testRestaurant.name);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      expect(res.body.data.items[0]).toHaveProperty('options');
    });
  });

  describe('2. Pickup Slots & Timing Validation', () => {
    it('should generate available pickup slots for tomorrow', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);

      const res = await request(app).get(`/api/restaurants/${testRestaurant.id}/pickup-slots?date=${tomorrowStr}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.slots)).toBe(true);
      expect(res.body.data.slots.length).toBeGreaterThan(0);

      // Verify slot properties
      const slot = res.body.data.slots[0];
      expect(slot).toHaveProperty('time');
      expect(slot).toHaveProperty('isAvailable', true);
      expect(slot).toHaveProperty('maxOrders');
      expect(slot).toHaveProperty('reservedOrders');
    });

    it('should mark past dates or times as unavailable', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      const res = await request(app).get(`/api/restaurants/${testRestaurant.id}/pickup-slots?date=${yesterdayStr}`);
      expect(res.status).toBe(200);
      const allUnavailable = res.body.data.slots.every((s: any) => !s.isAvailable);
      expect(allUnavailable).toBe(true);
    });
  });

  describe('3. Order Creation & Server-side Price Calculation', () => {
    it('should validate Thai phone number and required fields', async () => {
      const invalidRes = await request(app)
        .post('/api/orders')
        .send({
          customer_name: '',
          customer_phone: '12345',
          restaurant_id: testRestaurant.id,
          pickup_date: '2026-10-25',
          pickup_time: '12:00',
          items: [],
        });

      expect(invalidRes.status).toBe(400);
      expect(invalidRes.body.success).toBe(false);
    });

    it('should reject pickup times outside business hours or not aligned to a slot', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);
      const res = await request(app).post('/api/orders').send({
        restaurant_id: testRestaurant.id,
        customer_name: 'ทดสอบเวลารับ',
        customer_phone: '0891234567',
        pickup_date: tomorrowStr,
        pickup_time: '06:00',
        items: [{ menu_item_id: testMenuItem.id, quantity: 1 }],
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('เวลารับอาหารไม่ถูกต้อง');
    });

    it('should securely compute prices on server and create order', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);

      // We intentionally do not send price or send an incorrect client price to test server recalculation
      const orderPayload = {
        restaurant_id: testRestaurant.id,
        customer_name: 'สมชาย นักศึกษาทดสอบ',
        customer_phone: '0891234567',
        pickup_date: tomorrowStr,
        pickup_time: '12:00',
        note: 'ไม่ใส่ผักชีและกระเทียมเจียว',
        items: [
          {
            menu_item_id: testMenuItem.id,
            quantity: 2,
            selected_options: testOption ? [testOption] : [],
            item_note: 'ขอพริกน้ำส้มเพิ่ม',
          },
        ],
      };

      const res = await request(app).post('/api/orders').send(orderPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.order_number).toMatch(/^EDU-/);
      expect(res.body.data.order.customer_name).toBe('สมชาย นักศึกษาทดสอบ');

      // Verify server price calculation
      const expectedUnitPrice = Number(testMenuItem.price) + (testOption ? Number(testOption.additional_price) : 0);
      const expectedTotal = expectedUnitPrice * 2;
      expect(Number(res.body.data.order.total)).toBe(expectedTotal);

      // Verify item snapshot
      const orderedItem = res.body.data.items[0];
      expect(orderedItem.menu_name_snapshot).toBe(testMenuItem.name);
      expect(Number(orderedItem.unit_price_snapshot)).toBe(expectedUnitPrice);
    });
  });

  describe('4. Order Tracking Flow', () => {
    it('should successfully track order with matching order number AND phone', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);

      // Create an order first
      const createRes = await request(app).post('/api/orders').send({
        restaurant_id: testRestaurant.id,
        customer_name: 'อาจารย์สุดารัตน์',
        customer_phone: '0819876543',
        pickup_date: tomorrowStr,
        pickup_time: '12:30',
        items: [{ menu_item_id: testMenuItem.id, quantity: 1 }],
      });

      const orderNumber = createRes.body.data.order.order_number;

      // Track with correct credentials
      const trackRes = await request(app)
        .get(`/api/orders/track?order_number=${orderNumber}&phone=0819876543`);

      expect(trackRes.status).toBe(200);
      expect(trackRes.body.success).toBe(true);
      expect(trackRes.body.data.order.order_number).toBe(orderNumber);
      expect(trackRes.body.data.history.length).toBeGreaterThanOrEqual(1);

      // Track with mismatched phone should fail
      const failPhoneRes = await request(app)
        .get(`/api/orders/track?order_number=${orderNumber}&phone=0899999999`);

      expect(failPhoneRes.status).toBe(403);
      expect(failPhoneRes.body.success).toBe(false);
    });
  });

  describe('5. Admin Authentication & Role Authorization', () => {
    it('should reject unauthorized requests to admin endpoints', async () => {
      const res = await request(app).get('/api/admin/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should allow admin access with valid JWT token', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('stats');
      expect(res.body.data).toHaveProperty('chartData');
    });

    it('should require admin access and accept a valid image upload', async () => {
      const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC', 'base64');
      const denied = await request(app).post('/api/admin/uploads').attach('image', png, { filename: 'dish.png', contentType: 'image/png' });
      expect(denied.status).toBe(401);

      const uploaded = await request(app)
        .post('/api/admin/uploads')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', png, { filename: 'dish.png', contentType: 'image/png' });
      expect(uploaded.status).toBe(201);
      expect(uploaded.body.data.image_url).toMatch(/^\/uploads\/[\w-]+\.png$/);
      const imageResponse = await request(app).get(uploaded.body.data.image_url);
      expect(imageResponse.status).toBe(200);
      await fs.unlink(path.resolve(process.cwd(), 'uploads', path.basename(uploaded.body.data.image_url)));
    });

    it('should allow admin to update order status through valid transitions', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);

      const createRes = await request(app).post('/api/orders').send({
        restaurant_id: testRestaurant.id,
        customer_name: 'ทดสอบสถานะ',
        customer_phone: '0865554444',
        pickup_date: tomorrowStr,
        pickup_time: '13:00',
        items: [{ menu_item_id: testMenuItem.id, quantity: 1 }],
      });

      const orderId = createRes.body.data.order.id;

      // Transition to ร้านรับออร์เดอร์แล้ว
      const updateRes = await request(app)
        .patch(`/api/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ร้านรับออร์เดอร์แล้ว', note: 'รับออร์เดอร์เข้าระบบครัว' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.status).toBe('ร้านรับออร์เดอร์แล้ว');

      // Transition to กำลังเตรียมอาหาร
      const prepRes = await request(app)
        .patch(`/api/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'กำลังเตรียมอาหาร' });

      expect(prepRes.status).toBe(200);
      expect(prepRes.body.data.status).toBe('กำลังเตรียมอาหาร');

      // Transition to พร้อมรับอาหาร
      const readyRes = await request(app)
        .patch(`/api/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'พร้อมรับอาหาร' });

      expect(readyRes.status).toBe(200);
      expect(readyRes.body.data.status).toBe('พร้อมรับอาหาร');

      const reservedBeforeCancel = await db('restaurant_pickup_slots')
        .where({ restaurant_id: testRestaurant.id, slot_date: tomorrowStr, slot_time: '13:00' })
        .first();
      const cancelRes = await request(app)
        .patch(`/api/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ยกเลิก', cancel_reason: 'ทดสอบการคืนคิว' });
      expect(cancelRes.status).toBe(200);
      const reservedAfterCancel = await db('restaurant_pickup_slots')
        .where({ restaurant_id: testRestaurant.id, slot_date: tomorrowStr, slot_time: '13:00' })
        .first();
      expect(reservedAfterCancel.reserved_orders).toBe(reservedBeforeCancel.reserved_orders - 1);
    });
  });
});
