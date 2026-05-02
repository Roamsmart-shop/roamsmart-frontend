// src/pages/Sessions.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaLaptop, FaMobileAlt, FaDesktop, FaTabletAlt, FaTrash, FaGlobe, FaShieldAlt, FaClock } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart'
};

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/auth/sessions');
      setSessions(res.data.sessions || []);
      // Find current session
      const current = (res.data.sessions || []).find(s => s.is_current);
      if (current) setCurrentSessionId(current.id);
    } catch (error) {
      toast.error('Failed to load sessions from Roamsmart');
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId) => {
    const result = await Swal.fire({
      title: 'Revoke Session?',
      text: 'This device will be logged out of your Roamsmart account.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Yes, Revoke',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      toast.success('Session revoked from Roamsmart');
      fetchSessions();
    } catch (error) {
      toast.error('Failed to revoke session');
    }
  };

  const revokeAllOthers = async () => {
    const otherCount = sessions.filter(s => !s.is_current).length;
    if (otherCount === 0) {
      toast.info('No other active sessions found');
      return;
    }

    const result = await Swal.fire({
      title: 'Revoke All Other Sessions?',
      text: `This will log out ${otherCount} other device${otherCount > 1 ? 's' : ''} from your Roamsmart account.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Yes, Revoke All',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete('/auth/sessions/others');
      toast.success(`All other sessions revoked from ${COMPANY.shortName}`);
      fetchSessions();
    } catch (error) {
      toast.error('Failed to revoke sessions');
    }
  };

  const getDeviceIcon = (device) => {
    const deviceLower = (device || '').toLowerCase();
    if (deviceLower.includes('mobile') || deviceLower.includes('iphone') || deviceLower.includes('android')) 
      return <FaMobileAlt />;
    if (deviceLower.includes('tablet') || deviceLower.includes('ipad')) 
      return <FaTabletAlt />;
    if (deviceLower.includes('desktop') || deviceLower.includes('pc') || deviceLower.includes('mac')) 
      return <FaDesktop />;
    return <FaLaptop />;
  };

  const getDeviceType = (device) => {
    const deviceLower = (device || '').toLowerCase();
    if (deviceLower.includes('mobile')) return 'Mobile Device';
    if (deviceLower.includes('tablet')) return 'Tablet';
    if (deviceLower.includes('desktop')) return 'Desktop Computer';
    return 'Unknown Device';
  };

  const formatLastActive = (date) => {
    const now = new Date();
    const lastActive = new Date(date);
    const diffHours = Math.floor((now - lastActive) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Active now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    return lastActive.toLocaleDateString();
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading {COMPANY.shortName} sessions...</p>
    </div>
  );

  return (
    <motion.div 
      className="sessions-page" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <div>
          <h1><FaShieldAlt /> Active Sessions</h1>
          <p>Manage where you're logged in to {COMPANY.name}</p>
        </div>
        <button className="btn-danger" onClick={revokeAllOthers}>
          <FaTrash /> Revoke All Other Sessions
        </button>
      </div>

      {/* Security Info */}
      <div className="security-info-card">
        <FaShieldAlt />
        <div>
          <h4>Keep Your Roamsmart Account Secure</h4>
          <p>If you don't recognize a device or location, revoke that session immediately.</p>
        </div>
      </div>

      <div className="sessions-list">
        {sessions.map(session => (
          <motion.div 
            key={session.id} 
            className={`session-card ${session.is_current ? 'current' : ''}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="session-icon">
              {getDeviceIcon(session.device)}
            </div>
            <div className="session-info">
              <h3>{getDeviceType(session.device)}</h3>
              <p className="device-detail">{session.device || 'Unknown Device'}</p>
              <p><FaGlobe /> {session.location || 'Unknown location'}</p>
              <p><FaClock /> Last active: {formatLastActive(session.last_active)}</p>
              {session.ip_address && <p className="ip-address">IP: {session.ip_address}</p>}
            </div>
            <div className="session-status">
              {session.is_current && (
                <span className="current-badge">
                  <FaShieldAlt /> Current Session
                </span>
              )}
              {!session.is_current && (
                <button 
                  className="btn-danger btn-sm" 
                  onClick={() => revokeSession(session.id)}
                >
                  <FaTrash /> Revoke
                </button>
              )}
            </div>
          </motion.div>
        ))}
        {sessions.length === 0 && (
          <div className="no-sessions">
            <p>No active sessions found on {COMPANY.shortName}</p>
          </div>
        )}
      </div>

      {/* Security Tips */}
      <div className="security-tips">
        <h4>Security Tips for Roamsmart</h4>
        <ul>
          <li>✓ Never share your password with anyone</li>
          <li>✓ Enable Two-Factor Authentication (2FA) for extra security</li>
          <li>✓ Regularly review your active sessions</li>
          <li>✓ Log out from public or shared computers</li>
          <li>✓ Contact support immediately if you notice unauthorized access</li>
        </ul>
      </div>
    </motion.div>
  );
}