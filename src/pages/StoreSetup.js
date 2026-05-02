// src/pages/StoreSetup.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaStore, FaSave, FaCopy, FaCheck, FaWhatsapp, FaTelegram, FaShareAlt, FaEye, FaQrcode } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  website: 'https://roamsmart.shop',
  email: 'support@roamsmart.shop',
  phone: '0557388622'
};

export default function StoreSetup() {
  const [store, setStore] = useState({
    store_name: '',
    store_slug: '',
    contact_phone: '',
    contact_email: '',
    store_description: '',
    markup: 15,
    logo_url: '',
    theme_color: '#8B0000'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewMarkup, setPreviewMarkup] = useState(15);

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    try {
      const res = await api.get('/agent/store');
      if (res.data.data) {
        setStore(res.data.data);
        setPreviewMarkup(res.data.data.markup || 15);
      }
    } catch (error) {
      console.error('No store found');
    } finally {
      setLoading(false);
    }
  };

  const validateSlug = (slug) => {
    return /^[a-z0-9-]+$/.test(slug);
  };

  const saveStore = async () => {
    if (!store.store_name.trim()) {
      toast.error('Store name is required');
      return;
    }
    if (!store.store_slug.trim()) {
      toast.error('Store URL slug is required');
      return;
    }
    if (!validateSlug(store.store_slug)) {
      toast.error('Store slug can only contain lowercase letters, numbers, and hyphens');
      return;
    }
    if (!store.contact_phone) {
      toast.error('Contact phone number is required');
      return;
    }

    setSaving(true);
    try {
      await api.post('/agent/store', store);
      toast.success(`${COMPANY.shortName} store saved successfully!`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save store');
    } finally {
      setSaving(false);
    }
  };

  const copyStoreLink = () => {
    const link = `${COMPANY.website}/store/${store.store_slug}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success(`${COMPANY.shortName} store link copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareStoreWhatsApp = () => {
    const link = `${COMPANY.website}/store/${store.store_slug}`;
    const message = `🛍️ *Welcome to my ${COMPANY.shortName} Store!* 🛍️\n\n📱 ${store.store_name}\n${store.store_description || 'Buy data bundles, WAEC vouchers, and more!'}\n\n🔗 Visit: ${link}\n\n✅ Instant Delivery | 💰 Best Prices | 🔒 Secure Payments\n\nPowered by ${COMPANY.name}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareStoreTelegram = () => {
    const link = `${COMPANY.website}/store/${store.store_slug}`;
    const message = `🛍️ Welcome to my ${COMPANY.shortName} Store!\n\n${store.store_name}\n${link}\n\nBuy data bundles instantly!`;
    window.open(`https://t.me/share/url?url=${link}&text=${encodeURIComponent(message)}`, '_blank');
  };

  const getStoreUrl = () => {
    return store.store_slug ? `${COMPANY.website}/store/${store.store_slug}` : `${COMPANY.website}/store/your-store`;
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading {COMPANY.shortName} store setup...</p>
    </div>
  );

  return (
    <motion.div 
      className="store-setup-page" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <div>
          <h1><FaStore /> Roamsmart Store Setup</h1>
          <p>Configure your reseller store information and branding</p>
        </div>
      </div>

      <div className="store-form-container">
        <div className="store-form">
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label>Store Name *</label>
              <input 
                type="text" 
                value={store.store_name}
                onChange={(e) => setStore({...store, store_name: e.target.value})}
                placeholder="My Awesome Store"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Store URL Slug *</label>
              <div className="slug-input">
                <span className="slug-prefix">{COMPANY.website}/store/</span>
                <input 
                  type="text" 
                  value={store.store_slug}
                  onChange={(e) => setStore({...store, store_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
                  placeholder="my-awesome-store"
                  className="form-control"
                />
              </div>
              <small>This will be your unique Roamsmart store URL</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Contact Number *</label>
                <input 
                  type="tel" 
                  value={store.contact_phone}
                  onChange={(e) => setStore({...store, contact_phone: e.target.value})}
                  placeholder="024XXXXXXX"
                  className="form-control"
                />
                <small>Customers will see this on your store</small>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={store.contact_email}
                  onChange={(e) => setStore({...store, contact_email: e.target.value})}
                  placeholder="store@example.com"
                  className="form-control"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Store Appearance</h3>
            
            <div className="form-group">
              <label>Store Description</label>
              <textarea 
                value={store.store_description}
                onChange={(e) => setStore({...store, store_description: e.target.value})}
                placeholder="Tell customers about your Roamsmart store..."
                className="form-control"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label>Your Markup (%)</label>
              <input 
                type="number" 
                value={store.markup}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setStore({...store, markup: val});
                  setPreviewMarkup(val);
                }}
                placeholder="15"
                className="form-control"
                min="0"
                max="100"
              />
              <small>You earn {previewMarkup}% profit on every sale through your Roamsmart store</small>
            </div>
          </div>

          <div className="form-actions">
            <button onClick={saveStore} className="btn-primary" disabled={saving}>
              <FaSave /> {saving ? 'Saving to Roamsmart...' : 'Save Store Settings'}
            </button>
          </div>

          {store.store_slug && (
            <div className="store-link-section">
              <h3>Your Roamsmart Store URL</h3>
              <div className="link-box">
                <code>{getStoreUrl()}</code>
                <button onClick={copyStoreLink} className="copy-btn">
                  {copied ? <FaCheck /> : <FaCopy />}
                </button>
              </div>
              
              <div className="share-buttons">
                <button onClick={shareStoreWhatsApp} className="btn-whatsapp btn-sm">
                  <FaWhatsapp /> Share on WhatsApp
                </button>
                <button onClick={shareStoreTelegram} className="btn-telegram btn-sm">
                  <FaTelegram /> Share on Telegram
                </button>
                <button onClick={copyStoreLink} className="btn-outline btn-sm">
                  <FaShareAlt /> Copy Link
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="store-preview">
          <h3><FaEye /> Live Preview</h3>
          <div className="preview-card">
            <div className="preview-header" style={{ backgroundColor: store.theme_color || '#8B0000', color: 'white' }}>
              <span>🏪 {store.store_name || 'Your Store Name'}</span>
            </div>
            <div className="preview-body">
              <p>{store.store_description || 'Your store description will appear here...'}</p>
              <div className="preview-contact">📞 {store.contact_phone || '024XXXXXXX'}</div>
              {store.contact_email && <div className="preview-contact">✉️ {store.contact_email}</div>}
              <div className="preview-markup">
                <span className="badge">Your Profit: {previewMarkup}% on every sale</span>
              </div>
              <div className="preview-products">
                <div className="preview-product">MTN 10GB - ₵{store.markup ? (30 * (1 + store.markup / 100)).toFixed(2) : '34.50'}</div>
                <div className="preview-product">Telecel 5GB - ₵{store.markup ? (15.5 * (1 + store.markup / 100)).toFixed(2) : '17.83'}</div>
              </div>
            </div>
            <div className="preview-footer">
              <small>Powered by {COMPANY.name}</small>
            </div>
          </div>
          
          <div className="preview-note">
            <small>💡 Tip: Share your store link on WhatsApp and Telegram to attract more customers!</small>
          </div>
        </div>
      </div>
    </motion.div>
  );
}