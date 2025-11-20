#!/bin/bash
# Test Production API Endpoints
# For: Dome Mountain Gold Mine

BACKEND_URL="${BACKEND_URL:-https://geoforge-backend.onrender.com}"

echo "🧪 Testing Production API Endpoints"
echo "Backend: $BACKEND_URL"
echo ""

# Test 1: Get production records
echo "1️⃣  GET /api/production/records"
curl -s "$BACKEND_URL/api/production/records?limit=5" | jq '.' || echo "❌ Failed"
echo ""

# Test 2: Get production summary (need project ID)
echo "2️⃣  GET /api/projects (to get Dome Mountain ID)"
PROJECT_ID=$(curl -s "$BACKEND_URL/api/projects" | jq -r '.projects[0].id')
echo "Project ID: $PROJECT_ID"
echo ""

if [ -n "$PROJECT_ID" ] && [ "$PROJECT_ID" != "null" ]; then
    echo "3️⃣  GET /api/production/summary?project_id=$PROJECT_ID"
    curl -s "$BACKEND_URL/api/production/summary?project_id=$PROJECT_ID" | jq '.' || echo "❌ Failed"
    echo ""
    
    echo "4️⃣  GET /api/production/targets?project_id=$PROJECT_ID"
    curl -s "$BACKEND_URL/api/production/targets?project_id=$PROJECT_ID" | jq '.' || echo "❌ Failed"
    echo ""
fi

echo "✅ Production API test complete"

