// src/pages/WAECVouchersPage.js
import React from 'react';
import { motion } from 'framer-motion';
import WAECVoucher from '../components/WAECVoucher';
import { useAuth } from '../context/AuthContext';
import { FaGraduationCap, FaWhatsapp, FaEnvelope } from 'react-icons/fa';

const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  phone: '0557388622',
  email: 'support@roamsmart.shop'
};

export default function WAECVouchersPage() {
  const { user } = useAuth();
  const isAgent = user?.is_agent === true;

  return (
    <motion.div 
      className="waec-vouchers-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="page-header">
        <div>
          <h1><FaGraduationCap /> WAEC Result Checker Vouchers</h1>
          <p>Purchase official WAEC result checker vouchers instantly on {COMPANY.shortName}</p>
        </div>
      </div>

      <div className="waec-vouchers-container">
        <WAECVoucher isAgent={isAgent} />
      </div>

      <div className="waec-info-section">
        <h4>About WAEC Vouchers</h4>
        <div className="info-grid">
          <div className="info-card">
            <h5>✅ Instant Delivery</h5>
            <p>Vouchers are delivered immediately after purchase</p>
          </div>
          <div className="info-card">
            <h5>📧 Email & Dashboard</h5>
            <p>Vouchers sent to your email and available in order history</p>
          </div>
          <div className="info-card">
            <h5>🎓 Official WAEC</h5>
            <p>Authentic WAEC result checker vouchers</p>
          </div>
          <div className="info-card">
            <h5>📱 Mobile Compatible</h5>
            <p>Use vouchers on the WAEC portal from any device</p>
          </div>
        </div>
      </div>

      <div className="waec-contact-section">
        <div className="contact-box">
          <h5>Need Help with Your Purchase?</h5>
          <p>Contact our support team for assistance</p>
          <div className="contact-buttons">
            <a href={`https://wa.me/233${COMPANY.phone}`} target="_blank" rel="noopener noreferrer" className="btn-wa">
              <FaWhatsapp /> WhatsApp
            </a>
            <a href={`mailto:${COMPANY.email}`} className="btn-email">
              <FaEnvelope /> Email Support
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}