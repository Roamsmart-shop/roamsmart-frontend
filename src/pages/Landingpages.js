// src/pages/Landingpages.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useAnimation, useInView } from 'framer-motion';
import { 
  FaBolt, FaShieldAlt, FaChartLine, FaHeadset, FaSignal, 
  FaMobileAlt, FaCheckCircle, FaClock, FaUsers, FaStar,
  FaWhatsapp, FaTelegram, FaFacebook, FaTwitter, FaInstagram,
  FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaArrowRight,
  FaGift, FaWallet, FaShoppingCart, FaTrophy, FaMedal,
  FaRocket, FaGem, FaCrown, FaAward, FaThumbsUp, FaHeart,
  FaRegSmile, FaRegClock, FaRegCreditCard, FaRegCheckCircle,
  FaNetworkWired, FaCloudUploadAlt, FaDatabase, FaLock,
  FaUserPlus, FaMoneyBillWave, FaPercentage, FaInfinity,
  FaBullhorn, FaSpinner
} from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  phone: '+233 55 738 8622',
  address: 'Accra, Ghana',
  website: 'https://roamsmart.shop',
  supportWhatsapp: '233557388622',
  year: new Date().getFullYear()
};

// African Testimonials (will be used as fallback if API fails)
const DEFAULT_TESTIMONIALS = [
  { 
    id: 1,
    name: 'Kwame Mensah', 
    role: 'Agent - Kumasi', 
    text: 'Roamsmart has transformed my business! I make over GHS 3,000 monthly selling data bundles. The platform is reliable and support is excellent.', 
    rating: 5, 
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    location: 'Ashanti Region'
  },
  { 
    id: 2,
    name: 'Adjoa Serwaa', 
    role: 'Customer - Accra', 
    text: 'Instant delivery every single time! I buy all my data from Roamsmart. Best prices in Ghana.', 
    rating: 5, 
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    location: 'Greater Accra'
  },
  { 
    id: 3,
    name: 'Michael Osei Tutu', 
    role: 'Agent - Tema', 
    text: 'The commission rates are unbeatable. I\'ve built a thriving business with Roamsmart. My customers love the fast service.', 
    rating: 5, 
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    location: 'Greater Accra'
  },
  { 
    id: 4,
    name: 'Esi Addo', 
    role: 'Student - Cape Coast', 
    text: 'As a student, I appreciate the affordable data bundles. The WAEC voucher service also helped me register for my exams.', 
    rating: 4, 
    avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
    location: 'Central Region'
  },
  { 
    id: 5,
    name: 'Dr. Kofi Annan', 
    role: 'Business Owner - Takoradi', 
    text: 'Professional platform with great customer service. I recommend Roamsmart to all my business associates.', 
    rating: 5, 
    avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
    location: 'Western Region'
  },
  { 
    id: 6,
    name: 'Ama Darkoa', 
    role: 'Agent - Tamale', 
    text: 'The wholesale prices allow me to offer competitive rates to my customers. My business has grown 200% since joining Roamsmart.', 
    rating: 5, 
    avatar: 'https://randomuser.me/api/portraits/women/6.jpg',
    location: 'Northern Region'
  }
];

// African FAQs (will be used as fallback if API fails)
const DEFAULT_FAQS = [
  { id: 1, question: 'How fast is delivery?', answer: 'Data bundles are delivered instantly within 2 seconds after successful payment.' },
  { id: 2, question: 'How do I become an agent?', answer: 'Click on "Become an Agent" and follow the registration process. Pay the agent fee and start selling.' },
  { id: 3, question: 'What payment methods are accepted?', answer: 'We accept Mobile Money (MTN, Telecel, AirtelTigo) and Card payments.' },
  { id: 4, question: 'Is my money safe?', answer: 'Yes, we use secure payment gateways and SSL encryption to protect your transactions.' },
  { id: 5, question: 'Can I get a refund?', answer: 'Refunds are processed within 24 hours if the data bundle is not delivered.' },
  { id: 6, question: 'How do I contact support?', answer: `Contact us via WhatsApp at ${COMPANY.phone} or email ${COMPANY.email}.` },
  { id: 7, question: 'What networks do you support?', answer: 'We support MTN, Telecel (formerly Vodafone), and AirtelTigo data bundles.' },
  { id: 8, question: 'Do you offer WAEC vouchers?', answer: 'Yes, we offer WAEC result checker vouchers for WASSCE, BECE, and SHS Placement.' }
];

