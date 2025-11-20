# 🌍 GeoForge - Open-Source Micromine Alternative

**Modern cloud-native geological data management and mine production tracking platform**

[![Status](https://img.shields.io/badge/status-production--ready-brightgreen)]()
[![Build](https://img.shields.io/badge/build-passing-success)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

> **Real Project**: Currently supporting **Dome Mountain Gold Mine** (Blue Lagoon Resources, CSE: BLLG) - Moving to production July 2025

---

## 🚀 **Live Deployment**

- **Frontend**: [https://geoforge-ikrny6o0n-justins-projects-d7153a8c.vercel.app](https://geoforge-ikrny6o0n-justins-projects-d7153a8c.vercel.app)
- **Backend API**: [https://geoforge-backend.onrender.com](https://geoforge-backend.onrender.com)
- **API Docs**: [https://geoforge-backend.onrender.com/docs](https://geoforge-backend.onrender.com/docs)
- **Database**: Neon PostgreSQL (PostGIS enabled)

---

## ✨ **Key Features**

### 🏭 **PRODUCTION TRACKING** (Phase A1 - NEW!)
*Built specifically for Dome Mountain Gold Mine's July 2025 production start*

- **Daily/Shift Production Logging** - 30-second entry for shift supervisors
  - Ore/waste tonnes per shift
  - Gold/silver grades (Au, Ag g/t)
  - Stope location tracking (Boulder Vein Level 1, etc.)
  - Contractor assignment (Roughstock Mining, Cobra Mining)
  - Safety incidents & downtime tracking

- **Production Dashboard** - Real-time KPIs
  - Total ore mined (tonnes)
  - Average Au/Ag grades (g/t)
  - Estimated gold recovery (oz)
  - Target achievement % (15,000 oz Au/year target)

- **Mill Processing Integration** - Nicola Mining Inc. tracking
  - Feed tonnage & grades
  - Recovery rates (85% Au target)
  - Concentrate production
  - Processing costs per tonne

- **Production Targets & Reporting**
  - Annual targets (15,000 oz Au/year)
  - Monthly breakdown (1,250 oz/month)
  - Production vs. target analysis
  - Variance tracking

### 🪨 **VEIN SYSTEM TRACKING** (Phase A2 - NEW!)
*Multi-vein structural geology for deposits like Dome Mountain (15 known veins)*

- **Vein Registry** - Comprehensive vein database
  - 15 veins tracked (Boulder, Boulder East, Argillite, Freegold, Chance, Forks, etc.)
  - Strike/dip orientation (structural controls)
  - True width measurements (10m average for Boulder Vein)
  - Mineralization type (quartz-carbonate, sulfide %)
  - Production status (producing, drilling, exploration, discovery)
  - Priority ranking (1=highest)

- **Vein Intersections** - Drill hole intercepts
  - Depth intervals (from/to)
  - True width calculations
  - Grade by vein (Au, Ag, Cu, Pb, Zn)
  - Grade × thickness (gt-m accumulation)
  - Visible gold indicators
  - Core recovery tracking

- **Multi-Vein Resource Estimation**
  - Independent MRE per vein system
  - Combined project resources
  - Vein-specific cutoff grades
  - High-grade intersection filtering (>5 g/t Au)

### ⛏️ **EXPLORATION MANAGEMENT**

- **Project Dashboard**
  - Budget tracking ($80M+ spent at Dome Mountain)
  - Phase management (greenfield → producing)
  - Team assignments
  - Commodity targeting (Au, Ag, Cu, etc.)

- **Drill Hole Database** - 596 holes, 89,982m at Dome Mountain
  - Collar surveys with spatial indexing (PostGIS)
  - Azimuth/dip orientations
  - Total depth tracking
  - Drilling contractor management
  - Status tracking (planned → completed)

- **Core Logging Interface**
  - Lithology classification (40 fields)
  - Alteration mapping (type, intensity %)
  - Mineralization logging (visible gold, sulfides)
  - Structural measurements
  - Photo upload integration
  - Review workflow (draft → approved)

- **Sample & Assay Tracking**
  - Chain of custody (field → lab → archived)
  - QA/QC protocols (duplicates, standards, blanks)
  - Multi-element analysis (Au, Ag, Cu, Pb, Zn, + 10 more)
  - Lab submission tracking
  - Certificate management

### 📊 **RESOURCE ESTIMATION**

- **2D Grade Interpolation** - PyKrige geostatistics
  - Ordinary Kriging with spherical variogram
  - Interactive heatmap visualization
  - Sample location overlay
  - Statistics (min, max, mean, median, std dev)

- **3D Block Modeling** - 400,000+ voxels
  - Block model generation (configurable sizes)
  - 3D IDW grade estimation
  - Three.js 3D visualization with OrbitControls
  - Grade shell viewing

- **CIM/JORC Resource Classification**
  - **Measured**: ≤25m radius, 4+ drill holes
  - **Indicated**: ≤50m radius, 2+ drill holes
  - **Inferred**: ≤100m radius, 1+ drill hole
  - Compliant reporting (NI 43-101)

- **Resource Reporting**
  - Tonnage & metal content calculations
  - Grade-tonnage curves
  - Cut-off grade sensitivity
  - Qualified Person attribution

### 🌐 **REAL-TIME COLLABORATION**

- **Daily.co Video Integration** - Built-in video calls
  - Instant connection to team members
  - Screen sharing for data review
  - Project-based rooms
  - Perfect for: Shift supervisor ↔ Geologist ↔ Mill operator

- **Ably Real-Time Messaging**
  - Team chat within projects
  - Presence indicators (online/offline)
  - Typing indicators
  - Message history

- **Collaborative Data Review**
  - Shared cursor for reviewing drill logs
  - Live KPI updates
  - Multi-user access control
  - Invite-only project groups

### 🤖 **AI ASSISTANT** (Triple Engine)

- **Claude (Anthropic)** - Geological reasoning
- **GPT-4 (OpenAI)** - Core photo analysis & vision
- **Grok (xAI)** - Natural language geological queries

**Capabilities**:
- Lithology classification from descriptions
- Core logging assistance
- Grade interpolation recommendations
- Resource estimation validation
- Geological interpretations

### 📈 **GEOPHYSICS INTEGRATION**

- **Survey Data Management**
  - Magnetic, gravity, IP, EM, seismic
  - 2020 airborne survey at Dome Mountain (100m line spacing)
  - Grid data upload & visualization
  - Anomaly tracking & targeting

- **Target Generation**
  - Geophysical anomaly identification
  - Soil geochemistry (4,000+ samples at Dome Mountain)
  - Multi-element pathfinder analysis
  - Drill target prioritization

### 🗺️ **SPATIAL DATA** (PostGIS)

- Drill collar locations with spatial indexing
- Project boundaries & claim blocks (21,541 ha at Dome Mountain)
- Vein strike/dip orientation mapping
- 3D geological models
- Coordinate system management (WGS84, UTM, local grids)

---

## 🏆 **Real Project: Dome Mountain Gold Mine**

**Live data from Blue Lagoon Resources (CSE: BLLG, OTCQB: BLAGF)**

- **Location**: Near Smithers, British Columbia, Canada
- **Status**: Fully permitted (Mine Permit 237, Feb 2025)
- **Production Start**: July 2025 (Q3)
- **Target**: 15,000 oz Au/year + Ag credits

**2022 Mineral Resource Estimate:**
- **45,000 oz Au (Measured)** @ 10.32 g/t
- **173,000 oz Au (Indicated)** @ 8.15 g/t
- **16,000 oz Au (Inferred)** @ 6.02 g/t
- Plus 250,000 oz Ag (Measured), 876,000 oz Ag (Indicated)

**Exploration Data:**
- 596 drill holes, 89,982 metres total
- 15 known high-grade gold veins
- $80M+ invested since 1985 (Noranda discovery)
- Boulder Vein System: Main production target

**Partners:**
- **Mining**: Roughstock Mining Services, Cobra Mining
- **Milling**: Nicola Mining Inc. (Merritt, BC)
- **Community**: Lake Babine First Nation (full support)

---

## 🎯 **vs. Micromine (Industry Standard)**

| Feature | GeoForge | Micromine |
|---------|----------|-----------|
| **Deployment** | ☁️ Cloud-native | 💻 Desktop Windows |
| **Mobile Support** | ✅ Tablet + offline PWA | ❌ Desktop only |
| **Collaboration** | ✅ Built-in video/chat | ⚠️ Separate Nexus license |
| **AI Features** | ✅ Claude + GPT-4 + Grok | ⚠️ Basic AI |
| **Production Tracking** | ✅ Real-time 30s entry | ⚠️ Manual Excel |
| **Pricing** | 💰 ~$500/mo (3 users) | 💸 $50K+ upfront |
| **Updates** | ✅ Automatic (Vercel/Render) | ❌ Manual installation |
| **Multi-Vein Tracking** | ✅ 15 veins at Dome Mtn | ⚠️ Generic wireframes |

**Market Gap**: Junior exploration companies (70% of market) can't afford $50K+ Micromine licenses but need professional tools.

---

## 🛠️ **Technology Stack**

### **Frontend**
- React 18 + TypeScript
- Vite (fast builds)
- TailwindCSS (modern UI)
- Three.js (3D visualization)
- Daily.co (video collaboration)
- Ably (real-time messaging)
- Vercel (deployment)

### **Backend**
- Python FastAPI (24 endpoints)
- PostgreSQL 17 + PostGIS (spatial)
- Neon database (serverless)
- PyKrige (geostatistics)
- gstools (variogram modeling)
- NumPy, SciPy (numerical computing)
- Render (deployment)

### **Database Schema**
- 12 tables (exploration + production + vein systems)
- 5 views (aggregations & reporting)
- PostGIS spatial indexes
- Automatic timestamp triggers
- UUID primary keys

---

## 📊 **API Endpoints** (24 total)

### **Production** (5 endpoints - Phase A1)
```
GET  /api/production/records       - Fetch shifts
POST /api/production/records       - Log shift (30s entry)
GET  /api/production/summary       - KPIs dashboard
GET  /api/production/targets       - Monthly targets
POST /api/production/targets       - Create targets
```

### **Exploration** (14 endpoints)
```
GET  /api/projects                 - List projects
GET  /api/projects/{id}            - Get project
POST /api/projects                 - Create project
GET  /api/drill-holes              - List drill holes
GET  /api/core-logs                - List core logs
GET  /api/samples                  - List samples
GET  /api/assays                   - List assay results
... (+ 7 more)
```

### **Resource Estimation** (5 endpoints)
```
POST /api/block-models/create      - Generate 3D grid
POST /api/block-models/{id}/estimate - IDW grade estimation
POST /api/block-models/{id}/classify - M/I/I classification
GET  /api/block-models/{id}/blocks - Get voxels
POST /api/resource-estimates/create - Generate report
```

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 22+ (frontend)
- Python 3.14+ (backend)
- PostgreSQL 17 with PostGIS (or use Neon)

### **1. Clone Repository**
```bash
git clone https://github.com/jcronkdc/GeoFroge.git
cd GeoFroge
```

### **2. Frontend Setup**
```bash
npm install
cp .env.example .env.local
# Add your API keys (Supabase, Daily.co, Ably, etc.)
npm run dev
# Open http://localhost:5173
```

### **3. Backend Setup**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
# Set DATABASE_URL environment variable
python main.py
# Backend runs on http://localhost:8000
```

### **4. Database Migrations**
```bash
# Apply all migrations
psql $DATABASE_URL < migrations/001_geological_core_schema.sql
psql $DATABASE_URL < migrations/007_production_tracking_schema.sql
psql $DATABASE_URL < migrations/008_vein_system_tracking_schema.sql
# (or use Neon MCP tools)
```

---

## 📈 **Project Status**

**Current Phase**: Production + Vein System Tracking (Phases A1 + A2)

✅ **Complete**:
- Phase 1: Foundation & Architecture
- Phase 2: Database & Core Modules  
- Phase 3: Real Collaboration (Daily.co + Ably)
- Phase 4: Grade Interpolation (PyKrige)
- Phase 5: Resource Estimation & 3D Blocks
- **Phase A1**: Production Tracking ⭐ **NEW**
- **Phase A2**: Vein System Tracking ⭐ **NEW**

🚧 **In Progress**:
- Phase 6: Mine Planning & Pit Optimization
- Permit & compliance tracking
- Contractor management dashboard

---

## 💡 **Use Cases**

### **For Exploration Companies**
- Manage multiple projects (Dome Mountain style)
- Track 500+ drill holes efficiently
- Generate NI 43-101 compliant MREs
- Collaborate with remote field teams
- Share data with investors/stakeholders

### **For Operating Mines**
- Daily production tracking (30-second shifts)
- Real-time grade control
- Mill feed optimization
- Target vs. actual reporting
- Multi-vein resource reconciliation

### **For Junior Explorers**
- Affordable alternative to Micromine ($50K → $500/mo)
- Cloud-based (no IT infrastructure)
- Mobile-friendly for field work
- Instant collaboration (no travel for meetings)
- Professional reporting for financing

---

## 🤝 **Contributing**

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Priority Areas:**
- Geotechnical data tracking
- Environmental monitoring
- Advanced pit optimization algorithms
- Mobile offline sync improvements
- Additional AI features

---

## 📄 **License**

MIT License - see [LICENSE](LICENSE) for details.

Open-source alternative to expensive proprietary geological software.

---

## 📞 **Contact**

**Project Owner**: Justin Cronk  
**Email**: justin@cronkcompanies.com  
**GitHub**: [@jcronkdc](https://github.com/jcronkdc)

**Repository**: [https://github.com/jcronkdc/GeoFroge](https://github.com/jcronkdc/GeoFroge)

---

## 🙏 **Acknowledgments**

- **Blue Lagoon Resources** for Dome Mountain data
- **Lake Babine First Nation** for community support
- **Micromine** for industry inspiration
- **Noranda** for original Dome Mountain discovery (1985)

---

**Built with ❤️ for the geological exploration community**

*Making professional geological data management accessible to everyone*
