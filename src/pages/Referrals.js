// src/pages/Referrals.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCopy, FaCheck, FaShare, FaWhatsapp, FaTelegram, FaEnvelope, FaUsers, FaMoneyBillWave, FaClock } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  website: 'https://roamsmart.shop',
  email: 'support@roamsmart.shop'
};

export default function Referrals() {
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState({ total: 0, earnings: 0, pending: 0 });
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const res = await api.get('/referrals');
      setReferrals(res.data.referrals || []);
      setStats(res.data.stats || { total: 0, earnings: 0, pending: 0 });
      setReferralCode(res.data.referral_code);
    } catch (error) {
      toast.error('Failed to load referral data from Roamsmart');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success(`${COMPANY.shortName} referral code copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaWhatsApp = () => {
    const message = `🎁 *Join ${COMPANY.name} using my referral code!* 🎁\n\nCode: ${referralCode}\n\nGet instant data bundles, WAEC vouchers, and bill payments with 2-second delivery!\n\nSign up: ${COMPANY.website}/register?ref=${referralCode}\n\nBoth of us earn ₵5 when you make your first purchase!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareViaTelegram = () => {
    const message = `🎁 Join ${COMPANY.name} using my referral code: ${referralCode}\n\nGet instant data bundles with 2-second delivery!\n\nSign up: ${COMPANY.website}/register?ref=${referralCode}\n\nBoth earn ₵5 on first purchase!`;
    window.open(`https://t.me/share/url?url=${COMPANY.website}/register?ref=${referralCode}&text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = `Join ${COMPANY.name} with my referral code`;
    const body = `Hi,\n\nI'm using ${COMPANY.name} for instant data bundles, WAEC vouchers, and bill payments.\n\nUse my referral code: ${referralCode}\n\nSign up at: ${COMPANY.website}/register?ref=${referralCode}\n\nWe both earn ₵5 when you make your first purchase!\n\nRegards`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const getReferralBonus = (status) => {
    if (status === 'completed') return '₵5 Paid';
    if (status === 'pending') return '₵5 Pending';
    return '₵0';
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading {COMPANY.shortName} referral data...</p>
    </div>
  );

  return (
    <motion.div 
      className="referrals-page" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <h1>Refer & Earn on {COMPANY.shortName}</h1>
        <p>Invite friends and earn ₵5 for each successful referral</p>
      </div>

      {/* Referral Stats */}
      <div className="referral-stats">
        <div className="stat-card">
          <FaUsers />
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Referrals</div>
        </div>
        <div className="stat-card">
          <FaMoneyBillWave />
          <div className="stat-value">₵{stats.earnings?.toFixed(2) || '0'}</div>
          <div className="stat-label">Total Earned on Roamsmart</div>
        </div>
        <div className="stat-card">
          <FaClock />
          <div className="stat-value">₵{stats.pending?.toFixed(2) || '0'}</div>
          <div className="stat-label">Pending Bonus</div>
        </div>
      </div>

      {/* Referral Code Section */}
      <div className="referral-code-section">
        <h3>Your Roamsmart Referral Code</h3>
        <div className="code-box">
          <code>{referralCode}</code>
          <button onClick={copyReferralCode} className="copy-btn">
            {copied ? <FaCheck /> : <FaCopy />}
          </button>
        </div>
        <p>Share this code with friends. When they sign up and make their first purchase of ₵10 or more, you both earn ₵5!</p>
        
        <div className="share-buttons">
          <button onClick={shareViaWhatsApp} className="btn-whatsapp">
            <FaWhatsapp /> WhatsApp
          </button>
          <button onClick={shareViaTelegram} className="btn-telegram">
            <FaTelegram /> Telegram
          </button>
          <button onClick={shareViaEmail} className="btn-email">
            <FaEnvelope /> Email
          </button>
        </div>
      </div>

      {/* How It Works */}
      <div className="how-it-works">
        <h3>How Roamsmart Referral Works</h3>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <p>Share your unique referral code</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <p>Friend signs up with your code</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <p>They make first purchase of ₵10+</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">4</div>
            <p>Both earn ₵5 bonus!</p>
          </div>
        </div>
      </div>

      {/* Referrals List */}
      <div className="referrals-list">
        <h3>Your Referrals on Roamsmart</h3>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email/Phone</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Your Bonus</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map(ref => (
                <tr key={ref.id}>
                  <td>{ref.name || 'Anonymous'}</td>
                  <td>{ref.email || ref.phone}</td>
                  <td>{ref.created_at ? new Date(ref.created_at).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <span className={`status ${ref.status}`}>
                      {ref.status === 'completed' ? 'Completed' : ref.status === 'pending' ? 'Pending Purchase' : 'Inactive'}
                    </span>
                  </td>
                  <td className="amount">{getReferralBonus(ref.status)}</td>
                </tr>
              ))}
              {referrals.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center">
                    No referrals yet. Share your Roamsmart code!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Referral Terms */}
      <div className="referral-terms">
        <h4>Referral Program Terms</h4>
        <ul>
          <li>✅ Bonus is credited when referred user makes first purchase of ₵10 or more</li>
          <li>✅ Maximum bonus per referral: ₵5</li>
          <li>✅ No limit on number of referrals</li>
          <li>✅ Bonuses are added to your Roamsmart wallet</li>
          <li>✅ Cannot refer yourself or create fake accounts</li>
        </ul>
      </div>
    </motion.div>
  );
}