// src/pages/UserDashboard.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaWallet, FaShoppingCart, FaChartLine, FaUsers, FaGift, 
  FaMobileAlt, FaClock, FaCheckCircle, FaDatabase, FaHistory, 
  FaCopy, FaCheck, FaUniversity, FaCreditCard, FaSpinner,
  FaDownload, FaUpload, FaEye, FaTimes, FaUserPlus, FaGraduationCap,
  FaBolt, FaTint, FaTv, FaGlobe, FaWhatsapp, FaHeadset, FaShieldAlt,
  FaSearch
} from 'react-icons/fa';
import api, { paymentAPI } from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import WAECVoucher from '../components/WAECVoucher';
import BillPayment from '../components/BillPayment';
import PurchaseConfirmationModal from '../components/PurchaseConfirmationModal';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  phone: '0557388622',
  website: 'https://roamsmart.shop'
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
  
  // Dynamic size states
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [showCustomSize, setShowCustomSize] = useState(false);
  const [customSizeInput, setCustomSizeInput] = useState('');
  
  // Manual Payment States
  const [showFundModal, setShowFundModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [fundStep, setFundStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState('manual');
  const [fundAmount, setFundAmount] = useState('');
  const [manualRequest, setManualRequest] = useState(null);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Verification States
  const [verifyReference, setVerifyReference] = useState('');
  const [verifyTransactionId, setVerifyTransactionId] = useState('');
  const [verifySenderName, setVerifySenderName] = useState('');
  const [verifySenderPhone, setVerifySenderPhone] = useState('');
  const [verifying, setVerifying] = useState(false);
  
  // Purchase Confirmation States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [purchasingBundle, setPurchasingBundle] = useState(null);
  
  // Payment Methods Configuration
  const paymentMethods = [
    { 
      id: 'manual', 
      name: 'Manual Top-up', 
      fee: 'No fees', 
      min: 10, 
      max: 100000, 
      icon: <FaUniversity />,
      description: 'Admin approval required',
      time: '5-30 minutes',
      color: '#8B0000'
    },
    { 
      id: 'paystack', 
      name: 'Paystack', 
      fee: '2.5% + ₵0.50', 
      min: 1, 
      max: 100000, 
      icon: <FaCreditCard />,
      description: 'Instant top-up',
      time: 'Instant',
      color: '#00B3E6',
      comingSoon: true
    },
    { 
      id: 'momo', 
      name: 'MTN MoMo', 
      fee: '1%', 
      min: 10, 
      max: 10000, 
      icon: <FaMobileAlt />,
      description: 'Instant payment',
      time: 'Instant',
      color: '#FFC107',
      comingSoon: true
    }
  ];

  const quickAmounts = [10, 20, 50, 100, 200, 500];

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    // Fetch available sizes when network changes
    if (bundles[selectedNetwork]) {
      const sizes = Object.keys(bundles[selectedNetwork]).map(Number).sort((a, b) => a - b);
      setAvailableSizes(sizes);
    }
  }, [selectedNetwork, bundles]);

  // ========== BACKEND API CALLS ==========
  const refreshPrices = async () => {
    try {
      const pricesRes = await api.get('/prices');
      setBundles(pricesRes.data.data);
    } catch (error) {
      console.error('Failed to refresh prices:', error);
    }
  };

  // Fetch available sizes for selected network
  const fetchAvailableSizes = async (network) => {
    try {
      const res = await api.get('/prices');
      const prices = res.data.data[network];
      const sizes = Object.keys(prices).map(Number).sort((a, b) => a - b);
      setAvailableSizes(sizes);
      return sizes;
    } catch (error) {
      console.error('Failed to fetch sizes:', error);
      return [];
    }
  };

  // Handle network change
  const handleNetworkChange = async (network) => {
    setSelectedNetwork(network);
    setSelectedSize('');
    setSelectedPrice(null);
    setCustomSizeInput('');
    setShowCustomSize(false);
    await fetchAvailableSizes(network);
  };

  // Handle size selection from chips
  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    setShowCustomSize(false);
    setCustomSizeInput('');
    const price = bundles[selectedNetwork]?.[size];
    setSelectedPrice(price);
  };

  // Handle custom size input (checks if price exists)
  const handleCustomSize = async (e) => {
    const size = parseInt(e.target.value);
    setSelectedSize(e.target.value);
    
    if (size && !isNaN(size) && size > 0) {
      setLoadingPrice(true);
      try {
        // Check if price exists for this size from the bundles state
        const price = bundles[selectedNetwork]?.[size];
        if (price) {
          setSelectedPrice(price);
          setShowCustomSize(false);
        } else {
          setSelectedPrice(null);
          setShowCustomSize(true);
        }
      } catch (error) {
        setSelectedPrice(null);
        setShowCustomSize(true);
      } finally {
        setLoadingPrice(false);
      }
    } else {
      setSelectedPrice(null);
      setSelectedSize('');
      setShowCustomSize(false);
    }
  };

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch user stats, prices, and orders from backend
      const [statsRes, pricesRes, ordersRes] = await Promise.all([
        api.get('/user/stats'),
        api.get('/prices'),
        api.get('/user/orders')
      ]);
      
      setStats(statsRes.data.data);
      setBundles(pricesRes.data.data);
      setOrders(ordersRes.data.data || []);
      
      // Set initial available sizes
      const initialNetwork = 'mtn';
      const initialSizes = Object.keys(pricesRes.data.data[initialNetwork] || {}).map(Number).sort((a, b) => a - b);
      setAvailableSizes(initialSizes);
      
    } catch (error) {
      console.error('Fetch user data error:', error);
      toast.error('Failed to load Roamsmart data');
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^(024|025|026|027|028|020|054|055|059|050|057|053|056)[0-9]{7}$/;
    return phoneRegex.test(phone);
  };

  const purchaseData = async (network, sizeGb, price, phone = null) => {
    const bundleKey = `${network}-${sizeGb}`;
    setPurchasingBundle(bundleKey);
    
    try {
      let userPhone = phone || phoneNumber;
      if (!userPhone) {
        const { value } = await Swal.fire({
          title: 'Enter Phone Number',
          input: 'tel',
          inputPlaceholder: '024XXXXXXX',
          showCancelButton: true,
          confirmButtonColor: '#8B0000',
          confirmButtonText: 'Continue on Roamsmart'
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
      
      // Check if wallet has sufficient balance from backend
      if (stats.wallet_balance < price) {
        const result = await Swal.fire({
          icon: 'warning',
          title: 'Insufficient Balance!',
          html: `
            <p>You need ₵${price.toFixed(2)} to complete this purchase.</p>
            <p>Your current balance: ₵${stats.wallet_balance?.toFixed(2) || '0.00'}</p>
            <p>Please fund your Roamsmart wallet to continue.</p>
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
      
      // Store purchase details for confirmation
      setPendingPurchase({
        network,
        sizeGb,
        price,
        phone: userPhone
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
      // Make actual backend API call
      const res = await api.post('/order', { 
        network: pendingPurchase.network, 
        size_gb: pendingPurchase.sizeGb, 
        phone: pendingPurchase.phone, 
        payment_method: 'wallet' 
      });
      
      if (res.data.success) {
        // Refresh user data from backend
        await fetchUserData();
        
        await Swal.fire({
          icon: 'success',
          title: 'Purchase Successful on Roamsmart!',
          html: `<p>✅ ${pendingPurchase.sizeGb}GB ${pendingPurchase.network.toUpperCase()} sent to ${pendingPurchase.phone}</p>
                 <p class="text-success">New Balance: ₵${res.data.data?.balance || stats.wallet_balance - pendingPurchase.price}</p>
                 <p class="text-muted">Delivery in 2 seconds</p>`,
          confirmButtonColor: '#8B0000'
        });
        setPendingPurchase(null);
        setSelectedSize('');
        setSelectedPrice(null);
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

  const copyReferralCode = () => {
    if (stats.referral_code) {
      navigator.clipboard.writeText(stats.referral_code);
      setCopied(true);
      toast.success(`${COMPANY.shortName} referral code copied!`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBecomeAgent = () => {
    navigate('/become-agent');
  };

  // ========== MANUAL PAYMENT HANDLERS ==========
  
  const handleMethodSelect = (methodId) => {
    if (paymentMethods.find(m => m.id === methodId)?.comingSoon) {
      Swal.fire({
        icon: 'info',
        title: 'Coming Soon on Roamsmart!',
        text: 'This payment method will be available soon.',
        confirmButtonColor: '#8B0000'
      });
      return;
    }
    setSelectedMethod(methodId);
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

    if (selectedMethod === 'manual') {
      setLoadingRequest(true);
      try {
        const res = await paymentAPI.createManualRequest(amountNum, stats.phone || phoneNumber);
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
      toast.info('Paystack coming soon to Roamsmart!');
    } else if (selectedMethod === 'momo') {
      toast.info('MTN MoMo coming soon to Roamsmart!');
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

  const handleFileUpload = async () => {
    if (!proofFile) {
      toast.error('Please select a payment screenshot');
      return;
    }

    setUploadingProof(true);
    try {
      await paymentAPI.uploadProof(manualRequest.id, proofFile);
      toast.success('Payment proof uploaded to Roamsmart! Admin will verify shortly.');
      setShowFundModal(false);
      resetFundModal();
      await fetchUserData();
      
      Swal.fire({
        icon: 'success',
        title: 'Proof Uploaded to Roamsmart!',
        html: 'Your payment proof has been submitted. <br/> Admin will verify and credit your wallet within 5-30 minutes.',
        confirmButtonColor: '#8B0000'
      });
    } catch (error) {
      console.error('Upload proof error:', error);
      toast.error(error.response?.data?.error || 'Upload failed');
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
Recipient: VENTURES/ADUSEI SAMUEL BROBBEY
Phone: 0530499548

INSTRUCTIONS:
1. Go to your mobile money wallet
2. Send exactly ₵${manualRequest.amount} to 0530499548
3. Use "${manualRequest.reference}" as the reference
4. Take a screenshot of the transaction
5. Upload the screenshot using the upload button

Your Roamsmart wallet will be credited after admin verification.
    `;
    
    const blob = new Blob([instructions], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roamsmart_payment_instructions_${manualRequest.reference}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Instructions downloaded');
  };

  const handleVerifyPayment = async () => {
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
        toast.success(`Payment verified on ${COMPANY.shortName}! Wallet credited.`);
        setShowVerifyModal(false);
        resetVerifyModal();
        await fetchUserData();
        
        Swal.fire({
          icon: 'success',
          title: 'Wallet Credited!',
          html: `₵${res.data.data.amount} has been added to your Roamsmart wallet.`,
          confirmButtonColor: '#8B0000'
        });
      }
    } catch (error) {
      console.error('Verify payment error:', error);
      toast.error(error.response?.data?.error || 'Verification failed. Contact Roamsmart support.');
    } finally {
      setVerifying(false);
    }
  };

  const resetFundModal = () => {
    setFundStep(1);
    setFundAmount('');
    setSelectedMethod('manual');
    setManualRequest(null);
    setProofFile(null);
    setCopied(false);
  };

  const resetVerifyModal = () => {
    setVerifyReference('');
    setVerifyTransactionId('');
    setVerifySenderName('');
    setVerifySenderPhone('');
  };

  const cancelManualRequest = async () => {
    if (manualRequest) {
      try {
        await paymentAPI.cancelRequest(manualRequest.id);
        toast.success('Request cancelled');
        setShowFundModal(false);
        resetFundModal();
      } catch (error) {
        console.error('Cancel request error:', error);
        toast.error('Failed to cancel');
      }
    } else {
      setShowFundModal(false);
      resetFundModal();
    }
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading {COMPANY.shortName} dashboard...</p>
    </div>
  );

  const currentBundles = bundles[selectedNetwork] || {};
  const recentOrders = orders.slice(0, 5);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="banner-content">
          <h1>Welcome back to {COMPANY.shortName}, {stats.username || 'Customer'}! 👋</h1>
          <p>Get instant data bundles, WAEC vouchers, and more with 2-second delivery.</p>
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
          {!stats.is_agent && (
            <button className="btn-outline" onClick={handleBecomeAgent}>
              <FaUserPlus /> Become Roamsmart Agent
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <motion.div whileHover={{ y: -5 }} className="stat-card">
          <div className="stat-icon"><FaWallet /></div>
          <div className="stat-value">₵{stats.wallet_balance?.toFixed(2) || '0.00'}</div>
          <div className="stat-label">Roamsmart Wallet</div>
        </motion.div>
        <motion.div whileHover={{ y: -5 }} className="stat-card">
          <div className="stat-icon"><FaShoppingCart /></div>
          <div className="stat-value">{stats.total_orders || 0}</div>
          <div className="stat-label">Total Orders</div>
        </motion.div>
        <motion.div whileHover={{ y: -5 }} className="stat-card">
          <div className="stat-icon"><FaChartLine /></div>
          <div className="stat-value">₵{stats.total_spent?.toFixed(2) || '0'}</div>
          <div className="stat-label">Total Spent on Roamsmart</div>
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
        <h3><FaCheckCircle /> Roamsmart Quick Tips</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-icon">📱</div>
            <div className="tip-content">
              <h4>Instant Delivery</h4>
              <p>Data is delivered within 2 seconds after purchase on Roamsmart</p>
            </div>
          </div>
          <div className="tip-card">
            <div className="tip-icon">💰</div>
            <div className="tip-content">
              <h4>Refer & Earn</h4>
              <p>Share your referral code and earn GHS 5 per referral on Roamsmart</p>
            </div>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🛡️</div>
            <div className="tip-content">
              <h4>Secure Payments</h4>
              <p>All Roamsmart transactions are encrypted and secure</p>
            </div>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🎓</div>
            <div className="tip-content">
              <h4>WAEC Vouchers</h4>
              <p>Purchase result checker vouchers instantly on Roamsmart</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Bundles Section */}
      <div className="section-header">
        <h2><FaDatabase /> Data Bundles on Roamsmart</h2>
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
          
          {selectedPrice && !loadingPrice && (
            <div className="price-display">
              <p>Price: <strong>₵{selectedPrice.toFixed(2)}</strong></p>
              <button 
                className="btn-primary"
                onClick={() => purchaseData(selectedNetwork, parseInt(selectedSize), selectedPrice, phoneNumber)}
                disabled={!selectedSize}
              >
                Buy Now - ₵{selectedPrice.toFixed(2)}
              </button>
            </div>
          )}
          
          {selectedSize && !selectedPrice && !loadingPrice && (
            <div className="price-not-found">
              <p>⚠️ No price configured for {selectedSize}GB on {selectedNetwork.toUpperCase()}</p>
              <p className="text-muted">Please contact admin to add this size or select from available sizes below</p>
            </div>
          )}
          
          <div className="available-sizes">
            <h4>Available Sizes (Admin Configured)</h4>
            <div className="size-chips">
              {availableSizes.map(size => (
                <button
                  key={size}
                  className={`size-chip ${selectedSize == size ? 'active' : ''}`}
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
      <div className="bundles-grid">
        <h3 className="bundles-subtitle">Popular Bundles</h3>
        <div className="bundles-grid-container">
          {Object.entries(currentBundles).slice(0, 5).map(([size, price]) => {
            const isPurchasing = purchasingBundle === `${selectedNetwork}-${size}`;
            
            return (
              <motion.div 
                key={size} 
                whileHover={{ y: -5, scale: 1.02 }} 
                className="bundle-card" 
              >
                <div className="bundle-size">{size}GB</div>
                <div className="bundle-price">₵{price}</div>
                <div className="bundle-network">{selectedNetwork.toUpperCase()}</div>
                <div className="bundle-delivery">⚡ Instant Delivery on Roamsmart</div>
                <button 
                  className="btn-primary"
                  onClick={() => purchaseData(selectedNetwork, parseInt(size), price)}
                  disabled={isPurchasing}
                >
                  {isPurchasing ? <FaSpinner className="spinning" /> : 'Buy Now'}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Additional Services Section */}
      <div className="additional-services-section">
        <div className="section-header">
          <h2><FaGraduationCap /> Additional Services on Roamsmart</h2>
          <p>WAEC Vouchers & Bill Payments</p>
        </div>
        
        <div className="services-grid">
          <div className="service-card waec-card">
            <div className="service-header">
              <FaGraduationCap className="service-icon" />
              <h3>WAEC Result Checker</h3>
              <span className="service-badge">Powered by Roamsmart</span>
            </div>
            <WAECVoucher />
          </div>

          <div className="service-card bills-card">
            <div className="service-header">
              <FaBolt className="service-icon" />
              <h3>Pay Bills on Roamsmart</h3>
              <span className="service-badge">Electricity, Water, TV</span>
            </div>
            <BillPayment />
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="section-header">
        <h2><FaHistory /> Recent Orders on Roamsmart</h2>
      </div>
      <div className="orders-table">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.order_id}>
                  <td className="order-id">#{order.order_id} on Roamsmart</td>
                  <td>{order.network} {order.size_gb}GB</td>
                  <td className="amount">₵{order.amount}</td>
                  <td><span className={`status ${order.status}`}>{order.status}</span></td>
                  <td className="date">{new Date(order.date).toLocaleDateString()}</td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center">No orders yet. Start shopping on Roamsmart!</td>
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
            <h4>Need Help with Roamsmart?</h4>
            <p>Contact our support team for assistance with your orders or wallet</p>
          </div>
          <a href={`https://wa.me/233${COMPANY.phone}`} target="_blank" rel="noopener noreferrer" className="btn-outline">
            <FaWhatsapp /> WhatsApp Support
          </a>
        </div>
      </div>

      {/* ========== FUND WALLET MODAL ========== */}
      <AnimatePresence>
        {showFundModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="modal-overlay" 
            onClick={cancelManualRequest}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }} 
              animate={{ scale: 1, y: 0 }} 
              className="modal-content fund-wallet-modal" 
              onClick={e => e.stopPropagation()}
            >
              <button className="modal-close" onClick={cancelManualRequest}>×</button>
              
              {/* Step 1: Select Payment Method */}
              {fundStep === 1 && (
                <div className="fund-step">
                  <h3>Fund Your Roamsmart Wallet</h3>
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
                    Continue on Roamsmart
                  </button>
                </div>
              )}
              
              {/* Step 2: Enter Amount */}
              {fundStep === 2 && (
                <div className="fund-step">
                  <button className="back-btn" onClick={() => setFundStep(1)}>← Back</button>
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
                  
                  {selectedMethod === 'manual' && (
                    <div className="form-group">
                      <label>Phone Number (Optional)</label>
                      <input 
                        type="tel" 
                        className="form-control" 
                        placeholder="024XXXXXXX" 
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                      />
                      <small>For payment confirmation SMS from Roamsmart</small>
                    </div>
                  )}
                  
                  <div className="quick-amounts">
                    {quickAmounts.map(qAmount => (
                      <button key={qAmount} className="quick-amount" onClick={() => setFundAmount(qAmount.toString())}>
                        ₵{qAmount}
                      </button>
                    ))}
                  </div>
                  
                  <button className="btn-primary btn-block" onClick={handleAmountSubmit} disabled={loadingRequest}>
                    {loadingRequest ? <FaSpinner className="spinning" /> : 'Proceed to Payment'}
                  </button>
                </div>
              )}
              
              {/* Step 3: Manual Payment Instructions */}
              {fundStep === 3 && manualRequest && (
                <div className="fund-step instructions-step">
                  <button className="back-btn" onClick={() => setFundStep(2)}>← Back</button>
                  <h3>Roamsmart Payment Instructions</h3>
                  
                  <div className="payment-details-card">
                    <div className="detail-row">
                      <span className="detail-label">Amount to Pay:</span>
                      <span className="detail-value amount">₵{manualRequest.amount?.toFixed(2)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Recipient Name:</span>
                      <span className="detail-value">VENTURES/ADUSEI SAMUEL BROBBEY</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Phone Number:</span>
                      <span className="detail-value">0530499548</span>
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
                    <h4>📋 How to pay on Roamsmart:</h4>
                    <ol>
                      <li>Go to your mobile money wallet</li>
                      <li>Select "Send Money" or "Transfer"</li>
                      <li>Enter recipient: <strong>0530499548</strong></li>
                      <li>Enter amount: <strong>₵{manualRequest.amount?.toFixed(2)}</strong></li>
                      <li>Enter Reference: <strong>{manualRequest.reference}</strong></li>
                      <li>Complete the transaction</li>
                      <li>Take a screenshot of the confirmation</li>
                      <li>Upload the screenshot below</li>
                    </ol>
                  </div>
                  
                  <div className="upload-section">
                    <h4>Upload Payment Proof to Roamsmart</h4>
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
                        {uploadingProof ? <FaSpinner className="spinning" /> : 'I Have Paid - Submit to Roamsmart'}
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
            onClick={() => setShowVerifyModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }} 
              animate={{ scale: 1, y: 0 }} 
              className="modal-content verify-modal" 
              onClick={e => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setShowVerifyModal(false)}>×</button>
              
              <div className="verify-payment">
                <h3>Verify Your Roamsmart Payment</h3>
                <p>Already made a manual payment? Verify it here to credit your wallet.</p>
                
                <div className="form-group">
                  <label>Reference ID *</label>
                  <input 
                    type="text"
                    value={verifyReference}
                    onChange={(e) => setVerifyReference(e.target.value.toUpperCase())}
                    placeholder="e.g., 33MC"
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
                
                <button onClick={handleVerifyPayment} className="btn-primary btn-block" disabled={verifying}>
                  {verifying ? <FaSpinner className="spinning" /> : <FaCheckCircle />}
                  {verifying ? ' Verifying on Roamsmart...' : ' Verify Payment'}
                </button>
                
                <div className="verify-note">
                  <p>⚠️ <strong>Note:</strong> Please ensure you have actually sent the payment before verifying. False verifications may lead to account suspension.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
    </motion.div>
  );
}