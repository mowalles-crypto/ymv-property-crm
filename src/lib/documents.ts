import type { DocumentType } from "@/lib/types/domain";

export const DOCUMENTS_BUCKET = "customer-documents";

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export const MAX_DOCUMENT_FILE_SIZE = 10 * 1024 * 1024; // 10 MB, matches the bucket's file_size_limit

export const EXPIRING_SOON_THRESHOLD_DAYS = 90;

export type ExpiryStatus = "valid" | "expiring_soon" | "expired" | "missing" | "no_expiry";

export function getExpiryStatus(
  expiryDate: string | null | undefined,
  hasDocument: boolean,
  thresholdDays: number = EXPIRING_SOON_THRESHOLD_DAYS
): ExpiryStatus {
  if (!hasDocument) return "missing";
  if (!expiryDate) return "no_expiry";

  const daysUntilExpiry = Math.floor(
    (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry < 0) return "expired";
  if (daysUntilExpiry <= thresholdDays) return "expiring_soon";
  return "valid";
}

export function validateDocumentFile(file: File): string | null {
  if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(file.type as (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number])) {
    return "fileTypeNotAllowed";
  }
  if (file.size > MAX_DOCUMENT_FILE_SIZE) {
    return "fileTooLarge";
  }
  return null;
}

function extensionFor(mimeType: string): string {
  switch (mimeType) {
    case "application/pdf":
      return "pdf";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    default:
      return "bin";
  }
}

/**
 * {customer_id}/{document_type}/{uuid}.{ext} — the leading segment is what
 * the storage RLS policies check against the caller's own customer_id.
 */
export function buildStoragePath(
  customerId: string,
  documentType: DocumentType,
  mimeType: string
): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${customerId}/${documentType}/${id}.${extensionFor(mimeType)}`;
}
