// src/pages/Support.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaWhatsapp, FaEnvelope, FaPhoneAlt, FaHeadset, FaClock, FaCheckCircle, FaPaperPlane, FaTelegram, FaInstagram, FaSpinner, FaFacebook, FaTwitter } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  phone: '0557388622',
  whatsapp: '233557388622',
  website: 'https://roamsmart.shop',
  supportHours: '24/7'
};

export default function Support() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post('/support/ticket', formData);
      toast.success(`Support ticket submitted to ${COMPANY.name}! We'll respond within 24 hours.`);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const supportChannels = [
    { icon: <FaWhatsapp />, title: 'WhatsApp', value: COMPANY.phone, action: `https://wa.me/${COMPANY.whatsapp}`, color: '#25D366', description: 'Fastest response' },
    { icon: <FaPhoneAlt />, title: 'Phone Call', value: COMPANY.phone, action: `tel:${COMPANY.phone}`, color: '#0088cc', description: 'Speak to an agent' },
    { icon: <FaEnvelope />, title: 'Email', value: COMPANY.email, action: `mailto:${COMPANY.email}`, color: '#ea4335', description: 'Detailed inquiries' },
    { icon: <FaTelegram />, title: 'Telegram', value: '@roamsmart', action: 'https://t.me/roamsmart', color: '#0088cc', description: 'Community support' }
  ];

  const faqs = [
    { q: 'How fast is data delivery?', a: 'Data bundles are delivered instantly within 2 seconds after payment on Roamsmart.' },
    { q: 'What if my data isn\'t delivered?', a: 'Contact support immediately and we\'ll resolve within 5 minutes.' },
    { q: 'How do I become a Roamsmart agent?', a: 'Click on "Become Agent" and pay the registration fee of ₵100 to start earning commission.' },
    { q: 'Can I get a refund?', a: 'Refunds are processed within 24 hours if delivery fails on Roamsmart.' },
    { q: 'What payment methods are accepted?', a: 'We accept Mobile Money (MTN, Telecel, AirtelTigo) and manual bank transfers.' },
    { q: 'How do I check my WAEC results?', a: 'Purchase a WAEC voucher from Roamsmart and use it on the WAEC portal.' }
  ];

  return (
    <motion.div 
      className="support-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="container">
        <div className="support-header">
          <h1><FaHeadset /> 24/7 Support</h1>
          <p>We're here to help you anytime, anywhere on {COMPANY.name}</p>
        </div>

        <div className="support-grid">
          <div className="support-channels">
            <h2>Contact Us Directly</h2>
            <div className="channels-grid">
              {supportChannels.map((channel, index) => (
                <motion.a 
                  key={index}
                  href={channel.action}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="channel-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{ borderColor: channel.color }}
                >
                  <div className="channel-icon" style={{ background: channel.color }}>{channel.icon}</div>
                  <h3>{channel.title}</h3>
                  <p>{channel.value}</p>
                  <small>{channel.description}</small>
                </motion.a>
              ))}
            </div>

            <div className="support-hours">
              <FaClock />
              <div>
                <strong>Roamsmart Support Hours</strong>
                <p>Monday - Sunday: {COMPANY.supportHours}</p>
                <small>Response within 5 minutes on WhatsApp</small>
              </div>
            </div>

            <div className="social-links-support">
              <h4>Follow Roamsmart</h4>
              <div className="social-icons">
                <a href="https://facebook.com/roamsmart" target="_blank" rel="noopener noreferrer"><FaFacebook /></a>
                <a href="https://twitter.com/roamsmart" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
                <a href="https://instagram.com/roamsmart" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
                <a href="https://t.me/roamsmart" target="_blank" rel="noopener noreferrer"><FaTelegram /></a>
              </div>
            </div>
          </div>

          <div className="ticket-form">
            <motion.div 
              className="form-card" 
              initial={{ opacity: 0, x: 30 }} 
              animate={{ opacity: 1, x: 0 }}
            >
              <h2><FaPaperPlane /> Open a Support Ticket</h2>
              <p>Submit your query and we'll get back to you within 24 hours</p>
              
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Your Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="024XXXXXXX" />
                  </div>
                  <div className="form-group">
                    <label>Subject</label>
                    <input type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="Brief description" />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Message *</label>
                  <textarea name="message" rows="5" value={formData.message} onChange={handleChange} placeholder="Describe your issue in detail..." required></textarea>
                </div>
                
                <button type="submit" className="btn-primary btn-block" disabled={submitting}>
                  {submitting ? <FaSpinner className="spinning" /> : <FaPaperPlane />}
                  {submitting ? ' Submitting to Roamsmart...' : ' Submit Ticket'}
                </button>
              </form>
            </motion.div>
          </div>
        </div>

        <div className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            {faqs.map((faq, index) => (
              <motion.div 
                key={index} 
                className="faq-item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <h4>{faq.q}</h4>
                <p>{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="support-footer">
          <p className="text-center text-muted">
            <small>© {new Date().getFullYear()} {COMPANY.name}. All rights reserved.</small>
          </p>
        </div>
      </div>
    </motion.div>
  );
}