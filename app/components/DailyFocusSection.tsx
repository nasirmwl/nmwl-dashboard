'use client';

import { Calendar, Edit2, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import Modal from './Modal';
import { format } from 'date-fns';

interface DailyFocus {
  id: string;
  content: string;
  date: string | null;
  reminderAt: string | null;
  notifiedAt: string | null;
}

export default function DailyFocusSection() {
  const [focusItems, setFocusItems] = useState<DailyFocus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DailyFocus | null>(null);
  const [modalContent, setModalContent] = useState('');
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [modalReminderAt, setModalReminderAt] = useState<string | null>(null);

  const fetchFocusItems = async () => {
    try {
      const response = await fetch('/api/supabase/daily-focus');
      if (!response.ok) throw new Error('Failed to fetch daily focus items');
      const data = await response.json();
      setFocusItems(data.items);
    } catch (error) {
      console.error('Error fetching daily focus items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    fetchFocusItems();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setModalContent('');
    setModalDate(null);
    setModalReminderAt(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: DailyFocus) => {
    setEditingItem(item);
    setModalContent(item.content);
    setModalDate(item.date);
    setModalReminderAt(item.reminderAt);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setModalContent('');
    setModalDate(null);
    setModalReminderAt(null);
  };

  const saveFocusItem = async () => {
    const content = modalContent.trim();
    if (!content) return;

    try {
      if (editingItem) {
        // Update existing item
        const response = await fetch('/api/supabase/daily-focus', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingItem.id,
            content,
            date: modalDate,
            reminderAt: modalReminderAt,
          }),
        });
        if (response.ok) {
          await fetchFocusItems();
          closeModal();
        }
      } else {
        // Create new item
        const response = await fetch('/api/supabase/daily-focus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            date: modalDate,
            reminderAt: modalReminderAt,
          }),
        });
        if (response.ok) {
          await fetchFocusItems();
          closeModal();
        }
      }
    } catch (error) {
      console.error('Error saving daily focus item:', error);
    }
  };

  const deleteFocusItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await fetch(`/api/supabase/daily-focus?id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchFocusItems();
      }
    } catch (error) {
      console.error('Error deleting daily focus item:', error);
    }
  };

  if (!isClient || loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-800">
        <div className="animate-pulse h-32" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Reminders</h2>
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-5 py-3.5 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-base md:text-sm min-h-[44px] w-full sm:w-auto"
            aria-label="Add Reminder"
          >
            <Plus className="w-5 h-5 md:w-4 md:h-4" />
            <span className="hidden md:inline">Add Reminder</span>
            <span className="md:hidden">Add Reminder</span>
          </button>
        </div>

        {focusItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No reminders yet. Click "Add Reminder" to create one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {focusItems.map((item) => (
              <div
                key={item.id}
                className="group flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-2">
                    {item.content}
                  </p>
                  {item.date && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(item.date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {item.reminderAt && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span className="font-medium">Remind at:</span>
                      <span>{format(new Date(item.reminderAt), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                  )}
                  {item.notifiedAt && (
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                      <span>Notified:</span>
                      <span>{format(new Date(item.notifiedAt), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-3.5 md:p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                  >
                    <Edit2 className="w-5 h-5 md:w-4 md:h-4" />
                  </button>
                  <button
                    onClick={() => deleteFocusItem(item.id)}
                    className="p-3.5 md:p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                  >
                    <X className="w-5 h-5 md:w-4 md:h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? 'Edit Reminder' : 'Add Reminder'}
      >
        <div className="space-y-4">
          <textarea
            autoFocus
            value={modalContent}
            onChange={(e) => setModalContent(e.target.value)}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 resize-none"
            rows={8}
            placeholder="Enter your reminder..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                saveFocusItem();
              }
            }}
          />
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={modalDate || ''}
                onChange={(e) => setModalDate(e.target.value || null)}
                className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[90px]">
                Remind at
              </span>
              <input
                type="datetime-local"
                value={modalReminderAt || ''}
                onChange={(e) => setModalReminderAt(e.target.value || null)}
                className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={closeModal}
              className="px-5 py-3.5 md:px-4 md:py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-base md:text-sm min-h-[44px] w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={saveFocusItem}
              className="px-5 py-3.5 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-base md:text-sm min-h-[44px] w-full sm:w-auto"
            >
              {editingItem ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

