// src/pages/Profile.js
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaCamera, FaSave, FaQrcode, FaShieldAlt, FaStore, FaTrash, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, refreshUser, updateUserContext } = useAuth();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    full_name: user?.full_name || ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        full_name: user.full_name || ''
      });
    }
  }, [user]);

  // Debug log to see user state
  useEffect(() => {
    console.log('Profile: Current user state:', user);
    // Check both possible field names
    const avatarField = user?.avatar_url || user?.avatar;
    console.log('Profile: Avatar from user:', avatarField);
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    if (profileData.phone) {
      const phoneRegex = /^(024|025|026|027|028|020|054|055|059|050|057|053|056)[0-9]{7}$/;
      if (!phoneRegex.test(profileData.phone)) {
        toast.error('Please enter a valid Ghana phone number');
        return;
      }
    }
    
    setLoading(true);
    try {
      const res = await api.put('/user/profile', profileData);
      if (res.data.success) {
        if (res.data.user) {
          updateUserContext(res.data.user);
        } else {
          await refreshUser();
        }
        toast.success('Profile updated successfully');
      } else {
        toast.error(res.data.error || 'Update failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Update failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordData.new_password.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/user/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      toast.success('Password changed successfully');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Password change failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, GIF, or WEBP)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum 5MB');
      return;
    }
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    setUploadingAvatar(true);
    try {
      const response = await api.post('/user/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log('Upload response:', response.data);
      
      if (response.data.success) {
        // Extract avatar URL from response (handle both field names)
        let newAvatarUrl = null;
        
        if (response.data.user) {
          newAvatarUrl = response.data.user.avatar_url || response.data.user.avatar;
          console.log('Updating user context with full user object:', response.data.user);
          updateUserContext(response.data.user);
        } else if (response.data.avatar_url) {
          newAvatarUrl = response.data.avatar_url;
          updateUserContext({ avatar_url: newAvatarUrl, avatar: newAvatarUrl });
        } else if (response.data.avatar) {
          newAvatarUrl = response.data.avatar;
          updateUserContext({ avatar_url: newAvatarUrl, avatar: newAvatarUrl });
        }
        
        // Update timestamp to force image reload
        setAvatarTimestamp(Date.now());
        
        toast.success('Profile picture updated!');
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('avatar-updated', { 
          detail: { avatar_url: newAvatarUrl }
        }));
      } else {
        toast.error(response.data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploadingAvatar(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (window.confirm('Are you sure you want to delete your profile picture?')) {
      try {
        const response = await api.delete('/user/avatar');
        if (response.data.success) {
          if (response.data.user) {
            updateUserContext(response.data.user);
          } else {
            updateUserContext({ avatar_url: null, avatar: null });
          }
          setAvatarTimestamp(Date.now());
          toast.success('Profile picture deleted');
        } else {
          toast.error('Failed to delete profile picture');
        }
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete profile picture');
      }
    }
  };

  // Get avatar URL - handles both 'avatar_url' and 'avatar' field names
  const getAvatarUrl = () => {
    // Check both possible field names
    const avatarField = user?.avatar_url || user?.avatar;
    console.log('Getting avatar URL, avatar field value:', avatarField);
    
    if (avatarField) {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      // Ensure the path starts with a slash if needed
      const avatarPath = avatarField.startsWith('/') ? avatarField : `/${avatarField}`;
      const fullUrl = `${baseUrl}${avatarPath}?t=${avatarTimestamp}`;
      console.log('Full avatar URL:', fullUrl);
      return fullUrl;
    }
    
    // Fallback to avatar generator
    const username = user?.username || 'User';
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=8B0000&color=fff&size=120&bold=true`;
    console.log('Using fallback avatar URL:', fallbackUrl);
    return fallbackUrl;
  };

  return (
    <div className="profile-page">
      <div className="container">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="profile-header">
            <div className="profile-avatar">
              <img 
                src={getAvatarUrl()} 
                alt={`${user?.username}'s avatar`}
                onError={(e) => {
                  console.error('Avatar failed to load, using fallback');
                  const username = user?.username || 'User';
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=8B0000&color=fff&size=120&bold=true`;
                }}
              />
              <button 
                className="change-avatar" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                aria-label="Change avatar"
              >
                {uploadingAvatar ? <FaSpinner className="spinning" /> : <FaCamera />}
              </button>
              {(user?.avatar_url || user?.avatar) && (
                <button 
                  className="delete-avatar"
                  onClick={handleDeleteAvatar}
                  aria-label="Delete avatar"
                >
                  <FaTrash />
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleAvatarUpload}
              />
            </div>
            <div className="profile-info">
              <h1>{user?.username}</h1>
              <p className="user-role">
                {user?.is_agent ? '⭐ Agent Partner' : '👤 Customer'}
                {user?.role === 'admin' && ' (Administrator)'}
                {user?.role === 'super_admin' && ' (Super Administrator)'}
              </p>
              <div className="profile-stats">
                <div>
                  <span>Wallet Balance</span>
                  <strong>₵{user?.wallet_balance?.toFixed(2) || '0.00'}</strong>
                </div>
                <div>
                  <span>Total Orders</span>
                  <strong>{user?.total_orders || 0}</strong>
                </div>
                <div>
                  <span>Member Since</span>
                  <strong>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-tabs">
            <button 
              className={`tab ${activeTab === 'profile' ? 'active' : ''}`} 
              onClick={() => setActiveTab('profile')}
            >
              <FaUser /> Profile
            </button>
            <button 
              className={`tab ${activeTab === 'security' ? 'active' : ''}`} 
              onClick={() => setActiveTab('security')}
            >
              <FaLock /> Security
            </button>
            {user?.is_agent && (
              <button 
                className={`tab ${activeTab === 'store' ? 'active' : ''}`} 
                onClick={() => setActiveTab('store')}
              >
                <FaStore /> Store Settings
              </button>
            )}
          </div>

          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="profile-form">
              <div className="form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  value={profileData.username} 
                  onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={profileData.full_name} 
                  onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                  placeholder="Optional"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  value={profileData.email} 
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  disabled={true}
                />
                <small>Email cannot be changed. Contact support to update your email.</small>
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  value={profileData.phone} 
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  placeholder="024XXXXXXX"
                  disabled={loading}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                <FaSave /> {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordChange} className="profile-form">
              <div className="form-group">
                <label>Current Password</label>
                <input 
                  type="password" 
                  value={passwordData.current_password} 
                  onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})} 
                  required 
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  value={passwordData.new_password} 
                  onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})} 
                  required 
                  disabled={loading}
                  autoComplete="new-password"
                />
                <small>Minimum 6 characters</small>
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  value={passwordData.confirm_password} 
                  onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})} 
                  required 
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                <FaLock /> {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}

          {activeTab === 'store' && user?.is_agent && (
            <div className="store-settings-placeholder">
              <p>Store settings will appear here. Visit <Link to="/store/setup">Store Setup</Link> to configure your store.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}