export default function Landing() {
  const [announcement, setAnnouncement] = useState(null);
  const [stats, setStats] = useState({
    happy_customers: 0,
    success_rate: 99.9,
    avg_delivery: 2,
    active_agents: 0
  });
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [counters, setCounters] = useState({
    customers: 0,
    agents: 0,
    orders: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [testimonials, setTestimonials] = useState(DEFAULT_TESTIMONIALS);
  const [faqs, setFaqs] = useState(DEFAULT_FAQS);

  // Animation refs
  const featuresRef = React.useRef(null);
  const statsRef = React.useRef(null);
  const featuresInView = useInView(featuresRef, { once: true });
  const statsInView = useInView(statsRef, { once: true });

  // Fetch live data from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchAnnouncement(),
        fetchLiveStats(),
        fetchTestimonials(),
        fetchFaqs()
      ]);
      setIsLoading(false);
      startCounters();
    };
    fetchData();
  }, []);

  const fetchAnnouncement = async () => {
    try {
      const res = await api.get('/announcement/active');
      if (res.data?.data) {
        setAnnouncement(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch announcement');
    }
  };

  const fetchLiveStats = async () => {
    try {
      const res = await api.get('/public/stats');
      if (res.data?.data) {
        setStats(prev => ({ ...prev, ...res.data.data }));
      }
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchTestimonials = async () => {
    try {
      const res = await api.get('/public/testimonials');
      if (res.data?.data && res.data.data.length > 0) {
        setTestimonials(res.data.data);
      }
    } catch (error) {
      // Keep default testimonials
      console.log('Using default testimonials');
    }
  };

  const fetchFaqs = async () => {
    try {
      const res = await api.get('/public/faqs');
      if (res.data?.data && res.data.data.length > 0) {
        setFaqs(res.data.data);
      }
    } catch (error) {
      // Keep default FAQs
      console.log('Using default FAQs');
    }
  };

  const startCounters = () => {
    const targetCustomers = stats.happy_customers || 50000;
    const targetAgents = stats.active_agents || 250;
    const targetOrders = 150000;
    
    const animateValue = (start, end, duration, setter) => {
      const increment = (end - start) / (duration / 16);
      let current = start;
      const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
          setter(end);
          clearInterval(timer);
        } else {
          setter(Math.floor(current));
        }
      }, 16);
    };

    setTimeout(() => {
      animateValue(0, targetCustomers, 2000, (val) => setCounters(prev => ({ ...prev, customers: val })));
      animateValue(0, targetAgents, 2000, (val) => setCounters(prev => ({ ...prev, agents: val })));
      animateValue(0, targetOrders, 2000, (val) => setCounters(prev => ({ ...prev, orders: val })));
    }, 500);
  };

  const handleNewsletterSubscribe = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    setSubscribing(true);
    try {
      await api.post('/newsletter/subscribe', { email });
      toast.success(`Subscribed successfully! Check ${email} for updates.`);
      setEmail('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Subscription failed. Try again.');
    } finally {
      setSubscribing(false);
    }
  };

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const features = [
    { icon: <FaBolt />, title: 'Instant Delivery', description: 'Get your data bundles instantly after payment', color: '#8B0000' },
    { icon: <FaShieldAlt />, title: 'Secure & Reliable', description: 'Enterprise-grade security for all transactions', color: '#D2691E' },
    { icon: <FaChartLine />, title: 'Become an Agent', description: 'Earn competitive commissions on every sale', color: '#28a745' },
    { icon: <FaHeadset />, title: '24/7 Support', description: `Contact us at ${COMPANY.email}`, color: '#17a2b8' },
    { icon: <FaWallet />, title: 'Easy Payments', description: 'Mobile Money & Card payments accepted', color: '#6f42c1' },
    { icon: <FaGift />, title: 'Rewards Program', description: 'Earn points on every purchase', color: '#fd7e14' }
  ];

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading {COMPANY.name}...</p>
      </div>
    );
  }

  return (
    <div className="landing-page">
      
      {/* ========== ANNOUNCEMENT BANNER ========== */}
      {announcement && announcement.is_active && (
        <motion.div 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className={`announcement-top ${announcement.type || 'info'}`}
        >
          <div className="announcement-content">
            <FaBullhorn />
            <span>{announcement.message}</span>
            {announcement.network_affected && announcement.network_affected !== 'all' && (
              <span className="network-tag">{announcement.network_affected.toUpperCase()} Network</span>
            )}
          </div>
        </motion.div>
      )}

      {/* ========== HERO SECTION ========== */}
      <section className="hero-section">
        <div className="hero-bg"></div>
        <div className="container">
          <div className="hero-grid">
            <motion.div 
              className="hero-content"
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
            >
              <div className="hero-badge">
                <FaRocket /> Ghana's Leading Digital Service Platform
              </div>
              <h1>
                Smart Digital Services, <br />
                <span className="gradient-text">Simpler Life</span>
              </h1>
              <p>
                Get instant data bundles, WAEC vouchers, bill payments, and more with lightning-fast delivery. 
                Join thousands of satisfied customers across Ghana.
              </p>
              
              <div className="hero-stats">
                <div className="hero-stat">
                  <span className="stat-number">{counters.customers.toLocaleString()}+</span>
                  <span className="stat-label">Happy Customers</span>
                </div>
                <div className="hero-stat">
                  <span className="stat-number">{stats.success_rate}%</span>
                  <span className="stat-label">Success Rate</span>
                </div>
                <div className="hero-stat">
                  <span className="stat-number">{stats.avg_delivery}s</span>
                  <span className="stat-label">Avg Delivery</span>
                </div>
                <div className="hero-stat">
                  <span className="stat-number">{counters.agents}+</span>
                  <span className="stat-label">Active Agents</span>
                </div>
              </div>

              <div className="hero-buttons">
                <Link to="/register" className="btn-primary btn-large">
                  Get Started <FaArrowRight />
                </Link>
                <Link to="/login" className="btn-outline btn-large">
                  Login
                </Link>
              </div>

              <div className="trust-badges">
                <span><FaLock /> Secure Payments</span>
                <span><FaCheckCircle /> Instant Delivery</span>
                <span><FaHeadset /> 24/7 Support</span>
              </div>
            </motion.div>

            <motion.div 
              className="hero-image"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              <div className="phone-mockup">
                <div className="phone-screen">
                  <div className="app-preview">
                    <div className="preview-header">
                      <FaMobileAlt />
                      <span>Roamsmart</span>
                    </div>
                    <div className="preview-bundle">
                      <div className="bundle">MTN 10GB</div>
                      <div className="price">₵38</div>
                    </div>
                    <div className="preview-bundle">
                      <div className="bundle">Telecel 5GB</div>
                      <div className="price">₵19</div>
                    </div>
                    <div className="preview-button">Buy Now</div>
                  </div>
                </div>
              </div>
              <div className="floating-elements">
                <div className="floating-card card-1"><FaWallet /> Wallet: ₵100</div>
                <div className="floating-card card-2"><FaCheckCircle /> Order #1234</div>
                <div className="floating-card card-3"><FaBolt /> Instant Delivery</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== SUPPORTED NETWORKS ========== */}
      <section className="networks-section">
        <div className="container">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Supported Networks
          </motion.h2>
          <motion.div 
            className="networks-grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="network-card">
              <FaSignal className="network-icon" />
              <h3>MTN</h3>
              <p>All bundles available</p>
            </div>
            <div className="network-card">
              <FaSignal className="network-icon" />
              <h3>Telecel</h3>
              <p>All bundles available</p>
            </div>
            <div className="network-card">
              <FaSignal className="network-icon" />
              <h3>AirtelTigo</h3>
              <p>All bundles available</p>
            </div>
            <div className="network-card">
              <FaNetworkWired className="network-icon" />
              <h3>eSIM Coming Soon</h3>
              <p>International roaming</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== FEATURES SECTION ========== */}
      <section className="features-section" ref={featuresRef}>
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2>Why Choose <span className="gradient-text">Roamsmart</span>?</h2>
            <p>We provide the best digital service experience in Ghana</p>
          </motion.div>

          <motion.div 
            className="features-grid"
            variants={staggerContainer}
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
          >
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                className="feature-card"
                variants={fadeInUp}
                whileHover={{ y: -10, transition: { duration: 0.2 } }}
              >
                <div className="feature-icon" style={{ background: `${feature.color}20`, color: feature.color }}>
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========== STATS COUNTER SECTION ========== */}
      <section className="stats-section" ref={statsRef}>
        <div className="container">
          <motion.div 
            className="stats-grid"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={statsInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="stat-item">
              <div className="stat-icon"><FaUsers /></div>
              <div className="stat-number">{counters.customers.toLocaleString()}+</div>
              <div className="stat-label">Happy Customers</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon"><FaShoppingCart /></div>
              <div className="stat-number">{counters.orders.toLocaleString()}+</div>
              <div className="stat-label">Orders Completed</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon"><FaUserPlus /></div>
              <div className="stat-number">{counters.agents}+</div>
              <div className="stat-label">Active Agents</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon"><FaDatabase /></div>
              <div className="stat-number">500K+</div>
              <div className="stat-label">GB Data Sold</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>How <span className="gradient-text">It Works</span></h2>
            <p>Get started in 3 simple steps</p>
          </div>
          <div className="steps-grid">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-icon"><FaUserPlus /></div>
              <h3>Create Account</h3>
              <p>Sign up for free in seconds</p>
            </div>
            <div className="step-arrow"><FaArrowRight /></div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-icon"><FaWallet /></div>
              <h3>Fund Wallet</h3>
              <p>Add money via Mobile Money or Card</p>
            </div>
            <div className="step-arrow"><FaArrowRight /></div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-icon"><FaMobileAlt /></div>
              <h3>Buy Services</h3>
              <p>Get instant delivery to any number</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== AGENT SECTION ========== */}
      <section className="agent-section">
        <div className="container">
          <div className="agent-grid">
            <motion.div 
              className="agent-content"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="agent-badge">
                <FaCrown /> Earn More
              </div>
              <h2>Become a <span className="gradient-text">Roamsmart Agent</span></h2>
              <p>Join our agent network and earn competitive commissions on every sale. Perfect for small business owners, students, and entrepreneurs.</p>
              
              <div className="agent-benefits">
                <div><FaCheckCircle /> Competitive commission rates</div>
                <div><FaCheckCircle /> Wholesale pricing</div>
                <div><FaCheckCircle /> Your own store page</div>
                <div><FaCheckCircle /> Withdraw anytime</div>
              </div>

              <Link to="/become-agent" className="btn-primary btn-large">
                Become an Agent <FaArrowRight />
              </Link>
            </motion.div>

            <motion.div 
              className="agent-stats"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="agent-card">
                <div className="agent-earning">
                  <span>Average Agent Monthly Earnings</span>
                  <strong>₵2,500+</strong>
                </div>
                <div className="agent-commission">
                  <span>Commission Rate</span>
                  <strong>Up to 25%</strong>
                </div>
                <div className="agent-agents">
                  <span>Active Agents</span>
                  <strong>{counters.agents}+</strong>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS SECTION ========== */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2>What Our <span className="gradient-text">Customers Say</span></h2>
            <p>Join thousands of satisfied customers across Ghana</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.slice(0, 6).map((testimonial, index) => (
              <motion.div 
                key={testimonial.id || index}
                className="testimonial-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="testimonial-header">
                  <img 
                    src={testimonial.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name || 'Customer')}&background=8B0000&color=fff&size=80`} 
                    alt={testimonial.name}
                  />
                  <div>
                    <h4>{testimonial.name}</h4>
                    <p className="testimonial-role">{testimonial.role}</p>
                    {testimonial.location && (
                      <p className="testimonial-location">
                        <FaMapMarkerAlt size={10} /> {testimonial.location}
                      </p>
                    )}
                  </div>
                </div>
                <div className="testimonial-rating">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className={i < (testimonial.rating || 5) ? 'star-filled' : 'star-empty'} />
                  ))}
                </div>
                <p className="testimonial-text">"{testimonial.text}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FAQ SECTION ========== */}
      <section className="faq-section">
        <div className="container">
          <div className="section-header">
            <h2>Frequently Asked <span className="gradient-text">Questions</span></h2>
            <p>Everything you need to know about Roamsmart</p>
          </div>
          <div className="faq-grid">
            {faqs.slice(0, 8).map((faq, index) => (
              <motion.div 
                key={faq.id || index}
                className="faq-item"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <div className="faq-question">
                  <span className="faq-icon">Q</span>
                  <h3>{faq.question}</h3>
                </div>
                <div className="faq-answer">
                  <span className="faq-answer-icon">A</span>
                  <p>{faq.answer}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== NEWSLETTER SECTION ========== */}
      <section className="newsletter-section">
        <div className="container">
          <motion.div 
            className="newsletter-card"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="newsletter-content">
              <h2>Stay Updated</h2>
              <p>Subscribe to our newsletter for exclusive offers and updates</p>
              <div className="newsletter-form">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button onClick={handleNewsletterSubscribe} disabled={subscribing}>
                  {subscribing ? <FaSpinner className="spinning" /> : 'Subscribe'}
                </button>
              </div>
              <div className="social-links">
                <a href={`https://wa.me/${COMPANY.supportWhatsapp}`} target="_blank" rel="noopener noreferrer"><FaWhatsapp /></a>
                <a href="https://facebook.com/roamsmart" target="_blank" rel="noopener noreferrer"><FaFacebook /></a>
                <a href="https://twitter.com/roamsmart" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
                <a href="https://instagram.com/roamsmart" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
                <a href="https://t.me/roamsmart" target="_blank" rel="noopener noreferrer"><FaTelegram /></a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="logo">
                <span className="logo-icon">🚀</span>
                <span className="logo-text">Roamsmart<span>Digital Service</span></span>
              </div>
              <p>Ghana's leading digital service platform for instant data bundles, bill payments, and more.</p>
              <div className="footer-contact">
                <p><FaPhoneAlt /> {COMPANY.phone}</p>
                <p><FaEnvelope /> {COMPANY.email}</p>
                <p><FaMapMarkerAlt /> {COMPANY.address}</p>
              </div>
            </div>
            <div className="footer-links">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/dashboard">Dashboard</Link></li>
                <li><Link to="/become-agent">Become Agent</Link></li>
                <li><Link to="/support">Support</Link></li>
              </ul>
            </div>
            <div className="footer-links">
              <h4>Resources</h4>
              <ul>
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms of Service</Link></li>
                <li><Link to="/refund">Refund Policy</Link></li>
                <li><Link to="/faq">FAQ</Link></li>
              </ul>
            </div>
            <div className="footer-app">
              <h4>Download App</h4>
              <p>Coming soon to Google Play and App Store</p>
              <div className="app-badges">
                <div className="app-badge">Google Play</div>
                <div className="app-badge">App Store</div>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {COMPANY.year} {COMPANY.name}. All rights reserved.</p>
            <div className="payment-methods">
              <span>MTN MoMo</span>
              <span>Telecel Cash</span>
              <span>AirtelTigo Cash</span>
              <span>Card</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}