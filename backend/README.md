# GeoForge Backend API

Open-source geological data management system backend built with FastAPI and PostGIS.

## 🏗️ Architecture

- **Framework:** FastAPI (Python)
- **Database:** Supabase PostgreSQL + PostGIS
- **3D Visualization:** Three.js data endpoints
- **Deployment:** Docker / Railway / Render

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Mac/Linux
# venv\Scripts\activate  # On Windows
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and add your database URL:

```bash
cp .env.example .env
# Edit .env and add your Supabase DATABASE_URL
```

### 3. Run Development Server

```bash
python main.py
# Or: uvicorn main:app --reload
```

API will be available at:
- **API:** http://localhost:8000
- **Docs:** http://localhost:8000/docs (Swagger UI)
- **Redoc:** http://localhost:8000/redoc

## 📚 API Endpoints

### Health & Status
- `GET /` - API status
- `GET /api/health` - Health check (database connectivity)

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/{id}` - Get single project
- `POST /api/projects` - Create new project

### Drill Holes
- `GET /api/drill-holes` - List all drill holes (optional: `?project_id=xxx`)
- `GET /api/drill-holes/{id}` - Get single drill hole
- `POST /api/drill-holes` - Create new drill hole

### Assays
- `GET /api/assays` - List assays (optional: `?drill_hole_id=xxx` or `?sample_id=xxx`)

### 3D Visualization
- `GET /api/drill-holes/3d/{project_id}` - Get drill hole data for Three.js rendering

## 🗃️ Database Schema

Connected to Supabase PostgreSQL with PostGIS extension:

- `exploration_projects` - Project metadata
- `drill_holes` - Collar locations (PostGIS POINT geometry)
- `drill_hole_surveys` - Downhole deviation data
- `core_samples` - Sample intervals
- `geological_units` - Lithology/alteration
- `structures` - Faults/veins (PostGIS LINESTRING)
- `assays` - Geochemical results
- `photos` - Core/outcrop imagery

## 🔧 Development

### Add New Endpoint

1. Define Pydantic model in `main.py`
2. Create endpoint function with `@app.get()` or `@app.post()`
3. Use `get_db_connection()` to query PostGIS
4. Return JSON response

### Test API

Open http://localhost:8000/docs for interactive Swagger UI.

## 📦 Dependencies

Core:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `psycopg2-binary` - PostgreSQL driver
- `pydantic` - Data validation
- `python-dotenv` - Environment variables

Future additions:
- `GDAL` - File import/export
- `gempy` - Geological modeling
- `pykrige` - Geostatistics

## 🐳 Docker Deployment (TODO)

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 📄 License

MIT License - See LICENSE file

---

**Part of GeoForge:** Open-source Micromine-class geological data management system.

