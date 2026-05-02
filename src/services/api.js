// src/services/api.js
import axios from 'axios';
// src/services/api.js
import axios from 'axios';

// Use Railway backend URL directly (Vercel environment variable will override in production)
const API_URL = process.env.REACT_APP_API_URL || 'https://roamsmart-backend-production.up.railway.app/api';

// Company Configuration
export const COMPANY_CONFIG = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  phone: '0557388622',
  website: 'https://roamsmart.shop',
  domain: 'roamsmart.shop',
  apiUrl: 'https://roamsmart-backend-production.up.railway.app'
};

// ... rest of your existing code

const STORAGE_KEYS = {
  TOKEN: 'roamsmart_token',
  USER: 'roamsmart_user',
  TOKEN_EXPIRY: 'roamsmart_token_expiry'
};

const api = axios.create({
  baseURL: API_URL,
  headers: { 
    'Content-Type': 'application/json',
    'X-Company': COMPANY_CONFIG.name,
    'X-App-Version': '2.0.0'
  },
  withCredentials: true,
  timeout: 30000 // 30 second timeout
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for debugging
    config.headers['X-Request-Time'] = Date.now().toString();
    
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('Roamsmart API request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] Response: ${response.status} ${response.config?.url}`);
    }
    return response;
  },
  (error) => {
    // Log error for debugging
    if (error.response) {
      console.error(`[API] Error ${error.response.status}: ${error.config?.url}`, error.response?.data);
    } else if (error.request) {
      console.error('[API] No response received:', error.request);
    } else {
      console.error('[API] Request error:', error.message);
    }
    
    // Only redirect on 401 Unauthorized, but not for auth endpoints
    const isAuthEndpoint = error.config?.url?.includes('/auth/');
    const isRefreshEndpoint = error.config?.url?.includes('/refresh');
    
    if (error.response?.status === 401 && !isAuthEndpoint && !isRefreshEndpoint) {
      // Clear all Roamsmart storage
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
      sessionStorage.clear();
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export const auth = {
  getToken: () => localStorage.getItem(STORAGE_KEYS.TOKEN),
  getUser: () => {
    try {
      const user = localStorage.getItem(STORAGE_KEYS.USER);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },
  setSession: (token, user) => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiry.toString());
  },
  clearSession: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
  },
  isAuthenticated: () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    return token && expiry && Date.now() < parseInt(expiry);
  }
};

// ========== PAYMENT/WALLET ENDPOINTS ==========
export const paymentAPI = {
  // MTN MoMo Payment
  initiateMomoPayment: (amount, phoneNumber, purpose = 'wallet_funding') => 
    api.post('/payment/momo/initiate', { amount, phone_number: phoneNumber, purpose }),
  verifyMomoPayment: (reference) => 
    api.post('/payment/momo/verify', { reference }),
  
  // Manual Payment
  createManualRequest: (amount, phoneNumber) => 
    api.post('/wallet/manual/request', { amount, phone_number: phoneNumber }),
  uploadProof: (requestId, file) => {
    const formData = new FormData();
    formData.append('proof', file);
    formData.append('request_id', requestId);
    return api.post('/wallet/manual/upload-proof', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  verifyManualPayment: (reference, transactionId, senderName, senderPhone) =>
    api.post('/wallet/manual/verify', { 
      reference, 
      transaction_id: transactionId,
      sender_name: senderName,
      sender_phone: senderPhone 
    }),
  getManualRequests: () => api.get('/wallet/manual/requests'),
  getRequestDetails: (requestId) => api.get(`/wallet/manual/request/${requestId}`),
  cancelRequest: (requestId) => api.delete(`/wallet/manual/request/${requestId}`),
  
  // Card Payment
  initiateCardPayment: (amount, email) => 
    api.post('/payment/card/initiate', { amount, email }),
  verifyCardPayment: (reference) => 
    api.post('/payment/card/verify', { reference }),
  
  // Wallet Operations
  getWalletBalance: () => api.get('/wallet/balance'),
  
  // ADD THIS MISSING METHOD
  getTransactions: (page = 1, limit = 20) => 
    api.get(`/wallet/transactions?page=${page}&limit=${limit}`),
  
  // ADD THIS MISSING METHOD
  getWalletTransactions: (page = 1, limit = 20) => 
    api.get(`/wallet/transactions?page=${page}&limit=${limit}`),
  
  fundWallet: (amount, method) => 
    api.post('/wallet/fund', { amount, method }),
  
  // Withdrawal for Agents
  requestAgentWithdrawal: (amount, mobileMoney) => 
    api.post('/wallet/withdraw', { amount, mobile_money: mobileMoney }),
  getWithdrawalHistory: (page = 1, limit = 20) => 
    api.get(`/wallet/withdrawals?page=${page}&limit=${limit}`)
};

// ========== AUTHENTICATION ENDPOINTS ==========
export const authAPI = {
  login: (email, password, rememberMe = false) => 
    api.post('/auth/login', { email, password, remember_me: rememberMe }),
  register: (userData) => api.post('/auth/register', userData),
  verifyCode: (code, email) => api.post('/auth/verify-code', { code, email }),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  verifyLoginCode: (code, email) => api.post('/auth/verify-login-code', { code, email }),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (currentPassword, newPassword) => 
    api.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword }),
  refreshToken: () => api.post('/auth/refresh'),
  
  // 2FA
  enable2FA: () => api.post('/auth/2fa/enable'),
  verify2FA: (code, userId) => api.post('/auth/verify-2fa', { code, user_id: userId }),
  disable2FA: () => api.post('/auth/2fa/disable'),
  
  // Sessions
  getSessions: () => api.get('/auth/sessions'),
  revokeSession: (sessionId) => api.delete(`/auth/sessions/${sessionId}`),
  revokeAllOtherSessions: () => api.delete('/auth/sessions/others'),
  
  // Social Login
  socialLogin: (provider, token) => api.post(`/auth/${provider}`, { token }),
  
  // Activity Logging
  logActivity: (action) => api.post('/auth/log-activity', { action }),
  
  // Password Reset Verification
  verifyResetCode: (code, email) => api.post('/auth/verify-reset-code', { code, email }),
  resendResetCode: (email) => api.post('/auth/resend-reset-code', { email })
};

