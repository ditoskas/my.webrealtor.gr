"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";
import { UploadCloud } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/errors";
import { MessageHandler } from "@/helpers/messageHandler";
import { useAppDispatch, useCanEdit, useTranslation } from "@/store/hooks";
import { ConfirmModal } from "@/components/ui";
import type { ApiResponse, AttachableEntityType, Attachment, User } from "@/lib/types";
import FileItem from "./FileItem";
import FileEditForm, { type FileEditValues } from "./FileEditForm";
import styles from "./FilesPanel.module.scss";

interface FilesPanelProps {
  entityType: AttachableEntityType;
  entityId: string;
}

export default function FilesPanel({ entityType, entityId }: FilesPanelProps) {
  const dispatch = useAppDispatch();
  const t = useTranslation();
  const canEdit = useCanEdit();

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [attachmentToDelete, setAttachmentToDelete] = useState<Attachment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadAttachments = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const response = await apiClient.get<ApiResponse<Attachment[]>>(
        `/api/attachments?entityType=${entityType}&entityId=${entityId}`
      );
      setAttachments(response.data.data);
      setError(null);
    } catch {
      setError(t("files.loadError"));
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount / entity-change, see RealtorsPage for the general pattern
    loadAttachments();
  }, [loadAttachments]);

  // Resolve only the users actually referenced by these attachments, not the whole /api/users
  // list — this panel is reachable by every role, same reasoning as NotesPanel.
  useEffect(() => {
    const ids = Array.from(new Set(attachments.map((attachment) => attachment.userId).filter((id): id is string => !!id)));
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
  }, [attachments, userEmails]);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      setUploading(true);
      setUploadError(null);
      try {
        const formData = new FormData();
        formData.append("entityType", entityType);
        formData.append("entityId", entityId);
        Array.from(fileList).forEach((file) => formData.append("files", file));
        await apiClient.post("/api/attachments", formData);
        MessageHandler.success(dispatch, t("files.uploadSuccess"));
        await loadAttachments();
      } catch (err) {
        setUploadError(getErrorMessage(err, t("files.uploadError")));
      } finally {
        setUploading(false);
      }
    },
    [entityType, entityId, dispatch, t, loadAttachments]
  );

  const handleEdit = async (id: string, values: FileEditValues) => {
    setSaving(true);
    setFormError(null);
    try {
      await apiClient.put(`/api/attachments/${id}`, values);
      MessageHandler.success(dispatch, t("files.updateSuccess"));
      setEditingId(null);
      await loadAttachments();
    } catch (err) {
      setFormError(getErrorMessage(err, t("files.saveError")));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!attachmentToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.delete(`/api/attachments/${attachmentToDelete.id}`);
      MessageHandler.success(dispatch, t("files.deleteSuccess"));
      setAttachments((prev) => prev.filter((attachment) => attachment.id !== attachmentToDelete.id));
      setAttachmentToDelete(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err, t("files.deleteError")));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {error && <p className="text-sm text-rose-500 mb-2">{error}</p>}
      {uploadError && <p className="text-sm text-rose-500 mb-2">{uploadError}</p>}

      {canEdit && (
        <div
          className={`${styles.dropzone} ${isDraggingOver ? styles.dropzoneActive : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={(event: DragEvent) => {
            event.preventDefault();
            setIsDraggingOver(false);
            handleFiles(event.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") fileInputRef.current?.click();
          }}
        >
          <UploadCloud size={24} />
          <p>{t("files.dropzoneHint")}</p>
          {uploading && <p className={styles.uploadingHint}>{t("files.uploading")}</p>}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className={styles.hiddenInput}
            onChange={(event) => {
              handleFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-neutral-400 mt-4">{t("files.loading")}</p>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-neutral-400 mt-4">{t("files.empty")}</p>
      ) : (
        <div className={styles.fileGrid}>
          {attachments.map((attachment) =>
            editingId === attachment.id ? (
              <div key={attachment.id} className={`${styles.formWrapper} ${styles.formWrapperSpan}`}>
                <FileEditForm
                  initialValues={{ title: attachment.title, description: attachment.description }}
                  loading={saving}
                  error={formError}
                  onSubmit={(values) => handleEdit(attachment.id, values)}
                  onCancel={() => {
                    setEditingId(null);
                    setFormError(null);
                  }}
                />
              </div>
            ) : (
              <FileItem
                key={attachment.id}
                attachment={attachment}
                uploaderEmail={attachment.userId ? userEmails[attachment.userId] : undefined}
                canEdit={canEdit}
                onEdit={() => {
                  setFormError(null);
                  setEditingId(attachment.id);
                }}
                onDelete={() => setAttachmentToDelete(attachment)}
              />
            )
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={!!attachmentToDelete}
        title={t("files.deleteModalTitle")}
        message={t("files.deleteConfirm", { title: attachmentToDelete?.title ?? "" })}
        loading={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setAttachmentToDelete(null)}
      />
    </div>
  );
}
