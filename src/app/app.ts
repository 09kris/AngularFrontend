import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiError, Category, DashboardStats, Order, Product, ShippingDetails, StoreApiService, StoreUser } from './store-api.service';

type StoreView = 'store' | 'categories' | 'cart' | 'checkout' | 'orders' | 'profile' | 'admin' | 'admin-products' | 'admin-orders';
type AuthMode = 'login' | 'register';
type StoreLanguage = 'en' | 'hi';

const hindiTranslations: Record<string, string> = {
  'Thoughtful essentials for every sacred moment': 'हर पावन अवसर के लिए चुनी गई आवश्यक वस्तुएँ',
  'Free delivery on orders over ₹499': '₹499 से अधिक के ऑर्डर पर निःशुल्क डिलीवरी',
  'POOJA SAMAGRI STORE': 'पूजा सामग्री स्टोर',
  'The store': 'दुकान',
  Categories: 'श्रेणियाँ',
  'My orders': 'मेरे ऑर्डर',
  Admin: 'व्यवस्थापक',
  'Search the store': 'दुकान में खोजें',
  'Search essentials': 'पूजा सामग्री खोजें',
  'Search pooja essentials': 'पूजा सामग्री खोजें',
  'Sign in': 'साइन इन',
  'Open cart': 'कार्ट खोलें',
  Dismiss: 'बंद करें',
  'MADE FOR MEANINGFUL RITUALS': 'अर्थपूर्ण पूजा-अनुष्ठानों के लिए',
  'Bring a little': 'घर लाएँ',
  reverence: 'श्रद्धा',
  home: 'का भाव',
  'Everyday pooja essentials, chosen with care for your family traditions.': 'रोज़मर्रा की पूजा सामग्री, सावधानी से चुनी गई और आपके परिवार की परंपराओं के लिए।',
  'Explore the collection': 'संग्रह देखें',
  'A calmer way to prepare for the sacred.': 'पूजा की तैयारी का एक शांत तरीका।',
  'Rooted in tradition': 'परंपराओं से जुड़ा',
  'Selected for your daily practice': 'आपकी दैनिक पूजा के लिए चुना गया',
  'A warm arrangement of lamps and flowers for a pooja ritual': 'पूजा के लिए दीपों और फूलों की सुंदर सजावट',
  'Aarti thali with diyas, flowers, and incense': 'दीपक, फूल और अगरबत्ती वाली आरती थाली',
  'A moment': 'एक पल',
  'of stillness': 'शांति का',
  'PRACTICE · PRESENCE · PEACE': 'साधना · उपस्थिति · शांति',
  'FIND YOUR RITUAL': 'अपनी पूजा चुनें',
  'Shop by category': 'श्रेणी के अनुसार खरीदें',
  'All categories': 'सभी श्रेणियाँ',
  items: 'वस्तुएँ',
  'Categories will appear here when the store API is connected.': 'स्टोर से जुड़ने पर यहाँ श्रेणियाँ दिखाई देंगी।',
  'THE POOJAPA EDIT': 'माधव पूजापा संग्रह',
  'Search results': 'खोज के परिणाम',
  'Selected collection': 'चुना हुआ संग्रह',
  'Sacred essentials': 'पूजा की आवश्यक सामग्री',
  'Clear filter ×': 'फ़िल्टर हटाएँ ×',
  'Sort by': 'क्रमबद्ध करें',
  Featured: 'विशेष',
  Newest: 'नवीनतम',
  'Price: low to high': 'कीमत: कम से अधिक',
  'Price: high to low': 'कीमत: अधिक से कम',
  'Opening the collection…': 'संग्रह खोला जा रहा है…',
  'THE DAILY EDIT': 'दैनिक उपयोग',
  'SOLD OUT': 'बिक गया',
  'View details ↗': 'विवरण देखें ↗',
  piece: 'नग',
  'POOJAPA ESSENTIALS': 'पूजा की आवश्यक सामग्री',
  'A considered essential for your home altar and daily practice.': 'आपके पूजा-स्थल और दैनिक साधना के लिए उपयोगी सामग्री।',
  'Add {name} to cart': '{name} कार्ट में जोड़ें',
  'The collection is resting': 'संग्रह अभी उपलब्ध नहीं है',
  'Nothing here just yet': 'यहाँ अभी कुछ नहीं है',
  'Check your API connection and try again.': 'कनेक्शन जाँचें और फिर कोशिश करें।',
  'Try another search or clear the selected category.': 'दूसरी खोज करें या चुनी हुई श्रेणी हटाएँ।',
  'Refresh collection': 'संग्रह फिर से लोड करें',
  'EXPLORE THE COLLECTION': 'संग्रह देखें',
  'A THOUGHTFUL SELECTION': 'आपकी पसंद का संग्रह',
  'A record of your past orders.': 'आपके पिछले ऑर्डर का विवरण।',
  'Browse the considered essentials for your home altar and daily practice.': 'अपने पूजा-स्थल और दैनिक साधना के लिए आवश्यक सामग्री देखें।',
  'pieces in the collection': 'वस्तुएँ',
  'No categories are available yet.': 'अभी कोई श्रेणी उपलब्ध नहीं है।',
  'Your pooja cart': 'आपका पूजा कार्ट',
  'piece selected for your home.': 'नग आपके लिए चुना गया।',
  'pieces selected for your home.': 'नग आपके लिए चुने गए।',
  'Decrease quantity': 'मात्रा घटाएँ',
  'Increase quantity': 'मात्रा बढ़ाएँ',
  'Remove {name}': '{name} हटाएँ',
  'ORDER SUMMARY': 'ऑर्डर का सारांश',
  'Almost yours': 'बस आपका होने वाला है',
  Subtotal: 'उप-योग',
  Delivery: 'डिलीवरी',
  Complimentary: 'निःशुल्क',
  Total: 'कुल',
  'Complimentary delivery applied.': 'निःशुल्क डिलीवरी लागू।',
  'Add {amount} for complimentary delivery.': 'निःशुल्क डिलीवरी के लिए {amount} और जोड़ें।',
  'Continue to checkout': 'चेकआउट जारी रखें',
  'Continue browsing': 'खरीदारी जारी रखें',
  'Your cart is waiting': 'आपका कार्ट खाली है',
  'Find something meaningful for your next ritual.': 'अपनी अगली पूजा के लिए कुछ खास चुनें।',
  'Browse the collection': 'संग्रह देखें',
  'SECURE CHECKOUT': 'सुरक्षित चेकआउट',
  'Delivery details': 'डिलीवरी का विवरण',
  'Your order will be prepared with care.': 'आपका ऑर्डर सावधानी से तैयार किया जाएगा।',
  'Where should we send it?': 'ऑर्डर कहाँ भेजना है?',
  'Recipient name': 'प्राप्तकर्ता का नाम',
  'Phone number': 'फ़ोन नंबर',
  Pincode: 'पिनकोड',
  'Street address': 'सड़क का पता',
  City: 'शहर',
  State: 'राज्य',
  'Notes for the delivery team': 'डिलीवरी टीम के लिए निर्देश',
  Optional: 'वैकल्पिक',
  'Cash on delivery': 'डिलीवरी पर भुगतान',
  'Pay when your order arrives': 'ऑर्डर मिलने पर भुगतान करें',
  'YOUR ORDER': 'आपका ऑर्डर',
  pieces: 'नग',
  'Total due': 'देय कुल राशि',
  'Placing order…': 'ऑर्डर दिया जा रहा है…',
  'Place order · {amount}': 'ऑर्डर दें · {amount}',
  'Your order is confirmed by the Poojapa Store API.': 'आपका ऑर्डर माधव पूजापा स्टोर पर दर्ज होगा।',
  'YOUR POJAPA ACCOUNT': 'आपका माधव पूजापा खाता',
  'Sign in to see your orders': 'ऑर्डर देखने के लिए साइन इन करें',
  'ORDER PLACED': 'ऑर्डर की तारीख',
  'ORDER NUMBER': 'ऑर्डर नंबर',
  'Cash on Delivery': 'डिलीवरी पर भुगतान',
  'Orders you place will appear here.': 'आपके ऑर्डर यहाँ दिखाई देंगे।',
  'Return to the store': 'दुकान पर वापस जाएँ',
  Account: 'खाता',
  'STORE ADMINISTRATOR': 'स्टोर व्यवस्थापक',
  'POOJAPA CUSTOMER': 'माधव पूजापा ग्राहक',
  'No phone number saved': 'फ़ोन नंबर सेव नहीं है',
  'No saved address': 'पता सेव नहीं है',
  'View my orders': 'मेरे ऑर्डर देखें',
  'Admin dashboard': 'व्यवस्थापक डैशबोर्ड',
  'Sign out': 'साइन आउट',
  'Sign in to manage your account and orders.': 'खाते और ऑर्डर देखने के लिए साइन इन करें।',
  'Made for meaningful rituals.': 'अर्थपूर्ण पूजा-अनुष्ठानों के लिए।',
  'Mobile navigation': 'मोबाइल नेविगेशन',
  Store: 'दुकान',
  Explore: 'देखें',
  Cart: 'कार्ट',
  Orders: 'ऑर्डर',
  'Currently unavailable': 'अभी उपलब्ध नहीं',
  'Add to cart': 'कार्ट में जोड़ें',
  'Close sign in': 'साइन इन बंद करें',
  'WELCOME TO POOJAPA': 'माधव पूजापा में आपका स्वागत है',
  'A familiar place.': 'आपका अपना स्थान।',
  'Begin your account.': 'अपना खाता बनाएँ।',
  'Sign in to continue to your orders and saved details.': 'अपने ऑर्डर और सेव की गई जानकारी देखने के लिए साइन इन करें।',
  'Create an account to make your next ritual easier.': 'आसान खरीदारी के लिए खाता बनाएँ।',
  'Your name': 'आपका नाम',
  'Email address': 'ईमेल पता',
  Password: 'पासवर्ड',
  'One moment…': 'एक क्षण…',
  'Create account': 'खाता बनाएँ',
  'New to Poojapa? Create an account': 'पहली बार आए हैं? खाता बनाएँ',
  'Already have an account? Sign in': 'पहले से खाता है? साइन इन करें',
  'POOJAPA STORE · OPERATIONS': 'माधव पूजापा स्टोर · संचालन',
  'Business overview': 'व्यवसाय का सारांश',
  'Sales and inventory, at a glance.': 'बिक्री और स्टॉक का सारांश।',
  'Manage products': 'उत्पाद प्रबंधित करें',
  'Manage orders': 'ऑर्डर प्रबंधित करें',
  'TOTAL REVENUE': 'कुल आय',
  'Across non-cancelled orders': 'रद्द न किए गए ऑर्डर',
  'TOTAL ORDERS': 'कुल ऑर्डर',
  'Customer orders placed': 'ग्राहकों के ऑर्डर',
  'ACTIVE DEVOTEES': 'सक्रिय ग्राहक',
  'Registered customers': 'पंजीकृत ग्राहक',
  'POOJA ITEMS': 'पूजा सामग्री',
  'low in stock': 'कम स्टॉक',
  'LATEST ACTIVITY': 'हाल की गतिविधि',
  'Recent orders': 'हाल के ऑर्डर',
  'All orders ↗': 'सभी ऑर्डर ↗',
  Customer: 'ग्राहक',
  'No recent orders.': 'हाल के कोई ऑर्डर नहीं।',
  'INVENTORY WATCH': 'स्टॉक की स्थिति',
  'Running low': 'स्टॉक कम है',
  left: 'बाकी',
  'Everything is well stocked.': 'सभी उत्पाद पर्याप्त स्टॉक में हैं।',
  'Loading store metrics…': 'स्टोर का विवरण लोड हो रहा है…',
  'Customer orders': 'ग्राहक ऑर्डर',
  'Review and update fulfillment status.': 'ऑर्डर की स्थिति देखें और अपडेट करें।',
  'Refresh orders ↻': 'ऑर्डर रीफ़्रेश करें ↻',
  Status: 'स्थिति',
  Pending: 'लंबित',
  Confirmed: 'पुष्ट',
  Processing: 'तैयारी में',
  Shipped: 'भेज दिया गया',
  Delivered: 'डिलीवर हो गया',
  Cancelled: 'रद्द',
  'No orders yet': 'अभी कोई ऑर्डर नहीं',
  'Customer orders will appear here.': 'ग्राहक ऑर्डर यहाँ दिखाई देंगे।',
  'POOJAPA STORE · CATALOG': 'माधव पूजापा स्टोर · उत्पाद',
  'Add a piece or keep your collection up to date.': 'उत्पाद जोड़ें या संग्रह अपडेट करें।',
  Dashboard: 'डैशबोर्ड',
  'Add a product': 'उत्पाद जोड़ें',
  'Product name': 'उत्पाद का नाम',
  Category: 'श्रेणी',
  'Select category': 'श्रेणी चुनें',
  'Price (₹)': 'कीमत (₹)',
  'Sale price (₹)': 'छूट की कीमत (₹)',
  'Stock quantity': 'स्टॉक की मात्रा',
  Unit: 'इकाई',
  'Product photos': 'उत्पाद की तस्वीरें',
  'Select up to 10 photos from your device.': 'अपने डिवाइस से अधिकतम 10 तस्वीरें चुनें।',
  'Remove photo': 'तस्वीर हटाएँ',
  'View photo': 'तस्वीर देखें',
  'Uploading…': 'अपलोड हो रहा है…',
  Description: 'विवरण',
  'Feature in the store': 'स्टोर में विशेष रूप से दिखाएँ',
  'Saving…': 'सेव हो रहा है…',
  'LIVE CATALOG': 'उपलब्ध उत्पाद',
  products: 'उत्पाद',
  Uncategorized: 'बिना श्रेणी',
  'in stock': 'स्टॉक में',
  'Delete {name}': '{name} हटाएँ',
  pending: 'लंबित',
  confirmed: 'पुष्ट',
  processing: 'तैयारी में',
  shipped: 'भेज दिया गया',
  delivered: 'डिलीवर हो गया',
  cancelled: 'रद्द',
};

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
  image_urls: string[];
  is_featured: boolean;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './storefront-view.html',
})
export class App implements OnInit {
  readonly language = signal<StoreLanguage>(this.readLanguage());
  readonly view = signal<StoreView>('store');
  readonly authMode = signal<AuthMode>('login');
  readonly showAuth = signal(false);
  readonly selectedProduct = signal<Product | null>(null);
  readonly selectedProductImageIndex = signal(0);
  readonly uploadingProductImages = signal(false);
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
    document.documentElement.lang = this.language();
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

