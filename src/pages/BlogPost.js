// src/pages/BlogPost.js
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  FaCalendar, FaEye, FaClock, FaArrowLeft, FaShare, 
  FaWhatsapp, FaFacebook, FaTwitter, FaLinkedin, FaMapMarkerAlt,
  FaUtensils, FaHotel, FaCamera, FaSun, FaUmbrellaBeach,
  FaHiking, FaLandmark, FaTree, FaMountain, FaStar, FaRegHeart,
  FaShareAlt, FaBookmark, FaChevronRight, FaUserFriends,
  FaWifi, FaMobileAlt, FaDatabase, FaBolt, FaCheckCircle,
  FaHeart, FaComment, FaUser, FaTags, FaArrowRight, FaRegBookmark
} from 'react-icons/fa';
import { BLOG_POSTS } from './Blog';

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  
  const post = BLOG_POSTS.find(p => p.slug === slug);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  
  useEffect(() => {
    window.scrollTo(0, 0);
    // Load saved like status from localStorage
    const savedLikes = localStorage.getItem(`blog_likes_${post?.id}`);
    if (savedLikes) {
      setLikesCount(parseInt(savedLikes));
    } else if (post) {
      setLikesCount(post.likes || 0);
    }
    const bookmarked = localStorage.getItem(`bookmark_${post?.id}`);
    setIsBookmarked(bookmarked === 'true');
  }, [post]);
  
  if (!post) {
    return (
      <div className="blog-post-not-found">
        <div className="container">
          <h1>Post Not Found</h1>
          <p>The article you're looking for doesn't exist.</p>
          <Link to="/blog" className="btn-primary">Back to Blog</Link>
        </div>
      </div>
    );
  }
  
  const shareUrl = window.location.href;
  
  const handleShare = (platform) => {
    let url = '';
    switch(platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(`${post.title} - Stay connected with RoamSmart! ${shareUrl}`)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${post.title} on RoamSmart Blog`)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(post.title)}`;
        break;
    }
    window.open(url, '_blank');
  };
  
  const handleLike = () => {
    if (!liked) {
      const newCount = likesCount + 1;
      setLikesCount(newCount);
      setLiked(true);
      localStorage.setItem(`blog_likes_${post.id}`, newCount.toString());
    }
  };
  
  const handleBookmark = () => {
    const newState = !isBookmarked;
    setIsBookmarked(newState);
    localStorage.setItem(`bookmark_${post.id}`, newState.toString());
  };
  
  return (
    <div className="blog-post-page">
      {/* Progress Bar */}
      <motion.div 
        className="progress-bar"
        style={{ scaleX: scrollYProgress }}
      />
      
      {/* Hero Section with Parallax Image */}
      <div className="blog-post-hero" style={{ backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(139,0,0,0.6) 100%), url(${post.image})` }}>
        <div className="hero-overlay"></div>
        <div className="container">
          <Link to="/blog" className="back-link">
            <FaArrowLeft /> Back to Blog
          </Link>
          
          <motion.div 
            className="hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="post-category"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {post.category}
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {post.title}
            </motion.h1>
            
            <motion.div 
              className="post-meta"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <span><FaCalendar /> {new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span><FaClock /> {post.readTime} min read</span>
              <span><FaEye /> {post.views.toLocaleString()} views</span>
              <span><FaUser /> By {post.author}</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
      
      <div className="container">
        <div className="blog-post-layout">
          {/* Floating Action Buttons */}
          <div className="floating-actions">
            <motion.button 
              className={`action-btn like-btn ${liked ? 'active' : ''}`}
              onClick={handleLike}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaHeart /> <span>{likesCount}</span>
            </motion.button>
            <motion.button 
              className={`action-btn bookmark-btn ${isBookmarked ? 'active' : ''}`}
              onClick={handleBookmark}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaRegBookmark />
            </motion.button>
            <motion.button 
              className="action-btn share-btn"
              onClick={() => handleShare('whatsapp')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaShareAlt />
            </motion.button>
          </div>
          
          {/* Main Content Area */}
          <motion.article 
            className="blog-post-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* RoamSmart Promotional Banner - Animated */}
            <motion.div 
              className="roamsmart-promo-banner"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="promo-icon"><FaMobileAlt /></div>
              <div className="promo-text">
                <h4>📱 Stay Connected Anywhere in Ghana</h4>
                <p>Get instant data bundles from RoamSmart. MTN, Telecel, AirtelTigo - 2 second delivery!</p>
              </div>
              <Link to="/register" className="promo-btn">Get Data Now →</Link>
            </motion.div>
            
            {/* Post Content with Drop Cap effect on first paragraph */}
            <div className="content" dangerouslySetInnerHTML={{ __html: post.content }} />
            
            {/* Image Gallery Carousel */}
            {post.gallery && post.gallery.length > 0 && (
              <div className="image-gallery">
                <h3>📸 Photo Gallery</h3>
                <div className="gallery-carousel">
                  {post.gallery.map((img, idx) => (
                    <motion.div 
                      key={idx} 
                      className="gallery-item"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    >
                      <img src={img} alt={`Gallery ${idx + 1}`} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            
            {/* RoamSmart Call-to-Action - Animated Insert */}
            <motion.div 
              className="cta-insert"
              initial={{ scale: 0.95, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h3>📱 Need Data for Your Trip?</h3>
              <p>Don't get stranded without internet. Buy data bundles instantly on RoamSmart and stay connected wherever you go in Ghana.</p>
              <div className="cta-features">
                <motion.span whileHover={{ y: -2 }}><FaBolt /> 2 Second Delivery</motion.span>
                <motion.span whileHover={{ y: -2 }}><FaDatabase /> All Network Bundles</motion.span>
                <motion.span whileHover={{ y: -2 }}><FaCheckCircle /> No Expiry Options</motion.span>
              </div>
              <Link to="/register" className="btn-primary">Buy Data Now</Link>
            </motion.div>
            
            {/* Tags Section */}
            {post.tags && post.tags.length > 0 && (
              <div className="post-tags">
                <h4><FaTags /> Tags:</h4>
                <div className="tags-list">
                  {post.tags.map((tag, idx) => (
                    <motion.span 
                      key={idx} 
                      className="tag"
                      whileHover={{ scale: 1.05, x: 2 }}
                    >
                      #{tag}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Author Bio with Animated Avatar */}
            <motion.div 
              className="author-bio"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <motion.img 
                src={post.authorAvatar || `https://ui-avatars.com/api/?name=${post.author}&background=8B0000&color=fff&size=100&bold=true`} 
                alt={post.author}
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.3 }}
              />
              <div className="author-info">
                <h4>Written by {post.author}</h4>
                <p>{post.authorBio || `${post.author} is a travel enthusiast and RoamSmart content creator. Follow their adventures across Ghana and beyond.`}</p>
                <Link to={`/blog?author=${encodeURIComponent(post.author)}`} className="read-more">
                  View all posts by {post.author} <FaChevronRight />
                </Link>
              </div>
            </motion.div>
          </motion.article>
          
          {/* Sidebar */}
          <aside className="blog-post-sidebar">
            {/* Table of Contents */}
            <motion.div 
              className="toc-box"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h4>📑 In this article</h4>
              <ul>
                <li><a href="#intro">Introduction</a></li>
                <li><a href="#attraction1">Main Attractions</a></li>
                <li><a href="#tips">Travel Tips</a></li>
                <li><a href="#roamsmart">Stay Connected</a></li>
              </ul>
            </motion.div>
            
            {/* RoamSmart Sidebar Card - Animated */}
            <motion.div 
              className="roamsmart-sidebar-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ y: -5 }}
            >
              <FaDatabase className="sidebar-icon" />
              <h4>Buy Data on RoamSmart</h4>
              <p>Instant delivery to all networks</p>
              <div className="price-list">
                <div className="price-item">
                  <span>MTN 1GB</span>
                  <strong>₵5.00</strong>
                </div>
                <div className="price-item">
                  <span>Telecel 1GB</span>
                  <strong>₵4.50</strong>
                </div>
                <div className="price-item">
                  <span>AirtelTigo 1GB</span>
                  <strong>₵4.00</strong>
                </div>
              </div>
              <Link to="/register" className="btn-primary btn-sm">Shop Now →</Link>
            </motion.div>
            
            {/* Share Box */}
            <div className="share-box">
              <h4>📢 Share this Article</h4>
              <div className="share-buttons">
                <motion.button 
                  onClick={() => handleShare('whatsapp')} 
                  className="share-btn whatsapp"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaWhatsapp /> WhatsApp
                </motion.button>
                <motion.button 
                  onClick={() => handleShare('facebook')} 
                  className="share-btn facebook"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaFacebook /> Facebook
                </motion.button>
                <motion.button 
                  onClick={() => handleShare('twitter')} 
                  className="share-btn twitter"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaTwitter /> Twitter
                </motion.button>
                <motion.button 
                  onClick={() => handleShare('linkedin')} 
                  className="share-btn linkedin"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaLinkedin /> LinkedIn
                </motion.button>
              </div>
            </div>
            
            {/* Become Agent CTA */}
            <motion.div 
              className="agent-sidebar-card"
              whileHover={{ y: -5 }}
            >
              <FaUserFriends className="sidebar-icon" />
              <h4>Become a RoamSmart Agent</h4>
              <p>Earn up to 25% commission on every sale</p>
              <div className="agent-benefits">
                <span>✅ Wholesale prices</span>
                <span>✅ Your own store</span>
                <span>✅ Instant withdrawals</span>
              </div>
              <Link to="/become-agent" className="btn-outline btn-sm">Learn More →</Link>
            </motion.div>
            
            {/* Quick Network Info - Animated Cards */}
            <motion.div 
              className="network-info-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h4>📶 Supported Networks</h4>
              <div className="network-list">
                <motion.span whileHover={{ scale: 1.05, x: 2 }}>MTN</motion.span>
                <motion.span whileHover={{ scale: 1.05, x: 2 }}>Telecel</motion.span>
                <motion.span whileHover={{ scale: 1.05, x: 2 }}>AirtelTigo</motion.span>
              </div>
              <p className="small">⚡ All bundles delivered instantly</p>
            </motion.div>
            
            {/* Newsletter Signup */}
            <motion.div 
              className="newsletter-signup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <h4>📧 Get Travel Tips</h4>
              <p>Subscribe for Ghana travel guides and exclusive RoamSmart offers</p>
              <div className="newsletter-form">
                <input type="email" placeholder="Your email" />
                <button className="subscribe-btn">Subscribe</button>
              </div>
            </motion.div>
          </aside>
        </div>
        
        {/* Comments Section */}
        <motion.div 
          className="comments-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h3><FaComment /> Comments ({post.comments?.length || 0})</h3>
          <div className="comment-form">
            <textarea placeholder="Share your thoughts..." rows="3"></textarea>
            <button className="btn-primary">Post Comment</button>
          </div>
          {post.comments && post.comments.map((comment, idx) => (
            <div key={idx} className="comment">
              <img src={`https://ui-avatars.com/api/?name=${comment.author}&background=8B0000&color=fff`} alt={comment.author} />
              <div className="comment-content">
                <h4>{comment.author}</h4>
                <p>{comment.text}</p>
                <span className="comment-date">{comment.date}</span>
              </div>
            </div>
          ))}
        </motion.div>
        
        {/* Related Posts */}
        <div className="related-posts">
          <h3>You Might Also Like</h3>
          <div className="related-grid">
            {BLOG_POSTS.filter(p => p.id !== post.id).slice(0, 3).map(related => (
              <motion.div 
                key={related.id} 
                className="related-card"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <Link to={`/blog/${related.slug}`}>
                  <div className="related-image">
                    <img src={related.image} alt={related.title} />
                    <div className="related-overlay">
                      <span>Read More <FaArrowRight /></span>
                    </div>
                  </div>
                  <h4>{related.title}</h4>
                  <p>{related.excerpt?.substring(0, 100)}...</p>
                  <div className="related-meta">
                    <span><FaCalendar /> {new Date(related.date).toLocaleDateString()}</span>
                    <span><FaClock /> {related.readTime} min</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Bottom CTA Banner - Animated */}
        <motion.div 
          className="bottom-cta-banner"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="cta-content">
            <h3>Ready to Explore Ghana?</h3>
            <p>Stay connected with RoamSmart's instant data bundles. Get online in seconds, wherever you are.</p>
            <div className="cta-features-bottom">
              <span>⚡ 2 Second Delivery</span>
              <span>📱 All Networks</span>
              <span>💰 Best Prices</span>
            </div>
            <div className="cta-buttons">
              <Link to="/register" className="btn-primary">Get Started</Link>
              <Link to="/bundles" className="btn-outline">View Bundles</Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}