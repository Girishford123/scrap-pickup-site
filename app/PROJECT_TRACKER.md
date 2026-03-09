# Scrap Pickup Site — Development Tracker
Last Updated: March 8, 2026

---

## 🌐 Project Info
- **Site URL:** https://scrap-pickup-site-t66n.vercel.app
- **Stack:** Next.js, TypeScript, Supabase, NextAuth, 
             UploadThing, Vercel, Power Automate
- **Started:** February 24, 2026

---

## ✅ Completed Features

### 📦 Core Setup
- [ ] Next.js project initialized with TypeScript
- [ ] Vercel deployment configured
- [ ] Supabase database connected
- [ ] Environment variables set

### 🔐 Authentication
- [ ] NextAuth implemented
- [ ] Admin login page created
- [ ] Protected routes via middleware
- [ ] Session timeout configured

### 🗄️ Database (Supabase)
- [ ] `pickup_request` table created
- [ ] Row Level Security (RLS) enabled
- [ ] Columns: (list all your columns here)

### 📊 Admin Dashboard
- [ ] Dashboard home page
- [ ] (List every page/feature you built)
- [ ] (e.g. Pickup Requests table)
- [ ] (e.g. Status filters)
- [ ] (e.g. Search functionality)
- [ ] (e.g. Export to Excel)

### 🔄 Power Automate Sync
- [ ] Sync API route created
  - Path: /api/admin/sync-from-powerautomate
- [ ] Excel date conversion fixed
- [ ] Auto status determination from dates
- [ ] Middleware bypass for sync route
- [ ] API Key security (SYNC_API_KEY)
- [ ] Scheduled flow set up in Power Automate

### 🖼️ File Storage
- [ ] UploadThing configured
- [ ] Remote image patterns set in next.config.ts

### 🔒 Security
- [x] Middleware auth protection        ✅ Done
- [x] API key for sync route            ✅ Done
- [x] Security headers (next.config.ts) ✅ Done - March 8, 2026
- [ ] Supabase RLS policies             ⏳ Next
- [ ] Rate limiting (Upstash)           ⏳ Pending
- [ ] Input validation (Zod)            ⏳ Pending
- [ ] Audit logging table               ⏳ Pending
- [ ] Session timeout                   ⏳ Pending

---

## 🚧 In Progress
- Security improvements (started March 8)
  - [ ] Rate Limiting
  - [ ] Security Headers
  - [ ] Supabase RLS
  - [ ] Email domain check
  - [ ] Input validation (Zod)
  - [ ] Audit logging
  - [ ] Session timeout

---

## 📋 Known Issues / Watch List
- Always verify these features still work after new deployments:
  - [ ] Login still works
  - [ ] Power Automate sync works
  - [ ] Dashboard loads correctly
  - [ ] All table data displays
  - [ ] Status filters work
  - [ ] Images load correctly

---

## 🔑 Environment Variables (Vercel)
- NEXT_PUBLIC_SUPABASE_URL        ✅
- SUPABASE_SERVICE_ROLE_KEY       ✅
- NEXTAUTH_SECRET                 ✅
- NEXTAUTH_URL                    ✅
- SYNC_API_KEY                    ✅

---

## 📁 Key File Locations
src/
  app/
    api/
      admin/
        sync-from-powerautomate/
          route.ts          ← Power Automate sync
      auth/
        [...nextauth]/
          route.ts          ← NextAuth config
    admin/
      (your admin pages)
  middleware.ts               ← Auth protection
next.config.ts                ← Image patterns + headers

---

## ⚙️ Key Configs

### middleware.ts — Protected Routes
- /admin/* → requires auth
- /api/admin/* → requires auth
- /api/admin/sync-from-powerautomate → PUBLIC (API key only)

### Power Automate HTTP Action
- URL: https://scrap-pickup-site-t66n.vercel.app/api/admin/sync-from-powerautomate
- Method: POST
- Headers: x-api-key, Content-Type: application/json
- Schedule: (your schedule here)

---

## 📅 Development Log

### February 24, 2026
- Project started
- (fill in what was done)

### March 8, 2026
- Fixed Power Automate 307 redirect issue
- Fixed NextAuth blocking sync route
- Moved sync bypass OUTSIDE withAuth wrapper
- Added API key protection to sync route
- Security improvements planned

---

## 🧪 Post-Deployment Checklist
After EVERY deployment, verify:
1. [ ] Login page loads
2. [ ] Can log in successfully
3. [ ] Dashboard loads with data
4. [ ] Power Automate sync works (manual trigger)
5. [ ] All admin pages accessible
6. [ ] No console errors