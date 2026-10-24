import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface AdminUser {
  id: number;
  name: string;
  phone: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = typeof window !== 'undefined' && window.location.port === '4200'
    ? 'http://localhost:5000/api/admin'
    : '/api/admin';
  private tokenKey = 'edu_food_admin_token';
  private userKey = 'edu_food_admin_user';

  currentUser = signal<AdminUser | null>(null);
  token = signal<string | null>(null);
  isAuthenticated = computed(() => !!this.token());

  constructor(private http: HttpClient, private router: Router) {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem(this.tokenKey);
      const savedUser = localStorage.getItem(this.userKey);
      if (savedToken && savedUser) {
        try {
          this.token.set(savedToken);
          this.currentUser.set(JSON.parse(savedUser));
        } catch {
          this.logout();
        }
      }
    }
  }

  login(phone: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { phone, password }).pipe(
      tap((res) => {
        if (res.success && res.data.token) {
          this.token.set(res.data.token);
          this.currentUser.set(res.data.user);
          localStorage.setItem(this.tokenKey, res.data.token);
          localStorage.setItem(this.userKey, JSON.stringify(res.data.user));
        }
      })
    );
  }

  logout() {
    this.token.set(null);
    this.currentUser.set(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
    this.router.navigate(['/admin/login']);
  }

  getAuthHeaders(): { [header: string]: string } {
    const t = this.token();
    return t ? { Authorization: `Bearer ${t}` } : {};
  }
}
