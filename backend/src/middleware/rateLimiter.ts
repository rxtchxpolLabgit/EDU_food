import rateLimit from 'express-rate-limit';

// General API rate limiter (100 requests per 15 minutes per IP)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: 'มีการส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for Login attempts (10 attempts per 15 minutes)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    message: 'พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอ 15 นาทีแล้วลองใหม่อีกครั้ง',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for Order Tracking (30 lookups per 5 minutes)
export const trackLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'ค้นหาคำสั่งซื้อบ่อยเกินไป กรุณารอสักครู่',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
