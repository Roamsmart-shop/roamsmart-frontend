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
  const [customPrices, setCustomPrices] = useState({});
  const [markup, setMarkup] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStoreData();
  }, [slug]);

  const fetchStoreData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/store/${slug}`);
      if (res.data.success) {
        const storeData = res.data.data;
        console.log('Store data received (already filtered by backend):', storeData);
        
        setStore(storeData);
        setCustomPrices(storeData.custom_prices || {});
        setBundles(storeData.bundles || {});
        setMarkup(storeData.markup || 0);
      }
    } catch (error) {
      console.error('Failed to fetch store:', error);
      toast.error('Store not found');
    } finally {
      setLoading(false);
    }
  };

  // Get the final selling price (custom price if set, otherwise wholesale + markup)
  const getPrice = (network, size) => {
    // First check if agent has custom price for this specific size
    if (customPrices[network]?.[size]) {
      return customPrices[network][size];
    }
    
    // Otherwise use wholesale price + markup
    const wholesalePrice = bundles[network]?.[size];
    if (wholesalePrice && markup > 0) {
      return wholesalePrice * (1 + markup / 100);
    }
    
    // Fallback to wholesale price if no markup
    if (wholesalePrice) {
      return wholesalePrice;
    }
    
    return null;
  };

  // Get all available bundles for a network (already filtered by backend)
  const getAvailableBundles = (network) => {
    const allBundles = {};
    
    // Add custom prices first (these are the agent's specific prices)
    if (customPrices[network]) {
      Object.assign(allBundles, customPrices[network]);
    }
    
    // Add wholesale bundles (only if not already in custom prices)
    if (bundles[network]) {
      for (const [size, price] of Object.entries(bundles[network])) {
        if (!allBundles[size]) {
          allBundles[size] = price;
        }
      }
    }
    
    // Sort by size (numeric)
    const sortedBundles = {};
    Object.keys(allBundles)
      .sort((a, b) => parseFloat(a) - parseFloat(b))
      .forEach(size => {
        sortedBundles[size] = allBundles[size];
      });
    
    return sortedBundles;
  };

  useEffect(() => {
    // Check if returning from Paystack payment
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    const trxref = urlParams.get('trxref');
    
    const paymentRef = reference || trxref;
    
    if (paymentRef) {
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
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
    setShowOrderModal(true);
  };

  const submitOrder = async () => {
    if (!phoneNumber || !phoneNumber.match(/^(024|025|026|027|028|020|054|055|059|050|057|053|056)[0-9]{7}$/)) {
      toast.error('Please enter a valid Ghana phone number');
      return;
    }

    if (!selectedBundle) return;

    setSubmitting(true);
    
    try {
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
      
      const response = await api.post('/store/initiate-payment', {
        store_slug: slug,
        network: selectedBundle.network,
        size_gb: selectedBundle.size,
        phone: phoneNumber,
        amount: selectedBundle.price,
        email: email
      });

      if (response.data.success) {
        window.location.href = response.data.data.authorization_url;
      } else {
        toast.error(response.data.error || 'Failed to initiate payment');
        setSubmitting(false);
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error(error.response?.data?.error || 'Failed to initiate payment');
      setSubmitting(false);
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

      {/* Network Tabs - Only show networks with available bundles */}
      <div className="store-network-tabs">
        {['mtn', 'telecel', 'airteltigo'].map(net => {
          const availableBundles = getAvailableBundles(net);
          const hasBundles = Object.keys(availableBundles).length > 0;
          if (!hasBundles) return null;
          
          return (
            <button 
              key={net}
              className={`network-tab ${selectedNetwork === net ? 'active' : ''}`}
              onClick={() => setSelectedNetwork(net)}
            >
              {net.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Bundles Grid */}
      <div className="store-bundles">
        <h2>Data Bundles from {store.store_name}</h2>
        <div className="bundles-grid">
          {Object.entries(getAvailableBundles(selectedNetwork)).map(([size, wholesalePrice]) => {
            const finalPrice = getPrice(selectedNetwork, parseFloat(size));
            if (!finalPrice) return null;
            
            // Check if this is a custom price
            const isCustomPrice = customPrices[selectedNetwork]?.[size];
            
            return (
              <motion.div 
                key={size}
                className="bundle-card"
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bundle-size">{size}GB</div>
                <div className="bundle-price">₵{finalPrice.toFixed(2)}</div>
                {isCustomPrice && (
                  <div className="custom-badge">Special Price</div>
                )}
                <div className="bundle-features">
                  <span><FaCheckCircle /> Instant Delivery</span>
                  <span><FaMobileAlt /> Works on {selectedNetwork.toUpperCase()}</span>
                  <span><FaClock /> 24/7 Support</span>
                </div>
                <button 
                  className="btn-buy"
                  onClick={() => handleBuyNow(selectedNetwork, parseFloat(size), finalPrice)}
                >
                  Buy Now
                </button>
              </motion.div>
            );
          })}
        </div>
        
        {Object.keys(getAvailableBundles(selectedNetwork)).length === 0 && (
          <div className="no-products">
            <p>No data bundles available for {selectedNetwork.toUpperCase()} at this time.</p>
            <p>Please check other networks or contact the store owner.</p>
          </div>
        )}
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

      {/* Order Modal */}
      {showOrderModal && selectedBundle && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal-content order-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowOrderModal(false)}>×</button>
            <h3>Complete Your Purchase</h3>
            
            <div className="order-summary">
              <p><strong>Store:</strong> {store.store_name}</p>
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