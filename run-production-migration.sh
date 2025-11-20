#!/bin/bash
# Production Database Migration Script
# Runs Phase 5 block model schema on production database

set -e  # Exit on error

echo "🍄 GeoForge Production Database Migration"
echo "=========================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable not set"
    echo ""
    echo "Please set DATABASE_URL first:"
    echo "  export DATABASE_URL='postgresql://user:pass@host:5432/dbname'"
    echo ""
    exit 1
fi

echo "✅ DATABASE_URL found"
echo ""

# Confirm before proceeding
echo "⚠️  WARNING: This will modify your production database"
echo "Migration: 005_block_model_schema.sql"
echo ""
echo "This will create:"
echo "  - block_models table"
echo "  - block_model_cells table"
echo "  - resource_estimates table"
echo "  - v_block_model_summary view"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Migration cancelled"
    exit 0
fi

echo ""
echo "🚀 Running migration..."
echo ""

# Run migration
psql "$DATABASE_URL" -f migrations/005_block_model_schema.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📊 Verifying tables..."
    psql "$DATABASE_URL" -c "\dt block*"
    psql "$DATABASE_URL" -c "\dt resource*"
    echo ""
    echo "✅ Phase 5 database ready for production"
else
    echo ""
    echo "❌ Migration failed. Check errors above."
    exit 1
fi

