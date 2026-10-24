import { Router } from 'express';
import {
  getRestaurants,
  getRestaurantById,
  getRestaurantMenu,
  getRestaurantPickupSlots,
} from '../controllers/restaurantController';

export const restaurantRouter = Router();

restaurantRouter.get('/', getRestaurants);
restaurantRouter.get('/:id', getRestaurantById);
restaurantRouter.get('/:id/menu', getRestaurantMenu);
restaurantRouter.get('/:id/pickup-slots', getRestaurantPickupSlots);
