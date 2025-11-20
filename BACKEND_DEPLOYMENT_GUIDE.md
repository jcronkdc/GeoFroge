# 🚀 BACKEND DEPLOYMENT GUIDE - PRODUCTION READY

**Status**: Ready for deployment  
**Options**: Railway (recommended), Render, Docker/Cloud Run

---

## 📋 PRE-DEPLOYMENT CHECKLIST

- ✅ Backend code complete (`/backend/main.py`)
- ✅ Requirements.txt updated
- ✅ Dockerfile created
- ✅ Procfile created
- ✅ Runtime.txt created
- ⏳ Database URL (Supabase/Neon)
- ⏳ CORS origins updated for production

---

## OPTION 1: RAILWAY (RECOMMENDED - FASTEST)

### Why Railway?
- ✅ Automatic deployment from GitHub
- ✅ Free tier (500 hours/month)
- ✅ Built-in PostgreSQL
- ✅ Automatic HTTPS
- ✅ Easy rollbacks

### Deployment Steps:

#### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

#### 2. Login
```bash
railway login
```

#### 3. Navigate to backend directory
```bash
cd /Users/justincronk/Desktop/GEO/backend
```

#### 4. Initialize Railway project
```bash
railway init
# Select: "Create new project"
# Name: geoforge-api
```

#### 5. Add PostgreSQL (if not using Supabase)
```bash
railway add
# Select: PostgreSQL
```

#### 6. Set environment variables
```bash
railway variables set DATABASE_URL="postgresql://..."
```

Or via Railway dashboard:
- Go to https://railway.app
- Select project
- Variables tab
- Add: `DATABASE_URL`

#### 7. Deploy
```bash
railway up
```

#### 8. Get deployment URL
```bash
railway domain
```

Expected output: `https://geoforge-api-production.up.railway.app`

---

## OPTION 2: RENDER

### Why Render?
- ✅ Free tier
- ✅ Automatic deployments from Git
- ✅ Easy to use
- ✅ Built-in databases

### Deployment Steps:

#### 1. Go to https://render.com

#### 2. New Web Service

#### 3. Connect GitHub repository
- Repository: `GeoFroge`
- Branch: `main`
- Root Directory: `backend`

#### 4. Configure service
```
Name: geoforge-api
Environment: Python 3
Region: Oregon (US West) or closest to Supabase
Branch: main
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT --workers 2
```

#### 5. Environment Variables
Add in Render dashboard:
```
DATABASE_URL = postgresql://...
```

#### 6. Deploy
Click "Create Web Service"

Expected URL: `https://geoforge-api.onrender.com`

---

## OPTION 3: DOCKER + GOOGLE CLOUD RUN

### Why Cloud Run?
- ✅ Serverless (only pay when used)
- ✅ Auto-scaling
- ✅ Google Cloud infrastructure
- ✅ Generous free tier

### Deployment Steps:

#### 1. Install Google Cloud SDK
```bash
# macOS
brew install google-cloud-sdk
```

#### 2. Initialize gcloud
```bash
gcloud init
gcloud auth login
```

#### 3. Set project
```bash
gcloud config set project YOUR_PROJECT_ID
```

#### 4. Enable Cloud Run API
```bash
gcloud services enable run.googleapis.com
```

#### 5. Build and deploy
```bash
cd /Users/justincronk/Desktop/GEO/backend

gcloud run deploy geoforge-api \
  --source . \
  --platform managed \
  --region us-west1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="postgresql://..."
```

Expected URL: `https://geoforge-api-xxxxx-uw.a.run.app`

---

## 🔧 POST-DEPLOYMENT CONFIGURATION

### 1. Update CORS in backend/main.py

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://*.vercel.app",
        "https://geoforge-ikrny6o0n-justins-projects-d7153a8c.vercel.app",  # Your production URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. Redeploy backend
```bash
# Railway
railway up

# Render
git push origin main  # Auto-deploys

# Cloud Run
gcloud run deploy geoforge-api --source .
```

