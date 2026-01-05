'use client';

import { Edit2, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import Modal from './Modal';

interface Promise {
  id: string;
  content: string;
}

export default function PromisesSection() {
  const [promises, setPromises] = useState<Promise[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromise, setEditingPromise] = useState<Promise | null>(null);
  const [modalContent, setModalContent] = useState('');

  const fetchCommitments = async () => {
    try {
      const response = await fetch('/api/supabase/commitments');
      if (!response.ok) throw new Error('Failed to fetch commitments');
      const data = await response.json();
      setPromises(data.items);
    } catch (error) {
      console.error('Error fetching commitments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    fetchCommitments();
  }, []);

  const openAddModal = () => {
    setEditingPromise(null);
    setModalContent('');
    setIsModalOpen(true);
  };

  const openEditModal = (promise: Promise) => {
    setEditingPromise(promise);
    setModalContent(promise.content);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPromise(null);
    setModalContent('');
  };

  const savePromise = async () => {
    const content = modalContent.trim();
    if (!content) return;

    try {
      if (editingPromise) {
        // Update existing commitment
        const response = await fetch('/api/supabase/commitments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingPromise.id, content }),
        });
        if (response.ok) {
          await fetchCommitments();
          closeModal();
        }
      } else {
        // Create new commitment
        const response = await fetch('/api/supabase/commitments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        if (response.ok) {
          await fetchCommitments();
          closeModal();
        }
      }
    } catch (error) {
      console.error('Error saving commitment:', error);
    }
  };

  const deletePromise = async (id: string) => {
    if (!confirm('Are you sure you want to delete this commitment?')) return;

    try {
      const response = await fetch(`/api/supabase/commitments?id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchCommitments();
      }
    } catch (error) {
      console.error('Error deleting commitment:', error);
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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Commitments</h2>
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-5 py-3.5 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-base md:text-sm min-h-[44px] w-full sm:w-auto"
            aria-label="Add Commitment"
          >
            <Plus className="w-5 h-5 md:w-4 md:h-4" />
            <span className="hidden md:inline">Add Commitment</span>
            <span className="md:hidden">Add Commitment</span>
          </button>
        </div>

        {promises.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No commitments yet. Click "Add Commitment" to create one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {promises.map((promise) => (
              <div
                key={promise.id}
                className="group flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <p className="flex-1 text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {promise.content}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(promise)}
                    className="p-3.5 md:p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                  >
                    <Edit2 className="w-5 h-5 md:w-4 md:h-4" />
                  </button>
                  <button
                    onClick={() => deletePromise(promise.id)}
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
        title={editingPromise ? 'Edit Commitment' : 'Add Commitment'}
      >
        <div className="space-y-4">
          <textarea
            autoFocus
            value={modalContent}
            onChange={(e) => setModalContent(e.target.value)}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 resize-none"
            rows={8}
            placeholder="Enter your commitment..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                savePromise();
              }
            }}
          />
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={closeModal}
              className="px-5 py-3.5 md:px-4 md:py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-base md:text-sm min-h-[44px] w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={savePromise}
              className="px-5 py-3.5 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-base md:text-sm min-h-[44px] w-full sm:w-auto"
            >
              {editingPromise ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

