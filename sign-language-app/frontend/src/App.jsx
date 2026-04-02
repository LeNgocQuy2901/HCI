import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import GestureRecognition from './pages/GestureRecognition'
import './App.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gesture-recognition" element={<GestureRecognition />} />
          {/* Add more routes here */}
        </Routes>
      </div>
    </Router>
  )
}

export default App
