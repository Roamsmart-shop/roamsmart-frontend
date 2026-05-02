// src/pages/WalletTransactions.js
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaEye, FaDownload, FaWallet, FaSpinner, FaCheckCircle, FaTimesCircle, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import FundWallet from '../components/FundWallet';
import * as XLSX from 'xlsx';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop'
};

export default function WalletTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFundModal, setShowFundModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [exporting, setExporting] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/wallet/transactions?page=${currentPage}&limit=20`);
      setTransactions(res.data.data || []);
      setTotalPages(res.data.total_pages || 1);
    } catch (error) {
      toast.error('Failed to load wallet transactions from Roamsmart');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

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

  const getTypeBadge = (type) => {
    const isCredit = type === 'credit' || type === 'fund' || type === 'commission' || type === 'refund';
    return {
      icon: isCredit ? <FaArrowUp /> : <FaArrowDown />,
      class: isCredit ? 'type-credit' : 'type-debit',
      label: type?.toUpperCase() || 'UNKNOWN'
    };
  };

  const formatAmount = (amount, type) => {
    const isCredit = type === 'credit' || type === 'fund' || type === 'commission' || type === 'refund';
    return `${isCredit ? '+' : '-'} ₵${Math.abs(amount).toFixed(2)}`;
  };

  const exportToCSV = () => {
    setExporting(true);
    try {
      const exportData = transactions.map(t => ({
        'Date': new Date(t.created_at).toLocaleString(),
        'Type': t.type,
        'Amount (GHS)': t.type === 'credit' ? t.amount : -t.amount,
        'Balance Before': t.balance_before,
        'Balance After': t.balance_after,
        'Reference': t.reference,
        'Description': t.description,
        'Status': t.status
      }));
      
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Roamsmart_Wallet_Transactions`);
      XLSX.writeFile(wb, `roamsmart_wallet_transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(`${transactions.length} transactions exported from Roamsmart`);
    } catch (error) {
      toast.error('Failed to export transactions');
    } finally {
      setExporting(false);
    }
  };

  const filteredTransactions = transactions.filter(t => 
    t.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalCredits: transactions.filter(t => t.type === 'credit' || t.type === 'fund' || t.type === 'commission').reduce((sum, t) => sum + (t.amount || 0), 0),
    totalDebits: transactions.filter(t => t.type === 'debit' || t.type === 'purchase' || t.type === 'withdrawal').reduce((sum, t) => sum + (t.amount || 0), 0),
    pendingCount: transactions.filter(t => t.status === 'pending').length
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading {COMPANY.shortName} wallet transactions...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="transactions-page wallet-transactions-page" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <div>
          <h1><FaWallet /> Wallet Transactions</h1>
          <p>Track all your Roamsmart wallet activity</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowFundModal(true)}>
            <FaWallet /> Fund Roamsmart Wallet
          </button>
          <button className="btn-outline" onClick={exportToCSV} disabled={exporting}>
            <FaDownload /> {exporting ? 'Exporting...' : 'Export to Excel'}
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="transaction-stats">
        <div className="stat-card small success">
          <span>Total Credits</span>
          <strong>₵{stats.totalCredits.toFixed(2)}</strong>
        </div>
        <div className="stat-card small danger">
          <span>Total Debits</span>
          <strong>₵{stats.totalDebits.toFixed(2)}</strong>
        </div>
        <div className="stat-card small warning">
          <span>Pending</span>
          <strong>{stats.pendingCount}</strong>
        </div>
      </div>

      {/* Notice Box */}
      <div className="notice-box">
        <div className="notice-icon">ℹ️</div>
        <div className="notice-content">
          <strong>Roamsmart Wallet Notice:</strong> This page shows wallet-related transactions only (funding, purchases, commissions, refunds).
          If a transaction is pending, it may take some time to reflect the final balance.
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <FaSearch />
          <input 
            type="text" 
            placeholder="Search by Reference, Description or Type..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
            <option value="purchase">Purchase</option>
            <option value="fund">Wallet Funding</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="commission">Commission</option>
            <option value="refund">Refund</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="transactions-table-container">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>TYPE</th>
                <th>AMOUNT</th>
                <th>BALANCE BEFORE</th>
                <th>BALANCE AFTER</th>
                <th>REFERENCE</th>
                <th>STATUS</th>
                <th>DATE</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state">
                    <div className="empty-icon">💰</div>
                    <p>No Roamsmart wallet transactions found</p>
                    <button onClick={() => setShowFundModal(true)} className="btn-primary btn-sm">
                      Fund Your Roamsmart Wallet
                    </button>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => {
                  const typeInfo = getTypeBadge(transaction.type);
                  return (
                    <tr key={transaction.id}>
                      <td>
                        <span className={`type-badge ${typeInfo.class}`}>
                          {typeInfo.icon} {typeInfo.label}
                        </span>
                      </td>
                      <td className={`amount ${typeInfo.class === 'type-credit' ? 'text-success' : 'text-danger'}`}>
                        {formatAmount(transaction.amount, transaction.type)}
                      </td>
                      <td>₵{transaction.balance_before?.toFixed(2) || '0.00'}</td>
                      <td>₵{transaction.balance_after?.toFixed(2) || '0.00'}</td>
                      <td className="reference">{transaction.reference || transaction.id}</td>
                      <td>{getStatusBadge(transaction.status)}</td>
                      <td className="date">{new Date(transaction.created_at).toLocaleString()}</td>
                      <td>
                        <button 
                          className="view-details-btn"
                          onClick={() => setSelectedTransaction(transaction)}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  );
                })
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

      {/* Fund Wallet Modal */}
      <FundWallet 
        isOpen={showFundModal} 
        onClose={() => {
          setShowFundModal(false);
          fetchTransactions();
        }}
      />

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {selectedTransaction && (
          <motion.div 
            className="modal-overlay" 
            onClick={() => setSelectedTransaction(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content transaction-details-modal" 
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
            >
              <button className="modal-close" onClick={() => setSelectedTransaction(null)}>×</button>
              <h3>Roamsmart Transaction Details</h3>
              
              <div className="details-grid">
                <div className="detail-item">
                  <label>Transaction ID:</label>
                  <span>{selectedTransaction.id}</span>
                </div>
                <div className="detail-item">
                  <label>Type:</label>
                  <span className={getTypeBadge(selectedTransaction.type).class}>
                    {getTypeBadge(selectedTransaction.type).icon} {selectedTransaction.type?.toUpperCase()}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Amount:</label>
                  <span className={selectedTransaction.type === 'credit' ? 'text-success' : 'text-danger'}>
                    {formatAmount(selectedTransaction.amount, selectedTransaction.type)}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Status:</label>
                  <span>{getStatusBadge(selectedTransaction.status)}</span>
                </div>
                <div className="detail-item">
                  <label>Balance Before:</label>
                  <span>₵{selectedTransaction.balance_before?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="detail-item">
                  <label>Balance After:</label>
                  <span>₵{selectedTransaction.balance_after?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="detail-item">
                  <label>Reference:</label>
                  <span><code>{selectedTransaction.reference || 'N/A'}</code></span>
                </div>
                <div className="detail-item">
                  <label>Date:</label>
                  <span>{new Date(selectedTransaction.created_at).toLocaleString()}</span>
                </div>
                <div className="detail-item full-width">
                  <label>Description:</label>
                  <span>{selectedTransaction.description || 'No description provided'}</span>
                </div>
              </div>
              
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setSelectedTransaction(null)}>Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}