'use client';

import { Edit2, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import Modal from './Modal';

interface Note {
  id: string;
  content: string;
}

export default function NotesSection() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [modalContent, setModalContent] = useState('');
  const [rawCapture, setRawCapture] = useState('');
  const rawInputRef = useRef<HTMLTextAreaElement>(null);
  const rawCaptureRef = useRef(rawCapture);
  rawCaptureRef.current = rawCapture;

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/supabase/notes');
      if (!response.ok) throw new Error('Failed to fetch notes');
      const data = await response.json();
      setNotes(data.items);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    fetchNotes();
  }, []);

  const saveRawNote = useCallback(async () => {
    const fromInput = rawInputRef.current?.value?.trim() ?? '';
    const content = fromInput || rawCaptureRef.current.trim();
    if (!content) return;
    try {
      const response = await fetch('/api/supabase/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (response.ok) {
        setRawCapture('');
        if (rawInputRef.current) rawInputRef.current.value = '';
        await fetchNotes();
      }
    } catch (e) {
      console.error('Error saving raw note:', e);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key === 'Enter') {
        if (e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          rawInputRef.current?.focus();
        } else {
          e.preventDefault();
          e.stopPropagation();
          saveRawNote();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [saveRawNote]);

  const openAddModal = () => {
    setEditingNote(null);
    setModalContent('');
    setIsModalOpen(true);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setModalContent(note.content);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
    setModalContent('');
  };

  const saveNote = async () => {
    const content = modalContent.trim();
    if (!content) return;

    try {
      if (editingNote) {
        // Update existing note
        const response = await fetch('/api/supabase/notes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingNote.id, content }),
        });
        if (response.ok) {
          await fetchNotes();
          closeModal();
        }
      } else {
        // Create new note
        const response = await fetch('/api/supabase/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        if (response.ok) {
          await fetchNotes();
          closeModal();
        }
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const deleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/supabase/notes?id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchNotes();
      }
    } catch (error) {
      console.error('Error deleting note:', error);
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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Notes</h2>
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-5 py-3.5 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-base md:text-sm min-h-[44px] w-full sm:w-auto"
            aria-label="Add Note"
          >
            <Plus className="w-5 h-5 md:w-4 md:h-4" />
            <span className="hidden md:inline">Add Note</span>
            <span className="md:hidden">Add Note</span>
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Raw capture
          </label>
          <textarea
            ref={rawInputRef}
            value={rawCapture}
            onChange={(e) => setRawCapture(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                saveRawNote();
              }
            }}
            placeholder="Paste or type raw notes… (Cmd+Enter save, Cmd+Shift+Enter focus)"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 resize-none text-sm"
            rows={3}
          />
          <button
            onClick={saveRawNote}
            disabled={!rawCapture.trim()}
            className="mt-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:pointer-events-none text-gray-800 dark:text-gray-200 rounded-lg text-sm"
          >
            Save raw note
          </button>
        </div>

        {notes.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No notes yet. Click "Add Note" to create one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="group flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <p className="flex-1 text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {note.content}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(note)}
                    className="p-3.5 md:p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                  >
                    <Edit2 className="w-5 h-5 md:w-4 md:h-4" />
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
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
        title={editingNote ? 'Edit Note' : 'Add Note'}
      >
        <div className="space-y-4">
          <textarea
            autoFocus
            value={modalContent}
            onChange={(e) => setModalContent(e.target.value)}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 resize-none"
            rows={8}
            placeholder="Enter your note..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                saveNote();
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
              onClick={saveNote}
              className="px-5 py-3.5 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-base md:text-sm min-h-[44px] w-full sm:w-auto"
            >
              {editingNote ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

