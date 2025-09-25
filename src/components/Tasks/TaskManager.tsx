// components/Tasks/TaskManager.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, Clock, Flag, Calendar, Filter } from 'lucide-react';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '@/types/api';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';
// import TaskItem from './TaskItem';

interface TaskManagerProps {
  selectedTaskId?: string;
  onTaskSelect: (taskId: string | undefined) => void;
  compact?: boolean;
}

interface FilterOptions {
  completed: boolean | null;
  priority: number | null;
  project: string | null;
}

const PRIORITY_COLORS: Record<number, string> = {
  1: 'bg-gray-100 text-gray-800',
  2: 'bg-blue-100 text-blue-800',
  3: 'bg-yellow-100 text-yellow-800',
  4: 'bg-orange-100 text-orange-800',
  5: 'bg-red-100 text-red-800',
};

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Urgent',
  5: 'Critical',
};

export default function TaskManager({ selectedTaskId, onTaskSelect, compact = false }: TaskManagerProps) {
  const { user } = useAuth();
  const { tasks, loading, error, createTask, updateTask, deleteTask, reorderTasks } = useTasks();
  
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    completed: null,
    priority: null,
    project: null,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and search tasks
  const filteredTasks = tasks.filter(task => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!task.title.toLowerCase().includes(query) && 
          !task.description?.toLowerCase().includes(query) &&
          !task.project?.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Completion filter
    if (filters.completed !== null && task.completed !== filters.completed) {
      return false;
    }

    // Priority filter
    if (filters.priority && task.priority !== filters.priority) {
      return false;
    }

    // Project filter
    if (filters.project && task.project !== filters.project) {
      return false;
    }

    return true;
  });

  // Get unique projects for filter dropdown
  const projects = Array.from(new Set(tasks.map(task => task.project).filter(Boolean)));

  // Handle task creation
  const handleCreateTask = async (taskData: CreateTaskRequest | UpdateTaskRequest) => {
    // Cast to CreateTaskRequest, since this is for creation
    await createTask(taskData as CreateTaskRequest);
    setShowForm(false);
  };

  // Handle task update
  const handleUpdateTask = async (taskId: string, updates: UpdateTaskRequest) => {
    try {
      await updateTask(taskId, updates);
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await deleteTask(taskId);
      if (selectedTaskId === taskId) {
        onTaskSelect(undefined);
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  // Handle task completion toggle
  const handleToggleComplete = async (task: Task) => {
    const updates: UpdateTaskRequest = { 
      completed: !task.completed,
      ...( !task.completed ? { completed_at: new Date().toISOString() } : {} )
    };
    await handleUpdateTask(task.id, updates);
  };

  // Handle task selection
  const handleTaskClick = (task: Task) => {
    if (task.completed) return; // Don't select completed tasks
    onTaskSelect(selectedTaskId === task.id ? undefined : task.id);
  };

  // Handle drag and drop reordering
  const handleTaskReorder = async (dragIndex: number, dropIndex: number) => {
    try {
      const reorderedTasks = [...filteredTasks];
      const [draggedTask] = reorderedTasks.splice(dragIndex, 1);
      reorderedTasks.splice(dropIndex, 0, draggedTask);
      
      // Update order_index for affected tasks
      const updates = reorderedTasks.map((task, index) => ({
        id: task.id,
        order_index: index,
      }));
      
      await reorderTasks(updates);
    } catch (error) {
      console.error('Failed to reorder tasks:', error);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({ completed: null, priority: null, project: null });
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">Error loading tasks: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Tasks
          {filteredTasks.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredTasks.filter(t => !t.completed).length} active)
            </span>
          )}
        </h2>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle filters"
          >
            <Filter className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            {compact ? '' : 'Add Task'}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      {showFilters && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          {/* Filter Controls */}
          <div className="flex flex-wrap gap-2">
            {/* Completion Filter */}
            <select
              value={filters.completed === null ? '' : filters.completed.toString()}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                completed: e.target.value === '' ? null : e.target.value === 'true'
              }))}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Tasks</option>
              <option value="false">Active</option>
              <option value="true">Completed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filters.priority || ''}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                priority: e.target.value ? parseInt(e.target.value) : null
              }))}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Priorities</option>
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {/* Project Filter */}
            {projects.length > 0 && (
              <select
                value={filters.project || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  project: e.target.value || null
                }))}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Projects</option>
                {projects.map(project => (
                  <option key={project} value={project}>{project}</option>
                ))}
              </select>
            )}

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {tasks.length === 0 ? (
              <>
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No tasks yet. Create your first task to get started!</p>
              </>
            ) : (
              <p>No tasks match your current filters.</p>
            )}
          </div>
        ) : (
          filteredTasks.map((task, index) => (
            <TaskItem
              key={task.id}
              task={task}
              isSelected={selectedTaskId === task.id}
              isEditing={editingTask?.id === task.id}
              compact={compact}
              onClick={() => handleTaskClick(task)}
              onEdit={() => setEditingTask(task)}
              onDelete={() => handleDeleteTask(task.id)}
              onToggleComplete={() => handleToggleComplete(task)}
              onUpdate={(updates) => handleUpdateTask(task.id, updates)}
              onCancelEdit={() => setEditingTask(null)}
              onReorder={handleTaskReorder}
              index={index}
            />
          ))
        )}
      </div>

      {/* Task Creation Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Task</h3>
            <TaskForm
              onSubmit={handleCreateTask}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Task Edit Form Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Task</h3>
            <TaskForm
              task={editingTask}
              onSubmit={(updates) => handleUpdateTask(editingTask.id, updates)}
              onCancel={() => setEditingTask(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}