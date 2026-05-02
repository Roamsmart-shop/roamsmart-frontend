// src/pages/AgentOrders.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, FaFilter, FaEye, FaCheckCircle, FaSpinner, 
  FaMobileAlt, FaClock, FaDownload, FaSync, FaBell,
  FaWhatsapp, FaEnvelope, FaPrint, FaExclamationTriangle
} from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import OrderProgressTracker from '../components/OrderProgressTracker';
import io from 'socket.io-client';

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
  const socketRef = useRef(null);

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    const wsUrl = process.env.REACT_APP_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
    socketRef.current = io(wsUrl, {
      path: '/socket.io',
      transports: ['websocket']
    });
    
    socketRef.current.on('order_update', (data) => {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (data.agent_id === currentUser?.id) {
        toast.success(`Order #${data.order_id} status: ${data.status} on Roamsmart`);
        fetchOrders();
        setLiveUpdates(prev => [data, ...prev].slice(0, 10));
      }
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/agent/orders');
      setOrders(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load orders from Roamsmart');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await api.put(`/agent/orders/${orderId}/status`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Order #${orderId} updated to ${newStatus} on Roamsmart`);
        fetchOrders();
        
        if (newStatus === 'completed') {
          const order = orders.find(o => o.id === orderId);
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
        order_id: order.id,
        phone: order.customer_phone,
        message: `📱 Your order #${order.order_id} on ${COMPANY.name} is now ${order.status}. Track your delivery status in your dashboard. Contact support at ${COMPANY.email} if you have questions.`
      });
      toast.success(`SMS sent to ${order.customer_phone} via Roamsmart`);
    } catch (error) {
      toast.error('Failed to send notification');
    }
  };

  const sendWhatsAppUpdate = (order) => {
    const message = `🛒 *Order Update from ${COMPANY.name}* 🛒\n\nOrder #: ${order.order_id}\nStatus: ${order.status.toUpperCase()}\nProduct: ${order.network?.toUpperCase()} ${order.size_gb}GB\n\nThank you for choosing ${COMPANY.name}!`;
    window.open(`https://wa.me/${order.customer_phone.replace(/^0/, '233')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      processing: 'badge-info',
      sending: 'badge-primary',
      completed: 'badge-success',
      failed: 'badge-danger'
    };
    return `status-badge ${badges[status] || 'badge-secondary'}`;
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <FaClock />;
      case 'processing': return <FaSpinner className="spinning" />;
      case 'sending': return <FaMobileAlt />;
      case 'completed': return <FaCheckCircle />;
      case 'failed': return <FaExclamationTriangle />;
      default: return <FaClock />;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = order.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.customer_phone?.includes(searchTerm) ||
                          order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    sending: orders.filter(o => o.status === 'sending').length,
    completed: orders.filter(o => o.status === 'completed').length,
    failed: orders.filter(o => o.status === 'failed').length,
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
          <p>Track and manage all customer orders in real-time</p>
        </div>
        <button className="btn-outline" onClick={fetchOrders}>
          <FaSync /> Refresh Orders
        </button>
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
              <th>Status</th>
              <th>Progress</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id}>
                <td className="order-id">#{order.order_id} on Roamsmart</td>
                <td>
                  <div className="customer-info">
                    <strong>{order.customer_name || 'Customer'}</strong>
                    <small>{order.customer_phone}</small>
                  </div>
                </td>
                <td>{order.network?.toUpperCase()} {order.size_gb}GB</td>
                <td className="amount">₵{order.amount}</td>
                <td>
                  <span className={getStatusBadge(order.status)}>
                    {getStatusIcon(order.status)} {order.status}
                  </span>
                </td>
                <td>
                  <div className="progress-indicator">
                    <div className="progress-bar-small">
                      <div 
                        className="progress-fill-small"
                        style={{ 
                          width: order.status === 'pending' ? '25%' : 
                                 order.status === 'processing' ? '50%' : 
                                 order.status === 'sending' ? '75%' : 
                                 order.status === 'completed' ? '100%' : '0%'
                        }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {order.status === 'pending' ? 'Order Received' :
                       order.status === 'processing' ? 'Processing on Roamsmart' :
                       order.status === 'sending' ? 'Sending Data' :
                       order.status === 'completed' ? 'Delivered' : 
                       order.status === 'failed' ? 'Failed - Contact Support' : 'Pending'}
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
                  {order.status !== 'completed' && order.status !== 'failed' && (
                    <button 
                      className="btn-warning btn-sm" 
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowDetailsModal(true);
                      }}
                      title="Update Progress"
                    >
                      <FaSync />
                    </button>
                  )}
                </td>
              </tr>
            ))}
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
                  fetchOrders();
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
                    <span>{selectedOrder.customer_phone}</span>
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
                    <label>Platform:</label>
                    <span>{COMPANY.name}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="modal-actions">
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