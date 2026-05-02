// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import config from './config';
import './styles/main.css';
import './styles/animations.css';

// Set document title
document.title = config.seo.title;

// Set meta description
const metaDescription = document.querySelector('meta[name="description"]');
if (metaDescription) {
  metaDescription.setAttribute('content', config.seo.description);
} else {
  const meta = document.createElement('meta');
  meta.name = 'description';
  meta.content = config.seo.description;
  document.head.appendChild(meta);
}

// Add viewport meta if not present
if (!document.querySelector('meta[name="viewport"]')) {
  const viewport = document.createElement('meta');
  viewport.name = 'viewport';
  viewport.content = 'width=device-width, initial-scale=1.0';
  document.head.appendChild(viewport);
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <ScrollToTop />
          <Toaster 
            position="top-right" 
            toastOptions={{ 
              duration: 4000,
              style: { 
                background: '#333', 
                color: '#fff',
                borderRadius: '12px',
                padding: '12px 16px'
              },
              success: {
                iconTheme: {
                  primary: '#28a745',
                  secondary: '#fff'
                }
              },
              error: {
                iconTheme: {
                  primary: '#dc3545',
                  secondary: '#fff'
                }
              }
            }} 
          />
          <App />
        </ErrorBoundary>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);