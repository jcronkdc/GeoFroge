# GeoForge Backend API

Python FastAPI backend for geological data management and resource estimation.

## Features

- Grade interpolation (Ordinary Kriging)
- 3D block model generation
- Resource estimation (M/I/I classification)
- CIM/JORC compliant reporting

## Requirements

- Python 3.11+
- PostgreSQL with PostGIS extension

## Installation

```bash
pip install -r requirements.txt
```

## Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@host:5432/database
PORT=8000
```

## Running Locally

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Running in Production

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT --workers 4
```

## API Documentation

Once running, visit: `http://localhost:8000/docs`

## Deployment

### Railway

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login:
```bash
railway login
```

3. Initialize project:
```bash
railway init
```

4. Deploy:
```bash
railway up
```

### Render

1. Connect GitHub repository
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

## Health Check

```bash
curl http://localhost:8000/api/health
```
