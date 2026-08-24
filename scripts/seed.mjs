/**
 * Seeds demo data: 1 admin, 5 customers (3 with portal logins for RLS
 * testing), properties across every status, a year of accounting for the
 * income-producing ones, and a requirements record per customer.
 *
 * Requires the service role key (SUPABASE_SECRET_KEY in .env.local) —
 * never run this against production with data you care about.
 *
 * Usage: node scripts/seed.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";
import { config } from "dotenv";
import WebSocket from "ws";

config({ path: ".env.local" });

// Node 20 has no global WebSocket; supabase-js's realtime client needs one
// even though this script never uses realtime.
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
  // handle_new_user() fires on the auth.users insert trigger; give it a beat.
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

async function promoteToAdmin(userId) {
  const { error } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("user_id", userId);
  if (error) throw new Error(`promote admin ${userId}: ${error.message}`);
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
    return {
      property_id: propertyId,
      year: currentYear,
      month: i + 1,
      rent_received: baseRent,
      expense_1: baseExpense,
      expense_1_description: baseExpense > 0 ? "Property management fee" : null,
      expense_2: hasMaintenance ? 250 : 0,
      expense_2_description: hasMaintenance ? "Building maintenance fee" : null,
      expense_3: 0,
      expense_3_description: null,
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
  console.log(`Seeding against ${url} ...`);

  // ---- Admin ----
  const adminId = await createAuthUser("admin@ymv-crm.test", "Admin User");
  await waitForProfile(adminId);
  await promoteToAdmin(adminId);
  console.log("Created admin user.");

  // ---- Customers ----
  const cohenUserId = await createAuthUser("client-a@ymv-crm.test", "Cohen Investments Ltd.");
  await waitForProfile(cohenUserId);
  const cohenId = await insertCustomer({
    customer_name: "Cohen Investments Ltd.",
    phone_1: "+972-50-1234567",
    phone_2: "+972-3-5551234",
    email: "client-a@ymv-crm.test",
    customer_status: "active",
  });
  await linkProfileToCustomer(cohenUserId, cohenId);

  const leviUserId = await createAuthUser("client-b@ymv-crm.test", "Levi Family");
  await waitForProfile(leviUserId);
  const leviId = await insertCustomer({
    customer_name: "Levi Family",
    phone_1: "+972-52-2345678",
    phone_2: null,
    email: "client-b@ymv-crm.test",
    customer_status: "active",
  });
  await linkProfileToCustomer(leviUserId, leviId);

  const danaUserId = await createAuthUser("client-c@ymv-crm.test", "Dana Mizrahi");
  await waitForProfile(danaUserId);
  const danaId = await insertCustomer({
    customer_name: "Dana Mizrahi",
    phone_1: "+972-54-3456789",
    phone_2: null,
    email: "client-c@ymv-crm.test",
    customer_status: "lead",
  });
  await linkProfileToCustomer(danaUserId, danaId);

  const yossiId = await insertCustomer({
    customer_name: "Yossi Peretz",
    phone_1: "+972-50-4567890",
    phone_2: null,
    email: "yossi.peretz@example.com",
    customer_status: "lead",
  });

  const michalId = await insertCustomer({
    customer_name: "Michal Avraham",
    phone_1: "+972-52-5678901",
    phone_2: "+972-9-8887777",
    email: "michal.avraham@example.com",
    customer_status: "inactive",
  });
  console.log("Created 5 customers (3 with portal logins).");

  // ---- Properties ----
  const cohenRented = await insertProperty({
    customer_id: cohenId,
    property_address: "12 Rothschild Blvd, Tel Aviv",
    purchase_date: "2021-03-15",
    purchase_price: 2450000,
    key_received_date: "2021-04-01",
    equity_paid: 900000,
    bank_financing: 1550000,
    bank_financing_end_date: "2041-03-15",
    property_status: "rented",
    monthly_rent: 8500,
    rental_end_date: `${currentYear + 1}-06-30`,
    notes: "Long-term tenant, renews annually.",
  });
  await insertProperty({
    customer_id: cohenId,
    property_address: "4 HaYarkon St, Tel Aviv",
    purchase_date: "2022-08-10",
    purchase_price: 3100000,
    key_received_date: "2022-09-01",
    equity_paid: 3100000,
    bank_financing: 0,
    property_status: "vacant",
    notes: "Recently renovated, listing for rent.",
  });

  const leviSold = await insertProperty({
    customer_id: leviId,
    property_address: "8 Herzl St, Herzliya",
    purchase_date: "2018-01-20",
    purchase_price: 1750000,
    key_received_date: "2018-02-15",
    equity_paid: 1750000,
    bank_financing: 0,
    property_status: "sold",
    sale_date: `${currentYear}-02-10`,
    sale_price: 2300000,
  });

  await insertProperty({
    customer_id: danaId,
    property_address: "21 Ben Gurion Ave, Ra'anana",
    purchase_price: 2100000,
    property_status: "under_construction",
    equity_paid: 500000,
    bank_financing: 1600000,
    bank_financing_end_date: `${currentYear + 20}-01-01`,
    notes: "Delivery expected in 18 months.",
  });

  await insertProperty({
    customer_id: yossiId,
    property_address: "5 Weizmann St, Netanya",
    purchase_date: "2023-05-05",
    purchase_price: 1400000,
    key_received_date: "2023-06-01",
    equity_paid: 1400000,
    bank_financing: 0,
    property_status: "vacant",
  });

  const michalRented = await insertProperty({
    customer_id: michalId,
    property_address: "3 Allenby St, Haifa",
    purchase_date: "2019-11-11",
    purchase_price: 1200000,
    key_received_date: "2019-12-01",
    equity_paid: 400000,
    bank_financing: 800000,
    bank_financing_end_date: `${currentYear + 15}-01-01`,
    property_status: "rented",
    monthly_rent: 4200,
    rental_end_date: `${currentYear}-12-31`,
  });
  const michalSold = await insertProperty({
    customer_id: michalId,
    property_address: "17 Ben Yehuda St, Jerusalem",
    purchase_date: "2016-04-01",
    purchase_price: 1600000,
    key_received_date: "2016-05-01",
    equity_paid: 1600000,
    bank_financing: 0,
    property_status: "sold",
    sale_date: `${currentYear - 1}-09-15`,
    sale_price: 2050000,
  });
  console.log("Created 7 properties across all statuses.");

  // ---- Accounting (a full year for income-producing properties) ----
  await seedYearOfAccounting(cohenRented, 8500, 350);
  await seedYearOfAccounting(leviSold, 0, 0);
  await seedYearOfAccounting(michalRented, 4200, 300);
  await seedYearOfAccounting(michalSold, 0, 0);
  console.log("Seeded a year of accounting for 4 properties.");

  // ---- Property requirements ----
  await insertRequirements({
    customer_id: cohenId,
    purchase_purpose: "investment",
    property_types: ["apartment", "penthouse"],
    preferred_locations: ["Tel Aviv", "Herzliya"],
    budget_min: 2000000,
    budget_max: 4000000,
    available_equity: 1500000,
    financing_required: "yes",
    financing_amount: 1500000,
    financing_percentage: 50,
    rooms_min: 3,
    rooms_max: 5,
    size_min: 80,
    size_max: 140,
    property_condition: "no_preference",
    purchase_timeline: "within_6_months",
    desired_yield: 3.5,
    wants_parking: true,
    wants_elevator: true,
  });

  await insertRequirements({
    customer_id: leviId,
    purchase_purpose: "personal_residence",
    property_types: ["private_house"],
    preferred_locations: ["Herzliya", "Ra'anana"],
    budget_min: 3000000,
    budget_max: 5000000,
    available_equity: 3000000,
    financing_required: "not_sure",
    rooms_min: 5,
    rooms_max: 6,
    size_min: 180,
    size_max: 250,
    property_condition: "second_hand",
    purchase_timeline: "within_1_year",
    wants_balcony: true,
    wants_parking: true,
    wants_accessibility: false,
  });

  await insertRequirements({
    customer_id: danaId,
    purchase_purpose: "investment_with_future_residence",
    property_types: ["apartment", "garden_apartment"],
    preferred_locations: ["Ra'anana", "Kfar Saba"],
    budget_min: 1600000,
    budget_max: 2400000,
    available_equity: 600000,
    financing_required: "yes",
    financing_percentage: 65,
    rooms_min: 3,
    rooms_max: 4,
    size_min: 70,
    size_max: 110,
    property_condition: "new_from_developer",
    purchase_timeline: "exploring",
    desired_yield: 3,
    wants_storage: true,
    wants_public_transport_proximity: true,
  });

  await insertRequirements({
    customer_id: yossiId,
    purchase_purpose: "investment",
    property_types: ["apartment"],
    preferred_locations: ["Netanya"],
    budget_min: 1200000,
    budget_max: 1600000,
    available_equity: 1400000,
    financing_required: "no",
    rooms_min: 2,
    rooms_max: 3,
    size_min: 55,
    size_max: 80,
    property_condition: "second_hand",
    purchase_timeline: "immediately",
    desired_yield: 4,
  });

  await insertRequirements({
    customer_id: michalId,
    purchase_purpose: "other",
    property_types: ["commercial", "office"],
    preferred_locations: ["Haifa", "Jerusalem"],
    budget_min: 1000000,
    budget_max: 2000000,
    available_equity: 2000000,
    financing_required: "no",
    property_condition: "no_preference",
    purchase_timeline: "more_than_1_year",
    additional_requirements: "Open to relocating for the right yield.",
  });
  console.log("Seeded property requirements for all 5 customers.");

  mkdirSync(".secrets", { recursive: true });
  const lines = [
    `Generated ${new Date().toISOString()}`,
    "",
    ...credentials.map((c) => `${c.email}  ${c.password}`),
    "",
  ].join("\n");
  writeFileSync(".secrets/demo-credentials.txt", lines, "utf8");

  console.log("\nDemo login credentials (also saved to .secrets/demo-credentials.txt):");
  for (const c of credentials) console.log(`  ${c.email}  ${c.password}`);
  console.log("\nSeed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
