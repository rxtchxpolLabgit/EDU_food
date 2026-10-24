import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { getApiBaseUrl } from '../config/api-url';

export interface RestaurantAccount {
  id: number;
  name: string;
  phone: string;
  role: 'restaurant';
  restaurant_id: number;
  restaurant_name: string;
}

@Injectable({ providedIn: 'root' })
export class RestaurantAuthService {
  private baseUrl = getApiBaseUrl();
  private tokenKey = 'edu_food_restaurant_token';
  private userKey = 'edu_food_restaurant_user';
  currentUser = signal<RestaurantAccount | null>(null);
  token = signal<string | null>(null);
  isAuthenticated = computed(() => !!this.token() && !!this.currentUser());

  constructor(private http: HttpClient, private router: Router) {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(this.tokenKey);
      const user = localStorage.getItem(this.userKey);
      if (token && user) {
        try {
          const parsed = JSON.parse(user) as RestaurantAccount;
          if (parsed.role === 'restaurant' && parsed.restaurant_id) {
            this.token.set(token);
            this.currentUser.set(parsed);
          } else this.clearStorage();
        } catch { this.clearStorage(); }
      }
    }
  }

  login(phone: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/restaurant-portal/auth/login`, { phone, password }).pipe(tap((res) => {
      if (res.success && res.data.token && res.data.user?.restaurant_id) {
        this.token.set(res.data.token);
        this.currentUser.set(res.data.user);
        localStorage.setItem(this.tokenKey, res.data.token);
        localStorage.setItem(this.userKey, JSON.stringify(res.data.user));
        localStorage.setItem('edu_food_restaurant_user_phone', res.data.user.phone);
        localStorage.setItem('edu_food_restaurant_id', String(res.data.user.restaurant_id));
      }
    }));
  }

  headers(): { [header: string]: string } {
    return this.token() ? { Authorization: `Bearer ${this.token()}` } : {};
  }

  logout(): void {
    this.token.set(null);
    this.currentUser.set(null);
    this.clearStorage();
    this.router.navigate(['/shop/login']);
  }

  private clearStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
      localStorage.removeItem('edu_food_restaurant_user_phone');
      localStorage.removeItem('edu_food_restaurant_id');
    }
  }
}
