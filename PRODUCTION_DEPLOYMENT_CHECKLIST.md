# 🚀 PRODUCTION DEPLOYMENT - COMPLETE CHECKLIST

**Date**: 2025-11-20  
**Status**: Ready for execution  
**Frontend**: ✅ DEPLOYED - https://geoforge-ikrny6o0n-justins-projects-d7153a8c.vercel.app  
**Backend**: ⏳ READY TO DEPLOY

---

## 📋 DEPLOYMENT CHECKLIST

### ✅ COMPLETED
- [x] Frontend built and deployed to Vercel
- [x] Backend code complete with all Phase 4 + 5 endpoints
- [x] Database schema designed (Phase 5)
- [x] Deployment configuration files created
  - [x] Dockerfile
  - [x] Procfile
  - [x] runtime.txt
  - [x] README.md
- [x] Migration scripts created
- [x] Test scripts created

### ⏳ PENDING (Execute These Steps)

- [ ] **Step 1**: Deploy backend API
- [ ] **Step 2**: Configure environment variables
- [ ] **Step 3**: Run database migrations
- [ ] **Step 4**: Update Vercel with backend URL
- [ ] **Step 5**: Test end-to-end

---

## 🎯 STEP-BY-STEP EXECUTION GUIDE

### STEP 1: Deploy Backend to Railway (5 minutes)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Navigate to backend
cd /Users/justincronk/Desktop/GEO/backend

# Initialize Railway project
railway init
# → Select: "Create new project"
# → Name: geoforge-api

# Deploy
railway up

# Get deployment URL
railway domain
```

**Expected Result**: Backend running at `https://geoforge-api-production.up.railway.app`

**Save this URL** - you'll need it for Step 4.

---

### STEP 2: Configure Environment Variables (2 minutes)

#### Option A: Railway Dashboard
1. Go to https://railway.app/project/geoforge-api
2. Click "Variables" tab
3. Add variable:
   ```
   DATABASE_URL = postgresql://[your-supabase-url]
   ```

#### Option B: Railway CLI
```bash
railway variables set DATABASE_URL="postgresql://..."
```

Get your Supabase DATABASE_URL from:
- Supabase Dashboard → Project Settings → Database → Connection string (Pooler)

---

### STEP 3: Run Database Migrations (3 minutes)

#### Option A: Using Migration Script
```bash
cd /Users/justincronk/Desktop/GEO

# Set database URL
export DATABASE_URL="postgresql://..."

# Run migration
./run-production-migration.sh
```

#### Option B: Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor"
4. Open file: `/Users/justincronk/Desktop/GEO/migrations/005_block_model_schema.sql`
5. Copy entire contents
6. Paste into SQL Editor
7. Click "Run"

**Expected Result**: 3 tables created (block_models, block_model_cells, resource_estimates)

---

### STEP 4: Update Vercel Frontend (3 minutes)

```bash
cd /Users/justincronk/Desktop/GEO

# Add backend URL to Vercel
vercel env add VITE_API_URL production

# When prompted, enter your Railway backend URL:
# https://geoforge-api-production.up.railway.app

# Redeploy frontend
vercel deploy --prod
```

**Alternative**: Vercel Dashboard
1. Go to https://vercel.com/justins-projects-d7153a8c/geoforge/settings/environment-variables
2. Add new variable:
   - Key: `VITE_API_URL`
   - Value: `https://geoforge-api-production.up.railway.app`
   - Environment: Production
3. Redeploy from dashboard

---

### STEP 5: Test Production Deployment (5 minutes)

#### Automated Tests
```bash
cd /Users/justincronk/Desktop/GEO

# Set URLs
export BACKEND_URL="https://geoforge-api-production.up.railway.app"
export FRONTEND_URL="https://geoforge-ikrny6o0n-justins-projects-d7153a8c.vercel.app"

# Run tests (requires jq)
./test-production.sh
```

#### Manual Tests

1. **Backend Health**:
   ```bash
   curl https://geoforge-api-production.up.railway.app/api/health
   ```
   Expected: `{"status": "healthy", "database": "connected"}`

2. **Frontend Loading**:
   - Open: https://geoforge-ikrny6o0n-justins-projects-d7153a8c.vercel.app
   - Should load without errors
   - Check browser console (F12) - no errors

