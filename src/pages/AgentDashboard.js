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
  FaSearch, FaArrowRight, FaArrowLeft, FaInfoCircle, FaRegClock,
  FaFileInvoice, FaSync, FaRocket, FaSignal
} from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import PurchaseConfirmationModal from '../components/PurchaseConfirmationModal';
import BundleSwitcher from '../components/BundleSwitcher';

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

// Payment Methods Configuration
const paymentMethods = [
  { 
    id: 'paystack', 
    name: 'Paystack', 
    fee: '2.5% + ₵0.50', 
    min: 10, 
    max: 100000, 
    icon: <FaCreditCard />,
    description: 'Instant top-up via card or bank transfer',
    time: 'Instant',
    color: '#00B3E6'
  },
  { 
    id: 'momo', 
    name: 'MTN MoMo', 
    fee: '1%', 
    min: 10, 
    max: 10000, 
    icon: <FaMobileAlt />,
    description: 'Instant payment via mobile money',
    time: 'Instant',
    color: '#FFC107',
    comingSoon: true
  },
  { 
    id: 'manual', 
    name: 'Manual Transfer', 
    fee: 'No fees', 
    min: 10, 
    max: 100000, 
    icon: <FaUniversity />,
    description: 'Admin approval required',
    time: '5-30 minutes',
    color: '#28a745'
  }
];

// ========== MTN DELIVERY OPTIONS CARD - Always visible, selection updates prices ==========
const MTNDeliveryOptionsCard = ({ deliveryOptions, loading, onOptionSelect, selectedOption, countdown, lastUpdate }) => {
  const getSpeedColor = (avgTime) => {
    if (avgTime <= 4) return { bg: '#d4edda', text: '#155724', label: 'Instant' };
    if (avgTime <= 8) return { bg: '#d1ecf1', text: '#0c5460', label: 'Very Fast' };
    if (avgTime <= 15) return { bg: '#fff3cd', text: '#856404', label: 'Fast' };
    return { bg: '#f8d7da', text: '#721c24', label: 'Delay Expected' };
  };

  const getEstimatedTimes = (avgTime) => {
    const now = new Date();
    const startTime = new Date(now);
    const endTime = new Date(now.getTime() + avgTime * 60000);
    
    return {
      start: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      end: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderRadius: '20px',
        padding: '20px',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <div className="spinner-small">
          <FaSpinner className="spinning" />
          <span style={{ marginLeft: '12px', color: 'white' }}>Loading MTN delivery options...</span>
        </div>
      </div>
    );
  }

  if (!deliveryOptions || deliveryOptions.length === 0) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderRadius: '20px',
        padding: '20px',
        marginBottom: '24px',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.7)'
      }}>
        <FaMobileAlt size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
        <p>Unable to load MTN delivery options</p>
        <p style={{ fontSize: '0.75rem', marginTop: '8px' }}>Please check your connection and refresh</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      borderRadius: '20px',
      padding: '20px',
      marginBottom: '24px',
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      {/* Live Update Indicator */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(255,255,255,0.15)',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '0.7rem'
      }}>
        <span style={{ 
          width: '8px', 
          height: '8px', 
          background: '#28a745', 
          borderRadius: '50%',
          animation: 'pulse 1.5s infinite'
        }}></span>
        <span style={{ color: 'rgba(255,255,255,0.8)' }}>Live updates in {countdown}s</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <FaMobileAlt size={28} style={{ color: '#FFD700' }} />
        <div>
          <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem' }}>MTN Delivery Speed</h3>
          <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.7, color: 'white' }}>
            Select your preferred delivery speed - Prices will update automatically
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Delivery Options Cards - Always clickable */}
      {deliveryOptions.map((option) => {
        const speedColor = getSpeedColor(option.delivery_time.avg);
        const times = getEstimatedTimes(option.delivery_time.avg);
        const isSelected = selectedOption?.type === option.type;
        
        return (
          <div 
            key={option.type}
            style={{
              background: isSelected ? `linear-gradient(135deg, ${option.color || '#8B0000'}, ${option.color === '#f39c12' ? '#e67e22' : '#D2691E'})` : speedColor.bg,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: isSelected ? '2px solid #FFD700' : '1px solid rgba(0,0,0,0.05)',
              transform: isSelected ? 'scale(1.01)' : 'scale(1)'
            }}
            onClick={() => onOptionSelect(option)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>{option.icon || '📱'}</span>
                <strong style={{ fontSize: '1rem', color: isSelected ? 'white' : speedColor.text }}>
                  {option.name}
                  {isSelected && <span style={{ marginLeft: '8px', fontSize: '0.7rem' }}>✓ SELECTED</span>}
                </strong>
              </div>
              <span style={{ 
                background: isSelected ? 'rgba(255,255,255,0.3)' : 
                           option.type === 'express' ? '#28a745' :
                           option.type === 'mashup' ? '#dc3545' : '#28a745',
                color: isSelected ? 'white' : 'white',
                padding: '2px 10px', 
                borderRadius: '20px',
                fontSize: '0.7rem',
                fontWeight: 'bold'
              }}>
                {option.type === 'express' ? 'Very Fast' :
                 option.type === 'mashup' ? 'Delay Expected' : 'Instant'}
              </span>
            </div>
            
            <div style={{ fontSize: '0.85rem', color: isSelected ? 'rgba(255,255,255,0.9)' : speedColor.text, marginBottom: '8px' }}>
              Est. {option.delivery_time.avg} mins ({option.delivery_time.min}-{option.delivery_time.max} min)
            </div>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '8px', fontSize: '0.75rem', color: isSelected ? 'rgba(255,255,255,0.8)' : speedColor.text }}>
              <span>{times.start}</span>
              <span>→</span>
              <span>{times.end}</span>
              <span>· {option.delivery_time.avg} mins</span>
            </div>
            
            {option.queue_length > 0 && (
              <div style={{ fontSize: '0.7rem', color: isSelected ? 'rgba(255,255,255,0.8)' : speedColor.text }}>
                {option.queue_length} in queue · waiting {option.delivery_time.avg} mins
              </div>
            )}
            
            {/* Price information - shows multiplier effect */}
            <div style={{ 
              marginTop: '10px', 
              fontSize: '0.75rem', 
              color: isSelected ? 'rgba(255,255,255,0.8)' : '#666',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>💰 Price multiplier: {option.price_multiplier}x</span>
              {option.fixed_premium > 0 && (
                <span>+ {option.fixed_premium.toFixed(2)} premium</span>
              )}
            </div>
          </div>
        );
      })}

      {/* Recommendation Tip */}
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '8px',
        padding: '10px',
        marginTop: '12px',
        fontSize: '0.75rem',
        color: 'rgba(255,255,255,0.8)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <FaRocket size={14} />
        <span>💡 Select a delivery speed first, then choose your data bundle. Prices will update automatically!</span>
      </div>
    </div>
  );
};

