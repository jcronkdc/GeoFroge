#!/bin/bash
# Production Deployment Test Script
# Tests all endpoints end-to-end

set -e

echo "🍄 GeoForge Production Testing Suite"
echo "====================================="
echo ""

# Configuration
FRONTEND_URL="${FRONTEND_URL:-https://geoforge-ikrny6o0n-justins-projects-d7153a8c.vercel.app}"
BACKEND_URL="${BACKEND_URL:-https://geoforge-api-production.up.railway.app}"

echo "Frontend: $FRONTEND_URL"
echo "Backend:  $BACKEND_URL"
echo ""

# Test 1: Backend Health
echo "Test 1: Backend Health Check"
echo "-----------------------------"
response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/health")
if [ "$response" = "200" ]; then
    echo "✅ PASS: Backend is healthy"
    curl -s "$BACKEND_URL/api/health" | jq .
else
    echo "❌ FAIL: Backend returned $response"
    exit 1
fi
echo ""

# Test 2: Database Connection
echo "Test 2: Database Connection"
echo "----------------------------"
health=$(curl -s "$BACKEND_URL/api/health" | jq -r '.database')
if [ "$health" = "connected" ]; then
    echo "✅ PASS: Database connected"
else
    echo "❌ FAIL: Database not connected"
    exit 1
fi
echo ""

# Test 3: Projects Endpoint
echo "Test 3: Projects API"
echo "--------------------"
response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/projects")
if [ "$response" = "200" ]; then
    echo "✅ PASS: Projects endpoint working"
    project_count=$(curl -s "$BACKEND_URL/api/projects" | jq '.count')
    echo "   Projects found: $project_count"
else
    echo "❌ FAIL: Projects endpoint returned $response"
    exit 1
fi
echo ""

# Test 4: Block Models Endpoint
echo "Test 4: Block Models API"
echo "------------------------"
response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/block-models")
if [ "$response" = "200" ]; then
    echo "✅ PASS: Block models endpoint working"
else
    echo "❌ FAIL: Block models endpoint returned $response"
fi
echo ""

# Test 5: Frontend Accessibility
echo "Test 5: Frontend Loading"
echo "------------------------"
response=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$response" = "200" ]; then
    echo "✅ PASS: Frontend is accessible"
else
    echo "❌ FAIL: Frontend returned $response"
    exit 1
fi
echo ""

# Test 6: CORS Check
echo "Test 6: CORS Configuration"
echo "--------------------------"
cors_origin=$(curl -s -H "Origin: $FRONTEND_URL" -H "Access-Control-Request-Method: POST" \
    -X OPTIONS "$BACKEND_URL/api/health" -I | grep -i "access-control-allow-origin")

if [ -n "$cors_origin" ]; then
    echo "✅ PASS: CORS headers present"
    echo "   $cors_origin"
else
    echo "⚠️  WARNING: CORS headers not detected"
    echo "   Update CORS origins in backend/main.py"
fi
echo ""

# Summary
echo "================================="
echo "Production Testing Complete"
echo "================================="
echo ""
echo "✅ All critical tests passed"
echo ""
echo "Next steps:"
echo "  1. Test frontend manually: $FRONTEND_URL"
echo "  2. Test grade interpolation feature"
echo "  3. Test resource estimation workflow"
echo "  4. Monitor logs for errors"
echo ""

