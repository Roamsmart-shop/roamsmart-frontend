// src/pages/AgentCart.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTrash, FaShoppingCart, FaPlus, FaMinus, FaWhatsapp, FaCopy, FaCheck } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  phone: '0557388622'
};

export default function AgentCart() {
  const [cart, setCart] = useState([]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const savedCart = localStorage.getItem('roamsmart_agent_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const saveCart = (newCart) => {
    localStorage.setItem('roamsmart_agent_cart', JSON.stringify(newCart));
    setCart(newCart);
  };

  const removeItem = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    saveCart(newCart);
    toast.success('Item removed from Roamsmart cart');
  };

  const updateQuantity = (index, quantity) => {
    if (quantity < 1) {
      removeItem(index);
      return;
    }
    const newCart = [...cart];
    newCart[index].quantity = quantity;
    saveCart(newCart);
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
  };

  const getWholesaleTotal = () => {
    return cart.reduce((sum, item) => sum + (item.wholesale_price * item.quantity), 0);
  };

  const getProfit = () => {
    return getTotal() - getWholesaleTotal();
  };

  const validateCustomerPhone = (phone) => {
    const phoneRegex = /^(024|025|026|027|028|020|054|055|059|050|057|053|056)[0-9]{7}$/;
    return phoneRegex.test(phone);
  };

  const checkout = async () => {
    if (!customerPhone) {
      toast.error('Enter customer phone number');
      return;
    }
    
    if (!validateCustomerPhone(customerPhone)) {
      toast.error('Please enter a valid Ghana phone number (e.g., 024XXXXXXX)');
      return;
    }
    
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setCheckoutLoading(true);
    try {
      const orders = cart.map(item => ({
        network: item.network,
        size_gb: item.size,
        phone: customerPhone,
        customer_name: customerName || null,
        quantity: item.quantity,
        selling_price: item.selling_price,
        wholesale_price: item.wholesale_price
      }));

      const res = await api.post('/agent/bulk-order', { orders });
      if (res.data.success) {
        toast.success(`Successfully sold ${res.data.total_orders} bundles on ${COMPANY.shortName}!`);
        toast.success(`Your profit: ₵${res.data.total_profit?.toFixed(2) || getProfit().toFixed(2)}`);
        
        // Clear cart
        localStorage.removeItem('roamsmart_agent_cart');
        setCart([]);
        setCustomerPhone('');
        setCustomerName('');
        
        // Optional: Send WhatsApp message to customer
        if (res.data.order_ids) {
          const message = `Dear customer, your data bundle order has been processed successfully by ${COMPANY.name}. Thank you for your patronage!`;
          // You can optionally send WhatsApp here
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Checkout failed. Please try again.';
      toast.error(errorMsg);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const shareCartViaWhatsApp = () => {
    const itemsList = cart.map(item => 
      `• ${item.network.toUpperCase()} ${item.size}GB x${item.quantity} = ₵${(item.selling_price * item.quantity).toFixed(2)}`
    ).join('\n');
    
    const message = `🛒 *My Roamsmart Cart Summary* 🛒\n\n${itemsList}\n\n📦 *Total:* ₵${getTotal().toFixed(2)}\n💰 *Customer Pays:* ₵${getTotal().toFixed(2)}\n\n✅ Fast & Reliable Data Services from ${COMPANY.name}\n📞 Contact me to order!`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const copyCartSummary = () => {
    const itemsList = cart.map(item => 
      `${item.network.toUpperCase()} ${item.size}GB x${item.quantity} = ₵${(item.selling_price * item.quantity).toFixed(2)}`
    ).join('\n');
    
    const summary = `Roamsmart Cart Summary:\n${itemsList}\nTotal: ₵${getTotal().toFixed(2)}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success('Cart summary copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (cart.length === 0) {
    return (
      <motion.div 
        className="empty-cart-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <FaShoppingCart size={64} />
        <h2>Your Roamsmart Cart is Empty</h2>
        <p>Add products from the Sell Data page to start selling</p>
        <button className="btn-primary" onClick={() => window.location.href = '/agent#sell'}>
          Browse Products on Roamsmart
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="agent-cart-page" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <h1><FaShoppingCart /> Roamsmart Shopping Cart ({cart.length} items)</h1>
        <p>Review your items before checkout - Sell data bundles through {COMPANY.name}</p>
        <div className="header-actions">
          <button className="btn-outline btn-sm" onClick={shareCartViaWhatsApp}>
            <FaWhatsapp /> Share via WhatsApp
          </button>
          <button className="btn-outline btn-sm" onClick={copyCartSummary}>
            {copied ? <FaCheck /> : <FaCopy />} {copied ? 'Copied!' : 'Copy Summary'}
          </button>
        </div>
      </div>

      <div className="cart-grid">
        <div className="cart-items">
          {cart.map((item, index) => (
            <div key={index} className="cart-item">
              <div className="item-details">
                <h3>{item.network.toUpperCase()} {item.size}GB Data Bundle</h3>
                <p className="wholesale-price">Wholesale: ₵{item.wholesale_price.toFixed(2)}</p>
                <p className="selling-price">Selling: ₵{item.selling_price.toFixed(2)}</p>
                <p className="profit-per-unit">Profit per unit: ₵{(item.selling_price - item.wholesale_price).toFixed(2)}</p>
              </div>
              <div className="item-actions">
                <div className="quantity-control">
                  <button onClick={() => updateQuantity(index, item.quantity - 1)}><FaMinus /></button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(index, item.quantity + 1)}><FaPlus /></button>
                </div>
                <div className="item-total">₵{(item.selling_price * item.quantity).toFixed(2)}</div>
                <button className="remove-btn" onClick={() => removeItem(index)}><FaTrash /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h3>Order Summary - Roamsmart</h3>
          <div className="summary-row">
            <span>Subtotal (Wholesale):</span>
            <span>₵{getWholesaleTotal().toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Your Profit:</span>
            <span className="profit">₵{getProfit().toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total (Customer Pays):</span>
            <span>₵{getTotal().toFixed(2)}</span>
          </div>

          <div className="customer-info">
            <h4>Customer Details</h4>
            <div className="form-group">
              <label>Customer Phone Number *</label>
              <input 
                type="tel" 
                placeholder="024XXXXXXX" 
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="form-control"
              />
              <small>Enter a valid Ghana mobile number (MTN, Telecel, or AirtelTigo)</small>
            </div>
            <div className="form-group">
              <label>Customer Name (Optional)</label>
              <input 
                type="text" 
                placeholder="Customer full name" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="form-control"
              />
            </div>
          </div>

          <button 
            className="btn-primary btn-block" 
            onClick={checkout} 
            disabled={checkoutLoading}
          >
            {checkoutLoading ? 'Processing with Roamsmart...' : `Checkout - ₵${getTotal().toFixed(2)}`}
          </button>
          
          <div className="cart-footer-note">
            <small>✅ Instant delivery after payment confirmation on Roamsmart</small>
            <small>🔒 Secure transactions protected by {COMPANY.name}</small>
          </div>
        </div>
      </div>
    </motion.div>
  );
}