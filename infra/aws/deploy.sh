#!/usr/bin/env bash
# BoloAI AWS Deployment Script
# Usage: ./infra/aws/deploy.sh [production|staging] [--init]
set -euo pipefail

ENVIRONMENT="${1:-staging}"
INIT="${2:-}"
APP_NAME="boloai"
AWS_REGION="${AWS_REGION:-us-east-1}"
STACK_NAME="${APP_NAME}-${ENVIRONMENT}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_BASE="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "=== BoloAI Deploy — env=${ENVIRONMENT} region=${AWS_REGION} ==="

# ── Helper: require env var ──
require_env() {
  local var="$1"
  if [[ -z "${!var:-}" ]]; then
    echo "ERROR: required env var \$${var} is not set" >&2
    exit 1
  fi
}

require_env DOMAIN_NAME
require_env DB_PASSWORD
require_env SECRET_KEY
require_env SARVAM_API_KEY
require_env OPENAI_API_KEY
require_env STRIPE_SECRET_KEY

# ── Create ECR repositories if needed ──
for repo in backend frontend worker; do
  aws ecr describe-repositories --repository-names "${APP_NAME}-${repo}" --region "${AWS_REGION}" 2>/dev/null || \
    aws ecr create-repository --repository-name "${APP_NAME}-${repo}" --region "${AWS_REGION}"
done

# ── Docker login to ECR ──
aws ecr get-login-password --region "${AWS_REGION}" | \
  docker login --username AWS --password-stdin "${ECR_BASE}"

# ── Build & push images ──
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")
TAG="${ENVIRONMENT}-${GIT_SHA}"

echo "Building backend..."
docker build -t "${ECR_BASE}/${APP_NAME}-backend:${TAG}" \
             -t "${ECR_BASE}/${APP_NAME}-backend:${ENVIRONMENT}-latest" \
             -f backend/Dockerfile ./backend
docker push "${ECR_BASE}/${APP_NAME}-backend:${TAG}"
docker push "${ECR_BASE}/${APP_NAME}-backend:${ENVIRONMENT}-latest"

echo "Building frontend..."
docker build -t "${ECR_BASE}/${APP_NAME}-frontend:${TAG}" \
             -t "${ECR_BASE}/${APP_NAME}-frontend:${ENVIRONMENT}-latest" \
             -f frontend/Dockerfile ./frontend \
             --build-arg NEXT_PUBLIC_API_URL="https://api.${DOMAIN_NAME}"
docker push "${ECR_BASE}/${APP_NAME}-frontend:${TAG}"
docker push "${ECR_BASE}/${APP_NAME}-frontend:${ENVIRONMENT}-latest"

# ── Deploy/update CloudFormation stack ──
TEMPLATE_FILE="infra/aws/cloudformation.yml"
DEPLOY_PARAMS=(
  "ParameterKey=Environment,ParameterValue=${ENVIRONMENT}"
  "ParameterKey=DomainName,ParameterValue=${DOMAIN_NAME}"
  "ParameterKey=DBPassword,ParameterValue=${DB_PASSWORD}"
  "ParameterKey=SecretKey,ParameterValue=${SECRET_KEY}"
  "ParameterKey=SarvamApiKey,ParameterValue=${SARVAM_API_KEY}"
  "ParameterKey=OpenAIApiKey,ParameterValue=${OPENAI_API_KEY}"
  "ParameterKey=StripeSecretKey,ParameterValue=${STRIPE_SECRET_KEY}"
  "ParameterKey=BackendImage,ParameterValue=${ECR_BASE}/${APP_NAME}-backend:${TAG}"
  "ParameterKey=FrontendImage,ParameterValue=${ECR_BASE}/${APP_NAME}-frontend:${TAG}"
  "ParameterKey=WorkerImage,ParameterValue=${ECR_BASE}/${APP_NAME}-backend:${TAG}"
)

echo "Deploying CloudFormation stack: ${STACK_NAME}..."
aws cloudformation deploy \
  --stack-name "${STACK_NAME}" \
  --template-file "${TEMPLATE_FILE}" \
  --parameter-overrides "${DEPLOY_PARAMS[@]}" \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --region "${AWS_REGION}" \
  --no-fail-on-empty-changeset

echo "Fetching stack outputs..."
aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${AWS_REGION}" \
  --query "Stacks[0].Outputs" \
  --output table

# ── Run DB migrations via ECS exec after deploy (init mode only) ──
if [[ "${INIT}" == "--init" ]]; then
  echo "Running database migrations..."
  CLUSTER=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${AWS_REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='ECSClusterName'].OutputValue" \
    --output text)

  TASK_ARN=$(aws ecs run-task \
    --cluster "${CLUSTER}" \
    --task-definition "${APP_NAME}-${ENVIRONMENT}-backend" \
    --launch-type FARGATE \
    --overrides '{"containerOverrides":[{"name":"backend","command":["alembic","upgrade","head"]}]}' \
    --region "${AWS_REGION}" \
    --query "tasks[0].taskArn" \
    --output text)

  echo "Migration task ARN: ${TASK_ARN}"
  aws ecs wait tasks-stopped --cluster "${CLUSTER}" --tasks "${TASK_ARN}" --region "${AWS_REGION}"
  echo "Migrations complete."
fi

echo "=== Deployment complete ==="
