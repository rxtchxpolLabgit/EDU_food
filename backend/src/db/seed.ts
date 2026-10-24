import bcrypt from 'bcryptjs';
import { db } from './knex';
import { config } from '../config';

export async function seed(): Promise<void> {
  console.log('Seeding initial data...');

  // 1. Admin user
  const adminPhone = '0812345678';
  const existingAdmin = await db('users').where({ phone: adminPhone }).first();
  const passwordHash = await bcrypt.hash(config.adminDefaultPassword, 10);

  if (!existingAdmin) {
    await db('users').insert({
      name: 'ผู้ดูแลระบบตึกครุศาสตร์ (Admin)',
      phone: adminPhone,
      role: 'admin',
      password_hash: passwordHash,
    });
    console.log(`Seeded admin user (phone: ${adminPhone}). Password is configured through ADMIN_DEFAULT_PASSWORD.`);
  } else {
    await db('users').where({ phone: adminPhone }).update({
      password_hash: passwordHash,
      role: 'admin',
    });
  }

  // 2. Check if restaurants already seeded
  const countRestaurants = await db('restaurants').count<{ count: number | string }>('id as count').first();
  const currentCount = Number(countRestaurants?.count || 0);

  if (currentCount > 0) {
    console.log(`Already have ${currentCount} restaurants. Skipping restaurant seed.`);
    return;
  }

  // --- RESTAURANT 1: ข้าวมันไก่ได้เฮียช้าง ---
  const [r1Id] = await db('restaurants').insert({
    name: 'ข้าวมันไก่ได้เฮียช้าง',
    cuisine_type: 'ข้าวมันไก่',
    description: 'ข้าวมันไก่สูตรไหหลำแท้ ข้าวนุ่มหอมกระเทียม ไก่ต้มตอนเนื้อฉ่ำ ไก่ทอดกรอบไม่อมน้ำมัน พร้อมน้ำจิ้มเต้าเจี้ยวรสเด็ดและน้ำซุปมะนาวดอง',
    image_url: 'https://images.unsplash.com/photo-1741241857887-321f7fbcacf2?w=800&auto=format&fit=crop&q=80',
    opening_time: '07:30',
    closing_time: '16:00',
    is_open: true,
    preparation_minutes: 10,
    slot_interval_minutes: 15,
    max_orders_per_slot: 12,
  }).returning('id');
  const restaurant1Id = typeof r1Id === 'object' ? r1Id.id : r1Id;

  // Categories R1
  const [cat1_1] = await db('menu_categories').insert({
    restaurant_id: restaurant1Id,
    name: 'ข้าวมันไก่จานเดี่ยว',
    sort_order: 1,
  }).returning('id');
  const [cat1_2] = await db('menu_categories').insert({
    restaurant_id: restaurant1Id,
    name: 'ไก่สับเปล่า & ซุป',
    sort_order: 2,
  }).returning('id');

  const cat1_1_id = typeof cat1_1 === 'object' ? cat1_1.id : cat1_1;
  const cat1_2_id = typeof cat1_2 === 'object' ? cat1_2.id : cat1_2;

  // Menus R1
  const r1Menus = [
    {
      name: 'ข้าวมันไก่ต้ม',
      category_id: cat1_1_id,
      description: 'ข้าวมันหอมนุ่ม เสิร์ฟพร้อมไก่ตอนเนื้อฉ่ำ แตงกวา น้ำจิ้มสูตรเต้าเจี้ยวพริกขิง และน้ำซุปใสกลมกล่อม',
      price: 50.00,
      image_url: 'https://images.unsplash.com/photo-1741241857887-321f7fbcacf2?w=600&auto=format&fit=crop&q=80',
      options: [
        { option_name: 'ส่วนของเนื้อไก่', option_value: 'เนื้อน่องสะโพก (ติดหนัง)', additional_price: 0 },
        { option_name: 'ส่วนของเนื้อไก่', option_value: 'เนื้ออกล้วน (ไม่เอาหนัง)', additional_price: 0 },
        { option_name: 'ขนาดจาน', option_value: 'ธรรมดา', additional_price: 0 },
        { option_name: 'ขนาดจาน', option_value: 'พิเศษ (+ไก่และข้าว)', additional_price: 15 },
        { option_name: 'เพิ่มเครื่องเคียง', option_value: 'เพิ่มตับไก่', additional_price: 10 },
        { option_name: 'เพิ่มเครื่องเคียง', option_value: 'เพิ่มไข่ต้มยางมะตูม', additional_price: 10 },
      ]
    },
    {
      name: 'ข้าวมันไก่ทอด',
      category_id: cat1_1_id,
      description: 'ไก่ทอดแป้งบางกรอบนอกนุ่มใน ข้าวมันร้อนๆ เสิร์ฟคู่กับน้ำจิ้มไก่หวานและน้ำจิ้มแจ่วรสแซ่บ',
      price: 55.00,
      image_url: 'https://images.unsplash.com/photo-1567030422165-af7ea28f987c?w=600&auto=format&fit=crop&q=80',
      options: [
        { option_name: 'ขนาดจาน', option_value: 'ธรรมดา', additional_price: 0 },
        { option_name: 'ขนาดจาน', option_value: 'พิเศษ', additional_price: 15 },
        { option_name: 'น้ำจิ้ม', option_value: 'น้ำจิ้มไก่หวาน', additional_price: 0 },
        { option_name: 'น้ำจิ้ม', option_value: 'น้ำจิ้มแจ่ว', additional_price: 0 },
        { option_name: 'น้ำจิ้ม', option_value: 'รับทั้งสองน้ำจิ้ม', additional_price: 0 },
      ]
    },
    {
      name: 'ข้าวมันไก่ผสม (ต้ม + ทอด)',
      category_id: cat1_1_id,
      description: 'เมนูยอดฮิต ได้ทั้งความนุ่มฉ่ำของไก่ต้มและความกรอบสะใจของไก่ทอดในจานเดียว',
      price: 60.00,
      image_url: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=600&auto=format&fit=crop&q=80',
      options: [
        { option_name: 'ขนาดจาน', option_value: 'ธรรมดา', additional_price: 0 },
        { option_name: 'ขนาดจาน', option_value: 'พิเศษ', additional_price: 15 },
        { option_name: 'ความต้องการพิเศษ', option_value: 'ไก่ต้มไม่เอาหนัง', additional_price: 0 },
        { option_name: 'เพิ่มเครื่องเคียง', option_value: 'เพิ่มตับไก่', additional_price: 10 },
      ]
    },
    {
      name: 'ข้าวมันไก่พิเศษ (จัมโบ้)',
      category_id: cat1_1_id,
      description: 'ข้าวมันไก่จานยักษ์ อิ่มจุใจสำหรับมื้อเร่งรีบ ไก่พูนจาน ข้าวแน่นๆ',
      price: 70.00,
      image_url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&auto=format&fit=crop&q=80',
      options: [
        { option_name: 'ประเภทไก่', option_value: 'ไก่ต้มล้วน', additional_price: 0 },
        { option_name: 'ประเภทไก่', option_value: 'ไก่ทอดล้วน', additional_price: 0 },
        { option_name: 'ประเภทไก่', option_value: 'ไก่ผสม (ต้ม+ทอด)', additional_price: 0 },
      ]
    },
    {
      name: 'ต้มแซ่บกระดูกอ่อน / ซุปมะนาวดอง',
      category_id: cat1_2_id,
      description: 'ซุปมะนาวดองร้อนๆ หอมกลิ่นมะนาวดอง ซดคล่องคอสดชื่นตัดเลี่ยนได้เป็นอย่างดี',
      price: 40.00,
      image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80',
      options: [
        { option_name: 'ประเภทน้ำซุป', option_value: 'ซุปมะนาวดองไก่', additional_price: 0 },
        { option_name: 'ประเภทน้ำซุป', option_value: 'ต้มแซ่บพริกสดมะนาวแท้', additional_price: 10 },
      ]
    }
  ];

  for (const m of r1Menus) {
    const [insertedItem] = await db('menu_items').insert({
      restaurant_id: restaurant1Id,
      category_id: m.category_id,
      name: m.name,
      description: m.description,
      price: m.price,
      image_url: m.image_url,
      is_available: true,
    }).returning('id');
    const itemId = typeof insertedItem === 'object' ? insertedItem.id : insertedItem;

    if (m.options && m.options.length > 0) {
      await db('menu_options').insert(
        m.options.map(o => ({
          menu_item_id: itemId,
          option_name: o.option_name,
          option_value: o.option_value,
          additional_price: o.additional_price,
        }))
      );
    }
  }

  // --- RESTAURANT 2: ร้านก๋วยเตี๋ยวเกี๊ยวหมูแดง ---
  const [r2Id] = await db('restaurants').insert({
    name: 'ร้านก๋วยเตี๋ยวเกี๊ยวหมูแดง',
    cuisine_type: 'ก๋วยเตี๋ยวและเกี๊ยวหมูแดง',
    description: 'บะหมี่ไข่เส้นสดเหนียวนุ่ม เกี๊ยวหมูแน่นคำโต และหมูแดงย่างเตาถ่านหอมหวานละมุน พร้อมน้ำซุปกระดูกหมูเคี่ยวนานกว่า 4 ชั่วโมง',
    image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80',
    opening_time: '08:00',
    closing_time: '17:00',
    is_open: true,
    preparation_minutes: 12,
    slot_interval_minutes: 15,
    max_orders_per_slot: 10,
  }).returning('id');
  const restaurant2Id = typeof r2Id === 'object' ? r2Id.id : r2Id;

  // Categories R2
  const [cat2_1] = await db('menu_categories').insert({
    restaurant_id: restaurant2Id,
    name: 'เมนูก๋วยเตี๋ยว & บะหมี่',
    sort_order: 1,
  }).returning('id');
  const [cat2_2] = await db('menu_categories').insert({
    restaurant_id: restaurant2Id,
    name: 'เกี๊ยวและของทานเล่น',
    sort_order: 2,
  }).returning('id');

  const cat2_1_id = typeof cat2_1 === 'object' ? cat2_1.id : cat2_1;
  const cat2_2_id = typeof cat2_2 === 'object' ? cat2_2.id : cat2_2;

  // Menus R2
  const r2Menus = [
    {
      name: 'บะหมี่เกี๊ยวหมูแดง',
      category_id: cat2_1_id,
      description: 'บะหมี่ไข่เส้นเรียวเหนียวนุ่ม เกี๊ยวหมูเนื้อแน่น หมูแดงย่างเตาถ่านฉ่ำซอส และผักกวางตุ้งหวานกรอบ',
      price: 60.00,
      image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
      options: [
        { option_name: 'รูปแบบ', option_value: 'แห้ง (คลุกน้ำมันกระเทียมเจียว)', additional_price: 0 },
        { option_name: 'รูปแบบ', option_value: 'น้ำซุปใส', additional_price: 0 },
        { option_name: 'รูปแบบ', option_value: 'ต้มยำมะนาวสด', additional_price: 5 },
        { option_name: 'ขนาด', option_value: 'ธรรมดา', additional_price: 0 },
        { option_name: 'ขนาด', option_value: 'พิเศษ (+เส้นและเกี๊ยว)', additional_price: 15 },
        { option_name: 'ความต้องการพิเศษ', option_value: 'ไม่ใส่ถั่วงอก/ต้นหอมผักชี', additional_price: 0 },
      ]
    },
    {
      name: 'ก๋วยเตี๋ยวหมูแดง',
      category_id: cat2_1_id,
      description: 'ก๋วยเตี๋ยวเครื่องแน่น หมูแดงย่างหอมๆ พร้อมลูกชิ้นและหมูสับแผ่น',
      price: 50.00,
      image_url: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=600&auto=format&fit=crop&q=80',
      options: [
        { option_name: 'เลือกเส้น', option_value: 'เส้นเล็ก', additional_price: 0 },
        { option_name: 'เลือกเส้น', option_value: 'เส้นใหญ่', additional_price: 0 },
        { option_name: 'เลือกเส้น', option_value: 'หมี่ขาว', additional_price: 0 },
        { option_name: 'เลือกเส้น', option_value: 'บะหมี่ไข่เหลือง', additional_price: 5 },
        { option_name: 'รูปแบบ', option_value: 'น้ำใส', additional_price: 0 },
        { option_name: 'รูปแบบ', option_value: 'แห้ง', additional_price: 0 },
        { option_name: 'รูปแบบ', option_value: 'ต้มยำสูตรโบราณ', additional_price: 5 },
        { option_name: 'ขนาด', option_value: 'ธรรมดา', additional_price: 0 },
        { option_name: 'ขนาด', option_value: 'พิเศษ', additional_price: 10 },
      ]
    },
    {
      name: 'เกี๊ยวหมูแดงล้วน (ไม่ใส่เส้น)',
      category_id: cat2_2_id,
      description: 'เกี๊ยวหมูต้มคำโต 6 ชิ้น เสิร์ฟพร้อมหมูแดงชิ้นหนานุ่มในน้ำซุปกระดูกหมูหวานธรรมชาติ',
      price: 65.00,
      image_url: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600&auto=format&fit=crop&q=80',
      options: [
        { option_name: 'รูปแบบ', option_value: 'เกี๊ยวน้ำใส', additional_price: 0 },
        { option_name: 'รูปแบบ', option_value: 'เกี๊ยวแห้งคลุกกระเทียมเจียว', additional_price: 0 },
        { option_name: 'รูปแบบ', option_value: 'เกี๊ยวต้มยำน้ำข้น', additional_price: 10 },
        { option_name: 'เพิ่มเครื่อง', option_value: 'เพิ่มเกี๊ยวหมู 3 ชิ้น', additional_price: 20 },
      ]
    },
    {
      name: 'บะหมี่แห้งหมูแดงต้มยำ',
      category_id: cat2_1_id,
      description: 'บะหมี่แห้งคลุกซอสต้มยำรสจัดจ้าน พริกป่นคั่วเอง ถั่วลิสงคั่วบดใหม่ มะนาวแท้',
      price: 55.00,
      image_url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
      options: [
        { option_name: 'ระดับความเผ็ด', option_value: 'เผ็ดน้อย', additional_price: 0 },
        { option_name: 'ระดับความเผ็ด', option_value: 'เผ็ดปานกลาง (สูตรปกติ)', additional_price: 0 },
        { option_name: 'ระดับความเผ็ด', option_value: 'เผ็ดจัดจ้าน', additional_price: 0 },
        { option_name: 'ขนาด', option_value: 'ธรรมดา', additional_price: 0 },
        { option_name: 'ขนาด', option_value: 'พิเศษ', additional_price: 15 },
      ]
    }
  ];

  for (const m of r2Menus) {
    const [insertedItem] = await db('menu_items').insert({
      restaurant_id: restaurant2Id,
      category_id: m.category_id,
      name: m.name,
      description: m.description,
      price: m.price,
      image_url: m.image_url,
      is_available: true,
    }).returning('id');
    const itemId = typeof insertedItem === 'object' ? insertedItem.id : insertedItem;

    if (m.options && m.options.length > 0) {
      await db('menu_options').insert(
        m.options.map(o => ({
          menu_item_id: itemId,
          option_name: o.option_name,
          option_value: o.option_value,
          additional_price: o.additional_price,
        }))
      );
    }
  }

  // --- RESTAURANT 3: ร้านอาหารตามสั่ง ---
  const [r3Id] = await db('restaurants').insert({
    name: 'ร้านอาหารตามสั่ง (ป้าสมร ตึกครุฯ)',
    cuisine_type: 'อาหารตามสั่ง',
    description: 'อาหารจานด่วน ผัดสดใหม่กระทะต่อกระทะ กลิ่นคั่วกระทะหอมกรุ่น วัตถุดิบสดใหม่ ให้เยอะ รสชาติจัดจ้านสะใจสไตล์คนไทย',
    image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop&q=80',
    opening_time: '08:00',
    closing_time: '18:00',
    is_open: true,
    preparation_minutes: 15,
    slot_interval_minutes: 15,
    max_orders_per_slot: 8,
  }).returning('id');
  const restaurant3Id = typeof r3Id === 'object' ? r3Id.id : r3Id;

  // Categories R3
  const [cat3_1] = await db('menu_categories').insert({
    restaurant_id: restaurant3Id,
    name: 'เมนูยอดนิยมกระทะเหล็ก',
    sort_order: 1,
  }).returning('id');
  const [cat3_2] = await db('menu_categories').insert({
    restaurant_id: restaurant3Id,
    name: 'เมนูข้าวผัด & ทอดกระเทียม',
    sort_order: 2,
  }).returning('id');

  const cat3_1_id = typeof cat3_1 === 'object' ? cat3_1.id : cat3_1;
  const cat3_2_id = typeof cat3_2 === 'object' ? cat3_2.id : cat3_2;

  // Standard options for stir-fry
  const standardStirFryOptions = [
    { option_name: 'ระดับความเผ็ด', option_value: 'ไม่เผ็ด (ไม่ใส่พริก)', additional_price: 0 },
    { option_name: 'ระดับความเผ็ด', option_value: 'เผ็ดน้อย', additional_price: 0 },
    { option_name: 'ระดับความเผ็ด', option_value: 'เผ็ดกลาง (มาตรฐาน)', additional_price: 0 },
    { option_name: 'ระดับความเผ็ด', option_value: 'เผ็ดมาก (พริกขี้หนูสวนสะใจ)', additional_price: 0 },
    { option_name: 'ท็อปปิ้งไข่', option_value: 'ไม่เพิ่มไข่', additional_price: 0 },
    { option_name: 'ท็อปปิ้งไข่', option_value: 'ไข่ดาวสุกกรอบ', additional_price: 10 },
    { option_name: 'ท็อปปิ้งไข่', option_value: 'ไข่ดาวไม่สุก (ไข่แดงเยิ้ม)', additional_price: 10 },
    { option_name: 'ท็อปปิ้งไข่', option_value: 'ไข่เจียวหมูสับกรอบฟู', additional_price: 20 },
    { option_name: 'ปริมาณ', option_value: 'ธรรมดา', additional_price: 0 },
    { option_name: 'ปริมาณ', option_value: 'พิเศษ (+ข้าวและกับ)', additional_price: 15 },
  ];

  // Menus R3
  const r3Menus = [
    {
      name: 'ข้าวกะเพราหมูสับ',
      category_id: cat3_1_id,
      description: 'กะเพราโบราณผัดแห้ง พริกแห้งและใบกะเพราป่าแท้ ไม่ใส่ถั่วฝักยาว หอมกลิ่นกระทะไหม้กำลังดี',
      price: 50.00,
      image_url: 'https://images.unsplash.com/photo-1669863329825-6e4e39ce752c?w=600&auto=format&fit=crop&q=80',
      options: standardStirFryOptions,
    },
    {
      name: 'ข้าวคะน้าหมูกรอบ',
      category_id: cat3_1_id,
      description: 'หมูกรอบเนื้อแน่นหนังกรอบฟู ผัดกับคะน้าฮ่องกงยอดอ่อน เต้าเจี้ยวหอม และพริกกระเทียมสด',
      price: 65.00,
      image_url: 'https://images.unsplash.com/photo-1696906594893-e9995c4d7082?w=600&auto=format&fit=crop&q=80',
      options: standardStirFryOptions,
    },
    {
      name: 'ข้าวผัดพริกแกงหมูกรอบ',
      category_id: cat3_1_id,
      description: 'พริกแกงใต้ตำเอง หอมสมุนไพร ผัดกับถั่วฝักยาวกรอบและหมูกรอบสูตรเด็ดของร้าน',
      price: 65.00,
      image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop&q=80',
      options: standardStirFryOptions,
    },
    {
      name: 'ข้าวผัดหมู / ไก่',
      category_id: cat3_2_id,
      description: 'ข้าวผัดไข่เมล็ดร่วนสวยสีทอง หอมกลิ่นกระทะ พร้อมผักคะน้า มะเขือเทศ แตงกวาและมะนาวสด',
      price: 50.00,
      image_url: 'https://images.unsplash.com/photo-1768634003113-42903d7ffe1b?w=600&auto=format&fit=crop&q=80',
      options: [
        { option_name: 'เลือกเนื้อสัตว์', option_value: 'หมูชิ้นนุ่ม', additional_price: 0 },
        { option_name: 'เลือกเนื้อสัตว์', option_value: 'เนื้ออกไก่', additional_price: 0 },
        { option_name: 'เลือกเนื้อสัตว์', option_value: 'กุนเชียงทอด', additional_price: 10 },
        { option_name: 'ท็อปปิ้งไข่', option_value: 'ไม่เพิ่มไข่ดาว', additional_price: 0 },
        { option_name: 'ท็อปปิ้งไข่', option_value: 'เพิ่มไข่ดาวกรอบ', additional_price: 10 },
        { option_name: 'ความต้องการพิเศษ', option_value: 'ไม่ใส่หอมใหญ่และผัก', additional_price: 0 },
      ]
    },
    {
      name: 'ข้าวหมูกระเทียมพริกไทย',
      category_id: cat3_2_id,
      description: 'หมูหมักนุ่มผัดกระเทียมเจียวสด พริกไทยดำป่นหอมเตะจมูก ราดบนข้าวสวยร้อนๆ',
      price: 55.00,
      image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80',
      options: standardStirFryOptions,
    },
    {
      name: 'ข้าวไข่เจียวทรงเครื่อง',
      category_id: cat3_2_id,
      description: 'ไข่ไก่ 2 ฟองตีฟู ทอดในน้ำมันร้อนจัดจนกรอบฟู ใส่หมูสับ ต้นหอม หอมใหญ่ และพริกสด',
      price: 45.00,
      image_url: 'https://images.unsplash.com/photo-1629606600908-a51ec6c44fdd?w=600&auto=format&fit=crop&q=80',
      options: [
        { option_name: 'เนื้อสัตว์ในไข่เจียว', option_value: 'หมูสับ', additional_price: 0 },
        { option_name: 'เนื้อสัตว์ในไข่เจียว', option_value: 'กุ้งสับ', additional_price: 20 },
        { option_name: 'ระดับความกรอบ', option_value: 'กรอบฟูนอกนุ่มใน', additional_price: 0 },
        { option_name: 'ระดับความกรอบ', option_value: 'นุ่มฉ่ำสไตล์ออมเล็ต', additional_price: 0 },
      ]
    }
  ];

  for (const m of r3Menus) {
    const [insertedItem] = await db('menu_items').insert({
      restaurant_id: restaurant3Id,
      category_id: m.category_id,
      name: m.name,
      description: m.description,
      price: m.price,
      image_url: m.image_url,
      is_available: true,
    }).returning('id');
    const itemId = typeof insertedItem === 'object' ? insertedItem.id : insertedItem;

    if (m.options && m.options.length > 0) {
      await db('menu_options').insert(
        m.options.map(o => ({
          menu_item_id: itemId,
          option_name: o.option_name,
          option_value: o.option_value,
          additional_price: o.additional_price,
        }))
      );
    }
  }

  console.log('Seeding completed successfully!');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
