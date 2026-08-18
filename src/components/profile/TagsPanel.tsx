"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button, ConfirmModal } from "@/components/ui";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { useTranslation } from "@/store/hooks";
import type { ApiResponse, Tag } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./TagsPanel.module.scss";

interface TagsPanelProps {
  realtorId: string;
  canEdit: boolean;
}

// A realtor's own tag set, self-managed here — see CLAUDE.md → "Tags". Assignable on the Add/Edit
// Asset page (components/assets/AssetFormFields.tsx's TagsField) and filterable on the Assets
// search bar. Every realtor starts with one default "Recent" tag (seeded on creation, see
// RealtorService.create()), which is just a regular, renamable/removable tag from here on — no
// special-casing.
export default function TagsPanel({ realtorId, canEdit }: TagsPanelProps) {
  const t = useTranslation();

  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadTags = useCallback(() => {
    if (!realtorId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount / entity-change, see NotesPanel for the general pattern
    setLoading(true);
    apiClient
      .get<ApiResponse<Tag[]>>(`/api/tags?realtorId=${realtorId}`)
      .then((response) => {
        setTags(response.data.data);
        setError(null);
      })
      .catch(() => setError(t("profile.tags.loadError")))
      .finally(() => setLoading(false));
  }, [realtorId, t]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    setAddError(null);
    try {
      const response = await apiClient.post<ApiResponse<Tag>>("/api/tags", { realtorId, name });
      setTags((prev) => [...prev, response.data.data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
    } catch (err) {
      setAddError(getErrorMessage(err, t("profile.tags.addError")));
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setEditingName(tag.name);
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditError(null);
  };

  const handleSaveEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingId) return;
    const name = editingName.trim();
    if (!name) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const response = await apiClient.put<ApiResponse<Tag>>(`/api/tags/${editingId}`, { name });
      setTags((prev) =>
        prev.map((tag) => (tag.id === editingId ? response.data.data : tag)).sort((a, b) => a.name.localeCompare(b.name))
      );
      cancelEdit();
    } catch (err) {
      setEditError(getErrorMessage(err, t("profile.tags.saveError")));
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!tagToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.delete(`/api/tags/${tagToDelete.id}`);
      setTags((prev) => prev.filter((tag) => tag.id !== tagToDelete.id));
      setTagToDelete(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err, t("profile.tags.deleteError")));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {error && <p className={sharedStyles.errorText}>{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400">{t("profile.tags.loading")}</p>
      ) : (
        <>
          {tags.length === 0 ? (
            <p className="text-xs text-neutral-400 mb-3">{t("profile.tags.empty")}</p>
          ) : (
            <div className={styles.chipList}>
              {tags.map((tag) =>
                editingId === tag.id ? (
                  <form key={tag.id} className={styles.editForm} onSubmit={handleSaveEdit}>
                    <input
                      autoFocus
                      className={styles.editInput}
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                    />
                    <button type="submit" className={styles.chipIconBtn} disabled={editSaving} title={t("common.save")}>
                      <Check size={12} />
                    </button>
                    <button type="button" className={styles.chipIconBtn} onClick={cancelEdit} title={t("common.cancel")}>
                      <X size={12} />
                    </button>
                  </form>
                ) : (
                  <span key={tag.id} className={styles.chip}>
                    <span>{tag.name}</span>
                    {canEdit && (
                      <>
                        <button
                          type="button"
                          className={styles.chipIconBtn}
                          onClick={() => startEdit(tag)}
                          title={t("common.edit")}
                          aria-label={t("common.edit")}
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          type="button"
                          className={styles.chipIconBtn}
                          onClick={() => setTagToDelete(tag)}
                          title={t("common.delete")}
                          aria-label={t("common.delete")}
                        >
                          <Trash2 size={11} />
                        </button>
                      </>
                    )}
                  </span>
                )
              )}
            </div>
          )}
          {editError && <p className={sharedStyles.errorText}>{editError}</p>}

          {canEdit && (
            <form className={styles.addForm} onSubmit={handleAdd}>
              <input
                className={sharedStyles.input}
                placeholder={t("profile.tags.namePlaceholder")}
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
              />
              <Button type="submit" variant="outline" disabled={adding || !newName.trim()}>
                <Plus size={14} />
                <span>{adding ? t("common.saving") : t("profile.tags.add")}</span>
              </Button>
            </form>
          )}
          {addError && <p className={sharedStyles.errorText}>{addError}</p>}
        </>
      )}

      <ConfirmModal
        isOpen={!!tagToDelete}
        title={t("profile.tags.deleteModalTitle")}
        message={t("profile.tags.deleteConfirm", { name: tagToDelete?.name ?? "" })}
        loading={deleting}
        error={deleteError}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setTagToDelete(null)}
      />
    </div>
  );
}
