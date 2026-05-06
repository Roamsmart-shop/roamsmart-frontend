// src/pages/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaUserCheck, FaMoneyBillWave, FaShoppingCart } from 'react-icons/fa';
import api from '../services/api';

const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart'
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_users: 0,
    total_agents: 0,
    total_revenue: 0,
    total_orders: 0
  });
  const [loading, setLoading] = useState(true);

  // ALL hooks MUST be before any conditional return
  useEffect(() => {
    console.log('AdminDashboard mounted - fetching stats');
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      console.log('Stats response:', res.data);
      setStats(res.data.data || {});
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Conditional return AFTER all hooks
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome to Roamsmart Admin Panel</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><FaUsers /></div>
          <div className="stat-value">{stats.total_users || 0}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaUserCheck /></div>
          <div className="stat-value">{stats.total_agents || 0}</div>
          <div className="stat-label">Total Agents</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaMoneyBillWave /></div>
          <div className="stat-value">₵{(stats.total_revenue || 0).toFixed(2)}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaShoppingCart /></div>
          <div className="stat-value">{stats.total_orders || 0}</div>
          <div className="stat-label">Total Orders</div>
        </div>
      </div>

      <div className="welcome-banner">
        <h2>Welcome to Roamsmart Admin Dashboard</h2>
        <p>This is a simplified version for testing. Full features coming soon.</p>
      </div>
    </motion.div>
  );
}