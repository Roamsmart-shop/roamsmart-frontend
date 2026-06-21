// src/pages/Earnings.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaWallet, FaMoneyBillWave, FaUsers, FaHistory, FaDownload, FaSpinner, 
  FaWhatsapp, FaChartLine, FaCalendarAlt, FaCheckCircle, FaGift, FaUserPlus,
  FaBolt, FaTint, FaTv, FaReceipt, FaTimes, FaInfoCircle
} from 'react-icons/fa';
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

// Biller icons mapping
const getBillerIcon = (billerCode) => {
  const icons = {
    'DSTV': <FaTv />,
    'GOTV': <FaTv />,
    'STARTIMES': <FaTv />,
    'ECG': <FaBolt />,
    'GWCL': <FaTint />,
    'WAEC': <FaReceipt />
  };
  return icons[billerCode] || <FaReceipt />;
};

const getBillerName = (billerCode) => {
  const names = {
    'DSTV': 'DSTV',
    'GOTV': 'GoTV',
    'STARTIMES': 'StarTimes',
    'ECG': 'ECG Electricity',
    'GWCL': 'Ghana Water',
    'WAEC': 'WAEC Result Checker'
  };
  return names[billerCode] || billerCode;
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
  
  // Commission earnings states
  const [commissionStats, setCommissionStats] = useState({
    total_commission_earned: 0,
    from_orders: 0,
    from_transactions: 0,
    bill_commission_count: 0,
    data_commission_count: 0
  });
  const [commissionTransactions, setCommissionTransactions] = useState([]);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [commissionFilter, setCommissionFilter] = useState('all'); // all, bill, data
  const [loadingCommission, setLoadingCommission] = useState(false);
  
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
    fetchCommissionData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/user/stats');
      const userData = statsRes.data.data;
      
      setIsAgent(userData.is_agent || false);
      
      setUserStats({
        wallet_balance: userData.wallet_balance || 0,
        total_orders: userData.total_orders || 0,
        total_spent: userData.total_spent || 0,
        referral_code: userData.referral_code || '',
        referral_count: userData.referral_count || 0,
        referral_earnings: userData.referral_earnings || 0
      });
      
      if (userData.is_agent) {
        await fetchAgentEarnings();
        await fetchWithdrawals();
      }
      
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      toast.error('Failed to load Roamsmart data');
    } finally {
      setLoading(false);
    }
  };

  // Update the fetchCommissionData function in Earnings.js

