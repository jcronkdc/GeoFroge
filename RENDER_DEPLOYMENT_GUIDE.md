# 🚀 RENDER DEPLOYMENT GUIDE - GeoForge Backend

**Status**: Clean Infrastructure as Code Approach  
**Date**: 2025-11-20  
**Service**: geoforge-backend

---

## ✅ CLEAN DEPLOYMENT APPROACH

### Step 1: Render Blueprint (Infrastructure as Code)

Your repository contains `render.yaml` which defines the entire infrastructure. Render can auto-detect this.

**Two Options:**

#### Option A: Render Dashboard (Recommended for First Deploy)
1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Blueprint"**
3. Connect to repository: `jcronkdc/GeoFroge`
4. Branch: `main`
5. Render will detect `render.yaml` automatically
6. Click **"Apply"**

#### Option B: Manual Service Creation
1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Web Service"**
3. Connect to repository: `jcronkdc/GeoFroge`
4. Configure settings:
   - **Name**: `geoforge-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Starter` (Free)

---

## 🔐 REQUIRED ENVIRONMENT VARIABLES

**⚠️ CRITICAL: You must set these in Render Dashboard → Environment**

### Required Variables:

```bash
# PostgreSQL Database Connection (Supabase/Neon)
DATABASE_URL=postgresql://username:password@host:5432/database

# Frontend URL for CORS
FRONTEND_URL=https://geoforge-ikrny6o0n-justins-projects-d7153a8c.vercel.app

# Python Version (optional - auto-detected from runtime.txt)
PYTHON_VERSION=3.11
```

### How to Set Variables:
1. Go to your service → **Settings** → **Environment**
2. Click **"Add Environment Variable"**
3. Add `DATABASE_URL` with your Supabase connection string
4. Add `FRONTEND_URL` with your Vercel URL
5. Click **"Save Changes"**
6. Service will auto-redeploy

---

## 🧪 VERIFICATION SCRIPT

After deployment, test the backend with this script:

```bash
# Save this as test-backend.sh
chmod +x test-backend.sh
./test-backend.sh
```

### test-backend.sh:

```bash
#!/bin/bash

BACKEND_URL="https://geoforge-backend.onrender.com"

echo "🍄 Testing GeoForge Backend Pathways..."
echo ""

# Test 1: Root endpoint
echo "1️⃣ Testing root endpoint..."
curl -s $BACKEND_URL | jq '.'
echo ""

# Test 2: Health check (database connection)
echo "2️⃣ Testing health check..."
curl -s $BACKEND_URL/api/health | jq '.'
echo ""

# Test 3: Projects endpoint
echo "3️⃣ Testing projects endpoint..."
curl -s $BACKEND_URL/api/projects | jq '.'
echo ""

# Test 4: Swagger docs (should return HTML)
echo "4️⃣ Testing API documentation..."
curl -s -I $BACKEND_URL/docs | grep -i "200\|301\|302"
echo ""

echo "✅ All pathways tested. Check for 404/500 errors above."
echo "🌐 View full API docs at: $BACKEND_URL/docs"
```

---

## 🔍 ENDPOINT VERIFICATION CHECKLIST

Test each endpoint manually or use the script:

### Core Endpoints:
- [ ] `GET /` - API status
- [ ] `GET /api/health` - Database connection check
- [ ] `GET /docs` - Swagger UI documentation

### Project Endpoints:
- [ ] `GET /api/projects` - List all projects
- [ ] `GET /api/projects/{id}` - Get single project
- [ ] `POST /api/projects` - Create new project

### Drill Hole Endpoints:
- [ ] `GET /api/drill-holes?project_id={id}` - List drill holes
- [ ] `GET /api/drill-holes/{id}` - Get single drill hole
- [ ] `POST /api/drill-holes` - Create drill hole
- [ ] `GET /api/drill-holes/3d/{project_id}` - 3D visualization data

### Assay Endpoints:
- [ ] `GET /api/assays?drill_hole_id={id}` - Get assays

