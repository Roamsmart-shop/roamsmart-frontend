// src/pages/UserDashboard.js - Complete working version

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaWallet, FaShoppingCart, FaChartLine, FaUsers, FaGift, 
  FaMobileAlt, FaClock, FaCheckCircle, FaDatabase, FaHistory, 
  FaCopy, FaCheck, FaUniversity, FaSpinner,
  FaDownload, FaUpload, FaEye, FaTimes, FaUserPlus, FaGraduationCap,
  FaBolt, FaTint, FaTv, FaGlobe, FaWhatsapp, FaHeadset, FaShieldAlt,
  FaSearch, FaRocket, FaHourglassHalf, FaInfoCircle, FaReceipt,
  FaLightbulb, FaPlug, FaWater, FaWifi, FaCreditCard, FaQrcode,
  FaFileInvoice, FaUserCheck, FaRegClock, FaSync, FaSignal, FaArrowLeft,
  FaArrowRight, 
} from 'react-icons/fa';
import api, { paymentAPI } from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import WAECVoucher from '../components/WAECVoucher';
import PurchaseConfirmationModal from '../components/PurchaseConfirmationModal';
import BundleSwitcher from '../components/BundleSwitcher';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  phone: '0557388622',
  website: 'https://roamsmart.shop'
};

// Bill Categories (matches your backend biller codes)
const billCategories = [
  { id: 'DSTV', name: 'DSTV', icon: <FaTv />, color: '#f39c12', providers: ['DSTV'] },
  { id: 'GOTV', name: 'GoTV', icon: <FaTv />, color: '#e74c3c', providers: ['GoTV'] },
  { id: 'STARTIMES', name: 'StarTimes', icon: <FaTv />, color: '#9b59b6', providers: ['StarTimes'] },
  { id: 'ECG', name: 'Electricity (ECG)', icon: <FaLightbulb />, color: '#f1c40f', providers: ['ECG'] },
  { id: 'GWCL', name: 'Water (GWCL)', icon: <FaWater />, color: '#3498db', providers: ['GWCL'] }
];

// Payment Methods
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
    id: 'manual', 
    name: 'Manual Transfer', 
    fee: 'No fees', 
    min: 10, 
    max: 100000, 
    icon: <FaUniversity />,
    description: 'Admin approval required',
    time: '5-30 minutes',
    color: '#8B0000'
  }
];