### 3. Update Vercel environment variables

Go to: https://vercel.com/justins-projects-d7153a8c/geoforge/settings/environment-variables

Add/Update:
```
VITE_API_URL = https://geoforge-api-production.up.railway.app
# OR
VITE_API_URL = https://geoforge-api.onrender.com
# OR
VITE_API_URL = https://geoforge-api-xxxxx-uw.a.run.app
```

### 4. Redeploy Vercel frontend
```bash
cd /Users/justincronk/Desktop/GEO
vercel deploy --prod
```

---

## 🗄️ DATABASE MIGRATION

### Run Phase 5 Migration on Production

#### Option A: Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. SQL Editor
4. Paste contents of `/migrations/005_block_model_schema.sql`
5. Run

#### Option B: psql Command Line
```bash
# Get connection string from Supabase/Neon
psql "postgresql://postgres:[password]@[host]:5432/postgres" \
  -f /Users/justincronk/Desktop/GEO/migrations/005_block_model_schema.sql
```

#### Option C: Database URL
```bash
psql $DATABASE_URL -f migrations/005_block_model_schema.sql
```

---

## 🧪 TESTING PRODUCTION DEPLOYMENT

### 1. Test Backend Health
```bash
curl https://YOUR_BACKEND_URL/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "postgis": "available"
}
```

### 2. Test Frontend Connection
1. Go to: https://geoforge-ikrny6o0n-justins-projects-d7153a8c.vercel.app
2. Open browser console (F12)
3. Navigate to Dashboard
4. Check for API calls to your backend URL
5. Verify no CORS errors

### 3. Test Grade Interpolation (Phase 4)
1. Navigate to: `/projects/{projectId}/grade-interpolation`
2. Select element (Au)
3. Click "Run Interpolation"
4. Verify heatmap renders

### 4. Test Resource Estimation (Phase 5)
1. Navigate to: `/projects/{projectId}/resource-estimation`
2. Create block model
3. Estimate grades
4. Verify 3D viewer works

---

## 🐛 TROUBLESHOOTING

### Backend won't start
```bash
# Check logs
railway logs  # Railway
# Or Render dashboard → Logs tab
```

Common issues:
- Missing DATABASE_URL
- Wrong Python version
- Missing dependencies in requirements.txt

### CORS errors in frontend
- Add production frontend URL to CORS origins
- Redeploy backend

### Database connection failed
- Verify DATABASE_URL is correct
- Check Supabase/Neon connection limits
- Ensure PostGIS extension is enabled

### 502 Bad Gateway
- Backend crashed
- Check logs for Python errors
- Verify all imports work

---

## 📊 DEPLOYMENT STATUS TRACKING

Create file: `/backend/.railway.json` (if using Railway)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT --workers 2",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## ✅ SUCCESS CRITERIA

- [ ] Backend accessible at HTTPS URL
- [ ] `/api/health` returns 200 OK
- [ ] Database connection works
- [ ] Frontend can call backend APIs
- [ ] No CORS errors
- [ ] Phase 4 features work (grade interpolation)
- [ ] Phase 5 features work (resource estimation)
- [ ] 3D viewer renders correctly

---

## 🚀 QUICK START (Copy-Paste Commands)

### Using Railway:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Navigate to backend
cd /Users/justincronk/Desktop/GEO/backend

# Initialize and deploy
railway init
railway variables set DATABASE_URL="YOUR_DATABASE_URL"
railway up

# Get URL
railway domain
```

### Update Vercel:
```bash
# Set backend URL on Vercel
vercel env add VITE_API_URL production

# When prompted, paste your Railway URL:
# https://geoforge-api-production.up.railway.app

# Redeploy
vercel deploy --prod
```

---

## 🍄 MYCELIAL STATUS

**Backend**: Ready for deployment  
**Configuration**: Complete  
**Database**: Migration ready  
**Frontend**: Awaiting backend URL  

**Next Command**: Choose deployment platform and execute 🚀

