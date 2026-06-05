// src/pages/AgentStoreProducts.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaEdit, FaSave, FaTimes, FaSpinner, FaDatabase, FaPercentage, FaTrash, FaUndo, FaSync } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function AgentStoreProducts() {
  const [products, setProducts] = useState([]);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [updating, setUpdating] = useState(false);
  const [markup, setMarkup] = useState(15);
  const [updatingMarkup, setUpdatingMarkup] = useState(false);
  const [priceType, setPriceType] = useState('selling'); // 'selling' or 'wholesale'

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      console.log('[DEBUG] Fetching products...');
      const res = await api.get('/agent/store/products');
      console.log('[DEBUG] API Response:', res.data);
      
      if (res.data.success) {
        console.log('[DEBUG] Products found:', res.data.data.products?.length);
        console.log('[DEBUG] Products data:', res.data.data.products);
        setProducts(res.data.data.products || []);
        setStore(res.data.data.store);
        setMarkup(res.data.data.store?.markup || 15);
      } else {
        console.error('[DEBUG] API returned error:', res.data.error);
        toast.error(res.data.error || 'Failed to load products');
      }
    } catch (error) {
      console.error('[DEBUG] Fetch error:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const updatePrice = async (product) => {
    if (!editPrice || parseFloat(editPrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    
    setUpdating(true);
    try {
      const response = await api.post('/agent/store/products/update-price', {
        network: product.network,
        size_gb: product.size_gb,
        custom_price: parseFloat(editPrice),
        price_type: priceType // 'selling' or 'wholesale'
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        fetchProducts();
        setEditingProduct(null);
        setEditPrice('');
      } else {
        toast.error(response.data.error || 'Failed to update price');
      }
    } catch (error) {
      console.error('Update price error:', error);
      toast.error(error.response?.data?.error || 'Failed to update price');
    } finally {
      setUpdating(false);
    }
  };

  const updateMarkup = async () => {
    if (markup < 0 || markup > 100) {
      toast.error('Markup must be between 0 and 100');
      return;
    }
    
    setUpdatingMarkup(true);
    try {
      const response = await api.put('/agent/store/markup', { markup });
      if (response.data.success) {
        toast.success(response.data.message);
        fetchProducts();
      } else {
        toast.error(response.data.error || 'Failed to update markup');
      }
    } catch (error) {
      console.error('Update markup error:', error);
      toast.error(error.response?.data?.error || 'Failed to update markup');
    } finally {
      setUpdatingMarkup(false);
    }
  };

  const resetAllPrices = async () => {
    const result = await Swal.fire({
      title: 'Reset All Prices?',
      html: `
        <div style="text-align: left;">
          <p>This will remove all custom prices and use the default markup (${markup}%).</p>
          <p><strong>Warning:</strong> This action cannot be undone!</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Yes, Reset All',
      cancelButtonText: 'Cancel'
    });
    
    if (result.isConfirmed) {
      try {
        const response = await api.post('/agent/store/reset-prices');
        if (response.data.success) {
          toast.success('All prices reset successfully');
          fetchProducts();
        } else {
          toast.error(response.data.error || 'Failed to reset prices');
        }
      } catch (error) {
        console.error('Reset prices error:', error);
        toast.error('Failed to reset prices');
      }
    }
  };

  const resetSinglePrice = async (product) => {
    const result = await Swal.fire({
      title: 'Reset Price?',
      text: `Reset ${product.size_gb}GB ${product.network.toUpperCase()} to default markup?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ff9800',
      confirmButtonText: 'Yes, Reset',
      cancelButtonText: 'Cancel'
    });
    
    if (result.isConfirmed) {
      try {
        const response = await api.post('/agent/store/products/reset-price', {
          network: product.network,
          size_gb: product.size_gb
        });
        
        if (response.data.success) {
          toast.success('Price reset successfully');
          fetchProducts();
        }
      } catch (error) {
        toast.error('Failed to reset price');
      }
    }
  };

  // Group products by network
  const productsByNetwork = products.reduce((acc, product) => {
    if (!acc[product.network]) acc[product.network] = [];
    acc[product.network].push(product);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <motion.div className="agent-store-products" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header">
        <div>
          <h1><FaDatabase /> Manage Store Products</h1>
          <p>Set custom prices for your data bundles or use default markup</p>
        </div>
        <div className="header-actions">
          <button className="btn-outline btn-sm" onClick={fetchProducts}>
            <FaSync /> Refresh
          </button>
        </div>
      </div>

      {/* Store Info Card */}
      {store && (
        <div className="store-info-card">
          <div className="store-info">
            <strong>Store:</strong> {store.store_name}
            <span className="store-slug">/{store.store_slug}</span>
          </div>
          <div className="store-stats">
            <span>📦 Total Products: {products.length}</span>
            <span>🏷️ Default Markup: {markup}%</span>
          </div>
        </div>
      )}

      {/* Markup Settings */}
      <div className="markup-card">
        <div className="markup-info">
          <FaPercentage size={24} color="#8B0000" />
          <div>
            <h3>Default Markup: {markup}%</h3>
            <p>Products without custom prices use this markup. <br/>
            <small>Formula: Selling Price = Wholesale Price × (1 + Markup%)</small></p>
          </div>
        </div>
        <div className="markup-control">
          <div className="markup-slider-container">
            <span>0%</span>
            <input 
              type="range" 
              min="0" 
              max="100" 
              step="1"
              value={markup}
              onChange={(e) => setMarkup(parseInt(e.target.value))}
              className="markup-slider"
            />
            <span>100%</span>
          </div>
          <div className="markup-value">{markup}%</div>
          <div className="markup-actions">
            <button className="btn-primary btn-sm" onClick={updateMarkup} disabled={updatingMarkup}>
              {updatingMarkup ? <FaSpinner className="spinning" /> : 'Save Markup'}
            </button>
            <button className="btn-danger btn-sm" onClick={resetAllPrices}>
              <FaUndo /> Reset All Prices
            </button>
          </div>
        </div>
      </div>

      {/* Products by Network */}
      {Object.keys(productsByNetwork).length === 0 ? (
        <div className="no-products">
          <p>No products found. Please check your store configuration.</p>
        </div>
      ) : (
        Object.entries(productsByNetwork).map(([network, networkProducts]) => (
          <div key={network} className="network-products-section">
            <h2 className="network-title">{network.toUpperCase()}</h2>
            <div className="products-grid">
              {networkProducts.map((product) => (
                <div key={product.id} className="product-card">
                  <div className="product-size">{product.size_gb}GB</div>
                  <div className="product-prices">
                    <div className="wholesale-price">
                      <span>💰 Wholesale:</span>
                      <strong>₵{product.wholesale_price.toFixed(2)}</strong>
                    </div>
                    
                    {editingProduct === product.id ? (
                      <div className="edit-price">
                        <input 
                          type="number"
                          step="0.5"
                          min="0"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="price-input"
                          placeholder="Enter custom price"
                          autoFocus
                        />
                        <div className="edit-actions">
                          <button 
                            className="btn-success btn-sm" 
                            onClick={() => updatePrice(product)}
                            disabled={updating}
                            title="Save"
                          >
                            <FaSave />
                          </button>
                          <button 
                            className="btn-secondary btn-sm" 
                            onClick={() => setEditingProduct(null)}
                            title="Cancel"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="selling-price">
                        <div className="selling-price-main">
                          <span>🏷️ Selling:</span>
                          <strong className="price-amount">₵{product.selling_price.toFixed(2)}</strong>
                          {product.custom_price && (
                            <span className="custom-badge">Custom</span>
                          )}
                        </div>
                        <div className="price-actions">
                          <button 
                            className="btn-edit"
                            onClick={() => {
                              setEditingProduct(product.id);
                              setEditPrice(product.selling_price.toString());
                            }}
                            title="Edit custom price"
                          >
                            <FaEdit />
                          </button>
                          {product.custom_price && (
                            <button 
                              className="btn-reset"
                              onClick={() => resetSinglePrice(product)}
                              title="Reset to default"
                            >
                              <FaUndo />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="product-profit">
                      <span>📈 Your Profit:</span>
                      <strong className="profit-amount">₵{product.profit.toFixed(2)}</strong>
                      <small>({((product.profit / product.wholesale_price) * 100).toFixed(1)}% margin)</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </motion.div>
  );
}