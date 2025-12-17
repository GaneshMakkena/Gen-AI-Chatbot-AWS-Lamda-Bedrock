#!/bin/bash
# deploy_frontend_only.sh - Deploy MediBot Frontend ONLY
# Usage: ./deploy_frontend_only.sh [staging|production]

set -e

ENVIRONMENT=${1:-production}
STACK_NAME="medibot-$ENVIRONMENT"
REGION="us-east-1"

echo "🚀 Deploying MediBot Frontend to AWS ($ENVIRONMENT)..."
echo "Skipping backend deployment..."

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

echo "outputs gathered"

echo ""
echo "🔨 Step 3: Building frontend..."
cd frontend

# Update API URL for Vite
echo "VITE_API_URL=$API_URL" > .env
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
echo "✅ Frontend Deployment Complete!"
echo "✅ =========================================="
echo ""
echo "🌐 Frontend URL: $CLOUDFRONT_URL"
echo ""
