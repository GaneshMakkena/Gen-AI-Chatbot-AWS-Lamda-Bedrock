# Environment Variables & Secrets Guide

## Overview

This document lists all environment variables required for MediBot deployment.

---

## Backend Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_API_KEY` | Google Gemini API key | `AIzaSy...` |
| `COGNITO_USER_POOL_ID` | Cognito User Pool ID | `us-east-1_abc123` |
| `COGNITO_CLIENT_ID` | Cognito App Client ID | `abc123def456` |
| `AWS_REGION` | AWS region for services | `us-east-1` |

### DynamoDB Tables

| Variable | Description | Default |
|----------|-------------|---------|
| `CHAT_TABLE` | Chat history table | `medibot-chats-production` |
| `HEALTH_PROFILE_TABLE` | Health profiles table | `medibot-health-profiles-production` |
| `GUEST_TABLE` | Guest sessions table | `medibot-guest-sessions-production` |
| `AUDIT_TABLE` | Audit logs table | `medibot-audit-logs-production` |

### S3 Buckets

| Variable | Description | Default |
|----------|-------------|---------|
| `IMAGES_BUCKET` | Generated images bucket | `medibot-images-{account}-{region}-production` |
| `REPORTS_BUCKET` | Uploaded reports bucket | `medibot-reports-{account}-{region}-production` |

### Optional Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | Deployment environment | `production` |
| `LLM_MODEL_ID` | Gemini model to use | `gemini-2.5-pro-preview-06-05` |
| `GUEST_MESSAGE_LIMIT` | Guest trial message limit | `3` |
| `GUEST_SESSION_TTL_HOURS` | Guest session expiry (hours) | `24` |
| `AUDIT_RETENTION_DAYS` | Audit log retention | `90` |

---

## Frontend Environment Variables

Set in `.env` or build-time:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.medibot.example.com` |

---

## Secrets Management

### AWS Secrets Manager (Recommended for Production)

Store sensitive values in AWS Secrets Manager:
- `GOOGLE_API_KEY`
- Database credentials (if any)

### Lambda Environment (SAM Template)

Non-sensitive values set in `template.yaml`:
```yaml
Environment:
  Variables:
    COGNITO_USER_POOL_ID: !Ref UserPool
    CHAT_TABLE: !Ref ChatHistoryTable
```

### Local Development

Create `.env` file in `backend/`:
```bash
GOOGLE_API_KEY=your-api-key-here
COGNITO_USER_POOL_ID=us-east-1_local
COGNITO_CLIENT_ID=local-client-id
AWS_REGION=us-east-1
ENVIRONMENT=development
```

---

## Secrets Rotation

### Google API Key

1. Generate new key in Google Cloud Console
2. Update AWS Secrets Manager or Lambda env
3. Deploy new Lambda version
4. Revoke old key after verification

### Cognito

- Client secrets auto-managed by Cognito
- User pool migration requires careful planning

---

## Security Best Practices

1. **Never commit secrets to git** - Use `.gitignore`
2. **Use IAM roles** - Lambda has role-based access, no static credentials
3. **Rotate regularly** - API keys should be rotated quarterly
4. **Least privilege** - IAM policies scoped to specific resources
5. **Encryption at rest** - All DynamoDB and S3 data encrypted
