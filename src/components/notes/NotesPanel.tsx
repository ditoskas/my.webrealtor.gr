"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button, ConfirmModal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useCanEdit, useTranslation } from "@/store/hooks";
import type { ApiResponse, Note, NoteEntityType, User } from "@/lib/types";
import NoteForm, { type NoteFormValues } from "./NoteForm";
import NoteItem from "./NoteItem";
import styles from "./NotesPanel.module.scss";

interface NotesPanelProps {
  entityType: NoteEntityType;
  entityId: string;
}

// The actual notes UI (fetch + list + add + inline edit/delete) — one of the two tabs rendered by
// EntityDetailTabs (the other being FilesPanel), which is what every consumer actually embeds.
export default function NotesPanel({ entityType, entityId }: NotesPanelProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const canEdit = useCanEdit();

  const [notes, setNotes] = useState<Note[]>([]);
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const response = await apiClient.get<ApiResponse<Note[]>>(
        `/api/notes?entityType=${entityType}&entityId=${entityId}`
      );
      setNotes(response.data.data);
      setError(null);
    } catch {
      setError(t("notes.loadError"));
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount / entity-change, see RealtorsPage for the general pattern
    loadNotes();
  }, [loadNotes]);

  // Resolve only the users actually referenced by these notes, not the whole /api/users list —
  // this panel is reachable by every role, same reasoning as AssetViewPage's price history.
  useEffect(() => {
    const ids = Array.from(new Set(notes.map((note) => note.userId).filter((id): id is string => !!id)));
    const missing = ids.filter((id) => !(id in userEmails));
    if (missing.length === 0) return;
    Promise.all(
      missing.map((id) =>
        apiClient
          .get<ApiResponse<User>>(`/api/users/${id}`)
          .then((response) => [id, response.data.data.email] as const)
          .catch(() => [id, null] as const)
      )
    ).then((entries) => {
      setUserEmails((prev) => {
        const next = { ...prev };
        entries.forEach(([id, email]) => {
          if (email) next[id] = email;
        });
        return next;
      });
    });
  }, [notes, userEmails]);

  const handleAdd = async (values: NoteFormValues) => {
    setSaving(true);
    setFormError(null);
    try {
      await apiClient.post("/api/notes", { entityType, entityId, ...values });
      MessageHandler.success(dispatch, t("notes.createSuccess"));
      setIsAdding(false);
      await loadNotes();
    } catch (err) {
      setFormError(getErrorMessage(err, t("notes.saveError")));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id: string, values: NoteFormValues) => {
    setSaving(true);
    setFormError(null);
    try {
      await apiClient.put(`/api/notes/${id}`, values);
      MessageHandler.success(dispatch, t("notes.updateSuccess"));
      setEditingId(null);
      await loadNotes();
    } catch (err) {
      setFormError(getErrorMessage(err, t("notes.saveError")));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.delete(`/api/notes/${noteToDelete.id}`);
      MessageHandler.success(dispatch, t("notes.deleteSuccess"));
      setNotes((prev) => prev.filter((note) => note.id !== noteToDelete.id));
      setNoteToDelete(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err, t("notes.deleteError")));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {error && <p className="text-sm text-rose-500 mb-2">{error}</p>}

      {canEdit && !isAdding && !editingId && (
        <Button variant="outline" className="mb-4" onClick={() => setIsAdding(true)}>
          <Plus size={14} />
          <span>{t("notes.addNote")}</span>
        </Button>
      )}

      {isAdding && (
        <div className={styles.formWrapper}>
          <NoteForm
            submitLabel={t("notes.addNote")}
            loading={saving}
            error={formError}
            onSubmit={handleAdd}
            onCancel={() => {
              setIsAdding(false);
              setFormError(null);
            }}
          />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-neutral-400">{t("notes.loading")}</p>
      ) : notes.length === 0 && !isAdding ? (
        <p className="text-sm text-neutral-400">{t("notes.empty")}</p>
      ) : (
        <div className={styles.noteList}>
          {notes.map((note) =>
            editingId === note.id ? (
              <div key={note.id} className={styles.formWrapper}>
                <NoteForm
                  initialValues={note}
                  submitLabel={t("common.save")}
                  loading={saving}
                  error={formError}
                  onSubmit={(values) => handleEdit(note.id, values)}
                  onCancel={() => {
                    setEditingId(null);
                    setFormError(null);
                  }}
                />
              </div>
            ) : (
              <NoteItem
                key={note.id}
                note={note}
                authorEmail={note.userId ? userEmails[note.userId] : undefined}
                canEdit={canEdit}
                onEdit={() => {
                  setIsAdding(false);
                  setFormError(null);
                  setEditingId(note.id);
                }}
                onDelete={() => setNoteToDelete(note)}
              />
            )
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={!!noteToDelete}
        title={t("notes.deleteModalTitle")}
        message={t("notes.deleteConfirm", { title: noteToDelete?.title ?? "" })}
        loading={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setNoteToDelete(null)}
      />
    </div>
  );
}
