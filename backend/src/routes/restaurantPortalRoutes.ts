import { Router } from 'express';
import { restaurantLogin, getAdminOrders, getAdminOrderById, updateOrderStatus } from '../controllers/adminController';
import { requireAuth, requireRestaurant } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

export const restaurantPortalRouter = Router();

restaurantPortalRouter.post('/auth/login', authLimiter, restaurantLogin);
restaurantPortalRouter.use(requireAuth, requireRestaurant);
restaurantPortalRouter.get('/orders', getAdminOrders);
restaurantPortalRouter.get('/orders/:id', getAdminOrderById);
restaurantPortalRouter.patch('/orders/:id/status', updateOrderStatus);