  setLanguage(language: StoreLanguage): void {
    this.language.set(language);
    localStorage.setItem('madhav_poojapa_language', language);
    document.documentElement.lang = language;
  }

  tr(text: string): string {
    if (this.language() !== 'hi') return text;
    return hindiTranslations[text] ?? text;
  }

  deliveryNote(): string {
    if (this.subtotal() >= 499) return this.tr('Complimentary delivery applied.');
    const remaining = this.formatCurrency(499 - this.subtotal());
    return this.language() === 'hi'
      ? `निःशुल्क डिलीवरी के लिए ${remaining} और जोड़ें।`
      : `Add ${remaining} for complimentary delivery.`;
  }

  placeOrderLabel(): string {
    const amount = this.formatCurrency(this.total());
    return this.language() === 'hi' ? `ऑर्डर दें · ${amount}` : `Place order · ${amount}`;
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
    if (
      this.uploadingProductImages() ||
      !this.productDraft.category_id ||
      !this.productDraft.name.trim() ||
      !this.productDraft.price
    ) return;
    this.submitting.set(true);
    this.api.createProduct({
      ...this.productDraft,
      category_id: this.productDraft.category_id!,
      name: this.productDraft.name.trim(),
      price: this.productDraft.price!,
      description: this.productDraft.description.trim(),
      image_urls: this.productDraft.image_urls,
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

  onProductImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (!files.length) return;

    if (files.some((file) => !file.type.startsWith('image/'))) {
      this.error.set('Please choose image files only.');
      return;
    }
    if (this.productDraft.image_urls.length + files.length > 10) {
      this.error.set('A product can have up to 10 images.');
      return;
    }

    this.uploadingProductImages.set(true);
    this.api.uploadImages(files).subscribe({
      next: (response) => {
        this.productDraft.image_urls = [
          ...this.productDraft.image_urls,
          ...(response.image_urls ?? []),
        ];
        this.uploadingProductImages.set(false);
      },
      error: (error: unknown) => {
        this.error.set(this.errorMessage(error, 'Could not upload the selected images.'));
        this.uploadingProductImages.set(false);
      },
    });
  }

  removeProductImage(index: number): void {
    this.productDraft.image_urls = this.productDraft.image_urls.filter((_, imageIndex) => imageIndex !== index);
  }

  openProduct(product: Product): void {
    this.selectedProductImageIndex.set(0);
    this.selectedProduct.set(product);
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
    const url = (product.image_urls?.[0] || product.image_url)?.trim();
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    return `${this.api.baseUrl}/${url.replace(/^\/+/, '')}`;
  }

  productImageUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) return url;
    return `${this.api.baseUrl}/${url.replace(/^\/+/, '')}`;
  }

  imageUrls(product: Product): string[] {
    return product.image_urls?.length ? product.image_urls : product.image_url ? [product.image_url] : [];
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

  private readLanguage(): StoreLanguage {
    return localStorage.getItem('madhav_poojapa_language') === 'hi' ? 'hi' : 'en';
  }

  private formatCurrency(amount: number): string {
    const locale = this.language() === 'hi' ? 'hi-IN' : 'en-IN';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
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
    return { category_id: null, name: '', description: '', price: null, discount_price: null, stock_quantity: 0, unit: 'piece', image_urls: [], is_featured: false };
  }
}
