import axios from 'axios';

const DEFAULT_PRODUCTION_API_URL = 'https://kda-km8t.onrender.com/api/v1';

export const sanitizeApiUrl = (rawUrl?: string): string => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return DEFAULT_PRODUCTION_API_URL;
  }
  let url = rawUrl.trim().replace(/\/+$/, '');

  // Redirect any references to the obsolete/broken backend domain
  if (url.includes('kda-backend.onrender.com')) {
    url = url.replace('kda-backend.onrender.com', 'kda-km8t.onrender.com');
  }

  // Force HTTPS for any remote origin (e.g. Render, Vercel, cloud hosts) to prevent Mixed Content security blocking
  if (
    url.startsWith('http://') &&
    !url.includes('localhost') &&
    !url.includes('127.0.0.1') &&
    !url.match(/^http:\/\/(192\.168\.|10\.|172\.)/)
  ) {
    url = url.replace(/^http:\/\//i, 'https://');
  }

  // Ensure /api/v1 path suffix
  if (!url.endsWith('/api/v1')) {
    url = `${url}/api/v1`;
  }
  return url;
};

export const getBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  // 1. In browser environment
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;

    // Localhost or 127.0.0.1 on laptop/desktop
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000/api/v1';
    }

    // Local Wi-Fi / LAN testing on mobile phones, tablets, or other PCs (direct LAN IP)
    if (/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) {
      return `http://${host}:5000/api/v1`;
    }

    // Deployed environment (Vercel / Production domain):
    // Use relative /api/v1 to leverage Next.js Edge proxy and Vercel CDN caching without CORS overhead
    return '/api/v1';
  }

  // 2. Server-side / build fallback
  if (process.env.NODE_ENV === 'production') {
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return sanitizeApiUrl(envUrl);
    }
    return DEFAULT_PRODUCTION_API_URL;
  }
  return envUrl || 'http://localhost:5000/api/v1';
};

// Fire-and-forget background ping to keep Render warm or wake it early
if (typeof window !== 'undefined') {
  try {
    setTimeout(() => {
      fetch('/api/keepalive', { priority: 'low' } as any).catch(() => {});
    }, 100);
  } catch {}
}

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
  withCredentials: true,
});

// Request interceptor - dynamic baseURL & attach token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      config.baseURL = getBaseUrl();
      const token = localStorage.getItem('accessToken');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const currentBase = getBaseUrl();
        const response = await axios.post(`${currentBase}/auth/refresh`, {}, { withCredentials: true });
        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  },
);

// API Services
export const authApi = {
  register: (data: any) => apiClient.post('/auth/register', data),
  login: (data: any) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  refresh: () => apiClient.post('/auth/refresh'),
  me: () => apiClient.get('/auth/me'),
  verifyOtp: (data: any) => apiClient.post('/auth/verify-otp', data),
  forgotPassword: (email: string) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (data: any) => apiClient.post('/auth/reset-password', data),
  changePassword: (data: any) => apiClient.patch('/auth/change-password', data),
};

export const productsApi = {
  getAll: (params?: any) => apiClient.get('/products', { params }),
  getById: (slug: string) => apiClient.get(`/products/${slug}`),
  getFeatured: () => apiClient.get('/products/featured'),
  getTrending: () => apiClient.get('/products/trending'),
  getNewArrivals: () => apiClient.get('/products/new-arrivals'),
  search: (q: string, params?: any) => apiClient.get('/products/search', { params: { q, ...params } }),
  getRelated: (id: string) => apiClient.get(`/products/${id}/related`),
  getReviews: (id: string, page?: number) => apiClient.get(`/products/${id}/reviews`, { params: { page } }),
  // Admin
  getAdminById: (id: string) => apiClient.get(`/products/admin/${id}`),
  create: (data: any) => apiClient.post('/products', data),
  update: (id: string, data: any) => apiClient.put(`/products/${id}`, data),
  delete: (id: string) => apiClient.delete(`/products/${id}`),
  toggleActive: (id: string) => apiClient.patch(`/products/${id}/toggle-active`),
  uploadImages: (id: string, formData: FormData) => apiClient.post(`/products/${id}/images`, formData),
};

export const categoriesApi = {
  getAll: () => apiClient.get('/categories'),
  getById: (id: string) => apiClient.get(`/categories/${id}`),
};

