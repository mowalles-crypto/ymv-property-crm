/**
 * Adds a second wave of demo data on top of what scripts/seed.mjs already
 * created — more customers, properties, accounting, and requirements —
 * without touching or duplicating existing records. Safe to run once;
 * re-running will fail on the unique customer emails (by design, same as
 * seed.mjs).
 *
 * Usage: node scripts/seed-more.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
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

function randomPassword() {
  return randomBytes(9).toString("base64url");
}

const currentYear = new Date().getFullYear();
const credentials = [];

async function createAuthUser(email, fullName) {
  const password = randomPassword();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw new Error(`createUser(${email}): ${error.message}`);
  credentials.push({ email, password });
  return data.user.id;
}

async function waitForProfile(userId) {
  for (let i = 0; i < 10; i++) {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (data) return;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Profile was not created for user ${userId}`);
}

async function insertCustomer(fields) {
  const { data, error } = await supabase
    .from("customers")
    .insert(fields)
    .select("id")
    .single();
  if (error) throw new Error(`insert customer ${fields.customer_name}: ${error.message}`);
  return data.id;
}

async function linkProfileToCustomer(userId, customerId) {
  const { error } = await supabase
    .from("profiles")
    .update({ customer_id: customerId, role: "client" })
    .eq("user_id", userId);
  if (error) throw new Error(`link profile ${userId} -> ${customerId}: ${error.message}`);
}

async function insertProperty(fields) {
  const { data, error } = await supabase
    .from("properties")
    .insert(fields)
    .select("id")
    .single();
  if (error) throw new Error(`insert property ${fields.property_address}: ${error.message}`);
  return data.id;
}

async function insertRequirements(fields) {
  const { error } = await supabase.from("property_requirements").insert(fields);
  if (error) throw new Error(`insert requirements for ${fields.customer_id}: ${error.message}`);
}

async function seedYearOfAccounting(propertyId, baseRent, baseExpense) {
  const rows = Array.from({ length: 12 }, (_, i) => {
    const hasMaintenance = i % 4 === 0;
    const hasInsurance = i % 6 === 0;
    return {
      property_id: propertyId,
      year: currentYear,
      month: i + 1,
      rent_received: baseRent,
      expense_1: baseExpense,
      expense_1_description: baseExpense > 0 ? "Property management fee" : null,
      expense_2: hasMaintenance ? 250 : 0,
      expense_2_description: hasMaintenance ? "Building maintenance fee" : null,
      expense_3: hasInsurance ? 90 : 0,
      expense_3_description: hasInsurance ? "Insurance premium" : null,
      expense_4: 0,
      expense_4_description: null,
      expense_5: 0,
      expense_5_description: null,
    };
  });
  const { error } = await supabase.from("property_accounting").insert(rows);
  if (error) throw new Error(`insert accounting for ${propertyId}: ${error.message}`);
}

async function main() {
  console.log(`Adding more demo data to ${url} ...`);

  // ---- Customers ----
  const eitanUserId = await createAuthUser("client-d@ymv-crm.test", "Eitan Shapira");
  await waitForProfile(eitanUserId);
  const eitanId = await insertCustomer({
    customer_name: "Eitan Shapira",
    phone_1: "+972-52-1112222",
    phone_2: null,
    email: "client-d@ymv-crm.test",
    customer_status: "active",
  });
  await linkProfileToCustomer(eitanUserId, eitanId);

  const noaUserId = await createAuthUser("client-e@ymv-crm.test", "Noa Bar-Lev");
  await waitForProfile(noaUserId);
  const noaId = await insertCustomer({
    customer_name: "Noa Bar-Lev",
    phone_1: "+972-54-2223333",
    phone_2: "+972-3-6667777",
    email: "client-e@ymv-crm.test",
    customer_status: "active",
  });
  await linkProfileToCustomer(noaUserId, noaId);

  const aviId = await insertCustomer({
    customer_name: "Avi Katz",
    phone_1: "+972-50-3334444",
    phone_2: null,
    email: "avi.katz@example.com",
    customer_status: "lead",
  });

  const ronitId = await insertCustomer({
    customer_name: "Ronit Sela",
    phone_1: "+972-52-4445555",
    phone_2: null,
    email: "ronit.sela@example.com",
    customer_status: "inactive",
  });

  const gilId = await insertCustomer({
    customer_name: "Gil Friedman",
    phone_1: "+972-50-5556666",
    phone_2: "+972-9-7778888",
    email: "gil.friedman@example.com",
    customer_status: "lead",
  });
  console.log("Created 5 more customers (2 with portal logins).");

  // ---- Properties ----
  const eitanRented = await insertProperty({
    customer_id: eitanId,
    property_address: "9 Dizengoff St, Tel Aviv",
    purchase_date: "2020-06-01",
    purchase_price: 2800000,
    key_received_date: "2020-07-01",
    equity_paid: 1000000,
    bank_financing: 1800000,
    bank_financing_end_date: "2040-06-01",
    property_status: "rented",
    monthly_rent: 9200,
    rental_end_date: `${currentYear + 1}-03-31`,
  });
  await insertProperty({
    customer_id: eitanId,
    property_address: "22 Ibn Gvirol St, Tel Aviv",
    purchase_date: "2023-01-15",
    purchase_price: 3400000,
    key_received_date: "2023-02-01",
    equity_paid: 3400000,
    bank_financing: 0,
    property_status: "vacant",
    notes: "Undergoing light renovation before listing.",
  });

  const noaSold = await insertProperty({
    customer_id: noaId,
    property_address: "14 Sokolov St, Ramat Hasharon",
    purchase_date: "2017-09-01",
    purchase_price: 2100000,
    key_received_date: "2017-10-01",
    equity_paid: 2100000,
    bank_financing: 0,
    property_status: "sold",
    sale_date: `${currentYear}-04-20`,
    sale_price: 2850000,
  });

  await insertProperty({
    customer_id: aviId,
    property_address: "6 Jabotinsky St, Ramat Gan",
    purchase_price: 1900000,
    property_status: "under_construction",
    equity_paid: 700000,
    bank_financing: 1200000,
    bank_financing_end_date: `${currentYear + 22}-01-01`,
    notes: "Handover expected in 12 months.",
  });

  await insertProperty({
    customer_id: ronitId,
    property_address: "31 HaNassi Blvd, Haifa",
    purchase_date: "2021-02-10",
    purchase_price: 1350000,
    key_received_date: "2021-03-01",
    equity_paid: 1350000,
    bank_financing: 0,
    property_status: "vacant",
  });

  const gilRented = await insertProperty({
    customer_id: gilId,
    property_address: "2 Shenkar St, Herzliya",
    purchase_date: "2019-05-01",
    purchase_price: 2600000,
    key_received_date: "2019-06-01",
    equity_paid: 900000,
    bank_financing: 1700000,
    bank_financing_end_date: `${currentYear + 13}-01-01`,
    property_status: "rented",
    monthly_rent: 7800,
    rental_end_date: `${currentYear}-11-30`,
  });
  const gilSold = await insertProperty({
    customer_id: gilId,
    property_address: "18 Weizmann St, Rishon LeZion",
    purchase_date: "2015-03-01",
    purchase_price: 1150000,
    key_received_date: "2015-04-01",
    equity_paid: 1150000,
    bank_financing: 0,
    property_status: "sold",
    sale_date: `${currentYear - 1}-07-01`,
    sale_price: 1600000,
  });
  console.log("Created 7 more properties across all statuses.");

  // ---- Accounting ----
  await seedYearOfAccounting(eitanRented, 9200, 400);
  await seedYearOfAccounting(noaSold, 0, 0);
  await seedYearOfAccounting(gilRented, 7800, 320);
  await seedYearOfAccounting(gilSold, 0, 0);
  console.log("Seeded a year of accounting for 4 more properties.");

  // ---- Property requirements ----
  await insertRequirements({
    customer_id: eitanId,
    purchase_purpose: "investment",
    property_types: ["apartment", "commercial"],
    preferred_locations: ["Tel Aviv", "Givatayim"],
    budget_min: 2500000,
    budget_max: 4500000,
    available_equity: 2000000,
    financing_required: "yes",
    financing_amount: 2000000,
    financing_percentage: 45,
    rooms_min: 3,
    rooms_max: 5,
    size_min: 90,
    size_max: 150,
    property_condition: "no_preference",
    purchase_timeline: "within_3_months",
    desired_yield: 3.8,
    wants_parking: true,
    wants_elevator: true,
    wants_accessibility: true,
  });

  await insertRequirements({
    customer_id: noaId,
    purchase_purpose: "personal_residence",
    property_types: ["private_house", "garden_apartment"],
    preferred_locations: ["Ramat Hasharon", "Kfar Saba"],
    budget_min: 3500000,
    budget_max: 5500000,
    available_equity: 3500000,
    financing_required: "not_sure",
    rooms_min: 5,
    rooms_max: 7,
    size_min: 200,
    size_max: 300,
    property_condition: "new_from_developer",
    purchase_timeline: "within_1_year",
    wants_balcony: true,
    wants_storage: true,
    wants_public_transport_proximity: false,
  });

  await insertRequirements({
    customer_id: aviId,
    purchase_purpose: "investment",
    property_types: ["apartment"],
    preferred_locations: ["Ramat Gan", "Bnei Brak"],
    budget_min: 1500000,
    budget_max: 2200000,
    available_equity: 900000,
    financing_required: "yes",
    financing_percentage: 60,
    rooms_min: 2,
    rooms_max: 4,
    size_min: 60,
    size_max: 100,
    property_condition: "second_hand",
    purchase_timeline: "within_6_months",
    desired_yield: 4.2,
    wants_elevator: true,
  });

  await insertRequirements({
    customer_id: ronitId,
    purchase_purpose: "other",
    property_types: ["office", "commercial"],
    preferred_locations: ["Haifa"],
    budget_min: 900000,
    budget_max: 1500000,
    available_equity: 1500000,
    financing_required: "no",
    property_condition: "no_preference",
    purchase_timeline: "exploring",
  });

  await insertRequirements({
    customer_id: gilId,
    purchase_purpose: "investment_with_future_residence",
    property_types: ["apartment", "penthouse"],
    preferred_locations: ["Herzliya", "Rishon LeZion"],
    budget_min: 2000000,
    budget_max: 3200000,
    available_equity: 1200000,
    financing_required: "yes",
    financing_amount: 1500000,
    financing_percentage: 55,
    rooms_min: 4,
    rooms_max: 5,
    size_min: 100,
    size_max: 160,
    property_condition: "no_preference",
    purchase_timeline: "more_than_1_year",
    desired_yield: 3.2,
    wants_balcony: true,
    wants_parking: true,
    preferred_floor: "High floor preferred",
  });
  console.log("Seeded property requirements for all 5 new customers.");

  const existing = (() => {
    try {
      return readFileSync(".secrets/demo-credentials.txt", "utf8");
    } catch {
      return "";
    }
  })();
  const lines = [
    existing.trimEnd(),
    "",
    `Added ${new Date().toISOString()}`,
    ...credentials.map((c) => `${c.email}  ${c.password}`),
    "",
  ].join("\n");
  writeFileSync(".secrets/demo-credentials.txt", lines, "utf8");

  console.log("\nNew login credentials (appended to .secrets/demo-credentials.txt):");
  for (const c of credentials) console.log(`  ${c.email}  ${c.password}`);
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
