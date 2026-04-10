# 🎓 College CMS - Administrator's Guide

Welcome to the Sanskriti College Management System. This guide provides essential instructions for managing the platform's core institutional functions.

---

## 📅 Managing Academic Cycles

### Starting a New Academic Year
1. **Create Year**: Go to `Institutions` > `Academic Years`. Create a new entry (e.g., "2025-26") with the start and end dates.
2. **Setup Fees**: Navigate to `Institutions` > `Fee Structures`. 
   - Select the new Academic Year.
   - Use the **Copy to Year** feature on existing structures to duplicate your fee schemes from the previous year.
   - Adjust individual component amounts if there are price changes for the new cycle.
3. **Activate**: Once structures are ready, return to `Academic Years` and click **Set Active** on the new year. 
   - *Note: This will automatically deactivate the previous year institutional-wide.*

---

## 👥 User & Role Management

### Adding Staff
1. Go to `User Management`.
2. Click **Create User**.
3. Choose the appropriate role:
   - **ADMIN**: Access to institutional settings and report configuration.
   - **ACCOUNTANT**: Access to fee collection, expenses, and financial reports.
   - **STAFF**: Read-only access to student directories.

### Security
- Use the **Audit Logs** (`/dashboard` bottom section) to monitor significant institutional changes.
- In production, you can view the raw log stream at `/api/logs` (Super Admin only).

---

## 💾 Maintenance & Data Safety

### Manual Database Backups
Since this system uses **Supabase**, your data is automatically backed up. For manual snapshots:
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **Database** > **Backups**.
3. Click **Download Backup** or **Enable PITR** (Point-in-Time Recovery) for enterprise-grade safety.

### Financial Auditing
Every day, the **Day Book** report should be generated.
1. Go to `Analytics Reports` > `Daily Day Book`.
2. Verify that the **Closing Balance** matches your physical cash-in-hand.
3. Export to Excel and archive a digital copy monthly.

---

## 🚀 Deployment Environment Variables
Ensure these are set in your cloud provider:
- `DATABASE_URL`: Your Supabase connection string.
- `JWT_SECRET`: A secure, random 64+ character string.
- `FRONTEND_URL`: The URL where your React app is hosted (for CORS protection).
- `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`: Required for photo storage access.

---
*Developed for Excellence in Institutional Management.*
