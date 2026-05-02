// src/components/AnnouncementBanner.js (with WebSocket)
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBullhorn, FaTimes, FaExclamationTriangle, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';
import api from '../services/api';
import io from 'socket.io-client';

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const fetchAnnouncement = async () => {
    try {
      const res = await api.get('/announcement/active');
      if (res.data?.success && res.data?.data) {
        setAnnouncement(res.data.data);
        setDismissed(false);
      } else {
        setAnnouncement(null);
      }
    } catch (error) {
      console.error('Failed to fetch announcement:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncement();
    
    // Connect to WebSocket for real-time updates
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';
    socketRef.current = io(wsUrl);
    
    socketRef.current.on('announcement_update', () => {
      console.log('Announcement updated, refreshing...');
      fetchAnnouncement();
    });
    
    // Also refresh every minute as fallback
    const interval = setInterval(fetchAnnouncement, 60 * 1000);
    
    return () => {
      clearInterval(interval);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const getIcon = (type) => {
    switch(type) {
      case 'success': return <FaCheckCircle />;
      case 'warning': return <FaExclamationTriangle />;
      case 'error': return <FaExclamationTriangle />;
      default: return <FaInfoCircle />;
    }
  };

  const getColor = (type) => {
    switch(type) {
      case 'success': return '#28a745';
      case 'warning': return '#ff9800';
      case 'error': return '#dc3545';
      default: return '#8B0000';
    }
  };

  if (loading || !announcement || dismissed) return null;

  const color = getColor(announcement.type);

  return (
    <AnimatePresence>
      <motion.div 
        className="announcement-banner-global"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        style={{ backgroundColor: color }}
      >
        <div className="announcement-container">
          <div className="announcement-content-global">
            <div className="announcement-icon-global">
              {getIcon(announcement.type)}
            </div>
            <div className="announcement-text-global">
              <strong>{announcement.title}</strong>
              <span>{announcement.message}</span>
              {announcement.network_affected && announcement.network_affected !== 'all' && (
                <span className="network-badge-global">
                  {announcement.network_affected.toUpperCase()}
                </span>
              )}
            </div>
            <button 
              className="announcement-close-global" 
              onClick={() => setDismissed(true)}
              aria-label="Dismiss"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}