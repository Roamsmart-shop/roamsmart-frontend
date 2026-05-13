// src/pages/AdminDashboard.js
// ========== ALL IMPORTS FIRST ==========
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';
import { 
  FaUsers, FaUserPlus, FaUserCheck, FaUserTimes, FaWallet, 
  FaMoneyBillWave, FaChartLine, FaDatabase, FaShoppingCart,
  FaCog, FaBell, FaEnvelope, FaPhoneAlt, FaCalendarAlt,
  FaSearch, FaFilter, FaDownload, FaPrint, FaEye, FaEdit,
  FaTrash, FaBan, FaCheckCircle, FaTimesCircle, FaClock,
  FaSpinner, FaExclamationTriangle, FaShieldAlt, FaRobot,
  FaChartPie, FaTrendUp, FaTrendDown, FaPercent, FaDollarSign,
  FaCreditCard, FaUniversity, FaMobileAlt, FaWhatsapp,
  FaTelegram, FaEnvelopeOpenText, FaFileInvoice, FaFileExport,
  FaStar, FaTrophy, FaMedal, FaCrown, FaFire, FaRocket,
  FaBroadcastTower, FaWifi, FaSignal, FaExclamation, FaBullhorn,
  FaStore, FaBoxes, FaTruck, FaHourglassHalf, FaGlobe, FaMapMarkerAlt,
  FaQrcode, FaFingerprint, FaShieldVirus, FaBrain, FaChartBar,
  FaHistory, FaUndo, FaCloudUploadAlt, FaKey, FaPlug, FaBellSlash,
  FaSlidersH, FaToggleOn, FaToggleOff, FaUsersCog, FaNetworkWired,
  FaGraduationCap, FaBolt, FaTint, FaTv, FaFileCsv, FaPlusCircle,
  FaMinusCircle, FaExchangeAlt, FaSync
} from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import io from 'socket.io-client';

// IMPORTANT: Register Chart.js components
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler
);

// ========== CONSTANTS ==========
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  adminEmail: 'admin@roamsmart.shop',
  paymentEmail: 'payment@roamsmart.shop',
  phone: '0557388622',
  website: 'https://roamsmart.shop',
  domain: 'roamsmart.shop'
};

// ========== HELPER FUNCTIONS ==========
const safeValue = (value, fallback = '') => {
  return value !== undefined && value !== null ? value : fallback;
};

const safeToString = (value, defaultValue = '') => {
  if (value === undefined || value === null) return defaultValue;
  return String(value);
};

const safeToUpperCase = (value, defaultValue = '') => {
  if (value === undefined || value === null) return defaultValue;
  return String(value).toUpperCase();
};

// Calculate total price based on Africa's Talking actual prices
const calculateTotalPrice = (network, sizeGb, quantity) => {
  // Africa's Talking actual prices
  const prices = {
    mtn: {
      0.02: 0.49,   // 20.46 MB
      0.04: 0.99,   // 40.91 MB
      0.39: 2.97,   // 401.63 MB
      0.81: 9.90,   // 826.72 MB
      104: 346.62,  // 106.81 GB
      209: 395.14   // 214.53 GB
    },
    airteltigo: {
      0.05: 0.98,
      0.11: 1.96,
      0.38: 2.94,
      0.54: 4.90,
      0.86: 9.80,
      1.70: 19.60,
      4.40: 49.00,
      9.90: 98.00,
      33: 196.00,
      99: 294.01,
      115.5: 343.01,
      250: 392.01
    },
    telecel: {
      0.02: 0.49,
      0.05: 0.98,
      0.11: 1.96,
      0.54: 4.90,
      0.86: 9.80,
      1.69: 19.60,
      4.50: 49.00,
      10.13: 98.00,
      33.79: 196.00,
      101.4: 294.01,
      256: 392.01
    }
  };
  
  const unitPrice = prices[network]?.[sizeGb] || 0;
  return (unitPrice * quantity).toFixed(2);
};

