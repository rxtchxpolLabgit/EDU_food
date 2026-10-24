import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RestaurantAuthService } from '../services/restaurant-auth.service';

export const restaurantGuard: CanActivateFn = () => {
  const auth = inject(RestaurantAuthService);
  if (auth.isAuthenticated()) return true;
  inject(Router).navigate(['/shop/login']);
  return false;
};
