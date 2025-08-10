# Frame Picker - Migracja na AWS - Kontekst Referencyjny

## Stan obecny - styczeń 2025

### Architektura backendu

**Backend API (FastAPI + Python)**
- Framework: FastAPI 
- Język: Python 3.x (Poetry do zarządzania zależnościami)
- Port: konfigurowalny przez `settings.API_HOST`/`settings.API_PORT`
- Lokalizacja kodu: `/api/app/`

**Baza danych**
- PostgreSQL 17.5-alpine (Docker)
- Nazwa bazy: `framepicker`
- Użytkownik: `framepicker` / `postgres`
- Port: `5432`
- Migracje: Yoyo migrations (`/api/database/migrations/`)

**Frontend**
- Vanilla JS (frontend-lite)
- Build tool: Vite
- Output: `/frontend-lite/dist/`

### Aktualna infrastruktura AWS (CDK)

**Lokalizacja**: `/infrastructure/`

**Obecny stack (`infrastructure-stack.ts`)**:
- **S3 Bucket**: Hosting frontendu
  - Nazwa: `frame-picker-frontend-${account}-${region}`
  - Website hosting z `index.html`
  - Block public access + OAC dla CloudFront
  - Auto-delete objects przy usuwaniu

- **CloudFront Distribution**:
  - Origin Access Control (nowoczesne OAI)
  - HTTPS redirect
  - Caching optimized
  - Error handling (404/403 → index.html)
  - Price Class 100 (US/Europe)

- **S3 Deployment**:
  - Auto-deploy z `/frontend-lite/dist/`
  - Invalidacja CloudFront przy deploy

### Komponenty wymagające migracji

#### 1. Backend API (obecnie lokalnie)
**Obecne funkcjonalności**:
- Autentykacja JWT (`/api/app/utils/jwt.py`)
- Video processing (frame extraction)
- Billing system (Stripe integration)
- File upload/download endpoints
- Session management

**Endpointy API**:
- `/api/auth/` - autentykacja
- `/api/upload/` - upload wideo  
- `/api/processing/` - przetwarzanie
- `/api/download/` - pobieranie rezultatów
- `/api/billing/` - system płatności
- `/api/sessions/` - zarządzanie sesjami

#### 2. Storage dla plików
**Obecnie**: 
- Lokalne foldery `/uploads/` i `/results/`
- Upload wideo → processing → frame extraction → results

**Do migracji**:
- Input videos (S3)
- Processed frames (S3)  
- Tymczasowe pliki robocze

#### 3. Baza danych PostgreSQL
**Obecne tabele**:
- `users` - użytkownicy
- `sessions` - sesje przetwarzania
- `video_files` - metadane wideo
- `frame_results` - wyniki frame'ów
- `processing_jobs` - zadania przetwarzania
- `subscriptions` - subskrypcje użytkowników
- `payments` - historia płatności

### System płatności (Stripe)

**Konfiguracja** (z `BILLING.md`):
- Stripe Secret/Publishable Keys
- Webhook endpoint: `/api/billing/webhook`
- Pro tier: $2.99/miesiąc
- Events: checkout.session.completed, invoice.payment_succeeded, etc.

### LocalStack (Development)

**Obecna konfiguracja**:
- Image: `localstack/localstack:3.0`
- Endpoint: `http://localhost:4566` 
- Porty: 4510-4559, 4566 exposed
- Status: Running (healthy)
- Test credentials: `AWS_ACCESS_KEY_ID=test`, `AWS_SECRET_ACCESS_KEY=test`
- Emulowane serwisy: S3, Lambda, API Gateway, CloudFormation, etc.

**Użycie w development**:
- Testing AWS SDK calls lokalnie
- Integracja z CDK deploys przed prod
- Command example: `aws --endpoint-url=http://localhost:4566 s3api list-buckets`

### Koszt szacowany: $0.12/miesiąc

**Breakdown kosztów** (szacowany):
- CloudFront: ~$0.05
- S3 Storage: ~$0.02  
- Lambda (API): ~$0.03
- RDS/Aurora Serverless: ~$0.02

## Plan migracji (fazy)

