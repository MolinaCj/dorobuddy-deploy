// src/components/Tasks/TaskItem.tsx - Complete Individual Task Component
'use client'

import React, { useState } from 'react'
import { Edit2, Trash2, Check, Clock, Calendar, Flag, GripVertical } from 'lucide-react'
import { Task, UpdateTaskRequest } from '@/types/api'

interface TaskItemProps {
  task: Task
  isSelected: boolean
  isEditing: boolean
  compact: boolean
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleComplete: () => void
  onUpdate: (updates: UpdateTaskRequest) => void
  onCancelEdit: () => void
  onReorder: (dragIndex: number, dropIndex: number) => void
  index: number
}

const PRIORITY_COLORS: Record<number, string> = {
  1: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600',
  2: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
  3: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700',
  4: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700',
  5: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
}

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Urgent',
  5: 'Critical',
}

export default function TaskItem({ 
  task, 
  isSelected, 
  isEditing, 
  compact, 
  onClick, 
  onEdit, 
  onDelete, 
  onToggleComplete,
  onUpdate,
  onCancelEdit,
  onReorder,
  index 
}: TaskItemProps) {
  const [dragOver, setDragOver] = useState(false)
  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    estimated_pomodoros: task.estimated_pomodoros,
    project: task.project || '',
    due_date: task.due_date ? task.due_date.split('T')[0] : '',
  })

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', index.toString())
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'))
    if (dragIndex !== index) {
      onReorder(dragIndex, index)
    }
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const updates: UpdateTaskRequest = {
      title: editForm.title.trim(),
      description: editForm.description.trim() || undefined,
      priority: editForm.priority,
      estimated_pomodoros: editForm.estimated_pomodoros,
      project: editForm.project.trim() || undefined,
      due_date: editForm.due_date || undefined,
    }
    
    onUpdate(updates)
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  const isOverdue = (): boolean => {
    if (!task.due_date || task.completed) return false
    return new Date(task.due_date) < new Date()
  }

  if (isEditing) {
    return (
      <div className="p-4 border border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700 rounded-lg">
        <form onSubmit={handleEditSubmit} className="space-y-3">
          {/* Title */}
          <input
            type="text"
            value={editForm.title}
            onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Task title..."
            required
            autoFocus
          />
          
          {!compact && (
            <>
              {/* Description */}
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Description (optional)..."
                rows={2}
              />
              
              {/* Priority and Estimated Pomodoros */}
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={editForm.estimated_pomodoros}
                  onChange={(e) => setEditForm(prev => ({ ...prev, estimated_pomodoros: parseInt(e.target.value) || 1 }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Est. pomodoros"
                />
              </div>
              
              {/* Project and Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={editForm.project}
                  onChange={(e) => setEditForm(prev => ({ ...prev, project: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Project (optional)..."
                />
                
                <input
                  type="date"
                  value={editForm.due_date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, due_date: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </>
          )}
          
          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div
      draggable={!task.completed}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        group p-3 rounded-lg border transition-all duration-200 cursor-pointer
        ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'}
        ${task.completed ? 'opacity-60 bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-700'}
        ${dragOver ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        {/* Drag Handle */}
        {!task.completed && !compact && (
          <div className="drag-handle opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </div>
        )}

        {/* Completion Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleComplete()
          }}
          className={`
            flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
            ${task.completed 
              ? 'bg-green-500 border-green-500 text-white' 
              : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
            }
          `}
        >
          {task.completed && <Check className="w-3 h-3" />}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className={`font-medium truncate ${
                  task.completed 
                    ? 'line-through text-gray-500' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {task.title}
                </h4>
                
                {/* Priority Badge */}
                <span className={`px-2 py-0.5 text-xs rounded-full border ${PRIORITY_COLORS[task.priority]}`}>
                  {PRIORITY_LABELS[task.priority]}
                </span>
              </div>

              {/* Project Badge */}
              {task.project && (
                <div className="mb-2">
                  <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300 rounded-full">
                    {task.project}
                  </span>
                </div>
              )}

              {/* Description */}
              {task.description && !compact && (
                <p className={`text-sm mb-2 ${
                  task.completed ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {task.description}
                </p>
              )}

              {/* Task Meta */}
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                {/* Pomodoro Progress */}
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{task.completed_pomodoros}/{task.estimated_pomodoros}</span>
                </div>

                {/* Due Date */}
                {task.due_date && (
                  <div className={`flex items-center space-x-1 ${
                    isOverdue() ? 'text-red-500' : ''
                  }`}>
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(task.due_date)}</span>
                    {isOverdue() && <span className="text-red-500 font-medium">Overdue</span>}
                  </div>
                )}

                {/* Completion Date */}
                {task.completed_at && (
                  <div className="text-green-600 dark:text-green-400">
                    Completed {formatDate(task.completed_at)}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {!compact && (
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                  className="p-1 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 rounded transition-colors"
                  aria-label="Edit task"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors"
                  aria-label="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {task.estimated_pomodoros > 0 && !compact && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    task.completed ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (task.completed_pomodoros / task.estimated_pomodoros) * 100)}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}