# GeoForge - Vercel Environment Variables Setup

## 🔐 Required Environment Variables for Vercel

Copy these variables to: **Vercel Dashboard → Project Settings → Environment Variables**

### Supabase (Primary Database)
```
VITE_SUPABASE_URL=https://kdqkquhyumqoolvhfzwq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkcWtxdWh5dW1xb29sdmhmendxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTUxODEsImV4cCI6MjA3OTIzMTE4MX0.7RpbOz5b9m-ghO3mdUVQbEaGme1wK-tU5GLAvoDTinQ
```

### Neon PostgreSQL (Backup Database)
```
DATABASE_URL=postgresql://neondb_owner:npg_mQuliogp13Jq@ep-winter-bar-a4a1qat6-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_URL=postgresql://neondb_owner:npg_mQuliogp13Jq@ep-winter-bar-a4a1qat6-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_PRISMA_URL=postgresql://neondb_owner:npg_mQuliogp13Jq@ep-winter-bar-a4a1qat6-pooler.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require
```

### Neon Auth (Stack Auth)
```
NEXT_PUBLIC_STACK_PROJECT_ID=ae3a3368-63b5-4a29-920c-286e325b6ba4
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pck_c7e77hn25vmth3309tystth5xqz3pf0n5f6qcbsv2ry60
STACK_SECRET_SERVER_KEY=ssk_j12vjjwwebd5jpbehrgghkptk84ppqgndw43snev8nrc8
```

### Environment
```
NODE_ENV=production
```

### Phase 2 - Video/Chat (Add when ready)
```
VITE_DAILY_API_KEY=(add when available)
VITE_ABLY_API_KEY=(add when available)
```

---

## 🚀 Deployment Commands

### Deploy to Vercel
```bash
cd /Users/justincronk/Desktop/GEO
vercel --prod
```

### Or link and deploy
```bash
vercel link
vercel --prod
```

---

## ✅ Pre-Deployment Checklist

- [x] Database schema deployed (Supabase - 8 tables)
- [x] Demo data seeded (RED-LAKE-001)
- [x] Neon PostgreSQL configured (backup)
- [x] Neon Auth credentials configured (Stack Auth)
- [x] Vercel project linked (prj_ZvohxezuUeNbX8VUo2cldzELlQVd)
- [x] vercel.json configuration created
- [ ] Environment variables set in Vercel dashboard
- [ ] First deployment to Vercel
- [ ] Test live deployment URL
- [ ] Verify database connectivity from deployed app

---

## 🔍 Verification Steps

After deploying:

1. **Check Build Logs**: Verify no errors in Vercel build
2. **Test Database Connection**: App should connect to Supabase
3. **Verify Demo Data**: Red Lake Gold Project should appear
4. **Check Auth Flow**: Stack Auth integration working
5. **Test Collaboration**: Video/chat placeholders functional

---

## 🌐 Expected Deployment URL

`https://geoforge-[hash].vercel.app` or custom domain

---

## 📊 Database Connection Test

Once deployed, the app should:
1. Connect to Supabase at `kdqkquhyumqoolvhfzwq.supabase.co`
2. Query `exploration_projects` table
3. Display "Red Lake Gold Project" in dashboard
4. Show drill holes, core logs (when components wired)

---

**Status**: Ready for deployment (environment variables need to be set in Vercel dashboard)

