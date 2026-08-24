"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Select, Input } from "@/components/ui/Field";
import { t } from "@/lib/i18n";
import type { InvestmentOfferDocument, OfferDocumentType } from "@/lib/types/domain";

const OFFERS_BUCKET = "investment-offers";
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

const docTypeKeys: OfferDocumentType[] = [
  "image",
  "floor_plan",
  "brochure",
  "permit",
  "planning_approval",
  "zoning",
  "specification",
  "other",
];

function extFor(mime: string) {
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "bin";
}

export function OfferMediaManager({
  offerId,
  documents,
  imageUrls,
}: {
  offerId: string;
  documents: InvestmentOfferDocument[];
  imageUrls: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<OfferDocumentType>("image");
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(t.documents.fileTypeNotAllowed);
      return;
    }
    if (file.size > MAX_SIZE) {
      setError(t.documents.fileTooLarge);
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const path = `${offerId}/${docType}/${crypto.randomUUID()}.${extFor(file.type)}`;

    const { error: uploadError } = await supabase.storage.from(OFFERS_BUCKET).upload(path, file, {
      contentType: file.type,
    });
    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const { error: insertError } = await supabase.from("investment_offer_documents").insert({
      investment_offer_id: offerId,
      document_type: docType,
      storage_path: path,
      original_filename: file.name,
      mime_type: file.type,
      file_size: file.size,
      title: title || null,
      sort_order: documents.length,
    });

    setUploading(false);
    if (insertError) {
      await supabase.storage.from(OFFERS_BUCKET).remove([path]);
      setError(insertError.message);
      return;
    }
    setTitle("");
    router.refresh();
  }

  async function handleDelete(doc: InvestmentOfferDocument) {
    if (!window.confirm(t.documents.confirmDelete)) return;
    const supabase = createClient();
    await supabase.storage.from(OFFERS_BUCKET).remove([doc.storage_path]);
    const { error } = await supabase.from("investment_offer_documents").delete().eq("id", doc.id);
    if (error) {
      window.alert(error.message);
      return;
    }
    router.refresh();
  }

  const images = documents.filter((d) => d.document_type === "image");
  const otherDocs = documents.filter((d) => d.document_type !== "image");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <Select
          id="doc_type"
          label="File type"
          value={docType}
          onChange={(e) => setDocType(e.target.value as OfferDocumentType)}
        >
          {docTypeKeys.map((k) => (
            <option key={k} value={k}>
              {k.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
        <Input id="doc_title" label="Title" optional value={title} onChange={(e) => setTitle(e.target.value)} />
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          className="hidden"
          onChange={handleUpload}
        />
        <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? t.documents.uploading : t.documents.chooseFile}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {images.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-slate-700">{t.offersAdmin.images}</h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((img) => (
              <div key={img.id} className="relative overflow-hidden rounded-lg border border-slate-200">
                {imageUrls[img.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrls[img.id]} alt={img.title ?? ""} className="aspect-video w-full object-cover" />
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-slate-100 text-xs text-slate-400">
                    No preview
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(img)}
                  className="absolute right-1 top-1 rounded bg-white/90 px-2 py-0.5 text-xs font-medium text-red-600 shadow"
                >
                  {t.common.delete}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {otherDocs.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-slate-700">{t.offersAdmin.documents}</h4>
          <ul className="space-y-2 text-sm">
            {otherDocs.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                <span>
                  {doc.title ?? doc.original_filename}{" "}
                  <span className="text-xs text-slate-400">({doc.document_type.replace(/_/g, " ")})</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(doc)}
                  className="text-xs font-medium text-red-600 hover:text-red-700"
                >
                  {t.common.delete}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