// ========== MTN DELIVERY OPTIONS CARD ==========
const MTNDeliveryOptionsCard = ({ deliveryOptions, loading, onOptionSelect, selectedOptionType, countdown, lastUpdate, selectedSize }) => {
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
        <p>Select a size to see MTN delivery options</p>
        <p style={{ fontSize: '0.75rem', marginTop: '8px' }}>Delivery times and prices will appear here</p>
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
          <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem' }}>MTN Delivery Options</h3>
          <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.7, color: 'white' }}>
            {selectedSize ? `For ${selectedSize}GB - Select your preferred delivery speed` : 'Select a size to see options'}
          </p>
        </div>
      </div>

      {deliveryOptions.map((option) => {
        const speedColor = getSpeedColor(option.delivery_time.avg);
        const times = getEstimatedTimes(option.delivery_time.avg);
        const isSelected = selectedOptionType === option.type;
        let price = option.price || option.final_price || 0;
        
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
                background: isSelected ? 'rgba(255,255,255,0.3)' : speedColor.bg === '#d4edda' ? '#28a745' : speedColor.bg === '#d1ecf1' ? '#17a2b8' : speedColor.bg === '#fff3cd' ? '#ffc107' : '#dc3545',
                color: isSelected ? 'white' : speedColor.text,
                padding: '2px 10px', 
                borderRadius: '20px',
                fontSize: '0.7rem',
                fontWeight: 'bold'
              }}>
                {speedColor.label}
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
            
            <div style={{ 
              marginTop: '10px', 
              fontSize: '0.85rem', 
              fontWeight: 'bold',
              color: isSelected ? '#FFD700' : '#8B0000',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>💰 Price: ₵{price > 0 ? price.toFixed(2) : '0.00'}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function UserDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ 
    wallet_balance: 0, 
    total_orders: 0, 
    total_spent: 0, 
    referral_code: '', 
    is_agent: false,
    username: 'Customer',
    phone: ''
  });
  const [bundles, setBundles] = useState({});
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [unavailableSizes, setUnavailableSizes] = useState({});
  const [customSizeInput, setCustomSizeInput] = useState('');
  // Bill Payment States
  const [showBillModal, setShowBillModal] = useState(false);
  const [billStep, setBillStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [billAccountNumber, setBillAccountNumber] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billLoading, setBillLoading] = useState(false);
  const [billDetails, setBillDetails] = useState(null);
  const [billMeterNumber, setBillMeterNumber] = useState('');
  const [billSessionId, setBillSessionId] = useState('');
  const [billMeters, setBillMeters] = useState([]);
  const [selectedMeter, setSelectedMeter] = useState(null);

  // Dynamic size states
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [showCustomSize, setShowCustomSize] = useState(false);
  
  // Bundle Switcher State
  const [selectedBundleOption, setSelectedBundleOption] = useState(null);
  const [showBundleSwitcher, setShowBundleSwitcher] = useState(false);
  
  // MTN Delivery Options States
  const [deliveryOptions, setDeliveryOptions] = useState([]);
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState(null);
  const [deliveryOptionsLoading, setDeliveryOptionsLoading] = useState(false);
  const [deliveryCountdown, setDeliveryCountdown] = useState(30);
  const [lastDeliveryUpdate, setLastDeliveryUpdate] = useState(null);
  
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
  
  // Verification States
  const [verifyReference, setVerifyReference] = useState('');
  const [verifyTransactionId, setVerifyTransactionId] = useState('');
  const [verifySenderName, setVerifySenderName] = useState('');
  const [verifySenderPhone, setVerifySenderPhone] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [manualVerifyReference, setManualVerifyReference] = useState('');
  const [manualVerifyAmount, setManualVerifyAmount] = useState('');
  const [manualVerifyProof, setManualVerifyProof] = useState(null);
  const [manualVerifyUploading, setManualVerifyUploading] = useState(false);
  const [pendingPayments, setPendingPayments] = useState([]);
  
  // Purchase Confirmation States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [purchasingBundle, setPurchasingBundle] = useState(null);

  const quickAmounts = [10, 20, 50, 100, 200, 500];

  // ========== HELPER FUNCTIONS ==========
  
  const validatePhone = (phone) => {
    const phoneRegex = /^(024|025|026|027|028|020|054|055|059|050|057|053|056)[0-9]{7}$/;
    return phoneRegex.test(phone);
  };

  // ========== BILL PAYMENT FUNCTIONS ==========
  
  const validateBill = async (billerCode, accountNumber, phone, meterNumber = null) => {
    setBillLoading(true);
    try {
      const payload = {
        biller_code: billerCode,
        account_number: accountNumber,
        phone_number: phone
      };
      
      if (meterNumber) {
        payload.meter_number = meterNumber;
      }
      
      const response = await api.post('/agent/bills/validate', payload);
      
      if (response.data.success) {
        const data = response.data.data;
        
        if (data.meters) {
          setBillMeters(data.meters);
          setBillDetails({
            customerName: data.message || 'Multiple meters found',
            meters: data.meters,
            billerName: data.biller_name
          });
          return data;
        }
        
        setBillDetails({
          customerName: data.customer_name,
          amountDue: data.amount_due,
          accountNumber: data.account_number,
          billerName: data.biller_name,
          sessionId: data.session_id,
          meterNumber: data.meter_number || meterNumber
        });
        
        if (data.amount_due) {
          setBillAmount(data.amount_due.toString());
        }
        
        return data;
      } else {
        toast.error(response.data.error || 'Validation failed');
        return null;
      }
    } catch (error) {
      console.error('Bill validation error:', error);
      toast.error(error.response?.data?.error || 'Failed to validate bill');
      return null;
    } finally {
      setBillLoading(false);
    }
  };

  const payBill = async () => {
    if (!selectedCategory || !billAccountNumber || !billAmount) {
      toast.error('Please fill in all bill details');
      return;
    }

    const amountNum = parseFloat(billAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (stats.wallet_balance < amountNum) {
      toast.error(`Insufficient balance. Need ₵${amountNum.toFixed(2)} to pay this bill.`);
      return;
    }

    if (selectedCategory.id === 'ECG' && !billMeterNumber) {
      toast.error('Please select a meter number for ECG');
      return;
    }

    if (selectedCategory.id === 'GWCL' && !billSessionId) {
      toast.error('Please validate your water bill first');
      return;
    }

    const confirmResult = await Swal.fire({
      icon: 'question',
      title: 'Confirm Bill Payment',
      html: `
        <div style="text-align: left;">
          <p><strong>Biller:</strong> ${selectedCategory.name}</p>
          <p><strong>Account:</strong> ${billAccountNumber}</p>
          ${billMeterNumber ? `<p><strong>Meter:</strong> ${billMeterNumber}</p>` : ''}
          <p><strong>Amount:</strong> ₵${amountNum.toFixed(2)}</p>
          <p style="color: #8B0000; font-weight: bold;">This will be charged to your wallet: ₵${stats.wallet_balance.toFixed(2)}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#8B0000',
      confirmButtonText: 'Confirm Payment',
      cancelButtonText: 'Cancel'
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    setBillLoading(true);

    try {
      const payload = {
        biller_code: selectedCategory.id,
        account_number: billAccountNumber,
        amount: amountNum,
        customer_name: billDetails?.customerName || 'Customer',
        customer_phone: phoneNumber || stats.phone || '0557388622',
        customer_email: stats.email || '',
        meter_number: billMeterNumber || billAccountNumber,
        session_id: billSessionId || ''
      };

      const response = await api.post('/agent/bills/pay', payload);

      if (response.data.success) {
        await fetchUserData();
        toast.success(`✅ Bill paid successfully! You earned commission!`);
        setShowBillModal(false);
        resetBillModal();
        
        if (response.data.data?.commission) {
          Swal.fire({
            icon: 'success',
            title: 'Bill Payment Successful!',
            html: `
              <p>✅ ${selectedCategory.name} bill paid for ${billDetails?.customerName || 'Customer'}</p>
              <p>💰 Amount: ₵${amountNum.toFixed(2)}</p>
              <p>🏆 You earned: ₵${response.data.data.commission.you_earned?.toFixed(4) || '0.00'} commission!</p>
              <p>New Balance: ₵${response.data.data.new_balance?.toFixed(2) || stats.wallet_balance - amountNum}</p>
            `,
            confirmButtonColor: '#8B0000'
          });
        }
      } else {
        toast.error(response.data.error || 'Bill payment failed');
      }
    } catch (error) {
      console.error('Bill payment error:', error);
      toast.error(error.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setBillLoading(false);
    }
  };

  const fetchBillDetails = async () => {
    if (!billAccountNumber) {
      toast.error('Please enter your account number');
      return;
    }

    const result = await validateBill(
      selectedCategory.id,
      billAccountNumber,
      phoneNumber || stats.phone || '0557388622',
      billMeterNumber || null
    );

    if (result) {
      if (result.meters && result.meters.length > 0) {
        setBillStep(2.5);
        return;
      }
      
      if (result.session_id) {
        setBillSessionId(result.session_id);
      }
      
      setBillStep(3);
    }
  };

  const selectMeter = (meter) => {
    setSelectedMeter(meter);
    setBillMeterNumber(meter.meter_number || meter.number);
    setBillDetails(prev => ({
      ...prev,
      customerName: meter.name || meter.customer_name,
      accountNumber: meter.meter_number || meter.number
    }));
    
    validateBill(
      'ECG',
      meter.meter_number || meter.number,
      phoneNumber || stats.phone || '0557388622',
      meter.meter_number || meter.number
    ).then(result => {
      if (result && result.amount_due) {
        setBillAmount(result.amount_due.toString());
        if (result.session_id) {
          setBillSessionId(result.session_id);
        }
        setBillStep(3);
      }
    });
  };

  const resetBillModal = () => {
    setBillStep(1);
    setSelectedCategory(null);
    setSelectedProvider('');
    setBillAccountNumber('');
    setBillAmount('');
    setBillDetails(null);
    setBillLoading(false);
    setBillMeterNumber('');
    setBillSessionId('');
    setBillMeters([]);
    setSelectedMeter(null);
  };

  const openBillModal = () => {
    resetBillModal();
    setShowBillModal(true);
  };

  // ========== MTN DELIVERY OPTIONS ==========
  
  const fetchDeliveryOptions = async (network, sizeGb) => {
  if (!sizeGb) return;
  
  setDeliveryOptionsLoading(true);
  try {
    const response = await api.get('/delivery/options', {
      params: { network, size_gb: sizeGb }
    });
    
    console.log('📦 Delivery options response:', response.data);
    
    if (response.data && response.data.success) {
      const options = response.data.data.options || [];
      
      const formattedOptions = options.map(opt => ({
        ...opt,
        price: opt.price || 0,
        base_price: opt.base_price || 0,
        delivery_time: opt.delivery_time || { min: 3, max: 8, avg: 5 },
        final_price: opt.price || 0
      }));
      
      setDeliveryOptions(formattedOptions);
      setLastDeliveryUpdate(new Date());
      
      // Set default selected option ONLY if not manually set
      if (!priceManuallySetRef.current) {
        const defaultOption = formattedOptions.find(opt => opt.type === 'master') || 
                             formattedOptions.find(opt => opt.type === 'standard') || 
                             formattedOptions[0];
        if (defaultOption) {
          console.log(`🎯 Default option: ${defaultOption.type}`);
          setSelectedDeliveryOption(defaultOption);
          
          // Get the price for the selected size from the default option
          if (selectedSize) {
            const sizeNum = parseInt(selectedSize);
            const priceFromOption = defaultOption.prices?.[sizeNum] || defaultOption.price || 0;
            console.log(`💰 Price from default option for ${sizeNum}GB: ${priceFromOption}`);
            
            if (priceFromOption > 0 && selectedPrice === null) {
              // Only set price if not already set
              setSelectedPrice(priceFromOption);
              console.log(`✅ Set initial selectedPrice to: ${priceFromOption}`);
            }
          }
        }
      } else {
        console.log('ℹ️ Skipping auto-price update - price was manually set');
      }
    }
  } catch (error) {
    console.error('Failed to fetch delivery options:', error);
  } finally {
    setDeliveryOptionsLoading(false);
  }
};

  const handleDeliveryOptionSelect = (option) => {
    if (!option) {
      toast.error('Invalid delivery option');
      return;
    }
    
    const safeOption = {
      ...option,
      price: option.price || option.final_price || option.selling_price || 0,
      delivery_time: option.delivery_time || { min: 3, max: 8, avg: 5 }
    };
    
    setSelectedDeliveryOption(safeOption);
    
    if (selectedSize && safeOption.price > 0) {
      setSelectedPrice(safeOption.price);
      toast.success(`${safeOption.name} selected - Price: ₵${safeOption.price.toFixed(2)}`);
    }
  };

  // ========== DATA BUNDLE FUNCTIONS ==========
  
  const priceManuallySetRef = useRef(false);

// ========== FIXED handleBundleChange ==========
const handleBundleChange = (option) => {
  console.log('🔄 [UserDashboard] Bundle option selected:', option);
  
  if (!option) {
    console.warn('No option provided to handleBundleChange');
    return;
  }
  
  // Store the full option
  setSelectedBundleOption(option);
  
  // Get the price for the current size
  let price = 0;
  
  // Option 1: Check if there's a direct price for the selected size
  if (option.prices && selectedSize) {
    const sizeNum = parseInt(selectedSize);
    price = option.prices[sizeNum] || 0;
    console.log(`💰 Price for ${selectedSize}GB from prices object: ${price}`);
  }
  
  // Option 2: Check for direct price fields
  if (price === 0) {
    if (option.price !== undefined && option.price !== null) {
      price = option.price;
      console.log(`💰 Price from option.price: ${price}`);
    } else if (option.final_price !== undefined && option.final_price !== null) {
      price = option.final_price;
      console.log(`💰 Price from option.final_price: ${price}`);
    } else if (option.selling_price !== undefined && option.selling_price !== null) {
      price = option.selling_price;
      console.log(`💰 Price from option.selling_price: ${price}`);
    }
  }
  
  // Update the selling price if we have a valid price
  if (price > 0 && typeof price === 'number' && !isNaN(price)) {
    console.log(`✅ Setting selectedPrice to: ${price}`);
    priceManuallySetRef.current = true; // Mark as manually set
    setSelectedPrice(price);
    
    // Also update the selected delivery option
    if (selectedNetwork === 'mtn' && option) {
      const updatedOption = {
        ...option,
        price: price,
        current_price: price,
        selected_size_price: price
      };
      setSelectedDeliveryOption(updatedOption);
      console.log(`📦 Updated delivery option with price:`, updatedOption);
    }
    
    toast.success(`${option.name || 'Bundle'} selected - Price: ₵${price.toFixed(2)}`);
  } else {
    console.warn(`⚠️ No valid price found for ${selectedSize}GB`);
    const avgTime = option.delivery_time?.avg || option.avg_time || '?';
    toast.success(`${option.name || 'Bundle'} selected - Delivery: ~${avgTime} min`);
  }
};


  const purchaseData = async (network, sizeGb, price, phone = null) => {
    const bundleKey = `${network}-${sizeGb}`;
    setPurchasingBundle(bundleKey);
    const finalPrice = price || selectedPrice || 0;
    console.log(`💰 Purchase: ${sizeGb}GB for ₵${finalPrice}`);
    try {
      let userPhone = phone || phoneNumber;
      if (!userPhone) {
        const { value } = await Swal.fire({
          title: 'Enter Phone Number',
          input: 'tel',
          inputPlaceholder: '024XXXXXXX',
          showCancelButton: true,
          confirmButtonColor: '#8B0000',
          confirmButtonText: 'Continue'
        });
        if (!value) {
          setPurchasingBundle(null);
          return;
        }
        if (!validatePhone(value)) {
          toast.error('Please enter a valid Ghana phone number');
          setPurchasingBundle(null);
          return;
        }
        userPhone = value;
        setPhoneNumber(value);
      }
      
      const finalPrice = selectedDeliveryOption?.price || selectedDeliveryOption?.final_price || price || 0;
      console.log(`💰 Final price for purchase: ₵${finalPrice}`);

      if (stats.wallet_balance < finalPrice) {
        const result = await Swal.fire({
          icon: 'warning',
          title: 'Insufficient Balance!',
          html: `
            <p>You need ₵${finalPrice.toFixed(2)} to complete this purchase.</p>
            <p>Your current balance: ₵${stats.wallet_balance?.toFixed(2) || '0.00'}</p>
            <p>Please fund your wallet to continue.</p>
          `,
          confirmButtonColor: '#8B0000',
          confirmButtonText: 'Fund Wallet Now',
          showCancelButton: true,
          cancelButtonText: 'Cancel'
        });
        
        setPurchasingBundle(null);
        
        if (result.isConfirmed) {
          setShowFundModal(true);
        }
        return;
      }
      
      setPendingPurchase({
        network,
        sizeGb,
        price: finalPrice,
        phone: userPhone,
        bundleOption: selectedBundleOption,
        deliveryOption: selectedDeliveryOption,
        deliveryType: selectedDeliveryOption?.type || 'master',
        offerSlug: selectedDeliveryOption?.offer_slug
      });
      
      setShowConfirmModal(true);
      setPurchasingBundle(null);
      
    } catch (error) {
      setPurchasingBundle(null);
      console.error('Purchase error:', error);
      toast.error(error.response?.data?.error || 'Purchase failed');
    }
  };

  const confirmPurchase = async () => {
    if (!pendingPurchase) return;
    
    setConfirmLoading(true);
    setShowConfirmModal(false);
    
    try {
      const orderData = { 
        network: pendingPurchase.network, 
        size_gb: pendingPurchase.sizeGb, 
        phone: pendingPurchase.phone, 
        payment_method: 'wallet',
        delivery_type: pendingPurchase.deliveryType || 'master',
        offer_slug: pendingPurchase.offerSlug
      };
      
      const res = await api.post('/order', orderData);
      
      if (res.data.success) {
        await fetchUserData();
        
        let bundleName = selectedDeliveryOption?.name || 'Standard';
        
        await Swal.fire({
          icon: 'success',
          title: 'Purchase Successful!',
          html: `<p>✅ ${pendingPurchase.sizeGb}GB ${pendingPurchase.network.toUpperCase()} sent to ${pendingPurchase.phone}</p>
                 <p>🚀 Delivery: ${bundleName} (${selectedDeliveryOption?.delivery_time?.avg || 5} min avg)</p>
                 <p>💰 Amount: ₵${pendingPurchase.price.toFixed(2)}</p>
                 <p class="text-success">New Balance: ₵${res.data.data?.balance || stats.wallet_balance - pendingPurchase.price}</p>`,
          confirmButtonColor: '#8B0000'
        });
        setPendingPurchase(null);
        setSelectedSize('');
        setSelectedPrice(null);
        setShowBundleSwitcher(false);
        setSelectedBundleOption(null);
        setDeliveryOptions([]);
        setSelectedDeliveryOption(null);
      }
    } catch (error) {
      console.error('Confirm purchase error:', error);
      const errorMsg = error.response?.data?.error || 'Purchase failed. Please try again.';
      Swal.fire({ 
        icon: 'error', 
        title: 'Purchase Failed', 
        text: errorMsg,
        confirmButtonColor: '#8B0000' 
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  // ========== FETCH USER DATA ==========
  
  const fetchUserData = async () => {
    setLoading(true);
    try {
      const [statsRes, pricesRes, ordersRes, availabilityRes] = await Promise.all([
        api.get('/user/stats'),
        api.get('/prices'),
        api.get('/user/orders'),
        api.get('/user/unavailable-packages').catch(() => ({ data: { data: {} } }))
      ]);
      
      setStats(statsRes.data.data);
      
      const unavailable = availabilityRes.data?.data || {};
      setUnavailableSizes(unavailable);
      
      const filteredBundles = pricesRes.data.data;
      setBundles(filteredBundles);
      setOrders(ordersRes.data.data || []);
      
      const initialNetwork = 'mtn';
      const initialSizes = Object.keys(filteredBundles[initialNetwork] || {}).map(Number).sort((a, b) => a - b);
      setAvailableSizes(initialSizes);
      
    } catch (error) {
      console.error('Fetch user data error:', error);
      toast.error('Failed to load data');
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersWithRealTimeStatus = async () => {
    try {
      const response = await api.get('/user/orders');
      const orders = response.data.data || [];
      setOrders(orders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
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

  const handleNetworkChange = async (network) => {
    setSelectedNetwork(network);
    setSelectedSize('');
    setSelectedPrice(null);
    setShowCustomSize(false);
    setShowBundleSwitcher(false);
    setSelectedBundleOption(null);
    setDeliveryOptions([]);
    setSelectedDeliveryOption(null);
    
    const networkBundles = bundles[network] || {};
    const sizes = Object.keys(networkBundles).map(Number).sort((a, b) => a - b);
    setAvailableSizes(sizes);
  };

  const handleSizeSelect = (size) => {
  console.log(`📊 Size selected: ${size}GB`);
  
  // Reset manual price flag when selecting a new size
  priceManuallySetRef.current = false;
  
  setSelectedSize(size);
  setShowCustomSize(false);
  setCustomSizeInput('');
  
  const sizeNum = parseInt(size);
  const basePrice = bundles[selectedNetwork]?.[sizeNum];
  
  console.log(`💰 Base price for ${size}GB: ${basePrice}`);
  
  if (basePrice) {
    setSelectedPrice(basePrice);
    setShowBundleSwitcher(true);
    
    if (selectedNetwork === 'mtn') {
      fetchDeliveryOptions(selectedNetwork, sizeNum);
    }
  } else {
    setSelectedPrice(null);
    setShowBundleSwitcher(false);
  }
};

// ========== FIXED handleCustomSize ==========
const handleCustomSize = async (e) => {
  const size = parseInt(e.target.value);
  setSelectedSize(e.target.value);
  
  // Reset manual price flag when entering a new size
  priceManuallySetRef.current = false;
  
  if (size && !isNaN(size) && size > 0) {
    setLoadingPrice(true);
    try {
      const price = bundles[selectedNetwork]?.[size];
      if (price) {
        setSelectedPrice(price);
        setShowCustomSize(false);
        setShowBundleSwitcher(true);
        
        if (selectedNetwork === 'mtn') {
          fetchDeliveryOptions(selectedNetwork, size);
        }
      } else {
        setSelectedPrice(null);
        setShowCustomSize(true);
        setShowBundleSwitcher(false);
      }
    } catch (error) {
      setSelectedPrice(null);
      setShowCustomSize(true);
      setShowBundleSwitcher(false);
    } finally {
      setLoadingPrice(false);
    }
  } else {
    setSelectedPrice(null);
    setSelectedSize('');
    setShowCustomSize(false);
    setShowBundleSwitcher(false);
  }
};

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const retryOrder = async (order) => {
    const result = await Swal.fire({
      title: 'Retry Order?',
      text: `Retry delivering ${order.size_gb}GB to ${order.customer_phone || order.phone}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      confirmButtonText: 'Yes, Retry',
      cancelButtonText: 'Cancel'
    });
    
    if (result.isConfirmed) {
      try {
        toast.loading('Retrying order...');
        const response = await api.post(`/order/${order.order_id}/retry`);
        toast.dismiss();
        
        if (response.data.success) {
          toast.success('Order retried successfully!');
          fetchOrdersWithRealTimeStatus();
        } else {
          toast.error(response.data.error || 'Failed to retry order');
        }
      } catch (error) {
        toast.dismiss();
        toast.error(error.response?.data?.error || 'Failed to retry order');
      }
    }
  };

  // ========== PAYMENT HANDLERS ==========
  
  const initializePaystackPayment = async (amount, email) => {
    setProcessingPayment(true);
    try {
      const response = await api.post('/payment/paystack/initialize', {
        amount: amount,
        email: email,
        phone: stats.phone || phoneNumber,
        metadata: {
          type: 'wallet_funding',
          user_id: stats.id,
          user_name: stats.username
        }
      });
      
      const { authorization_url, reference } = response.data.data;
      
      const paystackPopup = window.open(authorization_url, '_blank', 'width=600,height=700');
      
      const checkPaymentInterval = setInterval(async () => {
        try {
          const verifyResponse = await api.get(`/payment/paystack/verify/${reference}`);
          if (verifyResponse.data.data.status === 'success') {
            clearInterval(checkPaymentInterval);
            paystackPopup?.close();
            
            await Swal.fire({
              icon: 'success',
              title: 'Payment Successful!',
              html: `₵${amount} has been added to your wallet.`,
              confirmButtonColor: '#8B0000'
            });
            
            await fetchUserData();
            setShowFundModal(false);
            resetFundModal();
            setProcessingPayment(false);
          }
        } catch (error) {
          console.error('Verification error:', error);
        }
      }, 5000);
      
      setTimeout(() => {
        clearInterval(checkPaymentInterval);
        if (processingPayment) {
          setProcessingPayment(false);
        }
      }, 300000);
      
    } catch (error) {
      console.error('Paystack initialization error:', error);
      toast.error(error.response?.data?.error || 'Payment initialization failed');
      setProcessingPayment(false);
    }
  };

  const handleAmountSubmit = async () => {
    const amountNum = parseFloat(fundAmount);
    const method = paymentMethods.find(m => m.id === selectedMethod);
    
    if (!fundAmount || isNaN(amountNum)) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amountNum < method.min) {
      toast.error(`Minimum amount is ₵${method.min}`);
      return;
    }
    if (amountNum > method.max) {
      toast.error(`Maximum amount is ₵${method.max.toLocaleString()}`);
      return;
    }

    if (selectedMethod === 'paystack') {
      closeFundModal();
      
      setTimeout(async () => {
        const { value: email } = await Swal.fire({
          title: 'Enter Your Email',
          input: 'email',
          inputPlaceholder: 'you@example.com',
          showCancelButton: true,
          confirmButtonColor: '#00B3E6',
          confirmButtonText: 'Proceed to Paystack',
          preConfirm: (emailValue) => {
            if (!emailValue) {
              Swal.showValidationMessage('Email is required');
            }
            return emailValue;
          }
        });
        
        if (email) {
          await initializePaystackPayment(amountNum, email);
        }
      }, 300);
      
    } else if (selectedMethod === 'manual') {
      setLoadingRequest(true);
      try {
        const res = await paymentAPI.createManualRequest(amountNum, stats.phone || phoneNumber);
        setManualRequest(res.data.data);
        setFundStep(3);
        toast.success('Manual payment request created!');
      } catch (error) {
        console.error('Create manual request error:', error);
        toast.error(error.response?.data?.error || 'Failed to create request');
      } finally {
        setLoadingRequest(false);
      }
    }
  };

  const handleCopyReference = () => {
    if (manualRequest?.reference) {
      navigator.clipboard.writeText(manualRequest.reference);
      setCopied(true);
      toast.success('Reference copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAutoVerifyPayment = async () => {
    if (!verifyReference || !verifyTransactionId) {
      toast.error('Please enter reference ID and transaction ID');
      return;
    }

    setVerifying(true);
    try {
      const res = await paymentAPI.verifyPayment(
        verifyReference, 
        verifyTransactionId, 
        verifySenderName, 
        verifySenderPhone
      );
      if (res.data.success) {
        toast.success(`Payment verified! Wallet credited.`);
        closeVerifyModal();
        await fetchUserData();
        await fetchPendingPayments();
        
        Swal.fire({
          icon: 'success',
          title: 'Wallet Credited!',
          html: `₵${res.data.data.amount} has been added to your wallet.`,
          confirmButtonColor: '#8B0000'
        });
      }
    } catch (error) {
      console.error('Verify payment error:', error);
      toast.error(error.response?.data?.error || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleManualVerifyPayment = async () => {
    if (!manualVerifyProof) {
      toast.error('Please upload your payment proof/screenshot');
      return;
    }
    
    setManualVerifyUploading(true);
    
    const formData = new FormData();
    formData.append('request_id', manualVerifyReference);
    formData.append('proof', manualVerifyProof);
    
    try {
      const response = await api.post('/payment/upload-proof', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        toast.success(response.data.message || 'Payment proof submitted for admin approval!');
        setShowVerifyModal(false);
        resetVerifyModal();
        await fetchPendingPayments();
        
        Swal.fire({
          icon: 'success',
          title: 'Proof Submitted!',
          html: `Your payment proof for reference <strong>${manualVerifyReference}</strong> has been submitted.<br><br>Admin will review and credit your wallet within 5-30 minutes.`,
          confirmButtonColor: '#8B0000'
        });
        
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

  const handleFileUpload = async () => {
    if (!proofFile) {
      toast.error('Please select a payment screenshot');
      return;
    }

    if (!manualRequest?.id) {
      toast.error('No payment request found');
      return;
    }

    setUploadingProof(true);
    
    const formData = new FormData();
    formData.append('request_id', manualRequest.id);
    formData.append('proof', proofFile);

    try {
      const response = await api.post('/payment/upload-proof', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        toast.success(response.data.message || 'Proof uploaded successfully!');
        closeFundModal();
        await fetchUserData();
        await fetchPendingPayments();
        
        Swal.fire({
          icon: 'success',
          title: 'Proof Uploaded!',
          html: response.data.message || 'Your payment proof has been submitted. Admin will verify within 5-30 minutes.',
          confirmButtonColor: '#8B0000'
        });
      } else {
        toast.error(response.data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = error.response?.data?.error || 'Upload failed. Please try again.';
      toast.error(errorMsg);
    } finally {
      setUploadingProof(false);
    }
  };

  const downloadInstructions = () => {
    if (!manualRequest) return;
    
    const instructions = `
${COMPANY.name.toUpperCase()} - MANUAL PAYMENT INSTRUCTIONS

Amount: ₵${manualRequest.amount}
Reference ID: ${manualRequest.reference}
Date: ${new Date().toLocaleString()}

PAYMENT DETAILS:
Recipient: ${COMPANY.name}
Phone: ${COMPANY.phone}

INSTRUCTIONS:
1. Go to your mobile money wallet
2. Select "Send Money" or "Transfer"
3. Enter recipient: ${COMPANY.phone}
4. Enter amount: ₵${manualRequest.amount}
5. Enter Reference: ${manualRequest.reference}
6. Complete the transaction
7. Take a screenshot of the confirmation
8. Upload the screenshot using the upload button

Your wallet will be credited after admin verification.
    `;
    
    const blob = new Blob([instructions], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment_instructions_${manualRequest.reference}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Instructions downloaded');
  };

  const resetFundModal = () => {
    setFundStep(1);
    setFundAmount('');
    setSelectedMethod('paystack');
    setManualRequest(null);
    setProofFile(null);
    setCopied(false);
  };

  const resetVerifyModal = () => {
    setVerifyReference('');
    setVerifyTransactionId('');
    setVerifySenderName('');
    setVerifySenderPhone('');
    setManualVerifyReference('');
    setManualVerifyAmount('');
    setManualVerifyProof(null);
  };

  const closeFundModal = () => {
    setShowFundModal(false);
    resetFundModal();
  };

  const closeVerifyModal = () => {
    setShowVerifyModal(false);
    resetVerifyModal();
    setManualVerifyReference('');
    setManualVerifyAmount('');
    setManualVerifyProof(null);
    setVerifyOption('auto');
  };

  const copyReferralCode = () => {
    if (stats.referral_code) {
      navigator.clipboard.writeText(stats.referral_code);
      setCopied(true);
      toast.success(`Referral code copied!`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBecomeAgent = async () => {
    try {
      const result = await Swal.fire({
        title: 'Become an Agent!',
        html: `
          <div style="text-align: left;">
            <p><strong>✅ FREE Registration!</strong></p>
            <p>As an Agent, you'll enjoy:</p>
            <ul style="text-align: left;">
              <li>💰 Competitive commission rates up to 25%</li>
              <li>🏪 Your own branded store page</li>
              <li>📊 Access to wholesale prices</li>
              <li>💸 Instant withdrawals</li>
              <li>🎓 Agent training and support</li>
            </ul>
            <p>No payment required. Just confirm to become an agent.</p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        confirmButtonText: 'Yes, Become Agent for Free!',
        cancelButtonText: 'No, Thanks'
      });
      
      if (result.isConfirmed) {
        const response = await api.post('/agent/apply', { free: true });
        
        if (response.data.success) {
          await Swal.fire({
            icon: 'success',
            title: '🎉 Welcome to the Agent Program!',
            html: `
              <p>Your application has been submitted/approved.</p>
              <p>You can now start selling data bundles at wholesale prices!</p>
              <p>Your agent dashboard will be activated shortly.</p>
            `,
            confirmButtonColor: '#8B0000'
          });
          await fetchUserData();
          navigate('/agent');
        }
      }
    } catch (error) {
      console.error('Become agent error:', error);
      toast.error(error.response?.data?.error || 'Failed to become agent. Please try again.');
    }
  };

  // ========== FILTERED ORDERS ==========
  
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.network?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (order.delivery_status || order.status) === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // ========== AUTO-REFRESH DELIVERY OPTIONS ==========
  
  useEffect(() => {
    let intervalId = null;
    let countdownId = null;
    
    if (selectedSize && selectedNetwork === 'mtn') {
      fetchDeliveryOptions(selectedNetwork, parseInt(selectedSize));
      
      intervalId = setInterval(() => {
        fetchDeliveryOptions(selectedNetwork, parseInt(selectedSize));
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

  // ========== INITIAL FETCH ==========
  
  useEffect(() => {
    fetchUserData();
    fetchOrdersWithRealTimeStatus();
    fetchPendingPayments();
  }, []);

  useEffect(() => {
    if (bundles[selectedNetwork]) {
      const sizes = Object.keys(bundles[selectedNetwork]).map(Number).sort((a, b) => a - b);
      setAvailableSizes(sizes);
    }
  }, [selectedNetwork, bundles]);

  // ========== STYLES ==========
  
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.2); }
      100% { opacity: 1; transform: scale(1); }
    }
  `;
  document.head.appendChild(styleSheet);

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading {COMPANY.shortName} dashboard...</p>
    </div>
  );

  const currentBundles = bundles[selectedNetwork] || {};

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="banner-content">
          <h1>Welcome back to {COMPANY.shortName}, {stats.username || 'Customer'}! 👋</h1>
          <p>Get instant data bundles, pay bills, WAEC vouchers, and more with 2-second delivery.</p>
          <div className="banner-stats">
            <div className="banner-stat"><FaCheckCircle /><span>99.9% Success Rate</span></div>
            <div className="banner-stat"><FaClock /><span>2 Sec Delivery</span></div>
            <div className="banner-stat"><FaMobileAlt /><span>All Networks</span></div>
          </div>
        </div>
        <div className="banner-actions">
          <button className="btn-primary" onClick={() => setShowFundModal(true)}>
            <FaWallet /> Fund Wallet
          </button>
          <button className="btn-outline" onClick={() => setShowVerifyModal(true)}>
            <FaCheckCircle /> Verify Payment
          </button>
          <button className="btn-outline btn-bill" onClick={openBillModal}>
            <FaReceipt /> Pay Bills
          </button>
          {!stats.is_agent && (
            <button className="btn-outline btn-success" onClick={handleBecomeAgent}>
              <FaUserPlus /> Become Agent (FREE)
            </button>
          )}
        </div>
      </div>

      {/* Pending Payments Notice */}
      {pendingPayments.length > 0 && (
        <div className="notice-box" style={{ background: '#fff3cd', borderLeft: '4px solid #ffc107', marginBottom: '20px', padding: '12px 15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="notice-icon">⏳</div>
          <div className="notice-content" style={{ flex: 1 }}>
            <strong>Pending Payments:</strong> You have {pendingPayments.length} pending payment(s) awaiting admin approval.
            <button onClick={() => setShowVerifyModal(true)} style={{ background: 'none', border: 'none', color: '#8B0000', cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px' }}>
              Track status →
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <motion.div whileHover={{ y: -5 }} className="stat-card">
          <div className="stat-icon"><FaWallet /></div>
          <div className="stat-value">₵{stats.wallet_balance?.toFixed(2) || '0.00'}</div>
          <div className="stat-label">Wallet</div>
        </motion.div>
        <motion.div whileHover={{ y: -5 }} className="stat-card">
          <div className="stat-icon"><FaShoppingCart /></div>
          <div className="stat-value">{stats.total_orders || 0}</div>
          <div className="stat-label">Total Orders</div>
        </motion.div>
        <motion.div whileHover={{ y: -5 }} className="stat-card">
          <div className="stat-icon"><FaChartLine /></div>
          <div className="stat-value">₵{stats.total_spent?.toFixed(2) || '0'}</div>
          <div className="stat-label">Total Spent</div>
        </motion.div>
        <motion.div whileHover={{ y: -5 }} className="stat-card">
          <div className="stat-icon"><FaGift /></div>
          <div className="stat-value">
            {stats.referral_code || 'N/A'}
            {stats.referral_code && (
              <button onClick={copyReferralCode} className="copy-code-btn">
                {copied ? <FaCheck /> : <FaCopy />}
              </button>
            )}
          </div>
          <div className="stat-label">Referral Code</div>
        </motion.div>
      </div>

      {/* Quick Tips Section */}
      <div className="quick-tips-section">
        <h3><FaCheckCircle /> Quick Tips</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-icon">📱</div>
            <div className="tip-content">
              <h4>Instant Delivery</h4>
              <p>Data is delivered within 2 seconds after purchase</p>
            </div>
          </div>
          <div className="tip-card">
            <div className="tip-icon">💰</div>
            <div className="tip-content">
              <h4>Refer & Earn</h4>
              <p>Share your referral code and earn GHS 5 per referral</p>
            </div>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🛡️</div>
            <div className="tip-content">
              <h4>Secure Payments</h4>
              <p>All transactions are encrypted and secure</p>
            </div>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🎓</div>
            <div className="tip-content">
              <h4>WAEC Vouchers</h4>
              <p>Purchase result checker vouchers instantly</p>
            </div>
          </div>
          <div className="tip-card">
            <div className="tip-icon">⚡</div>
            <div className="tip-content">
              <h4>Pay Bills</h4>
              <p>Electricity, water, TV, and internet bills</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Bundles Section */}
<div className="section-header">
  <h2><FaDatabase /> Data Bundles</h2>
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



{/* Dynamic Size Input Section */}
<div className="custom-size-section">
  <div className="custom-size-input">
    <h3>Enter Data Size</h3>
    <div className="size-input-group">
      <input
        type="number"
        min="1"
        max="100"
        value={selectedSize}
        onChange={handleCustomSize}
        placeholder="Enter GB (e.g., 15)"
        className="form-control"
      />
      <span className="gb-label">GB</span>
    </div>
    
    {loadingPrice && <div className="spinner-small"><FaSpinner className="spinning" /> Checking price...</div>}
    
    {/* Price Display - Always show when price is available */}
    {selectedPrice !== null && selectedPrice > 0 && !loadingPrice && (
      <div className="price-display" style={{
        background: 'linear-gradient(135deg, #8B0000 0%, #D2691E 100%)',
        borderRadius: '12px',
        padding: '15px 20px',
        margin: '15px 0',
        textAlign: 'center',
        color: 'white'
      }}>
        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Current Price</div>
        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
          ₵{selectedPrice.toFixed(2)}
        </div>
        {selectedDeliveryOption && selectedDeliveryOption.name && (
          <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '4px' }}>
            via {selectedDeliveryOption.name} • {selectedDeliveryOption.delivery_time?.avg || 5} min delivery
          </div>
        )}
      </div>
    )}
    
    {selectedSize && !selectedPrice && !loadingPrice && (
      <div className={`price-not-found ${unavailableSizes[selectedNetwork]?.includes(selectedSize.toString()) ? 'price-unavailable' : ''}`}>
        {unavailableSizes[selectedNetwork]?.includes(selectedSize.toString()) ? (
          <>
            <div className="unavailable-icon">🚫</div>
            <p><strong>{selectedSize}GB is currently UNAVAILABLE</strong> on {selectedNetwork.toUpperCase()}</p>
            <p className="text-muted">This package has been disabled by the administrator.</p>
            <small>Please select from available sizes below</small>
          </>
        ) : (
          <>
            <p>⚠️ No price configured for {selectedSize}GB on {selectedNetwork.toUpperCase()}</p>
            <p className="text-muted">Please contact admin to add this size or select from available sizes below</p>
          </>
        )}
      </div>
    )}
    
    <div className="available-sizes">
      <h4>Available Sizes</h4>
      <div className="size-chips">
        {availableSizes.map(size => {
          const isUnavailable = unavailableSizes[selectedNetwork]?.includes(size.toString());
          return (
            <button
              key={size}
              className={`size-chip ${selectedSize == size ? 'active' : ''} ${isUnavailable ? 'unavailable' : ''}`}
              onClick={() => !isUnavailable && handleSizeSelect(size)}
              disabled={isUnavailable}
              title={isUnavailable ? 'This package is currently unavailable' : `Purchase ${size}GB`}
            >
              {size}GB {isUnavailable && '❌'}
            </button>
          );
        })}
      </div>
    </div>
  </div>
</div>

{/* Bundle Switcher Section */}
{showBundleSwitcher && selectedSize && selectedPrice && (
  <div className="bundle-switcher-section">
    <BundleSwitcher
      network={selectedNetwork}
      sizeGb={parseInt(selectedSize)}
      basePrice={selectedPrice}
      onBundleChange={handleBundleChange}
      initialType="standard"
    />
    
    {/* Price Summary after BundleSwitcher */}
    {selectedPrice > 0 && (
      <div className="selected-price-summary" style={{
        background: '#f0f8ff',
        borderRadius: '12px',
        padding: '15px',
        margin: '15px 0',
        border: '2px solid #8B0000',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '0.8rem', color: '#666' }}>Current Price for {selectedSize}GB</div>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8B0000' }}>
          ₵{selectedPrice.toFixed(2)}
        </div>
        {selectedDeliveryOption && (
          <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
            Delivery: {selectedDeliveryOption.name} • ~{selectedDeliveryOption.delivery_time?.avg || 5} min
          </div>
        )}
      </div>
    )}
    
    <div className="purchase-action" style={{ marginTop: '20px', textAlign: 'center' }}>
      <button 
        className="btn-primary btn-lg"
        onClick={() => {
          // Use selectedPrice directly - it's already set by handleBundleChange
          const finalPrice = selectedPrice || 0;
          console.log(`💰 Buying ${selectedSize}GB for ₵${finalPrice}`);
          purchaseData(
            selectedNetwork, 
            parseInt(selectedSize), 
            finalPrice, 
            phoneNumber
          );
        }}
        disabled={!selectedSize || !selectedPrice || selectedPrice <= 0}
        style={{ 
          padding: '12px 30px', 
          fontSize: '18px',
          backgroundColor: '#28a745',
          borderRadius: '50px'
        }}
      >
        Buy {selectedSize}GB - ₵{(selectedPrice || 0).toFixed(2)}
      </button>
      {selectedDeliveryOption && (
        <p className="delivery-estimate" style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          ⚡ Delivery via {selectedDeliveryOption.name}: ~{selectedDeliveryOption.delivery_time?.avg || 5} minutes
          {selectedDeliveryOption.type === 'express' && (
            <span style={{ display: 'block', fontSize: '11px', color: '#f39c12' }}>
              ⚡ Express premium applies
            </span>
          )}
        </p>
      )}
    </div>
  </div>
)}

{/* Popular Bundles Grid - Updated to use delivery option prices */}
<div className="bundles-grid">
  <h3 className="bundles-subtitle">Popular Bundles</h3>
  <div className="bundles-grid-container">
    {Object.entries(currentBundles)
      .filter(([size]) => !unavailableSizes[selectedNetwork]?.includes(size.toString()))
      .slice(0, 8)
      .map(([size, basePrice]) => {
        const isPurchasing = purchasingBundle === `${selectedNetwork}-${size}`;
        const sizeNum = parseInt(size);
        
        // Get the price from the selected delivery option
        let displayPrice = basePrice;
        let deliveryLabel = '';
        let priceSource = 'Base';
        
        // Check if we have a selected delivery option with prices
        if (selectedNetwork === 'mtn') {
          if (selectedDeliveryOption?.prices && selectedDeliveryOption.prices[sizeNum] !== undefined) {
            displayPrice = selectedDeliveryOption.prices[sizeNum];
            deliveryLabel = selectedDeliveryOption.type === 'express' ? '⚡ Express' : '👑 Master';
            priceSource = selectedDeliveryOption.name;
          }
        }
        
        return (
          <motion.div 
            key={size} 
            whileHover={{ y: -5, scale: 1.02 }} 
            className="bundle-card" 
          >
            <div className="bundle-size">{size}GB</div>
            <div className="bundle-price">
              ₵{displayPrice.toFixed(2)}
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
              {priceSource !== 'Base' && (
                <span style={{ 
                  fontSize: '0.5rem', 
                  display: 'block', 
                  color: '#999',
                  marginTop: '1px'
                }}>
                  via {priceSource}
                </span>
              )}
            </div>
            <div className="bundle-network">{selectedNetwork.toUpperCase()}</div>
            <div className="bundle-delivery">⚡ Instant Delivery</div>
            <button 
              className="btn-primary"
              onClick={() => {
                setSelectedSize(size);
                setSelectedPrice(displayPrice);
                setShowBundleSwitcher(true);
                if (selectedNetwork === 'mtn') {
                  fetchDeliveryOptions(selectedNetwork, sizeNum);
                }
              }}
              disabled={isPurchasing}
            >
              {isPurchasing ? <FaSpinner className="spinning" /> : 'Select & Buy'}
            </button>
          </motion.div>
        );
      })}
    
    {Object.entries(currentBundles).filter(([size]) => !unavailableSizes[selectedNetwork]?.includes(size.toString())).length === 0 && (
      <div className="no-packages-message">
        <div className="icon">📦</div>
        <p>No data packages available for {selectedNetwork.toUpperCase()}</p>
        <small>Please check back later or contact support</small>
      </div>
    )}
  </div>
</div>

      {/* Additional Services Section */}
      <div className="additional-services-section">
        <div className="section-header">
          <h2><FaGraduationCap /> Additional Services</h2>
          <p>WAEC Vouchers & Bill Payments</p>
        </div>
        
        <div className="services-grid">
          <div className="service-card waec-card">
            <div className="service-header">
              <FaGraduationCap className="service-icon" />
              <h3>WAEC Result Checker</h3>
              <span className="service-badge">Available</span>
            </div>
            <WAECVoucher />
          </div>

          <div className="service-card bills-card">
            <div className="service-header">
              <FaReceipt className="service-icon" />
              <h3>Pay Bills</h3>
              <span className="service-badge">Available</span>
            </div>
            <button className="btn-primary btn-bill-pay" onClick={openBillModal}>
              <FaReceipt /> Pay Bill Now
            </button>
            <div className="bill-categories-preview">
              {billCategories.map(cat => (
                <div key={cat.id} className="bill-cat-icon" style={{ color: cat.color }}>
                  {cat.icon}
                  <span>{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
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
          <th>Recipient</th>
          <th>Network / Biller</th>
          <th>Status</th>
          <th>Source</th>
          <th>Paid</th>
          <th>Bal. Before</th>
          <th>Amount</th>
          <th>Bal. After</th>
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
          
          // Get balance info
          const balanceBefore = order.balance_before || 0;
          const balanceAfter = order.balance_after || 0;
          
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
                {order.customer_phone || order.phone_number || order.phone || '—'}
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
                  {order.source || (order.agent_id ? 'Agent' : 'User')}
                </span>
              </td>
              <td className="amount">
                ₵{(order.customer_paid || order.amount)?.toFixed(2) || '0.00'}
              </td>
              <td className="amount">
                ₵{balanceBefore.toFixed(2)}
              </td>
              <td className="amount text-danger">
                -₵{(order.amount_deducted || order.cost || order.amount || 0).toFixed(2)}
              </td>
              <td className="amount">
                ₵{balanceAfter.toFixed(2)}
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
            <td colSpan="13" className="text-center">
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

      {/* Need Help Section */}
      <div className="need-help-section">
        <div className="help-content">
          <FaHeadset size={32} />
          <div>
            <h4>Need Help?</h4>
            <p>Contact our support team for assistance with your orders or wallet</p>
          </div>
          <a href={`https://wa.me/233${COMPANY.phone}`} target="_blank" rel="noopener noreferrer" className="btn-outline">
            <FaWhatsapp /> WhatsApp Support
          </a>
        </div>
      </div>

      {/* ========== BILL PAYMENT MODAL ========== */}
      <AnimatePresence>
        {showBillModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="modal-overlay" 
            onClick={() => setShowBillModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }} 
              animate={{ scale: 1, y: 0 }} 
              className="modal-content bill-modal" 
              onClick={e => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setShowBillModal(false)}>×</button>
              
              <div className="bill-payment-container">
                <div className="bill-header">
                  <FaReceipt className="bill-icon" />
                  <h3>Pay Bills</h3>
                  <p>Select a biller and pay instantly from your wallet</p>
                </div>
                
                {/* Step 1: Select Category */}
                {billStep === 1 && (
                  <div className="bill-step">
                    <h4>Select Biller</h4>
                    <div className="bill-categories">
                      {billCategories.map(cat => (
                        <div 
                          key={cat.id}
                          className={`bill-category ${selectedCategory?.id === cat.id ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedCategory(cat);
                            setSelectedProvider(cat.id);
                            setBillStep(2);
                          }}
                          style={{ borderColor: selectedCategory?.id === cat.id ? cat.color : '#e0e0e0' }}
                        >
                          <div className="bill-cat-icon" style={{ color: cat.color }}>{cat.icon}</div>
                          <div className="bill-cat-name">{cat.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Step 2: Enter Account Details */}
                {billStep === 2 && selectedCategory && (
                  <div className="bill-step">
                    <button className="back-btn" onClick={() => setBillStep(1)}>
                      <FaArrowLeft /> Back to Billers
                    </button>
                    <h4>Enter {selectedCategory.name} Details</h4>
                    
                    <div className="form-group">
                      <label>Account / Meter Number</label>
                      <input 
                        type="text"
                        className="form-control"
                        placeholder={`Enter your ${selectedCategory.name} account number`}
                        value={billAccountNumber}
                        onChange={(e) => setBillAccountNumber(e.target.value)}
                      />
                      <small>Your account or meter number for this biller</small>
                    </div>
                    
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input 
                        type="tel"
                        className="form-control"
                        placeholder="024XXXXXXX"
                        value={phoneNumber || stats.phone || ''}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                      <small>Phone number linked to your bill account (for validation)</small>
                    </div>
                    
                    <button 
                      className="btn-primary"
                      onClick={fetchBillDetails}
                      disabled={!billAccountNumber || billLoading}
                    >
                      {billLoading ? <FaSpinner className="spinning" /> : 'Validate & Get Bill Details'}
                    </button>
                  </div>
                )}
                
                {/* Step 2.5: ECG Meter Selection */}
                {billStep === 2.5 && billMeters.length > 0 && (
                  <div className="bill-step">
                    <button className="back-btn" onClick={() => setBillStep(2)}>
                      <FaArrowLeft /> Back
                    </button>
                    <h4>Select ECG Meter</h4>
                    <p>Multiple meters found for this phone number. Select one:</p>
                    
                    <div className="meter-list">
                      {billMeters.map((meter, idx) => (
                        <div 
                          key={idx}
                          className={`meter-item ${selectedMeter?.meter_number === meter.meter_number ? 'active' : ''}`}
                          onClick={() => selectMeter(meter)}
                        >
                          <div className="meter-number">{meter.meter_number || meter.number}</div>
                          <div className="meter-name">{meter.name || meter.customer_name || 'Unnamed'}</div>
                          <div className="meter-address">{meter.address || ''}</div>
                        </div>
                      ))}
                    </div>
                    
                    {billLoading && <div className="loading-spinner"><FaSpinner className="spinning" /></div>}
                  </div>
                )}
                
                {/* Step 3: Bill Details & Payment */}
                {billStep === 3 && billDetails && (
                  <div className="bill-step">
                    <button className="back-btn" onClick={() => setBillStep(2)}>
                      <FaArrowLeft /> Back
                    </button>
                    <h4>Bill Details</h4>
                    
                    <div className="bill-details-card">
                      <div className="detail-row">
                        <span>Biller:</span>
                        <strong>{selectedCategory?.name}</strong>
                      </div>
                      <div className="detail-row">
                        <span>Customer:</span>
                        <strong>{billDetails.customerName || 'N/A'}</strong>
                      </div>
                      <div className="detail-row">
                        <span>Account:</span>
                        <strong>{billDetails.accountNumber || billAccountNumber}</strong>
                      </div>
                      {billMeterNumber && (
                        <div className="detail-row">
                          <span>Meter:</span>
                          <strong>{billMeterNumber}</strong>
                        </div>
                      )}
                      <div className="detail-row">
                        <span>Amount Due:</span>
                        <strong className="amount-due">₵{billDetails.amountDue || billAmount || '0.00'}</strong>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Amount to Pay (GHS)</label>
                      <input 
                        type="number"
                        className="form-control"
                        value={billAmount}
                        onChange={(e) => setBillAmount(e.target.value)}
                        min="1"
                        max={billDetails.amountDue || 999999}
                      />
                      <small>Wallet Balance: ₵{stats.wallet_balance?.toFixed(2) || '0.00'}</small>
                    </div>
                    
                    <button 
                      className="btn-primary btn-pay"
                      onClick={payBill}
                      disabled={billLoading || stats.wallet_balance < parseFloat(billAmount)}
                    >
                      {billLoading ? <FaSpinner className="spinning" /> : (
                        <>Confirm Payment - ₵{parseFloat(billAmount).toFixed(2)}</>
                      )}
                    </button>
                    
                    {stats.wallet_balance < parseFloat(billAmount) && (
                      <p className="error-text">⚠️ Insufficient balance. Please fund your wallet first.</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== FUND WALLET MODAL ========== */}
      <AnimatePresence>
        {showFundModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="modal-overlay" 
            onClick={closeFundModal}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }} 
              animate={{ scale: 1, y: 0 }} 
              className="modal-content fund-wallet-modal" 
              onClick={e => e.stopPropagation()}
            >
              <button className="modal-close" onClick={closeFundModal}>×</button>
              
              {fundStep === 1 && (
                <div className="fund-step">
                  <h3>Fund Your Wallet</h3>
                  <p>Select your preferred payment method</p>
                  
                  <div className="methods-grid">
                    {paymentMethods.map(method => (
                      <div 
                        key={method.id}
                        className={`method-card ${selectedMethod === method.id ? 'active' : ''}`}
                        onClick={() => setSelectedMethod(method.id)}
                      >
                        <div className="method-icon" style={{ color: method.color }}>{method.icon}</div>
                        <div className="method-name">{method.name}</div>
                        <div className="method-fee">{method.fee}</div>
                        <div className="method-limit">Limit: ₵{method.min} - ₵{method.max.toLocaleString()}</div>
                        <div className="method-time">⏱️ {method.time}</div>
                      </div>
                    ))}
                  </div>
                  
                  <button className="btn-primary btn-block" onClick={() => setFundStep(2)}>
                    Continue <FaArrowRight />
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
                  <h3>Payment Instructions</h3>
                  
                  <div className="payment-details-card">
                    <div className="detail-row">
                      <span className="detail-label">Amount to Pay:</span>
                      <span className="detail-value amount">₵{manualRequest.amount?.toFixed(2)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Recipient Name:</span>
                      <span className="detail-value">{COMPANY.name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Phone Number:</span>
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
                    <h4>📋 How to pay:</h4>
                    <ol>
                      <li>Go to your mobile money wallet</li>
                      <li>Select "Send Money" or "Transfer"</li>
                      <li>Enter recipient: <strong>{COMPANY.phone}</strong></li>
                      <li>Enter amount: <strong>₵{manualRequest.amount?.toFixed(2)}</strong></li>
                      <li>Enter Reference: <strong>{manualRequest.reference}</strong></li>
                      <li>Complete the transaction</li>
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
                        {proofFile ? (
                          <><FaCheck /> {proofFile.name}</>
                        ) : (
                          <><FaUpload /> Click to upload screenshot</>
                        )}
                      </label>
                    </div>
                    
                    <div className="instruction-actions">
                      <button onClick={downloadInstructions} className="btn-outline">
                        <FaDownload /> Download Instructions
                      </button>
                      <button 
                        onClick={handleFileUpload} 
                        className="btn-primary"
                        disabled={uploadingProof || !proofFile}
                      >
                        {uploadingProof ? <FaSpinner className="spinning" /> : 'I Have Paid - Submit'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== VERIFY PAYMENT MODAL ========== */}
      <AnimatePresence>
        {showVerifyModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="modal-overlay" 
            onClick={closeVerifyModal}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }} 
              animate={{ scale: 1, y: 0 }} 
              className="modal-content verify-modal" 
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '550px' }}
            >
              <button className="modal-close" onClick={closeVerifyModal}>×</button>
              
              <div className="verify-payment">
                <h3><FaCheckCircle /> Verify Your Payment</h3>
                <p>Choose how you want to verify your payment</p>
                
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
                
                {verifyOption === 'auto' && (
                  <div className="verify-auto">
                    <p className="verify-desc">Enter your payment details to auto-credit your wallet instantly.</p>
                    
                    <div className="form-group">
                      <label>Reference ID *</label>
                      <input 
                        type="text"
                        value={verifyReference}
                        onChange={(e) => setVerifyReference(e.target.value.toUpperCase())}
                        placeholder="e.g., RS-123-20241201-ABCD"
                        className="form-control"
                      />
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
                      {verifying ? ' Verifying...' : ' Verify Payment & Credit Wallet'}
                    </button>
                  </div>
                )}
                
                {verifyOption === 'manual' && (
                  <div className="verify-manual">
                    <p className="verify-desc">
                      Select a pending payment request and upload your payment proof.
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
                          >
                            <option value="">-- Select a payment request --</option>
                            {pendingPayments.map((payment, idx) => (
                              <option key={idx} value={payment.reference}>
                                {payment.reference} - ₵{payment.amount} ({new Date(payment.created_at).toLocaleDateString()})
                              </option>
                            ))}
                          </select>
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

      {/* Order Details Modal */}
      <AnimatePresence>
        {showOrderModal && selectedOrder && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="modal-overlay" 
            onClick={() => setShowOrderModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }} 
              animate={{ scale: 1, y: 0 }} 
              className="modal-content order-details-modal" 
              onClick={e => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setShowOrderModal(false)}>×</button>
              
              <h3>Order Details</h3>
              <div className="order-details">
                <div className="detail-row"><span>Order ID:</span><strong>{selectedOrder.order_id}</strong></div>
                <div className="detail-row"><span>Size:</span><strong>{selectedOrder.size_gb}GB</strong></div>
                <div className="detail-row"><span>Network:</span><strong>{selectedOrder.network?.toUpperCase()}</strong></div>
                <div className="detail-row"><span>Recipient:</span><strong>{selectedOrder.customer_phone || selectedOrder.phone}</strong></div>
                <div className="detail-row"><span>Status:</span><strong className={`status-badge ${selectedOrder.delivery_status || selectedOrder.status}`}>{selectedOrder.delivery_status || selectedOrder.status}</strong></div>
                <div className="detail-row"><span>Amount Paid:</span><strong>₵{(selectedOrder.customer_paid || selectedOrder.amount)?.toFixed(2)}</strong></div>
                <div className="detail-row"><span>Balance Before:</span><strong>₵{(selectedOrder.balance_before || 0).toFixed(2)}</strong></div>
                <div className="detail-row"><span>Balance After:</span><strong>₵{(selectedOrder.balance_after || 0).toFixed(2)}</strong></div>
                <div className="detail-row"><span>Created:</span><strong>{new Date(selectedOrder.created_at).toLocaleString()}</strong></div>
                {selectedOrder.delivery_status_updated_at && (
                  <div className="detail-row"><span>Last Updated:</span><strong>{new Date(selectedOrder.delivery_status_updated_at).toLocaleString()}</strong></div>
                )}
              </div>
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
        onConfirm={confirmPurchase}
        details={{
          phoneNumber: pendingPurchase?.phone,
          network: pendingPurchase?.network,
          sizeGb: pendingPurchase?.sizeGb,
          quantity: 1,
          amount: pendingPurchase?.price
        }}
        loading={confirmLoading}
      />

      {/* Footer */}
      <div className="dashboard-footer">
        <p className="text-center text-muted">
          <small>Powered by {COMPANY.name} | Need help? Contact {COMPANY.email}</small>
        </p>
      </div>
    </motion.div>
  );
}