// ========== ADMIN DASHBOARD ENDPOINTS ==========
export const adminAPI = {
  // Dashboard Stats
  getStats: () => api.get('/admin/stats'),
  getRevenueStats: (range = 'month') => api.get(`/admin/stats/revenue?range=${range}`),
  getNetworkStats: () => api.get('/admin/stats/networks'),
  getRegionalStats: () => api.get('/admin/stats/regional'),
  getLiveStats: () => api.get('/admin/live-stats'),
  getSystemHealth: () => api.get('/admin/system/health'),
  
  // User Management
  getUsers: (page = 1, limit = 50, search = '') => 
    api.get(`/admin/users?page=${page}&limit=${limit}&search=${search}`),
  getUserById: (userId) => api.get(`/admin/users/${userId}`),
  createUser: (userData) => api.post('/admin/users/create', userData),
  updateUser: (userId, userData) => api.put(`/admin/users/${userId}`, userData),
  suspendUser: (userId) => api.post(`/admin/users/${userId}/suspend`),
  activateUser: (userId) => api.post(`/admin/users/${userId}/activate`),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  bulkAdjustWallet: (data) => api.post('/admin/bulk-wallet-adjust', data),
  
  // Agent Management
  getAgents: (page = 1, limit = 50) => api.get(`/admin/agents?page=${page}&limit=${limit}`),
  getAgentRequests: () => api.get('/admin/agent-requests'),
  getAgentApplications: () => api.get('/admin/agent-applications'),
  approveAgentApplication: (applicationId) => api.post(`/admin/agent-applications/${applicationId}/approve`),
  rejectAgentApplication: (applicationId, reason) => api.post(`/admin/agent-applications/${applicationId}/reject`, { reason }),
  approveAgent: (requestId) => api.post(`/admin/agent-requests/${requestId}/approve`),
  rejectAgent: (requestId) => api.post(`/admin/agent-requests/${requestId}/reject`),
  bulkApproveAgents: (requestIds) => api.post('/admin/agent-requests/bulk-approve', { request_ids: requestIds }),
  updateAgentCommission: (agentId, commissionRate) => 
    api.put(`/admin/agents/${agentId}/commission`, { commission_rate: commissionRate }),
  getAgentPerformance: (agentId, range = 'month') => 
    api.get(`/admin/agents/${agentId}/performance?range=${range}`),
  
  // Order Management
  getOrders: (page = 1, limit = 50, status = '') => 
    api.get(`/admin/orders?page=${page}&limit=${limit}&status=${status}`),
  getOrderById: (orderId) => api.get(`/admin/orders/${orderId}`),
  updateOrderStatus: (orderId, status) => api.put(`/admin/orders/${orderId}/status`, { status }),
  verifyBulkOrder: (orderId, data) => api.post(`/admin/bulk-order/${orderId}/verify`, data),
  cancelOrder: (orderId, reason) => api.post(`/admin/orders/${orderId}/cancel`, { reason }),
  
  // Payment Management
  getManualPayments: () => api.get('/admin/manual-payments'),
  verifyManualPayment: (paymentId, data) => api.post(`/admin/manual-payments/${paymentId}/verify`, data),
  rejectManualPayment: (paymentId) => api.post(`/admin/manual-payments/${paymentId}/reject`),
  
  // Withdrawal Management
  getWithdrawals: (status = '') => api.get(`/admin/withdrawals?status=${status}`),
  approveWithdrawal: (withdrawalId) => api.post(`/admin/withdrawals/${withdrawalId}/approve`),
  rejectWithdrawal: (withdrawalId, reason) => api.post(`/admin/withdrawals/${withdrawalId}/reject`, { reason }),
  processWithdrawal: (withdrawalId) => api.post(`/admin/withdrawals/${withdrawalId}/process`),
  
  // KYC Management
  getKycRequests: (status = 'pending') => api.get(`/admin/kyc-requests?status=${status}`),
  verifyKyc: (requestId, status, notes = '') => 
    api.post(`/admin/kyc/${requestId}/verify`, { status, notes }),
  getKycDetails: (requestId) => api.get(`/admin/kyc/${requestId}`),
  
  // Announcement Management
  getAnnouncement: () => api.get('/admin/announcement'),
  createAnnouncement: (data) => api.post('/admin/announcement', data),
  updateAnnouncement: (id, data) => api.put(`/admin/announcement/${id}`, data),
  deleteAnnouncement: (id) => api.delete(`/admin/announcement/${id}`),
  
  // System Settings
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (settings) => api.put('/admin/settings', settings),
  getCommissionRates: () => api.get('/admin/settings/commissions'),
  updateCommissionRates: (rates) => api.put('/admin/settings/commissions', rates),
  
  // Backup Management
  getBackups: () => api.get('/admin/backups'),
  createBackup: (onProgress) => {
    return api.post('/admin/backup/create', null, {
      onDownloadProgress: onProgress
    });
  },
  restoreBackup: (backupId) => api.post(`/admin/backup/${backupId}/restore`),
  downloadBackup: (backupId) => api.get(`/admin/backup/${backupId}/download`, { responseType: 'blob' }),
  deleteBackup: (backupId) => api.delete(`/admin/backup/${backupId}`),
  
  // Webhook Management
  getWebhooks: () => api.get('/admin/webhooks'),
  createWebhook: (data) => api.post('/admin/webhooks', data),
  updateWebhook: (webhookId, data) => api.put(`/admin/webhooks/${webhookId}`, data),
  deleteWebhook: (webhookId) => api.delete(`/admin/webhooks/${webhookId}`),
  testWebhook: (webhookId) => api.post(`/admin/webhooks/${webhookId}/test`),
  
  // AI Analytics & Predictions
  getPredictions: () => api.get('/admin/predictions'),
  getChurnPrediction: () => api.get('/admin/predictions/churn'),
  getDemandForecast: (days = 30) => api.get(`/admin/predictions/demand?days=${days}`),
  getRevenuePrediction: (months = 3) => api.get(`/admin/predictions/revenue?months=${months}`),
  
  // Reports & Exports
  getReports: (type, startDate, endDate) => 
    api.get(`/admin/reports/${type}?start=${startDate}&end=${endDate}`),
  exportData: (type, format = 'excel') => 
    api.get(`/admin/export/${type}?format=${format}`, { responseType: 'blob' }),
  generateAnalyticsReport: (data) => api.post('/admin/reports/generate', data),
  
  // Recent Activities
  getRecentActivities: (limit = 50) => api.get(`/admin/recent-activities?limit=${limit}`),
  
  // Audit Logs
  getAuditLogs: (page = 1, limit = 50, action = '') => 
    api.get(`/admin/audit-logs?page=${page}&limit=${limit}&action=${action}`),
  
  // Bulk Operations
  bulkSendEmail: (userIds, subject, message) => 
    api.post('/admin/bulk/email', { user_ids: userIds, subject, message }),
  bulkSendSMS: (userIds, message) => 
    api.post('/admin/bulk/sms', { user_ids: userIds, message }),
  
  // Data Management
  cleanupData: (daysOld = 30) => api.post('/admin/cleanup', { days_old: daysOld }),
  optimizeDatabase: () => api.post('/admin/optimize-db'),
  
  // Admin Roles
  getAdmins: () => api.get('/admin/admins'),
  addAdmin: (email, role) => api.post('/admin/admins', { email, role }),
  removeAdmin: (adminId) => api.delete(`/admin/admins/${adminId}`),
  
  // Inventory Management
  getMasterInventory: () => api.get('/admin/inventory'),
  purchaseFromNetwork: (data) => api.post('/admin/network/purchase', data),
  
  // WAEC Management
  getWAECVouchers: () => api.get('/admin/waec/vouchers'),
  getWAECStats: () => api.get('/admin/waec/stats'),
  generateWAECVouchers: (data) => api.post('/admin/waec/generate', data),
  exportWAECVouchers: () => api.get('/admin/waec/export', { responseType: 'blob' }),
  
  // Bill Payments
  getBillPayments: () => api.get('/admin/bill-payments'),
  getBillStats: () => api.get('/admin/bill-payments/stats')
};

