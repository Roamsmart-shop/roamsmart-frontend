// src/pages/FAQ.js
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaChevronDown, FaChevronUp, FaWhatsapp, FaEnvelope, FaPhoneAlt, FaStore, FaMoneyBillWave, FaShieldAlt, FaRocket } from 'react-icons/fa';
import { Link } from 'react-router-dom';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  phone: '0557388622',
  whatsapp: '233557388622',
  website: 'https://roamsmart.shop'
};

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    { 
      category: 'General',
      q: 'What is Roamsmart Digital Service?', 
      a: `${COMPANY.name} is Ghana's leading digital service platform offering instant data bundles, WAEC vouchers, bill payments, and more. We provide fast, secure, and reliable digital services to customers across Ghana.`
    },
    { 
      category: 'Data Services',
      q: 'How fast is data delivery?', 
      a: 'Data bundles are delivered instantly within 2 seconds after successful payment confirmation. You will receive an SMS notification once your data is delivered.'
    },
    { 
      category: 'Agent Program',
      q: 'How do I become a Roamsmart agent?', 
      a: `Click on "Become Agent" on our website, pay the one-time registration fee of ₵100, and submit your application. Our team will review and approve within 24 hours. Once approved, you'll get access to wholesale prices, your own store, and commission earnings.`
    },
    { 
      category: 'Payments',
      q: 'What payment methods are accepted?', 
      a: 'We accept Mobile Money (MTN MoMo, Telecel Cash, AirtelTigo Cash) and Card payments via secure payment gateways. All transactions are encrypted and secure.'
    },
    { 
      category: 'Agent Program',
      q: 'What is the agent commission rate?', 
      a: 'Commission rates are tiered based on your sales volume: Bronze: 10%, Silver: 15%, Gold: 20%, Platinum: 25%. The more you sell, the higher your commission rate!'
    },
    { 
      category: 'Refunds',
      q: 'Can I get a refund?', 
      a: 'Yes, refunds are processed within 24 hours if the data bundle is not delivered successfully. Contact our support team with your order details for assistance.'
    },
    { 
      category: 'Support',
      q: 'How do I contact support?', 
      a: `You can contact us via WhatsApp at ${COMPANY.phone}, call us at ${COMPANY.phone}, or email ${COMPANY.email}. Our support team is available 24/7 to assist you.`
    },
    { 
      category: 'Agent Program',
      q: 'How do I withdraw my earnings?', 
      a: 'Agents can request withdrawals from their dashboard. Minimum withdrawal is GHS 50, and funds are sent to your registered mobile money number within 24 hours.'
    },
    { 
      category: 'Store',
      q: 'What is the agent store feature?', 
      a: 'As a Roamsmart agent, you get your own branded online store where customers can buy data bundles directly from you. You can customize your store name, description, and set your own markup prices.'
    },
    { 
      category: 'Security',
      q: 'Is my money safe on Roamsmart?', 
      a: 'Yes, we use enterprise-grade security, SSL encryption, and secure payment gateways to protect all transactions. Your funds are safe with us.'
    },
    { 
      category: 'WAEC',
      q: 'Do you offer WAEC result checker vouchers?', 
      a: 'Yes, we offer WAEC result checker vouchers for WASSCE, BECE, and SHS Placement. Agents earn commission on every voucher sold.'
    },
    { 
      category: 'Bill Payments',
      q: 'What bills can I pay on Roamsmart?', 
      a: 'You can pay electricity bills (ECG, NEDCo), water bills, DSTV, GOtv, and other utility bills through our platform.'
    }
  ];

  const categories = ['All', ...new Set(faqs.map(faq => faq.category))];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.q.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          faq.a.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <motion.div 
      className="static-page faq-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="container">
        <div className="faq-header">
          <h1>Frequently Asked Questions</h1>
          <p>Everything you need to know about {COMPANY.name}</p>
        </div>

        {/* Search Bar */}
        <div className="faq-search">
          <FaSearch />
          <input 
            type="text" 
            placeholder="Search for answers..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Filters */}
        <div className="faq-categories">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="faq-list">
          {filteredFaqs.map((faq, index) => (
            <motion.div 
              key={index}
              className="faq-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div 
                className={`faq-question ${openIndex === index ? 'open' : ''}`}
                onClick={() => toggleFAQ(index)}
              >
                <div className="faq-question-content">
                  <span className="faq-category-tag">{faq.category}</span>
                  <h3>{faq.q}</h3>
                </div>
                {openIndex === index ? <FaChevronUp /> : <FaChevronDown />}
              </div>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div 
                    className="faq-answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p>{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* No Results */}
        {filteredFaqs.length === 0 && (
          <div className="no-results">
            <p>No questions found matching "{searchTerm}"</p>
            <button onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}>
              Clear filters
            </button>
          </div>
        )}

        {/* Still Have Questions */}
        <div className="still-have-questions">
          <h3>Still have questions?</h3>
          <p>Can't find the answer you're looking for? Please contact our support team.</p>
          <div className="contact-options">
            <a href={`https://wa.me/${COMPANY.whatsapp}`} target="_blank" rel="noopener noreferrer" className="contact-whatsapp">
              <FaWhatsapp /> WhatsApp Support
            </a>
            <a href={`mailto:${COMPANY.email}`} className="contact-email">
              <FaEnvelope /> Email Support
            </a>
            <a href={`tel:${COMPANY.phone}`} className="contact-phone">
              <FaPhoneAlt /> Call Support
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="quick-links">
          <h3>Quick Links</h3>
          <div className="links-grid">
            <Link to="/become-agent" className="quick-link">
              <FaStore /> Become an Agent
            </Link>
            <Link to="/dashboard" className="quick-link">
              <FaMoneyBillWave /> Buy Data
            </Link>
            <Link to="/support" className="quick-link">
              <FaShieldAlt /> Support Center
            </Link>
            <Link to="/terms" className="quick-link">
              <FaRocket /> Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}