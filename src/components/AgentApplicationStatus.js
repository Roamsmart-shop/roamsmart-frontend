// src/components/AgentApplicationStatus.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaClock, FaTimesCircle, FaSpinner, FaStore, FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import api from '../services/api';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  phone: '0557388622'
};

export default function AgentApplicationStatus() {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/agent/application/status');
      setApplication(res.data.data);
    } catch (error) {
      console.error('Failed to fetch Roamsmart agent status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="spinner"></div>;
  if (!application?.has_applied) return null;

  const getStatusIcon = () => {
    switch(application.status) {
      case 'pending': return <FaClock className="status-icon pending" />;
      case 'approved': return <FaCheckCircle className="status-icon approved" />;
      case 'rejected': return <FaTimesCircle className="status-icon rejected" />;
      default: return <FaSpinner className="status-icon" />;
    }
  };

  const getStatusMessage = () => {
    switch(application.status) {
      case 'pending':
        return `Your ${COMPANY.shortName} agent application is being reviewed by our admin team. You will receive a notification via SMS and email once approved.`;
      case 'approved':
        return `🎉 Congratulations! Your ${COMPANY.shortName} agent application has been approved! You now have access to wholesale prices, your own store, and commission earnings.`;
      case 'rejected':
        return `Your ${COMPANY.shortName} agent application was not approved at this time. Reason: ${application.rejection_reason || 'Please contact support for more information.'}`;
      default:
        return '';
    }
  };

  const getStatusTitle = () => {
    switch(application.status) {
      case 'pending': return 'Application Under Review';
      case 'approved': return 'Welcome to Roamsmart Agents!';
      case 'rejected': return 'Application Status Update';
      default: return 'Agent Application Status';
    }
  };

  return (
    <motion.div 
      className="application-status-card" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      <div className="status-header">
        {getStatusIcon()}
        <h3>{getStatusTitle()}</h3>
      </div>
      <div className={`status-content ${application.status}`}>
        <p>{getStatusMessage()}</p>
        
        {application.status === 'approved' && (
          <div className="approved-actions">
            <button className="btn-primary" onClick={() => window.location.href = '/agent'}>
              <FaStore /> Go to Roamsmart Agent Dashboard
            </button>
            <button className="btn-outline" onClick={() => window.location.href = '/store/setup'}>
              Set Up Your Store
            </button>
          </div>
        )}
        
        {application.status === 'pending' && (
          <div className="pending-details">
            <div className="detail-item">
              <strong>Reference ID:</strong> 
              <code>{application.payment_reference}</code>
            </div>
            <div className="detail-item">
              <strong>Submitted:</strong> 
              <span>{new Date(application.submitted_at).toLocaleDateString()}</span>
            </div>
            <div className="detail-item">
              <strong>Estimated Review Time:</strong> 
              <span>24 hours</span>
            </div>
            <div className="support-contact">
              <p><FaWhatsapp /> Need help? Contact us on WhatsApp: <strong>{COMPANY.phone}</strong></p>
              <p><FaEnvelope /> Or email: <strong>{COMPANY.email}</strong></p>
            </div>
          </div>
        )}
        
        {application.status === 'rejected' && (
          <div className="rejected-actions">
            <button className="btn-outline" onClick={() => window.location.href = '/become-agent'}>
              Reapply After 30 Days
            </button>
            <button className="btn-link" onClick={() => window.location.href = '/support'}>
              Contact Support
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}