export const cartApi = {
  get: () => apiClient.get('/cart'),
  addItem: (data: any) => apiClient.post('/cart/items', data),
  updateItem: (itemId: string, quantity: number) => apiClient.patch(`/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId: string) => apiClient.delete(`/cart/items/${itemId}`),
  clear: () => apiClient.delete('/cart/clear'),
};

export const wishlistApi = {
  get: () => apiClient.get('/wishlist'),
  toggle: (productId: string) => apiClient.post('/wishlist/toggle', { productId }),
};

export const ordersApi = {
  create: (data: any) => apiClient.post('/orders', data),
  getAll: (params?: any) => apiClient.get('/orders', { params }),
  getById: (id: string) => apiClient.get(`/orders/${id}`),
  cancel: (id: string, reason: string) => apiClient.patch(`/orders/${id}/cancel`, { reason }),
  requestReturn: (id: string, data: any) => apiClient.post(`/orders/${id}/return`, data),
  // Admin
  adminGetAll: (params?: any) => apiClient.get('/orders/admin/all', { params }),
  adminToggleReviewed: (id: string) => apiClient.patch(`/orders/admin/${id}/toggle-reviewed`),
  adminUpdateStatus: (id: string, status: string) => apiClient.patch(`/orders/admin/${id}/status`, { status }),
};

// Payment API removed - app is Cash on Delivery only

export const reviewsApi = {
  getAll: () => apiClient.get('/reviews'),
  create: (data: any) => apiClient.post('/reviews', data),
  update: (id: string, data: any) => apiClient.patch(`/reviews/${id}`, data),
  delete: (id: string) => apiClient.delete(`/reviews/${id}`),
};

export const aiApi = {
  chat: (message: string, sessionId: string) => apiClient.post('/ai/chat', { message, sessionId }),
  guestChat: (message: string, sessionId: string) => apiClient.post('/ai/chat/guest', { message, sessionId }),
  adminChat: (message: string, sessionId: string) => apiClient.post('/ai/chat/admin', { message, sessionId }),
  getRecommendations: (type: string) => apiClient.get('/ai/recommendations', { params: { type } }),
  getTrending: () => apiClient.get('/ai/recommendations/trending'),
  enhanceSearch: (query: string) => apiClient.post('/ai/search/enhance', { query }),
  generateDescription: (productId: string, data: any) => apiClient.post(`/ai/generate-description/${productId}`, data),
  generateModelPhotos: (productId: string, data: any) => apiClient.post(`/ai/generate-model-photos/${productId}`, data),
};

export const notificationsApi = {
  getAll: () => apiClient.get('/notifications'),
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.patch('/notifications/read-all'),
};

export const couponsApi = {
  validate: (code: string) => apiClient.post('/coupons/validate', { code }),
};

export const adminApi = {
  getDashboard: () => apiClient.get('/admin/dashboard'),
  getAnalytics: (period: string) => apiClient.get('/admin/analytics', { params: { period } }),
  getRevenue: () => apiClient.get('/admin/revenue'),
  getInventory: () => apiClient.get('/admin/inventory'),
  getCustomers: (params?: any) => apiClient.get('/admin/customers', { params }),
  getOrders: (params?: any) => apiClient.get('/admin/orders', { params }),
  updateOrderStatus: (id: string, status: string) => apiClient.patch(`/admin/orders/${id}/status`, { status }),
  toggleUserActive: (id: string) => apiClient.patch(`/admin/customers/${id}/toggle-active`),
};

export const bannersApi = {
  getAll: (params?: any) => apiClient.get('/banners', { params }),
  create: (data: any) => apiClient.post('/banners', data),
  delete: (id: string) => apiClient.delete(`/banners/${id}`),
  toggleActive: (id: string, isActive?: boolean) => apiClient.patch(`/banners/${id}/toggle-active`, { isActive }),
  uploadImage: (formData: FormData) => apiClient.post('/banners/upload', formData),
};

export const usersApi = {
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (data: any) => apiClient.patch('/users/profile', data),
  updateAvatar: (formData: FormData) => apiClient.post('/users/avatar', formData),
  getAddresses: () => apiClient.get('/users/addresses'),
  addAddress: (data: any) => apiClient.post('/users/addresses', data),
  updateAddress: (id: string, data: any) => apiClient.put(`/users/addresses/${id}`, data),
  deleteAddress: (id: string) => apiClient.delete(`/users/addresses/${id}`),
  setDefaultAddress: (id: string) => apiClient.patch(`/users/addresses/${id}/default`),
};
