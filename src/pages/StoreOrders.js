// src/pages/StoreOrders.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEye, FaCheckCircle, FaTimesCircle, FaSpinner, FaWhatsapp, FaEnvelope, FaSearch, FaFilter, FaPrint } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  phone: '0557388622'
};

export default function StoreOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/agent/store/orders');
      setOrders(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load orders from Roamsmart');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    const statusMessages = {
      processing: 'mark this order as processing',
      completed: 'mark this order as completed',
      cancelled: 'cancel this order'
    };

    const result = await Swal.fire({
      title: `Confirm Status Update`,
      text: `Are you sure you want to ${statusMessages[status]}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: status === 'cancelled' ? '#dc3545' : '#28a745',
      confirmButtonText: `Yes, ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    setUpdating(true);
    try {
      await api.put(`/agent/store/orders/${orderId}/status`, { status });
      toast.success(`Order marked as ${status} on ${COMPANY.shortName}`);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const notifyCustomer = async (order) => {
    const message = `🛒 *Order Update from ${COMPANY.name}* 🛒\n\nOrder #: ${order.order_id}\nStatus: ${order.status.toUpperCase()}\nProduct: ${order.network?.toUpperCase()} ${order.size_gb}GB\nAmount: ₵${order.amount}\n\nThank you for shopping with ${COMPANY.name}!`;

    try {
      await api.post('/agent/order/notify-customer', {
        order_id: order.id,
        phone: order.customer_phone,
        message: message
      });
      toast.success(`SMS sent to ${order.customer_phone}`);
    } catch (error) {
      toast.error('Failed to send notification');
    }
  };

  const sendWhatsAppUpdate = (order) => {
    const message = `🛒 *Order Update from ${COMPANY.name}* 🛒\n\nOrder #: ${order.order_id}\nStatus: ${order.status.toUpperCase()}\nProduct: ${order.network?.toUpperCase()} ${order.size_gb}GB\nAmount: ₵${order.amount}\n\nThank you for your patronage!`;
    window.open(`https://wa.me/${order.customer_phone.replace(/^0/, '233')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'badge-warning', icon: <FaSpinner className="spinning" />, text: 'Pending' },
      processing: { class: 'badge-info', icon: <FaSpinner className="spinning" />, text: 'Processing' },
      completed: { class: 'badge-success', icon: <FaCheckCircle />, text: 'Completed' },
      cancelled: { class: 'badge-danger', icon: <FaTimesCircle />, text: 'Cancelled' }
    };
    const b = badges[status] || badges.pending;
    return <span className={`status-badge ${b.class}`}>{b.icon} {b.text}</span>;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone?.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    revenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.amount || 0), 0)
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading {COMPANY.shortName} store orders...</p>
    </div>
  );

  return (
    <motion.div 
      className="store-orders-page" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <div>
          <h1>Store Orders on Roamsmart</h1>
          <p>Manage orders from your online store</p>
        </div>
        <button className="btn-outline" onClick={fetchOrders}>
          <FaSpinner className={loading ? 'spinning' : ''} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="order-stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Orders</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card info">
          <div className="stat-value">{stats.processing}</div>
          <div className="stat-label">Processing</div>
        </div>
        <div className="stat-card success">
          <div className="stat-value">{stats.completed}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">₵{stats.revenue.toFixed(2)}</div>
          <div className="stat-label">Revenue</div>
        </div>
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
        <div className="filter-box">
          <FaFilter />
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="orders-table-container">
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
                  <td>{getStatusBadge(order.status)}</td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
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
                    {order.status === 'pending' && (
                      <>
                        <button 
                          className="btn-info btn-sm" 
                          onClick={() => updateOrderStatus(order.id, 'processing')}
                          disabled={updating}
                          title="Process Order"
                        >
                          <FaSpinner className={updating ? 'spinning' : ''} /> Process
                        </button>
                        <button 
                          className="btn-danger btn-sm" 
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          disabled={updating}
                          title="Cancel Order"
                        >
                          <FaTimesCircle /> Cancel
                        </button>
                      </>
                    )}
                    {order.status === 'processing' && (
                      <button 
                        className="btn-success btn-sm" 
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        disabled={updating}
                        title="Complete Order"
                      >
                        <FaCheckCircle /> Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center">
                    {searchTerm ? 'No orders match your search' : 'No orders yet from your Roamsmart store'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
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
              
              <h3>Order Details - {COMPANY.name}</h3>
              
              <div className="order-details-grid">
                <div className="detail-item">
                  <label>Order ID:</label>
                  <span>#{selectedOrder.order_id}</span>
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
                  <label>Product:</label>
                  <span>{selectedOrder.network?.toUpperCase()} {selectedOrder.size_gb}GB</span>
                </div>
                <div className="detail-item">
                  <label>Amount:</label>
                  <span className="amount">₵{selectedOrder.amount}</span>
                </div>
                <div className="detail-item">
                  <label>Status:</label>
                  <span>{getStatusBadge(selectedOrder.status)}</span>
                </div>
                <div className="detail-item">
                  <label>Order Date:</label>
                  <span>{new Date(selectedOrder.created_at).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <label>Payment Method:</label>
                  <span>{selectedOrder.payment_method || 'Wallet'}</span>
                </div>
              </div>

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
                {selectedOrder.status === 'pending' && (
                  <button 
                    className="btn-primary" 
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'processing');
                      setShowDetailsModal(false);
                    }}
                  >
                    Process Order
                  </button>
                )}
                <button 
                  className="btn-secondary" 
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}