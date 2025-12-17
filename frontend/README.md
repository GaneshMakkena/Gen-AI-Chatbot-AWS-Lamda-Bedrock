# MediBot Frontend

This is the React + Vite frontend for MediBot, built with:
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Vanilla CSS (CSS Modules approach)
- **Auth**: AWS Amplify UI (`@aws-amplify/ui-react`)
- **State Management**: Custom Hooks (`useChatState`) + Context

## Key Components

### `ChatInterface`
The main chat view. Handles:
- Real-time chat integration with backend
- Optimistic UI updates
- Progressive loading states (Thinking > Generating > Visuals)
- Large file uploads (S3 Direct)

### `StepCard`
Visual component for rendering step-by-step instructions.
- Display distinct "Action", "Method", "Warning" panels
- Handles image loading fallbacks

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start dev server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173`

## Environment Variables
The app expects these variables (injected via `deploy.sh` in production):
- `VITE_API_URL`: Backend API endpoint
- `VITE_COGNITO_USER_POOL_ID`: Auth pool ID
- `VITE_COGNITO_CLIENT_ID`: Auth client ID
