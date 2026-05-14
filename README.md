VantaCore — security-platform.

Enterprise Internal Document Security Platform

VantaCore is a security-first file management system designed to **prevent, detect, and respond to unauthorized data access** inside organizations.

Unlike traditional storage systems, VantaCore enforces:
- strict access control
- full audit traceability
- real-time anomaly detection
- automated containment and response

Core Features

🔐 Authentication & Authorization
- JWT-based authentication
- Role-Based Access Control (RBAC)
- Department-level authorization
- Session tracking with revocation

📁 Secure File Handling
- Pre-signed S3 upload/download URLs
- Private storage (no public access)
- Ownership and role-based access checks
- Sensitive access with justification

 Audit & Observability
- Structured JSON logging
- Full audit event tracking
- Correlation ID tracing
- Severity-based classification

🛡️ Detection & Response System
Detection
- Download spike detection
- Behavioral anomaly tracking

Response
- Session revocation
- Token invalidation enforcement
- Targeted containment (session/IP)
- User account locking

⚠️ Risk Scoring Engine
Weighted risk model:
- Download spike → +40
- Sensitive file access → +20
- Security override → +25

Final score determines:
- severity level
- automated response (alert / contain / lock)

📡 SOC Dashboard APIs
Backend APIs provide:
- security event timeline
- active incidents
- risky users
- risky files
- containment history

🔐 Security Capabilities

VantaCore simulates a production-grade security environment with:

- Identity-based access control (RBAC)
- Behavioral anomaly detection
- Real-time risk scoring
- Automated containment actions
- Full audit traceability with correlation IDs

🧱 Tech Stack

- Node.js + Express
- PostgreSQL (Prisma)
- AWS S3 (secure storage)
- JWT Authentication
- Docker (local development)

☁️ Architecture (Dev)
- EC2 → backend service
- RDS → PostgreSQL database
- S3 → private object storage
- CloudWatch → logs
- CloudTrail → audit tracking

🔄 Secure File Flow
Upload
1. Authenticated user requests upload
2. Backend validates request
3. Metadata stored in DB
4. Pre-signed URL generated
5. File uploaded directly to S3

Download
1. User requests file
2. Authorization checks applied
3. Pre-signed URL issued (short-lived)
4. Audit event logged

🔐 Security Highlights

- Stateless JWT + session validation
- Token revocation enforcement
- Private S3 (no public access)
- Structured audit logging
- Correlation ID tracing
- Automated containment system

🧪 Testing Scenarios

- RBAC validation (401 vs 403)
- Unauthorized file access
- Download spike detection
- Session revocation enforcement
- User lock escalation

📌 Current Status
✅ Authentication system  
✅ RBAC enforcement  
✅ Secure file upload/download  
✅ Audit logging  
✅ Anomaly detection  
✅ Automated containment  
✅ Token revocation enforcement  
✅ IP-based containment  
✅ Risk scoring engine  
✅ SOC backend APIs  

🛣️ Roadmap

- SOC Dashboard UI (React)
- Real-time alerting
- MFA implementation
- SIEM integration
- AI-assisted monitoring agents

🎯 Vision

VantaCore is being built as a "security platform for mid-sized enterprises", combining:

- automated detection  
- risk-based response  
- human-controlled security decisions  

⚠️ Security Note
No secrets or credentials are stored in this repository.

🧑‍💻 Author

Built as a security-focused cloud project demonstrating:
- SOC-level thinking
- cloud security architecture
- detection & response systems
