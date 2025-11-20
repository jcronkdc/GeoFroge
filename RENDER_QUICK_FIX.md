# 🍄 GeoForge Render Backend - Quick Reference

**Last Verified**: 2025-11-20  
**Service**: https://geoforge-backend.onrender.com  
**Status**: ⚠️ LIVE but needs DATABASE_URL

---

## ⚡ IMMEDIATE ACTION (5 minutes)

### What's Wrong
Backend is responding but **all data endpoints return 500 errors** because database is not connected.

### The Fix
1. Get Supabase connection string
2. Set in Render Dashboard → Environment → `DATABASE_URL`
3. Service auto-redeploys (2 min)
4. Run `./test-backend.sh` to verify

---

## 🔐 Get Database Connection String

### Supabase
1. https://supabase.com/dashboard
2. Your project → Settings → Database
3. Copy "Connection string" (Transaction pooler)
4. Replace `[YOUR-PASSWORD]` with your password

Format:
```
postgresql://postgres.xxxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

### Neon (Alternative)
1. https://console.neon.tech
2. Your project → Connection Details
3. Copy PostgreSQL connection string

---

## 🔧 Set in Render

1. https://dashboard.render.com/
2. Select **geoforge-backend**
3. **Environment** tab
4. **Add Environment Variable**
   - Key: `DATABASE_URL`
   - Value: (paste connection string)
5. **Save Changes** (triggers redeploy)

---

## ✅ Verify

```bash
# Wait 2 minutes for redeploy
cd /Users/justincronk/Desktop/GEO
./test-backend.sh
```

Expected: All ✅ instead of ❌

---

## 📊 Current Status

| Endpoint | Status | Issue |
|----------|--------|-------|
| `GET /` | ✅ 200 | Working |
| `GET /docs` | ✅ 200 | Working |
| `GET /api/health` | ⚠️ 200 | Returns `database: disconnected` |
| All data endpoints | ❌ 500 | Need database connection |

---

## 🎯 After Fix

All endpoints should return 200:
- `/api/projects` - List projects
- `/api/drill-holes` - List drill holes
- `/api/assays` - List assays
- `/api/block-models` - List block models
- All 14 endpoints operational

---

## 📝 Files Updated

- ✅ `render.yaml` - Python 3.11, correct frontend URL
- ✅ `backend/runtime.txt` - Python 3.11.9
- ✅ `test-backend.sh` - Verification script (executable)
- ✅ `RENDER_DEPLOYMENT_GUIDE.md` - Full documentation
- ✅ `DEPLOYMENT_CLEAN_INSTRUCTIONS.md` - Complete instructions
- ✅ `GEOLOGICAL_MASTER_DOC.md` - Updated with deployment truth

**Next**: Set DATABASE_URL → Full stack operational ✅

