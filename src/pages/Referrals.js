// src/pages/Referrals.js

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCopy, FaCheck, FaShare, FaWhatsapp, FaTelegram, FaEnvelope, 
  FaUsers, FaMoneyBillWave, FaClock, FaGift, FaStar, FaTrophy,
  FaShoppingCart, FaBolt, FaExchangeAlt, FaCoins
} from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  website: 'https://roamsmart.shop',
  email: 'support@roamsmart.shop'
};

// Points configuration
const POINTS_CONFIG = {
  REFERRAL_POINTS: 1,
  POINTS_TO_GHS_RATE: 10,
  MIN_REDEMPTION: 50,
  MAX_REDEMPTION: 1000
};

export default function Referrals() {
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState({ total: 0, points_earned: 0, pending_points: 0 });
  const [points, setPoints] = useState({ balance: 0, total_earned: 0, total_redeemed: 0, value_in_ghs: 0, transactions: [] });
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState(50);
  const [redeemType, setRedeemType] = useState('bill_payment');
  const [redeemData, setRedeemData] = useState({ network: 'mtn', size_gb: 1 });

  useEffect(() => {
    fetchReferralData();
    fetchPointsData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const res = await api.get('/referrals');
      setReferrals(res.data.referrals || []);
      setStats(res.data.stats || { total: 0, points_earned: 0, pending_points: 0 });
      setReferralCode(res.data.referral_code);
    } catch (error) {
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPointsData = async () => {
    try {
      const res = await api.get('/points');
      setPoints(res.data.data);
    } catch (error) {
      console.error('Failed to load points data');
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaWhatsApp = () => {
    const message = `🎁 *Join ${COMPANY.name} using my referral code!* 🎁\n\nCode: ${referralCode}\n\nEarn 1 point for every referral! 50 points = ₵5 value!\n\nSign up: ${COMPANY.website}/register?ref=${referralCode}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareViaTelegram = () => {
    const message = `🎁 Join ${COMPANY.name} using my referral code: ${referralCode}\n\nEarn points for every referral! 50 points = ₵5 value!\n\nSign up: ${COMPANY.website}/register?ref=${referralCode}`;
    window.open(`https://t.me/share/url?url=${COMPANY.website}/register?ref=${referralCode}&text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = `Join ${COMPANY.name} with my referral code`;
    const body = `Hi,\n\nI'm using ${COMPANY.name} for instant data bundles and bill payments.\n\nUse my referral code: ${referralCode}\n\nSign up at: ${COMPANY.website}/register?ref=${referralCode}\n\nEarn points on your first purchase!\n\nRegards`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleRedeemPoints = async () => {
    if (redeemPoints < POINTS_CONFIG.MIN_REDEMPTION) {
      toast.error(`Minimum redemption is ${POINTS_CONFIG.MIN_REDEMPTION} points (₵5)`);
      return;
    }

    if (redeemPoints > points.balance) {
      toast.error('Insufficient points');
      return;
    }

    const ghsValue = redeemPoints / POINTS_CONFIG.POINTS_TO_GHS_RATE;

    const confirm = await Swal.fire({
      title: 'Redeem Points?',
      html: `
        <div style="text-align: left;">
          <p><strong>Points to Redeem:</strong> ${redeemPoints}</p>
          <p><strong>Value:</strong> ₵${ghsValue.toFixed(2)}</p>
          <p><strong>Redeem for:</strong> ${redeemType === 'bill_payment' ? '💰 Bill Payment Credit' : '📱 Data Bundle'}</p>
          ${redeemType === 'data_bundle' ? `<p><strong>Network:</strong> ${redeemData.network.toUpperCase()}</p><p><strong>Size:</strong> ${redeemData.size_gb}GB</p>` : ''}
          <p style="color: #8B0000; margin-top: 10px;">⚠️ Points cannot be withdrawn as cash.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#8B0000',
      confirmButtonText: 'Confirm Redemption',
      cancelButtonText: 'Cancel'
    });

    if (confirm.isConfirmed) {
      try {
        const payload = {
          points: redeemPoints,
          redemption_type: redeemType,
          details: redeemType === 'data_bundle' ? redeemData : {}
        };

        const res = await api.post('/points/redeem', payload);
        
        if (res.data.success) {
          toast.success(res.data.message);
          setShowRedeemModal(false);
          fetchPointsData();
          fetchReferralData();
          
          Swal.fire({
            icon: 'success',
            title: 'Points Redeemed!',
            html: `
              <p>You redeemed ${redeemPoints} points for ₵${ghsValue.toFixed(2)}!</p>
              <p>New Balance: ${points.balance - redeemPoints} points</p>
            `,
            confirmButtonColor: '#8B0000'
          });
        }
      } catch (error) {
        toast.error(error.response?.data?.error || 'Redemption failed');
      }
    }
  };

  const getReferralStatus = (status) => {
    if (status === 'completed') return { label: '✅ Completed', color: '#28a745' };
    if (status === 'pending') return { label: '⏳ Pending', color: '#ffc107' };
    return { label: '❌ Inactive', color: '#dc3545' };
  };

  const getPointsDisplay = (status) => {
    if (status === 'completed') return `${POINTS_CONFIG.REFERRAL_POINT} pt`;
    if (status === 'pending') return '⏳ Pending';
    return '—';
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading referral data...</p>
    </div>
  );

  return (
    <motion.div 
      className="referrals-page" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}
    >
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', color: '#1a1a2e' }}>Refer & Earn Points</h1>
        <p style={{ color: '#666' }}>Invite friends, earn points, and redeem for data or bill payments</p>
      </div>

      {/* Points Balance Card */}
      <div style={{
        background: 'linear-gradient(135deg, #8B0000 0%, #D2691E 100%)',
        borderRadius: '16px',
        padding: '24px',
        color: 'white',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Your Points Balance</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
            {points.balance} <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>points</span>
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            Value: ₵{points.value_in_ghs?.toFixed(2) || '0.00'}
          </div>
          <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '4px' }}>
            Total Earned: {points.total_earned} | Redeemed: {points.total_redeemed}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            className="btn-primary" 
            onClick={() => setShowRedeemModal(true)}
            disabled={points.balance < POINTS_CONFIG.MIN_REDEMPTION}
            style={{ 
              background: 'white', 
              color: '#8B0000',
              padding: '10px 24px',
              borderRadius: '30px',
              fontWeight: 'bold',
              border: 'none',
              cursor: points.balance >= POINTS_CONFIG.MIN_REDEMPTION ? 'pointer' : 'not-allowed',
              opacity: points.balance >= POINTS_CONFIG.MIN_REDEMPTION ? 1 : 0.5
            }}
          >
            <FaGift /> Redeem Points
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <FaUsers style={{ color: '#8B0000', fontSize: '1.5rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.total}</div>
          <div style={{ color: '#666', fontSize: '0.8rem' }}>Total Referrals</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <FaCoins style={{ color: '#FFD700', fontSize: '1.5rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.points_earned}</div>
          <div style={{ color: '#666', fontSize: '0.8rem' }}>Points Earned</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <FaClock style={{ color: '#ffc107', fontSize: '1.5rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.pending_points}</div>
          <div style={{ color: '#666', fontSize: '0.8rem' }}>Pending Points</div>
        </div>
      </div>

      {/* Referral Code Section */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <h3 style={{ marginBottom: '12px', color: '#1a1a2e' }}>Your Referral Code</h3>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: '#f5f5f5',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '12px'
        }}>
          <code style={{ fontSize: '1.2rem', fontWeight: 'bold', flex: 1 }}>{referralCode}</code>
          <button onClick={copyReferralCode} style={{
            background: 'none',
            border: 'none',
            color: '#8B0000',
            cursor: 'pointer',
            fontSize: '1.2rem'
          }}>
            {copied ? <FaCheck /> : <FaCopy />}
          </button>
        </div>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          Share this code. When a friend signs up and makes their first purchase, you earn <strong>1 point</strong> per referral!
        </p>
        <p style={{ color: '#8B0000', fontSize: '0.85rem', marginTop: '8px' }}>
          💡 50 points = ₵5 value (minimum redemption)
        </p>
        
        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '16px',
          flexWrap: 'wrap'
        }}>
          <button onClick={shareViaWhatsApp} style={{
            background: '#25D366',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}>
            <FaWhatsapp /> WhatsApp
          </button>
          <button onClick={shareViaTelegram} style={{
            background: '#0088cc',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}>
            <FaTelegram /> Telegram
          </button>
          <button onClick={shareViaEmail} style={{
            background: '#ea4335',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}>
            <FaEnvelope /> Email
          </button>
        </div>
      </div>

      {/* How It Works */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <h3 style={{ marginBottom: '16px', color: '#1a1a2e' }}>How It Works</h3>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ textAlign: 'center', flex: 1, minWidth: '120px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#8B0000',
              color: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px',
              fontWeight: 'bold'
            }}>1</div>
            <p style={{ fontSize: '0.85rem' }}>Share your code</p>
          </div>
          <span style={{ fontSize: '1.5rem', color: '#8B0000' }}>→</span>
          <div style={{ textAlign: 'center', flex: 1, minWidth: '120px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#8B0000',
              color: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px',
              fontWeight: 'bold'
            }}>2</div>
            <p style={{ fontSize: '0.85rem' }}>Friend signs up</p>
          </div>
          <span style={{ fontSize: '1.5rem', color: '#8B0000' }}>→</span>
          <div style={{ textAlign: 'center', flex: 1, minWidth: '120px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#8B0000',
              color: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px',
              fontWeight: 'bold'
            }}>3</div>
            <p style={{ fontSize: '0.85rem' }}>First purchase</p>
          </div>
          <span style={{ fontSize: '1.5rem', color: '#8B0000' }}>→</span>
          <div style={{ textAlign: 'center', flex: 1, minWidth: '120px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#FFD700',
              color: '#8B0000',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px',
              fontWeight: 'bold'
            }}>🎉</div>
            <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#8B0000' }}>Earn 1 point!</p>
          </div>
        </div>
        <div style={{
          textAlign: 'center',
          marginTop: '16px',
          padding: '12px',
          background: '#f8f9fa',
          borderRadius: '8px',
          fontSize: '0.9rem',
          color: '#666'
        }}>
          <strong>50 points = ₵5 value</strong> — Redeem for data bundles or bill payments!
        </div>
      </div>

      {/* Referrals List */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginBottom: '16px', color: '#1a1a2e' }}>Your Referrals</h3>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Email/Phone</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Joined</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Points</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map(ref => {
                const status = getReferralStatus(ref.status);
                return (
                  <tr key={ref.id}>
                    <td style={{ padding: '12px' }}>{ref.name || 'Anonymous'}</td>
                    <td style={{ padding: '12px' }}>{ref.email || ref.phone || 'N/A'}</td>
                    <td style={{ padding: '12px' }}>{ref.created_at ? new Date(ref.created_at).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ color: status.color, fontWeight: '500' }}>{status.label}</span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#8B0000', textAlign: 'center' }}>
                      {ref.status === 'completed' ? `${POINTS_CONFIG.REFERRAL_POINTS} pt` : ref.status === 'pending' ? '⏳' : '—'}
                    </td>
                  </tr>
                );
              })}
              {referrals.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                    <FaUsers size={32} style={{ color: '#ccc', marginBottom: '10px' }} />
                    <p>No referrals yet. Share your code!</p>
                    <small>When someone signs up with your code, they'll appear here.</small>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Points Redemption Modal */}
      {showRedeemModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowRedeemModal(false)}>
          <div className="modal-content" style={{
            background: 'white',
            padding: '32px',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px', color: '#1a1a2e' }}>Redeem Your Points</h3>
            
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Points to Redeem</label>
              <input 
                type="number" 
                value={redeemPoints} 
                onChange={(e) => setRedeemPoints(parseInt(e.target.value) || 0)}
                min={POINTS_CONFIG.MIN_REDEMPTION}
                max={points.balance}
                className="form-control"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
              />
              <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                Min: {POINTS_CONFIG.MIN_REDEMPTION} | Max: {Math.min(points.balance, POINTS_CONFIG.MAX_REDEMPTION)} | Value: ₵{(redeemPoints / POINTS_CONFIG.POINTS_TO_GHS_RATE).toFixed(2)}
              </small>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Redeem For</label>
              <select 
                value={redeemType} 
                onChange={(e) => setRedeemType(e.target.value)}
                className="form-control"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
              >
                <option value="bill_payment">💰 Bill Payment Credit</option>
                <option value="data_bundle">📱 Data Bundle</option>
              </select>
            </div>

            {redeemType === 'data_bundle' && (
              <div style={{ marginBottom: '16px' }}>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Network</label>
                  <select 
                    value={redeemData.network} 
                    onChange={(e) => setRedeemData({...redeemData, network: e.target.value})}
                    className="form-control"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                  >
                    <option value="mtn">MTN</option>
                    <option value="telecel">Telecel</option>
                    <option value="airteltigo">AirtelTigo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Size (GB)</label>
                  <select 
                    value={redeemData.size_gb} 
                    onChange={(e) => setRedeemData({...redeemData, size_gb: parseInt(e.target.value)})}
                    className="form-control"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                  >
                    <option value={1}>1 GB (₵6)</option>
                    <option value={2}>2 GB (₵10)</option>
                    <option value={5}>5 GB (₵23)</option>
                    <option value={10}>10 GB (₵45)</option>
                    <option value={20}>20 GB (₵85)</option>
                  </select>
                </div>
              </div>
            )}

            {redeemType === 'bill_payment' && (
              <div style={{ 
                padding: '12px', 
                background: '#f8f9fa', 
                borderRadius: '8px', 
                marginBottom: '16px',
                fontSize: '0.9rem',
                color: '#666'
              }}>
                <p style={{ marginBottom: '4px' }}>
                  <strong>💡 How it works:</strong>
                </p>
                <ul style={{ margin: '4px 0 0 20px' }}>
                  <li>Points converted to wallet balance</li>
                  <li>Can ONLY be used for bill payments</li>
                  <li>CANNOT be withdrawn as cash</li>
                  <li>Value: <strong>₵{redeemPoints / POINTS_CONFIG.POINTS_TO_GHS_RATE}</strong></li>
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button 
                className="btn-secondary" 
                onClick={() => setShowRedeemModal(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleRedeemPoints}
                disabled={redeemPoints < POINTS_CONFIG.MIN_REDEMPTION || redeemPoints > points.balance}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#8B0000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: redeemPoints >= POINTS_CONFIG.MIN_REDEMPTION && redeemPoints <= points.balance ? 'pointer' : 'not-allowed',
                  opacity: redeemPoints >= POINTS_CONFIG.MIN_REDEMPTION && redeemPoints <= points.balance ? 1 : 0.5
                }}
              >
                Redeem Points
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Points Transactions */}
      {points.transactions && points.transactions.length > 0 && (
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginTop: '24px'
        }}>
          <h3 style={{ marginBottom: '16px', color: '#1a1a2e' }}>Points History</h3>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Points</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {points.transactions.slice(0, 10).map(tx => (
                  <tr key={tx.id}>
                    <td style={{ padding: '12px' }}>{new Date(tx.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '12px' }}>{tx.description}</td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: tx.points > 0 ? '#28a745' : '#dc3545'
                    }}>
                      {tx.points > 0 ? `+${tx.points}` : tx.points}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{tx.balance_after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Terms Section */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginTop: '24px'
      }}>
        <h4 style={{ color: '#1a1a2e', marginBottom: '12px' }}>📋 Points & Referral Terms</h4>
        <ul style={{ 
          listStyle: 'none', 
          padding: 0,
          fontSize: '0.85rem',
          color: '#666',
          lineHeight: '1.8'
        }}>
          <li>✅ <strong>1 point</strong> earned per successful referral</li>
          <li>✅ <strong>50 points</strong> minimum to redeem (₵5 value)</li>
          <li>✅ Redeem for <strong>data bundles</strong> or <strong>bill payments</strong></li>
          <li>❌ Points <strong>cannot be withdrawn</strong> as cash</li>
          <li>❌ Points <strong>cannot be transferred</strong> to other users</li>
          <li>⏰ Points expire after <strong>6 months</strong> of inactivity</li>
        </ul>
      </div>
    </motion.div>
  );
}