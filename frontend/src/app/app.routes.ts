import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // User Routes
  {
    path: '',
    loadComponent: () =>
      import('./features/user/home/home.component').then((m) => m.HomeComponent),
    title: 'หน้าแรก — EDU Food Order ตึกครุศาสตร์',
  },
  {
    path: 'restaurant/:id',
    loadComponent: () =>
      import('./features/user/restaurant-detail/restaurant-detail.component').then(
        (m) => m.RestaurantDetailComponent
      ),
    title: 'รายการอาหาร — EDU Food Order',
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./features/user/cart/cart.component').then((m) => m.CartComponent),
    title: 'ตะกร้าสินค้า — EDU Food Order',
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./features/user/checkout/checkout.component').then((m) => m.CheckoutComponent),
    title: 'ยืนยันและเลือกรอบเวลารับ — EDU Food Order',
  },
  {
    path: 'order-success/:orderNumber',
    loadComponent: () =>
      import('./features/user/order-success/order-success.component').then(
        (m) => m.OrderSuccessComponent
      ),
    title: 'สั่งอาหารสำเร็จ — EDU Food Order',
  },
  {
    path: 'track',
    loadComponent: () =>
      import('./features/user/order-track/order-track.component').then(
        (m) => m.OrderTrackComponent
      ),
    title: 'ติดตามสถานะคำสั่งซื้อ — EDU Food Order',
  },

  // Admin Routes
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/login/login.component').then((m) => m.AdminLoginComponent),
    title: 'เข้าสู่ระบบผู้ดูแล — EDU Food Order',
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/admin-layout.component').then((m) => m.AdminLayoutComponent),
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
        title: 'แดชบอร์ด — EDU Food Order Admin',
      },
      {
        path: 'restaurants',
        loadComponent: () =>
          import('./features/admin/restaurants/restaurants-manage.component').then(
            (m) => m.RestaurantsManageComponent
          ),
        title: 'จัดการร้านอาหาร — EDU Food Order Admin',
      },
      {
        path: 'menu',
        loadComponent: () =>
          import('./features/admin/menu/menu-manage.component').then(
            (m) => m.MenuManageComponent
          ),
        title: 'จัดการเมนูอาหาร — EDU Food Order Admin',
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/admin/orders/orders-manage.component').then(
            (m) => m.OrdersManageComponent
          ),
        title: 'จัดการคำสั่งซื้อ — EDU Food Order Admin',
      },
    ],
  },

  // Fallback
  {
    path: '**',
    redirectTo: '',
  },
];
