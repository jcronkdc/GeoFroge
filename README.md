# GeoForge - Geological Exploration & Mining Management Platform

**Next-Generation Cloud-Native Software for Mineral Exploration**

[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
[![Status: In Development](https://img.shields.io/badge/Status-In%20Development-yellow.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791.svg)](https://www.postgresql.org/)

---

## 🌍 Overview

**GeoForge** is a comprehensive, cloud-native platform designed specifically for geologists working in mineral exploration and mining. From initial project planning through core logging, sample management, chemical assays, and resource estimation, GeoForge provides modern tools that exceed capabilities of legacy desktop software like Micromine.

### Why GeoForge?

Traditional geological software (Micromine, Surpac, Datamine) are desktop applications built decades ago. GeoForge is:

✅ **Cloud-Native**: Access from anywhere, automatic updates, zero installation  
✅ **AI-Powered**: Claude Sonnet 4.5 for lithology classification and predictive assays  
✅ **Real-Time Collaboration**: Video calls + screen sharing built into every module  
✅ **Mobile-First**: Tablet-optimized for core logging in the field  
✅ **Offline-Capable**: Progressive Web App works without internet  
✅ **Modern UX**: Built with React 18, responsive, intuitive  

---

## 🎯 Core Features

### 1. **Exploration Project Management**
- Multi-project dashboard with live budget tracking
- Phase management (greenfield → feasibility → mining)
- Permit and land tenure tracking
- Team collaboration with role-based access

### 2. **Drill Hole Database**
- Comprehensive drill hole tracking (DDH, RC, RAB, etc.)
- Collar survey management with GPS integration
- Real-time drilling progress monitoring
- Map view with spatial queries

### 3. **Digital Core Logging**
- Tablet-optimized logging interface
- Standardized lithology library (50+ rock types)
- Alteration and mineralization tracking
- Photo attachment with interval linking
- Review workflow (draft → reviewed → approved)

### 4. **Sample Management**
- Sample creation from core logs or field locations
- Barcode/QR code generation for tracking
- Chain of custody management
- Batch lab submission
- Sample archive tracking

### 5. **Assay Data Management**
- PDF/CSV certificate import with auto-parsing
- Manual data entry with validation
- QAQC duplicate checking
- Multi-element visualization
- Grade threshold alerts
- Export to Surpac, Datamine, Leapfrog, Micromine formats

### 6. **AI-Powered Geological Analysis**
- **Core Photo Analysis**: Upload core tray photos → AI identifies lithology, alteration, mineralization
- **Predictive Assays**: AI predicts likely assay ranges before lab results
- **Anomaly Detection**: Statistical analysis + ML for geochemical anomalies
- **Natural Language Queries**: "Show all holes with >1g/t Au in altered basalt"

### 7. **3D Visualization**
- Three.js-based 3D drill hole viewer
- Interactive cross-sections
- Block model visualization
- Resource grade shells
- Export high-resolution images for reports

### 8. **Geochemical Mapping**
- Soil and stream sediment sampling
- Heat map visualization
- Multi-element analysis
- Target generation

### 9. **Resource Estimation**
- Grade shell modeling
- Variography and statistics
- Block model generation
- Resource classification (Inferred/Indicated/Measured)
- NI 43-101, JORC, SAMREC compliant reporting

### 10. **Environmental & Permitting**
- Environmental baseline tracking
- Permit application management
- Compliance monitoring
- Community engagement logs

---

## 🏆 Competitive Advantages vs. Micromine

| Feature | GeoForge | Micromine |
|---------|----------|-----------|
| **Deployment** | Cloud-native, zero install | Desktop Windows apps |
| **Collaboration** | Built-in video + real-time | Separate Nexus subscription |
| **Mobile Support** | Full tablet support, offline-capable | Desktop only |
| **AI Features** | Advanced (Claude + GPT-4) | Basic AI tools |
| **Pricing** | $500/month (3 users) | $50K+ upfront + annual fees |
| **Updates** | Automatic, continuous | Manual installation |
| **API** | Modern RESTful + webhooks | Legacy integration |
| **Data Export** | All formats (including Micromine!) | Limited formats |

**ROI**: Junior explorers save $45K+ in Year 1 vs. Micromine

---

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for modern UI
- **Three.js** for 3D visualization
- **Leaflet/Mapbox** for mapping
- **Recharts** for data visualization
- **PWA** for offline support

### Backend
- **Node.js** with Express
- **PostgreSQL 14+** with PostGIS for spatial data
- **Supabase** for authentication and real-time features
- **Vercel** for serverless deployment
- **S3** for file storage (core photos, certificates)

### AI & ML
- **Claude Sonnet 4.5** (Anthropic) for geological analysis
- **GPT-4 Turbo** (OpenAI) for natural language
- **TensorFlow.js** for client-side ML

### Collaboration
- **Daily.co** for video calls
- **Ably** for real-time messaging
- **WebSockets** for live updates

---

## 📊 Database Schema

GeoForge uses PostgreSQL with PostGIS for spatial data:

- **exploration_projects**: Project management and tracking
- **drill_holes**: Collar locations, orientations, drilling details
- **core_logs**: Interval-by-interval geological logging
- **field_samples**: Sample tracking with chain of custody
- **assay_results**: Chemical analysis results with QAQC
- **geological_interpretations**: 3D interpretations and models
- **geophysical_surveys**: Mag, gravity, IP, EM data
- **exploration_targets**: Target generation and prioritization

See `migrations/001_geological_core_schema.sql` for complete schema.

---

## 📁 Project Structure

```
GeoForge/
├── docs/
│   ├── GEOLOGICAL_MASTER_DOC.md       # Complete system design
│   ├── IMPLEMENTATION_ROADMAP.md      # 16-week development plan
│   └── API_DOCUMENTATION.md           # API reference (coming soon)
├── migrations/
│   └── 001_geological_core_schema.sql # Database schema
├── backend/
│   ├── src/
│   │   ├── routes/                    # API endpoints
│   │   ├── services/                  # Business logic
│   │   └── utils/                     # Helper functions
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/                # React components
│   │   │   ├── exploration/           # Project management
│   │   │   ├── drilling/              # Drill hole database
│   │   │   ├── logging/               # Core logging
│   │   │   ├── samples/               # Sample management
│   │   │   ├── assays/                # Assay management
│   │   │   ├── visualization/         # 3D and maps
│   │   │   └── ai/                    # AI features
│   │   ├── lib/                       # Services and utilities
│   │   └── types/                     # TypeScript definitions
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started (Coming Soon)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ with PostGIS
- Supabase account
- Vercel account (for deployment)

### Installation
```bash
# Clone repository
git clone https://github.com/jcronkdc/GeoFroge.git
cd GeoFroge

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

---

## 📈 Roadmap

### Phase 1: Foundation (Weeks 1-2) ⏳ IN PROGRESS
- [x] Database schema design
- [x] Master documentation
- [x] Implementation roadmap
- [ ] Database migration application
- [ ] Demo data seeding

### Phase 2: Core Features (Weeks 3-4)
- [ ] Exploration project management
- [ ] Drill hole database
- [ ] Basic mapping interface

### Phase 3: Logging System (Weeks 5-6)
- [ ] Digital core logger
- [ ] Photo management
- [ ] Review workflows

### Phase 4: Sample & Assay (Weeks 7-8)
- [ ] Sample management
- [ ] Lab submission
- [ ] Assay import and visualization

### Phase 5: AI Features (Weeks 9-10)
- [ ] AI core photo analysis
- [ ] Predictive assays
- [ ] Geochemical anomaly detection

### Phase 6: 3D Visualization (Weeks 11-12)
- [ ] 3D drill hole viewer
- [ ] Cross-section generator
- [ ] Block model viewer

### Phase 7: Integration (Weeks 13-14)
- [ ] Lab LIMS integration
- [ ] Export to mining software
- [ ] API development

### Phase 8: Production (Weeks 15-16)
- [ ] Resource estimation tools
- [ ] Performance optimization
- [ ] Security audit
- [ ] Launch! 🚀

---

## 💰 Pricing Model

### Transparent SaaS Pricing

| Tier | Users | Monthly Price | Annual (Save 20%) |
|------|-------|---------------|-------------------|
| **Exploration** | Up to 3 | $500 | $4,800 |
| **Professional** | Up to 10 | $1,500 | $14,400 |
| **Enterprise** | Unlimited | $5,000 | $48,000 |

All tiers include:
- Unlimited projects and drill holes
- Core logging and sample management
- Assay import and visualization
- Mapping and basic 3D viewer
- Mobile app access
- Email support

**Professional** adds:
- AI-powered tools
- Advanced 3D visualization
- Geochemical analysis
- Priority support

**Enterprise** adds:
- API access
- Custom integrations
- Dedicated support
- On-premise deployment option
- Custom training

---

## 🤝 Contributing

This is a proprietary project. For collaboration opportunities, please contact:

**Email**: justin@cronkcompanies.com  
**GitHub**: [@jcronkdc](https://github.com/jcronkdc)

---

## 📜 License

Proprietary - All Rights Reserved

© 2025 Cronk Companies, LLC

This software is proprietary and confidential. Unauthorized copying, modification, or distribution is strictly prohibited.

---

## 🔗 Resources

- **Documentation**: [GEOLOGICAL_MASTER_DOC.md](GEOLOGICAL_MASTER_DOC.md)
- **Roadmap**: [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md)
- **Competitor Analysis**: [Micromine](https://www.micromine.com)
- **Industry Standards**: [CIM Best Practices](https://www.cim.org/), [JORC Code](https://www.jorc.org/)

---

## 📧 Contact

**Project Owner**: Justin Cronk  
**Company**: Cronk Companies, LLC  
**Email**: justin@cronkcompanies.com  
**GitHub**: https://github.com/jcronkdc/GeoFroge

---

**Built for Modern Geologists - Cloud-Native, AI-Powered, Collaboration-First** 🌍⛏️🚀

