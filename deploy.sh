#!/bin/bash
# deploy.sh - Deploy MediBot to AWS
# Usage: ./deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-production}
STACK_NAME="medibot-$ENVIRONMENT"
REGION="us-east-1"

echo "🚀 Deploying MediBot to AWS ($ENVIRONMENT)..."
echo ""

# Check prerequisites
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI not installed. Run: brew install awscli"; exit 1; }
command -v sam >/dev/null 2>&1 || { echo "❌ SAM CLI not installed. Run: brew install aws-sam-cli"; exit 1; }

# Check if GOOGLE_API_KEY is set
if [ -z "$GOOGLE_API_KEY" ]; then
    echo "❌ GOOGLE_API_KEY environment variable not set"
    echo "   Run: export GOOGLE_API_KEY='your-google-api-key'"
    exit 1
fi

echo "📦 Step 1: Building Lambda package..."
cd infrastructure
sam build

echo ""
echo "☁️ Step 2: Deploying backend to AWS Lambda..."
sam deploy \
    --stack-name $STACK_NAME \
    --parameter-overrides "GoogleApiKey=$GOOGLE_API_KEY Environment=$ENVIRONMENT" \
    --capabilities CAPABILITY_IAM \
    --no-fail-on-empty-changeset \
    --resolve-s3 \
    --region $REGION

# Get outputs
echo ""
echo "📝 Getting deployment outputs..."
API_URL=$(aws cloudformation describe-stacks --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text --region $REGION)
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' --output text --region $REGION)
CLOUDFRONT_URL=$(aws cloudformation describe-stacks --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontUrl`].OutputValue' --output text --region $REGION)
DISTRIBUTION_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' --output text --region $REGION)
COGNITO_USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`CognitoUserPoolId`].OutputValue' --output text --region $REGION)
COGNITO_CLIENT_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`CognitoClientId`].OutputValue' --output text --region $REGION)

echo ""
echo "🔨 Step 3: Building frontend..."
cd ../frontend

# Update API URL for Vite
# NOTE: Using manually set Function URL if hardcoded, otherwise falling back to API Gateway, or use env var
echo "VITE_API_URL=$API_URL" > .env
# Override with Function URL if it exists (for long-running tasks)
# Hardcoding Function URL for production based on previous steps
if [ "$ENVIRONMENT" == "production" ]; then
    echo "VITE_API_URL=https://7pzyuqb3eevmhqdazgylcapzoy0jsqrg.lambda-url.us-east-1.on.aws/" >> .env
fi

echo "VITE_COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID" >> .env
echo "VITE_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID" >> .env
echo "   API URL: $(cat .env | grep VITE_API_URL | cut -d= -f2 | tail -n1)"

# Build static export (Vite)
npm run build

echo ""
echo "📤 Step 4: Uploading frontend to S3..."
aws s3 sync dist/ s3://$BUCKET_NAME --delete --region $REGION

echo ""
echo "🔄 Step 5: Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*" --region $REGION >/dev/null

echo ""
echo "✅ =========================================="
echo "✅ Deployment Complete!"
echo "✅ =========================================="
echo ""
echo "🌐 Frontend URL: $CLOUDFRONT_URL"
echo "🔌 API URL:      $API_URL"
echo ""
echo "Test the API:"
echo "  curl $API_URL/health"
echo ""
