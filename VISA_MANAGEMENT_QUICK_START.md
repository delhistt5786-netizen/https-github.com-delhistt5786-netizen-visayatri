# 🚀 Quick Start Guide - Dynamic Visa Management

## What You Have

✅ **Admin Panel** - Manage visa countries, pricing, and status  
✅ **39 Pre-loaded Visas** - Ready to use with auto-population  
✅ **Dynamic Frontend** - All pages use real-time data  
✅ **Business Address** - Displayed in footer  

---

## 5-Minute Setup

### 1. Seed Database (1 min)
```bash
cd backend
node utils/seedVisas.js
```

### 2. Start Dev Server (2 min)
```bash
cd frontend
npm run dev
```

### 3. Access Admin Dashboard (1 min)
- Go to: http://localhost:3000/dashboard/admin
- Login as admin
- Click "Visas" tab
- See all 39 countries with pricing

### 4. Try Admin Features (1 min)
- 🟢 **Add Visa**: Click green "Add New Visa" button
- ✏️ **Edit Pricing**: Click "Edit" on any visa
- 🔄 **Toggle Status**: Click status badge to activate/deactivate
- ❌ **Delete**: Click trash icon to remove

---

## Admin Dashboard Layout

```
ADMIN DASHBOARD
├─ Dashboard
├─ Applications
├─ Agents
├─ Visas ← YOU ARE HERE
│  ├─ Add New Visa (button)
│  ├─ Visa Table:
│  │  ├─ Country | Region | Plans | Status | Actions
│  │  ├─ 🇴🇲 Oman | middle-east | ₹1850/3900/5400 | [Active] [Edit] [Delete]
│  │  ├─ 🇶🇦 Qatar | middle-east | ₹500/750/1000 | [Active] [Edit] [Delete]
│  │  └─ ... 37 more visas
├─ Users
├─ Transactions
└─ Settings
```

---

## Common Tasks

### ➕ Add a New Visa

1. Click **"Add New Visa"** button (top right)
2. Fill form:
   - Country Name: `United States` (required)
   - Country Slug: `united-states` (required, auto-lowercase)
   - Flag Emoji: `🇺🇸` (optional)
   - Region: Select from dropdown (required)
   - Processing Time: `5-7 business days`
   - Visa Type: `E-Visa`
3. Click **"Create Visa"**
4. Add pricing by clicking Edit on the new visa

### ✏️ Edit Visa Pricing

1. Find visa in table
2. Click **"Edit"** button (pencil icon)
3. Update pricing:
   - Base Price: Cost to company
   - Agent Price: Discounted rate for agents
   - Public Price: Customer-facing price
4. Click **"Update Prices"**

### 🔄 Activate/Deactivate Visa

1. Find visa in table
2. Click status badge (green="Active", gray="Inactive")
3. Visa status toggles instantly

### ❌ Delete Visa

1. Find visa in table
2. Click **trash icon** (red X)
3. Confirm deletion
4. Visa removed from system

---

## API Endpoints (For Developers)

```bash
# Get all visas
GET /api/admin/visas

# Get specific visa
GET /api/admin/visas/:id

# Create new visa
POST /api/admin/visas
Body: { country, slug, flag, region, ... }

# Update visa
PUT /api/admin/visas/:id
Body: { country, plans, isActive, ... }

# Toggle status
PATCH /api/admin/visas/:id/toggle

# Delete visa
DELETE /api/admin/visas/:id
```

---

## Frontend Pages Using Dynamic Data

✅ `/visa` - Lists all active visas dynamically  
✅ `/visa/[slug]` - Individual visa details  
✅ `/dashboard/admin` - Admin visa management  
✅ Footer - Shows business address  

---

## Database Contents

**39 Pre-loaded Visas**:
- Middle East: 7 countries
- Asia: 14 countries
- Africa: 9 countries
- Europe: 2 countries
- Others: 2 countries
- Sri Lanka: 1 special rate (₹700)

**All with pricing tiers**: Base / Agent / Public

---

## Deployment

### To Production
```bash
git add .
git commit -m "feat: Add dynamic visa management system"
git push origin main
# Auto-deploys to Vercel in 2-3 minutes
```

### Check Status
```bash
npm run build  # Verify no errors
npm run dev    # Test locally
```

---

## Troubleshooting

**❓ Visas not showing in admin?**
- Login as admin first
- Check MongoDB connection
- Run: `node utils/seedVisas.js`

**❓ Changes not appearing on frontend?**
- Refresh page (Ctrl+R)
- Check API network tab
- Verify visa is marked `isActive: true`

**❓ Build errors?**
- Delete node_modules: `rm -rf node_modules`
- Reinstall: `npm install`
- Rebuild: `npm run build`

---

## File Changes Summary

**Backend**:
- ✅ `/backend/routes/admin.js` - Added 6 new visa endpoints
- ✅ `/backend/utils/seedVisas.js` - NEW seed script with 39 visas

**Frontend**:
- ✅ `/frontend/app/dashboard/admin/page.js` - Enhanced visa management
- ✅ `/frontend/lib/api.js` - Updated visa API methods
- ✅ `/frontend/components/layout/Footer.js` - Added business address

**Documentation**:
- ✅ `/DYNAMIC_VISA_MANAGEMENT_SYSTEM.md` - Full technical guide
- ✅ `/VISA_MANAGEMENT_QUICK_START.md` - This file

---

## Next Steps

1. ✅ Seed database: `node utils/seedVisas.js`
2. ✅ Start dev server: `npm run dev`
3. ✅ Login to admin dashboard
4. ✅ Test visa management features
5. ✅ Deploy: `git push origin main`

---

## Support

Questions? Check:
- DYNAMIC_VISA_MANAGEMENT_SYSTEM.md (technical details)
- Admin dashboard Visas tab (live UI)
- Backend logs (error messages)
- Frontend console (debug info)

---

**You're all set! 🎉**

Your Visayatri platform now has a fully dynamic visa management system where admins can control all visa countries, pricing, and availability in real-time!