// ========== USER/AGENT DASHBOARD ENDPOINTS ==========
// src/services/api.js

export const userAPI = {
  // Dashboard
  getDashboard: () => api.get('/user/dashboard'),
  getUserStats: () => api.get('/user/stats'),
  getWallet: () => api.get('/user/wallet'),
  
  // Transactions & Orders
  getTransactions: (page = 1, limit = 20) => 
    api.get(`/user/transactions?page=${page}&limit=${limit}`),
  getOrders: (page = 1, limit = 20) => 
    api.get(`/user/orders?page=${page}&limit=${limit}`),
  getOrderDetails: (orderId) => api.get(`/user/orders/${orderId}`),
  
  // Data Purchase
  purchaseData: (data) => api.post('/user/purchase', data),
  getDataPlans: (network) => api.get(`/user/data-plans?network=${network}`),
  checkBalance: () => api.get('/user/balance'),
  
  // Referrals
  getReferralInfo: () => api.get('/user/referrals/info'),
  getReferrals: (page = 1, limit = 20) => 
    api.get(`/user/referrals?page=${page}&limit=${limit}`),
  getReferralStats: () => api.get('/user/referrals/stats'),
  
  // Agent Application
  applyForAgent: (formData) => api.post('/agent/apply', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAgentApplicationStatus: () => api.get('/agent/application/status'),
  
  // Loyalty Points
  getLoyaltyInfo: () => api.get('/user/loyalty'),
  redeemPoints: (points) => api.post('/user/loyalty/redeem', { points }),
  
  // Subscriptions
  getSubscriptions: () => api.get('/user/subscriptions'),
  createSubscription: (data) => api.post('/subscription/create', data),
  cancelSubscription: (subscriptionId) => api.post(`/subscription/cancel/${subscriptionId}`),
  
  // WAEC Vouchers
  getWAECVouchers: () => api.get('/waec/vouchers'),
  purchaseWAECVoucher: (examType, quantity) => 
    api.post('/waec/purchase', { exam_type: examType, quantity }),
  verifyWAECVoucher: (voucherCode) => 
    api.post('/waec/verify', { voucher_code: voucherCode }),
  
  // Bill Payments
  getBillers: () => api.get('/bills/billers'),
  validateBillAccount: (billerCode, accountNumber) => 
    api.post('/bills/validate', { biller_code: billerCode, account_number: accountNumber }),
  payBill: (data) => api.post('/bills/pay', data),
  getBillPaymentHistory: (limit = 20) => api.get(`/bills/history?limit=${limit}`),
  getBillPaymentStatus: (reference) => api.get(`/bills/status/${reference}`),
  
  // AFA Registration
  registerAFA: (formData) => api.post('/afa/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAFARegistrationStatus: (reference) => api.get(`/afa/status/${reference}`),
  
  // ========== PROFILE PICTURE METHODS ==========
  // Upload profile picture
  uploadAvatar: (file, onProgress) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return api.post('/user/avatar', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });
  },
  
  // Delete profile picture
  deleteAvatar: () => api.delete('/user/avatar'),
  
  // Get full avatar URL
  getAvatarUrl: (avatarPath) => {
    if (!avatarPath) return null;
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    return `${baseUrl}${avatarPath}`;
  },
  
  // Update profile (add this if not already present)
  updateProfile: (data) => api.put('/user/profile', data),
  
  // Change password (add this if not already present)
  changePassword: (currentPassword, newPassword) => 
    api.post('/user/change-password', { 
      current_password: currentPassword, 
      new_password: newPassword 
    }),
};