### Geostatistics Endpoints:
- [ ] `POST /api/model/section-grade` - Grade interpolation (kriging)
- [ ] `GET /api/model/available-elements/{project_id}` - Available elements

### Block Model Endpoints:
- [ ] `POST /api/block-models/create` - Create 3D block model
- [ ] `POST /api/block-models/{id}/estimate` - Estimate grades
- [ ] `GET /api/block-models` - List block models
- [ ] `GET /api/block-models/{id}/blocks` - Get blocks for 3D view
- [ ] `POST /api/block-models/{id}/classify` - Classify resources

### Resource Estimation Endpoints:
- [ ] `POST /api/resource-estimates/create` - Generate resource report
- [ ] `GET /api/resource-estimates` - List estimates

---

## 🚨 COMMON DEPLOYMENT ERRORS

### Error: "Failed to fetch projects: database connection failed"
**Cause**: `DATABASE_URL` not set or invalid  
**Fix**: 
1. Go to Supabase Dashboard → Settings → Database
2. Copy connection string (Transaction pooler)
3. Add to Render Environment Variables
4. Redeploy

### Error: "No module named 'fastapi'"
**Cause**: Build command failed or `requirements.txt` not found  
**Fix**: 
- Ensure `Root Directory` is set to `backend`
- Check build logs for pip install errors

### Error: "Port already in use"
**Cause**: Start command not using `$PORT` variable  
**Fix**: 
- Start command MUST be: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Error: CORS issues from frontend
**Cause**: Frontend URL not in CORS allowed origins  
**Fix**: 
- Ensure `FRONTEND_URL` env var is set correctly
- Check `main.py` CORS middleware configuration

---

## 📊 DEPLOYMENT STATUS

After deployment completes, you should see:

```
✅ Build: SUCCESS
✅ Deploy: LIVE
✅ Service: Running on https://geoforge-backend.onrender.com
```

**Expected Response from `/api/health`:**
```json
{
  "status": "healthy",
  "database": "connected",
  "postgis": "available"
}
```

---

## 🔗 CONNECT BACKEND TO FRONTEND

Once backend is live, update Vercel environment variable:

1. Go to Vercel Dashboard → geoforge → Settings → Environment Variables
2. Update `VITE_API_URL` to: `https://geoforge-backend.onrender.com`
3. Redeploy frontend (Deployments → Redeploy)

---

## 🍄 MYCELIAL PATHWAY - END-TO-END FLOW

```
User visits: https://geoforge-ikrny6o0n-justins-projects-d7153a8c.vercel.app
   ↓
Frontend loads (Vercel)
   ↓
Frontend reads VITE_API_URL from build-time env
   ↓
User navigates to Projects page
   ↓
Frontend calls: GET https://geoforge-backend.onrender.com/api/projects
   ↓
Backend (Render) receives request
   ↓
FastAPI checks CORS (allows Vercel domain)
   ↓
Backend connects to DATABASE_URL (Supabase)
   ↓
Executes: SELECT * FROM exploration_projects
   ↓
Returns JSON: {projects: [...], count: N}
   ↓
Frontend displays projects in UI
   ↓
✅ Full stack operational
```

---

## 🛠️ NEXT STEPS

1. **Deploy Backend**: Use Blueprint or manual creation
2. **Set Environment Variables**: DATABASE_URL + FRONTEND_URL
3. **Verify Deployment**: Run test script
4. **Update Frontend**: Set VITE_API_URL in Vercel
5. **Test End-to-End**: Create test project via UI

**Status**: Configuration files ready, awaiting deployment trigger

---

## 📝 NOTES

- Render Free Tier: Service spins down after 15 min inactivity (first request takes 30-60s)
- Database migrations needed: Run `migrations/*.sql` on production database
- Logs: View in Render Dashboard → geoforge-backend → Logs
- Health check path: Not configured in render.yaml (optional: add `/api/health`)


