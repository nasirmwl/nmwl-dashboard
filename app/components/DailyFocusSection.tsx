"use client";

import { Calendar, Edit2, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

import Modal from "./Modal";
import { format } from "date-fns";

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
  const [modalContent, setModalContent] = useState("");
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [modalReminderAt, setModalReminderAt] = useState<string | null>(null);

  const fetchFocusItems = async () => {
    try {
      const response = await fetch("/api/supabase/daily-focus");
      if (!response.ok) throw new Error("Failed to fetch daily focus items");
      const data = await response.json();
      setFocusItems(data.items);
    } catch (error) {
      console.error("Error fetching daily focus items:", error);
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
    setModalContent("");
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
    setModalContent("");
    setModalDate(null);
    setModalReminderAt(null);
  };

  const saveFocusItem = async () => {
    const content = modalContent.trim();
    if (!content) return;

    const reminderAtIso = modalReminderAt
      ? new Date(modalReminderAt).toISOString()
      : null;

    try {
      if (editingItem) {
        // Update existing item
        const response = await fetch("/api/supabase/daily-focus", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingItem.id,
            content,
            date: modalDate,
            reminderAt: reminderAtIso,
          }),
        });
        if (response.ok) {
          await fetchFocusItems();
          closeModal();
        }
      } else {
        // Create new item
        const response = await fetch("/api/supabase/daily-focus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            date: modalDate,
            reminderAt: reminderAtIso,
          }),
        });
        if (response.ok) {
          await fetchFocusItems();
          closeModal();
        }
      }
    } catch (error) {
      console.error("Error saving daily focus item:", error);
    }
  };

  const deleteFocusItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const response = await fetch(`/api/supabase/daily-focus?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchFocusItems();
      }
    } catch (error) {
      console.error("Error deleting daily focus item:", error);
    }
  };

  if (!isClient || loading) {
    return (
      <div className="crt-panel rounded-sm p-4 sm:p-6">
        <div className="animate-pulse h-32 bg-crt-bar-track/40 rounded-sm" />
      </div>
    );
  }

  return (
    <>
      <div className="crt-panel rounded-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-crt-phosphor-bright tracking-wide">
            Reminders
          </h2>
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-5 py-3.5 md:px-4 md:py-2 crt-btn crt-btn-primary rounded-sm transition-colors text-base md:text-sm min-h-[44px] w-full sm:w-auto"
            aria-label="Add Reminder"
          >
            <Plus className="w-5 h-5 md:w-4 md:h-4" />
            <span className="hidden md:inline">Add Reminder</span>
            <span className="md:hidden">Add Reminder</span>
          </button>
        </div>

        {focusItems.length === 0 ? (
          <div className="text-center py-12 text-crt-muted crt-text-plain">
            <p>No reminders yet. Click "Add Reminder" to create one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {focusItems.map((item) => (
              <div
                key={item.id}
                className="group flex items-start gap-3 p-4 bg-crt-bar-track/40 rounded-sm border border-crt-border hover:border-crt-phosphor-dim transition-colors crt-text-plain"
              >
                <div className="flex-1">
                  <p className="text-crt-phosphor-bright whitespace-pre-wrap mb-2">
                    {item.content}
                  </p>
                  {item.date && (
                    <div className="flex items-center gap-2 text-sm text-crt-muted">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(item.date), "MMM d, yyyy")}</span>
                    </div>
                  )}
                  {item.reminderAt && (
                    <div className="flex items-center gap-2 text-xs text-crt-muted mt-1">
                      <span className="font-medium">Remind at:</span>
                      <span>
                        {format(
                          new Date(item.reminderAt),
                          "MMM d, yyyy h:mm a",
                        )}
                      </span>
                    </div>
                  )}
                  {item.notifiedAt && (
                    <div className="flex items-center gap-2 text-[11px] text-crt-phosphor-dim mt-0.5">
                      <span>Notified:</span>
                      <span>
                        {format(
                          new Date(item.notifiedAt),
                          "MMM d, yyyy h:mm a",
                        )}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-3.5 md:p-2 text-crt-phosphor hover:bg-crt-bar-track rounded-sm transition-colors min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center crt-text-plain"
                  >
                    <Edit2 className="w-5 h-5 md:w-4 md:h-4" />
                  </button>
                  <button
                    onClick={() => deleteFocusItem(item.id)}
                    className="p-3.5 md:p-2 text-crt-danger hover:bg-crt-bar-track rounded-sm transition-colors min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center crt-text-plain"
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
        title={editingItem ? "Edit Reminder" : "Add Reminder"}
      >
        <div className="space-y-4">
          <textarea
            autoFocus
            value={modalContent}
            onChange={(e) => setModalContent(e.target.value)}
            className="w-full px-4 py-3 crt-input rounded-sm resize-none"
            rows={8}
            placeholder="Enter your reminder..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                saveFocusItem();
              }
            }}
          />
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-crt-phosphor-dim" />
              <input
                type="date"
                value={modalDate || ""}
                onChange={(e) => setModalDate(e.target.value || null)}
                className="flex-1 px-4 py-3 crt-input rounded-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-crt-muted min-w-[90px] crt-text-plain">
                Remind at
              </span>
              <input
                type="datetime-local"
                value={modalReminderAt || ""}
                onChange={(e) => setModalReminderAt(e.target.value || null)}
                className="flex-1 px-4 py-3 crt-input rounded-sm"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={closeModal}
              className="px-5 py-3.5 md:px-4 md:py-2 crt-btn rounded-sm transition-colors text-base md:text-sm min-h-[44px] w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={saveFocusItem}
              className="px-5 py-3.5 md:px-4 md:py-2 crt-btn crt-btn-primary rounded-sm transition-colors text-base md:text-sm min-h-[44px] w-full sm:w-auto"
            >
              {editingItem ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