// ========== AGENT SPECIFIC ENDPOINTS ==========
export const agentAPI = {
  // Dashboard
  getDashboard: () => api.get('/agent/dashboard'),
  getStats: () => api.get('/agent/stats'),
  getPerformance: (range = 'week') => api.get(`/agent/performance?range=${range}`),
  
  // Sales & Orders
  getSales: (page = 1, limit = 20) => api.get(`/agent/sales?page=${page}&limit=${limit}`),
  sellData: (data) => api.post('/agent/sell', data),
  bulkSell: (orders) => api.post('/agent/bulk-order', { orders }),
  
  // Commissions & Earnings
  getCommissions: (page = 1, limit = 20) => 
    api.get(`/agent/commissions?page=${page}&limit=${limit}`),
  getEarnings: () => api.get('/agent/earnings'),
  requestWithdrawal: (amount, mobileMoney) => 
    api.post('/agent/withdraw', { amount, mobile_money: mobileMoney }),
  getWithdrawals: (page = 1, limit = 20) => 
    api.get(`/agent/withdrawals?page=${page}&limit=${limit}`),
  
  // Customers
  getCustomers: () => api.get('/agent/customers'),
  getCustomerDetails: (customerId) => api.get(`/agent/customers/${customerId}`),
  getCustomerOrders: (customerId) => api.get(`/agent/customers/${customerId}/orders`),
  getCustomerStats: (customerId) => api.get(`/agent/customers/${customerId}/stats`),
  addCustomer: (data) => api.post('/agent/customers', data),
  
  // Store Management
  getStore: () => api.get('/agent/store'),
  updateStore: (data) => api.post('/agent/store', data),
  getStoreProducts: () => api.get('/agent/store/products'),
  updateProductMarkup: (productId, markup) => 
    api.put(`/agent/store/products/${productId}/markup`, { markup }),
  bulkUpdateMarkup: (percentage) => 
    api.post('/agent/store/products/bulk-markup', { percentage }),
  
  // Store Orders
  getStoreOrders: (page = 1, limit = 20) => 
    api.get(`/agent/store/orders?page=${page}&limit=${limit}`),
  updateOrderStatus: (orderId, status) => 
    api.put(`/agent/orders/${orderId}/status`, { status }),
  notifyCustomer: (phone, message) => 
    api.post('/agent/order/notify-customer', { phone, message }),
  
  // Store Clients
  getStoreClients: () => api.get('/agent/store/clients'),
  
  // Cart
  getCart: () => api.get('/agent/cart'),
  addToCart: (data) => api.post('/agent/cart', data),
  updateCartItem: (itemId, quantity) => 
    api.put(`/agent/cart/${itemId}`, { quantity }),
  removeFromCart: (itemId) => api.delete(`/agent/cart/${itemId}`),
  clearCart: () => api.delete('/agent/cart'),
  
  // Price Lists
  getWholesalePrices: () => api.get('/agent/wholesale-prices'),
  getSuggestedPrices: () => api.get('/agent/suggested-prices'),
  
  // Inventory
  getInventory: () => api.get('/agent/inventory'),
  purchaseWholesale: (data) => api.post('/agent/inventory/purchase', data),
  
  // Leaderboard
  getLeaderboard: (period = 'month') => api.get(`/agent/leaderboard?period=${period}`),
  
  // WAEC for Agents
  getAgentWAECVouchers: () => api.get('/agent/waec/vouchers'),
  purchaseAgentWAECVoucher: (examType, quantity) => 
    api.post('/agent/waec/purchase', { exam_type: examType, quantity }),
  
  // Bill Payments for Agents
  getAgentBillers: () => api.get('/agent/bills/billers'),
  agentPayBill: (data) => api.post('/agent/bills/pay', data)
};

