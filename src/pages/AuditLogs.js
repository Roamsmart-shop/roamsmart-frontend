// src/pages/AuditLogs.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaFilter, FaDownload, FaShieldAlt } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart'
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/admin/audit-logs');
      setLogs(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    const badges = {
      'login': 'badge-info',
      'logout': 'badge-secondary',
      'create_user': 'badge-success',
      'delete_user': 'badge-danger',
      'suspend_user': 'badge-warning',
      'approve_agent': 'badge-success',
      'update_settings': 'badge-primary',
      'create_backup': 'badge-info'
    };
    return `action-badge ${badges[action] || 'badge-secondary'}`;
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.admin_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterAction === 'all' || log.action === filterAction;
    return matchesSearch && matchesFilter;
  });

  const uniqueActions = [...new Set(logs.map(log => log.action))];

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading {COMPANY.name} audit logs...</p>
    </div>
  );

  return (
    <motion.div 
      className="admin-page audit-logs-page" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <div>
          <h1><FaShieldAlt /> Audit Logs</h1>
          <p>Track all administrative actions on {COMPANY.name}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <FaSearch />
          <input 
            type="text" 
            placeholder="Search by admin, action, or details..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <FaFilter />
          <select 
            value={filterAction} 
            onChange={(e) => setFilterAction(e.target.value)}
          >
            <option value="all">All Actions</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action.replace(/_/g, ' ').toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Admin User</th>
              <th>Action</th>
              <th>Details</th>
              <th>IP Address</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <tr key={log.id}>
                <td>
                  <strong>{log.admin_name || 'Unknown'}</strong>
                  {log.admin_email && <small>{log.admin_email}</small>}
                </td>
                <td>
                  <span className={getActionBadge(log.action)}>
                    {log.action?.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </td>
                <td className="log-details">{log.details || 'N/A'}</td>
                <td><code>{log.ip_address || 'N/A'}</code></td>
                <td>{log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}</td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center">
                  {searchTerm ? 'No logs match your search on Roamsmart' : 'No audit logs found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Stats Summary */}
      <div className="audit-stats">
        <div className="stat-card small">
          <span>Total Actions on Roamsmart</span>
          <strong>{logs.length}</strong>
        </div>
        <div className="stat-card small">
          <span>Unique Admins</span>
          <strong>{new Set(logs.map(l => l.admin_name)).size}</strong>
        </div>
      </div>
    </motion.div>
  );
}