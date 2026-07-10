// ESM seed runner - works around Hermes Node.js CJS module issues
import { PrismaClient } from "../src/generated/db/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ DATABASE_URL no configurada");
    process.exit(1);
  }
  const adapter = new PrismaPg({ connectionString: url });
  const prisma = new PrismaClient({ adapter });

  console.log("🌱 Seeding database...\n");

  const password = await bcrypt.hash("demo1234", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@controlcuentas.com" },
    update: {},
    create: {
      email: "demo@controlcuentas.com",
      name: "Usuario Demo",
      password,
    },
  });
  console.log(`  ✅ User: ${user.email}`);

  const expenseCategories = [
    { name: "Alquiler", color: "#ef4444", icon: "home" },
    { name: "Servicios", color: "#f97316", icon: "zap" },
    { name: "Supermercado", color: "#eab308", icon: "shopping-cart" },
    { name: "Transporte", color: "#22c55e", icon: "bus" },
    { name: "Salud", color: "#06b6d4", icon: "heart-pulse" },
    { name: "Entretenimiento", color: "#8b5cf6", icon: "gamepad-2" },
    { name: "Comida", color: "#ec4899", icon: "utensils-crossed" },
    { name: "Suscripciones", color: "#6366f1", icon: "credit-card" },
    { name: "Otros Gastos", color: "#6b7280", icon: "more-horizontal" },
  ];

  const incomeCategories = [
    { name: "Sueldo", color: "#16a34a", icon: "briefcase" },
    { name: "Freelance", color: "#2563eb", icon: "laptop" },
    { name: "Inversiones", color: "#7c3aed", icon: "trending-up" },
    { name: "Otros Ingresos", color: "#6b7280", icon: "more-horizontal" },
  ];

  for (const cat of expenseCategories) {
    await prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: cat.name } },
      update: {},
      create: { ...cat, userId: user.id, type: "EGRESO" },
    });
  }
  console.log(`  ✅ ${expenseCategories.length} expense categories`);

  for (const cat of incomeCategories) {
    await prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: cat.name } },
      update: {},
      create: { ...cat, userId: user.id, type: "INGRESO" },
    });
  }
  console.log(`  ✅ ${incomeCategories.length} income categories`);

  const allCategories = await prisma.category.findMany({
    where: { userId: user.id },
  });

  const expenseCatMap = new Map(
    allCategories.filter((c) => c.type === "EGRESO").map((c) => [c.name, c.id])
  );
  const incomeCatMap = new Map(
    allCategories.filter((c) => c.type === "INGRESO").map((c) => [c.name, c.id])
  );

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const sampleMovements = [
    { desc: "Alquiler Julio", amount: 180000, cat: "Alquiler", day: 5, paid: true },
    { desc: "Supermercado Día", amount: 45000, cat: "Supermercado", day: 3, paid: true },
    { desc: "Cable + Internet", amount: 15000, cat: "Servicios", day: 8, paid: true },
    { desc: "Gas", amount: 8000, cat: "Servicios", day: 10, paid: false },
    { desc: "Luz + Agua", amount: 12000, cat: "Servicios", day: 12, paid: false },
    { desc: "Netflix + Spotify", amount: 8000, cat: "Suscripciones", day: 15, paid: true },
    { desc: "Cena afuera", amount: 25000, cat: "Comida", day: 14, paid: true },
    { desc: "Uber viajes", amount: 12000, cat: "Transporte", day: 7, paid: true },
    { desc: "Farmacia", amount: 9500, cat: "Salud", day: 11, paid: false },
    { desc: "Cine + cena", amount: 18000, cat: "Entretenimiento", day: 9, paid: true },
    { desc: "Sueldo Julio", amount: 450000, cat: "Sueldo", day: 1, paid: true },
    { desc: "Proyecto Web", amount: 120000, cat: "Freelance", day: 15, paid: true },
    { desc: "Alquiler Junio", amount: 170000, cat: "Alquiler", day: 5, paid: true, monthOffset: -1 },
    { desc: "Supermercado Junio", amount: 52000, cat: "Supermercado", day: 8, paid: true, monthOffset: -1 },
    { desc: "Sueldo Junio", amount: 450000, cat: "Sueldo", day: 1, paid: true, monthOffset: -1 },
    { desc: "Luz Junio", amount: 9500, cat: "Servicios", day: 10, paid: true, monthOffset: -1 },
    { desc: "Transporte Junio", amount: 15000, cat: "Transporte", day: 12, paid: true, monthOffset: -1 },
  ];

  for (const m of sampleMovements) {
    const monthOffset = m.monthOffset ?? 0;
    const date = new Date(currentYear, currentMonth + monthOffset, m.day);
    const catMap = expenseCatMap.has(m.cat) ? expenseCatMap : incomeCatMap;
    const categoryId = catMap.get(m.cat);
    if (!categoryId) {
      console.warn(`  ⚠️  Category "${m.cat}" not found, skipping`);
      continue;
    }

    await prisma.movement.create({
      data: {
        description: m.desc,
        amount: m.amount,
        type: incomeCatMap.has(m.cat) ? "INGRESO" : "EGRESO",
        date,
        isPaid: m.paid,
        paidAt: m.paid ? date : null,
        categoryId,
        userId: user.id,
      },
    });
  }
  console.log(`  ✅ ${sampleMovements.length} sample movements`);

  await prisma.$disconnect();
  console.log("\n🎉 Seed complete!");
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
