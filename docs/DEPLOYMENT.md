# MediBot Deployment Runbook

## Overview

Step-by-step guide for deploying MediBot to AWS.

---

## Prerequisites

- AWS CLI configured with appropriate credentials
- AWS SAM CLI installed
- Node.js 18+
- Python 3.11+
- Google Cloud API key for Gemini

---

## Deployment Steps

### 1. Backend Deployment

```bash
# Navigate to infrastructure directory
cd infrastructure

# Build SAM application
sam build

# Deploy (first time - guided mode)
sam deploy --guided

# Subsequent deployments
sam deploy --config-file samconfig.toml
```

**Parameters to provide:**
| Parameter | Description |
|-----------|-------------|
| `Environment` | `production` or `staging` |
| `GoogleApiKey` | Gemini API key |

### 2. Frontend Deployment

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Deploy to S3 (replace bucket name)
aws s3 sync dist/ s3://medibot-frontend-bucket/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id DISTRIBUTION_ID \
  --paths "/*"
```

---

## Environment-Specific Configs

### Production
- API Gateway rate limiting: 5 req/s, 10 burst
- CloudWatch alarms active
- Audit logging enabled

### Staging
- Relaxed rate limits for testing
- Same architecture as production
- Separate DynamoDB tables

---

## Rollback Procedure

### Lambda Rollback
```bash
# List versions
aws lambda list-versions-by-function --function-name medibot-api-production

# Point alias to previous version
aws lambda update-alias \
  --function-name medibot-api-production \
  --name live \
  --function-version PREVIOUS_VERSION
```

### SAM Rollback
```bash
# Use CloudFormation to roll back
aws cloudformation rollback-stack --stack-name medibot-production
```

---

## Post-Deployment Verification

### Health Check
```bash
curl https://api.medibot.example.com/health
# Expected: {"status":"healthy","version":"4.0.0-gemini",...}
```

### Smoke Test
```bash
curl -X POST https://api.medibot.example.com/chat \
  -H "Content-Type: application/json" \
  -d '{"query":"Hello","generate_images":false}'
```

### CloudWatch Logs
```bash
aws logs tail /aws/lambda/medibot-api-production --follow
```

---

## Troubleshooting

| Issue | Resolution |
|-------|------------|
| Lambda timeout | Increase timeout in template.yaml |
| S3 permission denied | Check bucket policy and IAM role |
| Cognito auth failing | Verify User Pool ID and Client ID |
| High latency | Check Gemini API status, review CloudWatch metrics |

---

## Emergency Contacts

- **On-call Engineer**: Check PagerDuty rotation
- **AWS Support**: (for Business/Enterprise support)
- **Google Cloud Support**: (for Gemini API issues)
