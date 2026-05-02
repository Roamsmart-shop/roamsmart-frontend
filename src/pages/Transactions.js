// src/pages/Transactions.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaFilter, FaDownload, FaEye, FaSpinner, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart'
};

// Helper function to safely format dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    let date;
    if (typeof dateString === 'string') {
      // Handle different date formats
      const normalized = dateString.replace(' ', 'T');
      date = new Date(normalized);
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      // Try parsing as timestamp
      const timestamp = Date.parse(dateString);
      if (!isNaN(timestamp)) {
        date = new Date(timestamp);
      } else {
        // Return the string as-is if it's a simple date format
        if (dateString.includes('-')) {
          const parts = dateString.split(' ');
          return parts[0] || 'Invalid Date';
        }
        return 'Invalid Date';
      }
    }
    
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    let date;
    if (typeof dateString === 'string') {
      const normalized = dateString.replace(' ', 'T');
      date = new Date(normalized);
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [currentPage]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/user/orders?page=${currentPage}&limit=20`);
      setTransactions(res.data.data || []);
      setTotalPages(res.data.total_pages || 1);
    } catch (error) {
      console.error('Fetch transactions error:', error);
      toast.error('Failed to load transactions from Roamsmart');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: { class: 'badge-success', icon: <FaCheckCircle />, text: 'Completed' },
      pending: { class: 'badge-warning', icon: <FaSpinner className="spinning" />, text: 'Pending' },
      failed: { class: 'badge-danger', icon: <FaTimesCircle />, text: 'Failed' },
      processing: { class: 'badge-info', icon: <FaSpinner className="spinning" />, text: 'Processing' }
    };
    const b = badges[status] || badges.pending;
    return <span className={`status-badge ${b.class}`}>{b.icon} {b.text}</span>;
  };

  const exportToExcel = () => {
    setExporting(true);
    try {
      const exportData = transactions.map(order => ({
        'Order ID': order.order_id,
        'Phone Number': order.phone,
        'Network': order.network?.toUpperCase(),
        'Size (GB)': order.size_gb,
        'Amount (GHS)': order.amount,
        'Status': order.status,
        'Date': formatDateTime(order.created_at)
      }));
      
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Roamsmart_Transactions`);
      XLSX.writeFile(wb, `roamsmart_transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(`${transactions.length} transactions exported from Roamsmart`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export transactions');
    } finally {
      setExporting(false);
    }
  };

  const filteredTransactions = transactions.filter(t => 
    t.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.phone?.includes(searchTerm) ||
    t.network?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: transactions.length,
    completed: transactions.filter(t => t.status === 'completed').length,
    pending: transactions.filter(t => t.status === 'pending').length,
    totalAmount: transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
  };

  if (loading && transactions.length === 0) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading {COMPANY.shortName} transactions...</p>
    </div>
  );

  return (
    <motion.div 
      className="transactions-page" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <div>
          <h1>Data Orders on {COMPANY.shortName}</h1>
          <p>View your purchase history and transaction status</p>
        </div>
        <button className="btn-outline" onClick={exportToExcel} disabled={exporting}>
          <FaDownload /> {exporting ? 'Exporting...' : 'Export to Excel'}
        </button>
      </div>

      {/* Stats Summary */}
      <div className="transaction-stats">
        <div className="stat-card small">
          <span>Total Orders</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="stat-card small success">
          <span>Completed</span>
          <strong>{stats.completed}</strong>
        </div>
        <div className="stat-card small warning">
          <span>Pending</span>
          <strong>{stats.pending}</strong>
        </div>
        <div className="stat-card small">
          <span>Total Spent</span>
          <strong>₵{stats.totalAmount.toFixed(2)}</strong>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <FaSearch />
          <input 
            type="text" 
            placeholder="Search by Order ID, Phone or Network..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <FaFilter />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="transactions-table-container">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Phone</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(order => (
                <tr key={order.order_id}>
                  <td className="order-id">#{order.order_id} on Roamsmart</td>
                  <td>{order.phone}</td>
                  <td>{order.network?.toUpperCase()} {order.size_gb}GB</td>
                  <td className="amount">₵{order.amount}</td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td className="date">{formatDateTime(order.created_at)}</td>
                  <td>
                    <button 
                      className="view-btn" 
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowDetailsModal(true);
                      }}
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center">
                    {searchTerm ? 'No transactions match your search on Roamsmart' : 'No transactions found. Start shopping!'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
          <span>Page {currentPage} of {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
        </div>
      )}

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
              
              <div className="details-grid">
                <div className="detail-item"><label>Order ID:</label><span>#{selectedOrder.order_id}</span></div>
                <div className="detail-item"><label>Phone Number:</label><span>{selectedOrder.phone}</span></div>
                <div className="detail-item"><label>Network:</label><span>{selectedOrder.network?.toUpperCase()}</span></div>
                <div className="detail-item"><label>Size:</label><span>{selectedOrder.size_gb}GB</span></div>
                <div className="detail-item"><label>Amount:</label><span className="amount">₵{selectedOrder.amount}</span></div>
                <div className="detail-item"><label>Status:</label><span>{getStatusBadge(selectedOrder.status)}</span></div>
                <div className="detail-item"><label>Date:</label><span>{formatDateTime(selectedOrder.created_at)}</span></div>
                <div className="detail-item"><label>Payment Method:</label><span>{selectedOrder.payment_method || 'Wallet'}</span></div>
              </div>
              
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}