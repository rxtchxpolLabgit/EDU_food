import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Restaurant,
  MenuItem,
  PickupSlot,
  Order,
  DashboardData,
  MenuCategory,
} from '../models/food.models';
import { AuthService } from './auth.service';
import { RestaurantAuthService } from './restaurant-auth.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = typeof window !== 'undefined' && window.location.port === '4200'
    ? 'http://localhost:5000/api'
    : '/api';

  constructor(private http: HttpClient, private authService: AuthService, private restaurantAuth: RestaurantAuthService) {}

  // --- Public APIs ---

  getRestaurants(search?: string, cuisine?: string): Observable<{ success: boolean; data: Restaurant[] }> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (cuisine && cuisine !== 'all') params = params.set('cuisine', cuisine);

    return this.http.get<{ success: boolean; data: Restaurant[] }>(`${this.baseUrl}/restaurants`, { params });
  }

  getRestaurantById(id: number): Observable<{ success: boolean; data: Restaurant }> {
    return this.http.get<{ success: boolean; data: Restaurant }>(`${this.baseUrl}/restaurants/${id}`);
  }

  getRestaurantMenu(id: number): Observable<{
    success: boolean;
    data: {
      restaurant: Restaurant;
      categories: MenuCategory[];
      items: MenuItem[];
    };
  }> {
    return this.http.get<any>(`${this.baseUrl}/restaurants/${id}/menu`);
  }

  getPickupSlots(restaurantId: number, date?: string): Observable<{
    success: boolean;
    data: {
      date: string;
      restaurant_id: number;
      restaurant_name: string;
      is_open: boolean;
      slots: PickupSlot[];
    };
  }> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.http.get<any>(`${this.baseUrl}/restaurants/${restaurantId}/pickup-slots`, { params });
  }

  createOrder(orderData: any): Observable<{
    success: boolean;
    message: string;
    data: {
      order: Order;
      items: any[];
      restaurant: any;
    };
  }> {
    return this.http.post<any>(`${this.baseUrl}/orders`, orderData);
  }

  trackOrder(orderNumber: string, phone: string): Observable<{
    success: boolean;
    data: {
      order: Order;
      restaurant: Restaurant;
      items: any[];
      history: any[];
    };
  }> {
    const params = new HttpParams()
      .set('order_number', orderNumber.trim())
      .set('phone', phone.trim());

    return this.http.get<any>(`${this.baseUrl}/orders/track`, { params });
  }

  // --- Admin APIs (Bearer Token Protected) ---

  getAdminDashboard(): Observable<{ success: boolean; data: DashboardData }> {
    return this.http.get<{ success: boolean; data: DashboardData }>(
      `${this.baseUrl}/admin/dashboard`,
      { headers: this.authService.getAuthHeaders() }
    );
  }

  getAdminRestaurants(): Observable<{ success: boolean; data: Restaurant[] }> {
    return this.http.get<{ success: boolean; data: Restaurant[] }>(
      `${this.baseUrl}/admin/restaurants`,
      { headers: this.authService.getAuthHeaders() }
    );
  }

  createRestaurant(data: any): Observable<{ success: boolean; data: Restaurant }> {
    return this.http.post<{ success: boolean; data: Restaurant }>(
      `${this.baseUrl}/admin/restaurants`,
      data,
      { headers: this.authService.getAuthHeaders() }
    );
  }

  updateRestaurant(id: number, data: any): Observable<{ success: boolean; data: Restaurant }> {
    return this.http.put<{ success: boolean; data: Restaurant }>(
      `${this.baseUrl}/admin/restaurants/${id}`,
      data,
      { headers: this.authService.getAuthHeaders() }
    );
  }

  setRestaurantAccount(id: number, data: { phone: string; password: string; name?: string }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/admin/restaurants/${id}/account`, data, {
      headers: this.authService.getAuthHeaders(),
    });
  }

  toggleRestaurantStatus(id: number): Observable<{ success: boolean; message?: string; data: { id: number; is_open: boolean } }> {
    return this.http.patch<any>(
      `${this.baseUrl}/admin/restaurants/${id}/status`,
      {},
      { headers: this.authService.getAuthHeaders() }
    );
  }

  createCategory(restaurantId: number, name: string): Observable<{ success: boolean; data: MenuCategory }> {
    return this.http.post<any>(
      `${this.baseUrl}/admin/categories`,
      { restaurant_id: restaurantId, name },
      { headers: this.authService.getAuthHeaders() }
    );
  }

  createMenuItem(restaurantId: number, data: any): Observable<{ success: boolean; data: MenuItem }> {
    return this.http.post<{ success: boolean; data: MenuItem }>(
      `${this.baseUrl}/admin/restaurants/${restaurantId}/menu`,
      { ...data, restaurant_id: restaurantId },
      { headers: this.authService.getAuthHeaders() }
    );
  }

  updateMenuItem(id: number, data: any): Observable<{ success: boolean; data: MenuItem }> {
    return this.http.put<{ success: boolean; data: MenuItem }>(
      `${this.baseUrl}/admin/menu/${id}`,
      data,
      { headers: this.authService.getAuthHeaders() }
    );
  }

  toggleMenuItemAvailability(id: number): Observable<{ success: boolean; message?: string; data: { id: number; is_available: boolean } }> {
    return this.http.patch<any>(
      `${this.baseUrl}/admin/menu/${id}/availability`,
      {},
      { headers: this.authService.getAuthHeaders() }
    );
  }

  deleteMenuItem(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<any>(
      `${this.baseUrl}/admin/menu/${id}`,
      { headers: this.authService.getAuthHeaders() }
    );
  }

  uploadImage(file: File): Observable<{ success: boolean; data: { image_url: string } }> {
    const body = new FormData();
    body.append('image', file);
    return this.http.post<{ success: boolean; data: { image_url: string } }>(
      `${this.baseUrl}/admin/uploads`,
      body,
      { headers: this.authService.getAuthHeaders() }
    );
  }

  getAdminOrders(filters?: {
    restaurant_id?: number | string;
    status?: string;
    date?: string;
    search?: string;
  }): Observable<{ success: boolean; data: Order[] }> {
    let params = new HttpParams();
    if (filters?.restaurant_id) params = params.set('restaurant_id', String(filters.restaurant_id));
    if (filters?.status && filters.status !== 'all') params = params.set('status', filters.status);
    if (filters?.date) params = params.set('date', filters.date);
    if (filters?.search) params = params.set('search', filters.search);

    return this.http.get<{ success: boolean; data: Order[] }>(
      `${this.baseUrl}/admin/orders`,
      { params, headers: this.authService.getAuthHeaders() }
    );
  }

  getAdminOrderById(id: number): Observable<{ success: boolean; data: { order: Order; restaurant: Restaurant; items: any[]; history: any[] } }> {
    return this.http.get<any>(
      `${this.baseUrl}/admin/orders/${id}`,
      { headers: this.authService.getAuthHeaders() }
    );
  }

  updateOrderStatus(
    id: number,
    status: string,
    cancel_reason?: string,
    note?: string
  ): Observable<{ success: boolean; message: string; data: Order }> {
    return this.http.patch<any>(
      `${this.baseUrl}/admin/orders/${id}/status`,
      { status, cancel_reason, note },
      { headers: this.authService.getAuthHeaders() }
    );
  }

  getShopOrders(filters?: { status?: string; date?: string }): Observable<{ success: boolean; data: Order[] }> {
    let params = new HttpParams();
    if (filters?.status && filters.status !== 'all') params = params.set('status', filters.status);
    if (filters?.date) params = params.set('date', filters.date);
    return this.http.get<any>(`${this.baseUrl}/restaurant-portal/orders`, { params, headers: this.restaurantAuth.headers() });
  }

  updateShopOrderStatus(id: number, status: string, cancel_reason?: string): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/restaurant-portal/orders/${id}/status`, { status, cancel_reason }, { headers: this.restaurantAuth.headers() });
  }
}
