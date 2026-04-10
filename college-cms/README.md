# 🎓 College Management System (CMS) - Monorepo

A comprehensive institutional and financial management platform designed for modern educational institutions (e.g., Pharmacy Colleges). This system streamlines student administration, automates fee collection cycles, monitors departmental expenditure, and provides real-time financial analytics.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **PostgreSQL** (Supabase recommended for Storage & Realtime features)

### 2. Backend Setup
```bash
cd backend
npm install
# Copy .env.example to .env and fill in:
# DATABASE_URL, JWT_SECRET, SUPABASE_URL, SUPABASE_ANON_KEY
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
# Copy .env.example to .env and fill in:
# VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev
```

---

## 🏗️ Core Architecture & Features

### 🛡️ Secure Identity & RBAC
- **Stateless JWT Auth**: 1hr Access + 7d Refresh tokens stored in `httpOnly` cookies.
- **Role-Based Access**: 
    - `SUPER_ADMIN`: Full system configuration and log access.
    - `ADMIN`: Institutional cycle management and student oversight.
    - `ACCOUNTANT`: Cash counter operations and expense ledgers.
    - `STAFF`: Directory access and student profiles.

### 💰 Financial Governance
- **Fee Collection POS**: Atomic 3-step payment wizard with instant PDF receipt generation.
- **Expense Registry**: Categorized expenditure tracking with department-wise aging.
- **Recalculation Engine**: Dynamic balance updates across all student records when a global fee structure is modified.

### 📈 Institutional Intelligence
- **Real-time Dashboard**: Live KPI tracking for collection rates, liquid cash flow, and activity feeds.
- **Reporting Suite**: Professional exports (Excel/PDF) for Day Books, Outstanding Fees, and Collection Registers.

---

## 🔑 Environment Configuration

### Backend (`/backend/.env`)
| Key | Description |
|-----|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Transaction mode). |
| `DIRECT_URL` | PostgreSQL direct connection for migrations. |
| `JWT_SECRET` | 64+ char string for token signing. |
| `SUPABASE_URL` | Your Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | For server-side storage operations. |
| `CORS_WHITELIST` | Comma-separated URLs (e.g., http://localhost:5173). |

### Frontend (`/frontend/.env`)
| Key | Description |
|-----|-------------|
| `VITE_API_URL` | Backend API root (e.g., http://localhost:5000/api). |
| `VITE_SUPABASE_URL` | Public Supabase URL for client subscriptions. |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase Key for realtime events. |

---

## 🧪 Testing & QA Checklist

### Financial Accuracy
- [ ] **Transaction Voiding**: Void a payment and verify the student's balance increases correctly.
- [ ] **Day Book Accuracy**: Verify `Opening Balance + Total Credits - Total Debits = Closing Balance`.
- [ ] **PDF Generation**: Verify receipt numbers follow the `RCP-{YYYY}-{SEQ}` format.

### Real-time & Performance
- [ ] **Supabase Sync**: Open two tabs; record a payment in one and verify the toast pops in the other.
- [ ] **Cached Stats**: Verify dashboard KPIs update within 60s of a transaction.

---

## 💡 Pro Tips for Future Growth
1. **SMS Integration**: Hook into the `recordFeePayment` mutation to send automated WhatsApp/SMS receipts to parents.
2. **Attendance Bridge**: Link the `Student` model to a new `Attendance` model to show attendance % on the financial profile view.
3. **Mobile App**: The API is built to REST standards, making it ready for a React Native companion app for parents.
4. **Cloud Backups**: Utilize the `ADMIN_GUIDE.md` instructions for managing Supabase PITR (Point-in-Time-Recovery).

---
*Built with excellence by Antigravity AI.*