const fetchCommissionData = async () => {
  setLoadingCommission(true);
  try {
    // Fetch commission stats
    const statsRes = await api.get('/user/commission-stats').catch(err => {
      console.log('Commission stats endpoint not yet available, using defaults');
      return { data: { success: true, data: { total_commission_earned: 0, bill_commission_count: 0 } } };
    });
    
    if (statsRes.data && statsRes.data.success) {
      setCommissionStats(statsRes.data.data);
    }
    
    // Fetch commission transactions
    const transRes = await api.get('/user/commission-transactions').catch(err => {
      console.log('Commission transactions endpoint not yet available, using empty array');
      return { data: { success: true, data: [] } };
    });
    
    if (transRes.data && transRes.data.success) {
      setCommissionTransactions(transRes.data.data);
    } else if (transRes.data && transRes.data.data) {
      setCommissionTransactions(transRes.data.data);
    } else {
      setCommissionTransactions([]);
    }
  } catch (error) {
    console.error('Failed to fetch commission data:', error);
    // Don't show error to user, just use empty data
    setCommissionStats({
      total_commission_earned: 0,
      from_orders: 0,
      from_transactions: 0,
      bill_commission_count: 0,
      data_commission_count: 0
    });
    setCommissionTransactions([]);
  } finally {
    setLoadingCommission(false);
  }
};

  const fetchAgentEarnings = async () => {
    try {
      const res = await api.get('/agent/earnings');
      setAgentEarnings(res.data.data);
    } catch (error) {
      console.error('Failed to fetch agent earnings:', error);
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

  const getCommissionTypeIcon = (type) => {
    if (type === 'bill_payment') return <FaReceipt style={{ color: '#8B0000' }} />;
    if (type === 'bill_payment_agent') return <FaUserPlus style={{ color: '#D2691E' }} />;
    return <FaShoppingCart style={{ color: '#28a745' }} />;
  };

  const getCommissionTypeName = (type) => {
    if (type === 'bill_payment') return 'Bill Payment (User)';
    if (type === 'bill_payment_agent') return 'Bill Payment (Agent Sale)';
    return 'Data Sale';
  };

  const filteredCommissions = commissionTransactions.filter(trans => {
    if (commissionFilter === 'all') return true;
    if (commissionFilter === 'bill') return trans.type === 'bill_payment' || trans.type === 'bill_payment_agent';
    if (commissionFilter === 'data') return trans.type === 'data_sale';
    return true;
  });

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

        {/* Bill Payment Commission Section */}
        <div className="commission-summary">
          <div className="commission-header">
            <h3><FaReceipt /> Bill Payment Commission Earnings</h3>
            <button 
              className="btn-outline btn-sm"
              onClick={() => setShowCommissionModal(true)}
            >
              View Details
            </button>
          </div>
          <div className="commission-stats">
            <div className="commission-stat">
              <span>Total Commission:</span>
              <strong>₵{commissionStats.total_commission_earned?.toFixed(2) || '0.00'}</strong>
            </div>
            <div className="commission-stat">
              <span>Bill Payments:</span>
              <strong>{commissionStats.bill_commission_count || 0} transactions</strong>
            </div>
            <div className="commission-stat">
              <span>From Orders:</span>
              <strong>₵{commissionStats.from_orders?.toFixed(2) || '0.00'}</strong>
            </div>
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

        {/* Commission Details Modal */}
        <AnimatePresence>
          {showCommissionModal && (
            <motion.div 
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCommissionModal(false)}
            >
              <motion.div 
                className="modal-content commission-modal"
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <button className="modal-close" onClick={() => setShowCommissionModal(false)}>×</button>
                
                <div className="commission-modal-header">
                  <FaReceipt className="header-icon" />
                  <h2>Commission Details</h2>
                  <p>Track your earnings from bill payments on Roamsmart</p>
                </div>

                <div className="commission-filter-tabs">
                  <button 
                    className={`filter-tab ${commissionFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setCommissionFilter('all')}
                  >
                    All Transactions
                  </button>
                  <button 
                    className={`filter-tab ${commissionFilter === 'bill' ? 'active' : ''}`}
                    onClick={() => setCommissionFilter('bill')}
                  >
                    Bill Payments
                  </button>
                  <button 
                    className={`filter-tab ${commissionFilter === 'data' ? 'active' : ''}`}
                    onClick={() => setCommissionFilter('data')}
                  >
                    Data Sales
                  </button>
                </div>

                <div className="commission-summary-stats">
                  <div className="summary-stat">
                    <span>Total Commission Earned:</span>
                    <strong>₵{commissionStats.total_commission_earned?.toFixed(2) || '0.00'}</strong>
                  </div>
                  <div className="summary-stat">
                    <span>Total Transactions:</span>
                    <strong>{commissionTransactions.length}</strong>
                  </div>
                  <div className="summary-stat">
                    <span>Bill Payments:</span>
                    <strong>{commissionTransactions.filter(t => t.type === 'bill_payment' || t.type === 'bill_payment_agent').length}</strong>
                  </div>
                </div>

                <div className="commission-transactions-list">
                  <h3>Transaction History</h3>
                  {loadingCommission ? (
                    <div className="loading-state">
                      <FaSpinner className="spinning" />
                      <p>Loading commission history...</p>
                    </div>
                  ) : filteredCommissions.length === 0 ? (
                    <div className="empty-state">
                      <FaInfoCircle />
                      <p>No commission transactions found</p>
                      <small>When you make bill payments, commissions will appear here</small>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Service</th>
                            <th>Amount</th>
                            <th>Hubtel Rate</th>
                            <th>Commission</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCommissions.map((trans, index) => (
                            <tr key={index}>
                              <td className="date">
                                {new Date(trans.created_at).toLocaleDateString()}
                              </td>
                              <td>
                                <span className="commission-type">
                                  {getCommissionTypeIcon(trans.type)}
                                  {getCommissionTypeName(trans.type)}
                                </span>
                              </td>
                              <td>
                                {trans.biller_name ? (
                                  <span className="biller-info">
                                    {getBillerIcon(trans.biller_code)} {trans.biller_name}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="amount">
                                ₵{trans.amount?.toFixed(2) || '0.00'}
                              </td>
                              <td>
                                {trans.hubtel_commission_rate}%
                              </td>
                              <td className="commission-amount">
                                <strong>₵{trans.commission_earned?.toFixed(4) || '0.0000'}</strong>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="commission-note">
                  <small>
                    💡 Commission is calculated as: Bill Amount × Hubtel Rate × 70% (your share)<br/>
                    Hubtel charges {commissionStats.hubtel_rate || '1-8'}% depending on service type.
                  </small>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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
          <p>Track your referral earnings and bill payment commissions</p>
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
          <FaReceipt />
          <div className="stat-value">₵{commissionStats.total_commission_earned?.toFixed(2) || '0.00'}</div>
          <div className="stat-label">Commission Earned</div>
        </div>
        <div className="stat-card">
          <FaGift />
          <div className="stat-value">{userStats.referral_count || 0}</div>
          <div className="stat-label">Referrals</div>
        </div>
        <div className="stat-card">
          <FaShoppingCart />
          <div className="stat-value">{userStats.total_orders || 0}</div>
          <div className="stat-label">Total Orders</div>
        </div>
      </div>

      {/* Bill Payment Commission Section */}
      <div className="commission-section">
        <div className="commission-card">
          <div className="card-header">
            <h3><FaReceipt /> Bill Payment Commissions</h3>
            <button 
              className="btn-outline btn-sm"
              onClick={() => setShowCommissionModal(true)}
            >
              View Details
            </button>
          </div>
          <p>You earn 70% of Hubtel's commission when you pay bills through Roamsmart!</p>
          
          <div className="commission-example">
            <div className="example-box">
              <h4>How it works:</h4>
              <ul>
                <li>Pay your DSTV/GoTV/ECG/Water bill</li>
                <li>Hubtel charges {commissionStats.hubtel_rate || '1-8'}% commission</li>
                <li>You get 70% of that commission back as cashback!</li>
              </ul>
              <div className="example-calculation">
                <strong>Example:</strong> GHS 100 DSTV bill
                <br/>
                → Hubtel takes GHS 1.00 (1%)
                <br/>
                → <span className="highlight">You earn GHS 0.70 cashback!</span>
              </div>
            </div>
          </div>
          
          <div className="commission-stats">
            <div className="stat">
              <span>Total Commission Earned:</span>
              <strong>₵{commissionStats.total_commission_earned?.toFixed(2) || '0.00'}</strong>
            </div>
            <div className="stat">
              <span>Bill Payments:</span>
              <strong>{commissionStats.bill_commission_count || 0}</strong>
            </div>
          </div>
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

      {/* Commission Details Modal for Regular Users */}
      <AnimatePresence>
        {showCommissionModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCommissionModal(false)}
          >
            <motion.div 
              className="modal-content commission-modal"
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setShowCommissionModal(false)}>×</button>
              
              <div className="commission-modal-header">
                <FaReceipt className="header-icon" />
                <h2>Bill Payment Commission History</h2>
                <p>Track your cashback earnings from bill payments on Roamsmart</p>
              </div>

              <div className="commission-summary-stats">
                <div className="summary-stat">
                  <span>Total Cashback Earned:</span>
                  <strong>₵{commissionStats.total_commission_earned?.toFixed(2) || '0.00'}</strong>
                </div>
                <div className="summary-stat">
                  <span>Total Bill Payments:</span>
                  <strong>{commissionTransactions.length}</strong>
                </div>
                <div className="summary-stat">
                  <span>Your Share:</span>
                  <strong>70% of Hubtel commission</strong>
                </div>
              </div>

              <div className="commission-transactions-list">
                <h3>Your Cashback History</h3>
                {loadingCommission ? (
                  <div className="loading-state">
                    <FaSpinner className="spinning" />
                    <p>Loading cashback history...</p>
                  </div>
                ) : commissionTransactions.length === 0 ? (
                  <div className="empty-state">
                    <FaInfoCircle />
                    <p>No cashback transactions yet</p>
                    <small>Pay your bills through Roamsmart to earn cashback!</small>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Service</th>
                          <th>Bill Amount</th>
                          <th>Hubtel Rate</th>
                          <th>Cashback Earned</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commissionTransactions.map((trans, index) => (
                          <tr key={index}>
                            <td className="date">
                              {new Date(trans.created_at).toLocaleDateString()}
                            </td>
                            <td>
                              <span className="biller-info">
                                {getBillerIcon(trans.biller_code)} {trans.biller_name || getBillerName(trans.biller_code)}
                              </span>
                            </td>
                            <td className="amount">
                              ₵{trans.amount?.toFixed(2) || '0.00'}
                            </td>
                            <td>
                              {trans.hubtel_commission_rate}%
                            </td>
                            <td className="cashback-amount">
                              <strong style={{ color: '#28a745' }}>+₵{trans.commission_earned?.toFixed(4) || '0.0000'}</strong>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="commission-note">
                <small>
                  💡 Cashback is automatically credited to your Roamsmart wallet after each successful bill payment.<br/>
                  Hubtel charges {commissionStats.hubtel_rate || '1-8'}% commission depending on service type.
                </small>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="earnings-footer">
        <p className="text-center text-muted">
          <small>Questions about earnings? Contact {COMPANY.email} or WhatsApp {COMPANY.phone}</small>
        </p>
      </div>
    </motion.div>
  );
}