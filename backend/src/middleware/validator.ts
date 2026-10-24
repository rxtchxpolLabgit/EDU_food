import { Request, Response, NextFunction } from 'express';

export function isValidThaiPhone(phone: string): boolean {
  if (!phone) return false;
  const cleanPhone = phone.replace(/[-\s]/g, '');
  // Thai mobile (06, 08, 09, 10 digits) or fixed (02, 03, 04, 05, 07, 9-10 digits)
  const thaiPhoneRegex = /^0[689]\d{8}$|^0\d{8,9}$/;
  return thaiPhoneRegex.test(cleanPhone);
}

export function validateCreateOrder(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { customer_name, customer_phone, restaurant_id, pickup_date, pickup_time, items } = req.body;

  if (!customer_name || typeof customer_name !== 'string' || customer_name.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: 'กรุณาระบุชื่อผู้สั่งอาหาร',
    });
    return;
  }

  if (!customer_phone || !isValidThaiPhone(customer_phone)) {
    res.status(400).json({
      success: false,
      message: 'กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (เบอร์ไทย 10 หลัก เช่น 0812345678)',
    });
    return;
  }

  if (!restaurant_id || isNaN(Number(restaurant_id))) {
    res.status(400).json({
      success: false,
      message: 'กรุณาระบุร้านอาหารที่ถูกต้อง',
    });
    return;
  }

  if (!pickup_date || !pickup_time) {
    res.status(400).json({
      success: false,
      message: 'กรุณาระบุวันที่และเวลาที่ต้องการรับอาหาร',
    });
    return;
  }

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({
      success: false,
      message: 'กรุณาเลือกรายการอาหารอย่างน้อย 1 รายการ',
    });
    return;
  }

  for (const item of items) {
    if (!Number.isInteger(Number(item.menu_item_id)) || Number(item.menu_item_id) < 1 ||
        !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      res.status(400).json({
        success: false,
        message: 'ข้อมูลรายการอาหารไม่ถูกต้อง (จำนวนต้องเป็นจำนวนเต็มตั้งแต่ 1 ถึง 99)',
      });
      return;
    }
  }

  next();
}