export default function AgentDashboard() {
  const { user } = useAuth();
  
  // State Management
  const [stats, setStats] = useState({ 
    wallet_balance: 0, 
    total_sales: 0, 
    total_orders: 0, 
    agent_savings: 0,
    today_sales: 0,
    this_week_sales: 0,
    this_month_sales: 0,
    total_customers: 0,
    agent_tier: 'Bronze',
    next_tier_sales: 500,
    rank: 0,
    username: ''
  });
  
  // Bundle Switcher State
  const [selectedBundleOption, setSelectedBundleOption] = useState(null);
  const [showBundleSwitcher, setShowBundleSwitcher] = useState(false);

  // MTN Delivery Options States - ALWAYS FETCHED, INDEPENDENT OF SIZE
  const [deliveryOptions, setDeliveryOptions] = useState([]);
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState(null);
  const [deliveryOptionsLoading, setDeliveryOptionsLoading] = useState(false);
  const [deliveryCountdown, setDeliveryCountdown] = useState(30);
  const [lastDeliveryUpdate, setLastDeliveryUpdate] = useState(null);

  const [bundles, setBundles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState('mtn');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [customPrices, setCustomPrices] = useState({});
  const [editingPrice, setEditingPrice] = useState(null);
  // Payment States
  const [showFundModal, setShowFundModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyOption, setVerifyOption] = useState('auto');
  const [fundStep, setFundStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState('paystack');
  const [fundAmount, setFundAmount] = useState('');
  const [manualRequest, setManualRequest] = useState(null);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [copied, setCopied] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(stats?.phone || user?.phone || '');
  
  // Auto Verification States
  const [verifyReference, setVerifyReference] = useState('');
  const [verifyTransactionId, setVerifyTransactionId] = useState('');
  const [verifySenderName, setVerifySenderName] = useState('');
  const [verifySenderPhone, setVerifySenderPhone] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [pendingTopups, setPendingTopups] = useState([]);
  
  // Manual Verification States (Upload Proof)
  const [manualVerifyReference, setManualVerifyReference] = useState('');
  const [manualVerifyAmount, setManualVerifyAmount] = useState('');
  const [manualVerifyProof, setManualVerifyProof] = useState(null);
  const [manualVerifyUploading, setManualVerifyUploading] = useState(false);
  const [pendingPayments, setPendingPayments] = useState([]);
  
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
  const [networkStatus, setNetworkStatus] = useState(null);
  // Bulk Order
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkPreview, setBulkPreview] = useState([]);
  const [processingBulk, setProcessingBulk] = useState(false);
  
  // Purchase Confirmation
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [sellingBundle, setSellingBundle] = useState(null);
  
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
  const [statusFilter, setStatusFilter] = useState('all');

  const [storeEarnings, setStoreEarnings] = useState({
    total_sales: 0,
    total_earnings: 0,
    pending_payouts: 0,
    orders_count: 0,
    earnings_by_month: {},
    recent_orders: []
  });
  const [loadingEarnings, setLoadingEarnings] = useState(false);
  
  const quickAmounts = [50, 100, 200, 500, 1000];

  const fetchDeliveryOptions = async () => {
  if (selectedNetwork !== 'mtn') return;
  
  setDeliveryOptionsLoading(true);
  try {
    const response = await api.get('/delivery/options', {
      params: { 
        network: 'mtn',
        size_gb: selectedSize ? parseInt(selectedSize) : 1
      }
    });
    
    console.log('========== DELIVERY OPTIONS DEBUG ==========');
    console.log('Full response:', response);
    console.log('Response data:', response.data);
    
    if (response.data && response.data.success) {
      const deliveryData = response.data.data;
      const optionsData = deliveryData?.options || [];
      
      console.log('Options received:', optionsData);
      
      // Log each option's prices (ALL sizes)
      optionsData.forEach((opt, idx) => {
        const priceCount = opt.prices ? Object.keys(opt.prices).length : 0;
        console.log(`Option ${idx} (${opt.type}):`, {
          name: opt.name,
          prices: opt.prices,  // ALL prices for ALL sizes
          base_price: opt.base_price,
          offer_slug: opt.offer_slug,
          delivery_time: opt.delivery_time
        });
      });
      
      // Store the delivery options (with ALL prices)
      setDeliveryOptions(optionsData);
      
      // Set default selected option (master bundle)
      if (!selectedDeliveryOption && optionsData.length > 0) {
        const defaultOption = optionsData.find(opt => opt.type === 'master') || 
                              optionsData.find(opt => opt.type === 'standard') || 
                              optionsData[0];
        if (defaultOption) {
          console.log('Setting default option:', defaultOption);
          setSelectedDeliveryOption(defaultOption);
          
          // Update price based on default option's price for the selected size
          if (selectedSize && selectedWholesalePrice) {
            // Get the price for the current size from the prices object
            const newPrice = defaultOption.prices?.[parseInt(selectedSize)] || selectedWholesalePrice;
            setSelectedSellingPrice(newPrice);
            setSelectedProfit(newPrice - selectedWholesalePrice);
            
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch delivery options:', error);
  } finally {
    setDeliveryOptionsLoading(false);
  }
};

const handleDeliveryOptionSelect = (option) => {
  console.log('Delivery option selected:', option);
  
  if (!option) {
    console.warn('No option provided');
    return;
  }
  
  // Store the selected delivery option
  setSelectedDeliveryOption(option);
  
  // If a size is already selected, update prices immediately
  if (selectedSize && selectedWholesalePrice) {
    // Get the price for the current size from the option's prices object
    const newPrice = option?.prices?.[parseInt(selectedSize)] || selectedWholesalePrice;
    const newProfit = newPrice - selectedWholesalePrice;
    
    console.log('💰 Updating price:', {
      optionType: option.type,
      optionName: option.name,
      selectedSize: selectedSize,
      newPrice: newPrice,
      wholesale: selectedWholesalePrice,
      profit: newProfit
    });
    
    setSelectedSellingPrice(newPrice);
    setSelectedProfit(newProfit);
    
    
  } else {
    toast.success(`${option.name} selected - Select a data size to see the price`);
  }
};

  const handleSizeSelect = (size) => {
  setSelectedSize(size);
  setShowCustomSize(false);
  const wholesalePrice = agentBundles[selectedNetwork]?.[size];
  if (wholesalePrice) {
    let sellingPrice = wholesalePrice * (1 + (storeSettings.markup || 15) / 100);
    
    // If delivery option is selected, get the price for this specific size
    if (selectedNetwork === 'mtn' && selectedDeliveryOption) {
      sellingPrice = selectedDeliveryOption?.prices?.[parseInt(size)] || wholesalePrice;
      console.log(`✅ Using delivery option price for ${size}GB: ${selectedDeliveryOption.type} = ${sellingPrice}`);
    }
    
    const profit = sellingPrice - wholesalePrice;
    setSelectedWholesalePrice(wholesalePrice);
    setSelectedSellingPrice(sellingPrice);
    setSelectedProfit(profit);
    setShowBundleSwitcher(true);
    
    console.log('📊 Size selected:', {
      size,
      wholesalePrice,
      sellingPrice,
      profit,
      selectedDeliveryOption: selectedDeliveryOption?.type,
      price: selectedDeliveryOption?.prices?.[parseInt(size)]
    });
  }
};

  // ========== HANDLE CUSTOM SIZE ==========
  const handleCustomSize = async (e) => {
  const size = parseInt(e.target.value);
  setSelectedSize(e.target.value);
  
  if (size && !isNaN(size) && size > 0 && size <= 100) {
    setLoadingPrice(true);
    try {
      const wholesalePrice = agentBundles[selectedNetwork]?.[size];
      if (wholesalePrice) {
        let sellingPrice = wholesalePrice * (1 + (storeSettings.markup || 15) / 100);
        
        // If delivery option is selected, use its direct price
        if (selectedNetwork === 'mtn' && selectedDeliveryOption) {
          sellingPrice = selectedDeliveryOption?.prices?.[parseInt(size)] || wholesalePrice;
        }
        
        if (selectedBundleOption && selectedBundleOption.selling_price) {
          sellingPrice = selectedBundleOption.selling_price;
        }
        
        const profit = sellingPrice - wholesalePrice;
        setSelectedWholesalePrice(wholesalePrice);
        setSelectedSellingPrice(sellingPrice);
        setSelectedProfit(profit);
        setShowCustomSize(false);
        setShowBundleSwitcher(true);
      } else {
        setSelectedWholesalePrice(null);
        setSelectedSellingPrice(null);
        setSelectedProfit(null);
        setShowCustomSize(true);
        setShowBundleSwitcher(false);
      }
    } catch (error) {
      setSelectedWholesalePrice(null);
      setSelectedSellingPrice(null);
      setSelectedProfit(null);
      setShowCustomSize(true);
      setShowBundleSwitcher(false);
    } finally {
      setLoadingPrice(false);
    }
  } else {
    setSelectedWholesalePrice(null);
    setSelectedSellingPrice(null);
    setSelectedProfit(null);
    setSelectedSize('');
    setShowCustomSize(false);
    setShowBundleSwitcher(false);
  }
};

  // ========== HANDLE BUNDLE CHANGE FROM SWITCHER ==========
  const handleBundleChange = (option) => {
    setSelectedBundleOption(option);
    console.log('BundleSwitcher selected option:', option);
    
    if (!option) {
      console.warn('No option provided to handleBundleChange');
      return;
    }
    
    // Safely get the final price from the option with multiple fallbacks
    let finalPrice = null;
    
    if (option.final_price !== undefined && option.final_price !== null) {
      finalPrice = option.final_price;
    } else if (option.selling_price !== undefined && option.selling_price !== null) {
      finalPrice = option.selling_price;
    } else if (option.price !== undefined && option.price !== null) {
      finalPrice = option.price;
    } else if (option.finalPrice !== undefined && option.finalPrice !== null) {
      finalPrice = option.finalPrice;
    } else if (selectedWholesalePrice && option.price_multiplier) {
      // Calculate from multiplier if we have base price
      finalPrice = (selectedWholesalePrice * option.price_multiplier) + (option.fixed_premium || 0);
    }
    
    // Update selling price if we have a valid price
    if (finalPrice !== null && !isNaN(finalPrice) && selectedWholesalePrice !== null) {
      setSelectedSellingPrice(finalPrice);
      setSelectedProfit(finalPrice - selectedWholesalePrice);
      toast.success(`${option.name || 'Bundle'} selected - New price: ${finalPrice.toFixed(2)}`);
    } else {
      // Just show delivery info without price
      const avgTime = option.delivery_time?.avg || '?';
      toast.success(`${option.name || 'Bundle'} selected - Delivery: ~${avgTime} min`);
    }
  };

  // ========== SELL DATA ==========
  const sellData = async (network, sizeGb, wholesalePrice, phone, customerNameValue, finalPrice = null) => {
  if (!validatePhone(phone)) {
    toast.error('Please enter a valid Ghana phone number (e.g., 024XXXXXXX)');
    setSellingBundle(null);
    return;
  }
  
  if (!network || !sizeGb) {
    toast.error('Please select a network and data size');
    setSellingBundle(null);
    return;
  }
  
  if (!wholesalePrice || wholesalePrice <= 0) {
    toast.error('Invalid price. Please try again.');
    setSellingBundle(null);
    return;
  }
  
  try {
    let sellingPrice = finalPrice;
    if (!sellingPrice) {
      const markup = storeSettings.markup || 15;
      sellingPrice = wholesalePrice * (1 + markup / 100);
      
      // If delivery option is selected, use its direct price
      if (network === 'mtn' && selectedDeliveryOption) {
        sellingPrice = selectedDeliveryOption?.prices?.[parseInt(sizeGb)]  || wholesalePrice;
        console.log(`💰 Selling with ${selectedDeliveryOption.type}: ₵${sellingPrice}`);
      }
    }
    
    if (selectedBundleOption && selectedBundleOption.selling_price) {
      sellingPrice = selectedBundleOption.selling_price;
    }
    
    const profit = sellingPrice - wholesalePrice;
    
    // Get the offer_slug and delivery_type from the selected delivery option
    const offerSlug = selectedDeliveryOption?.offer_slug || 
                      (selectedDeliveryOption?.type === 'express' ? 'mtn_express_bundle' : 'mtn_data_bundle');
    const deliveryType = selectedDeliveryOption?.type || 'master';
    
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
      profit,
      offerSlug: offerSlug,
      deliveryType: deliveryType,
      bundleName: selectedDeliveryOption?.name || 'Standard Delivery'
    });
    
    setShowConfirmModal(true);
    setSellingBundle(null);
    
  } catch (error) {
    console.error('Error in sellData:', error);
    toast.error('An unexpected error occurred. Please try again.');
    setSellingBundle(null);
  }
};

const confirmSale = async () => {
  if (!pendingPurchase) return;
  
  setConfirmLoading(true);
  setShowConfirmModal(false);
  const loadingToast = toast.loading('Processing your sale...');
  
  try {
    const res = await api.post('/agent/sell', {
      network: pendingPurchase.network,
      size_gb: pendingPurchase.sizeGb,
      phone: pendingPurchase.phone,
      customer_name: pendingPurchase.customerName,
      selling_price: pendingPurchase.sellingPrice,
      delivery_type: pendingPurchase.deliveryType,
        // <-- ADD THIS - SEND OFFER_SLUG TO BACKEND
    });
    
    toast.dismiss(loadingToast);
    
    if (res.data.success) {
      await fetchData();
      await fetchCustomers();
      await fetchPrices();
      
      await Swal.fire({
        icon: 'success',
        title: 'Sale Complete on Roamsmart!',
        html: `
          <p>✅ Sold ${pendingPurchase.sizeGb}GB ${pendingPurchase.network.toUpperCase()} to ${pendingPurchase.phone}</p>
          <p>🚀 Delivery: ${pendingPurchase.bundleName}</p>
          <p>💰 Your Profit: ₵${pendingPurchase.profit.toFixed(2)}</p>
          <p class="text-muted">New Balance: ₵${res.data.data?.balance || (stats.wallet_balance - pendingPurchase.wholesalePrice)}</p>
        `,
        confirmButtonColor: '#8B0000'
      });
      
      // Reset all states
      setCustomerPhone('');
      setCustomerName('');
      setSelectedSize('');
      setSelectedWholesalePrice(null);
      setSelectedSellingPrice(null);
      setSelectedProfit(null);
      setShowBundleSwitcher(false);
      setSelectedBundleOption(null);
      setPendingPurchase(null);
      
    } else {
      toast.error(res.data.error || 'Sale failed. Please try again.');
      await Swal.fire({
        icon: 'error',
        title: 'Sale Failed',
        text: res.data.error || 'Sale failed. Please try again.',
        confirmButtonColor: '#8B0000'
      });
    }
    
  } catch (error) {
    toast.dismiss(loadingToast);
    console.error('Confirm sale error:', error);
    
    let errorMessage = 'Sale failed. Please try again.';
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timed out. Please check your connection and try again.';
    } else if (error.response) {
      if (error.response.status === 401) {
        errorMessage = 'Session expired. Please login again.';
        localStorage.removeItem('token');
        localStorage.removeItem('roamsmart_token');
        window.location.href = '/login';
      } else if (error.response.status === 500) {
        errorMessage = 'Server error. Our team has been notified. Please try again later.';
      } else {
        errorMessage = error.response.data?.error || 'Sale failed. Please try again.';
      }
    } else if (error.request) {
      errorMessage = 'Network error. Please check your internet connection.';
    }
    
    toast.error(errorMessage);
    await Swal.fire({
      icon: 'error',
      title: 'Sale Failed',
      text: errorMessage,
      confirmButtonColor: '#8B0000'
    });
    
  } finally {
    setConfirmLoading(false);
  }
};

  // Auto-refresh delivery options every 30 seconds
  useEffect(() => {
    let intervalId = null;
    let countdownId = null;
    
    if (selectedNetwork === 'mtn') {
      // Initial fetch
      fetchDeliveryOptions();
      
      // Refresh every 30 seconds (only queue info updates, database options are cached)
      intervalId = setInterval(() => {
        fetchDeliveryOptions();
      }, 30000);
      
      countdownId = setInterval(() => {
        setDeliveryCountdown(prev => prev > 0 ? prev - 1 : 30);
      }, 1000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
      if (countdownId) clearInterval(countdownId);
    };
  }, [selectedNetwork, selectedSize]);

  useEffect(() => {
    fetchData();
    fetchCustomers();
    fetchStoreSettings();
    fetchPrices();
    fetchPendingTopups();
    fetchPendingPayments();
    fetchStoreEarnings();
  }, []);

  useEffect(() => {
    if (agentBundles[selectedNetwork]) {
      const sizes = Object.keys(agentBundles[selectedNetwork]).map(Number).sort((a, b) => a - b);
      setAvailableSizes(sizes);
    }
  }, [selectedNetwork, agentBundles]);

  useEffect(() => {
    const handlePriceUpdate = () => {
      fetchPrices();
      toast.info('Prices have been updated by admin', { duration: 3000 });
    };
    window.addEventListener('prices-updated', handlePriceUpdate);
    return () => window.removeEventListener('prices-updated', handlePriceUpdate);
  }, []);

  const fetchPendingTopups = async () => {
    try {
      const res = await api.get('/wallet/pending-topups');
      setPendingTopups(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch pending topups');
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const res = await api.get('/user/pending-payments');
      setPendingPayments(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch pending payments:', error);
    }
  };

  const fetchStoreProducts = async () => {
    try {
      const res = await api.get('/agent/store');
      if (res.data.data) {
        if (res.data.data.custom_products) setSelectedProducts(res.data.data.custom_products);
        if (res.data.data.custom_prices) setCustomPrices(res.data.data.custom_prices);
      }
    } catch (error) {
      console.error('Failed to fetch store products:', error);
    }
  };

  const fetchStoreEarnings = async () => {
    setLoadingEarnings(true);
    try {
      const response = await api.get('/agent/store-earnings');
      if (response.data.success) setStoreEarnings(response.data.data);
    } catch (error) {
      console.error('Failed to fetch store earnings:', error);
    } finally {
      setLoadingEarnings(false);
    }
  };

  const openStoreModal = async () => {
    await fetchStoreProducts();
    setShowStoreModal(true);
  };
  
  const fetchPrices = async () => {
    try {
      setPricesLoading(true);
      const res = await api.get('/prices');
      const wholesalePrices = res.data.data;
      setAgentBundles(wholesalePrices);
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
      const fallbackPrices = {
        mtn: { '1': 5.50, '2': 10.00, '5': 22.00, '10': 42.00, '20': 80.00 },
        telecel: { '1': 5.00, '2': 9.00, '5': 20.00, '10': 38.00, '20': 75.00 },
        airteltigo: { '1': 5.00, '2': 9.00, '5': 20.00, '10': 38.00, '20': 75.00 }
      };
      setAgentBundles(fallbackPrices);
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
    console.log('[AgentDashboard] Fetching data...');
    const startTime = Date.now();
    
    // Fetch stats with timeout (not critical)
    const statsPromise = new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('[AgentDashboard] Stats timeout, using fallback');
        resolve({ data: { data: { wallet_balance: 0, total_orders: 0, total_sales: 0, username: user?.username || 'Agent' } } });
      }, 8000);
      
      api.get('/agent/stats')
        .then(resolve)
        .catch(() => {
          clearTimeout(timeout);
          resolve({ data: { data: { wallet_balance: 0, total_orders: 0, total_sales: 0, username: user?.username || 'Agent' } } });
        })
        .finally(() => clearTimeout(timeout));
    });
    
    // Fetch orders WITHOUT timeout (let it complete naturally)
    const ordersPromise = api.get('/agent/orders').catch(err => {
      console.warn('[AgentDashboard] Orders request failed:', err.message);
      return { data: { data: [] } };
    });
    
    // Wait for both
    const [statsRes, ordersRes] = await Promise.all([statsPromise, ordersPromise]);
    
    console.log(`[AgentDashboard] Data fetched in ${Date.now() - startTime}ms`);
    
    // Process stats
    const statsData = statsRes?.data?.data || {};
    setStats(prev => ({
      ...prev,
      ...statsData,
      username: user?.username || statsData.username || 'Agent',
      wallet_balance: statsData.wallet_balance || 0,
      total_orders: statsData.total_orders || 0,
      total_sales: statsData.total_sales || 0
    }));
    
    // Process orders
    let ordersArray = [];
    if (ordersRes?.data?.data && Array.isArray(ordersRes.data.data)) {
      ordersArray = ordersRes.data.data;
    } else if (Array.isArray(ordersRes?.data)) {
      ordersArray = ordersRes.data;
    } else if (ordersRes?.data?.orders && Array.isArray(ordersRes.data.orders)) {
      ordersArray = ordersRes.data.orders;
    }
    setOrders(ordersArray);
    
    console.log(`[AgentDashboard] Loaded ${ordersArray.length} orders`);
    
  } catch (error) {
    console.error('[AgentDashboard] Failed to load data:', error);
    setStats(prev => ({
      ...prev,
      wallet_balance: 0,
      total_orders: 0,
      total_sales: 0,
      username: user?.username || 'Agent'
    }));
    setOrders([]);
    toast.error('Failed to load Roamsmart data');
  } finally {
    setLoading(false);
  }
};
  
  const fetchOrdersWithRealTimeStatus = async () => {
    try {
      const response = await api.get('/agent/orders');
      const orders = response.data.data || [];
      const ordersToCheck = orders.filter(o => o.delivery_status === 'processing' || o.delivery_status === 'pending');
      if (ordersToCheck.length > 0) {
        const identifiers = ordersToCheck.map(o => o.provider_order_id || o.order_id);
        try {
          const statusResponse = await api.post('/digimall/bulk-status', { identifiers });
          if (statusResponse.data.success) {
            const statusMap = {};
            statusResponse.data.results.forEach(r => statusMap[r.identifier] = r.status);
            orders.forEach(order => {
              const identifier = order.provider_order_id || order.order_id;
              const liveStatus = statusMap[identifier];
              if (liveStatus && liveStatus !== order.delivery_status) order.delivery_status = liveStatus;
            });
          }
        } catch (bulkError) {
          for (const order of ordersToCheck) {
            try {
              const identifier = order.provider_order_id || order.order_id;
              const singleResponse = await api.get(`/digimall/order-status/${identifier}`);
              if (singleResponse.data.success && singleResponse.data.status) order.delivery_status = singleResponse.data.status;
            } catch (e) {}
          }
        }
      }
      setOrders(orders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
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
      if (res.data.data) setStoreSettings(res.data.data);
    } catch (error) {
      console.error('No store settings found');
    }
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^(024|025|026|027|028|020|054|055|059|050|057|053|056)[0-9]{7}$/;
    return phoneRegex.test(phone);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (order.delivery_status || order.status) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const viewOrderDetails = (order) => {
    Swal.fire({
      title: 'Order Details',
      html: `<div style="text-align: left;"><p><strong>Order ID:</strong> ${order.order_id}</p>
        <p><strong>Customer:</strong> ${order.customer_name || 'N/A'}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        <p><strong>Network:</strong> ${order.network?.toUpperCase()}</p>
        <p><strong>Size:</strong> ${order.size_gb}GB</p>
        <p><strong>Customer Paid:</strong> ₵${order.customer_paid?.toFixed(2)}</p>
        <p><strong>Your Cost:</strong> ₵${order.amount_deducted?.toFixed(2)}</p>
        <p><strong>Your Profit:</strong> ₵${order.profit?.toFixed(2)}</p>
        <p><strong>Status:</strong> ${order.delivery_status || order.status}</p>
        <p><strong>Created:</strong> ${new Date(order.created_at).toLocaleString()}</p>
        ${order.provider_order_id ? `<p><strong>Provider Order:</strong> ${order.provider_order_id}</p>` : ''}</div>`,
      confirmButtonColor: '#8B0000'
    });
  };

  const retryOrder = async (order) => {
    const result = await Swal.fire({
      title: 'Retry Order?',
      text: `Retry delivering ${order.size_gb}GB to ${order.phone}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      confirmButtonText: 'Yes, Retry'
    });
    if (result.isConfirmed) {
      try {
        const res = await api.post('/agent/retry-order', { order_id: order.order_id });
        if (res.data.success) {
          toast.success('Order retried successfully!');
          fetchData();
        }
      } catch (error) {
        toast.error('Failed to retry order');
      }
    }
  };

  // ========== PAYMENT METHODS ==========
  const handleMethodSelect = (methodId) => {
    if (paymentMethods.find(m => m.id === methodId)?.comingSoon) {
      Swal.fire({ icon: 'info', title: 'Coming Soon on Roamsmart!', text: 'This payment method will be available soon.', confirmButtonColor: '#8B0000' });
      return;
    }
    setSelectedMethod(methodId);
  };

  const initializePaystackPayment = async (amount, email, phone) => {
    setProcessingPayment(true);
    try {
      const response = await api.post('/payment/paystack/initialize', {
        amount: amount, email: email, phone: phone,
        metadata: { type: 'wallet_funding', agent_id: user?.id, agent_name: user?.username }
      });
      const { authorization_url, reference } = response.data.data;
      const paystackPopup = window.open(authorization_url, '_blank', 'width=600,height=700');
      const checkPaymentInterval = setInterval(async () => {
        try {
          const verifyResponse = await api.get(`/payment/paystack/verify/${reference}`);
          if (verifyResponse.data.data.status === 'success') {
            clearInterval(checkPaymentInterval);
            paystackPopup?.close();
            await Swal.fire({ icon: 'success', title: 'Payment Successful!', html: `₵${amount} has been added to your Roamsmart wallet.`, confirmButtonColor: '#8B0000' });
            await fetchData();
            setShowFundModal(false);
            resetFundModal();
            setProcessingPayment(false);
            fetchPendingTopups();
          }
        } catch (error) { console.error('Verification error:', error); }
      }, 5000);
      setTimeout(() => { clearInterval(checkPaymentInterval); if (processingPayment) setProcessingPayment(false); }, 300000);
    } catch (error) {
      console.error('Paystack initialization error:', error);
      toast.error(error.response?.data?.error || 'Payment initialization failed');
      setProcessingPayment(false);
    }
  };

  const initializeMomoPayment = async (amount, phone, customerName) => {
    setProcessingPayment(true);
    try {
      const response = await api.post('/payment/momo/initialize', {
        amount: amount, phone: phone, name: customerName,
        metadata: { type: 'wallet_funding', agent_id: user?.id, agent_name: user?.username }
      });
      const { payment_url, reference } = response.data.data;
      const momoPopup = window.open(payment_url, '_blank', 'width=600,height=700');
      const checkPaymentInterval = setInterval(async () => {
        try {
          const verifyResponse = await api.get(`/payment/momo/verify/${reference}`);
          if (verifyResponse.data.data.status === 'success') {
            clearInterval(checkPaymentInterval);
            momoPopup?.close();
            await Swal.fire({ icon: 'success', title: 'Payment Successful!', html: `₵${amount} has been added to your Roamsmart wallet.`, confirmButtonColor: '#8B0000' });
            await fetchData();
            setShowFundModal(false);
            resetFundModal();
            setProcessingPayment(false);
            fetchPendingTopups();
          }
        } catch (error) { console.error('MoMo verification error:', error); }
      }, 5000);
      setTimeout(() => { clearInterval(checkPaymentInterval); if (processingPayment) setProcessingPayment(false); }, 300000);
    } catch (error) {
      console.error('MoMo initialization error:', error);
      toast.error(error.response?.data?.error || 'MoMo payment initialization failed');
      setProcessingPayment(false);
    }
  };

  // ========== VERIFICATION HANDLERS ==========
  const handleAutoVerifyPayment = async () => {
    if (!verifyReference || !verifyTransactionId) {
      toast.error('Please enter reference ID and transaction ID');
      return;
    }
    setVerifying(true);
    try {
      const res = await api.post('/wallet/verify-payment', {
        reference: verifyReference.toUpperCase(), transaction_id: verifyTransactionId,
        sender_name: verifySenderName, sender_phone: verifySenderPhone
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setShowVerifyModal(false);
        resetVerifyModal();
        await fetchData();
        await fetchPendingTopups();
        Swal.fire({ icon: 'success', title: 'Wallet Credited!', html: `₵${res.data.data?.amount} has been added to your Roamsmart wallet.`, confirmButtonColor: '#8B0000' });
      }
    } catch (error) {
      console.error('Verify payment error:', error);
      toast.error(error.response?.data?.error || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleManualVerifyPayment = async () => {
    if (!manualVerifyReference) {
      toast.error('Please enter your payment reference');
      return;
    }
    if (!manualVerifyProof) {
      toast.error('Please upload your payment proof/screenshot');
      return;
    }
    setManualVerifyUploading(true);
    const formData = new FormData();
    formData.append('request_id', manualVerifyReference);
    formData.append('proof', manualVerifyProof);
    try {
      const response = await api.post('/payment/upload-proof', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (response.data.success) {
        toast.success(response.data.message || 'Payment proof submitted for admin approval!');
        setShowVerifyModal(false);
        resetVerifyModal();
        await fetchPendingPayments();
        Swal.fire({ icon: 'success', title: 'Proof Submitted!', html: `Your payment proof for reference <strong>${manualVerifyReference}</strong> has been submitted.<br><br>Admin will review and credit your wallet within 5-30 minutes.`, confirmButtonColor: '#8B0000' });
        setManualVerifyReference('');
        setManualVerifyAmount('');
        setManualVerifyProof(null);
      } else {
        toast.error(response.data.error || 'Submission failed');
      }
    } catch (error) {
      console.error('Manual verification error:', error);
      toast.error(error.response?.data?.error || 'Failed to submit proof. Please try again.');
    } finally {
      setManualVerifyUploading(false);
    }
  };

  const copyReferenceToVerify = (ref) => {
    navigator.clipboard.writeText(ref);
    setVerifyReference(ref);
    toast.success('Reference copied to verification field!');
  };

  // ========== FUND WALLET HANDLERS ==========
  const handleAmountSubmit = async () => {
    const amountNum = parseFloat(fundAmount);
    const method = paymentMethods.find(m => m.id === selectedMethod);
    if (!fundAmount || isNaN(amountNum)) { toast.error('Please enter a valid amount'); return; }
    if (amountNum < method.min) { toast.error(`Minimum amount is ₵${method.min}`); return; }
    if (amountNum > method.max) { toast.error(`Maximum amount is ₵${method.max.toLocaleString()}`); return; }

    if (selectedMethod === 'manual') {
      setLoadingRequest(true);
      try {
        const res = await api.post('/wallet/generate-reference', { amount: amountNum, payment_method: 'manual' });
        setManualRequest(res.data.data);
        setFundStep(3);
        toast.success('Manual payment request created on Roamsmart!');
      } catch (error) {
        console.error('Create manual request error:', error);
        toast.error(error.response?.data?.error || 'Failed to create request');
      } finally {
        setLoadingRequest(false);
      }
    } else if (selectedMethod === 'paystack') {
      closeFundModal();
      setTimeout(async () => {
        const { value: email } = await Swal.fire({
          title: 'Enter Your Email', input: 'email', inputPlaceholder: 'you@example.com',
          showCancelButton: true, confirmButtonColor: '#00B3E6', confirmButtonText: 'Proceed to Paystack',
          preConfirm: (emailValue) => { if (!emailValue) Swal.showValidationMessage('Email is required'); return emailValue; }
        });
        if (email) await initializePaystackPayment(amountNum, email, stats.phone || phoneNumber);
      }, 300);
    } else if (selectedMethod === 'momo') {
      closeFundModal();
      setTimeout(async () => {
        const { value: customerName } = await Swal.fire({
          title: 'Enter Your Name', input: 'text', inputPlaceholder: 'John Doe',
          showCancelButton: true, confirmButtonColor: '#FFC107', confirmButtonText: 'Proceed to MTN MoMo',
          preConfirm: (name) => { if (!name) Swal.showValidationMessage('Name is required'); return name; }
        });
        if (customerName) {
          let momoPhone = stats.phone || phoneNumber;
          if (!momoPhone || !validatePhone(momoPhone)) {
            const { value: phone } = await Swal.fire({
              title: 'Enter MTN MoMo Number', input: 'tel', inputPlaceholder: '024XXXXXXX',
              showCancelButton: true, confirmButtonColor: '#FFC107', confirmButtonText: 'Proceed',
              preConfirm: (phoneValue) => { if (!phoneValue) Swal.showValidationMessage('Phone number is required'); else if (!validatePhone(phoneValue)) Swal.showValidationMessage('Please enter a valid MTN number'); return phoneValue; }
            });
            if (phone) momoPhone = phone;
            else { setProcessingPayment(false); return; }
          }
          await initializeMomoPayment(amountNum, momoPhone, customerName);
        }
      }, 300);
    }
  };

  const closeFundModal = () => { setShowFundModal(false); resetFundModal(); };
  const handleCopyReference = () => { if (manualRequest?.reference) { navigator.clipboard.writeText(manualRequest.reference); setCopied(true); toast.success('Reference copied!'); setTimeout(() => setCopied(false), 2000); } };

  const handleFileUpload = async () => {
    if (!proofFile) { toast.error('Please select a payment screenshot'); return; }
    if (!manualRequest?.id) { toast.error('No payment request found'); return; }
    setUploadingProof(true);
    const formData = new FormData();
    formData.append('request_id', manualRequest.id);
    formData.append('proof', proofFile);
    try {
      const response = await api.post('/payment/upload-proof', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (response.data.success) {
        toast.success(response.data.message || 'Proof uploaded successfully!');
        closeFundModal();
        await fetchData();
        Swal.fire({ icon: 'success', title: 'Proof Uploaded!', html: response.data.message || 'Your payment proof has been submitted. Admin will verify within 5-30 minutes.', confirmButtonColor: '#8B0000' });
      } else {
        toast.error(response.data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploadingProof(false);
    }
  };

  const resetFundModal = () => { setFundStep(1); setFundAmount(''); setSelectedMethod('paystack'); setManualRequest(null); setProofFile(null); setCopied(false); };
  const resetVerifyModal = () => { setVerifyReference(''); setVerifyTransactionId(''); setVerifySenderName(''); setVerifySenderPhone(''); setManualVerifyReference(''); setManualVerifyAmount(''); setManualVerifyProof(null); setVerifyOption('auto'); };

  const handleNetworkChange = async (network) => {
    setSelectedNetwork(network);
    setSelectedSize('');
    setSelectedWholesalePrice(null);
    setSelectedSellingPrice(null);
    setSelectedProfit(null);
    setShowCustomSize(false);
    setShowBundleSwitcher(false);
    setSelectedBundleOption(null);
  };

  

  // ========== CART FUNCTIONS ==========
  const addToCart = (network, sizeGb, price) => {
    const existingItem = cart.find(item => item.network === network && item.size === sizeGb);
    if (existingItem) setCart(cart.map(item => item.network === network && item.size === sizeGb ? { ...item, quantity: item.quantity + 1 } : item));
    else setCart([...cart, { network, size: sizeGb, price, quantity: 1 }]);
    toast.success(`Added ${sizeGb}GB ${network.toUpperCase()} to Roamsmart cart`);
  };

  const removeFromCart = (index) => { const newCart = cart.filter((_, i) => i !== index); setCart(newCart); toast.success('Item removed from cart'); };
  const updateQuantity = (index, quantity) => { if (quantity < 1) { removeFromCart(index); return; } const newCart = [...cart]; newCart[index].quantity = quantity; setCart(newCart); };
  const getCartTotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const checkoutCart = async () => {
    if (!cartPhone) { toast.error('Enter customer phone number'); return; }
    if (!validatePhone(cartPhone)) { toast.error('Please enter a valid Ghana phone number'); return; }
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    setCheckingOut(true);
    try {
      const ordersData = cart.map(item => ({ network: item.network, size_gb: item.size, phone: cartPhone, quantity: item.quantity }));
      const res = await api.post('/agent/bulk-order', { orders: ordersData });
      if (res.data.success) {
        await Swal.fire({ icon: 'success', title: 'Bulk Sale Complete!', html: `<p>✅ Successfully sold ${res.data.data?.total_orders || cart.length} bundles on ${COMPANY.shortName}!</p><p>💰 Total Profit: ₵${res.data.data?.total_profit?.toFixed(2) || '0.00'}</p>`, confirmButtonColor: '#8B0000' });
        setCart([]);
        setCartPhone('');
        setShowCart(false);
        fetchData();
      }
    } catch (error) { console.error('Checkout error:', error); toast.error(error.response?.data?.error || 'Checkout failed'); }
    finally { setCheckingOut(false); }
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      const ordersList = rows.map(row => ({ phone: row.Phone || row.phone, network: (row.Network || row.network || '').toLowerCase(), size_gb: parseInt(row.Size || row.size || row.GB), quantity: parseInt(row.Quantity || row.quantity || 1) }));
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
        await Swal.fire({ icon: 'success', title: 'Bulk Orders Processed!', html: `<p>✅ Processed ${res.data.data?.success_count || bulkPreview.length} orders on Roamsmart</p><p>💰 Total Profit: ₵${res.data.data?.total_profit?.toFixed(2) || '0.00'}</p>`, confirmButtonColor: '#8B0000' });
        setBulkPreview([]);
        setShowBulkModal(false);
        fetchData();
      }
    } catch (error) { console.error('Bulk order error:', error); toast.error(error.response?.data?.error || 'Bulk order failed'); }
    finally { setProcessingBulk(false); }
  };

  const saveStoreSettings = async () => {
    if (!storeSettings.store_name) { toast.error('Please enter a store name'); return; }
    if (!storeSettings.store_slug) { toast.error('Please enter a store URL slug'); return; }
    setSavingStore(true);
    const finalCustomPrices = {};
    selectedProducts.forEach(product => {
      const network = product.network;
      const size = product.size_gb;
      const price = customPrices[network]?.[size];
      if (price) { if (!finalCustomPrices[network]) finalCustomPrices[network] = {}; finalCustomPrices[network][size] = price; }
    });
    try {
      await api.post('/agent/store', {
        store_name: storeSettings.store_name, store_slug: storeSettings.store_slug, contact_phone: storeSettings.contact_phone,
        contact_email: storeSettings.contact_email, store_description: storeSettings.store_description, markup: storeSettings.markup,
        custom_products: selectedProducts, custom_prices: finalCustomPrices
      });
      toast.success(`Store settings saved on ${COMPANY.name}!`);
      setShowStoreModal(false);
      const storeUrl = `${window.location.origin}/store/${storeSettings.store_slug}`;
      Swal.fire({ icon: 'success', title: 'Store Created on Roamsmart!', html: `Your Roamsmart store is live at: <br/><a href="${storeUrl}" target="_blank">${storeUrl}</a><br/><br/>Share this link with your customers!`, confirmButtonColor: '#8B0000' });
      fetchPrices();
    } catch (error) { console.error('Save store error:', error); toast.error('Failed to save store settings'); }
    finally { setSavingStore(false); }
  };

  const shareWhatsApp = (product) => {
    const storeUrl = `${window.location.origin}/store/${storeSettings.store_slug || 'roamsmart'}`;
    const message = `📱 *ROAMSMART DATA BUNDLE* 📱\n\n${product.network?.toUpperCase() || ''} ${product.size || ''}GB - Only ₵${product.selling_price || ''}\n⚡ Instant Delivery | 🔒 Secure Payment\n📞 Contact me: ${storeSettings.contact_phone || COMPANY.phone}\n\nOrder now from ${storeSettings.store_name || COMPANY.shortName} on Roamsmart Digital Service!\nStore link: ${storeUrl}`;
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
      labels: dateRange === 'week' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : dateRange === 'month' ? ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{ label: `${COMPANY.shortName} Sales (GHS)`, data, backgroundColor: '#D2691E', borderColor: '#8B0000', borderWidth: 2, borderRadius: 8, tension: 0.4, fill: true }]
    };
  };

  const getProductChartData = () => {
    const productData = {};
    for (const [network, bundles] of Object.entries(agentBundles)) {
      for (const [size, price] of Object.entries(bundles)) { const label = `${network.toUpperCase()} ${size}GB`; productData[label] = price; }
    }
    const labels = Object.keys(productData).slice(0, 6);
    const data = labels.map(label => productData[label]);
    return { labels: labels, datasets: [{ data: data, backgroundColor: ['#FFC107', '#EC008C', '#ED1B24', '#00B3E6', '#28a745', '#8B0000'], borderWidth: 0 }] };
  };

  const chartOptions = { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false } }, scales: { y: { beginAtZero: true, grid: { color: '#e0e0e0' } }, x: { grid: { display: false } } } };
  const doughnutOptions = { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } };

  const styleSheet = document.createElement("style");
  styleSheet.textContent = `@keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } 100% { opacity: 1; transform: scale(1); } }`;
  document.head.appendChild(styleSheet);

  if (loading) return ( <div className="loading-screen"><div className="spinner"></div><p>Loading {COMPANY.name} Agent Dashboard...</p></div> );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard agent-dashboard">
      <div className="dashboard-header">
        <div><h1>{COMPANY.name} - Agent Dashboard</h1><p>Welcome back, {stats.username || user?.username || 'Agent'}!</p></div>
        <div className="wallet-card" style={{ cursor: 'pointer' }} onClick={() => setShowFundModal(true)}><FaWallet /><span>₵{stats.wallet_balance?.toFixed(2) || '0.00'}</span></div>
      </div>

      <div className="quick-actions-bar" style={{ marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <button className="action-btn btn-primary" onClick={() => setShowFundModal(true)} style={{ background: '#8B0000', color: 'white' }}><FaCreditCard /> Fund Wallet</button>
        <button className="action-btn btn-success" onClick={() => setShowVerifyModal(true)} style={{ background: '#28a745', color: 'white' }}><FaCheckCircle /> Verify Payment</button>
        <button className="action-btn" onClick={() => setShowStoreModal(true)}><FaStore /> My Store</button>
        <button className="action-btn" onClick={() => setShowCart(true)}><FaShoppingBag /> Cart ({cart.length})</button>
      </div>

      {pendingTopups.length > 0 && ( <div className="notice-box" style={{ background: '#fff3cd', borderLeft: '4px solid #ffc107', marginBottom: '20px', padding: '12px 15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}><div className="notice-icon">⏳</div><div className="notice-content" style={{ flex: 1 }}><strong>Pending Payments:</strong> You have {pendingTopups.length} pending payment(s). <button onClick={() => setShowVerifyModal(true)} style={{ background: 'none', border: 'none', color: '#8B0000', cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px' }}>Click here to verify them →</button></div></div> )}

      {pendingPayments.length > 0 && ( <div className="notice-box" style={{ background: '#e3f2fd', borderLeft: '4px solid #2196f3', marginBottom: '20px', padding: '12px 15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}><div className="notice-icon">📋</div><div className="notice-content" style={{ flex: 1 }}><strong>Manual Payment Submissions:</strong> You have {pendingPayments.length} pending submission(s) awaiting admin approval.<button onClick={() => setShowVerifyModal(true)} style={{ background: 'none', border: 'none', color: '#2196f3', cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px' }}>Check status →</button></div></div> )}

      <div className="agent-tabs">
        <button className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><FaChartLine /> Dashboard</button>
        <button className={`tab ${activeTab === 'sell' ? 'active' : ''}`} onClick={() => setActiveTab('sell')}><FaShoppingCart /> Sell Data</button>
        <button className={`tab ${activeTab === 'store_earnings' ? 'active' : ''}`} onClick={() => setActiveTab('store_earnings')}><FaStore /> Store Earnings</button>
        <button className={`tab ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}><FaUsers /> Customers</button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <>
          <div className="stats-grid">
            <motion.div whileHover={{ y: -5 }} className="stat-card"><div className="stat-icon"><FaWallet /></div><div className="stat-value">₵{stats.wallet_balance?.toFixed(2) || '0.00'}</div><div className="stat-label">{COMPANY.shortName} Wallet</div></motion.div>
            <motion.div whileHover={{ y: -5 }} className="stat-card"><div className="stat-icon"><FaMoneyBillWave /></div><div className="stat-value">₵{stats.total_sales?.toFixed(2) || '0'}</div><div className="stat-label">Total Sales</div></motion.div>
            <motion.div whileHover={{ y: -5 }} className="stat-card"><div className="stat-icon"><FaPercent /></div><div className="stat-value">{stats.total_orders || 0}</div><div className="stat-label">Total Orders</div></motion.div>
            <motion.div whileHover={{ y: -5 }} className="stat-card"><div className="stat-icon"><FaTrophy /></div><div className="stat-value">₵{stats.agent_savings?.toFixed(2) || '0'}</div><div className="stat-label">Your Savings</div></motion.div>
          </div>
          <div className="stats-grid">
            <motion.div whileHover={{ y: -5 }} className="stat-card"><div className="stat-icon"><FaUsers /></div><div className="stat-value">{stats.total_customers || 0}</div><div className="stat-label">Total Customers</div></motion.div>
            <motion.div whileHover={{ y: -5 }} className="stat-card"><div className="stat-icon"><FaCrown /></div><div className="stat-value">{stats.agent_tier || 'Bronze'}</div><div className="stat-label">Agent Tier on Roamsmart</div></motion.div>
          </div>
          <div className="tier-progress-card"><h3><FaArrowUp /> Next Tier: {stats.agent_tier === 'Bronze' ? 'Silver' : stats.agent_tier === 'Silver' ? 'Gold' : 'Platinum'}</h3><div className="progress-bar-container"><div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.min(100, (stats.total_sales / stats.next_tier_sales) * 100)}%` }}></div></div></div><div className="progress-stats"><span>₵{stats.total_sales?.toFixed(2)} / ₵{stats.next_tier_sales}</span><span>{Math.min(100, ((stats.total_sales / stats.next_tier_sales) * 100)).toFixed(1)}%</span></div></div>
          <div className="charts-row">
            <motion.div initial={{ x: -20 }} animate={{ x: 0 }} className="chart-card"><div className="chart-header"><h3><FaChartLine /> {COMPANY.shortName} Sales Performance</h3><select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="date-select"><option value="week">This Week</option><option value="month">This Month</option><option value="year">This Year</option></select></div><Line data={getSalesChartData()} options={chartOptions} /></motion.div>
            <motion.div initial={{ x: 20 }} animate={{ x: 0 }} className="chart-card"><h3><FaChartPie /> Products in Database (Admin Configured)</h3><Doughnut data={getProductChartData()} options={doughnutOptions} /></motion.div>
          </div>
        </>
      )}

      {/* Sell Tab */}
{activeTab === 'sell' && (
  <>
    <div className="quick-actions-bar">
      <button className="action-btn" onClick={() => setShowCart(true)}><FaShoppingBag /> Cart ({cart.length})</button>
      <button className="action-btn" onClick={() => setShowBulkModal(true)}><FaFileExcel /> Bulk Upload</button>
      <button className="action-btn" onClick={() => setShowStoreModal(true)}><FaStore /> My Roamsmart Store</button>
    </div>

    {/* ========== MTN DELIVERY OPTIONS CARD ========== */}
    {selectedNetwork === 'mtn' && (
      <BundleSwitcher 
        network={selectedNetwork} 
        sizeGb={selectedSize ? parseInt(selectedSize) : null}
        basePrice={selectedWholesalePrice}
        onBundleChange={(option) => {
          console.log('Delivery option selected:', option);
          setSelectedDeliveryOption(option);
          
          if (selectedSize && selectedWholesalePrice) {
            const newPrice = option?.prices?.[parseInt(selectedSize)] || selectedWholesalePrice;
            setSelectedSellingPrice(newPrice);
            setSelectedProfit(newPrice - selectedWholesalePrice);
            toast.success(`${option.name} selected - New price: ₵${newPrice.toFixed(2)}`);
          } else {
            toast.success(`${option.name} selected - Select a data size to see the price`);
          }
        }}
        initialType="master"
      />
    )}

    <div className="section-header">
      <h2><FaDatabase /> Wholesale Prices on Roamsmart</h2>
      <div className="network-tabs">
        {['mtn', 'telecel', 'airteltigo'].map(net => ( 
          <button key={net} className={`tab-btn ${selectedNetwork === net ? 'active' : ''}`} onClick={() => handleNetworkChange(net)}>
            {net.toUpperCase()}
          </button>
        ))}
      </div>
    </div>

    <div className="customer-input-row">
      <div className="input-group"><FaPhoneAlt /><input type="tel" placeholder="Customer Phone Number (e.g., 024XXXXXXX)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="form-control" /></div>
      <div className="input-group"><FaUserPlus /><input type="text" placeholder="Customer Name (Optional)" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="form-control" /></div>
    </div>

    {/* Selected Delivery Option Info */}
    {selectedDeliveryOption && (
      <div style={{
        background: selectedDeliveryOption.type === 'express' ? '#fff3cd' : '#e8f5e9',
        padding: '10px 15px',
        borderRadius: '8px',
        marginBottom: '15px',
        fontSize: '0.85rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        borderLeft: selectedDeliveryOption.type === 'express' ? '4px solid #f39c12' : '4px solid #28a745'
      }}>
        <span>
          📦 <strong>Selected delivery:</strong> {selectedDeliveryOption.name}
          {selectedDeliveryOption.type === 'express' && ' ⚡ FAST'}
        </span>
        <span>⚡ Est. {selectedDeliveryOption.delivery_time?.avg || '?'} min delivery</span>
        {selectedSize && selectedSellingPrice && (
          <span>💰 Price: {selectedSellingPrice.toFixed(2)}</span>
        )}
        {selectedDeliveryOption.type === 'express' && (
          <span style={{ background: '#f39c12', color: '#000', padding: '2px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>
            Priority Processing
          </span>
        )}
      </div>
    )}

    <div className="custom-size-section-agent">
      <div className="custom-size-input-agent">
        <h3>Enter Custom Data Size</h3>
        <div className="size-input-group-agent">
          <input type="number" min="1" max="100" value={selectedSize} onChange={handleCustomSize} placeholder="Enter GB (e.g., 15)" className="form-control" />
          <span className="gb-label-agent">GB</span>
        </div>
        {loadingPrice && <div className="spinner-small"><FaSpinner className="spinning" /> Checking price...</div>}
        
        {/* Price Display - FIXED: Renamed "Wholesale" to "Base Price (Master Bundle)" */}
        {selectedWholesalePrice !== null && !loadingPrice && ( 
  <div className="price-display-agent">
    <div className="price-row">
      <span>Base Price (Master Bundle):</span>
      <strong>₵{selectedWholesalePrice.toFixed(2)}</strong>
    </div>
    <div className="price-row">
      <span>Selling Price:</span>
      <strong className="text-primary" style={{ color: selectedDeliveryOption?.type === 'express' ? '#f39c12' : '#8B0000' }}>
        ₵{selectedSellingPrice?.toFixed(2)}
      </strong>
      {selectedDeliveryOption && (
        <span style={{ fontSize: '0.7rem', marginLeft: '8px', color: '#666' }}>
          ({selectedDeliveryOption.name})
        </span>
      )}
    </div>
    {selectedDeliveryOption && selectedDeliveryOption.type === 'express' && selectedSellingPrice > selectedWholesalePrice && (
      <div className="price-row" style={{ fontSize: '0.7rem', color: '#f39c12' }}>
        <span>⚡ Express premium: +₵{(selectedSellingPrice - selectedWholesalePrice).toFixed(2)}</span>
      </div>
    )}
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
              <button key={size} className={`size-chip-agent ${selectedSize == size ? 'active' : ''}`} onClick={() => handleSizeSelect(size)}>
                {size}GB
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Sell Button */}
    <div className="sell-action-agent" style={{ marginTop: '20px', textAlign: 'center' }}>
      <button 
        className="btn-primary btn-lg" 
        onClick={() => { 
          if (!customerPhone) { 
            toast.error('Enter customer phone number first'); 
            return; 
          } 
          setSellingBundle(`${selectedNetwork}-${selectedSize}`); 
          const finalPrice = selectedSellingPrice; 
          sellData(selectedNetwork, parseInt(selectedSize), selectedWholesalePrice, customerPhone, customerName, finalPrice); 
        }} 
        disabled={!selectedSize} 
        style={{ padding: '12px 30px', fontSize: '18px', backgroundColor: '#28a745', borderRadius: '50px' }}
      >
        Sell {selectedSize}GB for {selectedSellingPrice?.toFixed(2)}
      </button>
      {selectedDeliveryOption && ( 
        <p className="delivery-estimate" style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          ⚡ Delivery via {selectedDeliveryOption.name}: ~{selectedDeliveryOption.delivery_time?.avg || 5} minutes
        </p>
      )}
    </div>

    {/* Popular Bundles Grid */}
    <div className="bundles-grid-agent">
      <h3 className="bundles-subtitle-agent">Popular Bundles</h3>
      <div className="bundles-grid-container-agent">
        {[1, 2, 3, 4, 5, 6, 10, 20, 30].map((size) => {
          const sizeStr = size.toString();
          const wholesalePrice = agentBundles[selectedNetwork]?.[sizeStr];
          
          if (!wholesalePrice || wholesalePrice <= 0) return null;
          
          let sellingPrice = wholesalePrice * (1 + (storeSettings.markup || 15) / 100);
          
          if (selectedNetwork === 'mtn' && selectedDeliveryOption) {
            sellingPrice = selectedDeliveryOption?.prices?.[size] || wholesalePrice;
          }
          
          const deliveryLabel = selectedDeliveryOption?.type === 'express' ? '⚡ Express' : 
                               selectedDeliveryOption?.type === 'master' ? '👑 Master' : '';
          
          return ( 
            <motion.div 
              key={size} 
              whileHover={{ y: -5, scale: 1.02 }} 
              className="bundle-card-agent"
            >
              <div className="bundle-size">{size}GB</div>
              <div className="bundle-price">
                ₵{sellingPrice.toFixed(2)}
                {deliveryLabel && (
                  <span style={{ 
                    fontSize: '0.55rem', 
                    display: 'block', 
                    color: selectedDeliveryOption?.type === 'express' ? '#f39c12' : '#8B0000',
                    marginTop: '2px'
                  }}>
                    {deliveryLabel}
                  </span>
                )}
              </div>
              <div className="bundle-actions">
                <button 
                  className="btn-primary btn-sm" 
                  onClick={() => { 
                    if (!customerPhone) { 
                      toast.error('Enter customer phone number first'); 
                      return; 
                    } 
                    setSelectedSize(sizeStr); 
                    setSelectedWholesalePrice(wholesalePrice); 
                    setSelectedSellingPrice(sellingPrice); 
                    setSelectedProfit(sellingPrice - wholesalePrice); 
                  }}
                >
                  Select & Sell
                </button>
                <button 
                  className="btn-outline btn-sm" 
                  onClick={() => addToCart(selectedNetwork, size, wholesalePrice)}
                >
                  <FaPlus /> Add to Cart
                </button>
              </div>
            </motion.div>
          ); 
        })}
      </div>
    </div>

    {/* Suggested Prices */}
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

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <>
          <div className="customer-search"><input type="text" placeholder="Search by phone or name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-control" /></div>
          <div className="customers-table"><table className="data-table"><thead><tr><th>Customer</th><th>Phone</th><th>Total Spent on Roamsmart</th><th>Orders</th><th>Last Purchase</th><th>Action</th></tr></thead><tbody>{customers.filter(c => c.phone?.includes(searchTerm) || c.name?.toLowerCase().includes(searchTerm.toLowerCase())).map(customer => ( <tr key={customer.id || customer.phone}><td>{customer.name || 'Anonymous'}</td><td>{customer.phone}</td><td className="amount">₵{customer.total_spent?.toFixed(2) || '0'}</td><td>{customer.order_count || 0}</td><td className="date">{customer.last_purchase ? new Date(customer.last_purchase).toLocaleDateString() : 'N/A'}</td><td><button className="btn-sm btn-outline" onClick={() => { setCustomerPhone(customer.phone); setSelectedCustomer(customer); setShowCustomerModal(true); }}><FaEye /> View</button></td> </tr> ))}{customers.length === 0 && ( <tr><td colSpan="6" className="text-center">No customers yet. Start selling on Roamsmart!</td></tr> )}</tbody></table></div>
        </>
      )}

      {/* Store Earnings Tab */}
      {activeTab === 'store_earnings' && (
        <div className="store-earnings-panel">
          <div className="earnings-summary"><div className="summary-card"><h3>Total Store Sales</h3><div className="amount">₵{storeEarnings.total_sales?.toFixed(2) || '0.00'}</div></div><div className="summary-card success"><h3>Your Earnings</h3><div className="amount">₵{storeEarnings.total_earnings?.toFixed(2) || '0.00'}</div><small>Already credited to your wallet</small></div><div className="summary-card warning"><h3>Pending Payouts</h3><div className="amount">₵{storeEarnings.pending_payouts?.toFixed(2) || '0.00'}</div><small>Will be credited after payment confirmation</small></div></div>
          <div className="earnings-table"><h3>Recent Store Orders</h3>{loadingEarnings ? ( <div className="loading-spinner"><FaSpinner className="spinning" /> Loading...</div> ) : ( <table className="data-table"><thead><tr><th>Order ID</th><th>Customer</th><th>Product</th><th>Amount</th><th>Your Earnings</th><th>Status</th><th>Date</th></tr></thead><tbody>{storeEarnings.recent_orders?.map(order => ( <tr key={order.order_id}><td className="order-id">{order.order_id}</td><td>{order.customer_phone}</td><td>{order.product}</td><td className="amount">₵{order.amount?.toFixed(2)}</td><td className="profit">₵{order.earnings?.toFixed(2)}</td><td><span className={`status ${order.status}`}>{order.status === 'completed' ? '✅ Completed' : order.status === 'pending_payment' ? '⏳ Pending Payment' : order.status}</span></td><td className="date">{new Date(order.created_at).toLocaleDateString()}</td></tr> ))}{(!storeEarnings.recent_orders || storeEarnings.recent_orders.length === 0) && ( <tr><td colSpan="7" className="text-center">No store orders yet</td></tr> )}</tbody></table> )}</div>
        </div>
      )}

      {/* Additional Services Section */}
      <div className="additional-services-section"><div className="section-header"><h2><FaGraduationCap /> Additional Services on Roamsmart</h2><p>WAEC Vouchers & Bill Payments - Available on Roamsmart!</p></div><div className="services-grid"><div className="service-card waec-card"><div className="service-header"><FaGraduationCap className="service-icon" /><h3>WAEC Result Checker</h3><span className="agent-badge-small">Available on Roamsmart</span></div><p className="service-description">Sell WAEC vouchers to your customers</p><button className="btn-outline btn-sm" onClick={() => window.location.href = '/waec-vouchers'}>Sell WAEC Vouchers</button></div><div className="service-card bills-card"><div className="service-header"><FaBolt className="service-icon" /><h3>Pay Bills</h3><span className="agent-badge-small">Available on Roamsmart</span></div><p className="service-description">Help customers pay electricity, water, and TV bills</p><button className="btn-outline btn-sm" onClick={() => window.location.href = '/bills'}>Process Bill Payments</button></div></div></div>

      {/* Recent Orders - Agent Version */}
<div className="section-header">
  <h2><FaHistory /> Order History</h2>
  <div className="order-filters">
    <input 
      type="text" 
      placeholder="Search orders..." 
      className="search-input"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
    <select className="filter-select" onChange={(e) => setStatusFilter(e.target.value)}>
      <option value="all">All Status</option>
      <option value="pending">Pending</option>
      <option value="processing">Processing</option>
      <option value="delivered">Delivered</option>
      <option value="failed">Failed</option>
    </select>
    <button className="btn-primary btn-sm" onClick={() => fetchOrdersWithRealTimeStatus()}>
      <FaSync /> Refresh Status
    </button>
  </div>
</div>

<div className="orders-table">
  <div className="table-responsive">
    <table className="data-table">
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Type / Size</th>
          <th>Customer</th>
          <th>Network / Biller</th>
          <th>Status</th>
          <th>Source</th>
          <th>Customer Paid</th>
          <th>Your Cost</th>
          <th>Profit</th>
          <th>Date</th>
          <th>Updated</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredOrders.map(order => {
          // Check if this is a bill payment
          const isBillPayment = order.is_bill_payment || order.type === 'bill_payment' || order.biller_code;
          
          // For bill payments, show biller name; for data, show size
          const sizeDisplay = isBillPayment 
            ? (order.biller_name || 'Bill Payment')
            : `${order.size_gb || 0}GB`;
          
          // For bill payments, show biller code; for data, show network
          const networkDisplay = isBillPayment
            ? (order.biller_code || 'Bill')
            : (order.network?.toUpperCase() || 'N/A');
          
          // Get the network class for styling
          const networkClass = isBillPayment ? `biller ${order.biller_code || 'default'}` : order.network;
          
          // Determine status display
          let statusDisplay = '';
          let statusClass = order.delivery_status || order.status || 'pending';
          
          if (order.delivery_status === 'pending' || order.status === 'pending') {
            statusDisplay = '⏳ Pending';
          } else if (order.delivery_status === 'queued') {
            statusDisplay = '📋 Queued';
          } else if (order.delivery_status === 'processing') {
            statusDisplay = '🔄 Processing';
          } else if (order.delivery_status === 'delivered' || order.status === 'completed') {
            statusDisplay = '✅ Completed';
          } else if (order.delivery_status === 'failed') {
            statusDisplay = '❌ Failed';
          } else if (order.status === 'refunded') {
            statusDisplay = '💰 Refunded';
          } else {
            statusDisplay = order.delivery_status || order.status || 'Unknown';
          }
          
          // Calculate profit
          const profit = order.profit || order.commission_earned || 0;
          
          return (
            <tr key={order.order_id} className={isBillPayment ? 'bill-payment-row' : ''}>
              <td className="order-id">
                <code>{order.order_id}</code>
              </td>
              <td>
                <div>
                  <strong style={{ fontSize: '0.85rem' }}>
                    {sizeDisplay}
                  </strong>
                  {isBillPayment ? (
                    <span className="order-type-label bill">💳 Bill</span>
                  ) : (
                    <span className="order-type-label data">📱 Data</span>
                  )}
                </div>
              </td>
              <td>
                <div>
                  <strong>{order.customer_name || 'Customer'}</strong>
                  <br/>
                  <small>{order.customer_phone || order.phone || '—'}</small>
                </div>
              </td>
              <td>
                <span className={`network-badge ${networkClass}`}>
                  {networkDisplay}
                </span>
              </td>
              <td>
                <span className={`status-badge ${statusClass}`}>
                  {statusDisplay}
                </span>
              </td>
              <td>
                <span className="source-badge">
                  {order.source || 'Agent'}
                </span>
              </td>
              <td className="amount">
                ₵{(order.customer_paid || order.amount)?.toFixed(2) || '0.00'}
              </td>
              <td className="amount">
                ₵{(order.cost || 0).toFixed(2)}
              </td>
              <td className="amount profit">
                ₵{profit.toFixed(2)}
              </td>
              <td>
                {order.created_at_display || (order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A')}
              </td>
              <td>
                {order.delivery_status_updated_at ? new Date(order.delivery_status_updated_at).toLocaleString() : 'N/A'}
              </td>
              <td className="actions">
                <button 
                  className="btn-sm btn-info" 
                  onClick={() => viewOrderDetails(order)}
                  title="View Details"
                >
                  <FaEye />
                </button>
                {(order.delivery_status === 'failed' || order.status === 'failed') && (
                  <button 
                    className="btn-sm btn-warning" 
                    onClick={() => retryOrder(order)}
                    title="Retry"
                  >
                    <FaSync />
                  </button>
                )}
                {order.status === 'refunded' && (
                  <span className="refunded-badge">💰 Refunded</span>
                )}
              </td>
            </tr>
          );
        })}
        {filteredOrders.length === 0 && (
          <tr>
            <td colSpan="12" className="text-center">
              <div style={{ padding: '30px' }}>
                <p>No orders found</p>
                <small className="text-muted">Your orders will appear here</small>
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
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

      {/* Store Settings Modal - With Product Selection */}
      <AnimatePresence>
        {showStoreModal && (
          <motion.div className="modal-overlay" onClick={() => setShowStoreModal(false)}>
            <motion.div className="modal-content store-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
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
                  rows="2"
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
                <small>Default markup for calculating selling prices</small>
              </div>
              
              {/* PRODUCT SELECTION SECTION */}
              <div className="form-group">
                <label>📦 Select Products to Sell</label>
                <small className="help-text">Choose which data bundles you want to display in your store</small>
                
                <div className="product-selection-tabs">
                  {['mtn', 'telecel', 'airteltigo'].map(net => (
                    <button 
                      key={net}
                      type="button"
                      className={`product-tab ${selectedNetwork === net ? 'active' : ''}`}
                      onClick={() => setSelectedNetwork(net)}
                    >
                      {net.toUpperCase()}
                    </button>
                  ))}
                </div>
                
                <div className="products-selection-grid">
                  {Object.entries(agentBundles[selectedNetwork] || {}).map(([size, wholesalePrice]) => {
                    const sellingPrice = wholesalePrice * (1 + storeSettings.markup / 100);
                    const customPrice = customPrices[selectedNetwork]?.[size];
                    const isSelected = selectedProducts.some(p => p.network === selectedNetwork && p.size_gb === parseFloat(size));
                    const displayPrice = customPrice || sellingPrice;
                    
                    return (
                      <div 
                        key={`${selectedNetwork}-${size}`}
                        className={`product-select-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedProducts(selectedProducts.filter(p => !(p.network === selectedNetwork && p.size_gb === parseFloat(size))));
                            if (customPrices[selectedNetwork]?.[size]) {
                              const newCustomPrices = {...customPrices};
                              delete newCustomPrices[selectedNetwork][size];
                              if (Object.keys(newCustomPrices[selectedNetwork] || {}).length === 0) {
                                delete newCustomPrices[selectedNetwork];
                              }
                              setCustomPrices(newCustomPrices);
                            }
                          } else {
                            setSelectedProducts([...selectedProducts, {
                              network: selectedNetwork,
                              size_gb: parseFloat(size)
                            }]);
                          }
                        }}
                      >
                        <div className="product-header">
                          <span className="product-size">{size}GB</span>
                          {isSelected && <FaCheckCircle className="selected-icon" />}
                        </div>
                        <div className="product-pricing">
                          <div className="wholesale-price">
                            <span>Wholesale:</span>
                            <span>₵{wholesalePrice.toFixed(2)}</span>
                          </div>
                          <div className="selling-price">
                            <span>Selling Price:</span>
                            {isSelected ? (
                              <input 
                                type="number"
                                step="0.5"
                                value={displayPrice.toFixed(2)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  const newPrice = parseFloat(e.target.value);
                                  if (!isNaN(newPrice) && newPrice > 0) {
                                    setCustomPrices({
                                      ...customPrices,
                                      [selectedNetwork]: {
                                        ...customPrices[selectedNetwork],
                                        [size]: newPrice
                                      }
                                    });
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="price-input"
                              />
                            ) : (
                              <span>₵{displayPrice.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="product-profit">
                            Profit: {(displayPrice - wholesalePrice).toFixed(2)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <small className="help-text">Click on a bundle to add/remove from your store. You can also edit the selling price.</small>
              </div>
              
              <div className="selected-products-summary">
                <h4>Selected Products ({selectedProducts.length})</h4>
                <div className="selected-products-list">
                  {selectedProducts.map((product, idx) => {
                    const price = customPrices[product.network]?.[product.size_gb] || 
                                 (agentBundles[product.network]?.[product.size_gb] * (1 + storeSettings.markup / 100));
                    return (
                      <div key={idx} className="selected-product-tag">
                        <span>{product.network.toUpperCase()} {product.size_gb}GB</span>
                        <span className="selected-price">₵{price.toFixed(2)}</span>
                        <button 
                          className="remove-product"
                          onClick={() => {
                            setSelectedProducts(selectedProducts.filter(p => 
                              !(p.network === product.network && p.size_gb === product.size_gb)
                            ));
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                  {selectedProducts.length === 0 && (
                    <p className="text-muted">No products selected. Your store will not show any bundles.</p>
                  )}
                </div>
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

      {/* FUND WALLET MODAL */}
      <AnimatePresence>
        {showFundModal && (
          <motion.div className="modal-overlay" onClick={() => { setShowFundModal(false); resetFundModal(); }}>
            <motion.div className="modal-content fund-wallet-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
              <button className="modal-close" onClick={() => { setShowFundModal(false); resetFundModal(); }}>×</button>
              
              {fundStep === 1 && (
                <div className="fund-step">
                  <h3><FaWallet /> Fund Your Roamsmart Wallet</h3>
                  <p>Select your preferred payment method</p>
                  
                  <div className="methods-grid">
                    {paymentMethods.map(method => (
                      <div 
                        key={method.id}
                        className={`method-card ${selectedMethod === method.id ? 'active' : ''} ${method.comingSoon ? 'coming-soon' : ''}`}
                        onClick={() => handleMethodSelect(method.id)}
                      >
                        <div className="method-icon" style={{ color: method.color }}>{method.icon}</div>
                        <div className="method-name">{method.name}</div>
                        <div className="method-fee">{method.fee}</div>
                        <div className="method-limit">Limit: ₵{method.min} - ₵{method.max.toLocaleString()}</div>
                        <div className="method-time">⏱️ {method.time}</div>
                        {method.comingSoon && <span className="coming-soon-badge">Coming Soon</span>}
                      </div>
                    ))}
                  </div>
                  
                  <button className="btn-primary btn-block" onClick={() => setFundStep(2)}>
                    Continue on Roamsmart <FaArrowRight />
                  </button>
                </div>
              )}
              
              {fundStep === 2 && (
                <div className="fund-step">
                  <button className="back-btn" onClick={() => setFundStep(1)}><FaArrowLeft /> Back</button>
                  <h3>Enter Amount to Fund</h3>
                  
                  <div className="form-group">
                    <label>Amount (GHS)</label>
                    <input 
                      type="number" 
                      className="form-control amount-input" 
                      placeholder="Enter amount" 
                      min={paymentMethods.find(m => m.id === selectedMethod)?.min || 10}
                      value={fundAmount} 
                      onChange={e => setFundAmount(e.target.value)} 
                    />
                    <small>Min: ₵{paymentMethods.find(m => m.id === selectedMethod)?.min} · Max: ₵{paymentMethods.find(m => m.id === selectedMethod)?.max.toLocaleString()}</small>
                  </div>
                  
                  <div className="quick-amounts">
                    {quickAmounts.map(qAmount => (
                      <button key={qAmount} className="quick-amount" onClick={() => setFundAmount(qAmount.toString())}>
                        ₵{qAmount}
                      </button>
                    ))}
                  </div>
                  
                  {selectedMethod === 'manual' && (
                    <div className="form-group">
                      <label>Phone Number (Optional)</label>
                      <input 
                        type="tel" 
                        className="form-control" 
                        placeholder="024XXXXXXX" 
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                      />
                      <small>For payment confirmation SMS from Roamsmart</small>
                    </div>
                  )}
                  
                  <button 
                    className="btn-primary btn-block" 
                    onClick={handleAmountSubmit} 
                    disabled={loadingRequest || processingPayment}
                  >
                    {(loadingRequest || processingPayment) ? <FaSpinner className="spinning" /> : 'Proceed to Payment'}
                  </button>
                </div>
              )}
              
              {fundStep === 3 && manualRequest && (
                <div className="fund-step instructions-step">
                  <button className="back-btn" onClick={() => setFundStep(2)}><FaArrowLeft /> Back</button>
                  <h3>Roamsmart Payment Instructions</h3>
                  
                  <div className="payment-details-card">
                    <div className="detail-row">
                      <span className="detail-label">Amount to Pay:</span>
                      <span className="detail-value amount">₵{manualRequest.amount?.toFixed(2)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Recipient Number:</span>
                      <span className="detail-value">{COMPANY.phone}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Reference ID:</span>
                      <div className="reference-box">
                        <code>{manualRequest.reference}</code>
                        <button onClick={handleCopyReference} className="copy-btn">
                          {copied ? <FaCheck /> : <FaCopy />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="how-it-works">
                    <h4>📋 How to complete payment:</h4>
                    <ol>
                      <li>Go to your mobile money wallet</li>
                      <li>Send ₵{manualRequest.amount?.toFixed(2)} to <strong>{COMPANY.phone}</strong></li>
                      <li>Use reference: <strong>{manualRequest.reference}</strong></li>
                      <li>Take a screenshot of the confirmation</li>
                      <li>Upload the screenshot below</li>
                    </ol>
                  </div>
                  
                  <div className="upload-section">
                    <h4>Upload Payment Proof</h4>
                    <div className="upload-area">
                      <input 
                        type="file" 
                        id="proof-upload"
                        accept="image/*,.pdf"
                        onChange={(e) => setProofFile(e.target.files[0])}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="proof-upload" className="upload-label">
                        {proofFile ? <><FaCheck /> {proofFile.name}</> : <><FaUpload /> Click to upload screenshot</>}
                      </label>
                    </div>
                    
                    <button 
                      onClick={handleFileUpload} 
                      className="btn-primary btn-block"
                      disabled={uploadingProof || !proofFile}
                    >
                      {uploadingProof ? <FaSpinner className="spinning" /> : 'Submit Payment Proof'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VERIFY PAYMENT MODAL - WITH TWO OPTIONS */}
      <AnimatePresence>
        {showVerifyModal && (
          <motion.div className="modal-overlay" onClick={() => { setShowVerifyModal(false); resetVerifyModal(); }}>
            <motion.div className="modal-content verify-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
              <button className="modal-close" onClick={() => { setShowVerifyModal(false); resetVerifyModal(); }}>×</button>
              
              <div className="verify-payment">
                <h3><FaCheckCircle /> Verify Your Roamsmart Payment</h3>
                <p>Choose how you want to verify your payment</p>
                
                {/* Toggle between Auto and Manual Verification */}
                <div className="verify-tabs">
                  <button 
                    className={`verify-tab ${verifyOption === 'auto' ? 'active' : ''}`}
                    onClick={() => setVerifyOption('auto')}
                  >
                    <FaQrcode /> Auto Verification
                  </button>
                  <button 
                    className={`verify-tab ${verifyOption === 'manual' ? 'active' : ''}`}
                    onClick={() => setVerifyOption('manual')}
                  >
                    <FaUpload /> Manual Verification
                  </button>
                </div>
                
                {/* OPTION 1: AUTO VERIFICATION */}
                {verifyOption === 'auto' && (
                  <div className="verify-auto">
                    <p className="verify-desc">Enter your payment details to auto-credit your Roamsmart wallet instantly.</p>
                    
                    {pendingTopups.length > 0 && (
                      <div className="pending-references">
                        <h4>Your Pending References:</h4>
                        <div className="ref-list">
                          {pendingTopups.map(p => (
                            <div key={p.id} className="ref-item" onClick={() => copyReferenceToVerify(p.reference)} style={{ cursor: 'pointer' }}>
                              <code>{p.reference}</code>
                              <small>₵{p.amount} - {new Date(p.created_at).toLocaleDateString()}</small>
                              <button className="copy-ref-btn"><FaCopy /> Copy</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="form-group">
                      <label>Payment Reference *</label>
                      <input 
                        type="text"
                        value={verifyReference}
                        onChange={(e) => setVerifyReference(e.target.value.toUpperCase())}
                        placeholder="e.g., RS-123-20241201-ABCD"
                        className="form-control"
                      />
                      <small>Enter the reference you received when initiating payment</small>
                    </div>
                    
                    <div className="form-group">
                      <label>Transaction ID / Reference *</label>
                      <input 
                        type="text"
                        value={verifyTransactionId}
                        onChange={(e) => setVerifyTransactionId(e.target.value)}
                        placeholder="e.g., MTC123456789"
                        className="form-control"
                      />
                      <small>Enter the transaction ID from your mobile money app</small>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Sender Name (Optional)</label>
                        <input 
                          type="text"
                          value={verifySenderName}
                          onChange={(e) => setVerifySenderName(e.target.value)}
                          placeholder="Your full name"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Sender Phone (Optional)</label>
                        <input 
                          type="tel"
                          value={verifySenderPhone}
                          onChange={(e) => setVerifySenderPhone(e.target.value)}
                          placeholder="024XXXXXXX"
                          className="form-control"
                        />
                      </div>
                    </div>
                    
                    <button onClick={handleAutoVerifyPayment} className="btn-primary btn-block" disabled={verifying}>
                      {verifying ? <FaSpinner className="spinning" /> : <FaCheckCircle />}
                      {verifying ? ' Verifying on Roamsmart...' : ' Verify Payment & Credit Wallet'}
                    </button>
                  </div>
                )}
                
                {/* OPTION 2: MANUAL VERIFICATION (Upload Proof) */}
                {verifyOption === 'manual' && (
                  <div className="verify-manual">
                    <p className="verify-desc">
                      You have pending payment requests. Select one below and upload your payment proof.
                      Admin will review and credit your wallet within 5-30 minutes.
                    </p>
                    
                    {pendingPayments.length > 0 ? (
                      <>
                        <div className="form-group">
                          <label>Select Payment Request *</label>
                          <select 
                            className="form-control"
                            value={manualVerifyReference}
                            onChange={(e) => {
                              const selected = pendingPayments.find(p => p.reference === e.target.value);
                              setManualVerifyReference(selected?.reference || '');
                              setManualVerifyAmount(selected?.amount || '');
                            }}
                            required
                          >
                            <option value="">-- Select a payment request --</option>
                            {pendingPayments.map((payment, idx) => (
                              <option key={idx} value={payment.reference}>
                                {payment.reference} - ₵{payment.amount} ({new Date(payment.created_at).toLocaleDateString()})
                              </option>
                            ))}
                          </select>
                          <small>Select the payment request you made</small>
                        </div>
                        
                        <div className="form-group">
                          <label>Amount Paid (GHS)</label>
                          <input 
                            type="number"
                            value={manualVerifyAmount}
                            readOnly
                            className="form-control"
                            style={{ backgroundColor: '#f5f5f5' }}
                          />
                          <small>Amount is pre-filled from your payment request</small>
                        </div>
                        
                        <div className="form-group">
                          <label>Payment Proof / Screenshot *</label>
                          <div className="upload-area-manual">
                            <input 
                              type="file" 
                              id="manual-proof-upload"
                              accept="image/*,.pdf"
                              onChange={(e) => setManualVerifyProof(e.target.files[0])}
                              style={{ display: 'none' }}
                            />
                            <label htmlFor="manual-proof-upload" className="upload-label-manual">
                              {manualVerifyProof ? (
                                <><FaCheck /> {manualVerifyProof.name}</>
                              ) : (
                                <><FaUpload /> Click to upload payment screenshot</>
                              )}
                            </label>
                          </div>
                          <small>Upload a screenshot of your payment confirmation (PNG, JPG, or PDF)</small>
                        </div>
                        
                        <button 
                          onClick={handleManualVerifyPayment} 
                          className="btn-primary btn-block" 
                          disabled={manualVerifyUploading || !manualVerifyReference || !manualVerifyProof}
                        >
                          {manualVerifyUploading ? <FaSpinner className="spinning" /> : <FaUpload />}
                          {manualVerifyUploading ? ' Submitting for Approval...' : ' Submit Payment Proof'}
                        </button>
                      </>
                    ) : (
                      <div className="no-pending-payments">
                        <p>⚠️ You don't have any pending payment requests.</p>
                        <p>Please go to <strong>Fund Wallet</strong> and select <strong>Manual Transfer</strong> to create a payment request first.</p>
                        <button 
                          className="btn-primary" 
                          onClick={() => {
                            setShowVerifyModal(false);
                            setShowFundModal(true);
                          }}
                        >
                          Fund Wallet Now
                        </button>
                      </div>
                    )}
                    
                    <div className="verify-note">
                      <p>⚠️ <strong>Note:</strong> Please ensure you have actually sent the payment before submitting. False submissions may lead to account suspension.</p>
                    </div>
                  </div>
                )}
              </div>
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