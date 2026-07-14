const path = require('path');
process.chdir(path.resolve(__dirname, '..'));

const { PrismaClient } = require("./src/generated/db/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");

async function main() {
  const url = process.env.DATABASE_URL;
  const adapter = new PrismaPg({ connectionString: url });
  const prisma = new PrismaClient({ adapter });

  console.log("🌱 Seeding database...");

  const password = await bcrypt.hash("demo1234", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@controlcuentas.com" },
    update: {},
    create: { email: "demo@controlcuentas.com", name: "Usuario Demo", password },
  });
  console.log(`  ✅ User: ${user.email}`);

  const expenseCats = [
    { name: "Alquiler", color: "#ef4444" },
    { name: "Servicios", color: "#f97316" },
    { name: "Supermercado", color: "#eab308" },
    { name: "Transporte", color: "#22c55e" },
    { name: "Salud", color: "#06b6d4" },
    { name: "Entretenimiento", color: "#8b5cf6" },
    { name: "Comida", color: "#ec4899" },
    { name: "Suscripciones", color: "#6366f1" },
    { name: "Otros Gastos", color: "#6b7280" },
  ];
  const incomeCats = [
    { name: "Sueldo", color: "#16a34a" },
    { name: "Freelance", color: "#2563eb" },
    { name: "Inversiones", color: "#7c3aed" },
    { name: "Otros Ingresos", color: "#6b7280" },
  ];

  for (const cat of expenseCats) {
    await prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: cat.name } },
      update: {},
      create: { ...cat, userId: user.id, type: "EGRESO", icon: "circle" },
    });
  }
  console.log(`  ✅ ${expenseCats.length} expense categories`);
  for (const cat of incomeCats) {
    await prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: cat.name } },
      update: {},
      create: { ...cat, userId: user.id, type: "INGRESO", icon: "circle" },
    });
  }
  console.log(`  ✅ ${incomeCats.length} income categories`);

  const allCats = await prisma.category.findMany({ where: { userId: user.id } });
  const expenseMap = new Map(allCats.filter(c => c.type === "EGRESO").map(c => [c.name, c.id]));
  const incomeMap = new Map(allCats.filter(c => c.type === "INGRESO").map(c => [c.name, c.id]));

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const movements = [
    { desc: "Alquiler Julio", amount: 180000, cat: "Alquiler", day: 5, paid: true },
    { desc: "Supermercado", amount: 45000, cat: "Supermercado", day: 3, paid: true },
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
    { desc: "Alquiler Junio", amount: 170000, cat: "Alquiler", day: 5, paid: true, mo: -1 },
    { desc: "Supermercado Junio", amount: 52000, cat: "Supermercado", day: 8, paid: true, mo: -1 },
    { desc: "Sueldo Junio", amount: 450000, cat: "Sueldo", day: 1, paid: true, mo: -1 },
    { desc: "Luz Junio", amount: 9500, cat: "Servicios", day: 10, paid: true, mo: -1 },
    { desc: "Transporte Junio", amount: 15000, cat: "Transporte", day: 12, paid: true, mo: -1 },
  ];

  for (const m of movements) {
    const mo = m.mo || 0;
    const date = new Date(year, month + mo, m.day);
    const isIncome = incomeMap.has(m.cat);
    const categoryId = isIncome ? incomeMap.get(m.cat) : expenseMap.get(m.cat);
    if (!categoryId) { console.warn(`  ⚠ Skipping ${m.cat}`); continue; }
    await prisma.movement.create({
      data: {
        description: m.desc, amount: m.amount,
        type: isIncome ? "INGRESO" : "EGRESO",
        date, isPaid: m.paid, paidAt: m.paid ? date : null,
        categoryId, userId: user.id,
      },
    });
  }
  console.log(`  ✅ ${movements.length} sample movements`);
  await prisma.$disconnect();
  console.log("🎉 Seed complete!");
}

main().catch(e => { console.error("❌", e); process.exit(1); });
