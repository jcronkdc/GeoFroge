# GeoForge - Quick Reference Card

## 🚀 To Deploy Now
```bash
cd /Users/justincronk/Desktop/GEO
vercel --prod
```
*Note: Set environment variables in Vercel dashboard first (see VERCEL_DEPLOYMENT.md)*

## 🔑 Environment Variables (Set in Vercel Dashboard)

### Supabase
```
VITE_SUPABASE_URL=https://kdqkquhyumqoolvhfzwq.supabase.co
VITE_SUPABASE_ANON_KEY=[see VERCEL_DEPLOYMENT.md]
```

### Neon PostgreSQL
```
DATABASE_URL=[see VERCEL_DEPLOYMENT.md]
POSTGRES_URL=[see VERCEL_DEPLOYMENT.md]
```

### Stack Auth
```
NEXT_PUBLIC_STACK_PROJECT_ID=ae3a3368-63b5-4a29-920c-286e325b6ba4
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=[see VERCEL_DEPLOYMENT.md]
STACK_SECRET_SERVER_KEY=[see VERCEL_DEPLOYMENT.md]
```

## 📊 Database Status
- ✅ Supabase: 8 tables live
- ✅ Demo Project: RED-LAKE-001 (ID: a76821f7-e2be-4ebf-8830-dc9b9b0c02f6)
- ✅ Neon: Backup database configured

## 🔧 Build Commands
```bash
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Production build (currently passing ✅)
npm run preview      # Preview production build
```

## 📁 Key Files
- `GEOLOGICAL_MASTER_DOC.md` - Master truth document
- `VERCEL_DEPLOYMENT.md` - Full deployment instructions
- `DEPLOYMENT_STATUS.md` - Infrastructure status
- `PHASE_2_COMPLETE.md` - Phase 2 summary
- `SESSION_2_COMPLETE.md` - Session summary

## ✅ Current Status
- Build: ✅ PASSING (3.64s)
- Database: ✅ LIVE (Supabase + Neon)
- Auth: ✅ CONFIGURED (Stack Auth)
- Vercel: ⏳ AWAITING ENV VARS
- Next: Service layer implementation

## 🎯 Next Steps
1. Set env vars in Vercel dashboard
2. Deploy with `vercel --prod`
3. Implement service layer (Phase 2b)
4. Integrate Stack Auth
5. Add Daily.co + Ably

---

*Mycelial Status: HEALTHY 🍄*

