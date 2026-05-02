// src/pages/Earnings.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaWallet, FaMoneyBillWave, FaUsers, FaHistory, FaDownload, FaSpinner, FaWhatsapp, FaChartLine, FaCalendarAlt, FaCheckCircle, FaGift, FaUserPlus } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { FaShoppingCart } from 'react-icons/fa';
// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  phone: '0557388622',
  email: 'support@roamsmart.shop'
};

export default function Earnings() {
  const [loading, setLoading] = useState(true);
  const [isAgent, setIsAgent] = useState(false);
  const [userStats, setUserStats] = useState({
    wallet_balance: 0,
    total_orders: 0,
    total_spent: 0,
    referral_code: '',
    referral_count: 0,
    referral_earnings: 0
  });
  
  // Agent-specific states (only used if isAgent = true)
  const [agentEarnings, setAgentEarnings] = useState({
    available: 0,
    total_earned: 0,
    pending: 0,
    withdrawn: 0,
    this_month: 0,
    this_week: 0,
    commission_rate: 10,
    agent_tier: 'Bronze'
  });
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [mobileMoney, setMobileMoney] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // First get user stats to check role
      const statsRes = await api.get('/user/stats');
      const userData = statsRes.data.data;
      
      setIsAgent(userData.is_agent || false);
      
      // Set common user stats
      setUserStats({
        wallet_balance: userData.wallet_balance || 0,
        total_orders: userData.total_orders || 0,
        total_spent: userData.total_spent || 0,
        referral_code: userData.referral_code || '',
        referral_count: userData.referral_count || 0,
        referral_earnings: userData.referral_earnings || 0
      });
      
      // If user is an agent, fetch agent-specific data
      if (userData.is_agent) {
        await fetchAgentEarnings();
        await fetchWithdrawals();
      }
      
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      toast.error('Failed to load earnings from Roamsmart');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentEarnings = async () => {
    try {
      const res = await api.get('/agent/earnings');
      setAgentEarnings(res.data.data);
    } catch (error) {
      console.error('Failed to fetch agent earnings:', error);
      // Don't show error to user, just use default values
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await api.get('/agent/withdrawals');
      setWithdrawals(res.data.data.withdrawals || res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    }
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^(024|025|026|027|028|020|054|055|059|050|057|053|056)[0-9]{7}$/;
    return phoneRegex.test(phone);
  };

  const requestWithdrawal = async () => {
    if (!isAgent) {
      toast.error('Only Roamsmart agents can request withdrawals');
      return;
    }
    
    const amount = parseFloat(withdrawAmount);
    
    if (!withdrawAmount || amount < 50) {
      toast.error('Minimum withdrawal is GHS 50');
      return;
    }
    if (amount > agentEarnings.available) {
      toast.error('Insufficient balance');
      return;
    }
    if (!mobileMoney) {
      toast.error('Enter mobile money number');
      return;
    }
    if (!validatePhoneNumber(mobileMoney)) {
      toast.error('Enter a valid Ghana mobile money number (e.g., 024XXXXXXX)');
      return;
    }

    const result = await Swal.fire({
      title: 'Confirm Withdrawal',
      html: `You are withdrawing <strong>₵${amount}</strong> to <strong>${mobileMoney}</strong><br/><br/>This will be processed within 24 hours.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      confirmButtonText: 'Yes, Withdraw',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    setWithdrawing(true);
    try {
      await api.post('/agent/withdraw', { amount, mobile_money: mobileMoney });
      toast.success(`Withdrawal request submitted to ${COMPANY.name}!`);
      setWithdrawAmount('');
      setMobileMoney('');
      await fetchAgentEarnings();
      await fetchWithdrawals();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed': return <span className="badge-success"><FaCheckCircle /> Completed</span>;
      case 'pending': return <span className="badge-warning"><FaSpinner className="spinning" /> Processing</span>;
      case 'failed': return <span className="badge-danger">Failed</span>;
      default: return <span className="badge-secondary">{status}</span>;
    }
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading {COMPANY.shortName} earnings...</p>
    </div>
  );

  // ========== AGENT VIEW ==========
  if (isAgent) {
    return (
      <motion.div 
        className="earnings-page" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
      >
        <div className="page-header">
          <div>
            <h1>Earnings on {COMPANY.shortName}</h1>
            <p>Track your commission and manage withdrawals as a Roamsmart Agent</p>
          </div>
          <div className="agent-tier-badge">
            <span className={`tier-badge ${agentEarnings.agent_tier?.toLowerCase() || 'bronze'}`}>
              <FaChartLine /> {agentEarnings.agent_tier || 'Bronze'} Agent
            </span>
            <span className="commission-rate-badge">
              {agentEarnings.commission_rate || 10}% Commission
            </span>
          </div>
        </div>

        <div className="earnings-stats-grid">
          <div className="stat-card">
            <FaWallet />
            <div className="stat-value">₵{agentEarnings.available?.toFixed(2) || '0.00'}</div>
            <div className="stat-label">Available for Withdrawal</div>
          </div>
          <div className="stat-card">
            <FaMoneyBillWave />
            <div className="stat-value">₵{agentEarnings.total_earned?.toFixed(2) || '0.00'}</div>
            <div className="stat-label">Total Earnings on Roamsmart</div>
          </div>
          <div className="stat-card">
            <FaCalendarAlt />
            <div className="stat-value">₵{agentEarnings.this_month?.toFixed(2) || '0.00'}</div>
            <div className="stat-label">This Month</div>
          </div>
          <div className="stat-card">
            <FaHistory />
            <div className="stat-value">₵{agentEarnings.withdrawn?.toFixed(2) || '0.00'}</div>
            <div className="stat-label">Total Withdrawn</div>
          </div>
        </div>

        <div className="withdrawal-section">
          <div className="withdrawal-card">
            <h3>Request Withdrawal from Roamsmart</h3>
            <p>Minimum withdrawal: <strong>GHS 50</strong> | Processing time: <strong>24 hours</strong></p>
            
            <div className="form-group">
              <label>Amount (GHS)</label>
              <input 
                type="number" 
                className="form-control"
                value={withdrawAmount} 
                onChange={(e) => setWithdrawAmount(e.target.value)} 
                placeholder="Enter amount (min. 50)"
              />
            </div>
            
            <div className="form-group">
              <label>Mobile Money Number</label>
              <input 
                type="tel" 
                className="form-control"
                value={mobileMoney} 
                onChange={(e) => setMobileMoney(e.target.value)} 
                placeholder="024XXXXXXX"
              />
              <small>MTN, Telecel, or AirtelTigo Money number</small>
            </div>
            
            <button 
              className="btn-primary btn-block" 
              onClick={requestWithdrawal} 
              disabled={withdrawing}
            >
              {withdrawing ? <FaSpinner className="spinning" /> : <FaWhatsapp />}
              {withdrawing ? ' Processing...' : ' Request Withdrawal'}
            </button>

            <div className="withdrawal-note">
              <small>⚠️ Withdrawals are processed within 24 hours to your mobile money account</small>
            </div>
          </div>

          <div className="withdrawal-history">
            <h3>Withdrawal History from Roamsmart</h3>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Mobile Money</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map(w => (
                    <tr key={w.id}>
                      <td>{new Date(w.created_at).toLocaleDateString()}</td>
                      <td className="amount">₵{w.amount}</td>
                      <td>{w.mobile_money}</td>
                      <td>{getStatusBadge(w.status)}</td>
                    </tr>
                  ))}
                  {withdrawals.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center">
                        No withdrawals yet from {COMPANY.shortName}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Earnings Tips */}
        <div className="earnings-tips">
          <h3>Tips to Increase Your Earnings on Roamsmart</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <FaUsers />
              <h4>Grow Your Customer Base</h4>
              <p>Share your store link and get more customers</p>
            </div>
            <div className="tip-card">
              <FaChartLine />
              <h4>Increase Your Tier</h4>
              <p>Higher sales volume = higher commission rates</p>
            </div>
            <div className="tip-card">
              <FaWhatsapp />
              <h4>Promote on Social Media</h4>
              <p>Share your offers on WhatsApp and Telegram</p>
            </div>
          </div>
        </div>

        <div className="earnings-footer">
          <p className="text-center text-muted">
            <small>Need help with withdrawals? Contact {COMPANY.email}</small>
          </p>
        </div>
      </motion.div>
    );
  }

  // ========== REGULAR USER VIEW (Non-Agent) ==========
  return (
    <motion.div 
      className="earnings-page user-earnings" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <div>
          <h1>My Rewards on {COMPANY.shortName}</h1>
          <p>Track your referral earnings and wallet activity</p>
        </div>
        <div className="user-badge">
          <span className="badge-customer">
            <FaGift /> Customer Rewards
          </span>
        </div>
      </div>

      <div className="earnings-stats-grid">
        <div className="stat-card">
          <FaWallet />
          <div className="stat-value">₵{userStats.wallet_balance?.toFixed(2) || '0.00'}</div>
          <div className="stat-label">Wallet Balance</div>
        </div>
        <div className="stat-card">
          <FaGift />
          <div className="stat-value">{userStats.referral_count || 0}</div>
          <div className="stat-label">Referrals</div>
        </div>
        <div className="stat-card">
          <FaMoneyBillWave />
          <div className="stat-value">₵{userStats.referral_earnings?.toFixed(2) || '0.00'}</div>
          <div className="stat-label">Referral Earnings</div>
        </div>
        <div className="stat-card">
          <FaShoppingCart />
          <div className="stat-value">{userStats.total_orders || 0}</div>
          <div className="stat-label">Total Orders</div>
        </div>
      </div>

      {/* Referral Code Section */}
      <div className="referral-section">
        <div className="referral-card">
          <h3><FaGift /> Your Roamsmart Referral Code</h3>
          <p>Share your code and earn GHS 5 for every friend who joins Roamsmart!</p>
          
          <div className="referral-code-display">
            <code className="referral-code">{userStats.referral_code || 'Loading...'}</code>
            <button 
              className="btn-copy" 
              onClick={() => {
                navigator.clipboard.writeText(userStats.referral_code);
                toast.success('Referral code copied!');
              }}
            >
              Copy Code
            </button>
          </div>
          
          <div className="referral-stats">
            <div className="stat">
              <span>Total Referrals:</span>
              <strong>{userStats.referral_count || 0}</strong>
            </div>
            <div className="stat">
              <span>Earned so far:</span>
              <strong>₵{userStats.referral_earnings?.toFixed(2) || '0.00'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Become Agent Prompt */}
      <div className="become-agent-prompt">
        <div className="prompt-content">
          <FaUserPlus size={32} />
          <div>
            <h4>Want to earn more on Roamsmart?</h4>
            <p>Become a Roamsmart agent and earn commissions on every sale you make! Agents get up to 25% commission.</p>
          </div>
          <button 
            className="btn-primary" 
            onClick={() => window.location.href = '/become-agent'}
          >
            Apply to Become an Agent
          </button>
        </div>
      </div>

      <div className="earnings-footer">
        <p className="text-center text-muted">
          <small>Questions about earnings? Contact {COMPANY.email} or WhatsApp {COMPANY.phone}</small>
        </p>
      </div>
    </motion.div>
  );
}

// Add missing import
