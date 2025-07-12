import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CryptoPrices.css'; // We'll create this CSS file separately

const CryptoPrices = () => {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCoins();
  }, [page]);

  const fetchCoins = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use a CORS proxy to avoid CORS issues
      const corsProxy = 'https://cors-anywhere.herokuapp.com/';
      const coinGeckoUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=${page}&sparkline=false`;
      
      const res = await fetch(corsProxy + coinGeckoUrl, {
        headers: {
          'Origin': 'http://localhost:5173'
        }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      let data = await res.json();

      if (!data || data.length === 0) {
        throw new Error('No data received from API');
      }

      setCoins(data);
    } catch (error) {
      console.error('CoinGecko API Error:', error);
      
      // Try alternative approach with different API
      try {
        // Use a different CORS proxy and API
        const alternativeUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false')}`;
        
        const altRes = await fetch(alternativeUrl);
        
        if (!altRes.ok) {
          throw new Error(`Alternative API HTTP ${altRes.status}: ${altRes.statusText}`);
        }
        
        const altData = await altRes.json();
        
        if (!altData || altData.length === 0) {
          throw new Error('No data received from alternative API');
        }

        setCoins(altData);
      } catch (fallbackError) {
        console.error('Fallback API Error:', fallbackError);
        
        // Use mock data as final fallback
        const mockData = [
          {
            id: 'bitcoin',
            name: 'Bitcoin',
            symbol: 'btc',
            image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1547033579',
            current_price: 45000,
            market_cap: 850000000000,
            total_volume: 25000000000,
            price_change_percentage_24h: 2.5
          },
          {
            id: 'ethereum',
            name: 'Ethereum',
            symbol: 'eth',
            image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880',
            current_price: 3200,
            market_cap: 380000000000,
            total_volume: 15000000000,
            price_change_percentage_24h: 1.8
          },
          {
            id: 'binancecoin',
            name: 'BNB',
            symbol: 'bnb',
            image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png?1644979850',
            current_price: 320,
            market_cap: 48000000000,
            total_volume: 800000000,
            price_change_percentage_24h: -0.5
          },
          {
            id: 'solana',
            name: 'Solana',
            symbol: 'sol',
            image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png?1640133422',
            current_price: 95,
            market_cap: 42000000000,
            total_volume: 1200000000,
            price_change_percentage_24h: 3.2
          },
          {
            id: 'cardano',
            name: 'Cardano',
            symbol: 'ada',
            image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png?1547034860',
            current_price: 0.45,
            market_cap: 16000000000,
            total_volume: 400000000,
            price_change_percentage_24h: 1.1
          }
        ];
        
        setCoins(mockData);
        
        let errorMessage = 'Using demo data due to API limitations.';
        if (error.message.includes('429')) {
          errorMessage = 'API rate limit exceeded. Using demo data.';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'CORS policy blocked API access. Using demo data.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Using demo data.';
        }
        
        setError({
          message: errorMessage,
          details: 'This is demo data for development purposes.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const openChart = () => {
    navigate('/chart');
  };

  const closeChart = () => {
    // This function is no longer needed as the chart is now a modal
  };

  const goHome = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchCoins();
  };

  const redirectToStockFixed = (coin) => {
    // In a real app, you would navigate to a different route
    console.log('Redirecting to stock fixed view for:', coin);
    // window.location.href = `stock_fixed.html?id=${coin.id}&name=${coin.name}&symbol=${coin.symbol}&image=${coin.image}&currentPrice=${coin.current_price}&priceChange=${coin.price_change_percentage_24h}`;
  };

  const prevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const nextPage = () => {
    setPage(page + 1);
  };

  return (
    <div className="app">
      <header>
        <h1 onClick={goHome}>CryptoEye</h1>
        <div className="menu-btn" onClick={toggleSidebar}>⋮</div>
      </header>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div>
          <div className="sidebar-header">
            <h3>Menu</h3>
            <span onClick={toggleSidebar}>&times;</span>
          </div>
          <button onClick={openChart}>Live Candle Chart</button>
        </div>
        <div className="sidebar-links">
          <a href="https://cryptoeyeapp.blogspot.com/2025/07/privacy-policy.html">Privacy Policy</a>
          <a href="https://cryptoeyeapp.blogspot.com/2025/07/terms-and-conditions.html">Terms and Conditions</a>
          <a href="https://cryptoeyeapp.blogspot.com/2025/07/about-us.html">About Us</a>
        </div>
      </div>

      {/* Chart Section */}
      {/* This section is no longer needed as the chart is now a modal */}

      {/* Coin List */}
      <div className="coin-list">
        {loading ? (
          Array(20).fill('').map((_, index) => (
            <div className="skeleton" key={index}>
              <div className="skeleton-header">
                <div className="skeleton-img"></div>
                <div>
                  <div className="skeleton-line skeleton-title"></div>
                  <div className="skeleton-line skeleton-subtitle"></div>
                </div>
              </div>
              <div className="skeleton-price">
                <div className="skeleton-line"></div>
                <div className="skeleton-line"></div>
              </div>
              <div className="skeleton-meta">
                <div className="skeleton-line"></div>
                <div className="skeleton-line"></div>
              </div>
            </div>
          ))
        ) : error ? (
          <div className="coin" style={{ textAlign: 'center', padding: '2rem' }}>
            <h3 style={{ color: '#ff6b6b', marginBottom: '1rem' }}>⚠️ {error.message}</h3>
            <p style={{ marginBottom: '1rem', color: '#666' }}>Error: {error.details}</p>
            <button 
              onClick={fetchCoins} 
              style={{ 
                background: '#111', 
                color: 'white', 
                padding: '0.5rem 1rem', 
                border: 'none', 
                borderRadius: '5px', 
                cursor: 'pointer' 
              }}
            >
              🔄 Retry
            </button>
          </div>
        ) : (
          coins.map(coin => (
            <div 
              className="coin" 
              key={coin.id} 
              onClick={() => redirectToStockFixed(coin)}
            >
              <div className="coin-header">
                <img 
                  src={coin.image} 
                  alt={coin.name} 
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNmMGYwZjAiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjOTk5Ii8+Cjwvc3ZnPgo8L3N2Zz4K';
                  }} 
                />
                <div>
                  <h2>{coin.name}</h2>
                  <span>{coin.symbol.toUpperCase()}</span>
                </div>
              </div>
              <div className="coin-price">
                <p>${coin.current_price ? coin.current_price.toLocaleString() : 'N/A'}</p>
                <p className={coin.price_change_percentage_24h >= 0 ? 'green' : 'red'}>
                  {coin.price_change_percentage_24h ? coin.price_change_percentage_24h.toFixed(2) : '0.00'}%
                </p>
              </div>
              <div className="coin-detail">
                <small>Market Cap: ${coin.market_cap ? coin.market_cap.toLocaleString() : 'N/A'}</small>
                <small>Volume: ${coin.total_volume ? coin.total_volume.toLocaleString() : 'N/A'}</small>
              </div>
            </div>
          ))
        )}
      </div>

      <footer>
        <button id="prev" onClick={prevPage} disabled={page === 1}>Previous</button>
        <span id="page">Page {page}</span>
        <button id="next" onClick={nextPage}>Next</button>
      </footer>
    </div>
  );
};

export default CryptoPrices;