import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ApiError {
  message?: string;
  error?: { message?: string };
}

export interface Category {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  product_count?: number;
  is_active?: boolean | number;
  parent_category_id?: number | null;
  parent_category_name?: string | null;
}

export interface Product {
  id: number;
  category_id: number;
  category_name?: string;
  name: string;
  description?: string;
  price: number;
  discount_price?: number | null;
  stock_quantity: number;
  unit?: string;
  image_url?: string;
  image_urls?: string[];
  is_featured?: boolean | number;
  is_active?: boolean | number;
}

export interface StoreUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  address?: string;
}

export interface OrderItem {
  product_name: string;
  price: number;
  quantity: number;
  total_price: number;
}

export interface Order {
  id: number;
  order_number: string;
  final_amount: number;
  order_status: string;
  payment_status?: string;
  payment_method?: string;
  created_at?: string;
  customer_name?: string;
  customer_email?: string;
  items?: OrderItem[];
}

export interface DashboardStats {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  total_products: number;
  low_stock_count: number;
  low_stock_products?: Product[];
  recent_orders?: Order[];
}

export interface ShippingDetails {
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  payment_method: string;
  notes: string;
}

interface AuthResponse {
  token: string;
  user: StoreUser;
}

@Injectable({ providedIn: 'root' })
export class StoreApiService {
  readonly baseUrl: string;

  constructor(private readonly http: HttpClient) {
    const runtimeUrl = (window as Window & { POOJAPA_API_URL?: string }).POOJAPA_API_URL;
    this.baseUrl = (runtimeUrl || 'https://mkcreation-cv4e.onrender.com').replace(/\/+$/, '');
  }

  hasToken(): boolean {
    return Boolean(localStorage.getItem('poojapa_token'));
  }

  saveSession(token: string, user: StoreUser): void {
    localStorage.setItem('poojapa_token', token);
    localStorage.setItem('poojapa_user', JSON.stringify(user));
  }

  clearSession(): void {
    localStorage.removeItem('poojapa_token');
    localStorage.removeItem('poojapa_user');
  }

  categories(): Observable<{ categories: Category[] }> {
    return this.http.get<{ categories: Category[] }>(this.url('/api/categories'));
  }

  adminCategories(): Observable<{ categories: Category[] }> {
    return this.http.get<{ categories: Category[] }>(
      this.url('/api/categories/admin/all'),
      { headers: this.authHeaders() },
    );
  }

  createCategory(category: {
    name: string;
    slug: string;
    description: string;
    image_url: string;
    parent_category_id: number | null;
    is_active: boolean;
  }): Observable<{ category: Category }> {
    return this.http.post<{ category: Category }>(
      this.url('/api/categories'),
      category,
      { headers: this.authHeaders() },
    );
  }

  updateCategory(id: number, category: Partial<Category>): Observable<{ category: Category }> {
    return this.http.put<{ category: Category }>(
      this.url(`/api/categories/${id}`),
      category,
      { headers: this.authHeaders() },
    );
  }

  deleteCategory(id: number): Observable<unknown> {
    return this.http.delete(this.url(`/api/categories/${id}`), { headers: this.authHeaders() });
  }

  products(filters: { search?: string; category_id?: number | null; sort?: string; limit?: number }): Observable<{ products: Product[] }> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.category_id) params = params.set('category_id', filters.category_id);
    if (filters.sort) params = params.set('sort', filters.sort);
    if (filters.limit) params = params.set('limit', filters.limit);
    return this.http.get<{ products: Product[] }>(this.url('/api/products'), { params });
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.url('/api/auth/login'), credentials);
  }

  register(details: { name: string; email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.url('/api/auth/register'), details);
  }

  profile(): Observable<{ user: StoreUser }> {
    return this.http.get<{ user: StoreUser }>(this.url('/api/auth/me'), { headers: this.authHeaders() });
  }

  createOrder(payload: ShippingDetails & { items: { product_id: number; quantity: number }[] }): Observable<{ order: Order }> {
    return this.http.post<{ order: Order }>(this.url('/api/orders'), payload, { headers: this.authHeaders() });
  }

  myOrders(): Observable<{ orders: Order[] }> {
    return this.http.get<{ orders: Order[] }>(this.url('/api/orders/my-orders'), { headers: this.authHeaders() });
  }

  dashboard(): Observable<{ stats: DashboardStats }> {
    return this.http.get<{ stats: DashboardStats }>(this.url('/api/admin/dashboard'), { headers: this.authHeaders() });
  }

  adminOrders(): Observable<{ orders: Order[] }> {
    return this.http.get<{ orders: Order[] }>(this.url('/api/orders/admin/all'), { headers: this.authHeaders() });
  }

  updateOrderStatus(id: number, order_status: string): Observable<unknown> {
    return this.http.put(this.url(`/api/orders/admin/${id}/status`), { order_status }, { headers: this.authHeaders() });
  }

  cancelOrder(id: number): Observable<unknown> {
    return this.http.put(this.url(`/api/orders/${id}/cancel`), {}, { headers: this.authHeaders() });
  }

  createProduct(
    product: Partial<Product> & { category_id: number; name: string; price: number },
    images: File[] = [],
  ): Observable<{ product: Product }> {
    const formData = new FormData();
    for (const [key, value] of Object.entries(product)) {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    }
    images.forEach((image) => formData.append('images', image, image.name));

    return this.http.post<{ product: Product }>(
      this.url('/api/products'),
      formData,
      { headers: this.authHeaders() },
    );
  }

  uploadImages(files: File[]): Observable<{ image_urls: string[] }> {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file, file.name));
    return this.http.post<{ image_urls: string[] }>(
      this.url('/api/admin/upload'),
      formData,
      { headers: this.authHeaders() },
    );
  }

  deleteProduct(id: number): Observable<unknown> {
    return this.http.delete(this.url(`/api/products/${id}`), { headers: this.authHeaders() });
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('poojapa_token');
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  private url(path: string): string {
    return `${this.baseUrl}${path}`;
  }
}