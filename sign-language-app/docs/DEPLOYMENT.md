# 🚀 Deployment Guide

**Triển khai Sign Language App lên Production**

---

## 📋 Mục Lục

1. [Pre-deployment Checklist](#pre-deployment-checklist)
2. [Docker Build & Push](#docker-build--push)
3. [AWS Deployment](#aws-deployment)
4. [GCP Deployment](#gcp-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Database Setup](#database-setup)
7. [Monitoring & Logging](#monitoring--logging)
8. [Scaling](#scaling)

---

## ✅ Pre-deployment Checklist

Trước khi deploy, chắc chắn:

- [ ] Tất cả tests pass (`npm test`, `pytest`)
- [ ] Code review completed
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates ready
- [ ] Domain name configured
- [ ] Backups created
- [ ] Documentation updated
- [ ] Load testing done
- [ ] Security audit passed

---

## 🐳 Docker Build & Push

### Build Docker Images

```bash
# Build all images
docker-compose build

# Build specific service
docker build -t sign-language-backend:latest ./backend
docker build -t sign-language-frontend:latest ./frontend
```

### Push to Docker Registry

**Docker Hub:**
```bash
# Login
docker login

# Tag images
docker tag sign-language-backend:latest username/sign-language-backend:latest
docker tag sign-language-frontend:latest username/sign-language-frontend:latest

# Push
docker push username/sign-language-backend:latest
docker push username/sign-language-frontend:latest
```

**AWS ECR:**
```bash
# Create repositories
aws ecr create-repository --repository-name sign-language-backend
aws ecr create-repository --repository-name sign-language-frontend

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag sign-language-backend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/sign-language-backend:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/sign-language-backend:latest
```

---

## ☁️ AWS Deployment

### Option 1: ECS (Recommended)

**Step 1: Create ECS Cluster**
```bash
aws ecs create-cluster --cluster-name sign-language-cluster
```

**Step 2: Create Task Definition**
```json
{
  "family": "sign-language-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/sign-language-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "hostPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "postgresql://user:pass@db.example.com/sign_language_db"
        }
      ]
    }
  ]
}
```

**Step 3: Register Task Definition**
```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

**Step 4: Create Service**
```bash
aws ecs create-service \
  --cluster sign-language-cluster \
  --service-name sign-language-backend \
  --task-definition sign-language-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

### Option 2: Elastic Beanstalk

**Initialize:**
```bash
eb init -p docker sign-language-app
```

**Deploy:**
```bash
eb create sign-language-environment
eb deploy
```

**View logs:**
```bash
eb logs
```

---

## ☁️ GCP Deployment

### Option 1: Cloud Run

**Deploy Backend:**
```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/sign-language-backend ./backend

# Deploy
gcloud run deploy sign-language-backend \
  --image gcr.io/PROJECT_ID/sign-language-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars "DATABASE_URL=postgresql://..." \
  --memory 1Gi \
  --timeout 3600
```

**Deploy Frontend:**
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/sign-language-frontend ./frontend

gcloud run deploy sign-language-frontend \
  --image gcr.io/PROJECT_ID/sign-language-frontend \
  --platform managed \
  --region us-central1
```

### Option 2: GKE (Kubernetes)

**Create Cluster:**
```bash
gcloud container clusters create sign-language-cluster \
  --num-nodes 3 \
  --machine-type n1-standard-2
```

**Deploy with Helm:**
```bash
helm repo add sign-language https://charts.example.com
helm install sign-language sign-language/sign-language-app
```

---

## 🔐 Environment Configuration

### Production .env

**File:** `backend/.env.production`
```env
# Application
ENVIRONMENT=production
BACKEND_PORT=8000
FRONTEND_URL=https://app.example.com
DEBUG=False

# Database
DATABASE_URL=postgresql://user:strong_password@prod-db.example.com:5432/sign_language_db
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/sign_language?retryWrites=true

# Cache
REDIS_URL=redis://:password@redis.example.com:6379

# JWT
SECRET_KEY=your-production-secret-key-min-32-chars-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
ALLOWED_ORIGINS=https://app.example.com,https://www.example.com

# Email (for notifications)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=app_password

# AWS (for file uploads)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_BUCKET_NAME=sign-language-uploads
AWS_REGION=us-east-1

# Monitoring
SENTRY_DSN=https://key@sentry.io/123456
LOG_LEVEL=INFO
```

### Frontend .env.production

```env
VITE_API_URL=https://api.example.com
VITE_WS_URL=wss://api.example.com
VITE_APP_NAME=Sign Language Interpreter
```

---

## 💾 Database Setup

### PostgreSQL on AWS RDS

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier sign-language-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YourStrongPassword123! \
  --allocated-storage 100 \
  --backup-retention-period 30 \
  --enable-cloudwatch-logs-exports postgresql \
  --publicly-accessible false
```

### MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string
4. Add IP whitelist
5. Set connection string in `.env`

### Database Initialization

```bash
# Connect to production database
psql -h prod-db.example.com -U admin -d sign_language_db

# Run migrations
alembic upgrade head

# Seed initial data
python scripts/seed_database.py
```

---

## 📊 Monitoring & Logging

### Application Monitoring (Sentry)

```python
# backend/main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[FastApiIntegration()],
    traces_sample_rate=0.1,
    environment="production"
)
```

### Logging Configuration

```python
# backend/app/config.py
import logging
import logging.handlers

def setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    # File handler
    handler = logging.handlers.RotatingFileHandler(
        'logs/app.log',
        maxBytes=10485760,  # 10MB
        backupCount=10
    )
    
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
```

### CloudWatch (AWS)

```bash
# Configure CloudWatch logs
aws logs create-log-group --log-group-name /ecs/sign-language-backend
aws logs create-log-stream --log-group-name /ecs/sign-language-backend --log-stream-name prod
```

### Metrics & Alarms

```bash
# Create CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name high-cpu-usage \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

---

## 📈 Scaling

### Auto-scaling Configuration

**AWS ECS:**
```bash
# Create auto-scaling target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/sign-language-cluster/sign-language-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --policy-name cpu-scaling \
  --service-namespace ecs \
  --resource-id service/sign-language-cluster/sign-language-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

**Scaling Policy Config:**
```json
{
  "TargetValue": 70.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  },
  "ScaleOutCooldown": 300,
  "ScaleInCooldown": 300
}
```

### Load Balancing

**AWS ALB:**
```bash
# Create target group
aws elbv2 create-target-group \
  --name sign-language-backend-tg \
  --protocol HTTP \
  --port 8000 \
  --vpc-id vpc-xxx

# Create load balancer
aws elbv2 create-load-balancer \
  --name sign-language-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

**File:** `.github/workflows/deploy.yml`
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Build Docker images
        run: docker-compose build
      
      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker tag sign-language-backend $ECR_REGISTRY/sign-language-backend:latest
          docker push $ECR_REGISTRY/sign-language-backend:latest
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster sign-language-cluster \
            --service sign-language-backend \
            --force-new-deployment
```

---

## 🔒 Security Checklist

- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Hide sensitive environment variables
- [ ] Enable database encryption
- [ ] Setup WAF (Web Application Firewall)
- [ ] Regular security updates
- [ ] Implement rate limiting
- [ ] Enable DDOS protection
- [ ] Backup strategy
- [ ] Access control configured

---

## 📝 Deployment Checklist

**Before Deploying:**
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Database backups created
- [ ] Team notified
- [ ] Rollback plan ready

**After Deploying:**
- [ ] Monitor logs
- [ ] Check error rates
- [ ] Verify API endpoints
- [ ] Test user flows
- [ ] Monitor performance
- [ ] Update status page

---

## 🆘 Troubleshooting

**Deployment Fails:**
```bash
# Check logs
docker logs <container_id>

# Check services health
docker-compose ps

# Restart services
docker-compose restart
```

**High Memory Usage:**
```bash
# Check memory
docker stats

# Increase container memory in docker-compose.yml
```

**Database Connection Issues:**
```bash
# Test connection
psql -h prod-db.example.com -U admin -d sign_language_db

# Check credentials in .env
```

---

**Deployment Complete! 🎉**
