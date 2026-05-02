// src/pages/AFARegistration.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUserGraduate, FaPhone, FaEnvelope, FaCalendar, FaSpinner, FaCheckCircle, FaSchool, FaIdCard, FaMapMarkerAlt } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';

// Company Configuration
const COMPANY = {
  name: 'Roamsmart Digital Service',
  shortName: 'Roamsmart',
  email: 'support@roamsmart.shop',
  website: 'https://roamsmart.shop'
};

export default function AFARegistration() {
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'male',
    phone: '',
    email: '',
    address: '',
    schoolName: '',
    previousSchool: '',
    indexNumber: '',
    passportPhoto: null
  });
  const [loading, setLoading] = useState(false);
  const [registrationType, setRegistrationType] = useState('normal');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const registrationTypes = [
    { id: 'normal', name: 'Normal Registration', price: 4, description: 'Standard AFA registration without pictures upload', icon: '📝' },
    { id: 'premium', name: 'Premium Registration', price: 16, description: 'Register AFA with pictures upload', icon: '📸' }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }
    setFormData({ ...formData, passportPhoto: file });
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error('Please enter your full name');
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error('Please enter your phone number');
      return false;
    }
    const phoneRegex = /^(024|025|026|027|028|020|054|055|059|050|057|053|056)[0-9]{7}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Please enter a valid Ghana phone number (e.g., 024XXXXXXX)');
      return false;
    }
    if (!formData.schoolName.trim()) {
      toast.error('Please enter your current school name');
      return false;
    }
    if (!termsAccepted) {
      toast.error('Please accept the terms and conditions');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && key !== 'passportPhoto') {
          submitData.append(key, formData[key]);
        }
      });
      if (formData.passportPhoto) {
        submitData.append('passport_photo', formData.passportPhoto);
      }
      submitData.append('registration_type', registrationType);
      submitData.append('platform', COMPANY.shortName);

      const res = await api.post('/afa/register', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        toast.success(`AFA Registration submitted successfully to ${COMPANY.name}!`);
        // Reset form
        setFormData({
          fullName: '',
          dateOfBirth: '',
          gender: 'male',
          phone: '',
          email: '',
          address: '',
          schoolName: '',
          previousSchool: '',
          indexNumber: '',
          passportPhoto: null
        });
        setTermsAccepted(false);
        
        // Show success message with reference
        if (res.data.reference) {
          toast.success(`Your reference: ${res.data.reference}. Keep it for tracking.`);
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const selectedType = registrationTypes.find(t => t.id === registrationType);

  return (
    <motion.div 
      className="afa-registration-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="page-header">
        <h1><FaUserGraduate /> AFA Registration</h1>
        <p>Register for the AFA program through {COMPANY.name}</p>
      </div>

      <div className="registration-info-card">
        <div className="info-content">
          <FaIdCard size={24} />
          <div>
            <h3>About AFA Registration</h3>
            <p>Register for the Academic Facilitation Association (AFA) program through Roamsmart Digital Service. Fast, secure, and reliable processing.</p>
          </div>
        </div>
      </div>
      
      <div className="registration-types">
        <h3>Select Registration Type</h3>
        <div className="types-grid">
          {registrationTypes.map(type => (
            <div 
              key={type.id}
              className={`type-card ${registrationType === type.id ? 'active' : ''}`}
              onClick={() => setRegistrationType(type.id)}
            >
              <div className="type-icon">{type.icon}</div>
              <div className="type-name">{type.name}</div>
              <div className="type-price">₵{type.price}</div>
              <div className="type-desc">{type.description}</div>
              {registrationType === type.id && <FaCheckCircle className="check-icon" />}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="afa-form">
        <div className="form-section">
          <h3>Personal Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input 
                type="text" 
                name="fullName" 
                value={formData.fullName} 
                onChange={handleChange} 
                placeholder="Enter your full name"
                required 
              />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input 
                type="date" 
                name="dateOfBirth" 
                value={formData.dateOfBirth} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="form-group">
              <label>Phone Number *</label>
              <input 
                type="tel" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                placeholder="024XXXXXXX"
                required 
              />
              <small>Enter a valid Ghana mobile number</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="you@example.com"
              />
            </div>
            <div className="form-group">
              <label>Home Address</label>
              <input 
                type="text" 
                name="address" 
                value={formData.address} 
                onChange={handleChange} 
                placeholder="Accra, Ghana"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3><FaSchool /> Educational Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Current School *</label>
              <input 
                type="text" 
                name="schoolName" 
                value={formData.schoolName} 
                onChange={handleChange} 
                placeholder="Name of your current school"
                required 
              />
            </div>
            <div className="form-group">
              <label>Previous School</label>
              <input 
                type="text" 
                name="previousSchool" 
                value={formData.previousSchool} 
                onChange={handleChange} 
                placeholder="Previous school attended"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Index Number</label>
              <input 
                type="text" 
                name="indexNumber" 
                value={formData.indexNumber} 
                onChange={handleChange} 
                placeholder="e.g., 1234567890"
              />
            </div>
            {registrationType === 'premium' && (
              <div className="form-group">
                <label>Passport Photo</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
                <small>Upload passport size photo (max 2MB)</small>
              </div>
            )}
          </div>
        </div>

        <div className="form-section terms-section">
          <label className="checkbox">
            <input 
              type="checkbox" 
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              required
            />
            <span>
              I confirm that all information provided is accurate. I agree to the 
              <a href="/terms" target="_blank"> Terms of Service</a> and 
              <a href="/privacy" target="_blank"> Privacy Policy</a> of {COMPANY.name}.
            </span>
          </label>
        </div>

        <div className="price-summary">
          <span>Registration Fee:</span>
          <strong>₵{selectedType?.price || 0}</strong>
        </div>

        <button 
          type="submit" 
          className="btn-primary btn-block" 
          disabled={loading}
        >
          {loading ? <FaSpinner className="spinning" /> : <FaUserGraduate />}
          {loading ? ' Submitting to Roamsmart...' : ` Register Now - ₵${selectedType?.price || 0}`}
        </button>

        <div className="support-note">
          <p>Need help? Contact <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></p>
        </div>
      </form>
    </motion.div>
  );
}