// src/pages/AgentStoreProducts.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaEdit, FaSave, FaTimes, FaSpinner, FaDatabase, FaPercentage, FaTrash, FaUndo } from 'react-icons/fa';
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

  useEffect(() => {
    fetchProducts();
  }, []);

  // In AgentStoreProducts.js, add this to fetchProducts
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
    setUpdating(true);
    try {
      const response = await api.post('/agent/store/products/update-price', {
        network: product.network,
        size_gb: product.size_gb,
        custom_price: editPrice
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        fetchProducts();
        setEditingProduct(null);
        setEditPrice('');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update price');
    } finally {
      setUpdating(false);
    }
  };

  const updateMarkup = async () => {
    setUpdatingMarkup(true);
    try {
      const response = await api.put('/agent/store/markup', { markup });
      if (response.data.success) {
        toast.success(response.data.message);
        fetchProducts();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update markup');
    } finally {
      setUpdatingMarkup(false);
    }
  };

  const resetAllPrices = async () => {
    const result = await Swal.fire({
      title: 'Reset All Prices?',
      text: 'This will remove all custom prices and use the default markup.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Yes, Reset',
      cancelButtonText: 'Cancel'
    });
    
    if (result.isConfirmed) {
      try {
        const response = await api.post('/agent/store/reset-prices');
        if (response.data.success) {
          toast.success('All prices reset successfully');
          fetchProducts();
        }
      } catch (error) {
        toast.error('Failed to reset prices');
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
          <p>Set your own prices for each data bundle</p>
        </div>
        <div className="header-actions">
          <button className="btn-outline btn-sm" onClick={fetchProducts}>
            <FaSpinner className={loading ? 'spinning' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Markup Settings */}
      <div className="markup-card">
        <div className="markup-info">
          <FaPercentage size={24} color="#8B0000" />
          <div>
            <h3>Default Markup: {markup}%</h3>
            <p>Products without custom prices use this markup</p>
          </div>
        </div>
        <div className="markup-control">
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={markup}
            onChange={(e) => setMarkup(parseInt(e.target.value))}
            className="markup-slider"
          />
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
      {Object.entries(productsByNetwork).map(([network, networkProducts]) => (
        <div key={network} className="network-products-section">
          <h2 className="network-title">{network.toUpperCase()}</h2>
          <div className="products-grid">
            {networkProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-size">{product.size_gb}GB</div>
                <div className="product-prices">
                  <div className="wholesale-price">
                    Wholesale: ₵{product.wholesale_price.toFixed(2)}
                  </div>
                  {editingProduct === product.id ? (
                    <div className="edit-price">
                      <input 
                        type="number"
                        step="0.5"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="price-input"
                        placeholder="Enter price"
                      />
                      <button 
                        className="btn-success btn-sm" 
                        onClick={() => updatePrice(product)}
                        disabled={updating}
                      >
                        <FaSave />
                      </button>
                      <button 
                        className="btn-secondary btn-sm" 
                        onClick={() => setEditingProduct(null)}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="selling-price">
                      <strong>Selling: ₵{product.selling_price.toFixed(2)}</strong>
                      {product.custom_price && (
                        <span className="custom-badge">Custom</span>
                      )}
                      <button 
                        className="btn-edit"
                        onClick={() => {
                          setEditingProduct(product.id);
                          setEditPrice(product.selling_price.toString());
                        }}
                      >
                        <FaEdit />
                      </button>
                    </div>
                  )}
                  <div className="product-profit">
                    Your Profit: ₵{product.profit.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}