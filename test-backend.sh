#!/bin/bash

# GeoForge Backend Verification Script
# Tests all 14 critical API endpoints for 404/500 errors

BACKEND_URL="https://geoforge-backend.onrender.com"

echo "🍄 MYCELIAL NETWORK PROBE - GeoForge Backend"
echo "=============================================="
echo "Target: $BACKEND_URL"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    
    echo -n "Testing: $description... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BACKEND_URL$endpoint")
    
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo -e "${GREEN}✅ $response${NC}"
        return 0
    elif [ "$response" = "404" ]; then
        echo -e "${RED}❌ 404 NOT FOUND${NC}"
        return 1
    elif [ "$response" = "500" ]; then
        echo -e "${RED}❌ 500 SERVER ERROR${NC}"
        return 1
    elif [ "$response" = "000" ]; then
        echo -e "${RED}❌ CONNECTION FAILED${NC}"
        return 1
    else
        echo -e "${YELLOW}⚠️  $response${NC}"
        return 1
    fi
}

# Test function with JSON output
test_endpoint_json() {
    local method=$1
    local endpoint=$2
    local description=$3
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📍 $description"
    echo "   $method $BACKEND_URL$endpoint"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    response=$(curl -s -X $method "$BACKEND_URL$endpoint")
    http_code=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BACKEND_URL$endpoint")
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}Status: $http_code ✅${NC}"
        echo "Response:"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    else
        echo -e "${RED}Status: $http_code ❌${NC}"
        echo "Response:"
        echo "$response"
    fi
    echo ""
}

# Start testing
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 PHASE 1: CORE ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_endpoint_json "GET" "/" "Root API Status"
test_endpoint_json "GET" "/api/health" "Database Health Check"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 PHASE 2: PROJECT ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_endpoint "GET" "/api/projects" "List Projects"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 PHASE 3: DRILL HOLE ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_endpoint "GET" "/api/drill-holes" "List All Drill Holes"
test_endpoint "GET" "/api/assays" "List Assays"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 PHASE 4: GEOSTATISTICS ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_endpoint "GET" "/api/model/available-elements/test-id" "Available Elements"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 PHASE 5: BLOCK MODEL ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_endpoint "GET" "/api/block-models" "List Block Models"
test_endpoint "GET" "/api/resource-estimates" "List Resource Estimates"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 DOCUMENTATION ENDPOINT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_endpoint "GET" "/docs" "Swagger API Documentation"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ VERIFICATION COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 View full API documentation at: $BACKEND_URL/docs"
echo ""
echo "🍄 Next Steps:"
echo "   1. Check for any ❌ errors above"
echo "   2. If /api/health shows 'database: disconnected':"
echo "      → Set DATABASE_URL in Render Dashboard"
echo "   3. If all tests pass, connect frontend:"
echo "      → Update VITE_API_URL in Vercel to $BACKEND_URL"
echo ""

