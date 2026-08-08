import { File, FileArchive, FileSpreadsheet, FileText, Presentation, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { useTranslation } from "@/store/hooks";
import type { Attachment } from "@/lib/types";
import { formatDateTime } from "@/lib/formatDate";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./FilesPanel.module.scss";

// Renders the icon directly (rather than returning a component reference to invoke as `<Icon />`)
// so this stays a plain function call in JSX, not a "component created during render". Only
// reached for non-image types — images get a real thumbnail instead, see FileItem below.
function renderFileIcon(mimeType: string) {
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return <FileSpreadsheet size={32} className={styles.fileIcon} />;
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return <Presentation size={32} className={styles.fileIcon} />;
  if (mimeType.includes("zip")) return <FileArchive size={32} className={styles.fileIcon} />;
  if (mimeType === "application/pdf" || mimeType.includes("word") || mimeType.startsWith("text/")) {
    return <FileText size={32} className={styles.fileIcon} />;
  }
  return <File size={32} className={styles.fileIcon} />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileItemProps {
  attachment: Attachment;
  uploaderEmail?: string;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export default function FileItem({ attachment, uploaderEmail, canEdit, onEdit, onDelete }: FileItemProps) {
  const t = useTranslation();
  const isImage = attachment.mimeType.startsWith("image/");

  return (
    <div className={styles.fileCard} title={uploaderEmail}>
      <a href={attachment.url} target="_blank" rel="noopener noreferrer" className={styles.filePreview}>
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- same-origin /uploads URL, no benefit from next/image here
          <img src={attachment.url} alt={attachment.title} className={styles.previewImage} />
        ) : (
          renderFileIcon(attachment.mimeType)
        )}
      </a>

      <div className={styles.fileCardBody}>
        <a href={attachment.url} target="_blank" rel="noopener noreferrer" className={styles.fileTitle}>
          {attachment.title}
        </a>
        <span className={styles.fileMeta}>{formatFileSize(attachment.size)} · {formatDateTime(attachment.createdAt)}</span>
      </div>

      {canEdit && (
        <div className={styles.fileCardActions}>
          <Button
            variant="ghost"
            className={sharedStyles.buttonIcon}
            title={t("files.editTitle")}
            aria-label={t("files.editTitle")}
            onClick={onEdit}
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            className={sharedStyles.buttonIcon}
            title={t("files.deleteTitle")}
            aria-label={t("files.deleteTitle")}
            onClick={onDelete}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}
