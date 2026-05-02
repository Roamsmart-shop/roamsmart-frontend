// src/pages/Webhooks.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlug, FaPlus, FaTrash, FaEdit, FaVial, FaCheckCircle, FaTimesCircle, FaSpinner, FaCopy } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop'
};

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState([]);
  const [newUrl, setNewUrl] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [testing, setTesting] = useState(null);

  const availableEvents = [
    'order.created',
    'order.completed',
    'order.failed',
    'payment.received',
    'payment.verified',
    'agent.approved',
    'withdrawal.processed',
    'wallet.credited'
  ];

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const res = await api.get('/admin/webhooks');
      setWebhooks(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load Roamsmart webhooks');
    } finally {
      setLoading(false);
    }
  };

  const addWebhook = async () => {
    if (!newUrl) {
      toast.error('Please enter webhook URL');
      return;
    }
    if (!newUrl.startsWith('https://')) {
      toast.error('Webhook URL must use HTTPS');
      return;
    }

    try {
      await api.post('/admin/webhooks', { 
        url: newUrl, 
        events: selectedEvents,
        secret: newSecret || undefined
      });
      toast.success(`Webhook added to ${COMPANY.shortName}`);
      setShowAddModal(false);
      setNewUrl('');
      setNewSecret('');
      setSelectedEvents([]);
      fetchWebhooks();
    } catch (error) {
      toast.error('Failed to add webhook');
    }
  };

  const deleteWebhook = async (webhookId, url) => {
    const result = await Swal.fire({
      title: 'Delete Webhook?',
      text: `Are you sure you want to delete webhook for ${url}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/admin/webhooks/${webhookId}`);
      toast.success(`Webhook deleted from ${COMPANY.shortName}`);
      fetchWebhooks();
    } catch (error) {
      toast.error('Failed to delete webhook');
    }
  };

  const testWebhook = async (webhookId, url) => {
    setTesting(webhookId);
    try {
      const res = await api.post(`/admin/webhooks/${webhookId}/test`);
      if (res.data.success) {
        toast.success(`Test webhook sent successfully to ${url}`);
      } else {
        toast.error(`Webhook test failed: ${res.data.message}`);
      }
    } catch (error) {
      toast.error('Failed to test webhook');
    } finally {
      setTesting(null);
    }
  };

  const toggleEvent = (event) => {
    if (selectedEvents.includes(event)) {
      setSelectedEvents(selectedEvents.filter(e => e !== event));
    } else {
      setSelectedEvents([...selectedEvents, event]);
    }
  };

  const copyWebhookUrl = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('Webhook URL copied');
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading {COMPANY.shortName} webhooks...</p>
    </div>
  );

  return (
    <motion.div 
      className="admin-page webhooks-page" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      <div className="page-header">
        <div>
          <h1><FaPlug /> Webhooks</h1>
          <p>Configure webhook endpoints for {COMPANY.name} events</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <FaPlus /> Add Webhook
        </button>
      </div>

      {/* Webhooks Info */}
      <div className="webhooks-info">
        <div className="info-content">
          <FaPlug size={24} />
          <div>
            <h3>About Roamsmart Webhooks</h3>
            <p>Webhooks allow external services to receive real-time notifications when events happen on Roamsmart.</p>
            <p className="text-muted">Events include: order creation, payment confirmation, agent approval, and more.</p>
          </div>
        </div>
      </div>

      {/* Webhooks Table */}
      <div className="webhooks-table-container">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Webhook URL</th>
                <th>Events</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {webhooks.map(webhook => (
                <tr key={webhook.id}>
                  <td className="webhook-url">
                    <code>{webhook.url}</code>
                    <button className="copy-url-btn" onClick={() => copyWebhookUrl(webhook.url)}>
                      <FaCopy />
                    </button>
                  </td>
                  <td>
                    <div className="events-list">
                      {(webhook.events || []).slice(0, 3).map(event => (
                        <span key={event} className="event-tag">{event}</span>
                      ))}
                      {(webhook.events || []).length > 3 && (
                        <span className="event-tag more">+{webhook.events.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${webhook.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {webhook.is_active ? <FaCheckCircle /> : <FaTimesCircle />}
                      {webhook.is_active ? ' Active' : ' Inactive'}
                    </span>
                  </td>
                  <td className="date">{webhook.created_at ? new Date(webhook.created_at).toLocaleDateString() : 'N/A'}</td>
                  <td className="actions">
                    <button 
                      className="btn-info btn-sm" 
                      onClick={() => testWebhook(webhook.id, webhook.url)}
                      disabled={testing === webhook.id}
                      title="Test Webhook"
                    >
                      {testing === webhook.id ? <FaSpinner className="spinning" /> : <FaVial />} Test
                    </button>
                    <button 
                      className="btn-danger btn-sm" 
                      onClick={() => deleteWebhook(webhook.id, webhook.url)}
                      title="Delete Webhook"
                    >
                      <FaTrash /> Delete
                    </button>
                  </td>
                </tr>
              ))}
              {webhooks.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center">
                    No webhooks configured for {COMPANY.shortName}. Click "Add Webhook" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Webhook Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            className="modal-overlay" 
            onClick={() => setShowAddModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content webhook-modal" 
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
            >
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
              
              <h3><FaPlug /> Add Roamsmart Webhook</h3>
              
              <div className="form-group">
                <label>Webhook URL *</label>
                <input 
                  type="url" 
                  className="form-control"
                  placeholder="https://your-server.com/webhook"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
                <small>Must use HTTPS protocol</small>
              </div>
              
              <div className="form-group">
                <label>Secret (Optional)</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Your webhook secret for verification"
                  value={newSecret}
                  onChange={(e) => setNewSecret(e.target.value)}
                />
                <small>Used to verify webhook authenticity</small>
              </div>
              
              <div className="form-group">
                <label>Events to Send</label>
                <div className="events-checkboxes">
                  {availableEvents.map(event => (
                    <label key={event} className="event-checkbox">
                      <input 
                        type="checkbox" 
                        checked={selectedEvents.includes(event)}
                        onChange={() => toggleEvent(event)}
                      />
                      <span>{event}</span>
                    </label>
                  ))}
                </div>
                <small>Select which Roamsmart events trigger this webhook</small>
              </div>
              
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={addWebhook}>Add Webhook to Roamsmart</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Webhook Tips */}
      <div className="webhook-tips">
        <h4>Webhook Tips for Roamsmart</h4>
        <ul>
          <li>✓ Your endpoint should respond with 200 OK within 5 seconds</li>
          <li>✓ Failed deliveries are retried up to 3 times</li>
          <li>✓ Use the secret to verify that requests are from Roamsmart</li>
          <li>✓ Check your server logs if webhooks aren't being received</li>
        </ul>
      </div>
    </motion.div>
  );
}