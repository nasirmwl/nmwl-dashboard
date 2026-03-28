"use client";

import { Edit2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import Modal from "./Modal";
import SectionBox from "./SectionBox";

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
  const [modalContent, setModalContent] = useState("");
  const [rawCapture, setRawCapture] = useState("");
  const rawInputRef = useRef<HTMLTextAreaElement>(null);
  const rawCaptureRef = useRef(rawCapture);
  rawCaptureRef.current = rawCapture;

  const fetchNotes = async () => {
    try {
      const response = await fetch("/api/supabase/notes");
      if (!response.ok) throw new Error("Failed to fetch notes");
      const data = await response.json();
      setNotes(data.items);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    fetchNotes();
  }, []);

  const saveRawNote = useCallback(async () => {
    const fromInput = rawInputRef.current?.value?.trim() ?? "";
    const content = fromInput || rawCaptureRef.current.trim();
    if (!content) return;
    try {
      const response = await fetch("/api/supabase/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (response.ok) {
        setRawCapture("");
        if (rawInputRef.current) rawInputRef.current.value = "";
        await fetchNotes();
      }
    } catch (e) {
      console.error("Error saving raw note:", e);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key === "Enter") {
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
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [saveRawNote]);

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setModalContent(note.content);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
    setModalContent("");
  };

  const saveNote = async () => {
    const content = modalContent.trim();
    if (!content || !editingNote) return;

    try {
      const response = await fetch("/api/supabase/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingNote.id, content }),
      });
      if (response.ok) {
        await fetchNotes();
        closeModal();
      }
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const deleteNote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const response = await fetch(`/api/supabase/notes?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchNotes();
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  if (!isClient || loading) {
    return (
      <SectionBox title="Notes">
        <div className="animate-pulse h-32 bg-crt-bar-track/40 rounded-sm" />
      </SectionBox>
    );
  }

  return (
    <>
      <SectionBox title="Notes">
        <div className="mb-4">
          <label className="block text-sm font-medium text-crt-muted mb-1 crt-text-plain uppercase tracking-wider text-xs">
            Raw capture
          </label>
          <textarea
            ref={rawInputRef}
            value={rawCapture}
            onChange={(e) => setRawCapture(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                (e.metaKey || e.ctrlKey) &&
                !e.shiftKey
              ) {
                e.preventDefault();
                e.stopPropagation();
                saveRawNote();
              }
            }}
            placeholder="Paste or type raw notes… (Cmd+Enter save, Cmd+Shift+Enter focus)"
            className="w-full px-4 py-3 crt-input rounded-sm resize-none text-sm"
            rows={3}
          />
          <button
            onClick={saveRawNote}
            disabled={!rawCapture.trim()}
            className="mt-2 px-4 py-2 crt-btn rounded-sm disabled:opacity-50 disabled:pointer-events-none text-sm"
          >
            Save raw note
          </button>
        </div>

        {notes.length === 0 ? (
          <div className="text-center py-12 text-crt-muted crt-text-plain">
            <p>
              No notes yet. Type in raw capture and use Cmd+Enter (Ctrl+Enter) to
              save.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="group flex items-start gap-3 p-4 bg-crt-bar-track/40 rounded-sm border border-crt-border hover:border-crt-phosphor-dim transition-colors crt-text-plain"
              >
                <p className="flex-1 text-crt-phosphor-bright whitespace-pre-wrap">
                  {note.content}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(note)}
                    className="p-3.5 md:p-2 text-crt-phosphor hover:bg-crt-bar-track rounded-sm transition-colors min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center crt-text-plain"
                  >
                    <Edit2 className="w-5 h-5 md:w-4 md:h-4" />
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-3.5 md:p-2 text-crt-danger hover:bg-crt-bar-track rounded-sm transition-colors min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center crt-text-plain"
                  >
                    <X className="w-5 h-5 md:w-4 md:h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionBox>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Edit Note"
      >
        <div className="space-y-4">
          <textarea
            autoFocus
            value={modalContent}
            onChange={(e) => setModalContent(e.target.value)}
            className="w-full px-4 py-3 crt-input rounded-sm resize-none"
            rows={8}
            placeholder="Enter your note..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                saveNote();
              }
            }}
          />
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={closeModal}
              className="px-5 py-3.5 md:px-4 md:py-2 crt-btn rounded-sm transition-colors text-base md:text-sm min-h-[44px] w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={saveNote}
              className="px-5 py-3.5 md:px-4 md:py-2 crt-btn crt-btn-primary rounded-sm transition-colors text-base md:text-sm min-h-[44px] w-full sm:w-auto"
            >
              Update
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
