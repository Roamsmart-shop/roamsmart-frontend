// src/pages/PrivacyPolicy.js
import React from 'react';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaLock, FaDatabase, FaEnvelope, FaPhoneAlt, FaGlobe } from 'react-icons/fa';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  phone: '0557388622',
  website: 'https://roamsmart.shop',
  address: 'Accra, Ghana',
  year: new Date().getFullYear()
};

export default function PrivacyPolicy() {
  const lastUpdated = 'April 20, 2026';

  return (
    <motion.div 
      className="static-page legal-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="container">
        <div className="legal-header">
          <h1><FaShieldAlt /> Privacy Policy</h1>
          <p>Last Updated: {lastUpdated}</p>
          <p className="company-name">{COMPANY.name}</p>
        </div>

        <div className="legal-content">
          <section>
            <h2>1. Introduction</h2>
            <p>Welcome to {COMPANY.name} ("we", "our", "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.</p>
            <p>By using {COMPANY.name}, you agree to the collection and use of information in accordance with this policy.</p>
          </section>

          <section>
            <h2><FaLock /> 2. Information We Collect</h2>
            <p>We collect personal information that you voluntarily provide to us when you:</p>
            <ul>
              <li><strong>Register an account:</strong> Name, email address, phone number, username, password</li>
              <li><strong>Make a purchase:</strong> Phone number for data delivery, payment information (processed securely through third-party payment gateways)</li>
              <li><strong>Become an agent:</strong> Additional information for KYC verification</li>
              <li><strong>Contact support:</strong> Communication history and details</li>
              <li><strong>Use our services:</strong> Transaction history, IP address, device information, browser type</li>
            </ul>
          </section>

          <section>
            <h2><FaDatabase /> 3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>✓ Create and manage your account on {COMPANY.shortName}</li>
              <li>✓ Process your data bundle, WAEC voucher, and bill payment orders</li>
              <li>✓ Send you order confirmations and delivery notifications via SMS and email</li>
              <li>✓ Process agent applications and pay commissions</li>
              <li>✓ Provide customer support and respond to your inquiries</li>
              <li>✓ Improve our services and user experience</li>
              <li>✓ Detect and prevent fraud and security incidents</li>
              <li>✓ Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2>4. Information Sharing and Disclosure</h2>
            <p>We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:</p>
            <ul>
              <li><strong>Service Providers:</strong> We share information with third-party payment processors (Paystack, mobile money providers) to complete transactions</li>
              <li><strong>Network Providers:</strong> To deliver data bundles, we share the recipient's phone number with telecom networks (MTN, Telecel, AirtelTigo)</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In the event of a merger or acquisition, your information may be transferred</li>
            </ul>
          </section>

          <section>
            <h2>5. Data Security</h2>
            <p>We implement industry-standard security measures to protect your personal information:</p>
            <ul>
              <li>🔒 SSL/TLS encryption for all data transmission</li>
              <li>🔒 Secure database storage with access controls</li>
              <li>🔒 Regular security audits and vulnerability assessments</li>
              <li>🔒 Two-factor authentication for administrative accounts</li>
              <li>🔒 Encrypted passwords using bcrypt hashing</li>
            </ul>
            <p>While we strive to protect your information, no method of transmission over the internet is 100% secure.</p>
          </section>

          <section>
            <h2>6. Data Retention</h2>
            <p>We retain your personal information for as long as your account is active or as needed to provide services. We may retain certain information for legal compliance, fraud prevention, and record-keeping purposes. Transaction records are kept for 7 years as required by Ghanaian financial regulations.</p>
          </section>

          <section>
            <h2>7. Your Rights</h2>
            <p>You have the following rights regarding your personal information:</p>
            <ul>
              <li>✅ <strong>Access:</strong> Request a copy of your personal data</li>
              <li>✅ <strong>Correction:</strong> Update or correct inaccurate information</li>
              <li>✅ <strong>Deletion:</strong> Request deletion of your account and data</li>
              <li>✅ <strong>Restriction:</strong> Limit how we use your information</li>
              <li>✅ <strong>Portability:</strong> Receive your data in a structured format</li>
              <li>✅ <strong>Objection:</strong> Object to certain data processing</li>
            </ul>
            <p>To exercise these rights, contact us at {COMPANY.email}.</p>
          </section>

          <section>
            <h2>8. Cookies and Tracking Technologies</h2>
            <p>We use cookies and similar tracking technologies to enhance your experience on our website. Cookies help us:</p>
            <ul>
              <li>📊 Remember your login session</li>
              <li>📊 Analyze website traffic and usage</li>
              <li>📊 Personalize your experience</li>
            </ul>
            <p>You can control cookie settings through your browser preferences.</p>
          </section>

          <section>
            <h2>9. Third-Party Links</h2>
            <p>Our website may contain links to third-party websites. We are not responsible for the privacy practices of these sites. We encourage you to read their privacy policies.</p>
          </section>

          <section>
            <h2>10. Children's Privacy</h2>
            <p>Our services are not directed to individuals under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us.</p>
          </section>

          <section>
            <h2>11. International Data Transfers</h2>
            <p>Your information may be transferred to and processed in countries other than Ghana. We ensure appropriate safeguards are in place for such transfers.</p>
          </section>

          <section>
            <h2>12. Changes to This Privacy Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date. For significant changes, we may provide additional notice via email or website notification.</p>
          </section>

          <section>
            <h2><FaEnvelope /> 13. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or our data practices, please contact us:</p>
            <div className="contact-info">
              <p><strong>{COMPANY.name}</strong></p>
              <p><FaEnvelope /> Email: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></p>
              <p><FaPhoneAlt /> Phone: {COMPANY.phone}</p>
              <p><FaGlobe /> Website: <a href={COMPANY.website}>{COMPANY.website}</a></p>
              <p><strong>Address:</strong> {COMPANY.address}</p>
            </div>
          </section>

          <div className="legal-footer">
            <p>© {COMPANY.year} {COMPANY.name}. All rights reserved.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}