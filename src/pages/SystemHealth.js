// src/pages/SystemHealth.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaDatabase, FaServer, FaClock, FaMemory, FaHdd, FaCheckCircle, FaExclamationTriangle, FaSync, FaShieldAlt } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart'
};

export default function SystemHealth() {
  const [health, setHealth] = useState({
    database: 'checking',
    api_status: 'checking',
    uptime: 'N/A',
    memory_usage: 0,
    cpu_usage: 0,
    disk_usage: 0,
    last_backup: 'N/A',
    active_connections: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await api.get('/admin/system-health');
      setHealth(res.data);
    } catch (error) {
      console.error('Failed to fetch system health');
      setHealth(prev => ({ ...prev, database: 'error', api_status: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const refreshHealth = async () => {
    setRefreshing(true);
    await fetchHealth();
    toast.success(`${COMPANY.shortName} system health refreshed`);
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    if (status === 'connected' || status === 'running' || status === 'ok') return '#28a745';
    if (status === 'checking') return '#ffc107';
    return '#dc3545';
  };

  const getStatusIcon = (status) => {
    if (status === 'connected' || status === 'running' || status === 'ok') return <FaCheckCircle color="#28a745" />;
    if (status === 'checking') return <FaSync className="spinning" color="#ffc107" />;
    return <FaExclamationTriangle color="#dc3545" />;
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading {COMPANY.shortName} system health...</p>
    </div>
  );

  return (
    <motion.div 
      className="admin-page system-health-page" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <div>
          <h1><FaShieldAlt /> System Health</h1>
          <p>Monitor {COMPANY.name} platform status and performance</p>
        </div>
        <button className="btn-outline" onClick={refreshHealth} disabled={refreshing}>
          <FaSync className={refreshing ? 'spinning' : ''} /> Refresh
        </button>
      </div>

      <div className="health-grid">
        <div className="health-card">
          <div className="health-icon"><FaDatabase /></div>
          <div className="health-info">
            <h3>Database</h3>
            <p className={`status ${health.database === 'connected' ? 'success' : health.database === 'checking' ? 'warning' : 'danger'}`}>
              {getStatusIcon(health.database)} {health.database === 'connected' ? 'Connected' : health.database === 'checking' ? 'Checking...' : 'Disconnected'}
            </p>
          </div>
        </div>

        <div className="health-card">
          <div className="health-icon"><FaServer /></div>
          <div className="health-info">
            <h3>API Status</h3>
            <p className={`status ${health.api_status === 'running' ? 'success' : 'danger'}`}>
              {getStatusIcon(health.api_status)} {health.api_status === 'running' ? 'Running' : 'Issues Detected'}
            </p>
          </div>
        </div>

        <div className="health-card">
          <div className="health-icon"><FaClock /></div>
          <div className="health-info">
            <h3>Uptime</h3>
            <p><strong>{health.uptime || 'N/A'}</strong></p>
            <small>Roamsmart continuous operation</small>
          </div>
        </div>

        <div className="health-card">
          <div className="health-icon"><FaMemory /></div>
          <div className="health-info">
            <h3>Memory Usage</h3>
            <p><strong>{health.memory_usage || 0} MB</strong></p>
            <div className="progress-bar-small">
              <div className="progress-fill" style={{ width: `${Math.min(100, (health.memory_usage / 1024) * 100)}%` }}></div>
            </div>
          </div>
        </div>

        <div className="health-card">
          <div className="health-icon"><FaHdd /></div>
          <div className="health-info">
            <h3>Disk Usage</h3>
            <p><strong>{health.disk_usage || 0}%</strong></p>
            <div className="progress-bar-small">
              <div className="progress-fill" style={{ width: `${health.disk_usage || 0}%`, background: (health.disk_usage || 0) > 80 ? '#dc3545' : '#28a745' }}></div>
            </div>
          </div>
        </div>

        <div className="health-card">
          <div className="health-icon"><FaDatabase /></div>
          <div className="health-info">
            <h3>Active Connections</h3>
            <p><strong>{health.active_connections || 0}</strong></p>
            <small>Current users on Roamsmart</small>
          </div>
        </div>
      </div>

      <div className="health-summary">
        <h3>System Summary</h3>
        <div className="summary-items">
          <div className="summary-item">
            <span>Last Backup:</span>
            <strong>{health.last_backup || 'N/A'}</strong>
          </div>
          <div className="summary-item">
            <span>Environment:</span>
            <strong>Production</strong>
          </div>
          <div className="summary-item">
            <span>Platform:</span>
            <strong>{COMPANY.name}</strong>
          </div>
          <div className="summary-item">
            <span>Status:</span>
            <strong className="text-success">Operational</strong>
          </div>
        </div>
      </div>
    </motion.div>
  );
}