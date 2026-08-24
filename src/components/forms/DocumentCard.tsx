"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { DocumentExpiryBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";
import { t } from "@/lib/i18n";
import {
  DOCUMENTS_BUCKET,
  buildStoragePath,
  getExpiryStatus,
  validateDocumentFile,
} from "@/lib/documents";
import type { CustomerDocument, DocumentType } from "@/lib/types/domain";

type Variant = "passport" | "power_of_attorney";

export function DocumentCard({
  customerId,
  spouseId,
  documentType,
  document,
  variant,
  title,
  editable,
}: {
  customerId: string;
  spouseId?: string;
  documentType: DocumentType;
  document: CustomerDocument | null;
  variant: Variant;
  title: string;
  editable: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [passportNumber, setPassportNumber] = useState(document?.passport_number ?? "");
  const [passportCountry, setPassportCountry] = useState(document?.passport_country ?? "");
  const [documentDate, setDocumentDate] = useState(document?.document_date ?? "");
  const [expiryDate, setExpiryDate] = useState(document?.expiry_date ?? "");
  const [notes, setNotes] = useState(document?.notes ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = getExpiryStatus(document?.expiry_date, !!document);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    const validationError = validateDocumentFile(file);
    if (validationError) {
      setError(t.documents[validationError as "fileTooLarge" | "fileTypeNotAllowed"]);
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const path = buildStoragePath(customerId, documentType, file.type);

    const { error: uploadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const payload = {
      customer_id: customerId,
      spouse_id: spouseId ?? null,
      document_type: documentType,
      storage_path: path,
      original_filename: file.name,
      mime_type: file.type,
      file_size: file.size,
      document_date: documentDate || null,
      expiry_date: expiryDate || null,
      passport_number: variant === "passport" ? passportNumber || null : null,
      passport_country: variant === "passport" ? passportCountry || null : null,
      notes: notes || null,
    };

    // Replacing: remove the old row (and its file) first — a singleton
    // unique index means the old row must go before the new one can exist.
    if (document) {
      await supabase.storage.from(DOCUMENTS_BUCKET).remove([document.storage_path]);
      await supabase.from("customer_documents").delete().eq("id", document.id);
    }

    const { error: insertError } = await supabase.from("customer_documents").insert(payload);

    setUploading(false);

    if (insertError) {
      // Roll back the just-uploaded file so it doesn't become an orphan.
      await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
      setError(insertError.message);
      return;
    }

    setShowForm(false);
    router.refresh();
  }

  async function handleView(download: boolean) {
    if (!document) return;
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(
        document.storage_path,
        60,
        download ? { download: document.original_filename } : undefined
      );
    if (error || !data) {
      window.alert(error?.message ?? "Could not generate a link for this file.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function handleDelete() {
    if (!document) return;
    if (!window.confirm(t.documents.confirmDelete)) return;
    const supabase = createClient();
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([document.storage_path]);
    const { error } = await supabase.from("customer_documents").delete().eq("id", document.id);
    if (error) {
      window.alert(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-md border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        <DocumentExpiryBadge status={status} />
      </div>

      {document && !showForm && (
        <dl className="mt-3 space-y-1.5 text-sm">
          {variant === "passport" && (
            <>
              <Row label={t.documents.passportNumber} value={document.passport_number || "—"} />
              <Row label={t.documents.passportCountry} value={document.passport_country || "—"} />
              <Row label={t.documents.passportIssueDate} value={formatDate(document.document_date)} />
              <Row label={t.documents.passportExpiryDate} value={formatDate(document.expiry_date)} />
            </>
          )}
          {variant === "power_of_attorney" && (
            <>
              <Row label={t.documents.poaDate} value={formatDate(document.document_date)} />
              <Row label={t.documents.poaExpiryDate} value={formatDate(document.expiry_date)} />
              {document.notes && <Row label={t.documents.notes} value={document.notes} />}
            </>
          )}
          <Row label={t.documents.file} value={document.original_filename} />
          <Row label={t.documents.uploadDate} value={formatDate(document.created_at)} />
        </dl>
      )}

      {!document && !showForm && (
        <p className="mt-3 text-sm text-slate-400">{t.documents.noFile}</p>
      )}

      {editable && showForm && (
        <div className="mt-3 space-y-3">
          {variant === "passport" && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                id={`${documentType}-number`}
                label={t.documents.passportNumber}
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
              />
              <Input
                id={`${documentType}-country`}
                label={t.documents.passportCountry}
                value={passportCountry}
                onChange={(e) => setPassportCountry(e.target.value)}
              />
              <Input
                id={`${documentType}-issue`}
                type="date"
                label={t.documents.passportIssueDate}
                optional
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
              />
              <Input
                id={`${documentType}-expiry`}
                type="date"
                label={t.documents.passportExpiryDate}
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          )}
          {variant === "power_of_attorney" && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="poa-date"
                type="date"
                label={t.documents.poaDate}
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
              />
              <Input
                id="poa-expiry"
                type="date"
                label={t.documents.poaExpiryDate}
                optional
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
              <Textarea
                id="poa-notes"
                label={t.documents.notes}
                optional
                rows={2}
                className="col-span-2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              className="hidden"
              onChange={handleFileSelected}
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? t.documents.uploading : t.documents.chooseFile}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="ml-2"
              onClick={() => setShowForm(false)}
              disabled={uploading}
            >
              {t.common.cancel}
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {!showForm && (
        <div className="mt-3 flex flex-wrap gap-2">
          {document && (
            <>
              <Button type="button" variant="secondary" onClick={() => handleView(false)}>
                {t.documents.view}
              </Button>
              <Button type="button" variant="secondary" onClick={() => handleView(true)}>
                {t.documents.download}
              </Button>
            </>
          )}
          {editable && (
            <>
              <Button type="button" variant="secondary" onClick={() => setShowForm(true)}>
                {document ? t.documents.replace : t.documents.upload}
              </Button>
              {document && (
                <Button type="button" variant="danger" onClick={handleDelete}>
                  {t.documents.delete}
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}
