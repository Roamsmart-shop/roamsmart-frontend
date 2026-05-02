// src/pages/AgentInventory.js
// Add AnimatePresence to imports

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';  // Add AnimatePresence here
import { FaDatabase, FaBoxes, FaChartLine, FaExclamationTriangle, FaPlus, FaHistory, FaDownload, FaCheckCircle } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
// ... rest of the component code

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop'
};

export default function AgentInventory() {
  const [inventory, setInventory] = useState({
    mtn: { total: 0, used: 0, remaining: 0, bundles: {} },
    telecel: { total: 0, used: 0, remaining: 0, bundles: {} },
    airteltigo: { total: 0, used: 0, remaining: 0, bundles: {} }
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseData, setPurchaseData] = useState({
    network: 'mtn',
    size_gb: 10,
    quantity: 1
  });

  useEffect(() => {
    fetchInventory();
    fetchTransactions();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/agent/inventory');
      setInventory(res.data.data);
    } catch (error) {
      toast.error('Failed to load Roamsmart inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/agent/inventory/transactions');
      setTransactions(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch transactions');
    }
  };

  const purchaseWholesale = async () => {
    try {
      const res = await api.post('/agent/inventory/purchase', purchaseData);
      if (res.data.success) {
        toast.success(`Purchased ${purchaseData.quantity}x ${purchaseData.size_gb}GB ${purchaseData.network.toUpperCase()} data on ${COMPANY.shortName}`);
        fetchInventory();
        fetchTransactions();
        setShowPurchaseModal(false);
        setPurchaseData({ network: 'mtn', size_gb: 10, quantity: 1 });
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Purchase failed');
    }
  };

  const getUsagePercentage = (remaining, total) => {
    if (total === 0) return 0;
    return ((total - remaining) / total) * 100;
  };

  const getStockStatus = (remaining) => {
    if (remaining === 0) return { text: 'Out of Stock', class: 'danger', icon: <FaExclamationTriangle /> };
    if (remaining < 20) return { text: 'Low Stock', class: 'warning', icon: <FaExclamationTriangle /> };
    return { text: 'In Stock', class: 'success', icon: <FaCheckCircle /> };
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading {COMPANY.name} inventory...</p>
    </div>
  );

  return (
    <motion.div className="inventory-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header">
        <div>
          <h1><FaBoxes /> {COMPANY.shortName} Data Inventory</h1>
          <p>Track your wholesale data balance and usage on Roamsmart</p>
        </div>
        <button className="btn-primary" onClick={() => setShowPurchaseModal(true)}>
          <FaPlus /> Purchase Wholesale Data
        </button>
      </div>

      {/* Inventory Stats */}
      <div className="inventory-stats">
        <div className="stat-card">
          <div className="stat-icon"><FaDatabase /></div>
          <div className="stat-value">{Object.values(inventory).reduce((sum, n) => sum + n.total, 0)} GB</div>
          <div className="stat-label">Total Data Purchased</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaChartLine /></div>
          <div className="stat-value">{Object.values(inventory).reduce((sum, n) => sum + (n.total - n.remaining), 0)} GB</div>
          <div className="stat-label">Data Sold on Roamsmart</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaBoxes /></div>
          <div className="stat-value">{Object.values(inventory).reduce((sum, n) => sum + n.remaining, 0)} GB</div>
          <div className="stat-label">Remaining Stock</div>
        </div>
      </div>

      {/* Network Inventory Cards */}
      <div className="inventory-grid">
        {['mtn', 'telecel', 'airteltigo'].map(network => {
          const data = inventory[network];
          const percentage = getUsagePercentage(data.remaining, data.total);
          const stockStatus = getStockStatus(data.remaining);
          
          return (
            <div key={network} className={`inventory-card ${stockStatus.class}`}>
              <h3 className="network-title">{network.toUpperCase()} on Roamsmart</h3>
              
              <div className="inventory-numbers">
                <div className="inventory-item">
                  <span>Total Purchased:</span>
                  <strong>{data.total} GB</strong>
                </div>
                <div className="inventory-item">
                  <span>Sold:</span>
                  <strong>{data.total - data.remaining} GB</strong>
                </div>
                <div className="inventory-item">
                  <span>Remaining:</span>
                  <strong className={data.remaining < 10 ? 'text-danger' : 'text-success'}>
                    {data.remaining} GB
                  </strong>
                </div>
              </div>

              <div className="progress-container">
                <div className="progress-label">Usage on Roamsmart</div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${percentage}%`, background: percentage > 80 ? '#dc3545' : percentage > 50 ? '#ffc107' : '#28a745' }}
                  ></div>
                </div>
                <div className="progress-percentage">{percentage.toFixed(1)}% Used</div>
              </div>

              <div className={`stock-status-banner ${stockStatus.class}`}>
                {stockStatus.icon} {stockStatus.text}
              </div>

              {data.remaining < 20 && data.remaining > 0 && (
                <div className="warning-banner">
                  <FaExclamationTriangle /> Low stock! Consider purchasing more wholesale data from Roamsmart.
                </div>
              )}
              {data.remaining === 0 && (
                <div className="danger-banner">
                  <FaExclamationTriangle /> Out of stock! Purchase wholesale data to continue selling on Roamsmart.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bundle Breakdown */}
      <div className="bundles-breakdown">
        <h3>Bundle Breakdown by Network on Roamsmart</h3>
        <div className="bundles-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Network</th>
                <th>Bundle Size</th>
                <th>Purchased</th>
                <th>Sold on Roamsmart</th>
                <th>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(inventory).map(([network, data]) => (
                Object.entries(data.bundles || {}).map(([size, bundleData]) => (
                  <tr key={`${network}-${size}`}>
                    <td>{network.toUpperCase()} on Roamsmart</td>
                    <td>{size}GB</td>
                    <td>{bundleData.purchased || 0} GB</td>
                    <td>{bundleData.sold || 0} GB</td>
                    <td className={bundleData.remaining < 10 ? 'text-danger' : 'text-success'}>
                      {bundleData.remaining || 0} GB
                    </td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction History */}
      <div className="transaction-history">
        <h3><FaHistory /> Purchase History on Roamsmart</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Network</th>
              <th>Bundle</th>
              <th>Quantity</th>
              <th>Total GB</th>
              <th>Amount Paid</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id}>
                <td>{new Date(t.created_at).toLocaleDateString()}</td>
                <td>{t.network.toUpperCase()} on Roamsmart</td>
                <td>{t.size_gb}GB</td>
                <td>{t.quantity}</td>
                <td>{t.size_gb * t.quantity} GB</td>
                <td className="amount">₵{t.amount}</td>
                <td><span className="status completed">Completed on Roamsmart</span></td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr><td colSpan="7" className="text-center">No purchase history yet on Roamsmart</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Purchase Modal */}
      <AnimatePresence>
        {showPurchaseModal && (
          <motion.div 
            className="modal-overlay" 
            onClick={() => setShowPurchaseModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content" 
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
            >
              <button className="modal-close" onClick={() => setShowPurchaseModal(false)}>×</button>
              <h3>Purchase Wholesale Data for Roamsmart</h3>
              
              <div className="form-group">
                <label>Network</label>
                <select 
                  value={purchaseData.network} 
                  onChange={(e) => setPurchaseData({...purchaseData, network: e.target.value})}
                  className="form-control"
                >
                  <option value="mtn">MTN</option>
                  <option value="telecel">Telecel</option>
                  <option value="airteltigo">AirtelTigo</option>
                </select>
              </div>

              <div className="form-group">
                <label>Bundle Size (GB)</label>
                <select 
                  value={purchaseData.size_gb} 
                  onChange={(e) => setPurchaseData({...purchaseData, size_gb: parseInt(e.target.value)})}
                  className="form-control"
                >
                  <option value={1}>1 GB - ₵4.50</option>
                  <option value={2}>2 GB - ₵7.00</option>
                  <option value={5}>5 GB - ₵16.00</option>
                  <option value={10}>10 GB - ₵30.00</option>
                  <option value={20}>20 GB - ₵55.00</option>
                </select>
              </div>

              <div className="form-group">
                <label>Quantity</label>
                <input 
                  type="number" 
                  value={purchaseData.quantity}
                  onChange={(e) => setPurchaseData({...purchaseData, quantity: parseInt(e.target.value)})}
                  min="1"
                  max="100"
                  className="form-control"
                />
              </div>

              <div className="price-summary">
                <p>Total GB: {purchaseData.size_gb * purchaseData.quantity} GB</p>
                <p>Total Cost: ₵{(purchaseData.size_gb === 1 ? 4.50 : purchaseData.size_gb === 2 ? 7.00 : purchaseData.size_gb === 5 ? 16.00 : purchaseData.size_gb === 10 ? 30.00 : 55.00) * purchaseData.quantity}</p>
                <p className="text-muted">Payment will be deducted from your Roamsmart wallet</p>
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowPurchaseModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={purchaseWholesale}>
                  Purchase for Roamsmart
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}