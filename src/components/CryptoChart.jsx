import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ApexCharts from 'apexcharts';

const CryptoChart = () => {
  const [chart, setChart] = useState(null);
  const [currentTimeframe, setCurrentTimeframe] = useState('30');
  const [activeIndicators, setActiveIndicators] = useState(new Set());
  const [isLive, setIsLive] = useState(true);
  const [currentCoin, setCurrentCoin] = useState('bitcoin');
  const [coinsList, setCoinsList] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [priceData, setPriceData] = useState({
    currentPrice: '$0.00',
    highPrice: '$0.00',
    lowPrice: '$0.00',
    marketCap: '$0.00',
    priceChange: '0.00%',
    priceChangeClass: 'price-value price-change',
    volumeValue: '$0.00'
  });
  
  const dropdownRef = useRef(null);
  const updateIntervalRef = useRef(null);
  const navigate = useNavigate();

  // Get URL parameters
  const getUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      id: urlParams.get('id'),
      name: urlParams.get('name'),
      symbol: urlParams.get('symbol'),
      image: urlParams.get('image'),
      currentPrice: urlParams.get('currentPrice'),
      priceChange: urlParams.get('priceChange')
    };
  };

  const urlParams = getUrlParams();

  // Load coins list
  const loadCoinsList = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CryptoEye/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const coins = await response.json();
      
      if (!Array.isArray(coins) || coins.length === 0) {
        throw new Error('Invalid coins data received');
      }
      
      setCoinsList(coins);
    } catch (error) {
      console.error('Error loading coins:', error);
      
      // Provide fallback coins list
      const fallbackCoins = [
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'btc', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
        { id: 'ethereum', name: 'Ethereum', symbol: 'eth', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
        { id: 'binancecoin', name: 'BNB', symbol: 'bnb', image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' },
        { id: 'solana', name: 'Solana', symbol: 'sol', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
        { id: 'cardano', name: 'Cardano', symbol: 'ada', image: 'https://assets.coingecko.com/coins/images/975/large/Cardano.png' },
        { id: 'polkadot', name: 'Polkadot', symbol: 'dot', image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot_new_logo.png' },
        { id: 'dogecoin', name: 'Dogecoin', symbol: 'doge', image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png' },
        { id: 'avalanche-2', name: 'Avalanche', symbol: 'avax', image: 'https://assets.coingecko.com/coins/images/12559/large/avalanche.png' },
        { id: 'chainlink', name: 'Chainlink', symbol: 'link', image: 'https://assets.coingecko.com/coins/images/877/large/chainlink.png' },
        { id: 'polygon', name: 'Polygon', symbol: 'matic', image: 'https://assets.coingecko.com/coins/images/4713/large/matic.png' }
      ];
      
      setCoinsList(fallbackCoins);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch chart data
  const fetchChartData = async () => {
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        if (retryCount > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
        
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/${currentCoin}/ohlc?vs_currency=usd&days=${currentTimeframe}`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'CryptoEye/1.0'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Invalid or empty data received');
        }
        
        return data.map(item => ({
          x: item[0],
          y: [item[1], item[2], item[3], item[4]]
        }));
      } catch (error) {
        console.error(`Attempt ${retryCount + 1} failed:`, error);
        retryCount++;
        
        if (retryCount >= maxRetries) {
          console.error('All retry attempts failed for chart data');
          return [];
        }
      }
    }
    return [];
  };

  // Fetch coin data
  const fetchCoinData = async () => {
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        if (retryCount > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
        
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/${currentCoin}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'CryptoEye/1.0'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data || !data.market_data) {
          throw new Error('Invalid coin data received');
        }
        
        return data;
      } catch (error) {
        console.error(`Attempt ${retryCount + 1} failed:`, error);
        retryCount++;
        
        if (retryCount >= maxRetries) {
          console.error('All retry attempts failed for coin data');
          return null;
        }
      }
    }
    return null;
  };

  // Calculate SMA
  const calculateSMA = (data, period) => {
    const sma = [];
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].y[3]; // Close price
      }
      sma.push({
        x: data[i].x,
        y: sum / period
      });
    }
    return sma;
  };

  // Calculate EMA
  const calculateEMA = (data, period) => {
    const ema = [];
    const multiplier = 2 / (period + 1);
    let emaValue = data[0].y[3]; // Start with first close
    
    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        emaValue = data[i].y[3];
      } else {
        emaValue = (data[i].y[3] * multiplier) + (emaValue * (1 - multiplier));
      }
      ema.push({
        x: data[i].x,
        y: emaValue
      });
    }
    return ema;
  };

  // Calculate Bollinger Bands
  const calculateBollingerBands = (data, period) => {
    const sma = calculateSMA(data, period);
    const upper = [];
    const lower = [];
    
    for (let i = 0; i < sma.length; i++) {
      const dataIndex = i + period - 1;
      let sum = 0;
      
      // Calculate standard deviation
      for (let j = 0; j < period; j++) {
        const close = data[dataIndex - j].y[3];
        sum += Math.pow(close - sma[i].y, 2);
      }
      
      const stdDev = Math.sqrt(sum / period);
      
      upper.push({
        x: sma[i].x,
        y: sma[i].y + (stdDev * 2)
      });
      
      lower.push({
        x: sma[i].x,
        y: sma[i].y - (stdDev * 2)
      });
    }
    
    return { upper, lower };
  };

  // Add indicators to series
  const addIndicators = (series, candlestickData) => {
    if (activeIndicators.has('sma')) {
      series.push({
        name: 'SMA 20',
        type: 'line',
        data: calculateSMA(candlestickData, 20),
        color: '#2196F3'
      });
    }
    
    if (activeIndicators.has('ema')) {
      series.push({
        name: 'EMA 20',
        type: 'line',
        data: calculateEMA(candlestickData, 20),
        color: '#FF9800'
      });
    }
    
    if (activeIndicators.has('bollinger')) {
      const bollinger = calculateBollingerBands(candlestickData, 20);
      series.push({
        name: 'Upper Band',
        type: 'line',
        data: bollinger.upper,
        color: '#9C27B0'
      });
      series.push({
        name: 'Lower Band',
        type: 'line',
        data: bollinger.lower,
        color: '#9C27B0'
      });
    }
  };

  // Update price info
  const updatePriceInfo = (coinData) => {
    if (!coinData || !coinData.market_data) return;
    
    const marketData = coinData.market_data;
    
    setPriceData({
      currentPrice: '$' + marketData.current_price.usd.toLocaleString(),
      highPrice: '$' + marketData.high_24h.usd.toLocaleString(),
      lowPrice: '$' + marketData.low_24h.usd.toLocaleString(),
      marketCap: '$' + marketData.market_cap.usd.toLocaleString(),
      priceChange: `${marketData.price_change_percentage_24h >= 0 ? '+' : ''}${marketData.price_change_percentage_24h.toFixed(2)}%`,
      priceChangeClass: `price-value price-change ${marketData.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`,
      volumeValue: '$' + marketData.total_volume.usd.toLocaleString()
    });
  };

  // Create chart
  const createChart = async () => {
    setIsLoading(true);
    try {
      const [chartData, coinData] = await Promise.all([
        fetchChartData(),
        fetchCoinData()
      ]);
      
      if (chartData.length === 0) {
        const fallbackData = await fetchFallbackChartData();
        if (fallbackData.length === 0) {
          return (
            <div className="loading">
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ color: '#ff4444', marginBottom: '10px' }}>⚠️ Failed to load chart data</div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                  This might be due to API or network issues.
                </div>
                <button onClick={() => window.location.reload()} style={{
                  background: '#007bff', 
                  color: 'white', 
                  border: 'none', 
                  padding: '10px 20px', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  fontSize: '14px'
                }}>Retry</button>
              </div>
            </div>
          );
        }
        chartData.push(...fallbackData);
      }
      
      const series = [{
        name: 'Price',
        type: 'candlestick',
        data: chartData
      }];
      
      // Add indicators
      addIndicators(series, chartData);
      
      const options = {
        series: series,
        chart: {
          height: '100%',
          type: 'candlestick',
          background: 'transparent',
          toolbar: {
            show: true,
            tools: {
              download: true,
              selection: true,
              zoom: true,
              zoomin: true,
              zoomout: true,
              pan: true,
              reset: true
            }
          },
          zoom: {
            enabled: true,
            type: 'x',
            autoScaleYaxis: true
          }
        },
        plotOptions: {
          candlestick: {
            colors: {
              upward: '#26a69a',
              downward: '#ef5350'
            },
            wick: {
              useFillColor: true
            }
          }
        },
        xaxis: {
          type: 'datetime',
          labels: {
            style: {
              colors: '#666'
            }
          },
          axisBorder: {
            color: '#e0e0e0'
          },
          axisTicks: {
            color: '#e0e0e0'
          }
        },
        yaxis: {
          tooltip: {
            enabled: true
          },
          labels: {
            style: {
              colors: '#666'
            },
            formatter: function(val) {
              return val ? '$' + val.toFixed(2) : '';
            }
          },
          title: {
            text: 'Price (USD)',
            style: {
              color: '#666'
            }
          }
        },
        grid: {
          borderColor: '#e0e0e0',
          strokeDashArray: 1
        },
        tooltip: {
          enabled: true,
          theme: 'light',
          style: {
            fontSize: '12px'
          },
          custom: function({seriesIndex, dataPointIndex, w}) {
            const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
            if (seriesIndex === 0) { // Candlestick
              const o = data.y[0];
              const h = data.y[1];
              const l = data.y[2];
              const c = data.y[3];
              const change = ((c - o) / o * 100).toFixed(2);
              const date = new Date(data.x).toLocaleDateString();
              
              return `
                <div style="padding: 10px; background: white; border: 1px solid #ddd; border-radius: 4px;">
                  <div><strong>Date:</strong> ${date}</div>
                  <div><strong>Open:</strong> $${o.toFixed(2)}</div>
                  <div><strong>High:</strong> $${h.toFixed(2)}</div>
                  <div><strong>Low:</strong> $${l.toFixed(2)}</div>
                  <div><strong>Close:</strong> $${c.toFixed(2)}</div>
                  <div><strong>Change:</strong> <span style="color: ${change >= 0 ? '#26a69a' : '#ef5350'}">${change}%</span></div>
                </div>
              `;
            }
            return '';
          }
        },
        legend: {
          show: false
        }
      };
      
      if (chart) {
        chart.destroy();
      }
      
      const newChart = new ApexCharts(document.getElementById('chart'), options);
      newChart.render();
      setChart(newChart);
      
      // Update price info
      updatePriceInfo(coinData);
      
    } catch (error) {
      console.error('Error creating chart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch fallback chart data
  const fetchFallbackChartData = async () => {
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/${currentCoin}/market_chart?vs_currency=usd&days=${currentTimeframe}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CryptoEye/1.0'
        }
      });
      
      if (!response.ok) {
        return [];
      }
      
      const data = await response.json();
      
      if (data.prices && data.prices.length > 0) {
        const ohlcData = [];
        for (let i = 0; i < data.prices.length - 1; i++) {
          const current = data.prices[i];
          const next = data.prices[i + 1];
          
          ohlcData.push({
            x: current[0],
            y: [current[1], Math.max(current[1], next[1]), Math.min(current[1], next[1]), next[1]]
          });
        }
        return ohlcData;
      }
      
      return [];
    } catch (error) {
      console.error('Fallback data fetch failed:', error);
      return [];
    }
  };

  // Start live updates
  const startLiveUpdates = () => {
    updateIntervalRef.current = setInterval(async () => {
      if (isLive) {
        try {
          const coinData = await fetchCoinData();
          updatePriceInfo(coinData);
        } catch (error) {
          console.error('Live update failed:', error);
        }
      }
    }, 30000); // Update every 30 seconds
  };

  // Toggle indicator
  const toggleIndicator = (indicator) => {
    const newIndicators = new Set(activeIndicators);
    if (newIndicators.has(indicator)) {
      newIndicators.delete(indicator);
    } else {
      newIndicators.add(indicator);
    }
    setActiveIndicators(newIndicators);
    createChart();
  };

  // Handle timeframe change
  const handleTimeframeChange = (timeframe) => {
    setCurrentTimeframe(timeframe);
    createChart();
  };

  // Handle coin selection
  const handleCoinSelect = (coinId) => {
    const coin = coinsList.find(c => c.id === coinId);
    if (coin) {
      setCurrentCoin(coinId);
      document.getElementById('selectedSymbol').textContent = coin.name;
      setIsDropdownOpen(false);
      createChart();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize component
  useEffect(() => {
    loadCoinsList();
    
    // Set initial coin from URL parameters if available
    if (urlParams.id) {
      setCurrentCoin(urlParams.id);
      if (urlParams.name) {
        document.getElementById('selectedSymbol').textContent = urlParams.name;
      }
      
      // Update price info if available from URL
      if (urlParams.currentPrice) {
        setPriceData(prev => ({
          ...prev,
          currentPrice: '$' + parseFloat(urlParams.currentPrice).toLocaleString()
        }));
      }
      if (urlParams.priceChange) {
        const change = parseFloat(urlParams.priceChange);
        setPriceData(prev => ({
          ...prev,
          priceChange: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
          priceChangeClass: `price-value price-change ${change >= 0 ? 'positive' : 'negative'}`
        }));
      }
    }
    
    createChart();
    startLiveUpdates();
    
    return () => {
      if (chart) {
        chart.destroy();
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  // Recreate chart when currentCoin or currentTimeframe changes
  useEffect(() => {
    createChart();
  }, [currentCoin, currentTimeframe, activeIndicators]);

  // Go back function
  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="chart-container">
      <div className="header">
        <div className="symbol-info">
          <button onClick={goBack} style={{ background: '#111', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', marginRight: '10px', fontSize: '14px' }}>← Back</button>
          <div className="symbol-selector" ref={dropdownRef}>
            <div 
              className={`symbol-dropdown ${isDropdownOpen ? 'active' : ''}`} 
              id="symbolDropdown"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span id="selectedSymbol">Bitcoin</span>
              <span className="dropdown-arrow">▼</span>
            </div>
            <div className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`} id="dropdownMenu">
              {isLoading ? (
                <div className="loading">
                  <div className="spinner"></div>
                  Loading coins...
                </div>
              ) : (
                coinsList.map(coin => (
                  <div 
                    key={coin.id} 
                    className="dropdown-item" 
                    data-coin={coin.id}
                    onClick={() => handleCoinSelect(coin.id)}
                  >
                    <img src={coin.image} alt={coin.name} className="coin-icon" />
                    <span>{coin.name} ({coin.symbol.toUpperCase()})</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <span className="symbol-exchange">24H • Crypto</span>
        </div>
        
        <div className="price-data">
          <div className="price-item">
            <span className="price-label">Price</span>
            <span className="price-value">{priceData.currentPrice}</span>
          </div>
          <div className="price-item">
            <span className="price-label">24h High</span>
            <span className="price-value">{priceData.highPrice}</span>
          </div>
          <div className="price-item">
            <span className="price-label">24h Low</span>
            <span className="price-value">{priceData.lowPrice}</span>
          </div>
          <div className="price-item">
            <span className="price-label">Market Cap</span>
            <span className="price-value">{priceData.marketCap}</span>
          </div>
          <div className="price-item">
            <span className="price-label">24h Change</span>
            <span className={priceData.priceChangeClass}>{priceData.priceChange}</span>
          </div>
        </div>
        
        <div className="controls">
          <div className="time-frame">
            <button 
              className={`time-btn ${currentTimeframe === '1' ? 'active' : ''}`} 
              data-timeframe="1"
              onClick={() => handleTimeframeChange('1')}
            >
              1D
            </button>
            <button 
              className={`time-btn ${currentTimeframe === '7' ? 'active' : ''}`} 
              data-timeframe="7"
              onClick={() => handleTimeframeChange('7')}
            >
              7D
            </button>
            <button 
              className={`time-btn ${currentTimeframe === '30' ? 'active' : ''}`} 
              data-timeframe="30"
              onClick={() => handleTimeframeChange('30')}
            >
              30D
            </button>
            <button 
              className={`time-btn ${currentTimeframe === '90' ? 'active' : ''}`} 
              data-timeframe="90"
              onClick={() => handleTimeframeChange('90')}
            >
              90D
            </button>
            <button 
              className={`time-btn ${currentTimeframe === '365' ? 'active' : ''}`} 
              data-timeframe="365"
              onClick={() => handleTimeframeChange('365')}
            >
              1Y
            </button>
          </div>
        </div>
      </div>
      
      <div className="chart-area">
        <div className="volume-info">
          <strong>Volume</strong> 24h <span id="volumeValue">{priceData.volumeValue}</span>
        </div>
        
        <div className="indicators">
          <button 
            className={`indicator-btn ${activeIndicators.has('sma') ? 'active' : ''}`} 
            data-indicator="sma"
            onClick={() => toggleIndicator('sma')}
          >
            SMA
          </button>
          <button 
            className={`indicator-btn ${activeIndicators.has('ema') ? 'active' : ''}`} 
            data-indicator="ema"
            onClick={() => toggleIndicator('ema')}
          >
            EMA
          </button>
          <button 
            className={`indicator-btn ${activeIndicators.has('bollinger') ? 'active' : ''}`} 
            data-indicator="bollinger"
            onClick={() => toggleIndicator('bollinger')}
          >
            Bollinger
          </button>
          <button 
            className={`indicator-btn ${activeIndicators.has('rsi') ? 'active' : ''}`} 
            data-indicator="rsi"
            onClick={() => toggleIndicator('rsi')}
          >
            RSI
          </button>
          <button 
            className={`indicator-btn ${activeIndicators.has('macd') ? 'active' : ''}`} 
            data-indicator="macd"
            onClick={() => toggleIndicator('macd')}
          >
            MACD
          </button>
        </div>
        
        <div className="live-indicator">
          <div className="live-dot"></div>
          <span>Live Data</span>
        </div>
        
        <div id="chart">
          {isLoading && (
            <div className="loading">
              <div className="spinner"></div>
              Loading chart data...
            </div>
          )}
        </div>
        
        <div className="crosshair" id="crosshair">
          <div className="crosshair-line crosshair-horizontal" id="horizontalLine"></div>
          <div className="crosshair-line crosshair-vertical" id="verticalLine"></div>
        </div>
        
        <div className="price-tooltip" id="priceTooltip"></div>
      </div>
    </div>
  );
};

export default CryptoChart;