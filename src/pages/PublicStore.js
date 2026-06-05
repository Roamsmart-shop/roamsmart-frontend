// src/pages/PublicStore.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaWhatsapp, FaPhone, FaEnvelope, FaShoppingCart, 
  FaDatabase, FaMobileAlt, FaCheckCircle, FaClock,
  FaStore, FaUser, FaStar, FaHeart, FaCreditCard,
  FaUniversity, FaMobile, FaSpinner, FaCopy, FaCheck, FaShieldAlt
} from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import '../styles/pages/public-store.css';

export default function PublicStore() {
  const { slug } = useParams();
  const [store, setStore] = useState(null);
  const [bundles, setBundles] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentReference, setPaymentReference] = useState(null);

  useEffect(() => {
    fetchStoreData();
  }, [slug]);

  const fetchStoreData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/store/${slug}`);
      if (res.data.success) {
        setStore(res.data.data);
        setBundles(res.data.data.bundles || {});
      }
    } catch (error) {
      console.error('Failed to fetch store:', error);
      toast.error('Store not found');
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (network, size) => {
    if (store?.custom_prices?.[network]?.[size]) {
      return store.custom_prices[network][size];
    }
    const wholesalePrice = bundles[network]?.[size];
    if (wholesalePrice && store?.markup) {
      return wholesalePrice * (1 + store.markup / 100);
    }
    return null;
  };

  const generatePaymentReference = () => {
    return `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  };

  // Add this useEffect in your PublicStore component (after the store fetch useEffect)
