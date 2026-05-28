
// src/pages/Blog.js
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaCalendar, FaClock, FaEye, FaSearch, FaArrowRight, 
  FaFilter, FaTimes, FaUser, FaTag, FaHeart, FaRegHeart, 
  FaWhatsapp, FaFacebook, FaTwitter, FaLink 
} from 'react-icons/fa';
import '../styles/pages/blog.css';

// Sample Blog Posts Data
export const BLOG_POSTS = [
  {
    id: 1,
    slug: 'top-5-hidden-beaches-in-ghana',
    title: 'Top 5 Hidden Beaches in Ghana You Must Visit',
    excerpt: 'Discover Ghana\'s most beautiful and secluded beaches perfect for a weekend getaway...',
    content: `<p>Ghana's coastline stretches over 500 kilometers, offering some of West Africa's most stunning beaches. While Busua and Kokrobite are well-known, there are hidden gems waiting to be discovered...</p>
    
    <h2>1. Green Turtle Bay, Beyin</h2>
    <p>Located in the Western Region, Green Turtle Bay is a paradise for nature lovers. The beach is named after the endangered sea turtles that nest here...</p>
    
    <div class="roamsmart-tip">
      <div>
        <strong>📱 RoamSmart Tip:</strong><br>
        Before heading to remote beaches, download offline maps and buy a data bundle on RoamSmart. Coverage varies along the coast, but RoamSmart works on all networks!
      </div>
    </div>
    
    <h2>2. Akwidaa Beach, Western Region</h2>
    <p>Akwidaa is one of the southernmost points in Ghana. The beach is pristine, with golden sand and clear waters...</p>`,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    category: 'Travel',
    author: 'Emmanuel Hinneh',
    authorBio: 'Emmanuel is the founder of RoamSmart and a passionate traveler who has explored every region of Ghana.',
    date: '2024-05-15',
    readTime: 8,
    views: 12500,
    likes: 342,
    tags: ['beaches', 'travel', 'Ghana', 'weekend getaway']
  },
   {
    id: 2,
    slug: 'mtn-vs-telecel-vs-airteltigo-data-comparison',
    title: 'MTN vs Telecel vs AirtelTigo: Which Network Has the Best Data?',
    excerpt: 'A comprehensive comparison of Ghana\'s three major mobile networks to help you choose the best data plan...',
    content: `<p>Choosing the right mobile network in Ghana can be challenging. Each network has its strengths and weaknesses...</p>
    
    <h2>MTN Data Plans</h2>
    <p>MTN offers the widest coverage across Ghana, with 4G available in all regional capitals...</p>
    
    <h2>Telecel (formerly Vodafone) Data Plans</h2>
    <p>Telecel has improved significantly, offering competitive pricing in urban areas...</p>
    
    <h2>AirtelTigo Data Plans</h2>
    <p>AirtelTigo is often the most affordable option for light users...</p>`,
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800',
    category: 'Tech',
    author: 'Emmanuel Hinneh',
    date: '2024-05-10',
    readTime: 6,
    views: 8900,
    likes: 210,
    tags: ['MTN', 'Telecel', 'AirtelTigo', 'comparison', 'data']
  },
  {
    id: 3,
    slug: 'how-to-save-data-on-your-smartphone',
    title: '10 Proven Ways to Save Data on Your Smartphone',
    excerpt: 'Learn effective tips and tricks to reduce your mobile data usage and save money on your monthly bill...',
    content: `<p>Mobile data can be expensive, but with the right habits, you can significantly reduce your usage...</p>
    
    <h2>1. Use Data Saver Mode</h2>
    <p>Most Android and iOS devices have built-in data saver features that restrict background data...</p>
    
    <h2>2. Download Content for Offline Use</h2>
    <p>Netflix, Spotify, and YouTube allow you to download content over WiFi for offline viewing...</p>
    
    <h2>3. Compress Images Before Sharing</h2>
    <p>Large images and videos consume massive amounts of data. Use compression tools...</p>`,
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
    category: 'Tips',
    author: 'Tech Team',
    date: '2024-05-08',
    readTime: 5,
    views: 6700,
    likes: 189,
    tags: ['data saving', 'tips', 'smartphone']
  },
  {
    id: 4,
    slug: 'waec-result-checker-guide-2025',
    title: 'WAEC Results 2025: How to Check Your Results Online',
    excerpt: 'Complete step-by-step guide on how to check your WAEC results online using your phone or computer...',
    content: `<p>The wait is finally over! WAEC results for 2025 are now available online...</p>
    
    <h2>Requirements</h2>
    <ul>
      <li>WAEC Result Checker PIN (available on RoamSmart)</li>
      <li>Your examination number</li>
      <li>Stable internet connection</li>
    </ul>
    
    <h2>Step-by-Step Process</h2>
    <p>1. Visit the official WAEC results portal...</p>
    <p>2. Enter your examination number...</p>
    <p>3. Enter your PIN...</p>`,
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
    category: 'Education',
    author: 'Education Desk',
    date: '2024-05-05',
    readTime: 4,
    views: 23400,
    likes: 567,
    tags: ['WAEC', 'education', 'results', 'exams']
  },
  {
    id: 5,
    slug: 'best-places-to-visit-in-accra',
    title: 'The 15 Best Places to Visit in Accra (2025 Guide)',
    excerpt: 'From historical landmarks to modern attractions, discover the best things to do in Ghana\'s capital city...',
    content: `<p>Accra is a vibrant city blending rich history with modern development. Here are the must-visit places...</p>
    
    <h2>1. Kwame Nkrumah Memorial Park</h2>
    <p>Honoring Ghana's first president, this park is a significant historical site...</p>
    
    <h2>2. Makola Market</h2>
    <p>Experience the hustle and bustle of Accra's largest open-air market...</p>
    
    <h2>3. Labadi Beach</h2>
    <p>One of Accra's most popular beaches, perfect for weekend relaxation...</p>`,
    image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800',
    category: 'Travel',
    author: 'Travel Guide',
    date: '2024-04-28',
    readTime: 10,
    views: 15600,
    likes: 423,
    tags: ['Accra', 'travel', 'Ghana', 'attractions']
  },
  {
    id: 6,
    slug: 'become-roamsmart-agent-earn-money',
    title: 'How to Become a RoamSmart Agent and Earn Up to 25% Commission',
    excerpt: 'Start your own digital business with RoamSmart. Learn how to become an agent and earn passive income...',
    content: `<p>RoamSmart's agent program allows you to earn money by selling data bundles to your community...</p>
    
    <h2>Why Become a RoamSmart Agent?</h2>
    <ul>
      <li>Earn up to 25% commission on every sale</li>
      <li>No inventory needed</li>
      <li>Work from anywhere</li>
      <li>Instant withdrawals</li>
    </ul>
    
    <h2>How to Get Started</h2>
    <p>1. Register for a free RoamSmart account...</p>
    <p>2. Apply to become an agent...</p>
    <p>3. Start selling and earning...</p>`,
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
    category: 'Business',
    author: 'Agent Support Team',
    date: '2024-04-20',
    readTime: 7,
    views: 9800,
    likes: 256,
    tags: ['agent', 'business', 'earn money', 'commission']
  },
  {
    id: 7,
    slug: 'vodafone-to-telecel-transition-guide',
    title: 'Vodafone to Telecel: What You Need to Know',
    excerpt: 'Everything about the transition from Vodafone Ghana to Telecel. How it affects your data and services...',
    content: `<p>Vodafone Ghana has officially rebranded to Telecel. Here's what customers need to know...</p>
    
    <h2>What Has Changed?</h2>
    <p>The network infrastructure remains the same, but billing and customer service have been updated...</p>
    
    <h2>How It Affects Your RoamSmart Purchases</h2>
    <p>All Vodafone bundles on RoamSmart are now Telecel bundles at the same great prices...</p>`,
    image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800',
    category: 'Tech',
    author: 'Tech Team',
    date: '2024-04-15',
    readTime: 4,
    views: 5600,
    likes: 132,
    tags: ['Vodafone', 'Telecel', 'transition']
  },
  {
    id: 8,
    slug: 'data-bundle-prices-ghana-2025',
    title: 'Current Data Bundle Prices in Ghana (2025)',
    excerpt: 'Updated list of all data bundle prices across MTN, Telecel, and AirtelTigo networks...',
    content: `<p>Data bundle prices change frequently. Here's the current pricing for all networks...</p>
    
    <h2>MTN Data Bundles (RoamSmart Prices)</h2>
    <ul>
      <li>1GB - GHS 6.50</li>
      <li>2GB - GHS 12.00</li>
      <li>5GB - GHS 25.00</li>
      <li>10GB - GHS 48.00</li>
    </ul>
    
    <h2>Telecel Data Bundles</h2>
    <ul>
      <li>1GB - GHS 6.00</li>
      <li>2GB - GHS 11.00</li>
      <li>5GB - GHS 23.00</li>
    </ul>
    
    <h2>AirtelTigo Data Bundles</h2>
    <ul>
      <li>1GB - GHS 6.00</li>
      <li>2GB - GHS 11.00</li>
      <li>5GB - GHS 23.00</li>
    </ul>`,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
    category: 'Tech',
    author: 'Price Monitor',
    date: '2024-04-10',
    readTime: 5,
    views: 18900,
    likes: 445,
    tags: ['prices', 'data bundles', 'MTN', 'Telecel', 'AirtelTigo']
  },
  {
    id: 9,
    slug: 'best-food-in-ghana-dishes-to-try',
    title: '25 Traditional Ghanaian Dishes You Must Try',
    excerpt: 'A food lover\'s guide to Ghana\'s most delicious and authentic dishes...',
    content: `<p>Ghanaian cuisine is diverse and flavorful. Here are the must-try dishes...</p>
    
    <h2>1. Jollof Rice</h2>
    <p>Ghana's famous one-pot rice dish cooked with tomatoes, onions, and spices...</p>
    
    <h2>2. Banku with Tilapia</h2>
    <p>A fermented corn and cassava dough served with grilled tilapia and pepper...</p>
    
    <h2>3. Waakye</h2>
    <p>Rice and beans cooked with millet leaves, served with spaghetti, gari, and fried plantain...</p>`,
    image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800',
    category: 'Culture',
    author: 'Food Critic',
    date: '2024-04-05',
    readTime: 9,
    views: 14300,
    likes: 678,
    tags: ['food', 'Ghanaian cuisine', 'culture', 'recipes']
  },
  {
    id: 10,
    slug: 'internet-security-tips-ghana',
    title: '7 Essential Internet Security Tips for Ghanaians',
    excerpt: 'Protect yourself online with these simple but effective cybersecurity practices...',
    content: `<p>With increasing cyber threats, it's crucial to stay safe online. Here are essential tips...</p>
    
    <h2>1. Use Strong Passwords</h2>
    <p>Avoid using simple passwords like "123456" or "password"...</p>
    
    <h2>2. Enable Two-Factor Authentication</h2>
    <p>Add an extra layer of security to your accounts...</p>
    
    <h2>3. Be Wary of Phishing Scams</h2>
    <p>Never click on suspicious links in emails or SMS...</p>`,
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800',
    category: 'Security',
    author: 'Security Expert',
    date: '2024-03-28',
    readTime: 6,
    views: 7200,
    likes: 198,
    tags: ['security', 'internet safety', 'cybersecurity']
  },
  {
    id: 11,
    slug: 'remote-work-guide-ghana',
    title: 'The Ultimate Guide to Remote Work in Ghana',
    excerpt: 'Everything you need to know about working remotely from Ghana. Best locations, internet tips, and more...',
    content: `<p>Remote work is becoming increasingly popular in Ghana. Here's how to succeed...</p>
    
    <h2>Best Locations for Remote Work</h2>
    <p>Accra, Kumasi, and Tema have the most reliable internet connections...</p>
    
    <h2>Internet Tips</h2>
    <p>Use RoamSmart to buy data bundles for your home WiFi and mobile hotspot...</p>`,
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
    category: 'Business',
    author: 'Career Coach',
    date: '2024-03-20',
    readTime: 7,
    views: 8900,
    likes: 234,
    tags: ['remote work', 'work from home', 'career']
  },
  {
    id: 12,
    slug: 'ghana-festivals-calendar',
    title: 'Ghana Festivals Calendar 2025: When and Where to Go',
    excerpt: 'Plan your year around Ghana\'s vibrant festivals celebrating culture, harvest, and history...',
    content: `<p>Ghana is known for its colorful festivals. Here's a month-by-month guide...</p>
    
    <h2>January: Aboakyer Festival</h2>
    <p>Winneba's deer-hunting festival...</p>
    
    <h2>March: Homowo Festival</h2>
    <p>The Ga people's harvest festival in Accra...</p>`,
    image: 'https://images.unsplash.com/photo-1536704794827-5b9a13ae4e3f?w=800',
    category: 'Culture',
    author: 'Cultural Desk',
    date: '2024-03-15',
    readTime: 8,
    views: 11200,
    likes: 345,
    tags: ['festivals', 'culture', 'events', 'calendar']
  },
  {
  id: 13,
  slug: 'dagomba-culture-northern-ghana',
  title: 'Dagomba Culture: Exploring the Rich Heritage of Northern Ghana',
  excerpt: 'Discover the fascinating traditions, festivals, and customs of the Dagomba people in Northern Ghana...',
  content: `<p>The Dagomba people are one of the largest ethnic groups in Ghana, primarily residing in the Northern Region. Their rich cultural heritage spans centuries, with unique traditions in music, dance, festivals, and chieftaincy.</p>
  
  <img src="https://i.imgur.com/PCgSLn5.png" alt="Dagomba traditional dancers" style="width:100%; border-radius:12px; margin:20px 0;">
  
  <h2>The History of the Dagomba Kingdom</h2>
  <p>The Dagomba people established the Kingdom of Dagbon, one of the oldest and most organized traditional states in Ghana. The kingdom dates back to the 11th century and is centered in Yendi, the traditional capital.</p>
  
  <h2>The Yaa Naa (King of Dagbon)</h2>
  <p>The Yaa Naa is the paramount chief of the Dagomba people, residing in the Gbewaa Palace in Yendi. The chieftaincy system is highly revered and plays a crucial role in maintaining the culture and traditions of the Dagomba people.</p>
  
  <div class="featured-snippet">
    <h4>🏰 Did You Know?</h4>
    <p>The Gbewaa Palace in Yendi is one of the largest traditional palaces in West Africa and serves as the seat of the Yaa Naa.</p>
  </div>
  
  <img src="https://i.imgur.com/UOtOc11.png" alt="Damba festival celebration" style="width:100%; border-radius:12px; margin:20px 0;">
  
  <h2>Damba Festival - The Most Important Celebration</h2>
  <p>The Damba Festival is the most significant festival celebrated by the Dagomba people. It commemorates the birth of the Holy Prophet Muhammad and showcases the rich cultural heritage of the Dagbon Kingdom.</p>
  
  <h3>When is Damba Celebrated?</h3>
  <p>Damba is celebrated in the third month of the Islamic calendar, known as Rabia al-Awwal. The festival lasts for several days with different activities each day.</p>
  
  <h3>Activities During Damba Festival</h3>
  <ul>
    <li><strong>Sommo Damba:</strong> The first day dedicated to singing and dancing</li>
    <li><strong>Naa Damba:</strong> The second day featuring parades and displays of horsemanship</li>
    <li><strong>Beli Damba:</strong> The final day with traditional drumming and dancing</li>
  </ul>
  
  <div class="roamsmart-tip">
    <div>
      <strong>📱 RoamSmart Tip:</strong><br>
      Planning to visit Northern Ghana for the Damba festival? Make sure you have enough data to capture and share the beautiful moments. Buy your data bundles on RoamSmart before you travel!
    </div>
  </div>
  
  <img src="https://i.imgur.com/k2kAipZ.png" alt="Traditional Dagomba royal procession" style="width:100%; border-radius:12px; margin:20px 0;">
  
  <h2>Traditional Dagomba Music and Dance</h2>
  <p>The Dagomba people are famous for their unique drumming styles, particularly the "Luna" (talking drum) and "Gungon" (bass drum). Traditional dances like the "Takai" and "Bamaya" are performed during festivals and special occasions.</p>
  
  <h2>Traditional Attire</h2>
  <p>The Dagomba people are known for their colorful traditional attire, including the famous "Bin-gbana" (hand-woven smock) worn by men and the "Gabili" (wrapper) worn by women. During festivals, you'll see beautiful embroidery and intricate patterns.</p>
  
  <h2>Dagomba Cuisine</h2>
  <ul>
    <li><strong>Tuo Zaafi (TZ):</strong> A staple food made from maize flour, served with green vegetable soup</li>
    <li><strong>Wasawasa:</strong> Yam flour pudding served with pepper sauce</li>
    <li><strong>Koko:</strong> Traditional millet porridge</li>
  </ul>
  
  <div class="fun-fact">
    <h4>🎵 Fun Fact</h4>
    <p>The "Bamaya" dance, traditionally performed by men, tells the story of a drought that was so severe that men had to dress as women to perform rituals to bring rain.</p>
  </div>
  
  <div class="cta-box">
    <h3>Experience Ghana's Diversity</h3>
    <p>Stay connected as you explore the rich cultures of Ghana. Get your RoamSmart data bundle today!</p>
    <a href="/register" class="btn-primary">Get Started</a>
  </div>`,
  image: 'https://i.imgur.com/PCgSLn5.png',
  category: 'Culture',
  author: 'Cultural Heritage Team',
  authorBio: 'Dedicated to preserving and sharing Ghana\'s diverse cultural heritage',
  date: '2024-05-28',
  readTime: 10,
  views: 4500,
  likes: 234,
  tags: ['Dagomba', 'Northern Ghana', 'culture', 'festivals', 'Damba', 'Yaa Naa', 'Dagbon']
},
  {
    
  id: 14,
  slug: 'ghanaian-culture-traditions',
  title: 'Ghanaian Culture: Rich Traditions and Heritage',
  excerpt: 'Explore the diverse cultural heritage of Ghana, from traditional festivals to unique customs...',
  content: `<p>Ghana is a country rich in cultural diversity, with over 100 ethnic groups each maintaining their unique traditions and customs.</p>
  
  <!-- Use your direct image link here -->
  <img src="https://i.imgur.com/8CaLumw.png" alt="Ghanaian cultural festival" style="width:100%; border-radius:12px; margin:20px 0;">
  
  <h2>Major Ethnic Groups</h2>
  <p>The major ethnic groups in Ghana include the Akan, Mole-Dagbon, Ewe, Ga-Dangme, and Gurma. Each group has its own language, customs, and traditional governance systems.</p>
  
  <h2>Traditional Festivals</h2>
  <p>Ghana is known as the "Festival Kingdom" of Africa, with numerous celebrations throughout the year including Homowo, Aboakyer, Damba, and Panafest.</p>
  
  <!-- You can add more images here using the same method -->
  
  <div class="roamsmart-tip">
    <div>
      <strong>📱 RoamSmart Tip:</strong><br>
      Planning to attend a festival in Ghana? Make sure you're connected! Buy data bundles on RoamSmart to share your experience in real-time.
    </div>
  </div>
  
  <h2>Traditional Cuisine</h2>
  <p>Ghanaian food is diverse and flavorful, with dishes like Jollof Rice, Banku, Fufu, and Waakye being national favorites.</p>
  
  <div class="cta-box">
    <h3>Explore Ghana with RoamSmart</h3>
    <p>Stay connected as you discover the beauty of Ghanaian culture.</p>
    <a href="/register" class="btn-primary">Get Started</a>
  </div>`,
  image: 'https://i.imgur.com/8CaLumw.png', // Use your direct link here for the post's main image
  category: 'Culture',
  author: 'Cultural Team',
  authorBio: 'Exploring and sharing Ghana\'s rich cultural heritage',
  date: '2024-05-20',
  readTime: 8,
  views: 3200,
  likes: 189,
  tags: ['Ghana', 'culture', 'traditions', 'festivals']
}
];


