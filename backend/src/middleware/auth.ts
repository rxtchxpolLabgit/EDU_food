import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db } from '../db/knex';

export interface AuthenticatedUser {
  id: number;
  name: string;
  phone: string;
  role: string;
  restaurant_id?: number | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'ไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบก่อน',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { id: number; role: string };
    const user = await db('users').where({ id: decoded.id }).first();
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'ไม่พบบัญชีผู้ใช้งานในระบบ',
      });
      return;
    }

    req.user = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      restaurant_id: user.restaurant_id ?? null,
    };
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Session หมดอายุ หรือ Token ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่',
    });
  }
}

export function requireRestaurant(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== 'restaurant' || !req.user.restaurant_id) {
    res.status(403).json({ success: false, message: 'บัญชีนี้ไม่มีสิทธิ์เข้าถึงหน้าร้านค้า' });
    return;
  }
  next();
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'คุณไม่มีสิทธิ์ระดับผู้ดูแลระบบ (Admin) ในการเข้าถึงส่วนนี้',
    });
    return;
  }
  next();
}
