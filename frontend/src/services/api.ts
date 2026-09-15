import axios from 'axios';

const getBaseUrl = (): string => {
  // 1. If configured via environment variable (Vercel / Production), always use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // 2. Client-side local dev fallback
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.')
    ) {
      return `http://${host}:5000/api/v1`;
    }
  }
  return 'http://localhost:5000/api/v1';
};

const API_URL = getBaseUrl();

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: true,
});

// Request interceptor - attach token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
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
        const response = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
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
  toggleActive: (id: string) => apiClient.patch(`/banners/${id}/toggle-active`),
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