// ========== PAYMENT/WALLET ENDPOINTS ==========


// ========== NOTIFICATION ENDPOINTS ==========
export const notificationAPI = {
  getNotifications: (page = 1, limit = 20) => 
    api.get(`/notifications?page=${page}&limit=${limit}`),
  markAsRead: (notificationId) => 
    api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (notificationId) => 
    api.delete(`/notifications/${notificationId}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  updatePreferences: (preferences) => 
    api.put('/notifications/preferences', preferences)
};

// ========== SUPPORT/TICKET ENDPOINTS ==========
export const supportAPI = {
  createTicket: (subject, message, priority = 'normal') => 
    api.post('/support/tickets', { subject, message, priority }),
  getTickets: (status = 'open') => api.get(`/support/tickets?status=${status}`),
  getTicketDetails: (ticketId) => api.get(`/support/tickets/${ticketId}`),
  replyToTicket: (ticketId, message) => 
    api.post(`/support/tickets/${ticketId}/reply`, { message }),
  closeTicket: (ticketId) => api.put(`/support/tickets/${ticketId}/close`),
  getFAQs: () => api.get('/support/faqs')
};

// ========== REFERRAL ENDPOINTS ==========
export const referralAPI = {
  getReferralInfo: () => api.get('/referral/info'),
  getReferralStats: () => api.get('/referral/stats'),
  getReferrals: (page = 1, limit = 20) => 
    api.get(`/referral/list?page=${page}&limit=${limit}`),
  claimReferralBonus: (referralId) => 
    api.post(`/referral/${referralId}/claim`),
  getReferralCode: () => api.get('/referral/code'),
  generateReferralCode: () => api.post('/referral/generate')
};

// ========== PUBLIC ENDPOINTS ==========
export const publicAPI = {
  getActiveAnnouncement: () => api.get('/announcement/active'),
  getPublicStats: () => api.get('/public/stats'),
  getNetworks: () => api.get('/public/networks'),
  getDataPlans: (network) => api.get(`/public/data-plans?network=${network}`),
  subscribeNewsletter: (email) => api.post('/newsletter/subscribe', { email }),
  getFAQs: () => api.get('/public/faqs'),
  getTestimonials: () => api.get('/public/testimonials')
};

// ========== WHATSAPP BOT ENDPOINTS ==========
export const whatsappAPI = {
  linkWhatsApp: (whatsappNumber) => api.post('/whatsapp/link', { whatsapp_number: whatsappNumber }),
  unlinkWhatsApp: () => api.post('/whatsapp/unlink'),
  getWhatsAppStatus: () => api.get('/whatsapp/status'),
  sendWhatsAppMessage: (to, message) => api.post('/whatsapp/send', { to, message })
};

// ========== VERIFICATION ENDPOINTS (Alias for backward compatibility) ==========
export const verificationAPI = {
  verifyEmail: (code, email) => api.post('/auth/verify-code', { code, email }),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  verify2FA: (code, userId) => api.post('/auth/verify-2fa', { code, user_id: userId }),
  verifyPhone: (code, phone) => api.post('/auth/verify-phone', { code, phone }),
  verifyResetCode: (code, email) => api.post('/auth/verify-reset-code', { code, email })
};

// ========== UTILITY FUNCTIONS ==========
export const uploadFile = async (file, endpoint, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    }
  });
};

export const downloadFile = async (url, filename) => {
  try {
    const response = await api.get(url, { responseType: 'blob' });
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error(`${COMPANY_CONFIG.shortName} download failed:`, error);
    throw error;
  }
};

// Helper function to format API errors
export const formatApiError = (error) => {
  if (error.response) {
    return error.response.data?.message || error.response.data?.error || `${COMPANY_CONFIG.shortName} server error occurred`;
  }
  if (error.request) {
    return `Network error - unable to connect to ${COMPANY_CONFIG.shortName}`;
  }
  return error.message || 'An unexpected error occurred';
};

// Helper to get error message from response
export const getErrorMessage = (error, defaultMessage = `Something went wrong on ${COMPANY_CONFIG.shortName}`) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.error) return error.response.data.error;
  if (error.message) return error.message;
  return defaultMessage;
};

// Helper to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
  
  if (!token) return false;
  if (expiry && Date.now() > parseInt(expiry)) {
    // Token expired, clear it
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
    return false;
  }
  return true;
};

// Helper to get auth token
export const getAuthToken = () => {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
};

// Helper to set auth data after login
export const setAuthData = (token, user, rememberMe = false) => {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  
  const expiryDays = rememberMe ? 30 : 7;
  const expiry = Date.now() + (expiryDays * 24 * 60 * 60 * 1000);
  localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiry.toString());
};

// Helper to clear auth data on logout
export const clearAuthData = () => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
  sessionStorage.clear();
};

export default api;