'use client';

import { useEffect, useState } from 'react';
import { Plus, X, Edit2, ExternalLink } from 'lucide-react';
import Modal from './Modal';

interface Podcast {
  id: string;
  title: string;
  link: string;
  description: string;
}

export default function PodcastsSection() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPodcast, setEditingPodcast] = useState<Podcast | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalLink, setModalLink] = useState('');
  const [modalDescription, setModalDescription] = useState('');

  const fetchPodcasts = async () => {
    try {
      const response = await fetch('/api/supabase/podcasts');
      if (!response.ok) throw new Error('Failed to fetch podcasts');
      const data = await response.json();
      setPodcasts(data.items);
    } catch (error) {
      console.error('Error fetching podcasts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    fetchPodcasts();
  }, []);

  const openAddModal = () => {
    setEditingPodcast(null);
    setModalTitle('');
    setModalLink('');
    setModalDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (podcast: Podcast) => {
    setEditingPodcast(podcast);
    setModalTitle(podcast.title);
    setModalLink(podcast.link);
    setModalDescription(podcast.description);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPodcast(null);
    setModalTitle('');
    setModalLink('');
    setModalDescription('');
  };

  const savePodcast = async () => {
    const title = modalTitle.trim();
    const link = modalLink.trim();
    if (!title || !link) return;

    try {
      if (editingPodcast) {
        // Update existing podcast
        const response = await fetch('/api/supabase/podcasts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingPodcast.id,
            title,
            link,
            description: modalDescription.trim(),
          }),
        });
        if (response.ok) {
          await fetchPodcasts();
          closeModal();
        }
      } else {
        // Create new podcast
        const response = await fetch('/api/supabase/podcasts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            link,
            description: modalDescription.trim(),
          }),
        });
        if (response.ok) {
          await fetchPodcasts();
          closeModal();
        }
      }
    } catch (error) {
      console.error('Error saving podcast:', error);
    }
  };

  const deletePodcast = async (id: string) => {
    if (!confirm('Are you sure you want to delete this podcast?')) return;

    try {
      const response = await fetch(`/api/supabase/podcasts?id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchPodcasts();
      }
    } catch (error) {
      console.error('Error deleting podcast:', error);
    }
  };

  if (!isClient || loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
        <div className="animate-pulse h-32" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Podcasts</h2>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Podcast
          </button>
        </div>

        {podcasts.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No podcasts yet. Click "Add Podcast" to create one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {podcasts.map((podcast) => (
              <div
                key={podcast.id}
                className="group flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <a
                    href={podcast.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-1"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {podcast.title}
                    </h3>
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  </a>
                  {podcast.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">
                      {podcast.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => openEditModal(podcast)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deletePodcast(podcast.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
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
        title={editingPodcast ? 'Edit Podcast' : 'Add Podcast'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title *
            </label>
            <input
              autoFocus
              type="text"
              value={modalTitle}
              onChange={(e) => setModalTitle(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              placeholder="Enter podcast title..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Link *
            </label>
            <input
              type="url"
              value={modalLink}
              onChange={(e) => setModalLink(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={modalDescription}
              onChange={(e) => setModalDescription(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 resize-none"
              rows={4}
              placeholder="Enter description (optional)..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  savePodcast();
                }
              }}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={savePodcast}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {editingPodcast ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

