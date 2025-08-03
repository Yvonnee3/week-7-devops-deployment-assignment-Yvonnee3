import React, { useState, useEffect } from 'react'
import axios from 'axios'

function Tasks() {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(true)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/tasks`)
      setTasks(response.data)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTask = async (e) => {
    e.preventDefault()
    if (!newTask.trim()) return

    try {
      const response = await axios.post(`${API_URL}/api/tasks`, {
        title: newTask
      })
      setTasks([...tasks, response.data])
      setNewTask('')
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const deleteTask = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/tasks/${id}`)
      setTasks(tasks.filter(task => task._id !== id))
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="tasks">
      <h2>Tasks</h2>
      
      <form onSubmit={addTask}>
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task..."
        />
        <button type="submit">Add Task</button>
      </form>

      <div className="task-list">
        {tasks.length === 0 ? (
          <p>No tasks yet. Add one above!</p>
        ) : (
          tasks.map(task => (
            <div key={task._id} className="task-item">
              <span>{task.title}</span>
              <button onClick={() => deleteTask(task._id)}>Delete</button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Tasks