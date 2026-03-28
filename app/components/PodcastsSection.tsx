"use client";

import { Edit2, ExternalLink, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

import Modal from "./Modal";
import SectionBox from "./SectionBox";

interface Podcast {
  id: string;
  title: string;
  link: string;
  description: string;
  listened?: boolean;
}

export default function PodcastsSection() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPodcast, setEditingPodcast] = useState<Podcast | null>(null);
  const [modalTitle, setModalTitle] = useState("");
  const [modalLink, setModalLink] = useState("");
  const [modalDescription, setModalDescription] = useState("");

  const fetchPodcasts = async () => {
    try {
      const response = await fetch("/api/supabase/podcasts");
      if (!response.ok) throw new Error("Failed to fetch podcasts");
      const data = await response.json();
      setPodcasts(data.items);
    } catch (error) {
      console.error("Error fetching podcasts:", error);
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
    setModalTitle("");
    setModalLink("");
    setModalDescription("");
    setIsModalOpen(true);
  };

  const toggleListened = async (podcast: Podcast) => {
    const next = !(podcast.listened === true);
    try {
      const response = await fetch("/api/supabase/podcasts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: podcast.id,
          title: podcast.title,
          link: podcast.link,
          description: podcast.description ?? "",
          listened: next,
        }),
      });
      if (response.ok) await fetchPodcasts();
    } catch (error) {
      console.error("Error toggling listened:", error);
    }
  };

  const openEditModal = (podcast: Podcast) => {
    setEditingPodcast(podcast);
    setModalTitle(podcast.title);
    setModalLink(podcast.link);
    setModalDescription(podcast.description ?? "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPodcast(null);
    setModalTitle("");
    setModalLink("");
    setModalDescription("");
  };

  const savePodcast = async () => {
    const title = modalTitle.trim();
    const link = modalLink.trim();
    if (!title || !link) return;

    try {
      if (editingPodcast) {
        // Update existing podcast
        const response = await fetch("/api/supabase/podcasts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingPodcast.id,
            title,
            link,
            description: modalDescription.trim(),
            listened: editingPodcast.listened === true,
          }),
        });
        if (response.ok) {
          await fetchPodcasts();
          closeModal();
        }
      } else {
        // Create new podcast
        const response = await fetch("/api/supabase/podcasts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
      console.error("Error saving podcast:", error);
    }
  };

  const deletePodcast = async (id: string) => {
    if (!confirm("Are you sure you want to delete this podcast?")) return;

    try {
      const response = await fetch(`/api/supabase/podcasts?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchPodcasts();
      }
    } catch (error) {
      console.error("Error deleting podcast:", error);
    }
  };

  if (!isClient || loading) {
    return (
      <SectionBox title="Podcasts">
        <div className="animate-pulse h-32 bg-crt-bar-track/40 rounded-sm" />
      </SectionBox>
    );
  }

  return (
    <>
      <SectionBox
        title="Podcasts"
        toolbar={
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-5 py-3.5 md:px-4 md:py-2 crt-btn crt-btn-primary rounded-sm transition-colors text-base md:text-sm min-h-[44px] w-full sm:w-auto"
            aria-label="Add Podcast"
          >
            <Plus className="w-5 h-5 md:w-4 md:h-4" />
            <span className="hidden md:inline">Add Podcast</span>
            <span className="md:hidden">Add Podcast</span>
          </button>
        }
      >
        {podcasts.length === 0 ? (
          <div className="text-center py-12 text-crt-muted crt-text-plain">
            <p>No podcasts yet. Click "Add Podcast" to create one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {podcasts.map((podcast) => (
              <div
                key={podcast.id}
                className="group flex items-start gap-3 p-4 bg-crt-bar-track/40 rounded-sm border border-crt-border hover:border-crt-phosphor-dim transition-colors crt-text-plain"
              >
                <div className="flex-1 min-w-0">
                  <a
                    href={podcast.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-crt-phosphor hover:text-crt-phosphor-bright hover:underline mb-1"
                  >
                    <h3 className="font-semibold text-crt-phosphor-bright truncate">
                      {podcast.title}
                    </h3>
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  </a>
                  {podcast.description && (
                    <p className="text-sm text-crt-muted mt-1 whitespace-pre-wrap">
                      {podcast.description}
                    </p>
                  )}
                  <label className="inline-flex items-center gap-2 mt-2 cursor-pointer text-sm text-crt-muted">
                    <input
                      type="checkbox"
                      checked={podcast.listened === true}
                      onChange={() => toggleListened(podcast)}
                      className="rounded border-crt-border accent-[var(--crt-phosphor)]"
                    />
                    <span>Listened</span>
                  </label>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => openEditModal(podcast)}
                    className="p-3.5 md:p-2 text-crt-phosphor hover:bg-crt-bar-track rounded-sm transition-colors min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center crt-text-plain"
                  >
                    <Edit2 className="w-5 h-5 md:w-4 md:h-4" />
                  </button>
                  <button
                    onClick={() => deletePodcast(podcast.id)}
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
        title={editingPodcast ? "Edit Podcast" : "Add Podcast"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-crt-muted mb-1 crt-text-plain uppercase tracking-wider text-xs">
              Title *
            </label>
            <input
              autoFocus
              type="text"
              value={modalTitle}
              onChange={(e) => setModalTitle(e.target.value)}
              className="w-full px-4 py-2 crt-input rounded-sm"
              placeholder="Enter podcast title..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-crt-muted mb-1 crt-text-plain uppercase tracking-wider text-xs">
              Link *
            </label>
            <input
              type="url"
              value={modalLink}
              onChange={(e) => setModalLink(e.target.value)}
              className="w-full px-4 py-2 crt-input rounded-sm"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-crt-muted mb-1 crt-text-plain uppercase tracking-wider text-xs">
              Description
            </label>
            <textarea
              value={modalDescription}
              onChange={(e) => setModalDescription(e.target.value)}
              className="w-full px-4 py-3 crt-input rounded-sm resize-none"
              rows={4}
              placeholder="Enter description (optional)..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  savePodcast();
                }
              }}
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={closeModal}
              className="px-5 py-3.5 md:px-4 md:py-2 crt-btn rounded-sm transition-colors text-base md:text-sm min-h-[44px] w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={savePodcast}
              className="px-5 py-3.5 md:px-4 md:py-2 crt-btn crt-btn-primary rounded-sm transition-colors text-base md:text-sm min-h-[44px] w-full sm:w-auto"
            >
              {editingPodcast ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
