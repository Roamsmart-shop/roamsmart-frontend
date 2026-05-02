// src/pages/RefundPolicy.js
import React from 'react';
import { motion } from 'framer-motion';
import { FaMoneyBillWave, FaClock, FaWhatsapp, FaEnvelope, FaShieldAlt, FaCheckCircle } from 'react-icons/fa';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  phone: '0557388622',
  website: 'https://roamsmart.shop'
};

export default function RefundPolicy() {
  const lastUpdated = 'April 20, 2026';

  return (
    <motion.div 
      className="static-page legal-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="container">
        <div className="legal-header">
          <h1><FaMoneyBillWave /> Refund Policy</h1>
          <p>Last updated: {lastUpdated}</p>
          <p className="company-name">{COMPANY.name}</p>
        </div>

        <div className="legal-content">
          <section>
            <h2><FaCheckCircle /> When You Can Get a Refund</h2>
            <p>At {COMPANY.name}, customer satisfaction is our priority. Refunds are issued in the following cases:</p>
            <ul>
              <li><strong>📱 Data not delivered:</strong> If your data bundle is not delivered within 30 minutes of payment confirmation</li>
              <li><strong>⚠️ Wrong network delivery:</strong> If we delivered to the wrong network (e.g., MTN instead of Telecel)</li>
              <li><strong>💳 Duplicate payment:</strong> If you were charged twice for the same order</li>
              <li><strong>🔧 Technical error:</strong> If our system failed to process your order correctly</li>
              <li><strong>❌ Failed transaction:</strong> If payment was taken but order failed completely</li>
            </ul>
          </section>

          <section>
            <h2>❌ Non-Refundable Items</h2>
            <p>The following items are non-refundable once delivered:</p>
            <ul>
              <li><strong>🎓 WAEC Vouchers:</strong> Once a WAEC result checker voucher is delivered, it cannot be refunded</li>
              <li><strong>📝 AFA Registration:</strong> AFA registration fees are non-refundable after submission</li>
              <li><strong>📊 Already used data:</strong> Partially or fully used data bundles</li>
              <li><strong>📞 Wrong phone number entered:</strong> If you provided an incorrect phone number at checkout</li>
              <li><strong>⚡ User error:</strong> Purchasing the wrong bundle size or network by mistake</li>
            </ul>
          </section>

          <section>
            <h2><FaClock /> How to Request a Refund</h2>
            <p>Follow these steps to request a refund from {COMPANY.name}:</p>
            <ol>
              <li><strong>Contact support</strong> within 24 hours of purchase</li>
              <li><strong>Provide your order ID</strong> (found in your dashboard or email)</li>
              <li><strong>Explain the issue</strong> in detail</li>
              <li><strong>Attach screenshot</strong> if applicable (payment proof, error message, etc.)</li>
              <li><strong>Wait for confirmation</strong> from our support team</li>
            </ol>
          </section>

          <section>
            <h2><FaClock /> Refund Processing Time</h2>
            <p>Refund processing times on {COMPANY.shortName}:</p>
            <ul>
              <li><strong>Wallet Credit:</strong> Within 24 hours (instant to your Roamsmart wallet)</li>
              <li><strong>Mobile Money Refund:</strong> 2-3 business days</li>
              <li><strong>Card Refund:</strong> 3-5 business days (depending on your bank)</li>
            </ul>
            <p>All refunds are processed by our team after verification of the issue.</p>
          </section>

          <section>
            <h2>🔄 Partial Refunds</h2>
            <p>In some cases, partial refunds may be issued:</p>
            <ul>
              <li><strong>Partial delivery:</strong> If only some of your data bundles were delivered</li>
              <li><strong>Wrong amount:</strong> If you were overcharged for an order</li>
              <li><strong>Quantity issues:</strong> If you received fewer items than ordered</li>
            </ul>
          </section>

          <section>
            <h2><FaShieldAlt /> Dispute Resolution</h2>
            <p>If you disagree with our refund decision:</p>
            <ol>
              <li>Contact our support team for reconsideration</li>
              <li>Provide additional evidence if available</li>
              <li>If unresolved, you may escalate to our management team</li>
              <li>Final recourse through applicable consumer protection laws in Ghana</li>
            </ol>
          </section>

          <section>
            <h2><FaWhatsapp /> Contact for Refunds</h2>
            <div className="contact-info">
              <p><strong>{COMPANY.name}</strong></p>
              <p><FaEnvelope /> Email: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></p>
              <p><FaWhatsapp /> WhatsApp: <a href={`https://wa.me/233${COMPANY.phone}`}>{COMPANY.phone}</a></p>
              <p><FaClock /> Support Hours: 24/7</p>
            </div>
            <p className="info-note">Please include your order ID in all refund requests for faster processing.</p>
          </section>

          <div className="legal-footer">
            <p>© {new Date().getFullYear()} {COMPANY.name}. All rights reserved.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}