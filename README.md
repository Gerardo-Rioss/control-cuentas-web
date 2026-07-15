
# 💰 Control Cuentas

![Control Cuentas](https://raw.githubusercontent.com/Gerardo-Rioss/control-cuentas-web/main/public/screenshots/banner-github.png)

**💰 Control de gastos e ingresos** — Dashboard interactivo con gráficos, CRUD completo, autenticación y modo oscuro.

> 🏠 **Repositorio principal:** [Gerardo-Rioss/control-cuentas-web](https://github.com/Gerardo-Rioss/control-cuentas-web)
> 🤖 **Built with:** [gerariosdev](https://github.com/gerariosdev) (AI coding assistant)
> 🌐 **Live Demo:** [control-cuentas-6okkse5b4-gerariosdev-projects.vercel.app](https://control-cuentas-6okkse5b4-gerariosdev-projects.vercel.app)

<p align="center">
  <img src="https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma_7-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma 7" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Tailwind_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind v4" />
  <img src="https://img.shields.io/badge/shadcn/ui-000000?style=for-the-badge&logo=shadcnui&logoColor=white" alt="shadcn/ui" />
  <img src="https://img.shields.io/badge/Test-Vitest-15C213?style=for-the-badge&logo=vitest&logoColor=white" alt="Tests" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

---

## ✨ Features

| Feature | Descripción |
|---------|-------------|
| 📊 **Dashboard** | Resumen mensual con saldo, ingresos, egresos y **gráficos interactivos** (torta por categoría, evolución mensual, barras comparativas) |
| 💸 **Movimientos** | CRUD completo de ingresos/egresos con toggle pagado/pendiente, edición inline, eliminación |
| 🏷️ **Categorías** | CRUD completo con **12 colores personalizables**, contador por tipo (gastos/ingresos), validación al eliminar |
| 📅 **Navegación Mensual** | Flechas de navegación entre meses, selector, copiar/eliminar mes completo |
| 📈 **Reportes** | Visualización de gastos por categoría con gráficos |
| 🔐 **Autenticación** | Login con NextAuth v5 + JWT + bcrypt, sesiones persistentes |
| 🌙 **Dark Mode** | Toggle claro/oscuro con persistencia en localStorage |
| 📱 **Responsive** | Sidebar en desktop, bottom nav en mobile |
| 🧪 **Tests** | 5 suites de tests para APIs (1.702 líneas) |

## 🛠️ Stack

| Capa | Tecnología |
|------|-----------|
| **Framework** | Next.js 16.2.9 (App Router + Turbopack) |
| **Lenguaje** | TypeScript |
| **Base de datos** | PostgreSQL + Prisma 7.8 ORM |
| **Auth** | NextAuth v5 (Credentials + JWT) |
| **UI** | Tailwind CSS v4 + shadcn/ui (base-ui) |
| **Charts** | Recharts (PieChart, LineChart, BarChart) |
| **Animaciones** | Framer Motion |
| **Validación** | Zod |
| **Testing** | Vitest |

## 📁 Estructura

```
src/
├── app/
│   ├── (auth)/login/       → Login con credenciales
│   ├── (dashboard)/
│   │   ├── page.tsx        → Dashboard principal (107 líneas)
│   │   ├── categorias/     → CRUD categorías (283 líneas)
│   │   ├── configuracion/  → Ajustes (113 líneas)
│   │   └── reportes/       → Reportes visuales (138 líneas)
│   └── api/                → 8 endpoints REST
├── components/
│   ├── dashboard/          → 8 componentes específicos
│   │   ├── pie-chart.tsx
│   │   ├── line-chart.tsx
│   │   ├── bar-chart.tsx
│   │   ├── expense-table.tsx
│   │   ├── income-panel.tsx
│   │   ├── summary-cards.tsx
│   │   ├── month-selector.tsx
│   │   └── movement-dialog.tsx
│   ├── layout/             → Sidebar, bottom nav, user menu
│   └── ui/                 → shadcn/ui primitives
└── lib/                    → Auth, Prisma client, utils
prisma/
├── schema.prisma           → 6 modelos (110 líneas)
└── migrations/             → Migración inicial
```

## 🧪 Tests

```bash
npm test          # 5 suites · 1.702 líneas · API endpoints
npm run test:coverage
npm run test:watch
```

Cubren: CRUD de categorías, movimientos, y resumen mensual con base de datos de prueba (Docker + PostgreSQL 16 Alpine).

## 📦 Modelo de Datos

```
User ──┐
        ├── Account (NextAuth)
        ├── Session (NextAuth)
        ├── VerificationToken
        ├── Category (name, color, type)
        └── Movement (description, amount, type, date, isPaid)
```

## 🚀 Deploy

> 🌐 **[Live Demo](https://control-cuentas-6okkse5b4-gerariosdev-projects.vercel.app)** — PostgreSQL serverless con Neon + CI/CD con Vercel.

También podés correrlo local:

```bash
# Requisitos: PostgreSQL corriendo en puerto 5432

git clone https://github.com/Gerardo-Rioss/control-cuentas-web.git
cd control-cuentas-web
npm install
cp .env.example .env          # Configurar DATABASE_URL
npx prisma migrate dev
npm run dev
# → http://localhost:3000
```

### 🔑 Credenciales Demo

```
Email:    demo@controlcuentas.com
Password: demo1234
```

## 🏗️ APIs REST

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/categories` | Listar / Crear categorías |
| PATCH/DELETE | `/api/categories/[id]` | Editar / Eliminar categoría |
| GET/POST | `/api/movements` | Listar / Crear movimientos |
| GET/PATCH/DELETE | `/api/movements/[id]` | Ver / Editar / Eliminar movimiento |
| GET | `/api/summary?month=&year=` | Resumen mensual con totales |
| POST | `/api/months/duplicate` | Copiar movimientos entre meses |
| POST | `/api/months` | Eliminar mes completo |

## 📸 Screenshots

| Login | Dashboard | Categorías |
|:-----:|:---------:|:----------:|
| ![Login](https://raw.githubusercontent.com/Gerardo-Rioss/control-cuentas-web/main/public/screenshots/login-mockup.png) | ![Dashboard](https://raw.githubusercontent.com/Gerardo-Rioss/control-cuentas-web/main/public/screenshots/dashboard-mockup.png) | ![Mobile](https://raw.githubusercontent.com/Gerardo-Rioss/control-cuentas-web/main/public/screenshots/mobile-mockup.png) |

> 🎨 Banner del proyecto: ![Banner](https://raw.githubusercontent.com/Gerardo-Rioss/control-cuentas-web/main/public/screenshots/banner-github.png)

## 🧑‍💻 Autor

**Gerardo Germán Ríos** — Full Stack Developer

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/gerardrioss)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/Gerardo-Rioss)
[![Portfolio](https://img.shields.io/badge/Portfolio-FF7139?style=flat-square&logo=react&logoColor=white)](https://rios-gerardo.netlify.app)

---

<p align="center">
  <sub>Hecho con ☕ y TypeScript · Proyecto de portfolio · 2026</sub>
</p>
