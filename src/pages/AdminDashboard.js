
// src/pages/AdminDashboard.js
// Move all imports to the top, before any code

// Fix the import - remove statsRes from React import
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
  FaMinusCircle, FaExchangeAlt, FaNetworkWired as FaNetwork
}
from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import io from 'socket.io-client';
import AdminPriceManagement from './AdminPriceManagement';


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

// Helper function for safe value handling
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

export default function AdminDashboard() {
  // ========== STATE MANAGEMENT ==========
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
  const [selectedNetwork, setSelectedNetwork] = useState('mtn');
  const [networkSales, setNetworkSales] = useState({ mtn: 0, telecel: 0, airteltigo: 0 });
  

  // Live Stats
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
  
  // Announcement State
  const [announcement, setAnnouncement] = useState({
    is_active: false, message: '', type: 'info', network_affected: 'all', expires_at: ''
  });
  
  // Create User Form State
  const [newUser, setNewUser] = useState({
    username: '', email: '', phone: '', password: '', role: 'user', wallet_balance: 0
  });
  
  // Bulk Approve State
  const [selectedRequests, setSelectedRequests] = useState([]);
  
  // Backup State
  const [backups, setBackups] = useState([]);
  const [backupProgress, setBackupProgress] = useState(0);
  
  // Webhook State
  const [webhooks, setWebhooks] = useState([]);
  const [newWebhook, setNewWebhook] = useState({ url: '', events: [], secret: '' });
  
  // KYC State
  const [kycRequests, setKycRequests] = useState([]);
  
  // WAEC State
  const [waecVouchers, setWaecVouchers] = useState([]);
  const [waecStats, setWaecStats] = useState({ total: 0, used: 0, available: 0 });
  const [newWAEC, setNewWAEC] = useState({ exam_type: 'WASSCE', year: new Date().getFullYear(), quantity: 100, retail_price: 20, agent_price: 18, wholesale_price: 15 });
  
  // Bill Payments State
  const [billPayments, setBillPayments] = useState([]);
  const [billStats, setBillStats] = useState({ total: 0, completed: 0, pending: 0 });
  
  // Network Inventory State
  const [masterInventory, setMasterInventory] = useState({});
  const [networkPurchase, setNetworkPurchase] = useState({ network: 'mtn', size_gb: 10, quantity: 1 });
  
  // AI Analytics
  const [predictions, setPredictions] = useState({
    next_month_revenue: 0, peak_hour_prediction: '6 PM', churn_risk_users: [],
    demand_forecast: {}
  });
  
  // System Settings
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
  
  // Admin Role State
  const [adminRole, setAdminRole] = useState('super_admin');
  const [adminPermissions, setAdminPermissions] = useState({
    can_manage_users: true, can_manage_agents: true, can_manage_payments: true,
    can_manage_withdrawals: true, can_view_reports: true, can_manage_settings: true,
    can_broadcast: true, can_manage_backups: true
  });
  
  // Geographic Data (Ghana regions)
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

  // ========== WEBSOCKET FOR LIVE DATA ==========
  useEffect(() => {
    // Use environment variable for WebSocket URL - no hardcoded localhost in production
    const wsUrl = process.env.REACT_APP_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
    socketRef.current = io(wsUrl, {
      path: '/socket.io',
      transports: ['websocket']
    });
    
    socketRef.current.on('connect', () => {
      console.log('Admin socket connected');
      socketRef.current.emit('admin_join', { role: adminRole });
    });
    
    socketRef.current.on('live_stats', (data) => {
      setLiveStats(data);
    });
    
    socketRef.current.on('new_order', (order) => {
      showOrderNotification(order);
      fetchAllData();
    });
    
    socketRef.current.on('new_agent_request', (request) => {
      showAgentRequestNotification(request);
      fetchAllData();
    });
    
    socketRef.current.on('admin_alert', (alert) => {
      addNotification(alert);
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [adminRole]);

  // ========== DATA FETCHING ==========
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
      
      // Safe assignment with fallbacks
      const statsData = statsRes?.data?.data || {};
      setStats(statsData);
      setUsers(usersRes?.data?.data || []);
      setAgents(agentsRes?.data?.data || []);
      setAgentRequests(requestsRes?.data?.data || []);
      setManualPayments(paymentsRes?.data?.data || []);
      setWithdrawals(withdrawalsRes?.data?.data || []);
      setAllOrders(ordersRes?.data?.data || []);
      
      // Set network sales from stats data
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
    // Fixed: changed toast.info to toast.success
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
        toast.success(`Roamsmart purchased ${networkPurchase.quantity}x ${networkPurchase.size_gb}GB from ${safeToUpperCase(networkPurchase.network)}`);
        setShowNetworkPurchaseModal(false);
        fetchMasterInventory();
        setNetworkPurchase({ network: 'mtn', size_gb: 10, quantity: 1 });
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

  // ========== MANUAL PAYMENT VERIFICATION ==========
  const verifyManualPayment = async (paymentId, senderName, senderPhone) => {
    try {
      await api.post(`/admin/manual-payments/${paymentId}/verify`, { 
        sender_name: senderName, 
        sender_phone: senderPhone 
      });
      toast.success('Payment verified and wallet credited for Roamsmart user!');
      fetchAllData();
      fetchRecentActivities();
    } catch (error) {
      toast.error('Failed to verify payment');
    }
  };

  const rejectManualPayment = async (paymentId) => {
    const result = await Swal.fire({
      title: 'Reject Payment?',
      text: 'The user will be notified and will need to re-upload proof.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Yes, Reject',
      cancelButtonText: 'Cancel'
    });
    if (result.isConfirmed) {
      try {
        await api.post(`/admin/manual-payments/${paymentId}/reject`);
        toast.success('Payment rejected');
        fetchAllData();
      } catch (error) {
        toast.error('Failed to reject payment');
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

  const exportOrdersToExcel = () => {
    const exportData = allOrders.map(order => ({
      'Order ID': order?.order_id || '',
      Customer: order?.customer_phone || '',
      Product: `${order?.network || ''} ${order?.size_gb || 0}GB`,
      Amount: order?.amount || 0,
      Status: order?.status || '',
      Date: order?.created_at ? new Date(order.created_at).toLocaleString() : ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Roamsmart_Orders`);
    XLSX.writeFile(wb, `roamsmart_orders_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Orders exported from Roamsmart!');
  };

  // ========== CHART DATA ==========
  const getRevenueChartData = () => {
    let labels = [];
    let data = [];
    
    if (dateRange === 'week') {
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      // Use real data from stats or create endpoint /admin/stats/revenue?range=week
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
          <button className="btn-outline" onClick={() => setShowNetworkPurchaseModal(true)}><FaNetwork /> Buy from Network</button>
          <button className="btn-outline" onClick={() => setShowWAECModal(true)}><FaGraduationCap /> Generate WAEC</button>
          <button className="btn-outline" onClick={() => setShowBackupModal(true)}><FaDatabase /> Backup</button>
          <button className="btn-outline" onClick={() => setShowSettingsModal(true)}><FaCog /> Settings</button>
          <button className="btn-primary" onClick={exportUsersToExcel}><FaFileExport /> Export Users</button>
        </div>
      </div>

      {/* Stats Grid - Same as before but with Roamsmart context */}
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon"><FaUsers /></div><div className="stat-value">{stats.total_users || 0}</div><div className="stat-label">Total Users</div></div>
        <div className="stat-card"><div className="stat-icon"><FaUserCheck /></div><div className="stat-value">{stats.total_agents || 0}</div><div className="stat-label">Total Agents</div></div>
        <div className="stat-card warning"><div className="stat-icon"><FaClock /></div><div className="stat-value">{stats.pending_agents || 0}</div><div className="stat-label">Pending Agents</div></div>
        <div className="stat-card success"><div className="stat-icon"><FaMoneyBillWave /></div><div className="stat-value">₵{(stats.total_revenue || 0).toFixed(2)}</div><div className="stat-label">Total Revenue</div></div>
        <div className="stat-card"><div className="stat-icon"><FaShoppingCart /></div><div className="stat-value">{stats.total_orders || 0}</div><div className="stat-label">Total Orders</div></div>
        <div className="stat-card danger"><div className="stat-icon"><FaHourglassHalf /></div><div className="stat-value">{stats.pending_manual || 0}</div><div className="stat-label">Pending Payments</div></div>
        <div className="stat-card info"><div className="stat-icon"><FaBoxes /></div><div className="stat-value">{stats.total_data_sold_gb || 0} GB</div><div className="stat-label">Data Sold</div></div>
        <div className="stat-card"><div className="stat-icon"><FaTrophy /></div><div className="stat-value">{stats.top_network || 'MTN'}</div><div className="stat-label">Top Network</div></div>
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

      {/* Admin Tabs - Same structure */}
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
              <thead><tr><th>User</th><th>Phone</th><th>Email</th><th>Amount Paid</th><th>Reference</th><th>Date</th><th>Actions</th></tr></thead>
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
                        <a href={app.payment_proof_url} target="_blank" rel="noopener noreferrer" className="btn-info btn-sm"><FaEye /> Proof</a>
                      )}
                    </td>
                  </tr>
                ))}
                {agentApplications.length === 0 && <tr><td colSpan="7" className="text-center">No pending applications</td></tr>}
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
              <thead><tr><th><input type="checkbox" onChange={(e) => setSelectedRequests(e.target.checked ? agentRequests.map(r => r.id) : [])} /></th><th>User</th><th>Phone</th><th>Amount</th><th>Reference</th><th>Date</th><th>Actions</th></tr></thead>
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

      {/* ========== MANUAL PAYMENTS TAB ========== */}
      {activeTab === 'payments' && (
        <div className="panel">
          <h3>Pending Manual Payments</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>User</th><th>Amount</th><th>Reference</th><th>Proof</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {manualPayments.map(pay => (
                  <tr key={pay.id}>
                    <td><strong>{pay?.username || 'Unknown'}</strong><br/><small>{pay?.phone || ''}</small></td>
                    <td className="amount">₵{pay?.amount || 0}</td>
                    <td><code>{pay?.reference || 'N/A'}</code></td>
                    <td>{pay?.proof_url && <a href={pay.proof_url} target="_blank"><FaEye /> View</a>}</td>
                    <td>{pay?.created_at ? new Date(pay.created_at).toLocaleString() : 'N/A'}</td>
                    <td className="actions">
                      <button className="btn-success btn-sm" onClick={() => { Swal.fire({ title: 'Verify Payment', html: `<input id="sender_name" class="swal2-input" placeholder="Sender Name"><input id="sender_phone" class="swal2-input" placeholder="Sender Phone">`, preConfirm: () => ({ sender_name: document.getElementById('sender_name').value, sender_phone: document.getElementById('sender_phone').value }) }).then(result => { if (result.value) verifyManualPayment(pay.id, result.value.sender_name, result.value.sender_phone); }); }}><FaCheckCircle /> Verify</button>
                      <button className="btn-danger btn-sm" onClick={() => rejectManualPayment(pay.id)}><FaTimesCircle /> Reject</button>
                    </td>
                  </tr>
                ))}
                {manualPayments.length === 0 && <tr><td colSpan="6" className="text-center">No pending payments</td></tr>}
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
              <thead><tr><th>Agent</th><th>Amount</th><th>Mobile Money</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
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
              <thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Phone</th><th>Role</th><th>Wallet</th><th>Total Spent</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
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
              <thead><tr><th>Agent Name</th><th>Phone</th><th>Email</th><th>Total Sales</th><th>Commission Earned</th><th>Withdrawn</th><th>Tier</th><th>Joined</th><th>Actions</th></tr></thead>
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
              <thead><tr><th>Voucher Code</th><th>Serial Number</th><th>PIN</th><th>Exam Type</th><th>Year</th><th>Status</th><th>Purchased By</th><th>Date</th></tr></thead>
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
              <thead><tr><th>Reference</th><th>Biller</th><th>Account Number</th><th>Amount</th><th>Customer</th><th>Status</th><th>Date</th></tr></thead>
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
              <thead><tr><th>User</th><th>Document Type</th><th>Document Number</th><th>Submitted</th><th>Actions</th></tr></thead>
              <tbody>
                {kycRequests.map(kyc => (
                  <tr key={kyc.id}>
                    <td><strong>{kyc?.username || 'Unknown'}</strong><br/><small>{kyc?.phone || ''}</small></td>
                    <td>{kyc?.document_type || 'N/A'}</td>
                    <td>{kyc?.document_number || 'N/A'}</td>
                    <td>{kyc?.created_at ? new Date(kyc.created_at).toLocaleString() : 'N/A'}</td>
                    <td className="actions">
                      <a href={kyc?.document_url} target="_blank" className="btn-info btn-sm"><FaEye /> View</a>
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
              <thead><tr><th>URL</th><th>Events</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
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

      {/* Settings Modal - UPDATED with Roamsmart */}
      <AnimatePresence>{showSettingsModal && (<motion.div className="modal-overlay" onClick={() => setShowSettingsModal(false)}><motion.div className="modal-content settings-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowSettingsModal(false)}>×</button><h3><FaCog /> {COMPANY.name} System Settings</h3><div className="settings-grid"><div className="setting-group"><h4>Commission Rates</h4><label>Bronze: <input type="number" value={systemSettings.commission_rates?.bronze || 10} onChange={(e) => setSystemSettings({...systemSettings, commission_rates: {...systemSettings.commission_rates, bronze: parseInt(e.target.value)}})} /></label><label>Silver: <input type="number" value={systemSettings.commission_rates?.silver || 15} onChange={(e) => setSystemSettings({...systemSettings, commission_rates: {...systemSettings.commission_rates, silver: parseInt(e.target.value)}})} /></label><label>Gold: <input type="number" value={systemSettings.commission_rates?.gold || 20} onChange={(e) => setSystemSettings({...systemSettings, commission_rates: {...systemSettings.commission_rates, gold: parseInt(e.target.value)}})} /></label><label>Platinum: <input type="number" value={systemSettings.commission_rates?.platinum || 25} onChange={(e) => setSystemSettings({...systemSettings, commission_rates: {...systemSettings.commission_rates, platinum: parseInt(e.target.value)}})} /></label></div><div className="setting-group"><h4>WAEC & Bills</h4><label>WAEC Commission: <input type="number" value={systemSettings.waec_commission || 10} onChange={(e) => setSystemSettings({...systemSettings, waec_commission: parseInt(e.target.value)})} />%</label><label>Bill Commission: <input type="number" value={systemSettings.bill_commission || 5} onChange={(e) => setSystemSettings({...systemSettings, bill_commission: parseInt(e.target.value)})} />%</label></div><div className="setting-group"><h4>Support Contact</h4><label>Support Email: <input type="email" value={systemSettings.support_email} onChange={(e) => setSystemSettings({...systemSettings, support_email: e.target.value})} /></label><label>Support Phone: <input type="tel" value={systemSettings.support_phone} onChange={(e) => setSystemSettings({...systemSettings, support_phone: e.target.value})} /></label></div></div><div className="modal-actions"><button className="btn-secondary" onClick={() => setShowSettingsModal(false)}>Cancel</button><button className="btn-primary" onClick={() => { api.put('/admin/settings', systemSettings); toast.success(`${COMPANY.shortName} settings saved`); setShowSettingsModal(false); }}>Save Settings</button></div></motion.div></motion.div>)}</AnimatePresence>

      {/* ========== MODALS ========== */}

      {/* Announcement Modal */}
      <AnimatePresence>{showAnnouncementModal && (<motion.div className="modal-overlay" onClick={() => setShowAnnouncementModal(false)}><motion.div className="modal-content" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowAnnouncementModal(false)}>×</button><h3><FaBullhorn /> Create Announcement</h3><div className="form-group"><label>Message</label><textarea value={announcement.message} onChange={(e) => setAnnouncement({...announcement, message: e.target.value})} className="form-control" rows="3" /></div><div className="form-group"><label>Type</label><select value={announcement.type} onChange={(e) => setAnnouncement({...announcement, type: e.target.value})} className="form-control"><option value="info">ℹ️ Info</option><option value="warning">⚠️ Warning</option><option value="error">🚨 Critical</option><option value="success">✅ Success</option></select></div><div className="form-group"><label>Affected Network</label><select value={announcement.network_affected} onChange={(e) => setAnnouncement({...announcement, network_affected: e.target.value})} className="form-control"><option value="all">All Networks</option><option value="mtn">MTN</option><option value="telecel">Telecel</option><option value="airteltigo">AirtelTigo</option></select></div><div className="modal-actions"><button className="btn-secondary" onClick={() => setShowAnnouncementModal(false)}>Cancel</button><button className="btn-primary" onClick={createAnnouncement}>Publish</button></div></motion.div></motion.div>)}</AnimatePresence>

      {/* Create User Modal */}
      <AnimatePresence>{showCreateUserModal && (<motion.div className="modal-overlay" onClick={() => setShowCreateUserModal(false)}><motion.div className="modal-content" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowCreateUserModal(false)}>×</button><h3><FaUserPlus /> Create User</h3><div className="form-group"><label>Username *</label><input type="text" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} className="form-control" /></div><div className="form-group"><label>Email *</label><input type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="form-control" /></div><div className="form-group"><label>Phone *</label><input type="tel" value={newUser.phone} onChange={(e) => setNewUser({...newUser, phone: e.target.value})} className="form-control" /></div><div className="form-group"><label>Password</label><input type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="form-control" /></div><div className="form-group"><label>Role</label><select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} className="form-control"><option value="user">User</option><option value="agent">Agent</option><option value="admin">Admin</option></select></div><div className="form-group"><label>Initial Wallet Balance</label><input type="number" value={newUser.wallet_balance} onChange={(e) => setNewUser({...newUser, wallet_balance: parseFloat(e.target.value)})} className="form-control" /></div><div className="modal-actions"><button className="btn-secondary" onClick={() => setShowCreateUserModal(false)}>Cancel</button><button className="btn-primary" onClick={createUser}>Create User</button></div></motion.div></motion.div>)}</AnimatePresence>

      {/* Bulk Approve Modal */}
      <AnimatePresence>{showBulkApproveModal && (<motion.div className="modal-overlay" onClick={() => setShowBulkApproveModal(false)}><motion.div className="modal-content" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowBulkApproveModal(false)}>×</button><h3><FaUserCheck /> Bulk Approve Agents</h3><p>Approve <strong>{selectedRequests.length}</strong> agent requests</p><div className="modal-actions"><button className="btn-secondary" onClick={() => setShowBulkApproveModal(false)}>Cancel</button><button className="btn-primary" onClick={bulkApproveAgents}>Approve All</button></div></motion.div></motion.div>)}</AnimatePresence>

      {/* WAEC Generate Modal */}
      <AnimatePresence>{showWAECModal && (<motion.div className="modal-overlay" onClick={() => setShowWAECModal(false)}><motion.div className="modal-content" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowWAECModal(false)}>×</button><h3><FaGraduationCap /> Generate WAEC Vouchers</h3><div className="form-group"><label>Exam Type</label><select value={newWAEC.exam_type} onChange={(e) => setNewWAEC({...newWAEC, exam_type: e.target.value})} className="form-control"><option value="WASSCE">WASSCE</option><option value="BECE">BECE</option><option value="SHS Placement">SHS Placement</option></select></div><div className="form-group"><label>Year</label><input type="number" value={newWAEC.year} onChange={(e) => setNewWAEC({...newWAEC, year: parseInt(e.target.value)})} className="form-control" /></div><div className="form-group"><label>Quantity</label><input type="number" value={newWAEC.quantity} onChange={(e) => setNewWAEC({...newWAEC, quantity: parseInt(e.target.value)})} className="form-control" /></div><div className="form-row"><div className="form-group"><label>Retail Price (₵)</label><input type="number" step="0.5" value={newWAEC.retail_price} onChange={(e) => setNewWAEC({...newWAEC, retail_price: parseFloat(e.target.value)})} className="form-control" /></div><div className="form-group"><label>Agent Price (₵)</label><input type="number" step="0.5" value={newWAEC.agent_price} onChange={(e) => setNewWAEC({...newWAEC, agent_price: parseFloat(e.target.value)})} className="form-control" /></div></div><div className="modal-actions"><button className="btn-secondary" onClick={() => setShowWAECModal(false)}>Cancel</button><button className="btn-primary" onClick={generateWAECVouchers}>Generate</button></div></motion.div></motion.div>)}</AnimatePresence>

      {/* Network Purchase Modal */}
      <AnimatePresence>{showNetworkPurchaseModal && (<motion.div className="modal-overlay" onClick={() => setShowNetworkPurchaseModal(false)}><motion.div className="modal-content" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowNetworkPurchaseModal(false)}>×</button><h3><FaNetwork /> Purchase from Network Provider</h3><div className="form-group"><label>Network</label><select value={networkPurchase.network} onChange={(e) => setNetworkPurchase({...networkPurchase, network: e.target.value})} className="form-control"><option value="mtn">MTN</option><option value="telecel">Telecel</option><option value="airteltigo">AirtelTigo</option></select></div><div className="form-group"><label>Bundle Size (GB)</label><select value={networkPurchase.size_gb} onChange={(e) => setNetworkPurchase({...networkPurchase, size_gb: parseInt(e.target.value)})} className="form-control"><option value={1}>1 GB - ₵3.50</option><option value={2}>2 GB - ₵5.50</option><option value={5}>5 GB - ₵13.00</option><option value={10}>10 GB - ₵25.00</option><option value={20}>20 GB - ₵48.00</option></select></div><div className="form-group"><label>Quantity</label><input type="number" value={networkPurchase.quantity} onChange={(e) => setNetworkPurchase({...networkPurchase, quantity: parseInt(e.target.value)})} className="form-control" min="1" max="100" /></div><div className="price-summary"><p>Total GB: {networkPurchase.size_gb * networkPurchase.quantity} GB</p><p>Total Cost: ₵{(networkPurchase.size_gb === 1 ? 3.5 : networkPurchase.size_gb === 2 ? 5.5 : networkPurchase.size_gb === 5 ? 13 : networkPurchase.size_gb === 10 ? 25 : 48) * networkPurchase.quantity}</p></div><div className="modal-actions"><button className="btn-secondary" onClick={() => setShowNetworkPurchaseModal(false)}>Cancel</button><button className="btn-primary" onClick={purchaseFromNetwork}>Purchase</button></div></motion.div></motion.div>)}</AnimatePresence>

      {/* Backup Modal */}
      <AnimatePresence>{showBackupModal && (<motion.div className="modal-overlay" onClick={() => setShowBackupModal(false)}><motion.div className="modal-content" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowBackupModal(false)}>×</button><h3><FaDatabase /> Backup Management</h3>{backupProgress > 0 && <div className="progress-bar"><div className="progress-fill" style={{ width: `${backupProgress}%` }}></div><span>{backupProgress}%</span></div>}<button className="btn-primary" onClick={createBackup}><FaCloudUploadAlt /> Create New Backup</button><h4>Existing Backups</h4><div className="backups-list">{backups.map(backup => (<div key={backup.id} className="backup-item"><div className="backup-info"><FaDatabase /><span>{backup?.filename || 'Unknown'}</span><small>{backup?.created_at ? new Date(backup.created_at).toLocaleString() : 'N/A'}</small><span>{backup?.size ? `${(backup.size / 1024).toFixed(2)} KB` : '0 KB'}</span></div><button className="btn-danger btn-sm" onClick={() => restoreBackup(backup.id)}><FaUndo /> Restore</button></div>))}</div><div className="modal-actions"><button className="btn-secondary" onClick={() => setShowBackupModal(false)}>Close</button></div></motion.div></motion.div>)}</AnimatePresence>

      {/* Webhook Modal */}
      <AnimatePresence>{showWebhookModal && (<motion.div className="modal-overlay" onClick={() => setShowWebhookModal(false)}><motion.div className="modal-content" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowWebhookModal(false)}>×</button><h3><FaPlug /> Add Webhook</h3><div className="form-group"><label>URL</label><input type="url" value={newWebhook.url} onChange={(e) => setNewWebhook({...newWebhook, url: e.target.value})} className="form-control" /></div><div className="form-group"><label>Events</label><select multiple value={newWebhook.events} onChange={(e) => setNewWebhook({...newWebhook, events: Array.from(e.target.selectedOptions, o => o.value)})} className="form-control"><option value="order.created">Order Created</option><option value="order.completed">Order Completed</option><option value="payment.received">Payment Received</option><option value="agent.approved">Agent Approved</option></select></div><div className="form-group"><label>Secret</label><input type="text" value={newWebhook.secret} onChange={(e) => setNewWebhook({...newWebhook, secret: e.target.value})} className="form-control" /></div><div className="modal-actions"><button className="btn-secondary" onClick={() => setShowWebhookModal(false)}>Cancel</button><button className="btn-primary" onClick={createWebhook}>Create</button></div></motion.div></motion.div>)}</AnimatePresence>

      {/* User Details Modal */}
      <AnimatePresence>{showUserModal && selectedUser && (<motion.div className="modal-overlay" onClick={() => setShowUserModal(false)}><motion.div className="modal-content" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowUserModal(false)}>×</button><h3>User Details: {selectedUser?.username || 'Unknown'}</h3><div className="user-details-grid"><div className="detail-item"><label>Email:</label><span>{selectedUser?.email || 'N/A'}</span></div><div className="detail-item"><label>Phone:</label><span>{selectedUser?.phone || 'N/A'}</span></div><div className="detail-item"><label>Wallet:</label><span>₵{selectedUser?.wallet_balance || 0}</span></div><div className="detail-item"><label>Total Spent:</label><span>₵{selectedUser?.total_spent || 0}</span></div><div className="detail-item"><label>Joined:</label><span>{selectedUser?.created_at ? new Date(selectedUser.created_at).toLocaleString() : 'N/A'}</span></div></div><div className="modal-actions"><button className="btn-secondary" onClick={() => setShowUserModal(false)}>Close</button><button className="btn-primary" onClick={() => { setShowUserModal(false); setNewUser(selectedUser); setShowCreateUserModal(true); }}><FaEdit /> Edit</button></div></motion.div></motion.div>)}</AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>{showSettingsModal && (<motion.div className="modal-overlay" onClick={() => setShowSettingsModal(false)}><motion.div className="modal-content settings-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowSettingsModal(false)}>×</button><h3><FaCog /> System Settings</h3><div className="settings-grid"><div className="setting-group"><h4>Commission Rates</h4><label>Bronze: <input type="number" value={systemSettings.commission_rates?.bronze || 10} onChange={(e) => setSystemSettings({...systemSettings, commission_rates: {...systemSettings.commission_rates, bronze: parseInt(e.target.value)}})} /></label><label>Silver: <input type="number" value={systemSettings.commission_rates?.silver || 15} onChange={(e) => setSystemSettings({...systemSettings, commission_rates: {...systemSettings.commission_rates, silver: parseInt(e.target.value)}})} /></label><label>Gold: <input type="number" value={systemSettings.commission_rates?.gold || 20} onChange={(e) => setSystemSettings({...systemSettings, commission_rates: {...systemSettings.commission_rates, gold: parseInt(e.target.value)}})} /></label><label>Platinum: <input type="number" value={systemSettings.commission_rates?.platinum || 25} onChange={(e) => setSystemSettings({...systemSettings, commission_rates: {...systemSettings.commission_rates, platinum: parseInt(e.target.value)}})} /></label></div><div className="setting-group"><h4>WAEC & Bills</h4><label>WAEC Commission: <input type="number" value={systemSettings.waec_commission || 10} onChange={(e) => setSystemSettings({...systemSettings, waec_commission: parseInt(e.target.value)})} />%</label><label>Bill Commission: <input type="number" value={systemSettings.bill_commission || 5} onChange={(e) => setSystemSettings({...systemSettings, bill_commission: parseInt(e.target.value)})} />%</label></div></div><div className="modal-actions"><button className="btn-secondary" onClick={() => setShowSettingsModal(false)}>Cancel</button><button className="btn-primary" onClick={() => { api.put('/admin/settings', systemSettings); toast.success('Settings saved'); setShowSettingsModal(false); }}>Save</button></div></motion.div></motion.div>)}</AnimatePresence>
    </motion.div>
  );
}
