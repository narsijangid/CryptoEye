import { useState } from 'react'
import Home from './Component/Home'
// import Chart from './Component/Chart'
import { BrowserRouter ,Routes,Route } from 'react-router-dom'

import './App.css'
import LiveCryptoChart from './Component/LiveCryptoChart'

function App() {
 
  return (
    <>
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home></Home>}/>
      <Route path="/LiveCryptoChart" element={<LiveCryptoChart/>}/>
    
    </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
