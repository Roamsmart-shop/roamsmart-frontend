// src/pages/StoreClients.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaEye, FaEnvelope, FaPhoneAlt, FaShoppingCart, FaMoneyBillWave, FaChartLine, FaUserPlus } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop'
};

export default function StoreClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [clientOrders, setClientOrders] = useState([]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await api.get('/agent/store/clients');
      setClients(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load clients from Roamsmart');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientOrders = async (clientId) => {
    try {
      const res = await api.get(`/agent/store/clients/${clientId}/orders`);
      setClientOrders(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch client orders');
    }
  };

  const openClientDetails = async (client) => {
    setSelectedClient(client);
    await fetchClientOrders(client.id);
    setShowDetailsModal(true);
  };

  const getClientTier = (totalSpent) => {
    if (totalSpent >= 1000) return { name: 'Platinum', color: '#e5e4e2', icon: '👑' };
    if (totalSpent >= 500) return { name: 'Gold', color: '#FFD700', icon: '⭐' };
    if (totalSpent >= 100) return { name: 'Silver', color: '#C0C0C0', icon: '🌟' };
    return { name: 'Bronze', color: '#CD7F32', icon: '✨' };
  };

  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: clients.length,
    totalSpent: clients.reduce((sum, c) => sum + (c.total_spent || 0), 0),
    avgSpent: clients.length > 0 ? clients.reduce((sum, c) => sum + (c.total_spent || 0), 0) / clients.length : 0,
    active: clients.filter(c => (c.order_count || 0) > 0).length
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading {COMPANY.shortName} store clients...</p>
    </div>
  );

  return (
    <motion.div 
      className="store-clients-page" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <div>
          <h1><FaUserPlus /> Store Clients</h1>
          <p>Manage your customer base on {COMPANY.name}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="client-stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Clients</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">₵{stats.totalSpent.toFixed(2)}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">₵{stats.avgSpent.toFixed(2)}</div>
          <div className="stat-label">Average Spend</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.active}</div>
          <div className="stat-label">Active Clients</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-box">
        <FaSearch />
        <input 
          type="text" 
          placeholder="Search by name, phone or email..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
        />
      </div>

      {/* Clients Grid */}
      <div className="clients-grid">
        {filteredClients.map(client => {
          const tier = getClientTier(client.total_spent || 0);
          return (
            <motion.div 
              key={client.id} 
              className="client-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
            >
              <div className="client-avatar">
                <img 
                  src={client.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name || client.phone)}&background=8B0000&color=fff&size=80`} 
                  alt={client.name} 
                />
                <div className="client-tier" style={{ background: tier.color }}>
                  {tier.icon} {tier.name}
                </div>
              </div>
              <div className="client-info">
                <h3>{client.name || 'Anonymous Customer'}</h3>
                <p><FaPhoneAlt /> {client.phone}</p>
                {client.email && <p><FaEnvelope /> {client.email}</p>}
                <div className="client-stats">
                  <span><FaShoppingCart /> {client.order_count || 0} orders</span>
                  <span><FaMoneyBillWave /> ₵{(client.total_spent || 0).toFixed(2)}</span>
                </div>
                <button 
                  className="btn-outline btn-sm btn-block"
                  onClick={() => openClientDetails(client)}
                >
                  <FaEye /> View Details
                </button>
              </div>
            </motion.div>
          );
        })}
        {filteredClients.length === 0 && (
          <div className="no-results">
            {searchTerm ? 'No clients match your search' : 'No clients yet. Start selling on Roamsmart!'}
          </div>
        )}
      </div>

      {/* Client Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedClient && (
          <motion.div 
            className="modal-overlay" 
            onClick={() => setShowDetailsModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content client-details-modal" 
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
            >
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
              
              <div className="client-profile-header">
                <img 
                  src={selectedClient.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedClient.name || selectedClient.phone)}&background=8B0000&color=fff&size=100`} 
                  alt={selectedClient.name}
                />
                <div className="client-info">
                  <h2>{selectedClient.name || 'Anonymous Customer'}</h2>
                  <p><FaPhoneAlt /> {selectedClient.phone}</p>
                  {selectedClient.email && <p><FaEnvelope /> {selectedClient.email}</p>}
                  <p><FaChartLine /> Client since: {selectedClient.created_at ? new Date(selectedClient.created_at).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>

              <div className="client-summary">
                <div className="summary-item">
                  <span>Total Orders</span>
                  <strong>{selectedClient.order_count || 0}</strong>
                </div>
                <div className="summary-item">
                  <span>Total Spent</span>
                  <strong>₵{(selectedClient.total_spent || 0).toFixed(2)}</strong>
                </div>
                <div className="summary-item">
                  <span>Last Purchase</span>
                  <strong>{selectedClient.last_purchase ? new Date(selectedClient.last_purchase).toLocaleDateString() : 'N/A'}</strong>
                </div>
              </div>

              <h3>Order History on Roamsmart</h3>
              <div className="order-history">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Product</th>
                      <th>Amount</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientOrders.map(order => (
                      <tr key={order.id}>
                        <td className="order-id">#{order.order_id} on Roamsmart</td>
                        <td>{order.network?.toUpperCase()} {order.size_gb}GB</td>
                        <td className="amount">₵{order.amount}</td>
                        <td>{new Date(order.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {clientOrders.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center">No orders yet from this customer</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="modal-actions">
                <button 
                  className="btn-primary"
                  onClick={() => {
                    setShowDetailsModal(false);
                    window.location.href = `/agent?phone=${selectedClient.phone}`;
                  }}
                >
                  <FaShoppingCart /> Sell to this Customer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}