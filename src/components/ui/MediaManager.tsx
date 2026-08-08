"use client";

import { useCallback, useRef, useState } from "react";
import type { DragEvent } from "react";
import { GripVertical, Trash2, UploadCloud } from "lucide-react";
import type { PropertyImage } from "@/lib/types";
import { useTranslation } from "@/store/hooks";
import Button from "./Button";
import styles from "./MediaManager.module.scss";

interface MediaManagerProps {
  images: PropertyImage[];
  uploading?: boolean;
  onFilesSelected: (files: File[]) => void;
  onImageChange: (id: string, patch: Partial<Pick<PropertyImage, "alt" | "description">>) => void;
  onRemove: (id: string) => void;
  onReorder: (images: PropertyImage[]) => void;
}

// Generic drag-and-drop upload dropzone + editable, reorderable image gallery — reused as-is by
// PropertyMediaPage and LandMediaPage (the two entities' images share the exact same shape and
// upload flow, only the save endpoint differs, which those pages own, not this component). Two
// separate drag-and-drop interactions live here: dropping files onto the dropzone uploads them,
// dragging a gallery card onto another reorders the array — native HTML5 DnD for both, no extra
// dependency.
export default function MediaManager({ images, uploading, onFilesSelected, onImageChange, onRemove, onReorder }: MediaManagerProps) {
  const t = useTranslation();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
      if (files.length > 0) onFilesSelected(files);
    },
    [onFilesSelected]
  );

  const handleCardDragStart = (id: string) => (event: DragEvent) => {
    // Firefox (and some Chrome versions) won't complete a custom drag sequence unless dragstart
    // calls setData — without this, dragover/drop on other cards silently never fire.
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
    setDraggedId(id);
  };

  const handleCardDragOver = (id: string) => (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (draggedId && draggedId !== id) setDragOverId(id);
  };

  const handleCardDrop = (targetId: string) => (event: DragEvent) => {
    event.preventDefault();
    setDragOverId(null);
    if (!draggedId || draggedId === targetId) return;
    const fromIndex = images.findIndex((image) => image.id === draggedId);
    const toIndex = images.findIndex((image) => image.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const reordered = [...images];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    onReorder(reordered);
    setDraggedId(null);
  };

  const handleCardDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.dropzone} ${isDraggingOver ? styles.dropzoneActive : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={(event) => {
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
        <UploadCloud size={28} />
        <p>{t("media.dropzoneHint")}</p>
        {uploading && <p className={styles.uploadingHint}>{t("media.uploading")}</p>}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className={styles.hiddenInput}
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {images.length === 0 ? (
        <p className="text-xs text-neutral-400">{t("media.empty")}</p>
      ) : (
        <div className={styles.grid}>
          {images.map((image) => (
            <div
              key={image.id}
              className={[
                styles.card,
                draggedId === image.id ? styles.cardDragging : "",
                dragOverId === image.id ? styles.cardDragOver : "",
              ].join(" ")}
              draggable
              onDragStart={handleCardDragStart(image.id)}
              onDragOver={handleCardDragOver(image.id)}
              onDrop={handleCardDrop(image.id)}
              onDragEnd={handleCardDragEnd}
            >
              <div className={styles.cardHandle} title={t("media.dragHandle")}>
                <GripVertical size={14} />
                <span>{t("media.dragHandle")}</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element -- same-origin /uploads URL, no benefit from next/image here */}
              <img src={image.url} alt={image.alt || ""} className={styles.thumb} draggable={false} />
              <input
                className={styles.metaInput}
                placeholder={t("media.altPlaceholder")}
                value={image.alt}
                onChange={(event) => onImageChange(image.id, { alt: event.target.value })}
              />
              <input
                className={styles.metaInput}
                placeholder={t("media.descriptionPlaceholder")}
                value={image.description}
                onChange={(event) => onImageChange(image.id, { description: event.target.value })}
              />
              <Button type="button" variant="ghost" className={styles.removeButton} onClick={() => onRemove(image.id)}>
                <Trash2 size={14} />
                {t("media.remove")}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
