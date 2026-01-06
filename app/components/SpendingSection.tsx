'use client';

import { Edit2, Plus, X, DollarSign, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

import Modal from './Modal';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface Spending {
  id: string;
  amount: number;
  category_id: string | null;
  category: Category | null;
  description: string | null;
  spent_at: string;
}

export default function SpendingSection() {
  const [spending, setSpending] = useState<Spending[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCategorySpendingModalOpen, setIsCategorySpendingModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [wasViewAllOpen, setWasViewAllOpen] = useState(false);
  const [editingSpending, setEditingSpending] = useState<Spending | null>(null);
  const [modalAmount, setModalAmount] = useState('');
  const [modalCategoryId, setModalCategoryId] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalSpentAt, setModalSpentAt] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');

  const fetchSpending = async () => {
    try {
      const response = await fetch('/api/supabase/spending');
      if (!response.ok) throw new Error('Failed to fetch spending');
      const data = await response.json();
      setSpending(data.items || []);
    } catch (error) {
      console.error('Error fetching spending:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/supabase/spending-categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data.items || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    setIsClient(true);
    fetchSpending();
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingSpending(null);
    setModalAmount('');
    setModalCategoryId('');
    setModalDescription('');
    setModalSpentAt(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Spending, fromViewAll = false) => {
    setEditingSpending(item);
    setModalAmount(item.amount.toString());
    setModalCategoryId(item.category_id || '');
    setModalDescription(item.description || '');
    setModalSpentAt(item.spent_at ? new Date(item.spent_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setWasViewAllOpen(fromViewAll);
    if (fromViewAll) {
      setIsViewAllModalOpen(false);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSpending(null);
    setModalAmount('');
    setModalCategoryId('');
    setModalDescription('');
    setModalSpentAt('');
  };

  const openCategoryModal = () => {
    setNewCategoryName('');
    setNewCategoryDescription('');
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setNewCategoryName('');
    setNewCategoryDescription('');
  };

  const saveCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      alert('Please enter a category name');
      return;
    }

    try {
      const response = await fetch('/api/supabase/spending-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: newCategoryDescription.trim() || null,
        }),
      });
      if (response.ok) {
        await fetchCategories();
        const data = await response.json();
        setModalCategoryId(data.id);
        closeCategoryModal();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to create category');
    }
  };

  const openViewAllModal = () => {
    setIsViewAllModalOpen(true);
  };

  const closeViewAllModal = () => {
    setIsViewAllModalOpen(false);
  };

  const openCategorySpendingModal = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setIsCategorySpendingModalOpen(true);
  };

  const closeCategorySpendingModal = () => {
    setIsCategorySpendingModalOpen(false);
    setSelectedCategoryId(null);
  };

  const saveSpending = async () => {
    const amount = parseFloat(modalAmount.trim());
    if (!amount || isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      if (editingSpending) {
        // Update existing spending
        const response = await fetch('/api/supabase/spending', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingSpending.id,
            amount,
            category_id: modalCategoryId || null,
            description: modalDescription.trim() || null,
            spent_at: modalSpentAt || new Date().toISOString(),
          }),
        });
        if (response.ok) {
          await fetchSpending();
          closeModal();
          if (wasViewAllOpen) {
            setIsViewAllModalOpen(true);
            setWasViewAllOpen(false);
          }
        }
      } else {
        // Create new spending
        const response = await fetch('/api/supabase/spending', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            category_id: modalCategoryId || null,
            description: modalDescription.trim() || null,
            spent_at: modalSpentAt || new Date().toISOString(),
          }),
        });
        if (response.ok) {
          await fetchSpending();
          closeModal();
          if (wasViewAllOpen) {
            setIsViewAllModalOpen(true);
            setWasViewAllOpen(false);
          }
        }
      }
    } catch (error) {
      console.error('Error saving spending:', error);
    }
  };

  const deleteSpending = async (id: string) => {
    if (!confirm('Are you sure you want to delete this spending entry?')) return;

    try {
      const response = await fetch(`/api/supabase/spending?id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchSpending();
      }
    } catch (error) {
      console.error('Error deleting spending:', error);
    }
  };

  const totalAmount = spending.reduce((sum, item) => sum + item.amount, 0);

  // Calculate spending by category
  const spendingByCategory = spending.reduce((acc, item) => {
    const categoryName = item.category ? item.category.name : 'Uncategorized';
    const categoryId = item.category_id || 'uncategorized';
    
    if (!acc[categoryId]) {
      acc[categoryId] = {
        id: categoryId,
        name: categoryName,
        total: 0,
        count: 0,
      };
    }
    acc[categoryId].total += item.amount;
    acc[categoryId].count += 1;
    return acc;
  }, {} as Record<string, { id: string; name: string; total: number; count: number }>);

  const categoryTotals = Object.values(spendingByCategory).sort((a, b) => b.total - a.total);

  // Get spending entries for selected category
  const getCategorySpending = (categoryId: string | null) => {
    if (categoryId === null || categoryId === 'uncategorized') {
      return spending.filter(item => !item.category_id);
    }
    return spending.filter(item => item.category_id === categoryId);
  };

  const selectedCategorySpending = selectedCategoryId !== null ? getCategorySpending(selectedCategoryId) : [];
  const selectedCategory = selectedCategoryId !== null 
    ? (selectedCategoryId === 'uncategorized' 
        ? { id: 'uncategorized', name: 'Uncategorized' }
        : categoryTotals.find(cat => cat.id === selectedCategoryId))
    : null;

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
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Spending</h2>
            {spending.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Total: <span className="font-semibold text-gray-900 dark:text-gray-100">₼{totalAmount.toFixed(2)}</span>
              </p>
            )}
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-5 py-3.5 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-base md:text-sm min-h-[44px] w-full sm:w-auto"
            aria-label="Add Spending"
          >
            <Plus className="w-5 h-5 md:w-4 md:h-4" />
            <span className="hidden md:inline">Add Spending</span>
            <span className="md:hidden">Add Spending</span>
          </button>
        </div>

        {spending.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No spending entries yet. Click "Add Spending" to create one.</p>
          </div>
        ) : (
          <>
            {/* Bar Chart for All Categories */}
            {categoryTotals.length > 0 && (
              <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Spending by Category
                </h3>
                <div className="h-64">
                  <Bar
                    data={{
                      labels: categoryTotals.map(cat => cat.name),
                      datasets: [
                        {
                          label: 'Spending (₼)',
                          data: categoryTotals.map(cat => cat.total),
                          backgroundColor: 'rgba(37, 99, 235, 0.8)',
                          borderColor: 'rgba(37, 99, 235, 1)',
                          borderWidth: 1,
                          barThickness: 40,
                          maxBarThickness: 50,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const cat = categoryTotals[context.dataIndex];
                              const percentage = totalAmount > 0 ? (cat.total / totalAmount) * 100 : 0;
                              return `₼${cat.total.toFixed(2)} (${percentage.toFixed(1)}% of total) • ${cat.count} ${cat.count === 1 ? 'entry' : 'entries'}`;
                            },
                          },
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return '₼' + Number(value).toFixed(2);
                            },
                            color: '#6b7280',
                          },
                          grid: {
                            color: 'rgba(107, 114, 128, 0.2)',
                          },
                        },
                        x: {
                          ticks: {
                            color: '#6b7280',
                          },
                          grid: {
                            display: false,
                          },
                          categoryPercentage: 0.5,
                          barPercentage: 0.7,
                        },
                      },
                    }}
                  />
                </div>
              </div>
            )}

            {/* Category-based spending breakdown */}
            {categoryTotals.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Categories
                </h3>
                <div className="space-y-3">
                  {categoryTotals.map((cat) => {
                    const percentage = totalAmount > 0 ? (cat.total / totalAmount) * 100 : 0;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => openCategorySpendingModal(cat.id)}
                        className="w-full text-left p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {cat.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ({cat.count} {cat.count === 1 ? 'entry' : 'entries'})
                            </span>
                          </div>
                          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            ₼{cat.total.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {percentage.toFixed(1)}% of total
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingSpending ? 'Edit Spending' : 'Add Spending'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              autoFocus
              value={modalAmount}
              onChange={(e) => setModalAmount(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 text-base md:text-sm"
              placeholder="0.00"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category
              </label>
              <button
                type="button"
                onClick={openCategoryModal}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                + New Category
              </button>
            </div>
            <select
              value={modalCategoryId}
              onChange={(e) => setModalCategoryId(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 text-base md:text-sm"
            >
              <option value="">-- No Category --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <input
              type="date"
              value={modalSpentAt}
              onChange={(e) => setModalSpentAt(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 text-base md:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={modalDescription}
              onChange={(e) => setModalDescription(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 resize-none"
              rows={4}
              placeholder="Optional description..."
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
              onClick={saveSpending}
              className="px-5 py-3.5 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-base md:text-sm min-h-[44px] w-full sm:w-auto"
            >
              {editingSpending ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isViewAllModalOpen}
        onClose={closeViewAllModal}
        title="All Spending"
      >
        <div className="space-y-4">
          <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Spending</span>
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">₼{totalAmount.toFixed(2)}</span>
            </div>
            <div className="mt-2">
              <button
                onClick={() => {
                  closeViewAllModal();
                  openAddModal();
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Spending
              </button>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto space-y-3">
            {spending.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No spending entries yet.</p>
              </div>
            ) : (
              spending.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        ₼{item.amount.toFixed(2)}
                      </span>
                      {item.category && (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {item.category.name}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(item.spent_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => openEditModal(item, true)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        await deleteSpending(item.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isCategorySpendingModalOpen}
        onClose={closeCategorySpendingModal}
        title={selectedCategory ? `${selectedCategory.name} Spending` : 'Category Spending'}
      >
        <div className="space-y-4">
          {selectedCategory && (
            <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Category Total</span>
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  ₼{selectedCategory.total.toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {selectedCategory.count} {selectedCategory.count === 1 ? 'entry' : 'entries'}
              </div>
              <div className="mt-2">
                <button
                  onClick={() => {
                    closeCategorySpendingModal();
                    openAddModal();
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Spending
                </button>
              </div>
            </div>
          )}

          <div className="max-h-[60vh] overflow-y-auto space-y-3">
            {selectedCategorySpending.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No spending entries in this category yet.</p>
              </div>
            ) : (
              selectedCategorySpending.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        ₼{item.amount.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(item.spent_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => {
                        openEditModal(item, false);
                        closeCategorySpendingModal();
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        await deleteSpending(item.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isCategoryModalOpen}
        onClose={closeCategoryModal}
        title="New Category"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              autoFocus
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 text-base md:text-sm"
              placeholder="e.g., Food, Transport, Entertainment"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={newCategoryDescription}
              onChange={(e) => setNewCategoryDescription(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 resize-none"
              rows={3}
              placeholder="Optional description..."
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={closeCategoryModal}
              className="px-5 py-3.5 md:px-4 md:py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-base md:text-sm min-h-[44px] w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={saveCategory}
              className="px-5 py-3.5 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-base md:text-sm min-h-[44px] w-full sm:w-auto"
            >
              Create Category
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

