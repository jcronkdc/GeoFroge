# 🎯 QUICK START - PHASE 3 SUPABASE

**Token**: 136,803 / 200,000 (68%)

---

## ⚡ 3-MINUTE SETUP

### STEP 1: Run Migration (2 minutes)

**Go to**: https://supabase.com/dashboard/project/kdqkquhyumqoolvhfzwq/sql/new

**Copy this file**: `migrations/001_geological_core_schema.sql`

**Paste & Run** in SQL Editor

**Expected**: ✅ "Success. No rows returned"

---

### STEP 2: Create Test Project (30 seconds)

**Run in SQL Editor:**
```sql
INSERT INTO exploration_projects (
  project_code, project_name, project_type, 
  commodity_target, country, status
) VALUES (
  'TEST-001', 'Demo Gold Project', 'exploration',
  ARRAY['Gold', 'Silver'], 'USA', 'active'
) RETURNING *;
```

**Expected**: Returns project data with UUID

---

### STEP 3: Verify (30 seconds)

**Run in SQL Editor:**
```sql
SELECT COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
```

**Expected**: `table_count: 8`

---

## ✅ THAT'S IT!

Database is now connected. Next:
- Connect React components to Supabase
- Replace mock data with real queries
- Implement authentication

---

**Need help? Check**: `PHASE_3_SUPABASE_MIGRATION.md`