// ========== MAIN COMPONENT ==========
export default function AdminDashboard() {
  console.log('===== ADMIN DASHBOARD DEBUG =====');
  console.log('1. Component rendering start');

  // ========== ALL useState HOOKS FIRST ==========
  console.log('2. Initializing useState hooks...');
  
  const [stats, setStats] = useState({
    total_users: 0, total_agents: 0, pending_agents: 0, total_revenue: 0,
    total_orders: 0, pending_manual: 0, total_withdrawals: 0, pending_withdrawals: 0,
    monthly_revenue: 0, weekly_revenue: 0, daily_revenue: 0, active_users: 0,
    suspended_users: 0, total_commission_paid: 0, avg_order_value: 0,
    conversion_rate: 0, total_data_sold_gb: 0, top_network: 'MTN', peak_hour: '6 PM',
    customer_lifetime_value: 0, customer_acquisition_cost: 0, gross_merchandise_value: 0,
    total_waec_sold: 0, total_bills_paid: 0
  });
  
  const [users, setUsers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [agentRequests, setAgentRequests] = useState([]);
  const [agentApplications, setAgentApplications] = useState([]);
  const [manualPayments, setManualPayments] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('month');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showBulkApproveModal, setShowBulkApproveModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [showWAECModal, setShowWAECModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showNetworkPurchaseModal, setShowNetworkPurchaseModal] = useState(false);
  const [showDataPurchaseModal, setShowDataPurchaseModal] = useState(false);
  const [showBatchApproveModal, setShowBatchApproveModal] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('mtn');
  const [networkSales, setNetworkSales] = useState({ mtn: 0, telecel: 0, airteltigo: 0 });
  const [liveStats, setLiveStats] = useState({
    online_users: 0,
    active_purchases_per_sec: 0,
    revenue_today: 0,
    orders_today: 0,
    pending_actions: 0
  });
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const socketRef = useRef(null);
  const [announcement, setAnnouncement] = useState({
    is_active: false, message: '', type: 'info', network_affected: 'all', expires_at: ''
  });
  const [newUser, setNewUser] = useState({
    username: '', email: '', phone: '', password: '', role: 'user', wallet_balance: 0
  });
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [selectedPaymentIds, setSelectedPaymentIds] = useState([]);
  const [backups, setBackups] = useState([]);
  const [backupProgress, setBackupProgress] = useState(0);
  const [webhooks, setWebhooks] = useState([]);
  const [newWebhook, setNewWebhook] = useState({ url: '', events: [], secret: '' });
  const [kycRequests, setKycRequests] = useState([]);
  const [waecVouchers, setWaecVouchers] = useState([]);
  const [waecStats, setWaecStats] = useState({ total: 0, used: 0, available: 0 });
  const [newWAEC, setNewWAEC] = useState({ exam_type: 'WASSCE', year: new Date().getFullYear(), quantity: 100, retail_price: 20, agent_price: 18, wholesale_price: 15 });
  const [billPayments, setBillPayments] = useState([]);
  const [billStats, setBillStats] = useState({ total: 0, completed: 0, pending: 0 });
  const [masterInventory, setMasterInventory] = useState({});
  const [networkPurchase, setNetworkPurchase] = useState({ 
    product_type: 'data',
    network: 'mtn', 
    size_gb: 0.02, 
    quantity: 1,
    sms_quantity: 0,
    phone_number: COMPANY.phone
  });
  const [dataPurchase, setDataPurchase] = useState({
    network: 'mtn',
    size_gb: 10,
    quantity: 1,
    phone_number: COMPANY.phone,
    customer_name: COMPANY.name
  });
  const [predictions, setPredictions] = useState({
    next_month_revenue: 0, peak_hour_prediction: '6 PM', churn_risk_users: [],
    demand_forecast: {}
  });
  const [systemSettings, setSystemSettings] = useState({
    agent_fee: 100, min_withdrawal: 50, max_withdrawal: 10000,
    commission_rates: { bronze: 10, silver: 15, gold: 20, platinum: 25 },
    site_name: COMPANY.name,
    support_phone: COMPANY.phone,
    support_email: COMPANY.email,
    maintenance_mode: false,
    auto_approve_agents: false, min_data_purchase: 1, max_data_purchase: 100,
    fraud_detection_enabled: true, two_factor_admin: false,
    backup_frequency: 'daily', backup_retention_days: 30,
    waec_commission: 10, bill_commission: 5
  });
  const [adminRole, setAdminRole] = useState('super_admin');
  const [adminPermissions, setAdminPermissions] = useState({
    can_manage_users: true, can_manage_agents: true, can_manage_payments: true,
    can_manage_withdrawals: true, can_view_reports: true, can_manage_settings: true,
    can_broadcast: true, can_manage_backups: true
  });
  const [regionalStats, setRegionalStats] = useState([
    { region: 'Greater Accra', sales: 125000, users: 2500, agents: 45 },
    { region: 'Ashanti', sales: 89000, users: 1800, agents: 32 },
    { region: 'Western', sales: 45000, users: 900, agents: 18 },
    { region: 'Eastern', sales: 38000, users: 750, agents: 12 },
    { region: 'Central', sales: 35000, users: 700, agents: 10 },
    { region: 'Volta', sales: 28000, users: 550, agents: 8 },
    { region: 'Bono', sales: 22000, users: 450, agents: 6 },
    { region: 'Northern', sales: 18000, users: 350, agents: 5 }
  ]);
  const [africasTalkingBalance, setAfricasTalkingBalance] = useState({
    account_balance: 0,
    wallet_balance: 0,
    currency: 'GHS',
    loading: true,
    error: null
  });

  console.log('3. All useState hooks initialized');

  // ========== ALL useEffect HOOKS ==========
  console.log('4. Initializing useEffect hooks...');
  
  // Socket connection effect
  useEffect(() => {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'https://roamsmart-backend-production.up.railway.app';
    const token = localStorage.getItem('roamsmart_token');
    if (!token) return;
    
    socketRef.current = io(socketUrl, {
      path: '/socket.io',
      transports: ['polling'],
      reconnection: false,
      autoConnect: true,
      timeout: 10000
    });
    
    socketRef.current.on('connect', () => {
      console.log('Admin socket connected to:', socketUrl);
      socketRef.current.emit('admin_join', { role: adminRole });
    });
    
    socketRef.current.on('connect_error', (error) => {
      console.warn('Admin socket connection error (non-critical):', error.message);
    });
    
    socketRef.current.on('live_stats', (data) => {
      if (data) setLiveStats(data);
    });
    
    socketRef.current.on('new_order', (order) => {
      if (order) {
        showOrderNotification(order);
        fetchAllData();
      }
    });
    
    socketRef.current.on('new_agent_request', (request) => {
      if (request) {
        showAgentRequestNotification(request);
        fetchAllData();
      }
    });
    
    socketRef.current.on('admin_alert', (alert) => {
      if (alert) addNotification(alert);
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [adminRole]);

  // Data fetching on mount
  useEffect(() => {
    fetchAllData();
    fetchRecentActivities();
    fetchAnnouncement();
    fetchSystemSettings();
    fetchBackups();
    fetchWebhooks();
    fetchKycRequests();
    fetchPredictions();
    fetchWAECData();
    fetchBillPayments();
    fetchMasterInventory();
    fetchAgentApplications();
    fetchRegionalStats();
  }, []);

  // Africa's Talking balance polling
  useEffect(() => {
    fetchAfricasTalkingBalance();
    const interval = setInterval(fetchAfricasTalkingBalance, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  console.log('5. All useEffect hooks initialized');

  // ========== DATA FETCHING FUNCTIONS ==========
  
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, agentsRes, requestsRes, paymentsRes, withdrawalsRes, ordersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/agents'),
        api.get('/admin/agent-requests'),
        api.get('/admin/manual-payments'),
        api.get('/admin/withdrawals'),
        api.get('/admin/orders')
      ]);
      
      // Create user map for enriching payment data
      const usersList = usersRes?.data?.data || [];
      const usersMap = new Map();
      usersList.forEach(user => {
        usersMap.set(user.id, user);
        usersMap.set(user._id, user);
        if (user.email) usersMap.set(user.email, user);
        if (user.phone) usersMap.set(user.phone, user);
      });
      
      // Enrich manual payments with user data
      const rawPayments = paymentsRes?.data?.data || [];
      const enrichedPayments = rawPayments.map(payment => {
        let userData = null;
        
        // Try to find user by various identifiers
        if (payment.user_id) userData = usersMap.get(payment.user_id);
        if (!userData && payment.userId) userData = usersMap.get(payment.userId);
        if (!userData && payment.user) userData = usersMap.get(payment.user);
        if (!userData && payment.email) userData = usersMap.get(payment.email);
        if (!userData && payment.phone) userData = usersMap.get(payment.phone);
        
        return {
          id: payment.id || payment._id,
          amount: payment.amount || 0,
          reference: payment.reference || payment.transaction_id || 'N/A',
          proof_url: payment.proof_url || payment.proof_image || null,
          status: payment.status || 'pending',
          created_at: payment.created_at || payment.createdAt,
          updated_at: payment.updated_at || payment.updatedAt,
          username: userData?.username || payment.username || payment.user_name || 'Unknown User',
          email: userData?.email || payment.email || 'No email',
          phone: userData?.phone || payment.phone || 'No phone',
          user_id: userData?.id || userData?._id || payment.user_id || payment.userId
        };
      });
      
      const statsData = statsRes?.data?.data || {};
      setStats(statsData);
      setUsers(usersList);
      setAgents(agentsRes?.data?.data || []);
      setAgentRequests(requestsRes?.data?.data || []);
      setManualPayments(enrichedPayments);
      setWithdrawals(withdrawalsRes?.data?.data || []);
      setAllOrders(ordersRes?.data?.data || []);
      
      setNetworkSales({
        mtn: statsData.mtn_sales || 0,
        telecel: statsData.telecel_sales || 0,
        airteltigo: statsData.airteltigo_sales || 0
      });
      
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAfricasTalkingBalance = async () => {
  try {
    const res = await api.get('/admin/africastalking-balance');
    if (res.data.success) {
      setAfricasTalkingBalance({
        account_balance: res.data.data.account_balance || 0,
        wallet_balance: res.data.data.wallet_balance || 0,
        airtime_balance: res.data.data.airtime_balance || 0,
        sms_balance: res.data.data.sms_balance || 0,
        voice_balance: res.data.data.voice_balance || 0,
        currency: res.data.data.currency || 'GHS',
        loading: false,
        error: null
      });
    } else {
      setAfricasTalkingBalance(prev => ({
        ...prev,
        loading: false,
        error: res.data.error || 'Failed to fetch balance'
      }));
    }
  } catch (error) {
    console.error('Failed to fetch Africa\'s Talking balance:', error);
    setAfricasTalkingBalance(prev => ({
      ...prev,
      loading: false,
      error: 'Could not connect to Africa\'s Talking API'
    }));
  }
};

  const fetchAgentApplications = async () => {
    try {
      const res = await api.get('/admin/agent-applications');
      setAgentApplications(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch agent applications');
    }
  };

  const fetchWAECData = async () => {
    try {
      const [vouchersRes, statsRes] = await Promise.all([
        api.get('/admin/waec/vouchers'),
        api.get('/admin/waec/stats')
      ]);
      setWaecVouchers(vouchersRes.data.data || []);
      setWaecStats(statsRes.data.data || { total: 0, used: 0, available: 0 });
    } catch (error) {
      console.error('Failed to fetch WAEC data');
    }
  };

  const clearAllPayments = async () => {
  const result = await Swal.fire({
    title: 'Clear All Pending Payments?',
    text: `This will remove ${manualPayments.length} pending payments from the list.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    confirmButtonText: 'Yes, Clear All',
    cancelButtonText: 'Cancel'
  });
  
  if (result.isConfirmed) {
    setManualPayments([]);
    setSelectedPaymentIds([]);
    toast.success('All pending payments cleared from view');
  }
};

  const fetchBillPayments = async () => {
    try {
      const res = await api.get('/admin/bill-payments');
      setBillPayments(res.data.data || []);
      const stats = {
        total: (res.data.data || []).length,
        completed: (res.data.data || []).filter(b => b?.status === 'completed').length,
        pending: (res.data.data || []).filter(b => b?.status === 'pending').length
      };
      setBillStats(stats);
    } catch (error) {
      console.error('Failed to fetch bill payments');
    }
  };

  const fetchMasterInventory = async () => {
    try {
      const res = await api.get('/admin/inventory');
      setMasterInventory(res.data.data || {});
    } catch (error) {
      console.error('Failed to fetch inventory');
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const res = await api.get('/admin/recent-activities');
      setRecentActivities(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch activities');
    }
  };

  const fetchAnnouncement = async () => {
    try {
      const res = await api.get('/admin/announcement');
      if (res.data.data) setAnnouncement(res.data.data);
    } catch (error) {}
  };

  const fetchSystemSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      if (res.data.data) setSystemSettings(prev => ({ ...prev, ...res.data.data }));
    } catch (error) {}
  };

  const fetchBackups = async () => {
    try {
      const res = await api.get('/admin/backups');
      setBackups(res.data.data || []);
    } catch (error) {}
  };

  const fetchWebhooks = async () => {
    try {
      const res = await api.get('/admin/webhooks');
      setWebhooks(res.data.data || []);
    } catch (error) {}
  };

  const fetchKycRequests = async () => {
    try {
      const res = await api.get('/admin/kyc-requests');
      setKycRequests(res.data.data || []);
    } catch (error) {}
  };

  const fetchRegionalStats = async () => {
    try {
      const res = await api.get('/admin/stats/regional');
      setRegionalStats(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch regional stats');
    }
  };

  const fetchPredictions = async () => {
    try {
      const res = await api.get('/admin/predictions');
      setPredictions(res.data.data || {
        next_month_revenue: stats.total_revenue * 1.1 || 0,
        peak_hour_prediction: '6 PM',
        churn_risk_users: [],
        demand_forecast: {}
      });
    } catch (error) {
      console.error('Failed to fetch predictions');
      setPredictions({
        next_month_revenue: 0,
        peak_hour_prediction: '6 PM',
        churn_risk_users: [],
        demand_forecast: {}
      });
    }
  };

  // ========== NOTIFICATION FUNCTIONS ==========
  const showOrderNotification = (order) => {
    const notification = {
      id: Date.now(),
      type: 'order',
      title: 'New Order!',
      message: `₵${order?.amount || 0} from ${order?.customer_phone || 'Unknown'}`,
      time: new Date(),
      read: false
    };
    setNotifications(prev => [notification, ...prev]);
    toast.success(
      <div>
        <strong>🛒 New Order at {COMPANY.shortName}!</strong>
        <p>₵{order?.amount || 0} from {order?.customer_phone || 'Unknown'}</p>
      </div>,
      { duration: 5000 }
    );
  };

  const showAgentRequestNotification = (request) => {
    const notification = {
      id: Date.now(),
      type: 'agent',
      title: 'New Agent Request!',
      message: `${request?.username || 'Someone'} wants to become an agent`,
      time: new Date(),
      read: false
    };
    setNotifications(prev => [notification, ...prev]);
    toast.success(
      <div>
        <strong>👤 New Agent Request at {COMPANY.shortName}!</strong>
        <p>{request?.username || 'Someone'} wants to become an agent</p>
      </div>,
      { duration: 5000 }
    );
  };

  const addNotification = (alert) => {
    const notification = {
      id: Date.now(),
      type: alert?.type || 'info',
      title: alert?.title || 'Alert',
      message: alert?.message || '',
      time: new Date(),
      read: false
    };
    setNotifications(prev => [notification, ...prev]);
  };

  // ========== SIMPLIFIED PAYMENT APPROVAL FUNCTIONS ==========
  
  // One-click approval - no extra input needed
const approvePaymentSimple = async (payment) => {
  console.log("=== APPROVE PAYMENT DEBUG ===");
  console.log("Payment object:", payment);
  console.log("Payment ID:", payment.id);
  console.log("Current manualPayments before removal:", manualPayments.map(p => ({ id: p.id, reference: p.reference })));
  
  const result = await Swal.fire({
    title: 'Approve Payment?',
    html: `
      <div style="text-align: left;">
        <p>Are you sure you want to approve this payment?</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p><strong>💰 Amount:</strong> ₵${payment.amount}</p>
          <p><strong>👤 User:</strong> ${payment.username}</p>
          <p><strong>📱 Phone:</strong> ${payment.phone}</p>
          <p><strong>🆔 Reference:</strong> ${payment.reference}</p>
          <p><strong>🆔 ID:</strong> ${payment.id}</p>
        </div>
        <p style="color: #28a745;">✅ The user's wallet will be credited automatically.</p>
      </div>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#28a745',
    confirmButtonText: '✓ Yes, Approve Payment',
    cancelButtonText: 'Cancel'
  });
  
  if (result.isConfirmed) {
    let loadingToast;
    try {
      loadingToast = toast.loading('Approving payment and crediting wallet...');
      
      const response = await api.post(`/admin/manual-payments/${payment.id}/approve-simple`);
      
      toast.dismiss(loadingToast);
      
      console.log("API Response:", response.data);
      
      if (response.data.success) {
        toast.success(`✅ Payment of ₵${payment.amount} approved and credited to ${payment.username}!`);
        
        // Try multiple ways to remove the payment
        console.log("Removing payment with ID:", payment.id);
        
        // Method 1: Filter by id
        const newPayments = manualPayments.filter(p => {
          const shouldKeep = p.id !== payment.id;
          console.log(`  Payment ${p.id} (${p.reference}): keep=${shouldKeep}`);
          return shouldKeep;
        });
        
        console.log("New payments count:", newPayments.length);
        setManualPayments(newPayments);
        
        // Method 2: Also try direct filter (as backup)
        setManualPayments(prev => {
          const filtered = prev.filter(p => p.id !== payment.id);
          console.log("State update - prev count:", prev.length, "new count:", filtered.length);
          return filtered;
        });
        
        // Remove from selected payments
        setSelectedPaymentIds(prevIds => {
          const newIds = prevIds.filter(id => id !== payment.id);
          console.log("Selected IDs before:", prevIds, "after:", newIds);
          return newIds;
        });
        
        // Refresh other data for balance update
        await fetchAllData();
        fetchRecentActivities();
        
        addNotification({
          type: 'success',
          title: 'Payment Approved',
          message: `₵${payment.amount} credited to ${payment.username}`
        });
      } else {
        toast.error(response.data.error || 'Failed to approve payment');
      }
      
    } catch (error) {
      console.error('Approval error:', error);
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }
      toast.error(error.response?.data?.error || 'Failed to approve payment');
    }
  }
};

  // Batch approve multiple payments
const batchApprovePayments = async () => {
  if (selectedPaymentIds.length === 0) {
    toast.error('No payments selected');
    return;
  }
  
  const selectedPaymentsData = manualPayments.filter(p => selectedPaymentIds.includes(p.id));
  const totalAmount = selectedPaymentsData.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const result = await Swal.fire({
    title: `Approve ${selectedPaymentIds.length} Payments?`,
    html: `
      <div style="text-align: left;">
        <p>You are about to approve ${selectedPaymentIds.length} pending payments.</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p><strong>💰 Total Amount:</strong> ₵${totalAmount.toFixed(2)}</p>
          <p><strong>👥 Affected Users:</strong> ${selectedPaymentIds.length}</p>
        </div>
        <p style="color: #ff9800;">⚠️ All selected users will be credited automatically.</p>
      </div>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#28a745',
    confirmButtonText: '✓ Approve All',
    cancelButtonText: 'Cancel'
  });
  
  if (result.isConfirmed) {
    try {
      const loadingToast = toast.loading(`Approving ${selectedPaymentIds.length} payments...`);  // <-- ADD THIS LINE
      
      await api.post('/admin/manual-payments/batch-approve', { 
        payment_ids: selectedPaymentIds 
      });
      
      toast.dismiss(loadingToast);
      toast.success(`✅ Successfully approved ${selectedPaymentIds.length} payments!`);
      
      // Remove all approved payments from the list
      setManualPayments(prevPayments => 
        prevPayments.filter(p => !selectedPaymentIds.includes(p.id))
      );
      
      // Clear selected payments
      setSelectedPaymentIds([]);
      setShowBatchApproveModal(false);
      
      // Refresh other data
      fetchAllData();
      fetchRecentActivities();
      
    } catch (error) {
      let loadingToast;
      console.error('Batch approval error:', error);
      if (typeof loadingToast !== 'undefined') {
        toast.dismiss(loadingToast);
      }
      toast.error(error.response?.data?.error || 'Failed to batch approve payments');
    }
  }
};
  // ========== PAYMENT PROOF VIEWING FUNCTIONS ==========

const viewPaymentProof = (proofUrl) => {
  console.log("View Proof clicked. URL:", proofUrl);
  
  if (!proofUrl) {
    toast.error('No proof document available');
    return;
  }
  
  // Check for invalid values
  if (proofUrl === 'No proof' || proofUrl === 'N/A' || proofUrl === 'null' || proofUrl === 'undefined') {
    toast.error('No valid proof document was uploaded');
    return;
  }
  
  // Validate URL format
  try {
    // Check if it's a valid URL
    if (proofUrl.startsWith('http://') || proofUrl.startsWith('https://')) {
      window.open(proofUrl, '_blank', 'noopener,noreferrer');
    } else {
      // If it's a relative path, prepend your API base URL
      const fullUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/${proofUrl}`;
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    }
    toast.success('Opening proof document...');
  } catch (error) {
    console.error('Error opening proof:', error);
    toast.error('Could not open proof document');
  }
};

const downloadProofDocument = async (proofUrl, filename) => {
  console.log("Download Proof clicked. URL:", proofUrl);
  
  if (!proofUrl || proofUrl === 'No proof' || proofUrl === 'N/A') {
    toast.error('No document available to download');
    return;
  }
  
  try {
    toast.loading('Downloading document...');
    
    let url = proofUrl;
    if (!url.startsWith('http')) {
      url = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/${proofUrl}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || `payment_proof_${Date.now()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
    
    toast.dismiss();
    toast.success('Document downloaded successfully');
  } catch (error) {
    console.error('Download error:', error);
    toast.dismiss();
    toast.error('Failed to download. Opening in new tab instead.');
    window.open(proofUrl.startsWith('http') ? proofUrl : `${process.env.REACT_APP_API_URL}/uploads/${proofUrl}`, '_blank');
  }
};

  const rejectManualPayment = async (paymentId) => {
  const { value: rejectionReason } = await Swal.fire({
    title: 'Reject Payment',
    html: `
      <div style="text-align: left;">
        <p>Are you sure you want to reject this payment?</p>
        <div style="margin-top: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Rejection Reason:</label>
          <textarea id="reason" class="swal2-textarea" placeholder="Enter reason for rejection..." rows="4" style="width: 100%;"></textarea>
          <small style="color: #666; display: block; margin-top: 5px;">This reason will be shown to the user.</small>
        </div>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    confirmButtonText: 'Yes, Reject Payment',
    cancelButtonText: 'Cancel',
    preConfirm: () => {
      const reason = document.getElementById('reason').value;
      if (!reason) {
        Swal.showValidationMessage('Please provide a rejection reason');
        return false;
      }
      return reason;
    }
  });
  
  if (rejectionReason) {
    try {
      await api.post(`/admin/manual-payments/${paymentId}/reject`, { reason: rejectionReason });
      toast.error('Payment rejected. User has been notified.');
      
      // CRITICAL: Remove the rejected payment from the list
      setManualPayments(prevPayments => prevPayments.filter(p => p.id !== paymentId));
      
      // Also remove from selected payments if it was selected
      setSelectedPaymentIds(prevIds => prevIds.filter(id => id !== paymentId));
      
      fetchAllData();
      fetchRecentActivities();
      
    } catch (error) {
      toast.error('Failed to reject payment');
    }
  }
};

  // ========== ANNOUNCEMENT FUNCTIONS ==========
  const createAnnouncement = async () => {
    if (!announcement.message.trim()) {
      toast.error('Please enter an announcement message');
      return;
    }
    try {
      await api.post('/admin/announcement', announcement);
      toast.success('Announcement published on Roamsmart!');
      setShowAnnouncementModal(false);
      fetchAnnouncement();
      socketRef.current?.emit('broadcast_announcement', announcement);
      
      setAnnouncement({
        is_active: true,
        message: '',
        type: 'info',
        network_affected: 'all',
        expires_at: ''
      });
    } catch (error) {
      toast.error('Failed to publish announcement');
    }
  };

  const deactivateAnnouncement = async () => {
    try {
      await api.delete('/admin/announcement');
      toast.success('Announcement removed');
      setAnnouncement({ ...announcement, is_active: false, message: '' });
      socketRef.current?.emit('remove_announcement');
    } catch (error) {
      toast.error('Failed to remove announcement');
    }
  };

  // ========== AGENT APPLICATION MANAGEMENT ==========
  const approveAgentApplication = async (applicationId) => {
    try {
      await api.post(`/admin/agent-applications/${applicationId}/approve`);
      toast.success('Agent application approved! Welcome to Roamsmart!');
      fetchAgentApplications();
      fetchAllData();
      addNotification({
        type: 'success',
        title: 'Agent Approved',
        message: 'Agent application has been approved for Roamsmart platform'
      });
    } catch (error) {
      toast.error('Failed to approve application');
    }
  };

  const rejectAgentApplication = async (applicationId) => {
    const { value: rejectionReason } = await Swal.fire({
      title: 'Reject Application',
      input: 'textarea',
      inputPlaceholder: 'Enter rejection reason...',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Reject'
    });
    
    if (rejectionReason) {
      try {
        await api.post(`/admin/agent-applications/${applicationId}/reject`, { reason: rejectionReason });
        toast.success('Agent application rejected');
        fetchAgentApplications();
      } catch (error) {
        toast.error('Failed to reject application');
      }
    }
  };

  // ========== WAEC MANAGEMENT ==========
  const generateWAECVouchers = async () => {
    try {
      const res = await api.post('/admin/waec/generate', newWAEC);
      if (res.data.success) {
        toast.success(`Generated ${newWAEC.quantity} ${newWAEC.exam_type} vouchers for Roamsmart`);
        setShowWAECModal(false);
        fetchWAECData();
        setNewWAEC({ exam_type: 'WASSCE', year: new Date().getFullYear(), quantity: 100, retail_price: 20, agent_price: 18, wholesale_price: 15 });
      }
    } catch (error) {
      toast.error('Failed to generate vouchers');
    }
  };

  const exportWAECVouchers = async () => {
    try {
      const response = await api.get('/admin/waec/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `roamsmart_waec_vouchers_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('WAEC vouchers exported');
    } catch (error) {
      toast.error('Failed to export');
    }
  };

  // ========== NETWORK INVENTORY MANAGEMENT ==========
  const purchaseFromNetwork = async () => {
    try {
      const res = await api.post('/admin/network/purchase', networkPurchase);
      if (res.data.success) {
        toast.success(res.data.message || `Roamsmart purchased ${networkPurchase.quantity}x ${networkPurchase.size_gb}GB from ${safeToUpperCase(networkPurchase.network)}`);
        setShowNetworkPurchaseModal(false);
        fetchMasterInventory();
        fetchAfricasTalkingBalance(); // Refresh balance after purchase
        setNetworkPurchase({ 
          product_type: 'data',
          network: 'mtn', 
          size_gb: 0.02, 
          quantity: 1,
          sms_quantity: 0,
          phone_number: COMPANY.phone
        });
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error(error.response?.data?.error || 'Purchase failed');
    }
  };

  const purchaseDataFromNetwork = async () => {
    try {
      const totalGB = dataPurchase.size_gb * dataPurchase.quantity;
      
      const { value: customPrice } = await Swal.fire({
        title: '💰 Enter Purchase Amount',
        html: `
          <div style="text-align: left;">
            <p><strong>Network:</strong> ${dataPurchase.network.toUpperCase()}</p>
            <p><strong>Bundle Size:</strong> ${dataPurchase.size_gb} GB each</p>
            <p><strong>Quantity:</strong> ${dataPurchase.quantity}</p>
            <p><strong>Total GB:</strong> ${totalGB} GB</p>
            <hr/>
            <label style="display: block; margin: 10px 0;"><strong>Amount to Pay (GHS):</strong></label>
            <input id="purchase-amount" class="swal2-input" type="number" step="0.01" placeholder="Enter amount in GHS" style="width: 100%;">
            <small style="color: #666;">Enter the amount you want to pay for this data bundle</small>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#8B0000',
        confirmButtonText: 'Confirm Purchase',
        cancelButtonText: 'Cancel',
        preConfirm: () => {
          const amount = document.getElementById('purchase-amount').value;
          if (!amount || parseFloat(amount) <= 0) {
            Swal.showValidationMessage('Please enter a valid amount');
            return false;
          }
          return parseFloat(amount);
        }
      });
      
      if (customPrice) {
        const confirmResult = await Swal.fire({
          title: 'Confirm Purchase',
          html: `
            <div style="text-align: left;">
              <p><strong>Network:</strong> ${dataPurchase.network.toUpperCase()}</p>
              <p><strong>Bundle:</strong> ${dataPurchase.size_gb} GB × ${dataPurchase.quantity} = ${totalGB} GB</p>
              <p><strong>Amount to Pay:</strong> <strong class="text-success">GHS ${customPrice.toFixed(2)}</strong></p>
              <p><strong>Phone Number:</strong> ${dataPurchase.phone_number}</p>
              <hr/>
              <p class="text-muted" style="font-size: 12px;">⚠️ This amount will be deducted from your Africa's Talking balance.</p>
            </div>
          `,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#28a745',
          confirmButtonText: 'Yes, Purchase',
          cancelButtonText: 'Cancel'
        });
        
        if (confirmResult.isConfirmed) {
          const payload = {
            ...dataPurchase,
            total_gb: totalGB,
            amount_paid: customPrice
          };
          
          const res = await api.post('/admin/purchase-data', payload);
          if (res.data.success) {
            toast.success(`Successfully purchased ${totalGB} GB from ${dataPurchase.network.toUpperCase()} for GHS ${customPrice.toFixed(2)}!`);
            setShowDataPurchaseModal(false);
            fetchMasterInventory();
            fetchAfricasTalkingBalance();
            setDataPurchase({
              network: 'mtn',
              size_gb: 10,
              quantity: 1,
              phone_number: COMPANY.phone,
              customer_name: COMPANY.name
            });
          }
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Purchase failed');
    }
  };

  // ========== AGENT MANAGEMENT ==========
  const approveAgent = async (requestId) => {
    try {
      await api.post(`/admin/agent-requests/${requestId}/approve`);
      toast.success('Agent approved successfully for Roamsmart!');
      fetchAllData();
      fetchRecentActivities();
      addNotification({
        type: 'success',
        title: 'Agent Approved',
        message: 'Agent request has been approved for Roamsmart platform'
      });
    } catch (error) {
      toast.error('Failed to approve agent');
    }
  };

  const rejectAgent = async (requestId) => {
    const result = await Swal.fire({
      title: 'Reject Agent Request?',
      text: 'The user will be notified of the rejection.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Yes, Reject',
      cancelButtonText: 'Cancel'
    });
    if (result.isConfirmed) {
      try {
        await api.post(`/admin/agent-requests/${requestId}/reject`);
        toast.success('Agent request rejected');
        fetchAllData();
      } catch (error) {
        toast.error('Failed to reject request');
      }
    }
  };

  const bulkApproveAgents = async () => {
    if (selectedRequests.length === 0) {
      toast.error('No requests selected');
      return;
    }
    const result = await Swal.fire({
      title: `Approve ${selectedRequests.length} Agents?`,
      text: 'All selected agent requests will be approved for Roamsmart.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      confirmButtonText: 'Yes, Approve All',
      cancelButtonText: 'Cancel'
    });
    if (result.isConfirmed) {
      try {
        await api.post('/admin/agent-requests/bulk-approve', { request_ids: selectedRequests });
        toast.success(`${selectedRequests.length} agents approved for Roamsmart!`);
        setSelectedRequests([]);
        setShowBulkApproveModal(false);
        fetchAllData();
      } catch (error) {
        toast.error('Failed to bulk approve');
      }
    }
  };

  // ========== KYC VERIFICATION ==========
  const verifyKyc = async (requestId, status) => {
    try {
      await api.post(`/admin/kyc/${requestId}/verify`, { status });
      toast.success(`KYC ${status === 'approved' ? 'approved' : 'rejected'} for Roamsmart`);
      fetchKycRequests();
    } catch (error) {
      toast.error('Failed to process KYC');
    }
  };

  // ========== WITHDRAWAL MANAGEMENT ==========
  const approveWithdrawal = async (withdrawalId) => {
    const result = await Swal.fire({
      title: 'Approve Withdrawal?',
      text: 'This will send money to the agent\'s mobile money account.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      confirmButtonText: 'Yes, Approve',
      cancelButtonText: 'Cancel'
    });
    if (result.isConfirmed) {
      try {
        await api.post(`/admin/withdrawals/${withdrawalId}/approve`);
        toast.success('Withdrawal approved!');
        fetchAllData();
        addNotification({
          type: 'success',
          title: 'Withdrawal Approved',
          message: 'Agent withdrawal has been processed by Roamsmart'
        });
      } catch (error) {
        toast.error('Failed to approve withdrawal');
      }
    }
  };

  // ========== USER MANAGEMENT ==========
  const suspendUser = async (userId) => {
    const result = await Swal.fire({
      title: 'Suspend User?',
      text: 'This user will not be able to make purchases on Roamsmart.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Yes, Suspend',
      cancelButtonText: 'Cancel'
    });
    if (result.isConfirmed) {
      try {
        await api.post(`/admin/users/${userId}/suspend`);
        toast.success('User suspended successfully from Roamsmart');
        fetchAllData();
      } catch (error) {
        toast.error('Failed to suspend user');
      }
    }
  };

  const activateUser = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/activate`);
      toast.success('User activated successfully on Roamsmart');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to activate user');
    }
  };

  const createUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.phone) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      await api.post('/admin/users/create', newUser);
      toast.success(`User ${newUser.username} created successfully on Roamsmart!`);
      setShowCreateUserModal(false);
      setNewUser({ username: '', email: '', phone: '', password: '', role: 'user', wallet_balance: 0 });
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create user');
    }
  };

  const bulkAdjustWallet = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Bulk Wallet Adjustment',
      html: `
        <select id="user_type" class="swal2-select">
          <option value="all">All Users</option>
          <option value="agents">All Agents</option>
          <option value="inactive">Inactive Users (>30 days)</option>
        </select>
        <select id="action" class="swal2-select">
          <option value="credit">Credit (+)</option>
          <option value="debit">Debit (-)</option>
        </select>
        <input id="amount" class="swal2-input" placeholder="Amount (GHS)" type="number">
        <input id="reason" class="swal2-input" placeholder="Reason for adjustment">
      `,
      preConfirm: () => ({
        user_type: document.getElementById('user_type').value,
        action: document.getElementById('action').value,
        amount: parseFloat(document.getElementById('amount').value),
        reason: document.getElementById('reason').value
      })
    });
    
    if (formValues && formValues.amount) {
      try {
        await api.post('/admin/bulk-wallet-adjust', formValues);
        toast.success('Bulk wallet adjustment completed on Roamsmart');
        fetchAllData();
      } catch (error) {
        toast.error('Failed to process bulk adjustment');
      }
    }
  };

  // ========== BACKUP MANAGEMENT ==========
  const createBackup = async () => {
    setBackupProgress(0);
    try {
      const response = await api.post('/admin/backup/create', {}, {
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setBackupProgress(percentCompleted);
        }
      });
      toast.success(`Roamsmart backup created successfully!`);
      fetchBackups();
      setShowBackupModal(false);
      setBackupProgress(0);
    } catch (error) {
      toast.error('Failed to create backup');
      setBackupProgress(0);
    }
  };

  const restoreBackup = async (backupId) => {
    const result = await Swal.fire({
      title: 'Restore Backup?',
      text: 'This will replace all current Roamsmart data. This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Yes, Restore'
    });
    if (result.isConfirmed) {
      try {
        await api.post(`/admin/backup/${backupId}/restore`);
        toast.success('Backup restored successfully for Roamsmart!');
        fetchAllData();
      } catch (error) {
        toast.error('Failed to restore backup');
      }
    }
  };

  // ========== WEBHOOK MANAGEMENT ==========
  const createWebhook = async () => {
    if (!newWebhook.url) {
      toast.error('Please enter webhook URL');
      return;
    }
    try {
      await api.post('/admin/webhooks', newWebhook);
      toast.success('Webhook created successfully for Roamsmart!');
      setNewWebhook({ url: '', events: [], secret: '' });
      fetchWebhooks();
      setShowWebhookModal(false);
    } catch (error) {
      toast.error('Failed to create webhook');
    }
  };

  // ========== EXPORT FUNCTIONS ==========
  const exportUsersToExcel = () => {
    const exportData = users.map(user => ({
      ID: user?.id || '',
      Username: user?.username || '',
      Email: user?.email || '',
      Phone: user?.phone || '',
      Role: user?.is_agent ? 'Agent' : 'User',
      'Wallet Balance': user?.wallet_balance || 0,
      'Total Spent': user?.total_spent || 0,
      'Join Date': user?.created_at ? new Date(user.created_at).toLocaleDateString() : '',
      Status: user?.is_suspended ? 'Suspended' : 'Active'
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Roamsmart_Users`);
    XLSX.writeFile(wb, `roamsmart_users_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Users exported from Roamsmart!');
  };

  // ========== ORDER FUNCTIONS ==========
  const createOrder = async (orderData) => {
    try {
      const response = await api.post('/api/order', {
        network: orderData.network,
        size_gb: orderData.size_gb,
        phone: orderData.phone,
        payment_method: 'wallet',
        quantity: orderData.quantity
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        // Update user's wallet balance
        // Show success with actual data delivered
        if (response.data.data.actual_data_gb) {
          toast.info(`You will receive ${response.data.data.actual_data_gb}GB per bundle`);
        }
        return response.data;
      }
    } catch (error) {
      console.error('Order error:', error);
      toast.error(error.response?.data?.error || 'Order failed');
    }
  };

  // ========== CHART DATA ==========
  const getRevenueChartData = () => {
    let labels = [];
    let data = [];
    
    if (dateRange === 'week') {
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      data = [
        stats.monday_revenue || 0,
        stats.tuesday_revenue || 0,
        stats.wednesday_revenue || 0,
        stats.thursday_revenue || 0,
        stats.friday_revenue || 0,
        stats.saturday_revenue || 0,
        stats.sunday_revenue || 0,
      ];
    } else if (dateRange === 'month') {
      labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      data = [
        stats.week1_revenue || 0,
        stats.week2_revenue || 0,
        stats.week3_revenue || 0,
        stats.week4_revenue || 0,
      ];
    } else {
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      data = [
        stats.jan_revenue || 0, stats.feb_revenue || 0, stats.mar_revenue || 0,
        stats.apr_revenue || 0, stats.may_revenue || 0, stats.jun_revenue || 0,
        stats.jul_revenue || 0, stats.aug_revenue || 0, stats.sep_revenue || 0,
        stats.oct_revenue || 0, stats.nov_revenue || 0, stats.dec_revenue || 0,
      ];
    }
    
    return {
      labels,
      datasets: [{ 
        label: `${COMPANY.shortName} Revenue (GHS)`, 
        data, 
        backgroundColor: '#8B0000',
        borderColor: '#D2691E',
        borderWidth: 2,
        borderRadius: 8,
        fill: true,
        tension: 0.4
      }]
    };
  };

  const getNetworkChartData = () => {
    const total = networkSales.mtn + networkSales.telecel + networkSales.airteltigo;
    return {
      labels: ['MTN', 'Telecel', 'AirtelTigo'],
      datasets: [{ 
        data: [
          total ? (networkSales.mtn / total * 100) : 33,
          total ? (networkSales.telecel / total * 100) : 33,
          total ? (networkSales.airteltigo / total * 100) : 34,
        ], 
        backgroundColor: ['#FFC107', '#EC008C', '#ED1B24'],
        borderWidth: 0
      }]
    };
  };

  const getOrderStatusChartData = () => {
    const completed = allOrders.filter(o => o?.status === 'completed').length;
    const pending = allOrders.filter(o => o?.status === 'pending').length;
    const failed = allOrders.filter(o => o?.status === 'failed').length;
    
    return {
      labels: ['Completed', 'Pending', 'Failed'],
      datasets: [{ 
        data: [completed, pending, failed], 
        backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
        borderWidth: 0
      }]
    };
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading {COMPANY.name} Admin Dashboard...</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-dashboard">
      {/* Notification Bell */}
      <div className="notification-bell" onClick={() => setShowNotifications(!showNotifications)}>
        <FaBell />
        {notifications.filter(n => !n.read).length > 0 && (
          <span className="notification-badge">{notifications.filter(n => !n.read).length}</span>
        )}
      </div>
      
      {/* Notifications Dropdown */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div className="notifications-dropdown" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="notifications-header">
              <h4>{COMPANY.shortName} Notifications</h4>
              <button onClick={() => setNotifications([])}>Clear all</button>
            </div>
            <div className="notifications-list">
              {notifications.length === 0 ? (
                <p className="no-notifications">No notifications</p>
              ) : (
                notifications.map(notif => (
                  <div key={notif.id} className={`notification-item ${notif.read ? '' : 'unread'}`}>
                    <div className="notification-icon">
                      {notif.type === 'order' && <FaShoppingCart />}
                      {notif.type === 'agent' && <FaUserPlus />}
                      {notif.type === 'success' && <FaCheckCircle />}
                      {notif.type === 'warning' && <FaExclamationTriangle />}
                    </div>
                    <div className="notification-content">
                      <strong>{notif.title}</strong>
                      <p>{notif.message}</p>
                      <small>{new Date(notif.time).toLocaleTimeString()}</small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Stats Bar */}
      <div className="live-stats-bar">
        <div className="live-stat"><FaWifi className="live-icon" /><span>{liveStats.online_users || 0} Online on {COMPANY.shortName}</span></div>
        <div className="live-stat"><FaRocket className="live-icon" /><span>{liveStats.active_purchases_per_sec || 0}/sec Purchases</span></div>
        <div className="live-stat"><FaMoneyBillWave className="live-icon" /><span>₵{liveStats.revenue_today || 0} Today</span></div>
        <div className="live-stat"><FaShoppingCart className="live-icon" /><span>{liveStats.orders_today || 0} Orders Today</span></div>
        <div className="live-stat"><FaClock className="live-icon" /><span>{liveStats.pending_actions || 0} Pending Actions</span></div>
      </div>

      {/* Active Announcement Banner */}
      {announcement.is_active && announcement.message && (
        <div className={`announcement-banner ${announcement.type || 'info'}`}>
          <div className="announcement-content">
            <FaBullhorn />
            <span className="announcement-message">{announcement.message}</span>
            {announcement.network_affected !== 'all' && (
              <span className="network-badge"><FaSignal /> {safeToUpperCase(announcement.network_affected)} Network</span>
            )}
            {announcement.expires_at && (
              <span className="expiry-badge"><FaClock /> Expires: {new Date(announcement.expires_at).toLocaleDateString()}</span>
            )}
          </div>
          <button onClick={deactivateAnnouncement} className="close-announcement">×</button>
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>{COMPANY.name} Admin Dashboard</h1>
          <p>Manage your platform, users, payments, and analytics</p>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={() => setShowAnnouncementModal(true)}><FaBullhorn /> Broadcast</button>
          <button className="btn-outline" onClick={() => setShowCreateUserModal(true)}><FaUserPlus /> Add User</button>
          <button className="btn-outline" onClick={bulkAdjustWallet}><FaWallet /> Bulk Wallet</button>
          <button className="btn-primary" onClick={() => setShowNetworkPurchaseModal(true)}><FaNetworkWired /> Buy from Africa's Talking</button>
          <button className="btn-outline" onClick={() => setShowDataPurchaseModal(true)}><FaDatabase /> Purchase Data</button>
          <button className="btn-outline" onClick={() => setShowWAECModal(true)}><FaGraduationCap /> Generate WAEC</button>
          <button className="btn-outline" onClick={() => setShowBackupModal(true)}><FaDatabase /> Backup</button>
          <button className="btn-outline" onClick={() => setShowSettingsModal(true)}><FaCog /> Settings</button>
          <button className="btn-primary" onClick={exportUsersToExcel}><FaFileExport /> Export Users</button>
        </div>
      </div>

      {/* Stats Grid with Africa's Talking Balance */}
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon"><FaUsers /></div><div className="stat-value">{stats.total_users || 0}</div><div className="stat-label">Total Users</div></div>
        <div className="stat-card"><div className="stat-icon"><FaUserCheck /></div><div className="stat-value">{stats.total_agents || 0}</div><div className="stat-label">Total Agents</div></div>
        <div className="stat-card warning"><div className="stat-icon"><FaClock /></div><div className="stat-value">{stats.pending_agents || 0}</div><div className="stat-label">Pending Agents</div></div>
        <div className="stat-card success"><div className="stat-icon"><FaMoneyBillWave /></div><div className="stat-value">₵{(stats.total_revenue || 0).toFixed(2)}</div><div className="stat-label">Total Revenue</div></div>
        
        {/* Africa's Talking Balance Card - Enhanced */}
        <div className="stat-card africastalking-card">
          <div className="stat-icon"><FaMobileAlt /></div>
          <div className="stat-value">
            {africasTalkingBalance.loading ? (
              <FaSpinner className="spinning" />
            ) : africasTalkingBalance.error ? (
              <span className="text-danger" style={{ fontSize: '0.8rem' }}>Error</span>
            ) : (
              `${africasTalkingBalance.currency || 'GHS'} ${parseFloat(africasTalkingBalance.wallet_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            )}
          </div>
          <div className="stat-label">
            Africa's Talking Wallet
            {!africasTalkingBalance.loading && !africasTalkingBalance.error && (
              <small style={{ display: 'block', fontSize: '0.65rem', marginTop: '5px' }}>
                💬 SMS & 📱 Data Balance
              </small>
            )}
          </div>
          <button 
            className="refresh-balance-btn" 
            onClick={fetchAfricasTalkingBalance} 
            disabled={africasTalkingBalance.loading}
            title="Refresh Balance"
          >
            <FaSync className={africasTalkingBalance.loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* Second Row Stats */}
      <div className="stats-grid secondary">
        <div className="stat-card"><div className="stat-value">₵{(stats.avg_order_value || 0).toFixed(2)}</div><div className="stat-label">Avg Order Value</div></div>
        <div className="stat-card"><div className="stat-value">{stats.conversion_rate || 0}%</div><div className="stat-label">Conversion Rate</div></div>
        <div className="stat-card"><div className="stat-value">₵{(stats.total_commission_paid || 0).toFixed(2)}</div><div className="stat-label">Commission Paid</div></div>
        <div className="stat-card"><div className="stat-value">{stats.active_users || 0}</div><div className="stat-label">Active Today</div></div>
        <div className="stat-card"><div className="stat-value">₵{(stats.customer_lifetime_value || 0).toFixed(2)}</div><div className="stat-label">Customer LTV</div></div>
        <div className="stat-card"><div className="stat-value">₵{(stats.customer_acquisition_cost || 0).toFixed(2)}</div><div className="stat-label">CAC</div></div>
      </div>

      {/* Data Purchase Modal */}
      <AnimatePresence>
        {showDataPurchaseModal && (
          <motion.div className="modal-overlay" onClick={() => setShowDataPurchaseModal(false)}>
            <motion.div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
              <button className="modal-close" onClick={() => setShowDataPurchaseModal(false)}>×</button>
              <h3><FaNetworkWired /> Purchase Data from Network</h3>
              
              <div className="form-group">
                <label>Select Network</label>
                <select 
                  value={dataPurchase.network} 
                  onChange={(e) => setDataPurchase({...dataPurchase, network: e.target.value})} 
                  className="form-control"
                >
                  <option value="mtn">MTN</option>
                  <option value="telecel">Telecel</option>
                  <option value="airteltigo">AirtelTigo</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Bundle Size (GB per unit)</label>
                <select 
                  value={dataPurchase.size_gb} 
                  onChange={(e) => setDataPurchase({...dataPurchase, size_gb: parseInt(e.target.value)})} 
                  className="form-control"
                >
                  <option value={1}>1 GB per unit</option>
                  <option value={2}>2 GB per unit</option>
                  <option value={5}>5 GB per unit</option>
                  <option value={10}>10 GB per unit</option>
                  <option value={20}>20 GB per unit</option>
                  <option value={50}>50 GB per unit</option>
                  <option value={100}>100 GB per unit</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Quantity</label>
                <input 
                  type="number" 
                  value={dataPurchase.quantity} 
                  onChange={(e) => setDataPurchase({...dataPurchase, quantity: parseInt(e.target.value)})} 
                  className="form-control" 
                  min="1" 
                  max="100"
                />
              </div>
              
              <div className="form-group">
                <label>Phone Number (for delivery)</label>
                <input 
                  type="tel" 
                  value={dataPurchase.phone_number} 
                  onChange={(e) => setDataPurchase({...dataPurchase, phone_number: e.target.value})} 
                  className="form-control" 
                  placeholder="024XXXXXXX"
                />
              </div>
              
              <div className="price-summary" style={{ background: '#f0f8ff', padding: '15px', borderRadius: '8px', margin: '15px 0' }}>
                <p><strong>📊 Summary:</strong></p>
                <p>Bundle: {dataPurchase.size_gb} GB × {dataPurchase.quantity} = <strong>{dataPurchase.size_gb * dataPurchase.quantity} GB</strong></p>
                <p className="text-muted" style={{ fontSize: '12px', marginTop: '10px' }}>
                  💡 <strong>Note:</strong> You will be asked to enter the amount you want to pay in the next step.
                  The amount will be deducted from your Africa's Talking balance.
                </p>
              </div>
              
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowDataPurchaseModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={purchaseDataFromNetwork}>
                  <FaNetworkWired /> Continue to Payment
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-card large">
          <div className="chart-header"><h3><FaChartLine /> {COMPANY.shortName} Revenue Trend</h3><select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="date-select"><option value="week">This Week</option><option value="month">This Month</option><option value="year">This Year</option></select></div>
          <Line data={getRevenueChartData()} options={{ responsive: true, maintainAspectRatio: true }} />
        </div>
        <div className="chart-card"><h3><FaChartPie /> Sales by Network</h3><Doughnut data={getNetworkChartData()} options={{ responsive: true, maintainAspectRatio: true }} /></div>
        <div className="chart-card"><h3><FaCheckCircle /> Order Status</h3><Pie data={getOrderStatusChartData()} options={{ responsive: true, maintainAspectRatio: true }} /></div>
      </div>

      {/* AI Predictions Section */}
      <div className="ai-predictions">
        <h3><FaRobot /> AI Analytics & Predictions for {COMPANY.shortName}</h3>
        <div className="predictions-grid">
          <div className="prediction-card"><FaChartLine /><div className="prediction-value">₵{(predictions.next_month_revenue || 0).toFixed(2)}</div><div className="prediction-label">Projected Next Month Revenue</div></div>
          <div className="prediction-card"><FaClock /><div className="prediction-value">{predictions.peak_hour_prediction || '6 PM'}</div><div className="prediction-label">Predicted Peak Hour</div></div>
          <div className="prediction-card warning"><FaExclamationTriangle /><div className="prediction-value">{(predictions.churn_risk_users || []).length}</div><div className="prediction-label">Users at Churn Risk</div></div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="admin-tabs">
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}><FaChartLine /> Overview</button>
        <button className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}><FaUserPlus /> Agent Applications ({agentApplications.length})</button>
        <button className={`tab-btn ${activeTab === 'agents' ? 'active' : ''}`} onClick={() => setActiveTab('agents')}><FaUserPlus /> Agent Requests ({agentRequests.length})</button>
        <button className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}><FaWallet /> Manual Payments ({manualPayments.length})</button>
        <button className={`tab-btn ${activeTab === 'withdrawals' ? 'active' : ''}`} onClick={() => setActiveTab('withdrawals')}><FaMoneyBillWave /> Withdrawals ({withdrawals.filter(w => w?.status === 'pending').length})</button>
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}><FaUsers /> All Users</button>
        <button className={`tab-btn ${activeTab === 'agents-list' ? 'active' : ''}`} onClick={() => setActiveTab('agents-list')}><FaUserCheck /> Agents List</button>
        <button className={`tab-btn ${activeTab === 'waec' ? 'active' : ''}`} onClick={() => setActiveTab('waec')}><FaGraduationCap /> WAEC Vouchers</button>
        <button className={`tab-btn ${activeTab === 'bills' ? 'active' : ''}`} onClick={() => setActiveTab('bills')}><FaBolt /> Bill Payments</button>
        <button className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}><FaDatabase /> Inventory</button>
        <button className={`tab-btn ${activeTab === 'kyc' ? 'active' : ''}`} onClick={() => setActiveTab('kyc')}><FaShieldAlt /> KYC ({kycRequests.length})</button>
        <button className={`tab-btn ${activeTab === 'webhooks' ? 'active' : ''}`} onClick={() => setActiveTab('webhooks')}><FaPlug /> Webhooks</button>
      </div>

      {/* ========== AGENT APPLICATIONS TAB ========== */}
      {activeTab === 'applications' && (
        <div className="panel">
          <h3>Pending Agent Applications</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr><th>User</th><th>Phone</th><th>Email</th><th>Amount Paid</th><th>Reference</th><th>Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {agentApplications.map(app => (
                  <tr key={app.id}>
                    <td><strong>{app?.username || 'Unknown'}</strong><br/><small>{app?.email || ''}</small></td>
                    <td>{app?.phone || 'N/A'}</td>
                    <td>{app?.email || 'N/A'}</td>
                    <td className="amount">₵{app?.amount || 0}</td>
                    <td><code>{app?.payment_reference || 'N/A'}</code></td>
                    <td>{app?.submitted_at ? new Date(app.submitted_at).toLocaleString() : 'N/A'}</td>
                    <td className="actions">
                      <button className="btn-success btn-sm" onClick={() => approveAgentApplication(app.id)}><FaCheckCircle /> Approve</button>
                      <button className="btn-danger btn-sm" onClick={() => rejectAgentApplication(app.id)}><FaTimesCircle /> Reject</button>
                      {app?.payment_proof_url && (
                        <button className="btn-info btn-sm" onClick={() => window.open(app.payment_proof_url, '_blank')}><FaEye /> Proof</button>
                      )}
                    </td>
                  </tr>
                ))}
                {agentApplications.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center">No pending applications</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== AGENT REQUESTS TAB ========== */}
      {activeTab === 'agents' && (
        <div className="panel">
          <div className="panel-header"><h3>Pending Agent Requests</h3>{agentRequests.length > 0 && <button className="btn-primary btn-sm" onClick={() => setShowBulkApproveModal(true)}>Bulk Approve ({agentRequests.length})</button>}</div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr><th><input type="checkbox" onChange={(e) => setSelectedRequests(e.target.checked ? agentRequests.map(r => r.id) : [])} /></th><th>User</th><th>Phone</th><th>Amount</th><th>Reference</th><th>Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {agentRequests.map(req => (
                  <tr key={req.id}>
                    <td><input type="checkbox" checked={selectedRequests.includes(req.id)} onChange={(e) => setSelectedRequests(e.target.checked ? [...selectedRequests, req.id] : selectedRequests.filter(id => id !== req.id))} /></td>
                    <td><strong>{req?.username || 'Unknown'}</strong><br/><small>{req?.email || ''}</small></td>
                    <td>{req?.phone || 'N/A'}</td>
                    <td className="amount">₵{req?.amount || 0}</td>
                    <td><code>{req?.payment_reference || 'N/A'}</code></td>
                    <td>{req?.created_at ? new Date(req.created_at).toLocaleString() : 'N/A'}</td>
                    <td className="actions">
                      <button className="btn-success btn-sm" onClick={() => approveAgent(req.id)}><FaCheckCircle /> Approve</button>
                      <button className="btn-danger btn-sm" onClick={() => rejectAgent(req.id)}><FaTimesCircle /> Reject</button>
                      <button className="btn-info btn-sm" onClick={() => Swal.fire({ title: 'Agent Request Details', html: `<p><strong>User:</strong> ${req?.username || 'Unknown'}</p><p><strong>Phone:</strong> ${req?.phone || 'N/A'}</p><p><strong>Amount:</strong> ₵${req?.amount || 0}</p>` })}><FaEye /> View</button>
                    </td>
                  </tr>
                ))}
                {agentRequests.length === 0 && <tr><td colSpan="7" className="text-center">No pending requests</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== MANUAL PAYMENTS TAB - SIMPLIFIED ONE-CLICK APPROVAL ========== */}
      {activeTab === 'payments' && (
        <div className="panel">
          <div className="panel-header">
            <h3>Pending Manual Payments ({manualPayments.length})</h3>
            <div className="header-actions">
              {selectedPaymentIds.length > 0 && (
                <button 
                  className="btn-success btn-sm" 
                  onClick={() => setShowBatchApproveModal(true)}
                >
                  <FaCheckCircle /> Approve Selected ({selectedPaymentIds.length})
                </button>
              )}
              <button className="btn-outline btn-sm" onClick={() => fetchAllData()}>
                <FaSync /> Refresh
              </button>
            </div>
          </div>
          
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input 
                      type="checkbox" 
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPaymentIds(manualPayments.map(p => p.id));
                        } else {
                          setSelectedPaymentIds([]);
                        }
                      }}
                      checked={selectedPaymentIds.length === manualPayments.length && manualPayments.length > 0}
                    />
                  </th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Reference</th>
                  <th>Proof</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {manualPayments.map(pay => (
                  <tr key={pay.id} className={selectedPaymentIds.includes(pay.id) ? 'selected-row' : ''}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedPaymentIds.includes(pay.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPaymentIds([...selectedPaymentIds, pay.id]);
                          } else {
                            setSelectedPaymentIds(selectedPaymentIds.filter(id => id !== pay.id));
                          }
                        }}
                      />
                    </td>
                    <td>
                      <strong>{pay?.username || 'Unknown User'}</strong>
                      <br/>
                      <small className="text-muted">{pay?.phone || 'No phone'}</small>
                    </td>
                    <td className="amount">
                      <strong className="text-success">₵{pay?.amount || 0}</strong>
                    </td>
                    <td>
                      <code className="reference-code">{pay?.reference || 'N/A'}</code>
                    </td>
                    <td className="proof-cell">
                      {pay?.proof_url ? (
                        <div className="proof-actions">
                          <button 
                            className="btn-info btn-sm" 
                            onClick={() => viewPaymentProof(pay.proof_url)}
                            title="View Proof"
                          >
                            <FaEye /> View
                          </button>
                          <button 
                            className="btn-primary btn-sm" 
                            onClick={() => downloadProofDocument(pay.proof_url, `payment_proof_${pay.reference}`)}
                            title="Download Proof"
                          >
                            <FaDownload /> Download
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted">No proof</span>
                      )}
                    </td>
                    <td>
                      {pay?.created_at ? new Date(pay.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="actions">
                      <button 
                        className="btn-success btn-sm" 
                        onClick={() => approvePaymentSimple(pay)}
                        title="One-click approve - wallet will be credited automatically"
                      >
                        <FaCheckCircle /> Approve
                      </button>
                      <button 
                        className="btn-danger btn-sm" 
                        onClick={() => rejectManualPayment(pay.id)}
                        title="Reject Payment"
                      >
                        <FaTimesCircle /> Reject
                      </button>
                    </td>
                  </tr>
                ))}
                {manualPayments.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center">
                      <div className="empty-state">
                        <FaWallet size={40} color="#ccc" />
                        <p>No pending manual payments</p>
                        <small>All payments have been processed</small>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== WITHDRAWALS TAB ========== */}
      {activeTab === 'withdrawals' && (
        <div className="panel">
          <h3>Withdrawal Requests</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr><th>Agent</th><th>Amount</th><th>Mobile Money</th><th>Date</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {withdrawals.map(w => (
                  <tr key={w.id}>
                    <td>{w?.agent_name || 'Unknown'}</td>
                    <td className="amount">₵{w?.amount || 0}</td>
                    <td>{w?.mobile_money || 'N/A'}</td>
                    <td>{w?.created_at ? new Date(w.created_at).toLocaleString() : 'N/A'}</td>
                    <td><span className={`status ${w?.status || 'pending'}`}>{w?.status || 'pending'}</span></td>
                    <td>{w?.status === 'pending' && <button className="btn-success btn-sm" onClick={() => approveWithdrawal(w.id)}><FaCheckCircle /> Approve</button>}</td>
                  </tr>
                ))}
                {withdrawals.length === 0 && <tr><td colSpan="6" className="text-center">No withdrawal requests</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== USERS TAB ========== */}
      {activeTab === 'users' && (
        <div className="panel">
          <div className="panel-header"><h3>All Users</h3><div className="search-box"><FaSearch /><input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Username</th><th>Email</th><th>Phone</th><th>Role</th><th>Wallet</th><th>Total Spent</th><th>Joined</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.filter(u => u?.username?.toLowerCase().includes(searchTerm.toLowerCase()) || u?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || u?.phone?.includes(searchTerm)).map(user => (
                  <tr key={user.id}>
                    <td>{user?.id}</td>
                    <td><strong>{user?.username || 'Unknown'}</strong>{user?.is_agent && <span className="agent-badge">Agent</span>}</td>
                    <td>{user?.email || ''}</td>
                    <td>{user?.phone || ''}</td>
                    <td>{user?.is_agent ? 'Agent' : user?.is_admin ? 'Admin' : 'User'}</td>
                    <td className="amount">₵{user?.wallet_balance || 0}</td>
                    <td className="amount">₵{user?.total_spent || 0}</td>
                    <td>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</td>
                    <td><span className={`status ${user?.is_suspended ? 'suspended' : 'active'}`}>{user?.is_suspended ? 'Suspended' : 'Active'}</span></td>
                    <td className="actions">
                      <button className="btn-info btn-sm" onClick={() => { setSelectedUser(user); setShowUserModal(true); }}><FaEye /> View</button>
                      {!user?.is_suspended ? <button className="btn-warning btn-sm" onClick={() => suspendUser(user.id)}><FaBan /> Suspend</button> : <button className="btn-success btn-sm" onClick={() => activateUser(user.id)}><FaUserCheck /> Activate</button>}
                      <button className="btn-primary btn-sm" onClick={() => { setNewUser(user); setShowCreateUserModal(true); }}><FaEdit /> Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== AGENTS LIST TAB ========== */}
      {activeTab === 'agents-list' && (
        <div className="panel">
          <h3>All Agents</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr><th>Agent Name</th><th>Phone</th><th>Email</th><th>Total Sales</th><th>Commission Earned</th><th>Withdrawn</th><th>Tier</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {agents.map(agent => (
                  <tr key={agent.id}>
                    <td><strong>{agent?.username || 'Unknown'}</strong>{agent?.rank <= 3 && <span className="rank-badge">#{agent.rank}</span>}</td>
                    <td>{agent?.phone || 'N/A'}</td>
                    <td>{agent?.email || 'N/A'}</td>
                    <td className="amount">₵{agent?.total_sales || 0}</td>
                    <td className="amount">₵{agent?.commission_earned || 0}</td>
                    <td className="amount">₵{agent?.withdrawn || 0}</td>
                    <td><span className={`tier-badge ${(agent?.tier || 'bronze').toLowerCase()}`}>{agent?.tier || 'Bronze'}</span></td>
                    <td>{agent?.created_at ? new Date(agent.created_at).toLocaleDateString() : 'N/A'}</td>
                    <td><button className="btn-info btn-sm" onClick={() => Swal.fire({ title: `Agent Details: ${agent?.username || 'Unknown'}`, html: `<p>Total Sales: ₵${agent?.total_sales || 0}</p><p>Commission Rate: ${agent?.commission_rate || 10}%</p><p>Commission Earned: ₵${agent?.commission_earned || 0}</p>` })}><FaEye /> Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== WAEC VOUCHERS TAB ========== */}
      {activeTab === 'waec' && (
        <div className="panel">
          <div className="panel-header"><h3>WAEC Vouchers Management</h3><button className="btn-primary btn-sm" onClick={() => setShowWAECModal(true)}><FaPlusCircle /> Generate Vouchers</button><button className="btn-outline btn-sm" onClick={exportWAECVouchers}><FaFileCsv /> Export CSV</button></div>
          <div className="waec-stats">
            <div className="stat-small"><span>Total Vouchers:</span><strong>{waecStats.total || 0}</strong></div>
            <div className="stat-small"><span>Available:</span><strong>{waecStats.available || 0}</strong></div>
            <div className="stat-small"><span>Used:</span><strong>{waecStats.used || 0}</strong></div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr><th>Voucher Code</th><th>Serial Number</th><th>PIN</th><th>Exam Type</th><th>Year</th><th>Status</th><th>Purchased By</th><th>Date</th></tr>
              </thead>
              <tbody>
                {waecVouchers.slice(0, 50).map(v => (
                  <tr key={v.id}>
                    <td><code>{v?.voucher_code || 'N/A'}</code></td>
                    <td>{v?.serial_number || 'N/A'}</td>
                    <td>{v?.pin || 'N/A'}</td>
                    <td>{v?.exam_type || 'N/A'}</td>
                    <td>{v?.year || 'N/A'}</td>
                    <td><span className={`status ${v?.is_used ? 'used' : 'available'}`}>{v?.is_used ? 'Used' : 'Available'}</span></td>
                    <td>{v?.purchased_by_name || 'N/A'}</td>
                    <td>{v?.created_at ? new Date(v.created_at).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))}
                {waecVouchers.length === 0 && <tr><td colSpan="8" className="text-center">No vouchers generated yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== BILL PAYMENTS TAB ========== */}
      {activeTab === 'bills' && (
        <div className="panel">
          <h3>Bill Payments</h3>
          <div className="bill-stats">
            <div className="stat-small"><span>Total Payments:</span><strong>{billStats.total || 0}</strong></div>
            <div className="stat-small"><span>Completed:</span><strong>{billStats.completed || 0}</strong></div>
            <div className="stat-small"><span>Pending:</span><strong>{billStats.pending || 0}</strong></div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr><th>Reference</th><th>Biller</th><th>Account Number</th><th>Amount</th><th>Customer</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {billPayments.map(p => (
                  <tr key={p.id}>
                    <td><code>{p?.reference || 'N/A'}</code></td>
                    <td>{p?.biller_name || 'N/A'}</td>
                    <td>{p?.account_number || 'N/A'}</td>
                    <td className="amount">₵{p?.amount || 0}</td>
                    <td>{p?.customer_name || p?.customer_phone || 'N/A'}</td>
                    <td><span className={`status ${p?.status || 'pending'}`}>{p?.status || 'pending'}</span></td>
                    <td>{p?.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))}
                {billPayments.length === 0 && <tr><td colSpan="7" className="text-center">No bill payments yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== INVENTORY TAB ========== */}
      {activeTab === 'inventory' && (
        <div className="panel">
          <h3>Master Inventory</h3>
          <div className="inventory-grid">
            {['mtn', 'telecel', 'airteltigo'].map(network => (
              <div key={network} className="inventory-card">
                <h4>{safeToUpperCase(network)}</h4>
                <div className="inventory-stats">
                  <div><span>Total Purchased:</span><strong>{masterInventory[network]?.total || 0} GB</strong></div>
                  <div><span>Remaining:</span><strong className={(masterInventory[network]?.remaining || 0) < 100 ? 'text-danger' : 'text-success'}>{(masterInventory[network]?.remaining || 0)} GB</strong></div>
                  <div><span>Sold to Agents:</span><strong>{masterInventory[network]?.sold_to_agents || 0} GB</strong></div>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${((masterInventory[network]?.total - masterInventory[network]?.remaining) / (masterInventory[network]?.total || 1) * 100) || 0}%` }}></div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== KYC TAB ========== */}
      {activeTab === 'kyc' && (
        <div className="panel">
          <h3>KYC Verification Requests</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr><th>User</th><th>Document Type</th><th>Document Number</th><th>Submitted</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {kycRequests.map(kyc => (
                  <tr key={kyc.id}>
                    <td><strong>{kyc?.username || 'Unknown'}</strong><br/><small>{kyc?.phone || ''}</small></td>
                    <td>{kyc?.document_type || 'N/A'}</td>
                    <td>{kyc?.document_number || 'N/A'}</td>
                    <td>{kyc?.created_at ? new Date(kyc.created_at).toLocaleString() : 'N/A'}</td>
                    <td className="actions">
                      <button className="btn-info btn-sm" onClick={() => window.open(kyc?.document_url, '_blank')}><FaEye /> View</button>
                      <button className="btn-success btn-sm" onClick={() => verifyKyc(kyc.id, 'approved')}><FaCheckCircle /> Approve</button>
                      <button className="btn-danger btn-sm" onClick={() => verifyKyc(kyc.id, 'rejected')}><FaTimesCircle /> Reject</button>
                    </td>
                  </tr>
                ))}
                {kycRequests.length === 0 && <tr><td colSpan="5" className="text-center">No KYC requests</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== WEBHOOKS TAB ========== */}
      {activeTab === 'webhooks' && (
        <div className="panel">
          <div className="panel-header"><h3>Webhook Configuration</h3><button className="btn-primary btn-sm" onClick={() => setShowWebhookModal(true)}><FaPlug /> Add Webhook</button></div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr><th>URL</th><th>Events</th><th>Status</th><th>Created</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {webhooks.map(webhook => (
                  <tr key={webhook.id}>
                    <td><code>{webhook?.url || 'N/A'}</code></td>
                    <td>{(webhook?.events || []).join(', ') || 'None'}</td>
                    <td><span className={`status ${webhook?.is_active ? 'active' : 'inactive'}`}>{webhook?.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>{webhook?.created_at ? new Date(webhook.created_at).toLocaleString() : 'N/A'}</td>
                    <td><button className="btn-danger btn-sm" onClick={async () => { await api.delete(`/admin/webhooks/${webhook.id}`); toast.success('Webhook deleted'); fetchWebhooks(); }}><FaTrash /> Delete</button></td>
                  </tr>
                ))}
                {webhooks.length === 0 && <tr><td colSpan="5" className="text-center">No webhooks configured</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Activities */}
      <div className="recent-activities">
        <h3><FaClock /> Recent {COMPANY.shortName} Activities</h3>
        <div className="activities-list">
          {recentActivities.map((activity, index) => (
            <div key={index} className="activity-item">
              <div className="activity-icon">{activity.type === 'user' ? <FaUserPlus /> : activity.type === 'payment' ? <FaWallet /> : activity.type === 'order' ? <FaShoppingCart /> : <FaUserCheck />}</div>
              <div className="activity-content"><p>{activity?.message || ''}</p><small>{activity?.created_at ? new Date(activity.created_at).toLocaleString() : ''}</small></div>
            </div>
          ))}
        </div>
      </div>

      {/* ========== ALL MODALS ========== */}

      {/* Announcement Modal */}
      <AnimatePresence>{showAnnouncementModal && (<motion.div className="modal-overlay" onClick={() => setShowAnnouncementModal(false)}><motion.div className="modal-content" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowAnnouncementModal(false)}>×</button><h3><FaBullhorn /> Create Announcement</h3><div className="form-group"><label>Message</label><textarea value={announcement.message} onChange={(e) => setAnnouncement({...announcement, message: e.target.value})} className="form-control" rows="3" /></div><div className="form-group"><label>Type</label><select value={announcement.type} onChange={(e) => setAnnouncement({...announcement, type: e.target.value})} className="form-control"><option value="info">ℹ️ Info</option><option value="warning">⚠️ Warning</option><option value="error">🚨 Critical</option><option value="success">✅ Success</option></select></div><div className="form-group"><label>Affected Network</label><select value={announcement.network_affected} onChange={(e) => setAnnouncement({...announcement, network_affected: e.target.value})} className="form-control"><option value="all">All Networks</option><option value="mtn">MTN</option><option value="telecel">Telecel</option><option value="airteltigo">AirtelTigo</option></select></div><div className="modal-actions"><button className="btn-secondary" onClick={() => setShowAnnouncementModal(false)}>Cancel</button><button className="btn-primary" onClick={createAnnouncement}>Publish</button></div></motion.div></motion.div>)}</AnimatePresence>

      {/* Create User Modal */}
      <AnimatePresence>{showCreateUserModal && (<motion.div className="modal-overlay" onClick={() => setShowCreateUserModal(false)}><motion.div className="modal-content" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowCreateUserModal(false)}>×</button><h3><FaUserPlus /> Create User</h3><div className="form-group"><label>Username *</label><input type="text" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} className="form-control" /></div><div className="form-group"><label>Email *</label><input type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="form-control" /></div><div className="form-group"><label>Phone *</label><input type="tel" value={newUser.phone} onChange={(e) => setNewUser({...newUser, phone: e.target.value})} className="form-control" /></div><div className="form-group"><label>Password</label><input type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="form-control" placeholder="Leave blank for auto-generated" /></div><div className="form-group"><label>Role</label><select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} className="form-control"><option value="user">User</option><option value="agent">Agent</option><option value="admin">Admin</option></select></div><div className="form-group"><label>Initial Wallet Balance</label><input type="number" value={newUser.wallet_balance} onChange={(e) => setNewUser({...newUser, wallet_balance: parseFloat(e.target.value)})} className="form-control" /></div><div className="modal-actions"><button className="btn-secondary" onClick={() => setShowCreateUserModal(false)}>Cancel</button><button className="btn-primary" onClick={createUser}>Create User</button></div></motion.div></motion.div>)}</AnimatePresence>

      {/* Bulk Approve Modal */}
      <AnimatePresence>{showBulkApproveModal && (<motion.div className="modal-overlay" onClick={() => setShowBulkApproveModal(false)}><motion.div className="modal-content" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowBulkApproveModal(false)}>×</button><h3><FaUserCheck /> Bulk Approve Agents</h3><p>Approve <strong>{selectedRequests.length}</strong> agent requests</p><div className="modal-actions"><button className="btn-secondary" onClick={() => setShowBulkApproveModal(false)}>Cancel</button><button className="btn-primary" onClick={bulkApproveAgents}>Approve All</button></div></motion.div></motion.div>)}</AnimatePresence>

      {/* Batch Approve Payments Modal */}
      <AnimatePresence>{showBatchApproveModal && (<motion.div className="modal-overlay" onClick={() => setShowBatchApproveModal(false)}><motion.div className="modal-content" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowBatchApproveModal(false)}>×</button><h3><FaCheckCircle /> Batch Approve Payments</h3><div style={{ margin: '20px 0' }}><p>You are about to approve <strong>{selectedPaymentIds.length}</strong> payments.</p><div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', margin: '15px 0', maxHeight: '300px', overflowY: 'auto' }}><table style={{ width: '100%', fontSize: '14px' }}><thead><tr><th>User</th><th>Amount</th><th>Reference</th></tr></thead><tbody>{manualPayments.filter(p => selectedPaymentIds.includes(p.id)).map(p => (<tr key={p.id}><td>{p.username}</td><td>₵{p.amount}</td><td><code>{p.reference}</code></td></tr>))}</tbody><tfoot><tr style={{ borderTop: '2px solid #ddd' }}><td><strong>Total:</strong></td><td><strong>₵{manualPayments.filter(p => selectedPaymentIds.includes(p.id)).reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}</strong></td><td></td></tr></tfoot></table></div><p style={{ color: '#ff9800' }}>⚠️ All selected users will be credited automatically.</p></div><div className="modal-actions"><button className="btn-secondary" onClick={() => setShowBatchApproveModal(false)}>Cancel</button><button className="btn-success" onClick={batchApprovePayments}><FaCheckCircle /> Approve All ({selectedPaymentIds.length})</button></div></motion.div></motion.div>)}</AnimatePresence>

      {/* WAEC Generate Modal */}
      <AnimatePresence>{showWAECModal && (<motion.div className="modal-overlay" onClick={() => setShowWAECModal(false)}><motion.div className="modal-content" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowWAECModal(false)}>×</button><h3><FaGraduationCap /> Generate WAEC Vouchers</h3><div className="form-group"><label>Exam Type</label><select value={newWAEC.exam_type} onChange={(e) => setNewWAEC({...newWAEC, exam_type: e.target.value})} className="form-control"><option value="WASSCE">WASSCE</option><option value="BECE">BECE</option><option value="SHS Placement">SHS Placement</option></select></div><div className="form-group"><label>Year</label><input type="number" value={newWAEC.year} onChange={(e) => setNewWAEC({...newWAEC, year: parseInt(e.target.value)})} className="form-control" /></div><div className="form-group"><label>Quantity</label><input type="number" value={newWAEC.quantity} onChange={(e) => setNewWAEC({...newWAEC, quantity: parseInt(e.target.value)})} className="form-control" /></div><div className="form-row"><div className="form-group"><label>Retail Price (₵)</label><input type="number" step="0.5" value={newWAEC.retail_price} onChange={(e) => setNewWAEC({...newWAEC, retail_price: parseFloat(e.target.value)})} className="form-control" /></div><div className="form-group"><label>Agent Price (₵)</label><input type="number" step="0.5" value={newWAEC.agent_price} onChange={(e) => setNewWAEC({...newWAEC, agent_price: parseFloat(e.target.value)})} className="form-control" /></div></div><div className="modal-actions"><button className="btn-secondary" onClick={() => setShowWAECModal(false)}>Cancel</button><button className="btn-primary" onClick={generateWAECVouchers}>Generate</button></div></motion.div></motion.div>)}</AnimatePresence>

      {/* Network Purchase Modal - Updated for Africa's Talking */}
      <AnimatePresence>
        {showNetworkPurchaseModal && (
          <motion.div className="modal-overlay" onClick={() => setShowNetworkPurchaseModal(false)}>
            <motion.div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
              <button className="modal-close" onClick={() => setShowNetworkPurchaseModal(false)}>×</button>
              <h3><FaNetworkWired /> Purchase from Africa's Talking</h3>
              
              <div className="form-group">
                <label>Product Type</label>
                <select 
                  value={networkPurchase.product_type || 'data'} 
                  onChange={(e) => setNetworkPurchase({...networkPurchase, product_type: e.target.value})} 
                  className="form-control"
                >
                  <option value="data">📱 Mobile Data (Product ID: 1752)</option>
                  <option value="sms">💬 SMS Credits</option>
                </select>
              </div>
              
              {networkPurchase.product_type === 'data' ? (
                <>
                  <div className="form-group">
                    <label>Network</label>
                    <select 
                      value={networkPurchase.network} 
                      onChange={(e) => setNetworkPurchase({...networkPurchase, network: e.target.value})} 
                      className="form-control"
                    >
                      <option value="mtn">MTN</option>
                      <option value="telecel">Telecel</option>
                      <option value="airteltigo">AirtelTigo</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Bundle Size (GB)</label>
                    <select 
                      value={networkPurchase.size_gb} 
                      onChange={(e) => setNetworkPurchase({...networkPurchase, size_gb: parseFloat(e.target.value)})} 
                      className="form-control"
                    >
                      <option value={0.02}>20.46 MB (0.02 GB) - GHS 0.49</option>
                      <option value={0.04}>40.91 MB (0.04 GB) - GHS 0.99</option>
                      <option value={0.39}>401.63 MB (0.39 GB) - GHS 2.97</option>
                      <option value={0.81}>826.72 MB (0.81 GB) - GHS 9.90</option>
                      <option value={104}>106.81 GB - GHS 346.62</option>
                      <option value={209}>214.53 GB - GHS 395.14</option>
                    </select>
                    <small>MTN available bundles</small>
                  </div>
                  
                  <div className="form-group">
                    <label>Quantity</label>
                    <input 
                      type="number" 
                      value={networkPurchase.quantity} 
                      onChange={(e) => setNetworkPurchase({...networkPurchase, quantity: parseInt(e.target.value)})} 
                      className="form-control" 
                      min="1" 
                      max="100"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Delivery Phone Number</label>
                    <input 
                      type="tel" 
                      value={networkPurchase.phone_number} 
                      onChange={(e) => setNetworkPurchase({...networkPurchase, phone_number: e.target.value})} 
                      className="form-control" 
                      placeholder="024XXXXXXX"
                    />
                    <small>Africa's Talking will deliver data to this number</small>
                  </div>
                  
                  <div className="price-summary" style={{ background: '#f0f8ff', padding: '15px', borderRadius: '8px', margin: '15px 0' }}>
                    <p><strong>📊 Purchase Summary:</strong></p>
                    <p>Network: {networkPurchase.network?.toUpperCase()}</p>
                    <p>Bundle: {networkPurchase.size_gb} GB × {networkPurchase.quantity} = <strong>{networkPurchase.size_gb * networkPurchase.quantity} GB</strong></p>
                    <p>Total Cost: <strong className="text-success">GHS {calculateTotalPrice(networkPurchase.network, networkPurchase.size_gb, networkPurchase.quantity)}</strong></p>
                    <small className="text-muted">⚠️ This will be deducted from Africa's Talking wallet balance</small>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>SMS Quantity</label>
                    <input 
                      type="number" 
                      value={networkPurchase.sms_quantity || 0} 
                      onChange={(e) => setNetworkPurchase({...networkPurchase, sms_quantity: parseInt(e.target.value)})} 
                      className="form-control" 
                      min="1" 
                      max="100000"
                      placeholder="Number of SMS credits"
                    />
                    <small>Each SMS costs GHS 0.05 - GHS 0.10 depending on destination</small>
                  </div>
                  
                  <div className="price-summary" style={{ background: '#f0f8ff', padding: '15px', borderRadius: '8px', margin: '15px 0' }}>
                    <p><strong>📊 Purchase Summary:</strong></p>
                    <p>SMS Credits: <strong>{networkPurchase.sms_quantity || 0}</strong></p>
                    <p>Total Cost: <strong className="text-success">GHS {((networkPurchase.sms_quantity || 0) * 0.05).toFixed(2)}</strong></p>
                  </div>
                </>
              )}
              
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowNetworkPurchaseModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={purchaseFromNetwork}>
                  <FaNetworkWired /> Purchase from Africa's Talking
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backup Modal */}
      <AnimatePresence>{showBackupModal && (<motion.div className="modal-overlay" onClick={() => setShowBackupModal(false)}><motion.div className="modal-content" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowBackupModal(false)}>×</button><h3><FaDatabase /> Backup Management</h3>{backupProgress > 0 && <div className="progress-bar"><div className="progress-fill" style={{ width: `${backupProgress}%` }}></div><span>{backupProgress}%</span></div>}<button className="btn-primary" onClick={createBackup}><FaCloudUploadAlt /> Create New Backup</button><h4>Existing Backups</h4><div className="backups-list">{backups.map(backup => (<div key={backup.id} className="backup-item"><div className="backup-info"><FaDatabase /><span>{backup?.filename || 'Unknown'}</span><small>{backup?.created_at ? new Date(backup.created_at).toLocaleString() : 'N/A'}</small><span>{backup?.size ? `${(backup.size / 1024).toFixed(2)} KB` : '0 KB'}</span></div><button className="btn-danger btn-sm" onClick={() => restoreBackup(backup.id)}><FaUndo /> Restore</button></div>))}</div><div className="modal-actions"><button className="btn-secondary" onClick={() => setShowBackupModal(false)}>Close</button></div></motion.div></motion.div>)}</AnimatePresence>

      {/* Webhook Modal */}
      <AnimatePresence>{showWebhookModal && (<motion.div className="modal-overlay" onClick={() => setShowWebhookModal(false)}><motion.div className="modal-content" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowWebhookModal(false)}>×</button><h3><FaPlug /> Add Webhook</h3><div className="form-group"><label>URL</label><input type="url" value={newWebhook.url} onChange={(e) => setNewWebhook({...newWebhook, url: e.target.value})} className="form-control" /></div><div className="form-group"><label>Events</label><select multiple value={newWebhook.events} onChange={(e) => setNewWebhook({...newWebhook, events: Array.from(e.target.selectedOptions, o => o.value)})} className="form-control"><option value="order.created">Order Created</option><option value="order.completed">Order Completed</option><option value="payment.received">Payment Received</option><option value="agent.approved">Agent Approved</option></select></div><div className="form-group"><label>Secret</label><input type="text" value={newWebhook.secret} onChange={(e) => setNewWebhook({...newWebhook, secret: e.target.value})} className="form-control" placeholder="Optional webhook secret" /></div><div className="modal-actions"><button className="btn-secondary" onClick={() => setShowWebhookModal(false)}>Cancel</button><button className="btn-primary" onClick={createWebhook}>Create</button></div></motion.div></motion.div>)}</AnimatePresence>

      {/* User Details Modal */}
      <AnimatePresence>{showUserModal && selectedUser && (<motion.div className="modal-overlay" onClick={() => setShowUserModal(false)}><motion.div className="modal-content" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowUserModal(false)}>×</button><h3>User Details: {selectedUser?.username || 'Unknown'}</h3><div className="user-details-grid"><div className="detail-item"><label>Email:</label><span>{selectedUser?.email || 'N/A'}</span></div><div className="detail-item"><label>Phone:</label><span>{selectedUser?.phone || 'N/A'}</span></div><div className="detail-item"><label>Wallet:</label><span>₵{selectedUser?.wallet_balance || 0}</span></div><div className="detail-item"><label>Total Spent:</label><span>₵{selectedUser?.total_spent || 0}</span></div><div className="detail-item"><label>Joined:</label><span>{selectedUser?.created_at ? new Date(selectedUser.created_at).toLocaleString() : 'N/A'}</span></div></div><div className="modal-actions"><button className="btn-secondary" onClick={() => setShowUserModal(false)}>Close</button><button className="btn-primary" onClick={() => { setShowUserModal(false); setNewUser(selectedUser); setShowCreateUserModal(true); }}><FaEdit /> Edit</button></div></motion.div></motion.div>)}</AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>{showSettingsModal && (<motion.div className="modal-overlay" onClick={() => setShowSettingsModal(false)}><motion.div className="modal-content settings-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowSettingsModal(false)}>×</button><h3><FaCog /> System Settings</h3><div className="settings-grid"><div className="setting-group"><h4>Commission Rates</h4><label>Bronze: <input type="number" value={systemSettings.commission_rates?.bronze || 10} onChange={(e) => setSystemSettings({...systemSettings, commission_rates: {...systemSettings.commission_rates, bronze: parseInt(e.target.value)}})} /></label><label>Silver: <input type="number" value={systemSettings.commission_rates?.silver || 15} onChange={(e) => setSystemSettings({...systemSettings, commission_rates: {...systemSettings.commission_rates, silver: parseInt(e.target.value)}})} /></label><label>Gold: <input type="number" value={systemSettings.commission_rates?.gold || 20} onChange={(e) => setSystemSettings({...systemSettings, commission_rates: {...systemSettings.commission_rates, gold: parseInt(e.target.value)}})} /></label><label>Platinum: <input type="number" value={systemSettings.commission_rates?.platinum || 25} onChange={(e) => setSystemSettings({...systemSettings, commission_rates: {...systemSettings.commission_rates, platinum: parseInt(e.target.value)}})} /></label></div><div className="setting-group"><h4>WAEC & Bills</h4><label>WAEC Commission: <input type="number" value={systemSettings.waec_commission || 10} onChange={(e) => setSystemSettings({...systemSettings, waec_commission: parseInt(e.target.value)})} />%</label><label>Bill Commission: <input type="number" value={systemSettings.bill_commission || 5} onChange={(e) => setSystemSettings({...systemSettings, bill_commission: parseInt(e.target.value)})} />%</label></div><div className="setting-group"><h4>Support Contact</h4><label>Support Email: <input type="email" value={systemSettings.support_email} onChange={(e) => setSystemSettings({...systemSettings, support_email: e.target.value})} /></label><label>Support Phone: <input type="tel" value={systemSettings.support_phone} onChange={(e) => setSystemSettings({...systemSettings, support_phone: e.target.value})} /></label></div></div><div className="modal-actions"><button className="btn-secondary" onClick={() => setShowSettingsModal(false)}>Cancel</button><button className="btn-primary" onClick={() => { api.put('/admin/settings', systemSettings); toast.success('Settings saved'); setShowSettingsModal(false); }}>Save Settings</button></div></motion.div></motion.div>)}</AnimatePresence>
    </motion.div>
  );
}