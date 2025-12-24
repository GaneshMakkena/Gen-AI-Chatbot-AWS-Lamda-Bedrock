# Developer Onboarding Guide

Welcome to MediBot! This guide will help you get started.

---

## Quick Start

### 1. Clone & Setup

```bash
# Clone repository
git clone <repo-url>
cd medibot

# Backend setup
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install
```

### 2. Environment Configuration

**Backend** - Create `backend/.env`:
```bash
GOOGLE_API_KEY=your-api-key
COGNITO_USER_POOL_ID=us-east-1_test
COGNITO_CLIENT_ID=test-client
AWS_REGION=us-east-1
ENVIRONMENT=development
```

**Frontend** - Create `frontend/.env`:
```bash
VITE_API_URL=http://localhost:8000
```

### 3. Run Locally

```bash
# Terminal 1: Backend
cd backend
uvicorn api_server:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

Open http://localhost:5173

---

## Project Structure

```
medibot/
├── backend/           # Python FastAPI backend
│   ├── api_server.py  # Main API routes
│   ├── gemini_client.py # AI integration
│   └── tests/         # Unit tests
├── frontend/          # React TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   └── pages/
│   └── e2e/           # E2E tests
├── infrastructure/    # AWS SAM templates
└── docs/              # Documentation
```

---

## Development Workflow

### Running Tests

```bash
# Backend
cd backend
pytest tests/ -v

# Frontend
cd frontend
npm test
```

### Code Style

- **Python**: Follow PEP 8, use type hints
- **TypeScript**: ESLint + Prettier config included
- **Commits**: Use conventional commits (`feat:`, `fix:`, `docs:`)

### Pull Request Process

1. Create feature branch from `develop`
2. Make changes with tests
3. Run `npm run lint` and `pytest`
4. Open PR to `develop`
5. Get code review approval
6. Squash and merge

---

## Key Concepts

### Chat Flow
1. User sends query → `/chat` endpoint
2. Input sanitized for safety
3. Gemini processes with health context
4. Images generated for treatment steps
5. Response validated and returned

### Authentication
- AWS Cognito handles user auth
- JWT tokens validated in `auth.py`
- Guest users have limited trial messages

---

## Need Help?

- **Architecture**: See `docs/ARCHITECTURE.md`
- **Environment**: See `docs/ENVIRONMENT.md`
- **Deployment**: See `docs/DEPLOYMENT.md`
