
const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(
  path,
  { method = 'GET', body, tokenKey = 'sneaker_token' } = {}
) {
  const token = localStorage.getItem(tokenKey);
  const isFormData =
    typeof FormData !== 'undefined' && body instanceof FormData;

  const headers = {
    ...(isFormData
      ? {}
      : body !== undefined
        ? { 'Content-Type': 'application/json' }
        : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body:
      body === undefined
        ? undefined
        : isFormData
          ? body
          : JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.message || `Request failed (${response.status})`
    );
    Object.assign(error, data);
    error.status = response.status;
    throw error;
  }

  return data;
}

const query = (params = {}) => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== '' &&
      value !== 'All'
    ) {
      search.set(key, String(value));
    }
  });

  const serialized = search.toString();
  return serialized ? `?${serialized}` : '';
};

export const api = {
  // Storefront product catalogue
  getProducts: (suffix = '') => request(`/products${suffix}`),

  getProduct: (id) =>
    request(`/products/${encodeURIComponent(id)}`),

  getCategories: () => request('/categories'),

  getLiveOffers: () => request('/offers/live'),

  // Customer authentication
  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: payload,
    }),

  verify: (
    otp,
    email = localStorage.getItem('sneaker_pending_email')
  ) =>
    request('/auth/verify', {
      method: 'POST',
      body: { email, otp },
    }),

  resendVerification: (
    email = localStorage.getItem('sneaker_pending_email')
  ) =>
    request('/auth/resend-verification', {
      method: 'POST',
      body: { email },
    }),

  login: (payload) =>
    request('/auth/login', {
      method: 'POST',
      body: payload,
    }),

  forgotPassword: (email) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    }),

  resetPassword: (token, password) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: { token, password },
    }),

  me: () => request('/auth/me'),

  updateMe: (payload) =>
    request('/users/me', {
      method: 'PUT',
      body: payload,
    }),

  deleteMe: (password) =>
    request('/users/me', {
      method: 'DELETE',
      body: { password },
    }),

  uploadProfilePicture: (file) => {
    const body = new FormData();
    body.append('profilePicture', file);

    return request('/users/me/profile-picture', {
      method: 'POST',
      body,
    });
  },

  // Addresses and wallet
  getAddresses: () => request('/users/me/addresses'),

  saveAddress: (address) =>
    request('/users/me/addresses', {
      method: 'POST',
      body: address,
    }),

  deleteAddress: (id) =>
    request(`/users/me/addresses/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  getWallet: () => request('/wallet'),

  getTransactions: () => request('/wallet/transactions'),

  // Orders
  createOrder: (payload) =>
    request('/orders', {
      method: 'POST',
      body: payload,
    }),

  getOrders: () => request('/orders/mine'),

  getOrder: (id) =>
    request(`/orders/${encodeURIComponent(id)}`),

  cancelOrder: (id) =>
    request(`/orders/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
    }),

  // Razorpay
  createPaymentOrder: (payload) =>
    request('/payments/create-order', {
      method: 'POST',
      body: payload,
    }),

  verifyPayment: (payload) =>
    request('/payments/verify', {
      method: 'POST',
      body: payload,
    }),

  // Admin products
  getAdminProducts: (params = {}) =>
    request(`/products/admin/list${query(params)}`, {
      tokenKey: 'sneakerco_admin_token',
    }),

  createProduct: (payload) =>
    request('/products', {
      method: 'POST',
      body: payload,
      tokenKey: 'sneakerco_admin_token',
    }),

  updateProduct: (id, payload) =>
    request(`/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: payload,
      tokenKey: 'sneakerco_admin_token',
    }),

  deleteProduct: (id) =>
    request(`/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      tokenKey: 'sneakerco_admin_token',
    }),

  uploadProductImages: (id, files, { replace = false } = {}) => {
    const body = new FormData();

    Array.from(files).forEach((file) => {
      body.append('images', file);
    });

    if (replace) {
      body.append('replace', 'true');
    }

    return request(`/products/${encodeURIComponent(id)}/images`, {
      method: 'POST',
      body,
      tokenKey: 'sneakerco_admin_token',
    });
  },

  getAdminOrders: (params = {}) =>
    request(`/orders${query(params)}`, {
      tokenKey: 'sneakerco_admin_token',
    }),

  updateOrderStatus: (id, status) =>
    request(`/orders/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: { status },
      tokenKey: 'sneakerco_admin_token',
    }),

  getAdminCustomers: (params = {}) =>
    request(`/customers${query(params)}`, {
      tokenKey: 'sneakerco_admin_token',
    }),

  updateCustomer: (id, payload) =>
    request(`/customers/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: payload,
      tokenKey: 'sneakerco_admin_token',
    }),

  // Coupons
  getAvailableCoupons: () =>
    request('/coupons/available'),

  validateCoupon: (payload) =>
    request('/coupons/validate', {
      method: 'POST',
      body: payload,
    }),

  getCoupons: () =>
    request('/coupons', {
      tokenKey: 'sneakerco_admin_token',
    }),

  createCoupon: (payload) =>
    request('/coupons', {
      method: 'POST',
      body: payload,
      tokenKey: 'sneakerco_admin_token',
    }),

  updateCoupon: (id, payload) =>
    request(`/coupons/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: payload,
      tokenKey: 'sneakerco_admin_token',
    }),

  deleteCoupon: (id) =>
    request(`/coupons/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      tokenKey: 'sneakerco_admin_token',
    }),

  // Offers
  getOffers: (params = {}) =>
    request(`/offers${query(params)}`, {
      tokenKey: 'sneakerco_admin_token',
    }),

  createOffer: (payload) =>
    request('/offers', {
      method: 'POST',
      body: payload,
      tokenKey: 'sneakerco_admin_token',
    }),

  updateOffer: (id, payload) =>
    request(`/offers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: payload,
      tokenKey: 'sneakerco_admin_token',
    }),

  deleteOffer: (id) =>
    request(`/offers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      tokenKey: 'sneakerco_admin_token',
    }),

  // Categories
  getAdminCategories: () =>
    request('/categories/admin/list', {
      tokenKey: 'sneakerco_admin_token',
    }),

  createCategory: (payload) =>
    request('/categories', {
      method: 'POST',
      body: payload,
      tokenKey: 'sneakerco_admin_token',
    }),

  updateCategory: (id, payload) =>
    request(`/categories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: payload,
      tokenKey: 'sneakerco_admin_token',
    }),

  deleteCategory: (id) =>
    request(`/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      body: undefined,
      tokenKey: 'sneakerco_admin_token',
    }),

  // Dashboard and analytics
  getDashboardStats: () =>
    request('/stats/dashboard', {
      tokenKey: 'sneakerco_admin_token',
    }),

  getAnalytics: () =>
    request('/stats/analytics', {
      tokenKey: 'sneakerco_admin_token',
    }),
};
