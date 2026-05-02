// src/pages/AgentDashboard.js - With Dynamic Size Input

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { 
  FaWallet, FaShoppingCart, FaChartLine, FaUsers, FaGift, 
  FaMobileAlt, FaClock, FaCheckCircle, FaDatabase, FaHistory, 
  FaCopy, FaCheck, FaUniversity, FaCreditCard, FaSpinner,
  FaDownload, FaUpload, FaEye, FaTimes, FaTrophy, FaStar,
  FaUserPlus, FaMoneyBillWave, FaExchangeAlt, FaPercent,
  FaBoxes, FaChartPie, FaTrendUp, FaPhoneAlt, FaEnvelope,
  FaWhatsapp, FaTelegram, FaShareAlt, FaFileExcel, FaPlus,
  FaTrash, FaShoppingBag, FaStore, FaCrown, FaArrowUp,
  FaGraduationCap, FaBolt, FaTint, FaTv, FaGlobe, FaQrcode,
  FaSearch
} from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import PurchaseConfirmationModal from '../components/PurchaseConfirmationModal';

// Chart.js registration
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

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  phone: '0557388622',
  website: 'https://roamsmart.shop',
  supportWhatsapp: '233557388622'
};

export default function AgentDashboard() {
  const { user } = useAuth();
  
  // State Management
  const [stats, setStats] = useState({ 
    wallet_balance: 0, 
    total_sales: 0, 
    total_orders: 0, 
    agent_savings: 0,
    total_commission: 0,
    pending_commission: 0,
    today_sales: 0,
    this_week_sales: 0,
    this_month_sales: 0,
    total_customers: 0,
    agent_tier: 'Bronze',
    next_tier_sales: 500,
    commission_rate: 10,
    rank: 0,
    username: ''
  });
  
  const [bundles, setBundles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState('mtn');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  
  // Dynamic size states
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedWholesalePrice, setSelectedWholesalePrice] = useState(null);
  const [selectedSellingPrice, setSelectedSellingPrice] = useState(null);
  const [selectedProfit, setSelectedProfit] = useState(null);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [showCustomSize, setShowCustomSize] = useState(false);
  
  // Dynamic prices state
  const [agentBundles, setAgentBundles] = useState({});
  const [suggestedPrices, setSuggestedPrices] = useState({});
  const [pricesLoading, setPricesLoading] = useState(true);
  
  // Cart System
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [cartPhone, setCartPhone] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  
  // Bulk Order
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkPreview, setBulkPreview] = useState([]);
  const [processingBulk, setProcessingBulk] = useState(false);
  
  // Earnings & Withdrawals
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawing, setWithdrawing] = useState(false);
  
  // Purchase Confirmation
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [sellingBundle, setSellingBundle] = useState(null);
  
  // Fund Wallet
  const [showFundModal, setShowFundModal] = useState(false);
  
  // Store Management
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [storeSettings, setStoreSettings] = useState({
    store_name: '',
    store_slug: '',
    contact_phone: '',
    contact_email: '',
    store_description: '',
    markup: 15
  });
  const [savingStore, setSavingStore] = useState(false);
  
  // Quick Actions
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  
  // UI States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dateRange, setDateRange] = useState('week');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
    fetchWithdrawals();
    fetchCustomers();
    fetchStoreSettings();
    fetchPrices();
  }, []);

  // Update available sizes when network changes
  useEffect(() => {
    if (agentBundles[selectedNetwork]) {
      const sizes = Object.keys(agentBundles[selectedNetwork]).map(Number).sort((a, b) => a - b);
      setAvailableSizes(sizes);
    }
  }, [selectedNetwork, agentBundles]);

  // Listen for price updates from admin
  useEffect(() => {
    const handlePriceUpdate = () => {
      console.log('Price update detected, refreshing agent prices...');
      fetchPrices();
      toast.info('Prices have been updated by admin', { duration: 3000 });
    };
    
    window.addEventListener('prices-updated', handlePriceUpdate);
    
    return () => {
      window.removeEventListener('prices-updated', handlePriceUpdate);
    };
  }, []);

  // Fetch prices function
  const fetchPrices = async () => {
    try {
      setPricesLoading(true);
      const res = await api.get('/prices');
      console.log('Fetched agent prices:', res.data);
      
      const wholesalePrices = res.data.data;
      setAgentBundles(wholesalePrices);
      
      // Calculate suggested retail prices based on store markup
      const markup = storeSettings.markup || 15;
      const retailPrices = {};
      for (const [network, bundles] of Object.entries(wholesalePrices)) {
        retailPrices[network] = {};
        for (const [size, price] of Object.entries(bundles)) {
          retailPrices[network][size] = price * (1 + markup / 100);
        }
      }
      setSuggestedPrices(retailPrices);
      
    } catch (error) {
      console.error('Failed to fetch agent prices:', error);
      // Fallback to default values
      const fallbackPrices = {
        mtn: { '1': 5.50, '2': 10.00, '5': 22.00, '10': 42.00, '20': 80.00 },
        telecel: { '1': 5.00, '2': 9.00, '5': 20.00, '10': 38.00, '20': 75.00 },
        airteltigo: { '1': 5.00, '2': 9.00, '5': 20.00, '10': 38.00, '20': 75.00 }
      };
      setAgentBundles(fallbackPrices);
      
      // Calculate suggested retail for fallback
      const markup = storeSettings.markup || 15;
      const retailPrices = {};
      for (const [network, bundles] of Object.entries(fallbackPrices)) {
        retailPrices[network] = {};
        for (const [size, price] of Object.entries(bundles)) {
          retailPrices[network][size] = price * (1 + markup / 100);
        }
      }
      setSuggestedPrices(retailPrices);
    } finally {
      setPricesLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes] = await Promise.all([
        api.get('/agent/stats'),
        api.get('/agent/orders')
      ]);
      
      console.log('========== FETCH DATA DEBUG ==========');
      console.log('Stats response:', statsRes.data);
      console.log('Orders response:', ordersRes.data);
      
      setStats(prev => ({ 
        ...prev, 
        ...statsRes.data.data,
        username: user?.username || statsRes.data.data?.username || 'Agent'
      }));
      
      let ordersArray = [];
      if (ordersRes.data && ordersRes.data.data) {
        ordersArray = ordersRes.data.data;
      } else if (Array.isArray(ordersRes.data)) {
        ordersArray = ordersRes.data;
      } else if (ordersRes.data && ordersRes.data.orders) {
        ordersArray = ordersRes.data.orders;
      }
      
      setOrders(ordersArray);
      
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load Roamsmart data');
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await api.get('/agent/withdrawals');
      setWithdrawals(res.data.data?.withdrawals || res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch withdrawals');
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/agent/customers');
      setCustomers(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch customers');
    }
  };

  const fetchStoreSettings = async () => {
    try {
      const res = await api.get('/agent/store');
      if (res.data.data) {
        setStoreSettings(res.data.data);
      }
    } catch (error) {
      console.error('No store settings found');
    }
  };

  // Validate Ghana phone number
  const validatePhone = (phone) => {
    const phoneRegex = /^(024|025|026|027|028|020|054|055|059|050|057|053|056)[0-9]{7}$/;
    return phoneRegex.test(phone);
  };

  // Handle network change for dynamic sizes
  const handleNetworkChange = async (network) => {
    setSelectedNetwork(network);
    setSelectedSize('');
    setSelectedWholesalePrice(null);
    setSelectedSellingPrice(null);
    setSelectedProfit(null);
    setShowCustomSize(false);
  };

  // Handle size selection from chips
  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    setShowCustomSize(false);
    const wholesalePrice = agentBundles[selectedNetwork]?.[size];
    if (wholesalePrice) {
      const markup = storeSettings.markup || 15;
      const sellingPrice = wholesalePrice * (1 + markup / 100);
      const profit = sellingPrice - wholesalePrice;
      setSelectedWholesalePrice(wholesalePrice);
      setSelectedSellingPrice(sellingPrice);
      setSelectedProfit(profit);
    }
  };

  // Handle custom size input (checks if price exists)
  const handleCustomSize = async (e) => {
    const size = parseInt(e.target.value);
    setSelectedSize(e.target.value);
    
    if (size && !isNaN(size) && size > 0 && size <= 100) {
      setLoadingPrice(true);
      try {
        // Check if price exists for this size
        const wholesalePrice = agentBundles[selectedNetwork]?.[size];
        if (wholesalePrice) {
          const markup = storeSettings.markup || 15;
          const sellingPrice = wholesalePrice * (1 + markup / 100);
          const profit = sellingPrice - wholesalePrice;
          setSelectedWholesalePrice(wholesalePrice);
          setSelectedSellingPrice(sellingPrice);
          setSelectedProfit(profit);
          setShowCustomSize(false);
          toast.success(`${size}GB package available for ${selectedNetwork.toUpperCase()}`);
        } else {
          setSelectedWholesalePrice(null);
          setSelectedSellingPrice(null);
          setSelectedProfit(null);
          setShowCustomSize(true);
          toast.error(`No price configured for ${size}GB on ${selectedNetwork.toUpperCase()}. Contact admin to add this size.`);
        }
      } catch (error) {
        setSelectedWholesalePrice(null);
        setSelectedSellingPrice(null);
        setSelectedProfit(null);
        setShowCustomSize(true);
      } finally {
        setLoadingPrice(false);
      }
    } else {
      setSelectedWholesalePrice(null);
      setSelectedSellingPrice(null);
      setSelectedProfit(null);
      setSelectedSize('');
      setShowCustomSize(false);
    }
  };

  // ========== SELL DATA FUNCTION ==========
  const sellData = async (network, sizeGb, wholesalePrice, phone, customerNameValue) => {
    if (!validatePhone(phone)) {
      toast.error('Please enter a valid Ghana phone number (e.g., 024XXXXXXX)');
      setSellingBundle(null);
      return;
    }
    
    const markup = storeSettings.markup || 15;
    const sellingPrice = wholesalePrice * (1 + markup / 100);
    const profit = sellingPrice - wholesalePrice;
    
    if (stats.wallet_balance < wholesalePrice) {
      const result = await Swal.fire({
        icon: 'warning',
        title: 'Insufficient Wallet Balance!',
        html: `
          <p>You need ₵${wholesalePrice.toFixed(2)} to purchase this bundle.</p>
          <p>Your current balance: ₵${stats.wallet_balance?.toFixed(2) || '0.00'}</p>
          <p>Please fund your Roamsmart wallet to continue.</p>
        `,
        confirmButtonColor: '#8B0000',
        confirmButtonText: 'Fund Wallet Now',
        showCancelButton: true,
        cancelButtonText: 'Cancel'
      });
      
      setSellingBundle(null);
      
      if (result.isConfirmed) {
        setShowFundModal(true);
      }
      return;
    }
    
    setPendingPurchase({
      network,
      sizeGb,
      wholesalePrice,
      phone,
      customerName: customerNameValue,
      sellingPrice,
      profit
    });
    
    setShowConfirmModal(true);
    setSellingBundle(null);
  };

  const confirmSale = async () => {
    if (!pendingPurchase) return;
    
    setConfirmLoading(true);
    setShowConfirmModal(false);
    
    try {
      const res = await api.post('/agent/sell', { 
        network: pendingPurchase.network, 
        size_gb: pendingPurchase.sizeGb, 
        phone: pendingPurchase.phone, 
        customer_name: pendingPurchase.customerName,
        selling_price: pendingPurchase.sellingPrice
      });
      
      if (res.data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Sale Complete on Roamsmart!',
          html: `
            <p>✅ Sold ${pendingPurchase.sizeGb}GB ${pendingPurchase.network.toUpperCase()} to ${pendingPurchase.phone}</p>
            <p>💰 Your Profit: ₵${pendingPurchase.profit.toFixed(2)}</p>
            <p class="text-muted">New Balance: ₵${res.data.data?.new_balance || (stats.wallet_balance - pendingPurchase.wholesalePrice)}</p>
          `,
          confirmButtonColor: '#8B0000'
        });
        
        await fetchData();
        await fetchCustomers();
        await fetchPrices(); // Refresh prices after sale
        
        setCustomerPhone('');
        setCustomerName('');
        setSelectedSize('');
        setSelectedWholesalePrice(null);
        setSelectedSellingPrice(null);
        setSelectedProfit(null);
        setPendingPurchase(null);
        
        toast.success(`Sale recorded on ${COMPANY.shortName}!`);
      }
    } catch (error) {
      console.error('Sale error:', error);
      toast.error(error.response?.data?.error || 'Sale failed');
    } finally {
      setConfirmLoading(false);
    }
  };

  // ========== CART FUNCTIONS ==========
  const addToCart = (network, sizeGb, price) => {
    const existingItem = cart.find(item => item.network === network && item.size === sizeGb);
    if (existingItem) {
      setCart(cart.map(item => 
        item.network === network && item.size === sizeGb 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { network, size: sizeGb, price, quantity: 1 }]);
    }
    toast.success(`Added ${sizeGb}GB ${network.toUpperCase()} to Roamsmart cart`);
  };

  const removeFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    toast.success('Item removed from cart');
  };

  const updateQuantity = (index, quantity) => {
    if (quantity < 1) {
      removeFromCart(index);
      return;
    }
    const newCart = [...cart];
    newCart[index].quantity = quantity;
    setCart(newCart);
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const checkoutCart = async () => {
    if (!cartPhone) {
      toast.error('Enter customer phone number');
      return;
    }
    if (!validatePhone(cartPhone)) {
      toast.error('Please enter a valid Ghana phone number');
      return;
    }
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setCheckingOut(true);
    
    try {
      const ordersData = cart.map(item => ({
        network: item.network,
        size_gb: item.size,
        phone: cartPhone,
        quantity: item.quantity
      }));

      const res = await api.post('/agent/bulk-order', { orders: ordersData });
      if (res.data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Bulk Sale Complete!',
          html: `
            <p>✅ Successfully sold ${res.data.data?.total_orders || cart.length} bundles on ${COMPANY.shortName}!</p>
            <p>💰 Total Profit: ₵${res.data.data?.total_profit?.toFixed(2) || '0.00'}</p>
          `,
          confirmButtonColor: '#8B0000'
        });
        setCart([]);
        setCartPhone('');
        setShowCart(false);
        fetchData();
      } else {
        toast.error(res.data.error || 'Checkout failed');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.error || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  // ========== BULK EXCEL UPLOAD ==========
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      
      const ordersList = rows.map(row => ({
        phone: row.Phone || row.phone,
        network: (row.Network || row.network || '').toLowerCase(),
        size_gb: parseInt(row.Size || row.size || row.GB),
        quantity: parseInt(row.Quantity || row.quantity || 1)
      }));
      
      setBulkPreview(ordersList);
      toast.success(`${ordersList.length} orders loaded from Excel`);
    };
    
    reader.readAsArrayBuffer(file);
  };

  const processBulkOrders = async () => {
    setProcessingBulk(true);
    try {
      const res = await api.post('/agent/bulk-order', { orders: bulkPreview });
      if (res.data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Bulk Orders Processed!',
          html: `
            <p>✅ Processed ${res.data.data?.success_count || bulkPreview.length} orders on Roamsmart</p>
            <p>💰 Total Profit: ₵${res.data.data?.total_profit?.toFixed(2) || '0.00'}</p>
          `,
          confirmButtonColor: '#8B0000'
        });
        setBulkPreview([]);
        setShowBulkModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Bulk order error:', error);
      toast.error(error.response?.data?.error || 'Bulk order failed');
    } finally {
      setProcessingBulk(false);
    }
  };

  // ========== WITHDRAWAL FUNCTIONS ==========
  const requestWithdrawal = async () => {
    const amount = parseFloat(withdrawAmount);
    if (amount < 50) {
      toast.error('Minimum withdrawal is GHS 50');
      return;
    }
    if (amount > stats.total_commission) {
      toast.error('Insufficient commission balance');
      return;
    }
    if (!withdrawPhone) {
      toast.error('Enter mobile money number');
      return;
    }
    if (!validatePhone(withdrawPhone)) {
      toast.error('Enter a valid Ghana mobile money number');
      return;
    }

    setWithdrawing(true);
    
    try {
      const res = await api.post('/agent/withdraw', {
        amount,
        mobile_money: withdrawPhone
      });
      if (res.data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Withdrawal Request Submitted!',
          html: `
            <p>✅ ₵${amount.toFixed(2)} withdrawal request submitted to ${COMPANY.name}</p>
            <p>⏱️ Please allow up to 24 hours for processing.</p>
          `,
          confirmButtonColor: '#8B0000'
        });
        setWithdrawAmount('');
        setWithdrawPhone('');
        setShowWithdrawModal(false);
        fetchData();
        fetchWithdrawals();
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error(error.response?.data?.error || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  // ========== SAVE STORE SETTINGS ==========
  const saveStoreSettings = async () => {
    if (!storeSettings.store_name) {
      toast.error('Please enter a store name');
      return;
    }
    if (!storeSettings.store_slug) {
      toast.error('Please enter a store URL slug');
      return;
    }
    
    setSavingStore(true);
    
    try {
      await api.post('/agent/store', storeSettings);
      toast.success(`Store settings saved on ${COMPANY.name}!`);
      setShowStoreModal(false);
      
      const storeUrl = `${window.location.origin}/store/${storeSettings.store_slug}`;
      Swal.fire({
        icon: 'success',
        title: 'Store Created on Roamsmart!',
        html: `Your Roamsmart store is live at: <br/><a href="${storeUrl}" target="_blank">${storeUrl}</a><br/><br/>Share this link with your customers!`,
        confirmButtonColor: '#8B0000'
      });
      
      // Refresh prices with new markup
      fetchPrices();
    } catch (error) {
      console.error('Save store error:', error);
      toast.error('Failed to save store settings');
    } finally {
      setSavingStore(false);
    }
  };

  // ========== SHARE FUNCTIONS ==========
  const shareWhatsApp = (product) => {
    const storeUrl = `${window.location.origin}/store/${storeSettings.store_slug || 'roamsmart'}`;
    const message = `📱 *ROAMSMART DATA BUNDLE* 📱\n\n` +
      `${product.network?.toUpperCase() || ''} ${product.size || ''}GB - Only ₵${product.selling_price || ''}\n` +
      `⚡ Instant Delivery | 🔒 Secure Payment\n` +
      `📞 Contact me: ${storeSettings.contact_phone || COMPANY.phone}\n\n` +
      `Order now from ${storeSettings.store_name || COMPANY.shortName} on Roamsmart Digital Service!\n` +
      `Store link: ${storeUrl}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const copyShareLink = () => {
    const shareLink = `${window.location.origin}/store/${storeSettings.store_slug || 'roamsmart'}`;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success(`${COMPANY.shortName} store link copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  // ========== CHART DATA ==========
  const getSalesChartData = () => {
    const weeklyData = stats.this_week_sales ? [stats.this_week_sales * 0.2, stats.this_week_sales * 0.3, stats.this_week_sales * 0.5, stats.this_week_sales * 0.7, stats.this_week_sales * 0.9, stats.this_week_sales, stats.this_week_sales * 0.8] : [85, 120, 95, 180, 160, 250, 210];
    const monthlyData = [450, 520, 680, 890, 1100, 1450];
    const yearlyData = [3200, 4500, 5800, 7200, 8900, 10500, 12800, 15200, 17800, 20500, 23500, 26800];
    
    let data;
    if (dateRange === 'week') data = weeklyData;
    else if (dateRange === 'month') data = monthlyData;
    else data = yearlyData;
    
    return {
      labels: dateRange === 'week' 
        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        : dateRange === 'month'
        ? ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{ 
        label: `${COMPANY.shortName} Sales (GHS)`, 
        data, 
        backgroundColor: '#D2691E',
        borderColor: '#8B0000',
        borderWidth: 2,
        borderRadius: 8,
        tension: 0.4,
        fill: true
      }]
    };
  };

  const getCommissionChartData = () => {
    return {
      labels: ['MTN', 'Telecel', 'AirtelTigo'],
      datasets: [{ 
        data: [65, 25, 10], 
        backgroundColor: ['#FFC107', '#EC008C', '#ED1B24'],
        borderWidth: 0
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#e0e0e0' } },
      x: { grid: { display: false } }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: { legend: { position: 'bottom' } }
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading {COMPANY.name} Agent Dashboard...</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard agent-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>{COMPANY.name} - Agent Dashboard</h1>
          <p>Welcome back, {stats.username || user?.username || 'Agent'}! You're earning {stats.commission_rate}% commission on Roamsmart</p>
        </div>
        <div className="wallet-card">
          <FaWallet />
          <span>₵{stats.wallet_balance?.toFixed(2) || '0.00'}</span>
        </div>
      </div>

      <div className="agent-tabs">
        <button className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <FaChartLine /> Dashboard
        </button>
        <button className={`tab ${activeTab === 'sell' ? 'active' : ''}`} onClick={() => setActiveTab('sell')}>
          <FaShoppingCart /> Sell Data
        </button>
        <button className={`tab ${activeTab === 'earnings' ? 'active' : ''}`} onClick={() => setActiveTab('earnings')}>
          <FaMoneyBillWave /> Earnings
        </button>
        <button className={`tab ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}>
          <FaUsers /> Customers
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <>
          <div className="stats-grid">
            <motion.div whileHover={{ y: -5 }} className="stat-card">
              <div className="stat-icon"><FaWallet /></div>
              <div className="stat-value">₵{stats.wallet_balance?.toFixed(2) || '0.00'}</div>
              <div className="stat-label">{COMPANY.shortName} Wallet</div>
            </motion.div>
            
            <motion.div whileHover={{ y: -5 }} className="stat-card">
              <div className="stat-icon"><FaMoneyBillWave /></div>
              <div className="stat-value">₵{stats.total_sales?.toFixed(2) || '0'}</div>
              <div className="stat-label">Total Sales</div>
            </motion.div>
            
            <motion.div whileHover={{ y: -5 }} className="stat-card">
              <div className="stat-icon"><FaPercent /></div>
              <div className="stat-value">{stats.total_orders || 0}</div>
              <div className="stat-label">Total Orders</div>
            </motion.div>
            
            <motion.div whileHover={{ y: -5 }} className="stat-card">
              <div className="stat-icon"><FaTrophy /></div>
              <div className="stat-value">₵{stats.agent_savings?.toFixed(2) || '0'}</div>
              <div className="stat-label">Your Savings</div>
            </motion.div>
          </div>

          <div className="stats-grid">
            <motion.div whileHover={{ y: -5 }} className="stat-card commission-card">
              <div className="stat-icon"><FaChartLine /></div>
              <div className="stat-value">₵{stats.total_commission?.toFixed(2) || '0'}</div>
              <div className="stat-label">Total Commission Earned</div>
            </motion.div>
            
            <motion.div whileHover={{ y: -5 }} className="stat-card pending-card">
              <div className="stat-icon"><FaClock /></div>
              <div className="stat-value">₵{stats.pending_commission?.toFixed(2) || '0'}</div>
              <div className="stat-label">Pending Commission</div>
            </motion.div>
            
            <motion.div whileHover={{ y: -5 }} className="stat-card">
              <div className="stat-icon"><FaUsers /></div>
              <div className="stat-value">{stats.total_customers || 0}</div>
              <div className="stat-label">Total Customers</div>
            </motion.div>
            
            <motion.div whileHover={{ y: -5 }} className="stat-card">
              <div className="stat-icon"><FaCrown /></div>
              <div className="stat-value">{stats.agent_tier || 'Bronze'}</div>
              <div className="stat-label">Agent Tier on Roamsmart</div>
            </motion.div>
          </div>

          <div className="tier-progress-card">
            <h3><FaArrowUp /> Next Tier: {stats.agent_tier === 'Bronze' ? 'Silver' : stats.agent_tier === 'Silver' ? 'Gold' : 'Platinum'}</h3>
            <div className="progress-bar-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${Math.min(100, (stats.total_sales / stats.next_tier_sales) * 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="progress-stats">
              <span>₵{stats.total_sales?.toFixed(2)} / ₵{stats.next_tier_sales}</span>
              <span>{Math.min(100, ((stats.total_sales / stats.next_tier_sales) * 100)).toFixed(1)}%</span>
            </div>
          </div>

          <div className="charts-row">
            <motion.div initial={{ x: -20 }} animate={{ x: 0 }} className="chart-card">
              <div className="chart-header">
                <h3><FaChartLine /> {COMPANY.shortName} Sales Performance</h3>
                <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="date-select">
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>
              <Line data={getSalesChartData()} options={chartOptions} />
            </motion.div>
            
            <motion.div initial={{ x: 20 }} animate={{ x: 0 }} className="chart-card">
              <h3><FaChartPie /> Commission by Network</h3>
              <Doughnut data={getCommissionChartData()} options={doughnutOptions} />
            </motion.div>
          </div>
        </>
      )}

      {/* Sell Tab with Dynamic Size Input */}
      {activeTab === 'sell' && (
        <>
          <div className="quick-actions-bar">
            <button className="action-btn" onClick={() => setShowCart(true)}>
              <FaShoppingBag /> Cart ({cart.length})
            </button>
            <button className="action-btn" onClick={() => setShowBulkModal(true)}>
              <FaFileExcel /> Bulk Upload
            </button>
            <button className="action-btn" onClick={() => setShowStoreModal(true)}>
              <FaStore /> My Roamsmart Store
            </button>
          </div>

          <div className="section-header">
            <h2><FaDatabase /> Wholesale Prices on Roamsmart</h2>
            <div className="network-tabs">
              {['mtn', 'telecel', 'airteltigo'].map(net => (
                <button 
                  key={net} 
                  className={`tab-btn ${selectedNetwork === net ? 'active' : ''}`} 
                  onClick={() => handleNetworkChange(net)}
                >
                  {net.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="customer-input-row">
            <div className="input-group">
              <FaPhoneAlt />
              <input 
                type="tel" 
                placeholder="Customer Phone Number (e.g., 024XXXXXXX)" 
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="input-group">
              <FaUserPlus />
              <input 
                type="text" 
                placeholder="Customer Name (Optional)" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="form-control"
              />
            </div>
          </div>

          {/* Dynamic Size Input Section */}
          <div className="custom-size-section-agent">
            <div className="custom-size-input-agent">
              <h3>Enter Custom Data Size</h3>
              <div className="size-input-group-agent">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={selectedSize}
                  onChange={handleCustomSize}
                  placeholder="Enter GB (e.g., 15)"
                  className="form-control"
                />
                <span className="gb-label-agent">GB</span>
              </div>
              
              {loadingPrice && <div className="spinner-small"><FaSpinner className="spinning" /> Checking price...</div>}
              
              {selectedWholesalePrice !== null && !loadingPrice && (
                <div className="price-display-agent">
                  <div className="price-row">
                    <span>Wholesale Price:</span>
                    <strong>₵{selectedWholesalePrice.toFixed(2)}</strong>
                  </div>
                  <div className="price-row">
                    <span>Suggested Selling Price ({storeSettings.markup || 15}% markup):</span>
                    <strong className="selling-price">₵{selectedSellingPrice.toFixed(2)}</strong>
                  </div>
                  <div className="price-row profit">
                    <span>Your Profit:</span>
                    <strong className="profit-amount">+₵{selectedProfit.toFixed(2)}</strong>
                  </div>
                  <button 
                    className="btn-primary btn-block"
                    onClick={() => {
                      if (!customerPhone) {
                        toast.error('Enter customer phone number first');
                        return;
                      }
                      setSellingBundle(`${selectedNetwork}-${selectedSize}`);
                      sellData(selectedNetwork, parseInt(selectedSize), selectedWholesalePrice, customerPhone, customerName);
                    }}
                    disabled={!selectedSize}
                  >
                    Sell {selectedSize}GB for ₵{selectedSellingPrice?.toFixed(2)}
                  </button>
                </div>
              )}
              
              {selectedSize && selectedWholesalePrice === null && !loadingPrice && (
                <div className="price-not-found-agent">
                  <p>⚠️ No price configured for {selectedSize}GB on {selectedNetwork.toUpperCase()}</p>
                  <p className="text-muted">Please contact admin to add this size or select from available sizes below</p>
                </div>
              )}
              
              <div className="available-sizes-agent">
                <h4>Available Sizes (Admin Configured)</h4>
                <div className="size-chips-agent">
                  {availableSizes.map(size => (
                    <button
                      key={size}
                      className={`size-chip-agent ${selectedSize == size ? 'active' : ''}`}
                      onClick={() => handleSizeSelect(size)}
                    >
                      {size}GB
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Predefined Bundles Grid (Fallback/Quick Buy) */}
          <div className="bundles-grid-agent">
            <h3 className="bundles-subtitle-agent">Popular Bundles</h3>
            <div className="bundles-grid-container-agent">
              {Object.entries(agentBundles[selectedNetwork] || {}).slice(0, 5).map(([size, wholesalePrice]) => {
                const sellingPrice = wholesalePrice * (1 + (storeSettings.markup || 15) / 100);
                const profit = sellingPrice - wholesalePrice;
                const isSelling = sellingBundle === `${selectedNetwork}-${size}`;
                
                return (
                  <motion.div 
                    key={size} 
                    whileHover={{ y: -5, scale: 1.02 }} 
                    className="bundle-card-agent"
                  >
                    <div className="bundle-size">{size}GB</div>
                    <div className="bundle-wholesale">Wholesale: ₵{wholesalePrice}</div>
                    <div className="bundle-price">Sell: ₵{sellingPrice.toFixed(2)}</div>
                    <div className="bundle-profit">Your Profit: ₵{profit.toFixed(2)}</div>
                    <div className="bundle-actions">
                      <button 
                        className="btn-primary btn-sm"
                        onClick={() => {
                          if (!customerPhone) {
                            toast.error('Enter customer phone number first');
                            return;
                          }
                          setSellingBundle(`${selectedNetwork}-${size}`);
                          sellData(selectedNetwork, parseInt(size), wholesalePrice, customerPhone, customerName);
                        }}
                        disabled={isSelling}
                      >
                        {isSelling ? <FaSpinner className="spinning" /> : 'Sell on Roamsmart'}
                      </button>
                      <button 
                        className="btn-outline btn-sm"
                        onClick={() => addToCart(selectedNetwork, parseInt(size), wholesalePrice)}
                      >
                        <FaPlus /> Add to Cart
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="suggested-prices">
            <h3>💰 Suggested Retail Prices for Roamsmart</h3>
            <div className="price-table">
              {Object.entries(suggestedPrices[selectedNetwork] || {}).slice(0, 5).map(([size, price]) => (
                <div key={size} className="price-item">
                  <span>{size}GB</span>
                  <span>₵{price.toFixed(2)}</span>
                  <span className="profit-badge">+₵{(price - agentBundles[selectedNetwork][size]).toFixed(2)} profit</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Earnings Tab */}
      {activeTab === 'earnings' && (
        <>
          <div className="earnings-summary">
            <div className="earnings-card">
              <h3>Available for Withdrawal on Roamsmart</h3>
              <div className="earnings-amount">₵{stats.total_commission?.toFixed(2) || '0.00'}</div>
              <button className="btn-primary" onClick={() => setShowWithdrawModal(true)}>
                Request Withdrawal
              </button>
              <small>Minimum withdrawal: GHS 50 | Processed within 24 hours</small>
            </div>

            <div className="earnings-stats">
              <div className="stat-item">
                <span>Total Commission Earned on Roamsmart</span>
                <strong>₵{stats.total_commission?.toFixed(2) || '0'}</strong>
              </div>
              <div className="stat-item">
                <span>This Month</span>
                <strong>₵{stats.this_month_sales?.toFixed(2) || '0'}</strong>
              </div>
              <div className="stat-item">
                <span>Your Commission Rate</span>
                <strong>{stats.commission_rate || 10}%</strong>
              </div>
            </div>
          </div>

          <div className="section-header">
            <h3>Withdrawal History from Roamsmart</h3>
          </div>
          <div className="withdrawals-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Mobile Money</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(w => (
                  <tr key={w.id}>
                    <td>{new Date(w.created_at).toLocaleDateString()}</td>
                    <td className="amount">₵{w.amount}</td>
                    <td>{w.mobile_money}</td>
                    <td><span className={`status ${w.status}`}>{w.status === 'pending' ? 'Processing' : w.status}</span></td>
                  </tr>
                ))}
                {withdrawals.length === 0 && (
                  <tr><td colSpan="4" className="text-center">No withdrawals yet on Roamsmart</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <>
          <div className="customer-search">
            <input 
              type="text" 
              placeholder="Search by phone or name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="customers-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Total Spent on Roamsmart</th>
                  <th>Orders</th>
                  <th>Last Purchase</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {customers
                  .filter(c => c.phone?.includes(searchTerm) || c.name?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(customer => (
                    <tr key={customer.id || customer.phone}>
                      <td>{customer.name || 'Anonymous'}</td>
                      <td>{customer.phone}</td>
                      <td className="amount">₵{customer.total_spent?.toFixed(2) || '0'}</td>
                      <td>{customer.order_count || 0}</td>
                      <td>{customer.last_purchase ? new Date(customer.last_purchase).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <button 
                          className="btn-sm btn-outline"
                          onClick={() => {
                            setCustomerPhone(customer.phone);
                            setSelectedCustomer(customer);
                            setShowCustomerModal(true);
                          }}
                        >
                          <FaEye /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center">No customers yet. Start selling on Roamsmart!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Additional Services Section */}
      <div className="additional-services-section">
        <div className="section-header">
          <h2><FaGraduationCap /> Additional Services on Roamsmart</h2>
          <p>WAEC Vouchers & Bill Payments - Earn commission on these too!</p>
        </div>
        
        <div className="services-grid">
          <div className="service-card waec-card">
            <div className="service-header">
              <FaGraduationCap className="service-icon" />
              <h3>WAEC Result Checker</h3>
              <span className="agent-badge-small">Earn 10% Commission on Roamsmart</span>
            </div>
            <p className="service-description">Sell WAEC vouchers to your customers and earn commission</p>
            <button className="btn-outline btn-sm" onClick={() => window.location.href = '/waec-vouchers'}>
              Sell WAEC Vouchers
            </button>
          </div>

          <div className="service-card bills-card">
            <div className="service-header">
              <FaBolt className="service-icon" />
              <h3>Pay Bills</h3>
              <span className="agent-badge-small">Earn 5% Commission on Roamsmart</span>
            </div>
            <p className="service-description">Help customers pay electricity, water, and TV bills</p>
            <button className="btn-outline btn-sm" onClick={() => window.location.href = '/bills'}>
              Process Bill Payments
            </button>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="section-header">
        <h2><FaHistory /> Recent Sales on Roamsmart</h2>
      </div>
      <div className="orders-table">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Amount</th>
              <th>Your Profit</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 10).map(order => (
              <tr key={order.order_id || order.id}>
                <td className="order-id">{order.order_id || order.id}</td>
                <td>{order.customer_phone || order.phone || order.customer_phone}</td>
                <td>{order.network} {order.size_gb}GB</td>
                <td className="amount">₵{order.amount || order.selling_price}</td>
                <td className="profit">+₵{order.profit || (order.commission_amount || 0)}</td>
                <td className="date">{new Date(order.created_at || order.date).toLocaleDateString()}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center">No sales yet. Start selling on Roamsmart!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <motion.div className="modal-overlay" onClick={() => setShowCart(false)}>
            <motion.div className="modal-content cart-modal" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowCart(false)}>×</button>
              <h3><FaShoppingBag /> Your Roamsmart Cart ({cart.length} items)</h3>
              
              <div className="cart-items">
                {cart.map((item, index) => (
                  <div key={index} className="cart-item">
                    <div className="item-info">
                      <span className="item-name">{item.network.toUpperCase()} {item.size}GB</span>
                      <span className="item-price">₵{item.price}</span>
                    </div>
                    <div className="item-actions">
                      <input 
                        type="number" 
                        value={item.quantity}
                        onChange={(e) => updateQuantity(index, parseInt(e.target.value))}
                        min="1"
                        className="item-qty"
                      />
                      <button onClick={() => removeFromCart(index)} className="remove-btn">
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="cart-total">
                <span>Total:</span>
                <strong>₵{getCartTotal().toFixed(2)}</strong>
              </div>
              
              <div className="form-group">
                <label>Customer Phone Number</label>
                <input 
                  type="tel" 
                  value={cartPhone}
                  onChange={(e) => setCartPhone(e.target.value)}
                  placeholder="024XXXXXXX"
                  className="form-control"
                />
                <small>Enter customer's Ghana mobile number</small>
              </div>
              
              <button onClick={checkoutCart} className="btn-primary btn-block" disabled={checkingOut}>
                {checkingOut ? <FaSpinner className="spinning" /> : `Checkout on Roamsmart (₵${getCartTotal().toFixed(2)})`}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Upload Modal */}
      <AnimatePresence>
        {showBulkModal && (
          <motion.div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
            <motion.div className="modal-content bulk-modal" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowBulkModal(false)}>×</button>
              <h3><FaFileExcel /> Bulk Order Upload to Roamsmart</h3>
              
              <div className="bulk-upload-area">
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleExcelUpload} />
                <p>Upload Excel with columns: Phone, Network, Size, Quantity</p>
              </div>
              
              {bulkPreview.length > 0 && (
                <div className="bulk-preview">
                  <h4>Preview ({bulkPreview.length} orders)</h4>
                  <div className="preview-table">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Phone</th>
                          <th>Network</th>
                          <th>Size</th>
                          <th>Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkPreview.slice(0, 5).map((order, i) => (
                          <tr key={i}>
                            <td>{order.phone}</td>
                            <td>{order.network}</td>
                            <td>{order.size_gb}GB</td>
                            <td>{order.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {bulkPreview.length > 5 && <p>+{bulkPreview.length - 5} more orders</p>}
                  </div>
                  <button onClick={processBulkOrders} className="btn-primary" disabled={processingBulk}>
                    {processingBulk ? <FaSpinner className="spinning" /> : `Process ${bulkPreview.length} Orders on Roamsmart`}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdrawal Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div className="modal-overlay" onClick={() => setShowWithdrawModal(false)}>
            <motion.div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowWithdrawModal(false)}>×</button>
              <h3>Request Withdrawal from Roamsmart</h3>
              
              <div className="form-group">
                <label>Amount (GHS)</label>
                <input 
                  type="number" 
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount (min. 50)"
                  className="form-control"
                  min="50"
                />
                <small>Available: ₵{stats.total_commission?.toFixed(2) || '0'}</small>
              </div>
              
              <div className="form-group">
                <label>Mobile Money Number</label>
                <input 
                  type="tel" 
                  value={withdrawPhone}
                  onChange={(e) => setWithdrawPhone(e.target.value)}
                  placeholder="024XXXXXXX"
                  className="form-control"
                />
                <small>MTN, Telecel, or AirtelTigo Money number</small>
              </div>
              
              <button onClick={requestWithdrawal} className="btn-primary btn-block" disabled={withdrawing}>
                {withdrawing ? <FaSpinner className="spinning" /> : 'Request Withdrawal from Roamsmart'}
              </button>
              
              <div className="withdrawal-note">
                <small>⚠️ Withdrawals are processed within 24 hours</small>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Store Settings Modal */}
      <AnimatePresence>
        {showStoreModal && (
          <motion.div className="modal-overlay" onClick={() => setShowStoreModal(false)}>
            <motion.div className="modal-content store-modal" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowStoreModal(false)}>×</button>
              <h3><FaStore /> Your Roamsmart Store Setup</h3>
              
              <div className="form-group">
                <label>Store Name</label>
                <input 
                  type="text" 
                  value={storeSettings.store_name}
                  onChange={(e) => setStoreSettings({...storeSettings, store_name: e.target.value})}
                  placeholder="My Awesome Store"
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label>Store URL Slug</label>
                <input 
                  type="text" 
                  value={storeSettings.store_slug}
                  onChange={(e) => setStoreSettings({...storeSettings, store_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
                  placeholder="my-store"
                  className="form-control"
                />
                <small>Your Roamsmart store: roamsmart.shop/store/{storeSettings.store_slug || 'my-store'}</small>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Contact Phone</label>
                  <input 
                    type="tel" 
                    value={storeSettings.contact_phone}
                    onChange={(e) => setStoreSettings({...storeSettings, contact_phone: e.target.value})}
                    placeholder="024XXXXXXX"
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Contact Email</label>
                  <input 
                    type="email" 
                    value={storeSettings.contact_email}
                    onChange={(e) => setStoreSettings({...storeSettings, contact_email: e.target.value})}
                    placeholder="store@example.com"
                    className="form-control"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Store Description</label>
                <textarea 
                  value={storeSettings.store_description}
                  onChange={(e) => setStoreSettings({...storeSettings, store_description: e.target.value})}
                  placeholder="Tell customers about your Roamsmart store..."
                  className="form-control"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>Your Markup (%)</label>
                <input 
                  type="number" 
                  value={storeSettings.markup}
                  onChange={(e) => setStoreSettings({...storeSettings, markup: parseInt(e.target.value)})}
                  placeholder="15"
                  className="form-control"
                  min="0"
                  max="100"
                />
                <small>Current markup: {storeSettings.markup}% (You earn this on every Roamsmart sale)</small>
              </div>
              
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowStoreModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={saveStoreSettings} disabled={savingStore}>
                  {savingStore ? <FaSpinner className="spinning" /> : 'Save Roamsmart Store'}
                </button>
              </div>
              
              <div className="store-share">
                <button className="btn-outline" onClick={copyShareLink}>
                  {copied ? <FaCheck /> : <FaCopy />} {copied ? 'Copied!' : 'Copy Store Link'}
                </button>
                <button className="btn-outline" onClick={() => shareWhatsApp({ network: '', size: '', selling_price: '' })}>
                  <FaWhatsapp /> Share Store
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer Details Modal */}
      <AnimatePresence>
        {showCustomerModal && selectedCustomer && (
          <motion.div className="modal-overlay" onClick={() => setShowCustomerModal(false)}>
            <motion.div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowCustomerModal(false)}>×</button>
              <h3>Customer Details - Roamsmart</h3>
              
              <div className="customer-details">
                <p><strong>Name:</strong> {selectedCustomer.name || 'Anonymous'}</p>
                <p><strong>Phone:</strong> {selectedCustomer.phone}</p>
                <p><strong>Total Spent on Roamsmart:</strong> ₵{selectedCustomer.total_spent?.toFixed(2) || '0'}</p>
                <p><strong>Total Orders:</strong> {selectedCustomer.order_count || 0}</p>
                <p><strong>Last Purchase:</strong> {selectedCustomer.last_purchase ? new Date(selectedCustomer.last_purchase).toLocaleString() : 'N/A'}</p>
              </div>
              
              <button 
                className="btn-primary btn-block"
                onClick={() => {
                  setShowCustomerModal(false);
                  setActiveTab('sell');
                }}
              >
                Sell to this Customer on Roamsmart
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Purchase Confirmation Modal */}
      <PurchaseConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setPendingPurchase(null);
        }}
        onConfirm={confirmSale}
        details={{
          phoneNumber: pendingPurchase?.phone,
          network: pendingPurchase?.network,
          sizeGb: pendingPurchase?.sizeGb,
          quantity: 1,
          amount: pendingPurchase?.sellingPrice
        }}
        loading={confirmLoading}
      />

      {/* Fund Wallet Modal (Simplified) */}
      <AnimatePresence>
        {showFundModal && (
          <motion.div className="modal-overlay" onClick={() => setShowFundModal(false)}>
            <motion.div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowFundModal(false)}>×</button>
              <h3>Fund Your Roamsmart Wallet</h3>
              <p>Contact admin to fund your wallet or use the fund wallet option in your dashboard.</p>
              <button className="btn-primary btn-block" onClick={() => setShowFundModal(false)}>
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Note */}
      <div className="dashboard-footer">
        <p className="text-center text-muted">
          <small>Powered by {COMPANY.name} | Need help? Contact {COMPANY.email}</small>
        </p>
      </div>
    </motion.div>
  );
}