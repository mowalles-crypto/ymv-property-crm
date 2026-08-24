import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { DeleteButton } from "@/components/forms/DeleteButton";
import { OfferForm } from "@/components/forms/OfferForm";
import { OfferMediaManager } from "@/components/forms/OfferMediaManager";
import { formatDate } from "@/lib/format";
import { t } from "@/lib/i18n";

const OFFERS_BUCKET = "investment-offers";

export default async function AdminOfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: offer }, { data: documents }, { data: inquiries }, { data: customers }] = await Promise.all([
    supabase.from("investment_offers").select("*").eq("id", id).single(),
    supabase.from("investment_offer_documents").select("*").eq("investment_offer_id", id).order("sort_order"),
    supabase.from("investment_inquiries").select("*").eq("investment_offer_id", id).order("created_at", { ascending: false }),
    supabase.from("customers").select("id, customer_name"),
  ]);

  if (!offer) notFound();

  const customerNameById = new Map((customers ?? []).map((c) => [c.id, c.customer_name]));

  const images = (documents ?? []).filter((d) => d.document_type === "image");
  const signedUrlEntries = await Promise.all(
    images.map(async (img) => {
      const { data } = await supabase.storage.from(OFFERS_BUCKET).createSignedUrl(img.storage_path, 300);
      return [img.id, data?.signedUrl] as const;
    })
  );
  const imageUrls = Object.fromEntries(signedUrlEntries);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{offer.address_or_project_name}</h2>
        <DeleteButton
          table="investment_offers"
          id={id}
          redirectTo="/admin/offers"
          confirmMessage={`Delete offer "${offer.address_or_project_name}"? This also deletes its documents and inquiries.`}
        />
      </div>

      <Card title={t.offersAdmin.editOffer}>
        <OfferForm offer={offer} />
      </Card>

      <Card title={`${t.offersAdmin.images} & ${t.offersAdmin.documents}`}>
        <OfferMediaManager offerId={id} documents={documents ?? []} imageUrls={imageUrls} />
      </Card>

      <Card title={t.offersAdmin.inquiries}>
        {inquiries && inquiries.length > 0 ? (
          <ul className="divide-y divide-slate-100 text-sm">
            {inquiries.map((inq) => (
              <li key={inq.id} className="flex items-center justify-between py-2">
                <span>{customerNameById.get(inq.customer_id) ?? "—"}</span>
                <span className="text-slate-400">{formatDate(inq.created_at)}</span>
                <span className="text-xs font-medium text-gold-dark">
                  {t.inquiryStatusOptions[inq.status]}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">{t.offersAdmin.noInquiries}</p>
        )}
      </Card>
    </div>
  );
}