// Blog List Component
export default function Blog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  
  const categories = ['All', 'Travel', 'Tech', 'Tips', 'Education', 'Business', 'Culture', 'Security'];
  
  const filteredPosts = BLOG_POSTS.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  return (
    <div className="blog-page">
      <div className="blog-hero">
        <div className="container">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            RoamSmart Blog
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            Travel tips, data guides, and stories from across Ghana
          </motion.p>
          
          <motion.div className="search-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search articles by title, tags, or keywords..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </motion.div>
        </div>
      </div>
      
      <div className="container">
        <div className="blog-filters">
          <button className="filter-toggle" onClick={() => setShowFilters(!showFilters)}>
            <FaFilter /> Categories {showFilters ? <FaTimes /> : null}
          </button>
          <div className={`filter-list ${showFilters ? 'show' : ''}`}>
            {categories.map(cat => (
              <button key={cat} className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        <div className="blog-grid">
          {filteredPosts.map((post, index) => (
            <motion.div key={post.id} className="blog-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -5 }}>
              <Link to={`/blog/${post.slug}`}>
                <div className="card-image">
                  <img src={post.image} alt={post.title} />
                  <div className="card-category">{post.category}</div>
                </div>
                <div className="card-content">
                  <h3>{post.title}</h3>
                  <p>{post.excerpt.substring(0, 120)}...</p>
                  <div className="card-meta">
                    <span><FaCalendar /> {new Date(post.date).toLocaleDateString()}</span>
                    <span><FaClock /> {post.readTime} min</span>
                    <span><FaEye /> {post.views.toLocaleString()}</span>
                  </div>
                  <div className="read-more">Read More <FaArrowRight /></div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        
        {filteredPosts.length === 0 && (
          <div className="no-results">
            <h3>No articles found</h3>
            <p>Try a different search term or category</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Blog Detail Component
export function BlogPost() {
  const { slug } = useParams();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  
  const post = BLOG_POSTS.find(p => p.slug === slug);
  
  // ✅ Hooks at the top level (before conditional return)
  useEffect(() => {
    if (post) {
      setLikesCount(post.likes || 0);
      // Check localStorage for liked status
      const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '[]');
      if (likedPosts.includes(post.id)) {
        setLiked(true);
      }
    }
  }, [post]);
  
  // ✅ Conditional return AFTER hooks
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
  
  const handleLike = () => {
    const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '[]');
    if (liked) {
      setLikesCount(likesCount - 1);
      const updated = likedPosts.filter(id => id !== post.id);
      localStorage.setItem('liked_posts', JSON.stringify(updated));
    } else {
      setLikesCount(likesCount + 1);
      likedPosts.push(post.id);
      localStorage.setItem('liked_posts', JSON.stringify(likedPosts));
    }
    setLiked(!liked);
  };
  
  const shareOnWhatsApp = () => {
    const url = window.location.href;
    const text = `Check out this article: ${post.title}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
  };
  
  const shareOnFacebook = () => {
    const url = window.location.href;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };
  
  const shareOnTwitter = () => {
    const url = window.location.href;
    const text = post.title;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };
  
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };
  
  const relatedPosts = BLOG_POSTS.filter(p => p.category === post.category && p.id !== post.id).slice(0, 3);
  
  return (
    <div className="blog-post-page">
      <div className="container">
        <Link to="/blog" className="back-to-blog">← Back to Blog</Link>
        
        <div className="post-hero">
          <div className="post-category">{post.category}</div>
          <h1>{post.title}</h1>
          <div className="post-meta">
            <span><FaUser /> {post.author}</span>
            <span><FaCalendar /> {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span><FaClock /> {post.readTime} min read</span>
            <span><FaEye /> {post.views.toLocaleString()} views</span>
          </div>
        </div>
        
        <div className="post-featured-image">
          <img src={post.image} alt={post.title} />
        </div>
        
        <div className="post-content">
          <div className="blog-content-body" dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
        
        {post.authorBio && (
          <div className="author-bio">
            <div className="author-avatar"><FaUser /></div>
            <div className="author-info">
              <h4>About {post.author}</h4>
              <p>{post.authorBio}</p>
            </div>
          </div>
        )}
        
        <div className="post-tags">
          <h4><FaTag /> Tags:</h4>
          <div className="tags-list">
            {post.tags.map(tag => (
              <Link key={tag} to={`/blog?tag=${tag}`} className="tag">{tag}</Link>
            ))}
          </div>
        </div>
        
        <div className="post-actions">
          <button className={`like-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
            {liked ? <FaHeart /> : <FaRegHeart />}
            <span>{likesCount} Likes</span>
          </button>
          
          <div className="share-buttons">
            <span>Share:</span>
            <button onClick={shareOnWhatsApp} className="share-btn whatsapp"><FaWhatsapp /></button>
            <button onClick={shareOnFacebook} className="share-btn facebook"><FaFacebook /></button>
            <button onClick={shareOnTwitter} className="share-btn twitter"><FaTwitter /></button>
            <button onClick={copyLink} className="share-btn link"><FaLink /></button>
          </div>
        </div>
        
        {relatedPosts.length > 0 && (
          <div className="related-posts">
            <h3>Related Articles</h3>
            <div className="related-grid">
              {relatedPosts.map(relatedPost => (
                <Link key={relatedPost.id} to={`/blog/${relatedPost.slug}`} className="related-card">
                  <img src={relatedPost.image} alt={relatedPost.title} />
                  <h4>{relatedPost.title}</h4>
                  <p>{relatedPost.excerpt.substring(0, 80)}...</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}