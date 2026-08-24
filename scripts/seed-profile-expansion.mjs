/**
 * Demo data for the customer profile expansion: passport, Power of
 * Attorney, spouse/partner, and Israeli bank account. Uploads clearly-fake
 * placeholder files (not real documents) to the private "customer-documents"
 * Storage bucket. Safe to run once against the existing seeded customers.
 *
 * Usage: node scripts/seed-profile-expansion.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import WebSocket from "ws";

config({ path: ".env.local" });
globalThis.WebSocket ??= WebSocket;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET = "customer-documents";

// A minimal, clearly-fake PDF — just enough to be a valid application/pdf
// upload for demo purposes. Not a real document of any kind.
function fakePdf(label) {
  const text = `%PDF-1.4\n% Fake demo document: ${label}\n% This is placeholder content only, not a real document.\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Size 4/Root 1 0 R>>\n%%EOF`;
  return new Blob([text], { type: "application/pdf" });
}

async function getCustomerByEmail(email) {
  const { data, error } = await supabase.from("customers").select("id").eq("email", email).single();
  if (error) throw new Error(`customer ${email} not found: ${error.message}`);
  return data.id;
}

async function uploadDocument({ customerId, spouseId, documentType, label, fields }) {
  const path = `${customerId}/${documentType}/${crypto.randomUUID()}.pdf`;
  const blob = fakePdf(label);
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "application/pdf" });
  if (uploadError) throw new Error(`upload ${documentType} for ${customerId}: ${uploadError.message}`);

  const { error: insertError } = await supabase.from("customer_documents").insert({
    customer_id: customerId,
    spouse_id: spouseId ?? null,
    document_type: documentType,
    storage_path: path,
    original_filename: `${label.replace(/\s+/g, "_").toLowerCase()}.pdf`,
    mime_type: "application/pdf",
    file_size: blob.size,
    ...fields,
  });
  if (insertError) throw new Error(`insert document row for ${customerId}: ${insertError.message}`);
}

async function main() {
  console.log(`Seeding profile-expansion demo data against ${url} ...`);

  const currentYear = new Date().getFullYear();

  // ---- Cohen Investments Ltd. — full profile: passport, POA, spouse + spouse passport, bank account ----
  const cohenId = await getCustomerByEmail("client-a@ymv-crm.test");

  await uploadDocument({
    customerId: cohenId,
    documentType: "customer_passport",
    label: "Client passport",
    fields: {
      passport_number: "M12345678",
      passport_country: "Israel",
      document_date: `${currentYear - 5}-03-10`,
      expiry_date: `${currentYear + 3}-03-10`,
    },
  });

  await uploadDocument({
    customerId: cohenId,
    documentType: "power_of_attorney",
    label: "Power of attorney",
    fields: {
      document_date: `${currentYear}-01-15`,
      expiry_date: `${currentYear + 1}-01-15`,
      notes: "Grants the agency authority to sign rental agreements on the client's behalf.",
    },
  });

  const { data: cohenSpouse, error: cohenSpouseErr } = await supabase
    .from("customer_spouses")
    .insert({
      customer_id: cohenId,
      full_name: "Maya Cohen",
      phone_1: "+972-50-1119999",
      email: "maya.cohen@example.com",
      notes: "Joint signatory on the Rothschild Blvd property.",
    })
    .select("id")
    .single();
  if (cohenSpouseErr) throw new Error(`insert spouse for cohen: ${cohenSpouseErr.message}`);

  await uploadDocument({
    customerId: cohenId,
    spouseId: cohenSpouse.id,
    documentType: "spouse_passport",
    label: "Spouse passport",
    fields: {
      passport_number: "M87654321",
      passport_country: "Israel",
      document_date: `${currentYear - 4}-07-20`,
      expiry_date: `${currentYear + 4}-07-20`,
    },
  });

  const { error: cohenBankErr } = await supabase.from("customer_bank_accounts").insert({
    customer_id: cohenId,
    bank_name: "Bank Hapoalim",
    bank_number: "12",
    branch_name: "Tel Aviv Main",
    branch_number: "532",
    account_number: "123456",
    account_holder_name: "Cohen Investments Ltd.",
    account_holder_identifier: "M12345678",
    iban: "IL120001235000000123456",
    swift_bic: "POALILIT",
  });
  if (cohenBankErr) throw new Error(`insert bank account for cohen: ${cohenBankErr.message}`);

  console.log("Cohen Investments Ltd.: passport, POA, spouse + spouse passport, bank account.");

  // ---- Levi Family — passport only, expiring soon (to demo the badge) ----
  const leviId = await getCustomerByEmail("client-b@ymv-crm.test");

  const soon = new Date();
  soon.setDate(soon.getDate() + 45);
  const soonStr = soon.toISOString().slice(0, 10);

  await uploadDocument({
    customerId: leviId,
    documentType: "customer_passport",
    label: "Client passport",
    fields: {
      passport_number: "L55566677",
      passport_country: "Israel",
      document_date: `${currentYear - 9}-11-01`,
      expiry_date: soonStr,
    },
  });

  console.log("Levi Family: passport expiring soon (demonstrates the warning badge).");

  // ---- Eitan Shapira — bank account only ----
  const eitanId = await getCustomerByEmail("client-d@ymv-crm.test");

  const { error: eitanBankErr } = await supabase.from("customer_bank_accounts").insert({
    customer_id: eitanId,
    bank_name: "Bank Leumi",
    bank_number: "10",
    branch_number: "800",
    account_number: "987654",
    account_holder_name: "Eitan Shapira",
    iban: "IL620101080000000987654",
  });
  if (eitanBankErr) throw new Error(`insert bank account for eitan: ${eitanBankErr.message}`);

  console.log("Eitan Shapira: bank account only.");

  console.log("\nDone. All uploaded documents are clearly-fake placeholder PDFs.");
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
