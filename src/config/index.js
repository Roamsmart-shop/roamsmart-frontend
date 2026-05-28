// src/config/index.js

// ========== DISABLE CONSOLE LOGS IN PRODUCTION ==========
if (process.env.NODE_ENV === 'production') {
  // Store original console methods
  const noop = () => {};
  
  // Disable console methods (keep error for critical debugging)
  console.log = noop;
  console.info = noop;
  console.debug = noop;
  console.warn = noop;
  // console.error is kept for critical errors
  // console.table is kept for debugging
}

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  adminEmail: 'admin@roamsmart.shop',
  paymentEmail: 'payment@roamsmart.shop',
  phone: '0557388622',
  whatsapp: '233557388622',
  website: 'https://roamsmart.shop',
  address: 'Accra, Ghana',
  year: new Date().getFullYear()
};

// API Configuration - FIXED: Use Railway backend
const API_CONFIG = {
  // CHANGE THIS - use Railway URL, not api.roamsmart.shop
  baseUrl: process.env.REACT_APP_API_URL || 'https://roamsmart-backend-production.up.railway.app/api',
  wsUrl: process.env.REACT_APP_WS_URL || 'https://roamsmart-backend-production.up.railway.app',
  socketUrl: process.env.REACT_APP_SOCKET_URL || 'https://roamsmart-backend-production.up.railway.app',
  timeout: 30000,
  withCredentials: true
};

// Payment Configuration
const PAYMENT_CONFIG = {
  minManualAmount: 10,
  maxManualAmount: 100000,
  minWithdrawal: 50,
  agentFee: 100,
  quickAmounts: [10, 20, 50, 100, 200, 500]
};

// Validation Rules
const VALIDATION = {
  ghanaPhoneRegex: /^(024|025|026|027|028|020|054|055|059|050|057|053|056)[0-9]{7}$/,
  minPasswordLength: 6,
  maxFileSizeMB: 5,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
};

// Feature Flags
const FEATURES = {
  enableWhatsAppBot: process.env.REACT_APP_ENABLE_WHATSAPP_BOT === 'true',
  enableAFARegistration: process.env.REACT_APP_ENABLE_AFA_REGISTRATION !== 'false',
  enableWAECVouchers: process.env.REACT_APP_ENABLE_WAEC_VOUCHERS !== 'false',
  enableBillPayments: true,
  enableReferrals: true,
  enableTwoFactorAuth: true
};

// Network Configuration
const NETWORKS = {
  mtn: { name: 'MTN', color: '#FFC107', bundles: [1, 2, 5, 10, 20] },
  telecel: { name: 'Telecel', color: '#EC008C', bundles: [1, 2, 5, 10] },
  airteltigo: { name: 'AirtelTigo', color: '#ED1B24', bundles: [1, 2, 5] }
};

// Agent Tiers
const AGENT_TIERS = {
  bronze: { name: 'Bronze', minSales: 0, commission: 10, color: '#CD7F32' },
  silver: { name: 'Silver', minSales: 500, commission: 15, color: '#C0C0C0' },
  gold: { name: 'Gold', minSales: 2000, commission: 20, color: '#FFD700' },
  platinum: { name: 'Platinum', minSales: 10000, commission: 25, color: '#E5E4E2' }
};

// Support Hours
const SUPPORT_HOURS = {
  weekdays: '8:00 AM - 10:00 PM',
  weekends: '9:00 AM - 8:00 PM',
  emergency: '24/7 for urgent issues'
};

// Storage Keys
const STORAGE_KEYS = {
  token: 'roamsmart_token',
  user: 'roamsmart_user',
  tokenExpiry: 'roamsmart_token_expiry',
  theme: 'roamsmart_theme',
  cart: 'roamsmart_agent_cart'
};

// Default SEO Meta Tags
const SEO_DEFAULTS = {
  title: `${COMPANY.name} - Data & Bill Payment Solutions`,
  description: `${COMPANY.name} provides instant data bundles, WAEC vouchers, bill payments, and digital services in Ghana. Fast, secure, and reliable.`,
  keywords: 'data bundles, WAEC vouchers, bill payments, MTN data, Telecel data, AirtelTigo data, Ghana, Roamsmart',
  author: COMPANY.name,
  ogTitle: COMPANY.name,
  ogDescription: 'Get instant data bundles, WAEC vouchers, and bill payments in Ghana with 2-second delivery.',
  ogType: 'website',
  ogUrl: COMPANY.website,
  twitterCard: 'summary_large_image'
};

const config = {
  company: COMPANY,
  api: API_CONFIG,
  payment: PAYMENT_CONFIG,
  validation: VALIDATION,
  features: FEATURES,
  networks: NETWORKS,
  agentTiers: AGENT_TIERS,
  supportHours: SUPPORT_HOURS,
  storageKeys: STORAGE_KEYS,
  seo: SEO_DEFAULTS
};

export default config;