import { Pencil, Trash2 } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import type { Note, NoteImportance } from "@/lib/types";
import { formatDateTime } from "@/lib/formatDate";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./NotesPanel.module.scss";

const IMPORTANCE_VARIANT: Record<NoteImportance, "active" | "pending" | "inactive" | "danger"> = {
  Low: "inactive",
  Normal: "active",
  High: "danger",
};

interface NoteItemProps {
  note: Note;
  authorEmail?: string;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export default function NoteItem({ note, authorEmail, canEdit, onEdit, onDelete }: NoteItemProps) {
  const t = useTranslation();

  return (
    <div className={styles.note}>
      <div className={styles.noteHeader}>
        <div className={styles.noteHeaderMain}>
          <span className={styles.noteTitle}>{note.title}</span>
          <Badge variant={IMPORTANCE_VARIANT[note.importance]}>{t(`notes.importance.${note.importance}`)}</Badge>
        </div>
        {canEdit && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              className={sharedStyles.buttonIcon}
              title={t("notes.editTitle")}
              aria-label={t("notes.editTitle")}
              onClick={onEdit}
            >
              <Pencil size={14} />
            </Button>
            <Button
              variant="ghost"
              className={sharedStyles.buttonIcon}
              title={t("notes.deleteTitle")}
              aria-label={t("notes.deleteTitle")}
              onClick={onDelete}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        )}
      </div>
      <p className={styles.noteText}>{note.text}</p>
      <div className={styles.noteMeta}>
        <span>{authorEmail ?? "—"}</span>
        <span>{formatDateTime(note.createdAt)}</span>
      </div>
    </div>
  );
}
