/**
 * Demo data for the task-driven investment platform: acquisition-cost and
 * capital-gains-tax rule frameworks (clearly marked as demo/placeholder —
 * see README), property_tax_basis, a property_transactions backfill that
 * mirrors the existing property_accounting demo data (so reports agree with
 * what the Admin sees in the monthly view), investment offers with fake
 * placeholder images/documents, a sample inquiry, and a sample sale
 * request. Run after scripts/seed.mjs and scripts/seed-profile-expansion.mjs.
 *
 * Usage: node scripts/seed-investment-platform.mjs
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

const OFFERS_BUCKET = "investment-offers";
const currentYear = new Date().getFullYear();

function fakeImage(label) {
  // A minimal 1x1 PNG — a clearly-fake placeholder, not a real photo.
  const base64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
  return { blob: Buffer.from(base64, "base64"), label };
}

function fakePdf(label) {
  const text = `%PDF-1.4\n% Fake demo document: ${label}\n% Placeholder content only.\ntrailer<</Size 1/Root 1 0 R>>\n%%EOF`;
  return Buffer.from(text, "utf8");
}

async function getCustomerId(email) {
  const { data, error } = await supabase.from("customers").select("id").eq("email", email).single();
  if (error) throw new Error(`customer ${email}: ${error.message}`);
  return data.id;
}

async function getPropertyId(address) {
  const { data, error } = await supabase.from("properties").select("id").eq("property_address", address).single();
  if (error) throw new Error(`property ${address}: ${error.message}`);
  return data.id;
}

async function main() {
  console.log(`Seeding investment platform demo data against ${url} ...`);

  // =========================================================================
  // 1. Acquisition cost rules — lawyer/brokerage are safe, cited market
  //    conventions. Purchase tax is deliberately left unconfigured (see
  //    README) rather than guessing at Israel Tax Authority brackets.
  // =========================================================================
  await supabase.from("acquisition_cost_rules").insert([
    {
      cost_type: "lawyer_fee",
      calculation_type: "percentage",
      percentage_rate: 0.01,
      minimum_amount: 5000,
      effective_from: "2020-01-01",
      source: "Market convention (typically 0.5%-1.5% of price) — not a statutory rate.",
      notes: "Illustrative default; confirm actual fee with the client's lawyer.",
      active: true,
    },
    {
      cost_type: "brokerage_fee",
      calculation_type: "percentage",
      percentage_rate: 0.02,
      effective_from: "2020-01-01",
      source: "Market convention (commonly ~2% + VAT) — not a statutory rate.",
      notes: "Illustrative default; actual brokerage fees vary by agreement.",
      active: true,
    },
    {
      cost_type: "purchase_tax",
      calculation_type: "custom",
      effective_from: "2020-01-01",
      source: null,
      notes:
        "PLACEHOLDER — Israeli purchase tax (Mas Rechisha) depends on bracket thresholds that change periodically and on buyer-specific facts (first home vs. additional property, etc.). Not implemented with real figures to avoid presenting an inaccurate number as fact. An admin must configure real, current brackets (calculation_type 'tiered', with a verified source and effective date) before this is shown to clients as anything other than 'Not yet configured'.",
      active: true,
    },
  ]);
  console.log("Seeded acquisition_cost_rules (lawyer_fee, brokerage_fee configured; purchase_tax left unconfigured by design).");

  // =========================================================================
  // 2. Capital gains tax rule — a single flat-rate demo version, grounded in
  //    a real cited headline rate but explicitly NOT modeling indexation,
  //    exemptions, or the high-earner surcharge. See README for sources.
  // =========================================================================
  await supabase.from("capital_gains_tax_rules").insert({
    rule_version: "demo-2026-flat-25",
    effective_from: "2026-01-01",
    tax_rate: 0.25,
    calculation_notes:
      "DEMO RULE — flat 25% on nominal gain (sale price minus cost basis). Does NOT apply inflation indexation, the sole-home exemption (~18mo holding + price cap), the high-earner 3% surcharge, or any other exemption. Real estimates require a verified, versioned rule reflecting current law and the client's specific circumstances.",
    parameters: { flat_rate: true, indexation_applied: false, exemptions_modeled: false },
    source:
      "Headline rate corroborated via web search (Aug 2026): globallawexperts.com/israel-real-estate-taxes-2026, givatilaw.co.il/understanding-capital-gains-tax-in-israel — not a substitute for professional/Tax Authority confirmation.",
    active: true,
  });
  console.log("Seeded capital_gains_tax_rules (one demo flat-rate version, clearly marked as incomplete).");

  // =========================================================================
  // 3. property_tax_basis for a couple of existing demo properties.
  // =========================================================================
  const cohenRentedId = await getPropertyId("12 Rothschild Blvd, Tel Aviv");
  const leviSoldId = await getPropertyId("8 Herzl St, Herzliya");

  await supabase.from("property_tax_basis").insert([
    {
      property_id: cohenRentedId,
      purchase_tax_paid: 122500,
      purchase_brokerage_fee: 49000,
      purchase_legal_fee: 24500,
      recognized_improvement_costs: 35000,
      notes: "Kitchen renovation recognized as capital improvement.",
    },
    {
      property_id: leviSoldId,
      purchase_tax_paid: 87500,
      purchase_brokerage_fee: 35000,
      purchase_legal_fee: 17500,
      sale_brokerage_fee: 46000,
      sale_legal_fee: 23000,
    },
  ]);
  console.log("Seeded property_tax_basis for 2 properties.");

  // =========================================================================
  // 4. property_transactions backfill — mirrors the existing
  //    property_accounting demo rows so reports agree with the monthly view.
  // =========================================================================
  const { data: accountingRows } = await supabase
    .from("property_accounting")
    .select("*")
    .in("property_id", [cohenRentedId, leviSoldId]);

  const txRows = [];
  for (const row of accountingRows ?? []) {
    const dateStr = `${row.year}-${String(row.month).padStart(2, "0")}-01`;
    if (Number(row.rent_received) > 0) {
      txRows.push({
        property_id: row.property_id,
        transaction_date: dateStr,
        transaction_type: "income",
        category: "rent",
        amount: row.rent_received,
        description: "Monthly rent",
        source: "Backfilled from property_accounting",
      });
    }
    const expenseFields = [
      [row.expense_1, row.expense_1_description],
      [row.expense_2, row.expense_2_description],
      [row.expense_3, row.expense_3_description],
      [row.expense_4, row.expense_4_description],
      [row.expense_5, row.expense_5_description],
    ];
    for (const [amount, description] of expenseFields) {
      if (Number(amount) > 0) {
        const desc = (description || "").toLowerCase();
        const category = desc.includes("maintenance")
          ? "maintenance"
          : desc.includes("management")
            ? "management_fee"
            : desc.includes("insurance")
              ? "insurance"
              : "other";
        txRows.push({
          property_id: row.property_id,
          transaction_date: dateStr,
          transaction_type: "expense",
          category,
          amount,
          description: description || null,
          source: "Backfilled from property_accounting",
        });
      }
    }
  }
  if (txRows.length > 0) {
    const { error } = await supabase.from("property_transactions").insert(txRows);
    if (error) throw new Error(`insert transactions: ${error.message}`);
  }
  console.log(`Backfilled ${txRows.length} property_transactions rows from existing accounting data.`);

  // =========================================================================
  // 5. Investment offers with fake placeholder images/documents.
  // =========================================================================
  const offers = [
    {
      address_or_project_name: "Sky Gardens — Building C, Unit 12",
      city: "Tel Aviv",
      location: "Center / Rothschild area",
      property_type: "apartment",
      property_purpose: "investment",
      rooms: 4,
      property_size: 95,
      property_price: 3200000,
      expected_monthly_rent: 10500,
      expected_annual_income: 126000,
      estimated_annual_expenses: 18000,
      expected_gross_yield: 3.9,
      expected_net_yield: 3.4,
      construction_status: "under_construction",
      expected_delivery_date: `${currentYear + 2}-06-01`,
      minimum_equity_required: 1600000,
      financing_available: true,
      economic_analysis:
        "New-build in a high-demand central Tel Aviv micro-location. Rental comps in the immediate area support the projected rent; yield reflects a conservative expense assumption.",
      short_description: "Brand-new 4-room apartment, central Tel Aviv, delivery in 2 years.",
      status: "active",
      featured: true,
    },
    {
      address_or_project_name: "Herzliya Marina Residence 8B",
      city: "Herzliya",
      location: "Marina / Pituach",
      property_type: "penthouse",
      property_purpose: "investment_with_future_residence",
      rooms: 5,
      property_size: 140,
      property_price: 5400000,
      expected_monthly_rent: 15000,
      expected_annual_income: 180000,
      estimated_annual_expenses: 30000,
      expected_gross_yield: 3.3,
      expected_net_yield: 2.8,
      construction_status: "second_hand",
      minimum_equity_required: 2700000,
      financing_available: true,
      economic_analysis:
        "Premium penthouse near the marina; lower yield reflects the premium capital appreciation profile typical of this location rather than pure income.",
      short_description: "Premium penthouse near Herzliya Marina — investment with future residence potential.",
      status: "active",
      featured: false,
    },
    {
      address_or_project_name: "Ramat Gan Diamond Exchange — Office 305",
      city: "Ramat Gan",
      location: "Diamond Exchange district",
      property_type: "office",
      property_purpose: "investment",
      property_size: 60,
      property_price: 1450000,
      expected_monthly_rent: 6500,
      expected_annual_income: 78000,
      estimated_annual_expenses: 9000,
      expected_gross_yield: 5.4,
      expected_net_yield: 4.8,
      construction_status: "second_hand",
      minimum_equity_required: 600000,
      financing_available: true,
      economic_analysis: "Small office suite in an established business district with stable commercial demand.",
      short_description: "60 sqm office suite, strong commercial yield.",
      status: "active",
      featured: false,
    },
    {
      address_or_project_name: "Netanya Seaside Towers — Unit 22",
      city: "Netanya",
      location: "Seaside promenade",
      property_type: "apartment",
      property_purpose: "personal_residence",
      rooms: 3,
      property_size: 72,
      property_price: 1650000,
      expected_monthly_rent: 5200,
      expected_annual_income: 62400,
      estimated_annual_expenses: 8500,
      expected_gross_yield: 3.8,
      expected_net_yield: 3.3,
      construction_status: "new_from_developer",
      expected_delivery_date: `${currentYear + 1}-09-01`,
      minimum_equity_required: 500000,
      financing_available: true,
      economic_analysis: "New seaside development suited to personal use with strong secondary rental demand.",
      short_description: "3-room seaside apartment, new development.",
      status: "draft",
      featured: false,
    },
    {
      address_or_project_name: "Jerusalem German Colony — Renovated Garden Unit",
      city: "Jerusalem",
      location: "German Colony",
      property_type: "garden_apartment",
      property_purpose: "investment",
      rooms: 4,
      property_size: 88,
      property_price: 2900000,
      expected_monthly_rent: 8500,
      expected_annual_income: 102000,
      estimated_annual_expenses: 14000,
      expected_gross_yield: 3.5,
      expected_net_yield: 3.0,
      construction_status: "second_hand",
      minimum_equity_required: 1450000,
      financing_available: false,
      economic_analysis: "Fully renovated garden unit in a sought-after historic neighborhood. Recently sold to a BIZRAEL client.",
      short_description: "Renovated garden apartment, German Colony.",
      status: "sold",
      featured: false,
    },
  ];

  const offerIds = [];
  for (const offer of offers) {
    const { data, error } = await supabase.from("investment_offers").insert(offer).select("id").single();
    if (error) throw new Error(`insert offer ${offer.address_or_project_name}: ${error.message}`);
    offerIds.push(data.id);
  }
  console.log(`Seeded ${offerIds.length} investment offers.`);

  // Upload one fake image + one fake brochure per offer.
  for (const offerId of offerIds) {
    const { blob: imgBlob } = fakeImage("offer photo");
    const imgPath = `${offerId}/image/${crypto.randomUUID()}.png`;
    await supabase.storage.from(OFFERS_BUCKET).upload(imgPath, imgBlob, { contentType: "image/png" });
    await supabase.from("investment_offer_documents").insert({
      investment_offer_id: offerId,
      document_type: "image",
      storage_path: imgPath,
      original_filename: "photo.png",
      mime_type: "image/png",
      file_size: imgBlob.length,
      title: "Exterior photo",
      sort_order: 0,
    });

    const pdfBlob = fakePdf("brochure");
    const pdfPath = `${offerId}/brochure/${crypto.randomUUID()}.pdf`;
    await supabase.storage.from(OFFERS_BUCKET).upload(pdfPath, pdfBlob, { contentType: "application/pdf" });
    await supabase.from("investment_offer_documents").insert({
      investment_offer_id: offerId,
      document_type: "brochure",
      storage_path: pdfPath,
      original_filename: "brochure.pdf",
      mime_type: "application/pdf",
      file_size: pdfBlob.length,
      title: "Project brochure",
      sort_order: 1,
    });
  }
  console.log("Uploaded fake placeholder images/brochures for each offer.");

  // =========================================================================
  // 6. Sample inquiry + sale request.
  // =========================================================================
  const cohenId = await getCustomerId("client-a@ymv-crm.test");
  await supabase.from("investment_inquiries").insert({
    customer_id: cohenId,
    investment_offer_id: offerIds[0],
    status: "new",
    notes: "Client asked about financing terms.",
  });
  console.log("Seeded 1 sample investment inquiry.");

  const { error: saleReqError } = await supabase.from("property_sale_requests").insert({
    customer_id: cohenId,
    property_id: cohenRentedId,
    requested_sale_price: 2900000,
    minimum_acceptable_price: 2700000,
    payment_terms: "20% on signing, balance on possession",
    desired_sale_date: `${currentYear}-12-31`,
    notes: "Open to a slightly lower price for a fast, clean transaction.",
    admin_notes: "Tenant lease ends in 3 months — good timing for vacant possession sale. Client is motivated.",
    status: "under_review",
  });
  if (saleReqError) throw new Error(`insert sale request: ${saleReqError.message}`);
  console.log("Seeded 1 sample sale request (with internal admin_notes, not visible to the client).");

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
