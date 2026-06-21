// src/pages/AgentOrders.js - AUTO-REFRESH REMOVED

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, FaFilter, FaEye, FaCheckCircle, FaSpinner, 
  FaMobileAlt, FaClock, FaDownload, FaSync, FaBell,
  FaWhatsapp, FaEnvelope, FaPrint, FaExclamationTriangle,
  FaCheck, FaTimes, FaHourglassHalf
} from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import OrderProgressTracker from '../components/OrderProgressTracker';
import io from 'socket.io-client';
import '../styles/pages/AgentOrders.css';
// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  phone: '0557388622'
};

export default function AgentOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [liveStats, setLiveStats] = useState({});
  const [syncingOrders, setSyncingOrders] = useState({});
  const [adminRole] = useState('agent');
  const socketRef = useRef(null);

  // In AgentOrders.js
const [darkMode, setDarkMode] = useState(false);

// Toggle function
const toggleDarkMode = () => {
  setDarkMode(!darkMode);
  document.documentElement.classList.toggle('dark');
};

// In the render
<div className={`agent-orders-page ${darkMode ? 'dark' : 'light'}`}>
  {/* ... */}
</div>

  // Connect to WebSocket for real-time updates
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
      console.log('Agent socket connected to:', socketUrl);
      socketRef.current.emit('agent_join', { role: adminRole });
    });
    
    socketRef.current.on('connect_error', (error) => {
      console.warn('Agent socket connection error (non-critical):', error.message);
    });
    
    socketRef.current.on('live_stats', (data) => {
      if (data) setLiveStats(data);
    });
    
    socketRef.current.on('new_order', (order) => {
      if (order) {
        showOrderNotification(order);
        fetchOrdersWithRealTimeStatus();
      }
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [adminRole]);

  // Fetch orders with real-time status from Digimall
  const fetchOrdersWithRealTimeStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/agent/orders');
      let ordersData = res.data.data || [];
      
      // Fetch real-time status from Digimall for pending/processing orders
      const ordersToCheck = ordersData.filter(
        o => o.delivery_status === 'processing' || o.delivery_status === 'pending' || o.status === 'processing'
      );
      
      if (ordersToCheck.length > 0) {
        const identifiers = ordersToCheck.map(o => o.provider_order_id || o.order_id);
        
        try {
          const statusResponse = await api.post('/digimall/bulk-status', { identifiers });
          
          if (statusResponse.data.success) {
            const statusMap = {};
            statusResponse.data.results.forEach(r => {
              statusMap[r.identifier] = r.status;
            });
            
            // Update orders with live status
            ordersData = ordersData.map(order => {
              const identifier = order.provider_order_id || order.order_id;
              const liveStatus = statusMap[identifier];
              if (liveStatus && liveStatus !== (order.delivery_status || order.status)) {
                return { 
                  ...order, 
                  delivery_status: liveStatus,
                  status: liveStatus === 'delivered' ? 'completed' : liveStatus
                };
              }
              return order;
            });
          }
        } catch (bulkError) {
          console.warn('Bulk status check failed:', bulkError);
        }
      }
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders from Roamsmart');
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync single order status with Digimall
  const syncOrderStatus = async (order) => {
    setSyncingOrders(prev => ({ ...prev, [order.order_id]: true }));
    
    try {
      const identifier = order.provider_order_id || order.order_id;
      const response = await api.get(`/digimall/order-status/${identifier}`);
      
      if (response.data.success && response.data.status) {
        const newStatus = response.data.status;
        const displayStatus = newStatus === 'delivered' ? 'completed' : newStatus;
        
        if (newStatus !== (order.delivery_status || order.status)) {
          // Update local order
          setOrders(prev => prev.map(o => 
            o.order_id === order.order_id 
              ? { ...o, delivery_status: newStatus, status: displayStatus }
              : o
          ));
          toast.success(`Order #${order.order_id} status updated to: ${newStatus}`);
          
          // If delivered, send notification
          if (newStatus === 'delivered') {
            await api.post('/agent/order/notify-customer', {
              order_id: order.order_id,
              phone: order.customer_phone,
              message: `✅ Your data bundle (${order.network} ${order.size_gb}GB) has been delivered! Thank you for choosing ${COMPANY.name}.`
            });
          }
        } else {
          toast.info(`Order #${order.order_id} status is: ${newStatus}`);
        }
      } else {
        toast.error('Failed to fetch order status from Digimall');
      }
    } catch (error) {
      console.error('Sync order error:', error);
      toast.error('Failed to sync order status');
    } finally {
      setSyncingOrders(prev => ({ ...prev, [order.order_id]: false }));
    }
  };

  // Bulk sync all pending orders
  const bulkSyncOrders = async () => {
    const pendingOrders = orders.filter(
      o => o.delivery_status === 'processing' || o.status === 'processing' || o.status === 'pending'
    );
    
    if (pendingOrders.length === 0) {
      toast.info('No pending orders to sync');
      return;
    }
    
    toast.loading(`Syncing ${pendingOrders.length} orders...`);
    
    try {
      const identifiers = pendingOrders.map(o => o.provider_order_id || o.order_id);
      const response = await api.post('/digimall/bulk-status', { identifiers });
      
      if (response.data.success) {
        const statusMap = {};
        response.data.results.forEach(r => {
          statusMap[r.identifier] = r.status;
        });
        
        let updatedCount = 0;
        setOrders(prev => prev.map(order => {
          const identifier = order.provider_order_id || order.order_id;
          const liveStatus = statusMap[identifier];
          if (liveStatus && liveStatus !== (order.delivery_status || order.status)) {
            updatedCount++;
            return { 
              ...order, 
              delivery_status: liveStatus,
              status: liveStatus === 'delivered' ? 'completed' : liveStatus
            };
          }
          return order;
        }));
        
        toast.dismiss();
        toast.success(`Synced ${updatedCount} orders successfully`);
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to bulk sync orders');
    }
  };

  const fetchOrders = useCallback(async () => {
    await fetchOrdersWithRealTimeStatus();
  }, [fetchOrdersWithRealTimeStatus]);

  const showOrderNotification = (order) => {
    setLiveUpdates(prev => [{
      order_id: order.order_id,
      status: order.status,
      timestamp: new Date()
    }, ...prev].slice(0, 10));
    
    toast.success(`🛒 New order #${order.order_id} from ${order.customer_phone} on Roamsmart`, {
      duration: 5000
    });
  };

  useEffect(() => {
    fetchOrdersWithRealTimeStatus();
    // Auto-refresh every 30 seconds - REMOVED
    return () => {};
  }, [fetchOrdersWithRealTimeStatus]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await api.put(`/agent/orders/${orderId}/status`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Order #${orderId} updated to ${newStatus} on Roamsmart`);
        fetchOrdersWithRealTimeStatus();
        
        if (newStatus === 'completed') {
          const order = orders.find(o => o.order_id === orderId);
          if (order) {
            await api.post('/agent/order/notify-customer', {
              order_id: orderId,
              phone: order.customer_phone,
              message: `✅ Your data bundle (${order.network} ${order.size_gb}GB) has been delivered! Thank you for choosing ${COMPANY.name}.`
            });
            toast.success(`SMS notification sent to ${order.customer_phone}`);
          }
        }
        
        return { success: true };
      }
    } catch (error) {
      toast.error('Failed to update order status on Roamsmart');
      return { success: false };
    }
  };

  const notifyCustomer = async (order) => {
    try {
      await api.post('/agent/order/notify-customer', {
        order_id: order.order_id,
        phone: order.customer_phone,
        message: `📱 Your order #${order.order_id} on ${COMPANY.name} is now ${order.status}. Track your delivery status in your dashboard. Contact support at ${COMPANY.email} if you have questions.`
      });
      toast.success(`SMS sent to ${order.customer_phone} via Roamsmart`);
    } catch (error) {
      toast.error('Failed to send notification');
    }
  };

  const sendWhatsAppUpdate = (order) => {
    const message = `🛒 *Order Update from ${COMPANY.name}* 🛒\n\nOrder #: ${order.order_id}\nStatus: ${order.status?.toUpperCase() || 'PROCESSING'}\nProduct: ${order.network?.toUpperCase()} ${order.size_gb}GB\n\nThank you for choosing ${COMPANY.name}!`;
    window.open(`https://wa.me/${order.customer_phone?.replace(/^0/, '233')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getStatusBadge = (status, deliveryStatus) => {
    const actualStatus = deliveryStatus || status;
    const badges = {
      pending: 'badge-warning',
      queued: 'badge-info',
      processing: 'badge-info',
      sending: 'badge-primary',
      delivered: 'badge-success',
      completed: 'badge-success',
      failed: 'badge-danger',
      cancelled: 'badge-secondary'
    };
    return `status-badge ${badges[actualStatus] || 'badge-secondary'}`;
  };

  const getStatusIcon = (status, deliveryStatus) => {
    const actualStatus = deliveryStatus || status;
    switch(actualStatus) {
      case 'pending': return <FaHourglassHalf />;
      case 'queued': return <FaClock />;
      case 'processing': return <FaSpinner className="spinning" />;
      case 'sending': return <FaMobileAlt />;
      case 'delivered': return <FaCheckCircle />;
      case 'completed': return <FaCheckCircle />;
      case 'failed': return <FaExclamationTriangle />;
      case 'cancelled': return <FaTimes />;
      default: return <FaClock />;
    }
  };

  const getStatusDisplayText = (status, deliveryStatus) => {
    const actualStatus = deliveryStatus || status;
    const statusMap = {
      pending: 'Pending',
      queued: 'Queued',
      processing: 'Processing',
      sending: 'Sending',
      delivered: 'Delivered',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled'
    };
    return statusMap[actualStatus] || actualStatus || 'Pending';
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus || order.delivery_status === filterStatus;
    const matchesSearch = order.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.customer_phone?.includes(searchTerm) ||
                          order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending' || o.delivery_status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing' || o.delivery_status === 'processing').length,
    sending: orders.filter(o => o.status === 'sending').length,
    completed: orders.filter(o => o.status === 'completed' || o.delivery_status === 'delivered').length,
    failed: orders.filter(o => o.status === 'failed' || o.delivery_status === 'failed').length,
    today: orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading Roamsmart orders...</p>
    </div>
  );

  return (
    <motion.div className="agent-orders-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header">
        <div>
          <h1>📦 Order Management on {COMPANY.shortName}</h1>
          <p>Track and manage all customer orders in real-time with Digimall status</p>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={bulkSyncOrders}>
            <FaSync /> Sync All Pending
          </button>
          <button className="btn-outline" onClick={fetchOrdersWithRealTimeStatus}>
            <FaSync /> Refresh Orders
          </button>
        </div>
      </div>

      {/* Live Updates Panel */}
      {liveUpdates.length > 0 && (
        <div className="live-updates-panel">
          <div className="live-updates-header">
            <FaBell className="pulse-ring" />
            <span>Live Updates from Roamsmart</span>
          </div>
          <div className="live-updates-list">
            {liveUpdates.map((update, i) => (
              <div key={i} className="live-update-item">
                <span className={`dot ${update.status}`}></span>
                <span>Order #{update.order_id} - {update.status} on Roamsmart</span>
                <small>{new Date(update.timestamp).toLocaleTimeString()}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Orders on Roamsmart</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card info">
          <div className="stat-value">{stats.processing + stats.sending}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card success">
          <div className="stat-value">{stats.completed}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.today}</div>
          <div className="stat-label">Today's Orders</div>
        </div>
        {stats.failed > 0 && (
          <div className="stat-card danger">
            <div className="stat-value">{stats.failed}</div>
            <div className="stat-label">Failed</div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <FaSearch />
          <input 
            type="text" 
            placeholder="Search by Order ID, Customer Name or Phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="sending">Sending</option>
          <option value="delivered">Delivered</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="orders-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Amount</th>
              <th>Delivery Status</th>
              <th>Progress</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => {
              const displayStatus = order.delivery_status || order.status;
              return (
                <tr key={order.id || order.order_id}>
                  <td className="order-id">#{order.order_id || order.id} on Roamsmart</td>
                  <td>
                    <div className="customer-info">
                      <strong>{order.customer_name || 'Customer'}</strong>
                      <small>{order.customer_phone || order.phone}</small>
                    </div>
                  </td>
                  <td>{order.network?.toUpperCase()} {order.size_gb}GB</td>
                  <td className="amount">₵{order.amount}</td>
                  <td>
                    <span className={getStatusBadge(order.status, order.delivery_status)}>
                      {getStatusIcon(order.status, order.delivery_status)} {getStatusDisplayText(order.status, order.delivery_status)}
                    </span>
                  </td>
                  <td>
                    <div className="progress-indicator">
                      <div className="progress-bar-small">
                        <div 
                          className="progress-fill-small"
                          style={{ 
                            width: displayStatus === 'pending' ? '25%' : 
                                   displayStatus === 'queued' ? '35%' :
                                   displayStatus === 'processing' ? '50%' : 
                                   displayStatus === 'sending' ? '75%' : 
                                   displayStatus === 'delivered' ? '100%' : 
                                   displayStatus === 'completed' ? '100%' : '0%'
                          }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {displayStatus === 'pending' ? 'Order Received' :
                         displayStatus === 'queued' ? 'Queued for Processing' :
                         displayStatus === 'processing' ? 'Processing on Roamsmart' :
                         displayStatus === 'sending' ? 'Sending Data' :
                         displayStatus === 'delivered' ? 'Delivered Successfully' :
                         displayStatus === 'completed' ? 'Completed' : 
                         displayStatus === 'failed' ? 'Failed - Contact Support' : 'Pending'}
                      </span>
                    </div>
                  </td>
                  <td>{new Date(order.created_at).toLocaleString()}</td>
                  <td className="actions">
                    <button 
                      className="btn-info btn-sm" 
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowDetailsModal(true);
                      }}
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    <button 
                      className="btn-primary btn-sm" 
                      onClick={() => syncOrderStatus(order)}
                      disabled={syncingOrders[order.order_id]}
                      title="Sync with Digimall"
                    >
                      {syncingOrders[order.order_id] ? <FaSpinner className="spinning" /> : <FaSync />}
                    </button>
                    <button 
                      className="btn-success btn-sm" 
                      onClick={() => notifyCustomer(order)}
                      title="SMS Customer"
                    >
                      <FaEnvelope />
                    </button>
                    <button 
                      className="btn-primary btn-sm" 
                      onClick={() => sendWhatsAppUpdate(order)}
                      title="WhatsApp Customer"
                    >
                      <FaWhatsapp />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center">
                  {searchTerm ? 'No orders match your search on Roamsmart' : 'No orders yet. Start selling on Roamsmart!'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal with Progress Tracker */}
      <AnimatePresence>
        {showDetailsModal && selectedOrder && (
          <motion.div 
            className="modal-overlay" 
            onClick={() => setShowDetailsModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content order-details-modal" 
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
            >
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
              
              <OrderProgressTracker 
                order={selectedOrder}
                onStatusUpdate={updateOrderStatus}
                onComplete={() => {
                  fetchOrdersWithRealTimeStatus();
                  setShowDetailsModal(false);
                }}
              />

              {/* Order Details */}
              <div className="order-details-section">
                <h4>Order Details - {COMPANY.name}</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Order ID:</label>
                    <span>{selectedOrder.order_id}</span>
                  </div>
                  <div className="detail-item">
                    <label>Customer Name:</label>
                    <span>{selectedOrder.customer_name || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phone Number:</label>
                    <span>{selectedOrder.customer_phone || selectedOrder.phone}</span>
                  </div>
                  <div className="detail-item">
                    <label>Network:</label>
                    <span>{selectedOrder.network?.toUpperCase()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Data Size:</label>
                    <span>{selectedOrder.size_gb}GB</span>
                  </div>
                  <div className="detail-item">
                    <label>Amount Paid:</label>
                    <span className="amount">₵{selectedOrder.amount}</span>
                  </div>
                  <div className="detail-item">
                    <label>Order Date:</label>
                    <span>{new Date(selectedOrder.created_at).toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Payment Method:</label>
                    <span>{selectedOrder.payment_method || 'Wallet'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Delivery Status:</label>
                    <span className={getStatusBadge(selectedOrder.status, selectedOrder.delivery_status)}>
                      {getStatusDisplayText(selectedOrder.status, selectedOrder.delivery_status)}
                    </span>
                  </div>
                  {selectedOrder.provider_order_id && (
                    <div className="detail-item">
                      <label>Provider Order ID:</label>
                      <span><code>{selectedOrder.provider_order_id}</code></span>
                    </div>
                  )}
                  <div className="detail-item">
                    <label>Platform:</label>
                    <span>{COMPANY.name}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="modal-actions">
                <button 
                  className="btn-outline" 
                  onClick={() => syncOrderStatus(selectedOrder)}
                  disabled={syncingOrders[selectedOrder.order_id]}
                >
                  <FaSync /> {syncingOrders[selectedOrder.order_id] ? 'Syncing...' : 'Sync Status'}
                </button>
                <button 
                  className="btn-outline" 
                  onClick={() => sendWhatsAppUpdate(selectedOrder)}
                >
                  <FaWhatsapp /> WhatsApp Customer
                </button>
                <button 
                  className="btn-outline" 
                  onClick={() => notifyCustomer(selectedOrder)}
                >
                  <FaEnvelope /> SMS Customer
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </button>
              </div>
              
              <div className="modal-footer-note">
                <small>Powered by {COMPANY.name} | Support: {COMPANY.email}</small>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}