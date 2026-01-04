'use client';

import { useEffect, useState } from 'react';
import { Plus, X, Edit2, Save } from 'lucide-react';

interface Promise {
  id: string;
  content: string;
  isEditing: boolean;
}

export default function PromisesSection() {
  const [promises, setPromises] = useState<Promise[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('my-commitments');
    if (saved) {
      try {
        setPromises(JSON.parse(saved));
      } catch {
        setPromises([]);
      }
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('my-commitments', JSON.stringify(promises));
    }
  }, [promises, isClient]);

  const addPromise = () => {
    const newPromise: Promise = {
      id: Date.now().toString(),
      content: '',
      isEditing: true,
    };
    setPromises([newPromise, ...promises]);
  };

  const deletePromise = (id: string) => {
    setPromises(promises.filter((promise) => promise.id !== id));
  };

  const updatePromise = (id: string, content: string) => {
    setPromises(
      promises.map((promise) =>
        promise.id === id ? { ...promise, content, isEditing: false } : promise
      )
    );
  };

  const startEditing = (id: string) => {
    setPromises(
      promises.map((promise) =>
        promise.id === id ? { ...promise, isEditing: true } : promise
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Commitments</h2>
        <button
          onClick={addPromise}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Commitment
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
              {promise.isEditing ? (
                <div className="flex-1 flex gap-2">
                  <textarea
                    autoFocus
                    value={promise.content}
                    onChange={(e) => {
                      setPromises(
                        promises.map((p) =>
                          p.id === promise.id ? { ...p, content: e.target.value } : p
                        )
                      );
                    }}
                    onBlur={() => updatePromise(promise.id, promise.content)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        updatePromise(promise.id, promise.content);
                      }
                      if (e.key === 'Escape') {
                        updatePromise(promise.id, promise.content);
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 resize-none"
                    rows={3}
                    placeholder="Enter your commitment..."
                  />
                  <button
                    onClick={() => updatePromise(promise.id, promise.content)}
                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <p className="flex-1 text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {promise.content || <span className="text-gray-400 italic">Empty commitment</span>}
                  </p>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditing(promise.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePromise(promise.id)}
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