useEffect(() => {
  // Check if returning from Paystack payment
  const urlParams = new URLSearchParams(window.location.search);
  const reference = urlParams.get('reference');
  const trxref = urlParams.get('trxref'); // Paystack also uses this parameter
  
  const paymentRef = reference || trxref;
  
  if (paymentRef) {
    // Clean up URL (remove query params)
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Verify the payment
    const checkPayment = async () => {
      try {
        const response = await api.post('/store/verify-payment', {
          reference: paymentRef
        });
        
        if (response.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Payment Successful!',
            html: `
              <div style="text-align: left;">
                <p>✅ Your payment has been confirmed!</p>
                <p>📱 Data will be delivered to your phone shortly.</p>
                <p>🆔 Order ID: ${response.data.order_id || 'Processing'}</p>
              </div>
            `,
            confirmButtonColor: '#8B0000'
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Verification Failed',
            text: response.data.error || 'Could not verify payment. Please contact support.',
            confirmButtonColor: '#8B0000'
          });
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Verification Error',
          text: 'An error occurred while verifying your payment. Please contact support.',
          confirmButtonColor: '#8B0000'
        });
      }
    };
    
    checkPayment();
  }
}, []);

  const handleBuyNow = (network, size, price) => {
    setSelectedBundle({ network, size, price });
    setPaymentMethod('mobile_money');
    setPaymentReference(null);
    setShowOrderModal(true);
  };

  const copyReference = () => {
    if (paymentReference) {
      navigator.clipboard.writeText(paymentReference);
      setCopied(true);
      toast.success('Reference copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

const submitOrder = async () => {
  if (!phoneNumber || !phoneNumber.match(/^(024|025|026|027|028|020|054|055|059|050|057|053|056)[0-9]{7}$/)) {
    toast.error('Please enter a valid Ghana phone number');
    return;
  }

  if (!selectedBundle) return;

  setSubmitting(true);
  
  try {
    // Get customer email
    const { value: email } = await Swal.fire({
      title: 'Enter Your Email',
      input: 'email',
      inputPlaceholder: 'you@example.com',
      showCancelButton: true,
      confirmButtonText: 'Proceed to Payment',
      preConfirm: (emailValue) => {
        if (!emailValue) {
          Swal.showValidationMessage('Email is required');
        }
        return emailValue;
      }
    });
    
    if (!email) {
      setSubmitting(false);
      return;
    }
    
    // Step 1: Initialize payment (NO order created yet)
    const response = await api.post('/store/initiate-payment', {
      store_slug: slug,
      network: selectedBundle.network,
      size_gb: selectedBundle.size,
      phone: phoneNumber,
      amount: selectedBundle.price,
      email: email
    });

    if (response.data.success) {
      // Step 2: Redirect to Paystack for payment
      window.location.href = response.data.data.authorization_url;
    }
  } catch (error) {
    console.error('Payment initiation error:', error);
    toast.error(error.response?.data?.error || 'Failed to initiate payment');
    setSubmitting(false);
  }
};

  const verifyPayment = async (reference, expectedAmount) => {
    try {
      const response = await api.post('/store/verify-payment', {
        reference: reference,
        expected_amount: expectedAmount
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        toast.error(response.data.error || 'Payment not found');
        return { success: false };
      }
    } catch (error) {
      console.error('Verification error:', error);
      return { success: false };
    }
  };

  if (loading) {
    return (
      <div className="public-store-loading">
        <div className="spinner"></div>
        <p>Loading {slug}'s store...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="public-store-not-found">
        <h1>Store Not Found</h1>
        <p>The store you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary">Go to Roamsmart</Link>
      </div>
    );
  }

  const currentBundles = bundles[selectedNetwork] || {};

  return (
    <div className="public-store">
      {/* Store Header */}
      <div className="store-header" style={{ background: `linear-gradient(135deg, ${store.banner_color || '#8B0000'}, ${store.banner_color || '#D2691E'})` }}>
        <div className="store-header-content">
          <div className="store-avatar">
            <FaStore size={50} />
          </div>
          <h1>{store.store_name}</h1>
          <p>{store.store_description || `Welcome to ${store.store_name} on Roamsmart`}</p>
          <div className="store-contact">
            {store.contact_phone && (
              <a href={`tel:${store.contact_phone}`} className="contact-link">
                <FaPhone /> {store.contact_phone}
              </a>
            )}
            {store.contact_email && (
              <a href={`mailto:${store.contact_email}`} className="contact-link">
                <FaEnvelope /> {store.contact_email}
              </a>
            )}
            <a href={`https://wa.me/233${store.contact_phone?.replace(/^0/, '')}`} className="contact-link whatsapp" target="_blank" rel="noopener noreferrer">
              <FaWhatsapp /> WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Network Tabs */}
      <div className="store-network-tabs">
        {['mtn', 'telecel', 'airteltigo'].map(net => (
          <button 
            key={net}
            className={`network-tab ${selectedNetwork === net ? 'active' : ''}`}
            onClick={() => setSelectedNetwork(net)}
          >
            {net.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Bundles Grid */}
      <div className="store-bundles">
        <h2>Data Bundles</h2>
        <div className="bundles-grid">
          {Object.entries(currentBundles).map(([size, wholesalePrice]) => {
            const price = getPrice(selectedNetwork, parseFloat(size));
            if (!price) return null;
            
            return (
              <motion.div 
                key={size}
                className="bundle-card"
                whileHover={{ y: -5 }}
              >
                <div className="bundle-size">{size}GB</div>
                <div className="bundle-price">₵{price.toFixed(2)}</div>
                <div className="bundle-features">
                  <span><FaCheckCircle /> Instant Delivery</span>
                  <span><FaMobileAlt /> Works on {selectedNetwork.toUpperCase()}</span>
                  <span><FaClock /> 24/7 Support</span>
                </div>
                <button 
                  className="btn-buy"
                  onClick={() => handleBuyNow(selectedNetwork, parseFloat(size), price)}
                >
                  Buy Now
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* About Section */}
      <div className="store-about">
        <h3>About {store.store_name}</h3>
        <p>{store.store_description || `We provide reliable data bundles on Roamsmart. Fast delivery, best prices, and great customer service.`}</p>
        <div className="store-features">
          <div className="feature"><FaCheckCircle /> Instant Data Delivery</div>
          <div className="feature"><FaMobileAlt /> All Networks Supported</div>
          <div className="feature"><FaClock /> 24/7 Customer Support</div>
        </div>
      </div>

      {/* Order Modal - Simplified */}
{showOrderModal && selectedBundle && (
  <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
    <div className="modal-content order-modal" onClick={e => e.stopPropagation()}>
      <button className="modal-close" onClick={() => setShowOrderModal(false)}>×</button>
      <h3>Complete Your Purchase</h3>
      
      <div className="order-summary">
        <p><strong>Bundle:</strong> {selectedBundle.size}GB {selectedBundle.network.toUpperCase()}</p>
        <p><strong>Price:</strong> ₵{selectedBundle.price.toFixed(2)}</p>
      </div>
      
      <div className="form-group">
        <label>Your Phone Number (for data delivery)</label>
        <input 
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="024XXXXXXX"
          className="form-control"
        />
        <small>Data will be delivered to this number</small>
      </div>
      
      <div className="payment-methods">
        <div className="payment-method paystack active">
          <FaCreditCard /> Pay with Card or Mobile Money
          <small>Powered by Paystack - Secure payment</small>
        </div>
      </div>
      
      <button 
        className="btn-primary btn-block" 
        onClick={submitOrder}
        disabled={submitting}
      >
        {submitting ? <FaSpinner className="spinning" /> : 'Pay Now with Paystack'}
      </button>
      
      <div className="secure-note">
        <FaShieldAlt /> Your payment is secure and encrypted
      </div>
    </div>
  </div>
)}
    </div>
  );
}