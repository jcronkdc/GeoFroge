# GeoForge Services

This directory contains service modules for interacting with backend APIs and external services.

## Planned Services

### Phase 2: Core Integrations
- `supabase.service.ts` - Database and auth operations
- `daily.service.ts` - Video collaboration
- `ably.service.ts` - Real-time messaging

### Phase 3: Advanced Features
- `geospatial.service.ts` - PostGIS spatial queries
- `upload.service.ts` - File and photo management
- `export.service.ts` - Data export (CSV, Excel, GeoJSON)

## Usage

All services follow the same pattern:

```typescript
import { supabaseService } from '@/lib/services/supabase.service';

// Query data
const projects = await supabaseService.getProjects();

// Create record
const newProject = await supabaseService.createProject(data);
```

## Current Status

🟢 **Ready**: Supabase client configured
⚠️ **Pending**: Service layer implementation (Phase 2)