### Faza 1: Backend API → AWS Lambda
**Cel**: Migracja FastAPI na serverless
- Lambda funkcje dla każdego endpointa
- API Gateway jako proxy
- Zachowanie istniejących endpointów

### Faza 2: Storage → S3
**Cel**: Migracja plików na S3
- Bucket dla uploads
- Bucket dla results  
- Presigned URLs dla upload/download
- Aktualizacja kodu do S3 SDK

### Faza 3: Baza danych → RDS/Aurora Serverless
**Cel**: Managed PostgreSQL
- RDS Serverless v2 (skalowanie 0.5-1 ACU)
- Migracja danych z lokalnego Postgres
- Connection pooling (RDS Proxy)

### Faza 4: Processing → Step Functions + Lambda
**Cel**: Serverless video processing
- Step Functions dla workflow
- Lambda do frame extraction
- SQS dla queue zadań

## Architektura docelowa AWS

```
Frontend (CloudFront + S3) → API Gateway → Lambda Functions
                                            ↓
                                        RDS Aurora Serverless
                                            ↓
                                    S3 Buckets (uploads/results)
```

**Serverless services**:
- **API Gateway**: REST API proxy
- **Lambda**: Backend logic (Python runtime)
- **RDS Aurora Serverless v2**: PostgreSQL 
- **S3**: File storage
- **CloudFront**: CDN (już zaimplementowany)
- **Step Functions**: Video processing workflow
- **SQS**: Task queue
- **CloudWatch**: Logs & monitoring

## Wymagania techniczne

### Environment Variables (do przeniesienia)
```bash
# Database
DATABASE_URL=postgresql://user:pass@aurora-endpoint/framepicker

# AWS
AWS_REGION=us-east-1  
S3_UPLOADS_BUCKET=frame-picker-uploads
S3_RESULTS_BUCKET=frame-picker-results

# Stripe (bez zmian)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Lambda Requirements
- Python 3.11 runtime
- FastAPI w Lambda (Mangum adapter)  
- Cold start optimization
- /tmp dla tymczasowych plików
- VPC access dla RDS

### Security
- IAM roles per Lambda funkcja
- VPC Security Groups
- RDS w prywatnych subnets
- S3 bucket policies
- CloudFront + WAF dla frontendu

## Deployment Configuration

### Obecny proces deployment (CDK)

**Makefile commands**:
```bash
make deploy  # Build frontend + CDK deploy
```

**Proces**:
1. `npm run build` w `/frontend-lite/` 
2. `cd infrastructure && npm run build`
3. `npx cdk deploy --require-approval never`

**CDK Output**:
- `DistributionDomainName`: CloudFront URL
- `DistributionId`: CloudFront distribution ID

### Development workflow

**Makefile targets**:
```bash
make setup          # Poetry install + Docker compose up
make api            # Start FastAPI server  
make frontend       # Start Vite dev server
make stripe-webhook # Stripe webhook forwarding
make test           # Run pytest suite
make db-migrate     # Apply Yoyo migrations
```

**Docker services**:
- PostgreSQL: `framepicker_postgres` na porcie 5432
- LocalStack: `framepicker_localstack` na porcie 4566

## Następne kroki

1. **Proof of Concept**: Pojedyncza Lambda z FastAPI
2. **Infrastructure as Code**: Rozszerzenie CDK stack
3. **CI/CD Pipeline**: GitHub Actions dla deploy
4. **Database Migration**: Script przenoszenia danych
5. **Testing**: E2E testy na AWS environment
6. **Monitoring**: CloudWatch dashboards
7. **Rollback Plan**: Blue/Green deployment

## Uwagi dotyczące implementacji

### Development vs Production
- LocalStack dla dev testing
- Staging environment na AWS
- Production z własnymi domain + SSL

### Cost Optimization  
- Aurora Serverless v2 (auto-pause)
- S3 Intelligent Tiering
- CloudFront cache optimization
- Lambda provisioned concurrency tylko dla krytycznych funkcji

### Monitoring & Alerts
- CloudWatch Logs agregation
- X-Ray tracing dla Lambdas
- Stripe webhook failure alerts
- Database connection monitoring

---
**Dokument stworzony**: 9 stycznia 2025  
**Status**: Analiza przed migracją  
**Następna aktualizacja**: Po rozpoczęciu Fazy 1