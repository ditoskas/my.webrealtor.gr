import type { IMediaImage } from "@/models/MediaImage";

// Shared by PUT /api/properties/[id]/images and PUT /api/lands/[id]/images — the dedicated media
// page always sends the listing's *entire* desired images array (add/edit/remove/reorder all
// collapse to one PUT), so this validates the whole array strictly rather than the
// silently-drop-malformed-entries approach parsePropertyBody's toImages() uses for the main form.
export interface ParsedImagesBody {
  errors: string[];
  images: IMediaImage[];
}

export function parseImagesBody(value: unknown): ParsedImagesBody {
  if (!Array.isArray(value)) {
    return { errors: ["images must be an array"], images: [] };
  }

  const errors: string[] = [];
  const images: IMediaImage[] = [];

  value.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      errors.push(`images[${index}] must be an object`);
      return;
    }
    const { id, url, alt, description } = item as Record<string, unknown>;
    if (typeof id !== "string" || !id) {
      errors.push(`images[${index}] is missing an id`);
      return;
    }
    if (typeof url !== "string" || !url) {
      errors.push(`images[${index}] is missing a url`);
      return;
    }
    images.push({
      id,
      url,
      alt: typeof alt === "string" ? alt : "",
      description: typeof description === "string" ? description : "",
    });
  });

  return { errors, images };
}