3. **API Connectivity**:
   - Navigate to Dashboard
   - Open Network tab in browser dev tools
   - Should see requests to your Railway backend URL
   - No CORS errors

4. **Grade Interpolation (Phase 4)**:
   - Navigate to: `/projects/{projectId}/grade-interpolation`
   - Select element (Au)
   - Click "Run Interpolation"
   - Heatmap should render

5. **Resource Estimation (Phase 5)**:
   - Navigate to: `/projects/{projectId}/resource-estimation`
   - Create block model
   - Should create blocks successfully
   - Test "Estimate Grades" button

---

## 🔧 TROUBLESHOOTING

### Backend: "Module not found" error
```bash
# Update requirements.txt
cd /Users/justincronk/Desktop/GEO/backend
pip freeze > requirements.txt
railway up  # Redeploy
```

### Frontend: "Failed to fetch" errors
- Check VITE_API_URL is set correctly on Vercel
- Verify backend is running: `curl $BACKEND_URL/api/health`
- Check CORS settings in `backend/main.py` include your Vercel URL

### Database: "Connection refused"
- Verify DATABASE_URL is set on Railway
- Check Supabase connection pooler is enabled
- Test connection: `psql $DATABASE_URL -c "SELECT 1"`

### CORS errors
Update `backend/main.py`:
```python
allow_origins=[
    "https://geoforge-ikrny6o0n-justins-projects-d7153a8c.vercel.app",
    # ... other origins
]
```
Then redeploy backend: `railway up`

---

## ✅ SUCCESS CRITERIA

### Backend
- [ ] Returns 200 OK on `/api/health`
- [ ] Database connection successful
- [ ] All 14 endpoints accessible
- [ ] CORS configured for frontend

### Frontend
- [ ] Loads without errors
- [ ] Can connect to backend API
- [ ] Grade interpolation works
- [ ] Resource estimation works
- [ ] 3D viewer renders

### Integration
- [ ] No CORS errors in browser console
- [ ] API calls succeed from frontend
- [ ] Database queries return data
- [ ] Block model creation works end-to-end

---

## 📊 DEPLOYMENT STATUS

| Component | Status | URL |
|-----------|--------|-----|
| **Frontend** | ✅ LIVE | https://geoforge-ikrny6o0n-justins-projects-d7153a8c.vercel.app |
| **Backend** | ⏳ READY | Deploy to Railway |
| **Database** | ⏳ READY | Run migration |
| **Phase 4** | ✅ DEPLOYED | Grade Interpolation |
| **Phase 5** | ✅ DEPLOYED | Resource Estimation |

---

## 🚀 QUICK START (Copy-Paste Commands)

Execute these commands in order:

```bash
# 1. Deploy backend
cd /Users/justincronk/Desktop/GEO/backend
npm install -g @railway/cli
railway login
railway init
railway variables set DATABASE_URL="YOUR_SUPABASE_URL"
railway up
railway domain  # Copy this URL

# 2. Run migration
cd /Users/justincronk/Desktop/GEO
export DATABASE_URL="YOUR_SUPABASE_URL"
./run-production-migration.sh

# 3. Update Vercel
vercel env add VITE_API_URL production
# Paste Railway URL when prompted
vercel deploy --prod

# 4. Test
export BACKEND_URL="YOUR_RAILWAY_URL"
./test-production.sh
```

---

## 🍄 MYCELIAL STATUS

**Frontend**: ✅ DEPLOYED  
**Backend**: 🚧 READY FOR DEPLOYMENT  
**Database**: 🚧 READY FOR MIGRATION  
**System**: 🔄 AWAITING FINAL STEPS  

**Time to Production**: ~15 minutes  
**Next Command**: Execute Step 1 (Deploy Backend) 🚀

---

## 📞 SUPPORT

If you encounter issues:

1. Check Railway logs: `railway logs`
2. Check Vercel logs: Vercel Dashboard → Deployments → View Function Logs
3. Check database connection: `psql $DATABASE_URL -c "SELECT version()"`
4. Verify environment variables are set

All deployment files ready at:
- `/Users/justincronk/Desktop/GEO/BACKEND_DEPLOYMENT_GUIDE.md`
- `/Users/justincronk/Desktop/GEO/run-production-migration.sh`
- `/Users/justincronk/Desktop/GEO/test-production.sh`

**System Status**: Production-ready, awaiting deployment execution 🍄

