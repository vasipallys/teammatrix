# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NextGen Organization Visualizer is a modern full-stack web application that provides AI-powered organization visualization and workforce analytics. It features interactive hierarchy charts, work plan management, real-time collaboration, and comprehensive data export capabilities.

**Technology Stack:**
- **Frontend**: React 18 + Vite, with modern hooks and context patterns
- **Backend**: Flask + SQLAlchemy with WebSocket support via Flask-SocketIO
- **Database**: SQLite (development) / PostgreSQL (production)
- **Visualization**: Plotly.js for interactive charts and graphs
- **UI/UX**: Custom CSS with glassmorphism design system and multiple themes

## Development Commands

### Backend Setup and Development
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python run.py
```

### Frontend Setup and Development
```bash
cd frontend
npm install
npm run dev    # Development server (Vite, port 3000)
npm run build  # Production build
npm run preview # Preview production build
```

> **Note:** `README.md` and `STARTUP_GUIDE.md` say `npm start`, but there is no `start` script in `package.json`. The dev server command is `npm run dev`.

### Startup Internals
- `run.py` is the canonical entry point. It selects a config class from `config_map` based on `FLASK_ENV` (`development`/`production`/`testing`, default `development`), configures logging via `dictConfig`, validates required config, runs `db.create_all()`, then starts the **Flask dev server** (`app.run(..., threaded=True)`) — not gunicorn/eventlet (that is production-only, see Deployment).
- `SECRET_KEY` is validated as required, but `DevelopmentConfig` supplies a fallback (`dev-secret-key-change-in-production`), so dev runs without a `.env`. Production validation additionally warns on missing LDAP settings.

### Testing
- Frontend testing utilities available in `src/utils/testUtils.js`
- Run comprehensive tests in browser console: `import testUtils from './src/utils/testUtils.js'; testUtils.runComprehensiveTests()`
- No automated test framework currently configured

### Database Management
- Database models in `backend/database.py`
- Automatic table creation via `python run.py`
- SQLite database stored at `backend/instance/org_visualizer.db`

## Architecture Overview

### Backend Structure (`backend/`)
- **`app.py`**: The application core — a **~4,900-line monolith** that holds *all* HTTP routes and most business logic. New endpoints and integration logic almost always go here. Covers:
  - Organization data management (CRUD operations)
  - Work plan management and timeline processing
  - LDAP integration for employee directory sync
  - Git repository integration (GitHub, Bitbucket, GitLab)
  - Jira integration (issue/project data)
  - WebSocket services for real-time collaboration
  - Advanced analytics and data export functionality
- **`database.py`**: SQLAlchemy models (7 total): `Organization`, `WorkPlan`, `Repository`, `PullRequest`, `Commit`, `Branch`, and `IntegrationConfig`. Notes:
  - `*.to_dict()` returns the *spreadsheet-style* column headers (e.g. `'Staff Name'`, `'Squad 1 (where applicable)'`) — the API speaks these labels, not the snake_case column names. `from_dict()` does the reverse.
  - `IntegrationConfig` stores per-integration (jira/ldap/git) credentials **encrypted with Fernet**. The key comes from `DB_ENCRYPTION_KEY`; **if that env var is unset a new key is generated on every startup**, so previously-stored credentials become undecryptable after a restart — set it explicitly for any persistent use.
  - Analytics (developer/squad/plan-vs-actual/etc.) are **computed on the fly** from these tables, not stored.
- **`config.py`**: The single source of truth for configuration. Defines `Config` base + `Development`/`Production`/`Testing` subclasses and `config_map`. Holds far more than the basics — file upload limits/extensions, CORS, rate limiting, caching, rotating-file logging, Git/Jira timeouts, performance profiling, and security cookie settings. Check here before assuming a setting doesn't exist.
- **`run.py`**: Startup script (config selection, logging, DB init, server launch — see Startup Internals)
- **`websocket_service.py`**: Real-time communication and collaboration features
- **`logging_service.py`** / **`logging_dashboard.py`**: Application logging infrastructure and an in-app logging dashboard
- **`create_sample_git_data.py`**: Generates sample Git repository/analytics data for development
- **`organization_data.csv`, `work_plan_data.csv`, `ldap_import_template.csv`**: Sample/template data used by the "Load Sample" features and LDAP import
- **`ldap_sync_enhanced.py`** (repo root, *not* in `backend/`): Standalone enhanced LDAP synchronization script

### Frontend Structure (`frontend/src/`)
- **`App.jsx`**: Main application component (~1,150 lines) with tab routing and top-level state management
- **`api.js`**: Centralized API communication layer (axios; requests go through the Vite `/api` proxy to backend port 5000)
- **`config.js`**: Frontend configuration constants
- **`contexts/`**: React context providers (e.g. `ThemeContext.jsx` for multi-theme support)
- **`hooks/`**: Custom hooks (e.g. performance monitoring)
- **`services/`**: Client-side service modules (API/domain helpers beyond `api.js`)
- **`models/`**: Frontend data models / shape definitions
- **`styles/`**: CSS (glassmorphism design system, theme variables)
- **`utils/`**: Utilities including `testUtils.js` (browser-console test harness)
- **`plotly-2.26.0.min.js`**: Plotly is **vendored locally** in addition to the npm dependency
- **`components/`** (~37 components): Modular component architecture
  - **Core**: OrgChart, WorkPlan, DataManagement, Header
  - **Integrations**: GitRepositoryManager, RepositoryAnalytics, JiraIntegrationPanel, LDAPSyncInterface, ETLPipelineMonitor
  - **Analytics**: AnalyticsDashboard, DataQualityDashboard, DeveloperProfileAnalytics, PlanVsActualTracker, SmartSearch
  - **Advanced Features**: CollaborationSystem, AutomationSystem, AdvancedExportSystem, PerformanceDashboard
  - **UI/Utilities**: LoadingSpinner, NotificationSystem, ErrorBoundary, KeyboardShortcuts, CommandPalette, HelpSystem

### API Surface
All endpoints live in `app.py` and are namespaced under `/api/...` (~69 routes). The frontend mirrors them as named functions in `frontend/src/api.js`. Major groups: org/work CRUD + upload/download + sample data; `ldap/*`; `git/*` and `repositories/*`; `jira/*` (incl. `jira/configs` CRUD); `pipeline/*` & `etl/*`; `analytics/*` (developer, squad, plan-vs-actual, productivity, strategic-alignment, portfolio-health); `data/*` (relationships, unified-model, quality, validate); `settings/integrations`; `export/*`; `realtime/metrics`. The **unified data model** (`data/unified-model` backend + `models/unifiedDataModel.js` frontend) is the cross-source correlation layer joining org, work-plan, Git, and Jira data.

### Key Data Flow Patterns
1. **Data Upload**: CSV/Excel files → Backend processing → Database storage → Real-time WebSocket updates → Frontend state updates
2. **Visualization**: Database queries → Data transformation → Plotly.js rendering → Interactive charts
3. **Real-time Features**: WebSocket connections → Event broadcasting → Live collaboration updates
4. **Export**: Data queries → Format conversion → File generation → Download delivery

## Component Architecture Patterns

### State Management
- Uses React Context for global state (Theme, Notifications)
- Local component state for UI interactions
- Custom hooks for performance monitoring (`usePerformanceMonitor.js`)

### Data Visualization Strategy
- Plotly.js for all interactive charts (org charts, Gantt charts, analytics)
- Dynamic data transformation based on filters and user preferences
- Multiple visualization modes: Sunburst, Treemap, Network graphs

### Real-time Features
- WebSocket integration for live collaboration
- Real-time cursor tracking and user presence
- Live data synchronization across multiple clients

## Configuration and Environment

### Environment Variables
`config.py` is the authoritative list; every setting is overridable via env var. Common ones (`.env` in `backend/`):
- `SECRET_KEY`: Flask session security (required; dev has a fallback)
- `DATABASE_URL`: Database connection string (defaults to SQLite)
- `LDAP_SERVER`, `LDAP_USER`, `LDAP_PASSWORD`, `LDAP_BASE_DN`: LDAP integration
- `PORT`: Server port (default: 5000)
- `FLASK_ENV`: Selects the config class (`development`/`production`/`testing`)

Additional env-tunable areas (see `config.py` for names/defaults): file uploads (`MAX_CONTENT_LENGTH`, `UPLOAD_FOLDER`; allowed: csv/xlsx/xls), CORS (`CORS_ORIGINS`), rate limiting, caching, logging (`LOG_LEVEL`, `LOG_FILE`, rotation), Git integration (`GIT_API_TIMEOUT`, `GIT_CLONE_TIMEOUT`, `GIT_TEMP_DIR`), Jira integration (`JIRA_API_TIMEOUT`, `JIRA_MAX_RESULTS`), and security cookie flags.

### Frontend Configuration
- Vite development server on port 3000
- API proxy configured to backend port 5000
- Hot module replacement enabled for development

## Data Models and Schema

### Organization Data
Required fields: `Staff Name`, `Reporting Manager Name`
Optional fields: `Staff Id`, `Job Function`, `Rank`, `Squad 1 (where applicable)`, `Sub-platform`, `Work Location`, `Tech Skills`, `Domain Knowledge`

### Work Plan Data  
Required fields: `Squad name`, `Book of work`, `start date`, `end date`
Optional fields: `description if any`

### Repository Analytics
Comprehensive Git integration supporting GitHub, Bitbucket, and GitLab with pull request tracking, commit analysis, and branch management.

## Development Guidelines

### Code Patterns
- Follow existing component structure for new features
- Use the established API patterns in `api.js` for backend communication
- Implement error boundaries for robust error handling
- Utilize the notification system for user feedback

### Styling Approach
- Custom CSS with CSS variables for theming
- Glassmorphism design system with backdrop-filter effects
- Responsive design with mobile-first approach
- Multiple theme support (Dark, Light, Cyberpunk, Ocean, Forest)

### Performance Considerations  
- Components use React.memo and useMemo for optimization
- Large datasets handled with virtualization techniques
- WebSocket connections managed with proper cleanup
- Image and asset optimization for production builds

### Security Implementation
- CORS configuration for development and production
- Input validation and sanitization for file uploads
- Secure file handling with werkzeug.utils.secure_filename
- Environment variable configuration for sensitive data

## Integration Points

### LDAP Directory Services
- Automated employee data synchronization
- Configurable search filters and base DN
- Error handling for connection failures

### Git Repository Analytics
- Multi-platform support (GitHub, Bitbucket, GitLab) 
- Project type detection and classification
- Comprehensive data extraction (PRs, commits, branches)
- Advanced analytics and reporting
- Auth note: Git Pull uses Personal Access Tokens (not passwords). For GitHub use `https://api.github.com` + username + PAT (`repo`/`public_repo` scope); for Bitbucket Server use the server URL + username + app password/PAT.

### Jira Integration
- Issue and project data retrieval via the Jira REST API
- Configurable via `JIRA_*` settings in `config.py`
- Surfaced in the frontend through `JiraIntegrationPanel`

### WebSocket Real-time Features
- Live collaboration with cursor tracking
- Real-time notifications and updates
- Performance monitoring and health checks

## Deployment and Production

### Production Build Process
1. Frontend: `npm run build` generates optimized static files
2. Backend: Use gunicorn with eventlet workers for WebSocket support
3. Database: PostgreSQL recommended for production
4. Environment: Set appropriate environment variables for security and performance

### Key Deployment Commands
```bash
# Frontend production build
cd frontend && npm run build

# Backend production deployment  
cd backend && gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:5000 app:app
```