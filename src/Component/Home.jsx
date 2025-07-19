import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chartVisible, setChartVisible] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartLoaded, setChartLoaded] = useState(false);
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  let navidate = useNavigate()

  useEffect(() => {
    fetchCoins();
  }, [page]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const showChart = () => {
    navidate('/LiveCryptoChart')
    // If you want to show a loading animation, uncomment the next two lines:
    // setChartLoading(true);
    // setTimeout(() => setChartLoading(false), 4000);
  };

  const goHome = () => {
    setChartVisible(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchCoins();
  };

  const fetchCoins = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try CoinGecko API first (free tier)
      const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=${page}&sparkline=false`);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();

      if (!data || data.length === 0) {
        throw new Error('No data received from API');
      }

      setCoins(data);
      setLoading(false);
    } catch (error) {
      console.error('CoinGecko API Error:', error);
      
      // Try CoinCap as fallback
      try {
        const coinCapRes = await fetch(`https://api.coincap.io/v2/assets?limit=20&offset=${(page - 1) * 20}`);
        
        if (!coinCapRes.ok) {
          throw new Error(`CoinCap HTTP ${coinCapRes.status}: ${coinCapRes.statusText}`);
        }
        
        const coinCapData = await coinCapRes.json();
        
        if (!coinCapData.data || coinCapData.data.length === 0) {
          throw new Error('No data received from CoinCap API');
        }
        
        // Transform CoinCap data to match our format
        const transformedData = coinCapData.data.map(coin => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          image: `https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`,
          current_price: parseFloat(coin.priceUsd),
          market_cap: parseFloat(coin.marketCapUsd),
          total_volume: parseFloat(coin.volumeUsd24Hr),
          price_change_percentage_24h: parseFloat(coin.changePercent24Hr)
        }));

        setCoins(transformedData);
        setLoading(false);
      } catch (fallbackError) {
        console.error('Fallback API Error:', fallbackError);
        
        // Show more specific error message
        let errorMessage = 'Unable to load crypto data.';
        if (error.message.includes('429')) {
          errorMessage = 'API rate limit exceeded. Please try again in a few minutes.';
        } else if (error.message.includes('404')) {
          errorMessage = 'API endpoint not found.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        setError({ message: errorMessage, details: error.message });
        setLoading(false);
      }
    }
  };

  const renderSkeleton = () => {
    return Array(20).fill('').map((_, index) => (
      <div key={index} className="skeleton">
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
    ));
  };

  const renderCoin = (coin) => {
    const fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNmMGYwZjAiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjOTk5Ii8+Cjwvc3ZnPgo8L3N2Zz4K';
    
    return (
      <div key={coin.id} className="coin">
        <div className="coin-header">
          <img src={coin.image} alt={coin.name} onError={(e) => { e.target.src = fallbackImage }} />
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
    );
  };

  return (
    <div className="app">
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
        }

        body {
          background: #f5f5f5;
          color: #222;
          overflow-x: hidden;
          padding-bottom: 80px; /* Space for fixed footer */
        }

        header {
          background: #111;
          color: #fff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        header h1 {
          cursor: pointer;
        }

        .menu-btn {
          font-size: 24px;
          cursor: pointer;
        }

        .coin-list {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          min-height: calc(100vh - 160px); /* Ensure content area fills screen */
        }

        .coin {
          background: #fff;
          padding: 1rem;
          border-radius: 10px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .skeleton {
          padding: 1rem;
          border-radius: 10px;
          background: #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }

        .skeleton-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .skeleton-img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(90deg, #eeeeee 25%, #dddddd 50%, #eeeeee 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite linear;
        }

        .skeleton-line {
          height: 14px;
          border-radius: 6px;
          background: linear-gradient(90deg, #eeeeee 25%, #dddddd 50%, #eeeeee 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite linear;
        }

        .skeleton-title { width: 120px; }
        .skeleton-subtitle { width: 80px; margin-top: 5px; }

        .skeleton-price, .skeleton-meta {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
        }

        .skeleton-price .skeleton-line, .skeleton-meta .skeleton-line {
          width: 45%;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .coin-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .coin-header img {
          width: 40px;
          height: 40px;
        }

        .coin-price {
          display: flex;
          justify-content: space-between;
          margin-top: 0.5rem;
          font-weight: bold;
        }

        .coin-detail {
          margin-top: 0.5rem;
          font-size: 0.8rem;
          color: #666;
          display: flex;
          justify-content: space-between;
        }

        .green { color: green; }
        .red { color: red; }

        footer {
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 1rem;
          background: #fff;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          border-top: 1px solid #ddd;
          z-index: 50;
        }

        button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 5px;
          background: #111;
          color: #fff;
          font-weight: bold;
          cursor: pointer;
        }

        button:disabled {
          background: #aaa;
          cursor: not-allowed;
        }

        @media (min-width: 600px) {
          .coin-list { max-width: 500px; margin: auto; }
        }

        .sidebar {
          position: fixed;
          right: -300px;
          top: 0;
          width: 300px;
          height: 100%;
          background: #fff;
          box-shadow: -2px 0 5px rgba(0,0,0,0.2);
          transition: right 0.3s ease;
          z-index: 1000;
          padding: 1rem;
          border-top-left-radius: 15px;
          border-bottom-left-radius: 15px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .sidebar.open {
          right: 0;
        }

        .sidebar button {
          width: 100%;
          margin-bottom: 1rem;
        }

        .sidebar-links {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .sidebar-links a {
          text-align: center;
          color: #111;
          text-decoration: none;
          font-weight: bold;
          padding: 0.5rem;
          background: #f0f0f0;
          border-radius: 5px;
        }

        .chart-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: white;
          z-index: 200;
          display: ${chartVisible ? 'block' : 'none'};
        }

        .chart-container .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #111;
          color: white;
        }

        .chart-container .chart-header h2 {
          margin: 0;
        }

        .chart-container .close-btn {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 0.5rem;
        }

        .chart-container .chart-content {
          height: calc(100vh - 80px);
          padding: 0;
          margin: 0;
        }

        /* Professional Chart Loading Animation */
        .chart-loading {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.95);
          display: ${chartLoading ? 'flex' : 'none'};
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 300;
        }

        .chart-loading-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #111;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        .chart-loading-text {
          font-size: 18px;
          font-weight: bold;
          color: #111;
          margin-bottom: 0.5rem;
        }

        .chart-loading-subtext {
          font-size: 14px;
          color: #666;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Professional dots loading animation */
        .loading-dots {
          display: inline-block;
        }

        .loading-dots::after {
          content: '';
          animation: dots 1.5s infinite;
        }

        @keyframes dots {
          0%, 20% { content: ''; }
          40% { content: '.'; }
          60% { content: '..'; }
          80%, 100% { content: '...'; }
        }
      `}</style>

      <header>
        <h1 onClick={goHome}>CryptoQ</h1>
        <div className="menu-btn" onClick={toggleSidebar}>⋮</div>
      </header>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Menu</h3>
            <span onClick={toggleSidebar} style={{ fontSize: '24px', cursor: 'pointer' }}>&times;</span>
          </div>
          <button onClick={showChart}>Live Candle Chart</button>
        </div>
        <div className="sidebar-links">
          <a href="https://cryptoeyeapp.blogspot.com/2025/07/privacy-policy.html">Privacy Policy</a>
          <a href="https://cryptoeyeapp.blogspot.com/2025/07/terms-and-conditions.html">Terms and Conditions</a>
          <a href="https://cryptoeyeapp.blogspot.com/2025/07/about-us.html">About Us</a>
        </div>
      </div>

      {/* Chart Section */}
      <div className="chart-container">
        <div className="chart-header">
          <h2>Live Bitcoin Chart</h2>
          <button className="close-btn" onClick={goHome}>&times;</button>
        </div>
        <div className="chart-content">
          <div id="tradingview_chart"></div>
        </div>
        {/* Professional Loading Animation */}
        <div className="chart-loading">
          <div className="chart-loading-spinner"></div>
          <div className="chart-loading-text">Loading Chart<span className="loading-dots"></span></div>
          <div className="chart-loading-subtext">Please wait while we prepare your trading view</div>
        </div>
      </div>

      <div className="coin-list">
        {loading && !error && renderSkeleton()}
        {error && (
          <div className="coin" style={{ textAlign: 'center', padding: '2rem' }}>
            <h3 style={{ color: '#ff6b6b', marginBottom: '1rem' }}>⚠️ {error.message}</h3>
            <p style={{ marginBottom: '1rem', color: '#666' }}>Error: {error.details}</p>
            <button onClick={fetchCoins} style={{ background: '#111', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              🔄 Retry
            </button>
          </div>
        )}
        {!loading && !error && coins.map(renderCoin)}
      </div>

      <footer>
        <button onClick={() => { if (page > 1) setPage(page - 1) }} disabled={page === 1}>Previous</button>
        <span>Page {page}</span>
        <button onClick={() => setPage(page + 1)}>Next</button>
      </footer>

      {/* Load TradingView Script */}
      <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
    </div>
  );
};

export default Home;