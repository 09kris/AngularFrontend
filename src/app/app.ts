import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiError, Category, DashboardStats, Order, Product, ShippingDetails, StoreApiService, StoreUser } from './store-api.service';

type StoreView = 'store' | 'categories' | 'cart' | 'checkout' | 'orders' | 'profile' | 'admin' | 'admin-products' | 'admin-orders';
type AuthMode = 'login' | 'register';

interface CartLine {
  product: Product;
  quantity: number;
}

interface ProductDraft {
  category_id: number | null;
  name: string;
  description: string;
  price: number | null;
  discount_price: number | null;
  stock_quantity: number;
  unit: string;
  image_url: string;
  is_featured: boolean;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './storefront-view.html',
})
export class App implements OnInit {
  readonly view = signal<StoreView>('store');
  readonly authMode = signal<AuthMode>('login');
  readonly showAuth = signal(false);
  readonly selectedProduct = signal<Product | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly products = signal<Product[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly adminOrders = signal<Order[]>([]);
  readonly stats = signal<DashboardStats | null>(null);
  readonly user = signal<StoreUser | null>(this.readUser());
  readonly cart = signal<CartLine[]>(this.readCart());
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly toast = signal('');
  readonly search = signal('');
  readonly sort = signal('featured');
  readonly selectedCategoryId = signal<number | null>(null);
  readonly isAdmin = computed(() => this.user()?.role === 'admin');
  readonly cartCount = computed(() => this.cart().reduce((sum, line) => sum + line.quantity, 0));
  readonly subtotal = computed(() => this.cart().reduce((sum, line) => sum + this.priceOf(line.product) * line.quantity, 0));
  readonly deliveryFee = computed(() => this.subtotal() === 0 || this.subtotal() >= 499 ? 0 : 50);
  readonly total = computed(() => this.subtotal() + this.deliveryFee());

  authForm = { name: '', email: '', password: '' };
  shipping: ShippingDetails = {
    shipping_name: '', shipping_phone: '', shipping_address: '', shipping_city: '',
    shipping_state: '', shipping_pincode: '', payment_method: 'Cash on Delivery', notes: '',
  };
  productDraft: ProductDraft = this.emptyProductDraft();
  private searchTimer?: number;

  constructor(private readonly api: StoreApiService) {}

  ngOnInit(): void {
    this.loadCatalog();
    if (this.api.hasToken()) {
      this.api.profile().subscribe({
        next: (response) => {
          this.user.set(response.user);
          this.fillShippingFromUser(response.user);
        },
        error: () => this.logout(false),
      });
    }
  }

  setView(view: StoreView): void {
    this.error.set('');
    this.view.set(view);
    if (view === 'orders') this.loadOrders();
    if (view === 'admin') this.loadDashboard();
    if (view === 'admin-orders') this.loadAdminOrders();
    if (view === 'checkout' && !this.user()) this.openAuth('login');
  }

  loadCatalog(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.categories().subscribe({
      next: (response) => this.categories.set(response.categories ?? []),
      error: (error: unknown) => this.error.set(this.errorMessage(error, 'Could not load categories.')),
    });
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.api.products({
      search: this.search().trim(),
      category_id: this.selectedCategoryId(),
      sort: this.sort() === 'featured' ? undefined : this.sort(),
      limit: 100,
    }).subscribe({
      next: (response) => {
        this.products.set(response.products ?? []);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(this.errorMessage(error, 'Could not load products. Check that the API is available.'));
        this.loading.set(false);
      },
    });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    window.clearTimeout(this.searchTimer);
    this.searchTimer = window.setTimeout(() => this.loadProducts(), 250);
  }

  selectCategory(categoryId: number | null): void {
    this.selectedCategoryId.set(categoryId);
    this.view.set('store');
    this.loadProducts();
  }

  openAuth(mode: AuthMode): void {
    this.authMode.set(mode);
    this.authForm = { name: '', email: '', password: '' };
    this.showAuth.set(true);
    this.error.set('');
  }

  submitAuth(): void {
    this.submitting.set(true);
    this.error.set('');
    const request = this.authMode() === 'login'
      ? this.api.login({ email: this.authForm.email, password: this.authForm.password })
      : this.api.register(this.authForm);
    request.subscribe({
      next: (response) => {
        this.api.saveSession(response.token, response.user);
        this.user.set(response.user);
        this.fillShippingFromUser(response.user);
        this.showAuth.set(false);
        this.submitting.set(false);
        this.notify(`Welcome, ${response.user.name}.`);
      },
      error: (error: unknown) => {
        this.error.set(this.errorMessage(error, 'Sign in could not be completed.'));
        this.submitting.set(false);
      },
    });
  }

  logout(showMessage = true): void {
    this.api.clearSession();
    this.user.set(null);
    this.view.set('store');
    if (showMessage) this.notify('You have signed out.');
  }

  addToCart(product: Product): void {
    if (Number(product.stock_quantity) < 1) return;
    const existing = this.cart().find((line) => line.product.id === product.id);
    const next = existing
      ? this.cart().map((line) => line.product.id === product.id
        ? { ...line, quantity: Math.min(line.quantity + 1, Number(product.stock_quantity)) }
        : line)
      : [...this.cart(), { product, quantity: 1 }];
    this.saveCart(next);
    this.notify('Added to your pooja cart.');
  }

  changeQuantity(productId: number, difference: number): void {
    const next = this.cart()
      .map((line) => line.product.id === productId
        ? { ...line, quantity: Math.min(Number(line.product.stock_quantity), line.quantity + difference) }
        : line)
      .filter((line) => line.quantity > 0);
    this.saveCart(next);
  }

  removeFromCart(productId: number): void {
    this.saveCart(this.cart().filter((line) => line.product.id !== productId));
  }

  continueToCheckout(): void {
    if (!this.cart().length) return;
    if (!this.user()) {
      this.view.set('checkout');
      this.openAuth('login');
      return;
    }
    this.fillShippingFromUser(this.user()!);
    this.setView('checkout');
  }

  placeOrder(): void {
    this.submitting.set(true);
    this.error.set('');
    const payload = {
      ...this.shipping,
      items: this.cart().map((line) => ({ product_id: line.product.id, quantity: line.quantity })),
    };
    this.api.createOrder(payload).subscribe({
      next: (response) => {
        this.saveCart([]);
        this.submitting.set(false);
        this.notify(`Order ${response.order.order_number} placed successfully.`);
        this.setView('orders');
      },
      error: (error: unknown) => {
        this.error.set(this.errorMessage(error, 'Order could not be placed.'));
        this.submitting.set(false);
      },
    });
  }

  loadOrders(): void {
    if (!this.api.hasToken()) return;
    this.api.myOrders().subscribe({
      next: (response) => this.orders.set(response.orders ?? []),
      error: (error: unknown) => this.error.set(this.errorMessage(error, 'Could not load your orders.')),
    });
  }

  loadDashboard(): void {
    this.api.dashboard().subscribe({
      next: (response) => this.stats.set(response.stats),
      error: (error: unknown) => this.error.set(this.errorMessage(error, 'Admin dashboard is unavailable.')),
    });
    this.loadAdminOrders(true);
  }

  loadAdminOrders(recent = false): void {
    if (!this.api.hasToken()) return;
    this.api.adminOrders().subscribe({
      next: (response) => this.adminOrders.set(recent ? (response.orders ?? []).slice(0, 5) : response.orders ?? []),
      error: (error: unknown) => this.error.set(this.errorMessage(error, 'Could not load orders.')),
    });
  }

  updateOrderStatus(order: Order, status: string): void {
    this.api.updateOrderStatus(order.id, status).subscribe({
      next: () => {
        this.notify(`Order ${order.order_number} updated.`);
        this.loadAdminOrders(this.view() === 'admin');
        if (this.view() === 'admin') this.loadDashboard();
      },
      error: (error: unknown) => this.error.set(this.errorMessage(error, 'Could not update order status.')),
    });
  }

  createProduct(): void {
    if (!this.productDraft.category_id || !this.productDraft.name.trim() || !this.productDraft.price) return;
    this.submitting.set(true);
    this.api.createProduct({
      ...this.productDraft,
      category_id: this.productDraft.category_id!,
      name: this.productDraft.name.trim(),
      price: this.productDraft.price!,
      description: this.productDraft.description.trim(),
      image_url: this.productDraft.image_url.trim(),
      discount_price: this.productDraft.discount_price || null,
      is_active: true,
    }).subscribe({
      next: () => {
        this.productDraft = this.emptyProductDraft();
        this.submitting.set(false);
        this.notify('Product added to the catalog.');
        this.loadProducts();
      },
      error: (error: unknown) => {
        this.error.set(this.errorMessage(error, 'Could not create product.'));
        this.submitting.set(false);
      },
    });
  }

  deleteProduct(product: Product): void {
    if (!window.confirm(`Remove ${product.name} from the catalog?`)) return;
    this.api.deleteProduct(product.id).subscribe({
      next: () => {
        this.notify('Product removed.');
        this.loadProducts();
      },
      error: (error: unknown) => this.error.set(this.errorMessage(error, 'Could not remove product.')),
    });
  }

  priceOf(product: Product): number {
    const discount = Number(product.discount_price);
    return product.discount_price != null && discount > 0 && discount < Number(product.price)
      ? discount
      : Number(product.price);
  }

  imageUrl(product: Product): string {
    const url = product.image_url?.trim();
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    return `${this.api.baseUrl}/${url.replace(/^\/+/, '')}`;
  }

  hideImage(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  private fillShippingFromUser(user: StoreUser): void {
    this.shipping = {
      ...this.shipping,
      shipping_name: user.name ?? this.shipping.shipping_name,
      shipping_phone: user.phone ?? this.shipping.shipping_phone,
      shipping_address: user.address ?? this.shipping.shipping_address,
    };
  }

  private saveCart(cart: CartLine[]): void {
    this.cart.set(cart);
    localStorage.setItem('poojapa_cart', JSON.stringify(cart));
  }

  private readCart(): CartLine[] {
    try {
      return JSON.parse(localStorage.getItem('poojapa_cart') ?? '[]') as CartLine[];
    } catch {
      return [];
    }
  }

  private readUser(): StoreUser | null {
    try {
      return JSON.parse(localStorage.getItem('poojapa_user') ?? 'null') as StoreUser | null;
    } catch {
      return null;
    }
  }

  private notify(message: string): void {
    this.toast.set(message);
    window.setTimeout(() => this.toast.set(''), 3200);
  }

  private errorMessage(error: unknown, fallback: string): string {
    const response = error as ApiError | null;
    return response?.error?.message ?? response?.message ?? fallback;
  }

  private emptyProductDraft(): ProductDraft {
    return { category_id: null, name: '', description: '', price: null, discount_price: null, stock_quantity: 0, unit: 'piece', image_url: '', is_featured: false };
  }
}
