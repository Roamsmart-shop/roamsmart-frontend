// src/pages/AgentStoreDashboard.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaStore, FaShoppingCart, FaUsers, FaMoneyBillWave, FaChartLine, FaEye, FaDatabase, FaShareAlt, FaQrcode, FaCheckCircle, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import './AgentStoreDashboard.css';
// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  website: 'https://roamsmart.shop'
};

export default function AgentStoreDashboard() {
  const [store, setStore] = useState(null);
  const [stats, setStats] = useState({
    total_visitors: 0,
    total_orders: 0,
    total_revenue: 0,
    conversion_rate: 0,
    total_commission: 0,
    today_sales: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch store settings
      let storeData = null;
      try {
        const storeRes = await api.get('/agent/store');
        storeData = storeRes.data.data;
        setStore(storeData);
      } catch (err) {
        console.error('Store fetch error:', err);
        // Store might not exist yet, that's okay
      }
      
      // Fetch store stats (might 404 if not implemented)
      try {
        const statsRes = await api.get('/agent/store/stats');
        setStats(prev => ({ ...prev, ...statsRes.data.data }));
      } catch (err) {
        console.error('Stats fetch error:', err);
        // Use default stats if endpoint fails
        setStats({
          total_visitors: 0,
          total_orders: 0,
          total_revenue: 0,
          conversion_rate: 0,
          total_commission: 0,
          today_sales: 0
        });
      }
      
      // Fetch recent orders
      try {
        const ordersRes = await api.get('/agent/store/orders');
        setRecentOrders(ordersRes.data.data || []);
      } catch (err) {
        console.error('Orders fetch error:', err);
        setRecentOrders([]);
      }
      
    } catch (error) {
      console.error('Fetch store data error:', error);
      setError('Unable to load store data. Please try again later.');
      toast.error('Failed to load Roamsmart store data');
    } finally {
      setLoading(false);
    }
  };

  const copyStoreLink = () => {
    const link = `${COMPANY.website}/store/${store?.store_slug || 'mystore'}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success(`${COMPANY.shortName} store link copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareStoreWhatsApp = () => {
    const link = `${COMPANY.website}/store/${store?.store_slug || 'mystore'}`;
    const message = `🛍️ *Check out my Roamsmart Digital Service Store!* 🛍️\n\n${store?.store_name || 'My Roamsmart Store'}\n${store?.store_description || 'Buy data bundles, WAEC vouchers, and more!'}\n\nVisit: ${link}\n\nPowered by ${COMPANY.name}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading {COMPANY.shortName} store...</p>
    </div>
  );

  if (error) {
    return (
      <motion.div 
        className="error-state"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <FaExclamationTriangle size={64} color="#dc3545" />
        <h2>Unable to Load Store</h2>
        <p>{error}</p>
        <button className="btn-primary" onClick={fetchStoreData}>Try Again</button>
        <Link to="/store/setup" className="btn-outline">Set Up Your Store</Link>
      </motion.div>
    );
  }

  if (!store) {
    return (
      <motion.div 
        className="no-store-setup"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <FaStore size={64} />
        <h2>No Roamsmart Store Found</h2>
        <p>Set up your store on {COMPANY.name} to start selling online</p>
        <Link to="/store/setup" className="btn-primary">Set Up Your Roamsmart Store</Link>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="agent-store-dashboard" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      <div className="store-header">
        <div className="store-info">
          <h1><FaStore /> {store.store_name}</h1>
          <p>{store.store_description || 'Your Roamsmart online store'}</p>
          <div className="store-links">
            <button className="btn-outline btn-sm" onClick={copyStoreLink}>
              {copied ? <FaCheckCircle /> : <FaShareAlt />} {copied ? 'Copied!' : 'Copy Store Link'}
            </button>
            <button className="btn-outline btn-sm" onClick={shareStoreWhatsApp}>
              <FaShareAlt /> Share on WhatsApp
            </button>
            <Link to="/store/setup" className="btn-outline btn-sm">
              <FaEye /> Edit Store
            </Link>
            <button className="btn-outline btn-sm" onClick={fetchStoreData}>
              <FaSpinner className={loading ? 'spinning' : ''} /> Refresh
            </button>
          </div>
        </div>
        <div className="store-url">
          <div className="url-badge">
            <code>{COMPANY.website}/store/{store.store_slug}</code>
          </div>
        </div>
      </div>

      {/* Store Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><FaEye /></div>
          <div className="stat-value">{stats.total_visitors || 0}</div>
          <div className="stat-label">Store Visitors on Roamsmart</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaShoppingCart /></div>
          <div className="stat-value">{stats.total_orders || 0}</div>
          <div className="stat-label">Store Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaMoneyBillWave /></div>
          <div className="stat-value">₵{(stats.total_revenue || 0).toFixed(2)}</div>
          <div className="stat-label">Store Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaChartLine /></div>
          <div className="stat-value">{stats.conversion_rate || 0}%</div>
          <div className="stat-label">Conversion Rate</div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="stats-grid secondary">
        <div className="stat-card">
          <div className="stat-icon"><FaMoneyBillWave /></div>
          <div className="stat-value">₵{(stats.total_commission || 0).toFixed(2)}</div>
          <div className="stat-label">Total Commission Earned</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaChartLine /></div>
          <div className="stat-value">₵{(stats.today_sales || 0).toFixed(2)}</div>
          <div className="stat-label">Today's Sales</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions - Roamsmart Store</h3>
        <div className="actions-grid">
          <Link to="/store/products" className="action-card">
            <FaDatabase /> Manage Products
            <small>Update prices and markups</small>
          </Link>
          <Link to="/store/orders" className="action-card">
            <FaShoppingCart /> View Orders
            <small>Track customer orders</small>
          </Link>
          <Link to="/store/clients" className="action-card">
            <FaUsers /> View Customers
            <small>See your customer base</small>
          </Link>
          <Link to="/inventory" className="action-card">
            <FaChartLine /> Inventory
            <small>Manage data stock</small>
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="recent-orders">
        <h3>Recent Orders from Your Roamsmart Store</h3>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map(order => (
                  <tr key={order.id || order.order_id}>
                    <td className="order-id">#{order.order_id || order.id} on Roamsmart</td>
                    <td>{order.customer_name || order.customer_phone || order.phone_number || 'Customer'}</td>
                    <td>{order.network?.toUpperCase()} {order.size_gb}GB</td>
                    <td className="amount">₵{order.amount || order.selling_price}</td>
                    <td>
                      <span className={`status ${order.status === 'completed' ? 'completed' : 'pending'}`}>
                        {order.status === 'completed' ? 'Delivered' : order.status || 'Pending'}
                      </span>
                    </td>
                    <td className="date">{new Date(order.created_at || order.date).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">
                    No orders yet from your Roamsmart store. Start selling!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Store Tips */}
      <div className="store-tips">
        <h3>Tips to Grow Your Roamsmart Store</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <FaShareAlt />
            <h4>Share Your Store</h4>
            <p>Share your store link on WhatsApp, Facebook, and Telegram</p>
          </div>
          <div className="tip-card">
            <FaUsers />
            <h4>Build Customer Relationships</h4>
            <p>Follow up with customers and offer great service</p>
          </div>
          <div className="tip-card">
            <FaChartLine />
            <h4>Monitor Your Sales</h4>
            <p>Track which products sell best and adjust your markup</p>
          </div>
        </div>
      </div>

      <div className="store-footer-note">
        <p className="text-muted text-center">
          <small>Powered by {COMPANY.name} | Need help? Contact {COMPANY.email}</small>
        </p>
      </div>
    </motion.div>
  );
}