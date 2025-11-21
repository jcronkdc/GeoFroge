#!/bin/bash
# Apply Vein System Migration (008) to Neon Database
# Phase A2: Vein tracking for Dome Mountain Gold Mine

set -e  # Exit on error

echo "🍄 GeoForge Vein System Migration"
echo "=========================================="
echo ""

# Neon database connection from master doc
DATABASE_URL="postgresql://neondb_owner@ep-winter-bar-a4a1qat6-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Check if we need password
echo "✅ DATABASE_URL configured (Neon PostgreSQL)"
echo ""

# Confirm before proceeding
echo "⚠️  WARNING: This will modify your Neon database"
echo "Migration: 008_vein_system_tracking_schema.sql"
echo ""
echo "This will create:"
echo "  - vein_systems table (tracking 15+ veins)"
echo "  - vein_intersections table (drill hole intercepts)"
echo "  - v_vein_summary view"
echo "  - v_high_grade_intersections view"
echo "  - Trigger functions for auto-updates"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Migration cancelled"
    exit 0
fi

echo ""
echo "🚀 Running migration..."
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ ERROR: psql command not found"
    echo ""
    echo "Install PostgreSQL client:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt install postgresql-client"
    echo ""
    exit 1
fi

# Run migration
psql "$DATABASE_URL" -f migrations/008_vein_system_tracking_schema.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📊 Verifying tables..."
    psql "$DATABASE_URL" -c "\dt vein*"
    echo ""
    echo "📊 Verifying views..."
    psql "$DATABASE_URL" -c "\dv v_vein*"
    echo ""
    echo "✅ Vein System ready - Backend endpoints at /api/veins"
else
    echo ""
    echo "❌ Migration failed. Check errors above."
    exit 1
fi

