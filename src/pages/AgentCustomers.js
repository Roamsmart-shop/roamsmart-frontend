// src/pages/AgentCustomers.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, FaEye, FaWhatsapp, FaEnvelope, FaChartLine, FaHistory, 
  FaStar, FaUserCheck, FaPhoneAlt, FaShoppingCart, FaAward,
  FaRegClock, FaMoneyBillWave, FaUsers, FaDownload, FaFilter
} from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  phone: '0557388622',
  website: 'https://roamsmart.shop'
};

export default function AgentCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [customerStats, setCustomerStats] = useState({});
  const [filterTier, setFilterTier] = useState('all');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/agent/customers');
      setCustomers(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load customers from Roamsmart');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (customerId) => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        api.get(`/agent/customers/${customerId}/orders`),
        api.get(`/agent/customers/${customerId}/stats`)
      ]);
      setCustomerOrders(ordersRes.data.data || []);
      setCustomerStats(statsRes.data.data || {});
    } catch (error) {
      console.error('Failed to fetch customer details');
    }
  };

  const openCustomerDetails = async (customer) => {
    setSelectedCustomer(customer);
    await fetchCustomerDetails(customer.id);
    setShowCustomerModal(true);
  };

  const contactCustomer = (customer, method) => {
    if (method === 'whatsapp') {
      const message = `Hello ${customer.name || 'Customer'},\n\nThank you for being a valued customer of ${COMPANY.name}! How can we assist you today?`;
      window.open(`https://wa.me/${customer.phone.replace(/^0/, '233')}?text=${encodeURIComponent(message)}`, '_blank');
    } else if (method === 'sms') {
      window.location.href = `sms:${customer.phone}`;
    } else if (method === 'call') {
      window.location.href = `tel:${customer.phone}`;
    }
  };

  const sendBulkSMS = async () => {
    const { value: message } = await Swal.fire({
      title: `Send Bulk SMS to ${customers.length} Customers`,
      input: 'textarea',
      inputPlaceholder: 'Type your message here...',
      html: `<p class="text-muted">Message will be sent to all your customers on ${COMPANY.name}</p>`,
      showCancelButton: true,
      confirmButtonColor: '#8B0000',
      confirmButtonText: 'Send to All Customers'
    });
    
    if (message) {
      try {
        await api.post('/agent/customers/bulk-sms', { 
          message: `${message}\n\n- ${COMPANY.name}`,
          customer_ids: customers.map(c => c.id) 
        });
        toast.success(`SMS sent to ${customers.length} customers via Roamsmart`);
      } catch (error) {
        toast.error('Failed to send SMS');
      }
    }
  };

  const sendBulkWhatsApp = async () => {
    const { value: message } = await Swal.fire({
      title: `Send Bulk WhatsApp to ${customers.length} Customers`,
      input: 'textarea',
      inputPlaceholder: 'Type your message here...',
      showCancelButton: true,
      confirmButtonColor: '#25D366',
      confirmButtonText: 'Send via WhatsApp'
    });
    
    if (message) {
      // WhatsApp doesn't have bulk API, open individual chats
      toast.info(`Open WhatsApp for each customer (${customers.length} customers)`);
      customers.forEach(customer => {
        setTimeout(() => {
          window.open(`https://wa.me/${customer.phone.replace(/^0/, '233')}?text=${encodeURIComponent(message)}`, '_blank');
        }, 1000);
      });
    }
  };

  const exportCustomersToExcel = () => {
    setExporting(true);
    try {
      const exportData = customers.map(customer => ({
        'Customer Name': customer.name || 'Anonymous',
        'Phone Number': customer.phone,
        'Email': customer.email || 'N/A',
        'Total Orders': customer.order_count || 0,
        'Total Spent (GHS)': customer.total_spent || 0,
        'Average Order Value': customer.total_spent && customer.order_count ? (customer.total_spent / customer.order_count).toFixed(2) : 0,
        'Last Purchase': customer.last_purchase ? new Date(customer.last_purchase).toLocaleDateString() : 'N/A',
        'Customer Since': customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A',
        'Tier': getCustomerTier(customer.total_spent || 0)
      }));
      
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Roamsmart_Customers`);
      XLSX.writeFile(wb, `roamsmart_customers_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(`Exported ${customers.length} customers from Roamsmart`);
    } catch (error) {
      toast.error('Failed to export customers');
    } finally {
      setExporting(false);
    }
  };

  const getCustomerTier = (totalSpent) => {
    if (totalSpent >= 1000) return 'Platinum ⭐⭐⭐';
    if (totalSpent >= 500) return 'Gold ⭐⭐';
    if (totalSpent >= 100) return 'Silver ⭐';
    return 'Bronze';
  };

  const getTierColor = (tier) => {
    if (tier.includes('Platinum')) return '#e5e4e2';
    if (tier.includes('Gold')) return '#FFD700';
    if (tier.includes('Silver')) return '#C0C0C0';
    return '#CD7F32';
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      (customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      customer.phone?.includes(searchTerm) ||
      (customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesTier = filterTier === 'all' || 
      (filterTier === 'bronze' && (customer.total_spent || 0) < 100) ||
      (filterTier === 'silver' && (customer.total_spent || 0) >= 100 && (customer.total_spent || 0) < 500) ||
      (filterTier === 'gold' && (customer.total_spent || 0) >= 500 && (customer.total_spent || 0) < 1000) ||
      (filterTier === 'platinum' && (customer.total_spent || 0) >= 1000);
    
    return matchesSearch && matchesTier;
  });

  const stats = {
    total: customers.length,
    active: customers.filter(c => (c.order_count || 0) > 0).length,
    totalSpent: customers.reduce((sum, c) => sum + (c.total_spent || 0), 0),
    avgSpent: customers.length > 0 ? customers.reduce((sum, c) => sum + (c.total_spent || 0), 0) / customers.length : 0,
    platinum: customers.filter(c => (c.total_spent || 0) >= 1000).length,
    gold: customers.filter(c => (c.total_spent || 0) >= 500 && (c.total_spent || 0) < 1000).length,
    silver: customers.filter(c => (c.total_spent || 0) >= 100 && (c.total_spent || 0) < 500).length,
    bronze: customers.filter(c => (c.total_spent || 0) < 100).length
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading Roamsmart customers...</p>
    </div>
  );

  return (
    <motion.div 
      className="agent-customers-page" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <div>
          <h1><FaUserCheck /> My Customers on Roamsmart</h1>
          <p>Manage your customer base and track their activity on {COMPANY.name}</p>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={sendBulkSMS}>
            <FaEnvelope /> Bulk SMS
          </button>
          <button className="btn-outline" onClick={sendBulkWhatsApp}>
            <FaWhatsapp /> Bulk WhatsApp
          </button>
          <button className="btn-primary" onClick={exportCustomersToExcel} disabled={exporting}>
            <FaDownload /> {exporting ? 'Exporting...' : 'Export to Excel'}
          </button>
        </div>
      </div>

      {/* Customer Stats Overview */}
      <div className="customer-stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><FaUsers /></div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Customers</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaUserCheck /></div>
          <div className="stat-value">{stats.active}</div>
          <div className="stat-label">Active Customers</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaMoneyBillWave /></div>
          <div className="stat-value">₵{stats.totalSpent.toFixed(2)}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaAward /></div>
          <div className="stat-value">₵{stats.avgSpent.toFixed(2)}</div>
          <div className="stat-label">Avg Spend per Customer</div>
        </div>
      </div>

      {/* Tier Breakdown */}
      <div className="tier-breakdown">
        <h4>Customer Tiers on Roamsmart</h4>
        <div className="tier-bars">
          <div className="tier-bar platinum" style={{ width: `${(stats.platinum / stats.total) * 100}%` }} title={`Platinum: ${stats.platinum}`}>
            {stats.platinum > 0 && <span>Platinum {stats.platinum}</span>}
          </div>
          <div className="tier-bar gold" style={{ width: `${(stats.gold / stats.total) * 100}%` }} title={`Gold: ${stats.gold}`}>
            {stats.gold > 0 && <span>Gold {stats.gold}</span>}
          </div>
          <div className="tier-bar silver" style={{ width: `${(stats.silver / stats.total) * 100}%` }} title={`Silver: ${stats.silver}`}>
            {stats.silver > 0 && <span>Silver {stats.silver}</span>}
          </div>
          <div className="tier-bar bronze" style={{ width: `${(stats.bronze / stats.total) * 100}%` }} title={`Bronze: ${stats.bronze}`}>
            {stats.bronze > 0 && <span>Bronze {stats.bronze}</span>}
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="search-filter-bar">
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
        <div className="filter-box">
          <FaFilter />
          <select 
            value={filterTier} 
            onChange={(e) => setFilterTier(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Tiers</option>
            <option value="platinum">Platinum (₵1000+)</option>
            <option value="gold">Gold (₵500-999)</option>
            <option value="silver">Silver (₵100-499)</option>
            <option value="bronze">Bronze (₵0-99)</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="customers-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Total Orders</th>
              <th>Total Spent</th>
              <th>Tier</th>
              <th>Last Purchase</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(customer => {
              const tier = getCustomerTier(customer.total_spent || 0);
              return (
                <tr key={customer.id}>
                  <td>
                    <div className="customer-name">
                      <img 
                        src={customer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name || customer.phone)}&background=8B0000&color=fff&size=40`} 
                        alt={customer.name}
                        className="customer-avatar-sm"
                      />
                      <strong>{customer.name || 'Anonymous Customer'}</strong>
                    </div>
                  </td>
                  <td>{customer.phone}</td>
                  <td>{customer.email || 'N/A'}</td>
                  <td>{customer.order_count || 0}</td>
                  <td className="amount">₵{(customer.total_spent || 0).toFixed(2)}</td>
                  <td>
                    <span className="tier-badge" style={{ background: getTierColor(tier), color: tier.includes('Platinum') ? '#333' : '#fff' }}>
                      {tier}
                    </span>
                  </td>
                  <td>{customer.last_purchase ? new Date(customer.last_purchase).toLocaleDateString() : 'N/A'}</td>
                  <td className="actions">
                    <button className="btn-info btn-sm" onClick={() => openCustomerDetails(customer)} title="View Details">
                      <FaEye />
                    </button>
                    <button className="btn-success btn-sm" onClick={() => contactCustomer(customer, 'whatsapp')} title="WhatsApp">
                      <FaWhatsapp />
                    </button>
                    <button className="btn-primary btn-sm" onClick={() => contactCustomer(customer, 'call')} title="Call">
                      <FaPhoneAlt />
                    </button>
                    <button className="btn-outline btn-sm" onClick={() => window.location.href = `/agent?phone=${customer.phone}`} title="Sell">
                      <FaShoppingCart />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center">
                  {searchTerm ? 'No customers match your search' : 'No customers yet. Start selling on Roamsmart!'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Details Modal */}
      <AnimatePresence>
        {showCustomerModal && selectedCustomer && (
          <motion.div 
            className="modal-overlay" 
            onClick={() => setShowCustomerModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content customer-details-modal" 
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
            >
              <button className="modal-close" onClick={() => setShowCustomerModal(false)}>×</button>
              
              <div className="customer-profile-header">
                <img 
                  src={selectedCustomer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCustomer.name || selectedCustomer.phone)}&background=8B0000&color=fff&size=100`} 
                  alt={selectedCustomer.name}
                  className="customer-avatar-lg"
                />
                <div className="customer-info">
                  <h2>{selectedCustomer.name || 'Anonymous Customer'}</h2>
                  <p><FaPhoneAlt /> {selectedCustomer.phone}</p>
                  <p><FaEnvelope /> {selectedCustomer.email || 'No email provided'}</p>
                  <div className="customer-actions">
                    <button className="btn-success btn-sm" onClick={() => contactCustomer(selectedCustomer, 'whatsapp')}>
                      <FaWhatsapp /> WhatsApp
                    </button>
                    <button className="btn-primary btn-sm" onClick={() => window.location.href = `/agent?phone=${selectedCustomer.phone}`}>
                      <FaShoppingCart /> Sell to Customer
                    </button>
                  </div>
                </div>
              </div>

              {/* Customer Stats */}
              <div className="customer-stats">
                <div className="stat">
                  <FaHistory />
                  <div>
                    <span>Total Orders</span>
                    <strong>{customerStats.total_orders || selectedCustomer.order_count || 0}</strong>
                  </div>
                </div>
                <div className="stat">
                  <FaMoneyBillWave />
                  <div>
                    <span>Total Spent</span>
                    <strong>₵{(customerStats.total_spent || selectedCustomer.total_spent || 0).toFixed(2)}</strong>
                  </div>
                </div>
                <div className="stat">
                  <FaStar />
                  <div>
                    <span>Tier</span>
                    <strong>{getCustomerTier(selectedCustomer.total_spent || 0)}</strong>
                  </div>
                </div>
                <div className="stat">
                  <FaRegClock />
                  <div>
                    <span>Customer Since</span>
                    <strong>{selectedCustomer.created_at ? new Date(selectedCustomer.created_at).toLocaleDateString() : 'N/A'}</strong>
                  </div>
                </div>
              </div>

              {/* Order History */}
              <h3>Order History on Roamsmart</h3>
              <div className="order-history">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Order ID</th>
                      <th>Product</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerOrders.map(order => (
                      <tr key={order.id}>
                        <td>{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="order-id">#{order.order_id}</td>
                        <td>{order.network?.toUpperCase()} {order.size_gb}GB</td>
                        <td className="amount">₵{order.amount}</td>
                        <td><span className="status completed">Delivered</span></td>
                      </tr>
                    ))}
                    {customerOrders.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center">No orders yet on Roamsmart</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="modal-footer-note">
                <small>Customer since: {selectedCustomer.created_at ? new Date(selectedCustomer.created_at).toLocaleDateString() : 'N/A'}</small>
                <small>Powered by {COMPANY.name}</small>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}