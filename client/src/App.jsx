import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Tasks from './pages/Tasks'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <nav>
          <h1>MERN Task Manager</h1>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tasks" element={<Tasks />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App