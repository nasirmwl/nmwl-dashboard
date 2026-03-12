'use client';

import { Edit2, ExternalLink, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import Modal from './Modal';

interface YoutubeLink {
  id: string;
  title: string;
  link: string;
  watched?: boolean;
}

export default function YoutubeLinksSection() {
  const [youtubeLinks, setYoutubeLinks] = useState<YoutubeLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<YoutubeLink | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalLink, setModalLink] = useState('');

  const fetchYoutubeLinks = async () => {
    try {
      const response = await fetch('/api/supabase/youtube-links');
      if (!response.ok) throw new Error('Failed to fetch youtube links');
      const data = await response.json();
      setYoutubeLinks(data.items);
    } catch (error) {
      console.error('Error fetching youtube links:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    fetchYoutubeLinks();
  }, []);

  const openAddModal = () => {
    setEditingLink(null);
    setModalTitle('');
    setModalLink('');
    setIsModalOpen(true);
  };

  const toggleWatched = async (link: YoutubeLink) => {
    const next = !(link.watched === true);
    try {
      const response = await fetch('/api/supabase/youtube-links', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: link.id,
          title: link.title,
          link: link.link,
          watched: next,
        }),
      });
      if (response.ok) await fetchYoutubeLinks();
    } catch (error) {
      console.error('Error toggling watched:', error);
    }
  };

  const openEditModal = (link: YoutubeLink) => {
    setEditingLink(link);
    setModalTitle(link.title);
    setModalLink(link.link);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLink(null);
    setModalTitle('');
    setModalLink('');
  };

  const saveYoutubeLink = async () => {
    const title = modalTitle.trim();
    const link = modalLink.trim();
    if (!title || !link) return;

    try {
      if (editingLink) {
        // Update existing link
        const response = await fetch('/api/supabase/youtube-links', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingLink.id,
            title,
            link,
            watched: editingLink.watched === true,
          }),
        });
        if (response.ok) {
          await fetchYoutubeLinks();
          closeModal();
        }
      } else {
        // Create new link
        const response = await fetch('/api/supabase/youtube-links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            link,
          }),
        });
        if (response.ok) {
          await fetchYoutubeLinks();
          closeModal();
        }
      }
    } catch (error) {
      console.error('Error saving youtube link:', error);
    }
  };

  const deleteYoutubeLink = async (id: string) => {
    if (!confirm('Are you sure you want to delete this youtube link?')) return;

    try {
      const response = await fetch(`/api/supabase/youtube-links?id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchYoutubeLinks();
      }
    } catch (error) {
      console.error('Error deleting youtube link:', error);
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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">YouTube Links</h2>
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-5 py-3.5 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-base md:text-sm min-h-[44px] w-full sm:w-auto"
            aria-label="Add YouTube Link"
          >
            <Plus className="w-5 h-5 md:w-4 md:h-4" />
            <span className="hidden md:inline">Add Link</span>
            <span className="md:hidden">Add Link</span>
          </button>
        </div>

        {youtubeLinks.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No youtube links yet. Click "Add Link" to create one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {youtubeLinks.map((link) => (
              <div
                key={link.id}
                className="group flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <a
                    href={link.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {link.title}
                    </h3>
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  </a>
                  <label className="inline-flex items-center gap-2 mt-2 cursor-pointer text-sm text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={link.watched === true}
                      onChange={() => toggleWatched(link)}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Watched</span>
                  </label>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => openEditModal(link)}
                    className="p-3.5 md:p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                  >
                    <Edit2 className="w-5 h-5 md:w-4 md:h-4" />
                  </button>
                  <button
                    onClick={() => deleteYoutubeLink(link.id)}
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
        title={editingLink ? 'Edit YouTube Link' : 'Add YouTube Link'}
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
              placeholder="Enter video title..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  saveYoutubeLink();
                }
              }}
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
              placeholder="https://youtube.com/..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  saveYoutubeLink();
                }
              }}
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={closeModal}
              className="px-5 py-3.5 md:px-4 md:py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-base md:text-sm min-h-[44px] w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={saveYoutubeLink}
              className="px-5 py-3.5 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-base md:text-sm min-h-[44px] w-full sm:w-auto"
            >
              {editingLink ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

