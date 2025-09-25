// components/Tasks/TaskForm.tsx
import React, { useState, useEffect } from 'react';
import { Save, X, Calendar, Flag, Folder } from 'lucide-react';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '@/types/api';

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: CreateTaskRequest | UpdateTaskRequest) => Promise<void>;
  onCancel: () => void;
}

const PRIORITY_OPTIONS = [
  { value: 1, label: 'Low', color: 'text-gray-500' },
  { value: 2, label: 'Medium', color: 'text-blue-500' },
  { value: 3, label: 'High', color: 'text-yellow-500' },
  { value: 4, label: 'Urgent', color: 'text-orange-500' },
  { value: 5, label: 'Critical', color: 'text-red-500' },
];

export default function TaskForm({ task, onSubmit, onCancel }: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 2,
    estimated_pomodoros: task?.estimated_pomodoros || 1,
    project: task?.project || '',
    due_date: task?.due_date ? task.due_date.split('T')[0] : '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    if (formData.estimated_pomodoros < 1 || formData.estimated_pomodoros > 50) {
      newErrors.estimated_pomodoros = 'Estimated pomodoros must be between 1 and 50';
    }

    if (formData.project && formData.project.length > 100) {
      newErrors.project = 'Project name must be less than 100 characters';
    }

    if (formData.due_date) {
      const dueDate = new Date(formData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        newErrors.due_date = 'Due date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        project: formData.project.trim() || undefined,
        due_date: formData.due_date || undefined,
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ submit: 'Failed to save task. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Get today's date for min date attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title Field */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Task Title *
        </label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter task title..."
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={loading}
          maxLength={200}
          autoFocus
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {formData.title.length}/200 characters
        </p>
      </div>

      {/* Description Field */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Add a description..."
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={loading}
          maxLength={1000}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {formData.description.length}/1000 characters
        </p>
      </div>

      {/* Priority and Estimated Time Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Priority Field */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Flag className="w-4 h-4 inline mr-1" />
            Priority
          </label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            {PRIORITY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Estimated Pomodoros Field */}
        <div>
          <label htmlFor="estimated_pomodoros" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Est. Pomodoros
          </label>
          <input
            id="estimated_pomodoros"
            type="number"
            min="1"
            max="50"
            value={formData.estimated_pomodoros}
            onChange={(e) => handleInputChange('estimated_pomodoros', parseInt(e.target.value) || 1)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.estimated_pomodoros ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          {errors.estimated_pomodoros && (
            <p className="mt-1 text-sm text-red-600">{errors.estimated_pomodoros}</p>
          )}
        </div>
      </div>

      {/* Project and Due Date Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Project Field */}
        <div>
          <label htmlFor="project" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Folder className="w-4 h-4 inline mr-1" />
            Project
          </label>
          <input
            id="project"
            type="text"
            value={formData.project}
            onChange={(e) => handleInputChange('project', e.target.value)}
            placeholder="Project name..."
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.project ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
            maxLength={100}
          />
          {errors.project && (
            <p className="mt-1 text-sm text-red-600">{errors.project}</p>
          )}
        </div>

        {/* Due Date Field */}
        <div>
          <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Calendar className="w-4 h-4 inline mr-1" />
            Due Date
          </label>
          <input
            id="due_date"
            type="date"
            value={formData.due_date}
            onChange={(e) => handleInputChange('due_date', e.target.value)}
            min={today}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.due_date ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          {errors.due_date && (
            <p className="mt-1 text-sm text-red-600">{errors.due_date}</p>
          )}
        </div>
      </div>

      {/* Priority Preview */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Preview:</span>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full ${
              formData.priority === 1 ? 'bg-gray-100 text-gray-800' :
              formData.priority === 2 ? 'bg-blue-100 text-blue-800' :
              formData.priority === 3 ? 'bg-yellow-100 text-yellow-800' :
              formData.priority === 4 ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}>
              {PRIORITY_OPTIONS.find(p => p.value === formData.priority)?.label}
            </span>
            <span className="text-gray-500">
              ~{formData.estimated_pomodoros * 25}min
            </span>
          </div>
        </div>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{errors.submit}</p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4 inline mr-1" />
          Cancel
        </button>
        
        <button
          type="submit"
          disabled={loading || !formData.title.trim()}
          className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 flex items-center"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-1" />
              {task ? 'Update Task' : 'Create Task'}
            </>
          )}
        </button>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="text-xs text-gray-500 pt-2 border-t">
        <p>Keyboard shortcuts: Enter to save, Escape to cancel</p>
      </div>
    </form>
  );
}

// Add keyboard shortcut support
export function useTaskFormShortcuts(onSave: () => void, onCancel: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSave, onCancel]);
}