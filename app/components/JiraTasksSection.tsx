'use client';

import { Edit2, ExternalLink, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

import Modal from './Modal';
import { format } from 'date-fns';
import { useSectionToggle } from '../hooks/useSectionToggle';

interface JiraTask {
  id: string;
  summary: string;
  status: string;
  priority: string;
  type: string;
  updated: string;
  url: string;
}

interface Transition {
  id: string;
  name: string;
  to: {
    id: string;
    name: string;
  };
}

export default function JiraTasksSection() {
  const [tasks, setTasks] = useState<JiraTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<JiraTask | null>(null);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [loadingTransitions, setLoadingTransitions] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedTransitionId, setSelectedTransitionId] = useState<string>('');
  const [isVisible, setIsVisible] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/jira?maxResults=50');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch Jira tasks (${response.status})`);
      }
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load Jira tasks';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load visibility preference from localStorage (default to true)
    const savedVisibility = localStorage.getItem('jiraSprintTasksVisible');
    if (savedVisibility !== null) {
      setIsVisible(savedVisibility === 'true');
    }
    
    fetchTasks();
    // Refresh every 5 minutes
    const interval = setInterval(fetchTasks, 300000);
    return () => clearInterval(interval);
  }, []);

  const toggleVisibility = useCallback(() => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    localStorage.setItem('jiraSprintTasksVisible', String(newVisibility));
  }, [isVisible]);

  useSectionToggle(toggleVisibility);

  const openEditModal = async (task: JiraTask) => {
    setEditingTask(task);
    setSelectedTransitionId('');
    setIsModalOpen(true);
    setLoadingTransitions(true);
    setTransitions([]);

    try {
      const response = await fetch(`/api/jira/transitions?issueKey=${task.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transitions');
      }
      const data = await response.json();
      setTransitions(data.transitions || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load available status transitions';
      console.error('Error fetching transitions:', err);
      setError(errorMessage);
    } finally {
      setLoadingTransitions(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setTransitions([]);
    setSelectedTransitionId('');
  };

  const updateStatus = async () => {
    if (!editingTask || !selectedTransitionId) return;

    setUpdatingStatus(true);
    try {
      const response = await fetch('/api/jira/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueKey: editingTask.id,
          transitionId: selectedTransitionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      // Refresh tasks after successful update
      await fetchTasks();
      closeModal();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
      console.error('Error updating status:', err);
      setError(errorMessage);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const lower = priority.toLowerCase();
    if (lower.includes('highest') || lower.includes('critical')) {
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700';
    }
    if (lower.includes('high')) {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-700';
    }
    if (lower.includes('medium')) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700';
    }
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300 dark:border-blue-700';
  };

  const getStatusColor = (status: string) => {
    const lower = status.toLowerCase();
    if (lower.includes('done') || lower.includes('closed')) {
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    }
    if (lower.includes('progress') || lower.includes('in progress')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Current Sprint Tasks</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleVisibility}
            className="flex items-center justify-center gap-2 px-5 py-3.5 md:px-4 md:py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-base md:text-sm min-h-[44px] w-full sm:w-auto"
            aria-label={isVisible ? 'Hide tasks' : 'Show tasks'}
          >
            {isVisible ? (
              <>
                <EyeOff className="w-5 h-5 md:w-4 md:h-4" />
                <span className="hidden md:inline">Hide</span>
                <span className="md:hidden">Hide</span>
              </>
            ) : (
              <>
                <Eye className="w-5 h-5 md:w-4 md:h-4" />
                <span className="hidden md:inline">Show</span>
                <span className="md:hidden">Show</span>
              </>
            )}
          </button>
          <button
            onClick={fetchTasks}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-3.5 md:px-4 md:py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50 text-base md:text-sm min-h-[44px] w-full sm:w-auto"
            aria-label="Refresh tasks"
          >
            <RefreshCw className={`w-5 h-5 md:w-4 md:h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Refresh</span>
            <span className="md:hidden">Refresh</span>
          </button>
        </div>
      </div>

      {!isVisible ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>Sprint tasks are hidden. Click &quot;Show&quot; to view them.</p>
        </div>
      ) : loading && tasks.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400 font-medium mb-2">
            {error}
          </p>
          <p className="text-sm text-red-500 dark:text-red-500">
            Please check your Jira credentials in the component code
          </p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>No sprint tasks found. Great job! 🎉</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="group"
            >
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                        {task.id}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded border ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                          task.status
                        )}`}
                      >
                        {task.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {task.summary}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Updated {format(new Date(task.updated), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(task);
                      }}
                      className="p-3.5 md:p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                      aria-label="Edit status"
                    >
                      <Edit2 className="w-5 h-5 md:w-4 md:h-4" />
                    </button>
                    <a
                      href={task.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 md:p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                      aria-label="Open in Jira"
                    >
                      <ExternalLink className="w-5 h-5 md:w-4 md:h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTask ? `Change Status: ${editingTask.id}` : 'Change Status'}
      >
        <div className="space-y-4">
          {editingTask && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span className="font-semibold text-gray-900 dark:text-gray-100">Task:</span> {editingTask.summary}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                <span className="font-semibold text-gray-900 dark:text-gray-100">Current Status:</span>{' '}
                <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(editingTask.status)}`}>
                  {editingTask.status}
                </span>
              </p>
            </div>
          )}

          {loadingTransitions ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : transitions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No available status transitions found.</p>
              <p className="text-sm mt-2">You may not have permission to change the status of this task.</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select New Status
              </label>
              <select
                value={selectedTransitionId}
                onChange={(e) => setSelectedTransitionId(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 text-base md:text-sm"
              >
                <option value="">-- Select a status --</option>
                {transitions.map((transition) => (
                  <option key={transition.id} value={transition.id}>
                    {transition.name} → {transition.to.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <button
              onClick={closeModal}
              disabled={updatingStatus}
              className="px-5 py-3.5 md:px-4 md:py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-base md:text-sm min-h-[44px] w-full sm:w-auto disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={updateStatus}
              disabled={!selectedTransitionId || updatingStatus}
              className="px-5 py-3.5 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-base md:text-sm min-h-[44px] w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updatingStatus ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

