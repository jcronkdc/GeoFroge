#!/bin/bash

# GeoForge - Supabase Migration Runner
# This script helps you run the database migration

echo "🍄 GEOFORGE - SUPABASE MIGRATION"
echo "═══════════════════════════════════════"
echo ""
echo "📋 Migration File: migrations/001_geological_core_schema.sql"
echo "📊 Lines: $(wc -l < migrations/001_geological_core_schema.sql)"
echo ""
echo "🎯 EASIEST METHOD: Supabase Dashboard"
echo ""
echo "STEPS:"
echo "1. Open: https://supabase.com/dashboard/project/kdqkquhyumqoolvhfzwq"
echo "2. Click: SQL Editor (left sidebar)"
echo "3. Click: New Query"
echo "4. Copy content from: migrations/001_geological_core_schema.sql"
echo "5. Paste into SQL Editor"
echo "6. Click: Run"
echo ""
echo "═══════════════════════════════════════"
echo ""
echo "Opening migration file..."
cat migrations/001_geological_core_schema.sql | head -20
echo ""
echo "... (682 total lines)"
echo ""
echo "Copy the ENTIRE file content and paste into Supabase SQL Editor!"

