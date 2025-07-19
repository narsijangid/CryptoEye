import React, { useState, useEffect, useRef } from 'react';
import ReactApexChart from 'react-apexcharts';

const LiveCryptoChart = () => {
  const [currentTimeframe, setCurrentTimeframe] = useState('30');
  const [activeIndicators, setActiveIndicators] = useState(new Set());
  const [isLive, setIsLive] = useState(true);
  const [currentCoin, setCurrentCoin] = useState('bitcoin');
  const [coinsList, setCoinsList] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [coinData, setCoinData] = useState(null);
  const [selectedCoinName, setSelectedCoinName] = useState('Bitcoin');
  const [series, setSeries] = useState([]);
  const [options, setOptions] = useState({});

  const dropdownRef = useRef(null);

  // Load coins list on component mount
  useEffect(() => {
    const loadCoinsList = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false');
        const coins = await response.json();
        setCoinsList(coins);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading coins:', error);
        setIsLoading(false);
      }
    };
    loadCoinsList();
  }, []);

  // Fetch chart and coin data when currentCoin, timeframe, or indicators change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const chartData = await fetchChartData();
      const coinData = await fetchCoinData();
      setCoinData(coinData);
      if (chartData.length === 0) {
        setSeries([]);
        setIsLoading(false);
        return;
      }
      const mainSeries = [{
        name: 'Price',
        type: 'candlestick',
        data: chartData
      }];
      addIndicators(mainSeries, chartData);
      setSeries(mainSeries);
      setOptions(getChartOptions());
      setIsLoading(false);
    };
    fetchData();
    // eslint-disable-next-line
  }, [currentCoin, currentTimeframe, activeIndicators]);

  // Update price info periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (isLive) {
        fetchCoinData().then(setCoinData);
      }
    }, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [isLive, currentCoin]);

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

  const fetchChartData = async () => {
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/${currentCoin}/ohlc?vs_currency=usd&days=${currentTimeframe}`);
      const data = await response.json();
      return data.map(item => ({
        x: item[0],
        y: [item[1], item[2], item[3], item[4]]
      }));
    } catch (error) {
      console.error('Error fetching chart data:', error);
      return [];
    }
  };

  const fetchCoinData = async () => {
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/${currentCoin}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching coin data:', error);
      return null;
    }
  };

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

  const calculateBollingerBands = (data, period) => {
    const sma = calculateSMA(data, period);
    const upper = [];
    const lower = [];
    for (let i = 0; i < sma.length; i++) {
      const dataIndex = i + period - 1;
      let sum = 0;
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

  const getChartOptions = () => ({
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
      custom: function({series, seriesIndex, dataPointIndex, w}) {
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
  });

  const toggleIndicator = (indicator) => {
    const newIndicators = new Set(activeIndicators);
    if (newIndicators.has(indicator)) {
      newIndicators.delete(indicator);
    } else {
      newIndicators.add(indicator);
    }
    setActiveIndicators(newIndicators);
  };

  const handleCoinSelect = (coinId, coinName) => {
    setCurrentCoin(coinId);
    setSelectedCoinName(coinName);
    setIsDropdownOpen(false);
  };

  const handleTimeframeChange = (timeframe) => {
    setCurrentTimeframe(timeframe);
  };

  return (
    <div className="chart-container">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #ffffff;
          color: #333333;
          overflow-x: hidden;
        }
        
        .chart-container {
          width: 100%;
          height: 100vh;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        
        .header {
          background: #ffffff;
          padding: 15px 20px;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
          min-height: 80px;
        }
        
        .symbol-info {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        
        .symbol-selector {
          position: relative;
          display: inline-block;
        }
        
        .symbol-dropdown {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          color: #333;
          min-width: 120px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .symbol-dropdown:hover {
          border-color: #007bff;
        }
        
        .dropdown-arrow {
          margin-left: 8px;
          transition: transform 0.2s;
        }
        
        .symbol-dropdown.active .dropdown-arrow {
          transform: rotate(180deg);
        }
        
        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          z-index: 1000;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .dropdown-menu.show {
          display: block;
        }
        
        .dropdown-item {
          padding: 8px 12px;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .dropdown-item:hover {
          background: #f8f9fa;
        }
        
        .dropdown-item:last-child {
          border-bottom: none;
        }
        
        .coin-icon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
        }
        
        .symbol-exchange {
          font-size: 14px;
          color: #666;
          background: #f0f0f0;
          padding: 4px 8px;
          border-radius: 4px;
        }
        
        .price-data {
          display: flex;
          align-items: center;
          gap: 15px;
          flex-wrap: wrap;
          justify-content: center;
        }
        
        .price-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          font-size: 12px;
          min-width: 60px;
        }
        
        .price-label {
          color: #666;
          margin-bottom: 2px;
        }
        
        .price-value {
          font-weight: 600;
          font-size: 13px;
        }
        
        .price-change {
          font-weight: 600;
          font-size: 13px;
        }
        
        .positive {
          color: #00c851;
        }
        
        .negative {
          color: #ff4444;
        }
        
        .controls {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .time-frame {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }
        
        .time-btn {
          padding: 6px 12px;
          border: 1px solid #ddd;
          background: white;
          cursor: pointer;
          font-size: 12px;
          border-radius: 4px;
          transition: all 0.2s;
          white-space: nowrap;
        }
        
        .time-btn:hover {
          background: #f0f0f0;
        }
        
        .time-btn.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }
        
        .chart-area {
          flex: 1;
          position: relative;
          background: white;
          min-height: 0;
        }
        
        .volume-info {
          position: absolute;
          top: 10px;
          left: 20px;
          background: rgba(255, 255, 255, 0.9);
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          border: 1px solid #e0e0e0;
          z-index: 10;
        }
        
        .indicators {
          position: absolute;
          top: 10px;
          right: 20px;
          display: flex;
          gap: 10px;
          z-index: 10;
          flex-wrap: wrap;
        }
        
        .indicator-btn {
          padding: 6px 10px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
          transition: all 0.2s;
          white-space: nowrap;
        }
        
        .indicator-btn:hover {
          background: #f0f0f0;
        }
        
        .indicator-btn.active {
          background: #28a745;
          color: white;
          border-color: #28a745;
        }
        
        .live-indicator {
          position: absolute;
          top: 10px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.9);
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 12px;
          border: 1px solid #e0e0e0;
          z-index: 15;
        }
        
        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #28a745;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          font-size: 16px;
          color: #666;
        }
        
        .spinner {
          border: 2px solid #f3f3f3;
          border-top: 2px solid #007bff;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
          margin-right: 10px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .header {
            flex-direction: column;
            align-items: stretch;
            gap: 15px;
            padding: 15px;
            min-height: auto;
          }
          
          .symbol-info {
            justify-content: space-between;
            width: 100%;
            flex-wrap: wrap;
            gap: 10px;
          }
          
          .price-data {
            width: 100%;
            justify-content: space-between;
            gap: 8px;
            flex-wrap: wrap;
          }
          
          .price-item {
            min-width: 50px;
            font-size: 11px;
            flex: 1;
            min-width: 0;
          }
          
          .price-value, .price-change {
            font-size: 12px;
            word-break: break-word;
          }
          
          .controls {
            width: 100%;
            justify-content: center;
          }
          
          .time-frame {
            justify-content: center;
            gap: 3px;
            flex-wrap: wrap;
          }
          
          .time-btn {
            padding: 8px 10px;
            font-size: 11px;
            min-width: 35px;
            flex-shrink: 0;
          }
          
          .volume-info {
            position: relative;
            margin: 10px;
            top: auto;
            left: auto;
            display: inline-block;
          }
          
          .indicators {
            position: relative;
            margin: 10px;
            top: auto;
            right: auto;
            justify-content: center;
            flex-wrap: wrap;
            gap: 5px;
          }
          
          .live-indicator {
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 11px;
            padding: 6px 10px;
            z-index: 20;
          }
          
          .chart-area {
            height: calc(100vh - 250px);
            min-height: 300px;
          }
          
          .symbol-dropdown {
            font-size: 14px;
            min-width: 100px;
            padding: 6px 10px;
          }
        }
        
        @media (max-width: 480px) {
          .header {
            padding: 10px;
            gap: 10px;
          }
          
          .price-data {
            gap: 5px;
            justify-content: space-between;
          }
          
          .price-item {
            min-width: 45px;
            font-size: 10px;
            flex: 1;
            min-width: 0;
          }
          
          .price-value, .price-change {
            font-size: 11px;
            line-height: 1.2;
          }
          
          .time-btn {
            padding: 6px 8px;
            font-size: 10px;
            min-width: 30px;
          }
          
          .symbol-dropdown {
            font-size: 13px;
            min-width: 90px;
            padding: 5px 8px;
          }
          
          .symbol-exchange {
            font-size: 12px;
            padding: 3px 6px;
          }
          
          .live-indicator {
            font-size: 10px;
            padding: 5px 8px;
            right: 5px;
            top: 5px;
          }
          
          .volume-info {
            font-size: 11px;
            padding: 6px 10px;
            margin: 5px;
          }
          
          .indicators {
            gap: 3px;
            margin: 5px;
          }
          
          .indicator-btn {
            padding: 5px 8px;
            font-size: 10px;
          }
        }
      `}</style>

      <div className="header">
        <div className="symbol-info">
          <div className="symbol-selector" ref={dropdownRef}>
            <div 
              className={`symbol-dropdown ${isDropdownOpen ? 'active' : ''}`} 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span id="selectedSymbol">{selectedCoinName}</span>
              <span className="dropdown-arrow">▼</span>
            </div>
            {isDropdownOpen && (
              <div className="dropdown-menu show">
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
                      onClick={() => handleCoinSelect(coin.id, coin.name)}
                    >
                      <img src={coin.image} alt={coin.name} className="coin-icon" />
                      <span>{coin.name} ({coin.symbol.toUpperCase()})</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <span className="symbol-exchange">24H • Crypto</span>
        </div>
        
        <div className="price-data">
          <div className="price-item">
            <span className="price-label">Price</span>
            <span className="price-value" id="currentPrice">
              ${coinData?.market_data?.current_price?.usd?.toLocaleString() || '0.00'}
            </span>
          </div>
          <div className="price-item">
            <span className="price-label">24h High</span>
            <span className="price-value" id="highPrice">
              ${coinData?.market_data?.high_24h?.usd?.toLocaleString() || '0.00'}
            </span>
          </div>
          <div className="price-item">
            <span className="price-label">24h Low</span>
            <span className="price-value" id="lowPrice">
              ${coinData?.market_data?.low_24h?.usd?.toLocaleString() || '0.00'}
            </span>
          </div>
          <div className="price-item">
            <span className="price-label">Market Cap</span>
            <span className="price-value" id="marketCap">
              ${coinData?.market_data?.market_cap?.usd?.toLocaleString() || '0.00'}
            </span>
          </div>
          <div className="price-item">
            <span className="price-label">24h Change</span>
            <span className={`price-value price-change ${coinData?.market_data?.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`} id="priceChange">
              {coinData?.market_data?.price_change_percentage_24h ? 
                `${coinData.market_data.price_change_percentage_24h >= 0 ? '+' : ''}${coinData.market_data.price_change_percentage_24h.toFixed(2)}%` : 
                '0.00%'}
            </span>
          </div>
        </div>
        
        <div className="controls">
          <div className="time-frame">
            <button 
              className={`time-btn ${currentTimeframe === '1' ? 'active' : ''}`} 
              onClick={() => handleTimeframeChange('1')}
            >
              1D
            </button>
            <button 
              className={`time-btn ${currentTimeframe === '7' ? 'active' : ''}`} 
              onClick={() => handleTimeframeChange('7')}
            >
              7D
            </button>
            <button 
              className={`time-btn ${currentTimeframe === '30' ? 'active' : ''}`} 
              onClick={() => handleTimeframeChange('30')}
            >
              30D
            </button>
            <button 
              className={`time-btn ${currentTimeframe === '90' ? 'active' : ''}`} 
              onClick={() => handleTimeframeChange('90')}
            >
              90D
            </button>
            <button 
              className={`time-btn ${currentTimeframe === '365' ? 'active' : ''}`} 
              onClick={() => handleTimeframeChange('365')}
            >
              1Y
            </button>
          </div>
        </div>
      </div>
      
      <div className="chart-area">
        <div className="volume-info">
          <strong>Volume</strong> 24h <span id="volumeValue">
            ${coinData?.market_data?.total_volume?.usd?.toLocaleString() || '0.00'}
          </span>
        </div>
        
        <div className="indicators">
          <button 
            className={`indicator-btn ${activeIndicators.has('sma') ? 'active' : ''}`} 
            onClick={() => toggleIndicator('sma')}
          >
            SMA
          </button>
          <button 
            className={`indicator-btn ${activeIndicators.has('ema') ? 'active' : ''}`} 
            onClick={() => toggleIndicator('ema')}
          >
            EMA
          </button>
          <button 
            className={`indicator-btn ${activeIndicators.has('bollinger') ? 'active' : ''}`} 
            onClick={() => toggleIndicator('bollinger')}
          >
            Bollinger
          </button>
        </div>
        
        <div className="live-indicator">
          <div className="live-dot"></div>
          <span>Live Data</span>
        </div>
        
        <div style={{ width: '100%', height: '100%', minHeight: 350 }}>
          {isLoading ? (
            <div className="loading">
              <div className="spinner"></div>
              Loading chart data...
            </div>
          ) : (
            <ReactApexChart options={options} series={series} type="candlestick" height="100%" width="100%" />
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveCryptoChart;