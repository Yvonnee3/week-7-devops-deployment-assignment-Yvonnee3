import React from 'react'
import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="home">
      <h2>Welcome to MERN Task Manager</h2>
      <p>A simple task management application built with the MERN stack.</p>
      <Link to="/tasks">
        <button>View Tasks</button>
      </Link>
    </div>
  )
}

export default Home