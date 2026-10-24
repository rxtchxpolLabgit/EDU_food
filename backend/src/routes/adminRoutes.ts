import { Router } from 'express';
import {
  login,
  getDashboardStats,
  getAdminRestaurants,
  createRestaurant,
  updateRestaurant,
  toggleRestaurantStatus,
  getCategories,
  createCategory,
  createMenuItem,
  updateMenuItem,
  toggleMenuItemAvailability,
  deleteMenuItem,
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
} from '../controllers/adminController';
import { getRestaurantMenu } from '../controllers/restaurantController';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { handleImageUpload } from '../middleware/upload';

export const adminRouter = Router();

// Public Admin Login
adminRouter.post('/auth/login', authLimiter, login);

// Protected Admin Endpoints
adminRouter.use(requireAuth, requireAdmin);
adminRouter.post('/uploads', handleImageUpload, (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'กรุณาเลือกไฟล์ภาพ' });
    return;
  }
  res.status(201).json({ success: true, data: { image_url: `/uploads/${req.file.filename}` } });
});

// Dashboard
adminRouter.get('/dashboard', getDashboardStats);

// Restaurants
adminRouter.get('/restaurants', getAdminRestaurants);
adminRouter.post('/restaurants', createRestaurant);
adminRouter.put('/restaurants/:id', updateRestaurant);
adminRouter.patch('/restaurants/:id/status', toggleRestaurantStatus);
adminRouter.get('/restaurants/:id/menu', getRestaurantMenu);
adminRouter.post('/restaurants/:id/menu', createMenuItem);

// Categories
adminRouter.get('/categories', getCategories);
adminRouter.post('/categories', createCategory);

// Menu
adminRouter.put('/menu/:id', updateMenuItem);
adminRouter.patch('/menu/:id/availability', toggleMenuItemAvailability);
adminRouter.delete('/menu/:id', deleteMenuItem);

// Orders
adminRouter.get('/orders', getAdminOrders);
adminRouter.get('/orders/:id', getAdminOrderById);
adminRouter.patch('/orders/:id/status', updateOrderStatus);
