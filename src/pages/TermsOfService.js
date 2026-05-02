// src/pages/TermsOfService.js
import React from 'react';
import { motion } from 'framer-motion';
import { FaFileContract, FaGavel, FaMoneyBillWave, FaShieldAlt, FaUserCheck, FaClock } from 'react-icons/fa';

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

export default function TermsOfService() {
  const effectiveDate = 'April 20, 2026';

  return (
    <motion.div 
      className="static-page legal-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="container">
        <div className="legal-header">
          <h1><FaFileContract /> Terms of Service</h1>
          <p>Effective Date: {effectiveDate}</p>
          <p className="company-name">{COMPANY.name}</p>
        </div>

        <div className="legal-content">
          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing or using {COMPANY.name} ("we", "our", "us", "the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
            <p>These terms apply to all users, including customers, agents, and visitors.</p>
          </section>

          <section>
            <h2>2. Description of Services</h2>
            <p>{COMPANY.name} provides digital services including but not limited to:</p>
            <ul>
              <li>📱 Mobile data bundle purchases and delivery</li>
              <li>🎓 WAEC result checker vouchers</li>
              <li>💡 Bill payments (electricity, water, TV, etc.)</li>
              <li>🤝 Agent program for reselling services</li>
              <li>💰 Wallet funding and withdrawals</li>
            </ul>
          </section>

          <section>
            <h2><FaUserCheck /> 3. User Accounts</h2>
            <p><strong>3.1 Account Registration:</strong> To use our services, you must register an account with accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials.</p>
            <p><strong>3.2 Account Security:</strong> You are responsible for all activities that occur under your account. Notify us immediately of any unauthorized access.</p>
            <p><strong>3.3 Eligibility:</strong> You must be at least 18 years old to register an account. By using our services, you represent that you meet this requirement.</p>
            <p><strong>3.4 Account Suspension:</strong> We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activity.</p>
          </section>

          <section>
            <h2><FaMoneyBillWave /> 4. Purchases and Payments</h2>
            <p><strong>4.1 Data Bundles:</strong> All data bundle purchases are final upon delivery. Refunds are only issued if delivery fails.</p>
            <p><strong>4.2 Delivery Time:</strong> Data bundles are delivered within 2 seconds of payment confirmation. If delivery exceeds 5 minutes, please contact support.</p>
            <p><strong>4.3 Payment Methods:</strong> We accept Mobile Money (MTN MoMo, Telecel Cash, AirtelTigo Cash) and card payments via secure payment gateways.</p>
            <p><strong>4.4 Pricing:</strong> All prices are in Ghana Cedis (GHS). Prices are subject to change without notice.</p>
            <p><strong>4.5 Refunds:</strong> Refunds are processed within 24 hours for failed deliveries. To request a refund, contact support with your order ID.</p>
          </section>

          <section>
            <h2><FaGavel /> 5. Agent Program Terms</h2>
            <p><strong>5.1 Agent Registration:</strong> To become an agent, you must pay the one-time registration fee of ₵100 and complete the application process.</p>
            <p><strong>5.2 Commission Structure:</strong> Agents earn commissions based on their sales volume:</p>
            <ul>
              <li>Bronze (0 - ₵500 sales): 10% commission</li>
              <li>Silver (₵500 - ₵2,000 sales): 15% commission</li>
              <li>Gold (₵2,000 - ₵10,000 sales): 20% commission</li>
              <li>Platinum (₵10,000+ sales): 25% commission</li>
            </ul>
            <p><strong>5.3 Withdrawals:</strong> Agents can request withdrawals of their earnings with a minimum of ₵50. Withdrawals are processed within 24 hours to registered mobile money numbers.</p>
            <p><strong>5.4 Agent Store:</strong> Agents receive a branded online store. You are responsible for the content and pricing in your store.</p>
            <p><strong>5.5 Termination:</strong> We reserve the right to terminate agent accounts that violate these terms or engage in fraudulent activity.</p>
          </section>

          <section>
            <h2><FaShieldAlt /> 6. User Conduct and Prohibited Activities</h2>
            <p>You agree not to:</p>
            <ul>
              <li>❌ Use our services for any illegal purpose</li>
              <li>❌ Attempt to hack, disrupt, or overload our systems</li>
              <li>❌ Resell data bundles without proper agent registration</li>
              <li>❌ Use automated scripts or bots to interact with our platform</li>
              <li>❌ Provide false or misleading information</li>
              <li>❌ Interfere with other users' access to our services</li>
              <li>❌ Reverse engineer or copy our platform code</li>
            </ul>
          </section>

          <section>
            <h2>7. Service Availability and Modifications</h2>
            <p>We strive to provide 24/7 service availability. However, we may experience downtime due to maintenance, technical issues, or external factors. We are not liable for service interruptions.</p>
            <p>We reserve the right to modify, suspend, or discontinue any part of our services without prior notice.</p>
          </section>

          <section>
            <h2><FaClock /> 8. Cancellation and Refund Policy</h2>
            <p><strong>8.1 Order Cancellation:</strong> Once payment is confirmed, data bundles are delivered instantly and cannot be cancelled. WAEC voucher purchases are non-refundable after delivery.</p>
            <p><strong>8.2 Failed Deliveries:</strong> If a data bundle fails to deliver, you are entitled to a full refund or credit to your wallet.</p>
            <p><strong>8.3 Refund Process:</strong> Refund requests must be submitted within 24 hours of purchase. Contact support with your order ID.</p>
          </section>

          <section>
            <h2>9. Intellectual Property</h2>
            <p>All content on {COMPANY.website}, including logos, trademarks, text, graphics, and software, is the property of {COMPANY.name} and protected by Ghanaian and international copyright laws.</p>
            <p>You may not copy, distribute, or create derivative works without our express written permission.</p>
          </section>

          <section>
            <h2>10. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, {COMPANY.name} shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services.</p>
            <p>Our total liability shall not exceed the amount you paid for the specific service giving rise to the claim.</p>
          </section>

          <section>
            <h2>11. Disclaimer of Warranties</h2>
            <p>Our services are provided "as is" without warranties of any kind. We do not guarantee that our services will be uninterrupted, error-free, or secure.</p>
            <p>We are not responsible for network delays, delivery failures caused by telecom providers, or issues beyond our control.</p>
          </section>

          <section>
            <h2>12. Indemnification</h2>
            <p>You agree to indemnify and hold {COMPANY.name} harmless from any claims, damages, losses, or expenses arising from your violation of these terms or use of our services.</p>
          </section>

          <section>
            <h2>13. Governing Law</h2>
            <p>These terms shall be governed by and construed in accordance with the laws of the Republic of Ghana. Any disputes shall be resolved in the courts of Accra, Ghana.</p>
          </section>

          <section>
            <h2>14. Changes to Terms</h2>
            <p>We may update these Terms of Service from time to time. We will notify users of material changes via email or website notification. Your continued use of our services constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2>15. Termination</h2>
            <p>We may terminate or suspend your account immediately without notice for conduct that violates these terms or is harmful to other users or our platform.</p>
            <p>Upon termination, your right to use our services will cease immediately. Any pending withdrawals will be processed, but future access will be denied.</p>
          </section>

          <section>
            <h2>16. Contact Information</h2>
            <div className="contact-info">
              <p><strong>{COMPANY.name}</strong></p>
              <p>Email: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></p>
              <p>Phone: {COMPANY.phone}</p>
              <p>Website: <a href={COMPANY.website}>{COMPANY.website}</a></p>
              <p>Address: {COMPANY.address}</p>
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