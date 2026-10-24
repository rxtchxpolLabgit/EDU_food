import { Router } from 'express';
import { createOrder, trackOrder } from '../controllers/orderController';
import { validateCreateOrder } from '../middleware/validator';
import { trackLimiter } from '../middleware/rateLimiter';

export const orderRouter = Router();

orderRouter.post('/', validateCreateOrder, createOrder);
orderRouter.get('/track', trackLimiter, trackOrder);
