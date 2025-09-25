'use client'

import { useState, useEffect } from 'react'
import { Task, CreateTaskRequest, UpdateTaskRequest } from '@/types/api'
import { useAuth } from '@/hooks/useAuth'

export function useTasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch tasks
  const fetchTasks = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/tasks')
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }

      const data = await response.json()
      setTasks(data.tasks || [])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  // Create task
  const createTask = async (taskData: CreateTaskRequest) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      })

      if (!response.ok) {
        throw new Error('Failed to create task')
      }

      const newTask = await response.json()
      setTasks(prev => [...prev, newTask])
      return newTask
    } catch (err) {
      throw err
    }
  }

  // Update task
  const updateTask = async (id: string, updates: UpdateTaskRequest) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update task')
      }

      const updatedTask = await response.json()
      setTasks(prev => prev.map(task => task.id === id ? updatedTask : task))
      return updatedTask
    } catch (err) {
      throw err
    }
  }

  // Delete task
  const deleteTask = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete task')
      }

      setTasks(prev => prev.filter(task => task.id !== id))
    } catch (err) {
      throw err
    }
  }

  // Reorder tasks
  const reorderTasks = async (updates: { id: string; order_index: number }[]) => {
    try {
      // Optimistically update local state
      const updatedTasks = [...tasks]
      updates.forEach(update => {
        const taskIndex = updatedTasks.findIndex(t => t.id === update.id)
        if (taskIndex >= 0) {
          updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], order_index: update.order_index }
        }
      })
      
      // Sort by new order
      updatedTasks.sort((a, b) => a.order_index - b.order_index)
      setTasks(updatedTasks)

      // Update server
      await Promise.all(
        updates.map(update =>
          fetch(`/api/tasks/${update.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ order_index: update.order_index }),
          })
        )
      )
    } catch (err) {
      // Revert on error
      fetchTasks()
      throw err
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [user])

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
    refetch: fetchTasks,
  }
}