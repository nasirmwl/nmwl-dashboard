'use client';

import { useEffect, useState } from 'react';
import { Plus, X, Edit2, Save } from 'lucide-react';

interface Note {
  id: string;
  content: string;
  isEditing: boolean;
}

export default function NotesSection() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('important-notes');
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch {
        setNotes([]);
      }
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('important-notes', JSON.stringify(notes));
    }
  }, [notes, isClient]);

  const addNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      content: '',
      isEditing: true,
    };
    setNotes([newNote, ...notes]);
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  const updateNote = (id: string, content: string) => {
    setNotes(
      notes.map((note) =>
        note.id === id ? { ...note, content, isEditing: false } : note
      )
    );
  };

  const startEditing = (id: string) => {
    setNotes(
      notes.map((note) =>
        note.id === id ? { ...note, isEditing: true } : note
      )
    );
  };

  if (!isClient) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
        <div className="animate-pulse h-32" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Important Notes</h2>
        <button
          onClick={addNote}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Note
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
              {note.isEditing ? (
                <div className="flex-1 flex gap-2">
                  <textarea
                    autoFocus
                    value={note.content}
                    onChange={(e) => {
                      setNotes(
                        notes.map((n) =>
                          n.id === note.id ? { ...n, content: e.target.value } : n
                        )
                      );
                    }}
                    onBlur={() => updateNote(note.id, note.content)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        updateNote(note.id, note.content);
                      }
                      if (e.key === 'Escape') {
                        updateNote(note.id, note.content);
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 resize-none"
                    rows={3}
                    placeholder="Enter your note..."
                  />
                  <button
                    onClick={() => updateNote(note.id, note.content)}
                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <p className="flex-1 text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {note.content || <span className="text-gray-400 italic">Empty note</span>}
                  </p>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditing(note.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

