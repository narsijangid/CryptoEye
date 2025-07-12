import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Crypto from './components/CryptoPrices';
import CryptoChart from './components/CryptoChart';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Crypto />} />
        <Route path="/chart" element={<CryptoChart />} />
      </Routes>
    </Router>
  );
}

export default App;
