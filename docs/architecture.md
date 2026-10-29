# Software Architecture Document (SAD) — FixIt Now

**Standard:** IEEE 1471 / ISO/IEC/IEEE 42010 Architecture Description  
**Product:** FixIt Now — On-Demand Home-Services Marketplace  
**Version:** 1.0.0  
**Status:** Code-Grounded & Fully Verified  
**Date:** 2026-10-27  
**Artifact File:** [`architecture.md`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/architecture.md)  
**Companion Documents:** [`project_facts.md`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/project_facts.md), [`srs.md`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/srs.md)

---

## Table of Contents
1. [Architectural Style & Design Principles](#1-architectural-style--design-principles)
   - 1.1 [Architectural Style](#11-architectural-style)
   - 1.2 [Strict Architectural Constraints & Non-Existent Layers](#12-strict-architectural-constraints--non-existent-layers)
   - 1.3 [Core Architectural Patterns](#13-core-architectural-patterns)
2. [Component Catalog & Responsibilities](#2-component-catalog--responsibilities)
   - 2.1 [Architecture Diagram](#21-architecture-diagram)
   - 2.2 [Presentation Tier (Frontend Client — `client/`)](#22-presentation-tier-frontend-client--client)
   - 2.3 [Application / Business Tier (Backend Server — `server/`)](#23-application--business-tier-backend-server--server)
   - 2.4 [Persistence & Storage Tier (Database & Disk — `db/`, `server/uploads/`)](#24-persistence--storage-tier-database--disk--db-serveruploads)
3. [End-to-End Data Flows](#3-end-to-end-data-flows)
   - 3.1 [Data Flow 1: Authentication, JWT Issuance & Session Invalidation](#31-data-flow-1-authentication-jwt-issuance--session-invalidation)
   - 3.2 [Data Flow 2: Service Booking, 2.0 km Haversine Filtering & Sequential Dispatch Cascade](#32-data-flow-2-service-booking-20-km-haversine-filtering--sequential-dispatch-cascade)
   - 3.3 [Data Flow 3: Partner Job Acceptance, Atomic Concurrency Lock & Live Route Telemetry](#33-data-flow-3-partner-job-acceptance-atomic-concurrency-lock--live-route-telemetry)
   - 3.4 [Data Flow 4: On-Site Execution, Start OTP Verification, Completion & Payment Settlement](#34-data-flow-4-on-site-execution-start-otp-verification-completion--payment-settlement)
   - 3.5 [Data Flow 5: Partner KYC Multi-Document Submission & Admin Audit Decision](#35-data-flow-5-partner-kyc-multi-document-submission--admin-audit-decision)
   - 3.6 [Data Flow 6: Partner Subscription Billing, Dynamic QR Payment & Plan Price Governance](#36-data-flow-6-partner-subscription-billing-dynamic-qr-payment--plan-price-governance)
4. [Technology Stack & Configuration](#4-technology-stack--configuration)
   - 4.1 [Frontend Client Stack](#41-frontend-client-stack)
   - 4.2 [Backend Server Stack](#42-backend-server-stack)
   - 4.3 [Database & Storage Infrastructure](#43-database--storage-infrastructure)
   - 4.4 [External Third-Party APIs](#44-external-third-party-apis)
   - 4.5 [Runtime Configuration Variables](#45-runtime-configuration-variables)
5. [Verification Pass & Mismatch Resolution](#5-verification-pass--mismatch-resolution)
   - 5.1 [Component Import & Call Traceability Matrix](#51-component-import--call-traceability-matrix)
   - 5.2 [Discovered Architectural Mismatches & Verified Resolutions](#52-discovered-architectural-mismatches--verified-resolutions)

---

## 1. Architectural Style & Design Principles

### 1.1 Architectural Style
FixIt Now is designed as a **Layered Monolithic Client-Server Architecture** operating with **Dual Communication Channels**:
1. **Asynchronous HTTP REST API Channel:** Handles transactional, stateful request-response workflows (user authentication, profile updates, saved addresses, KYC document uploads via multipart form data, payment processing, catalog management, and administrative audit reviews).
2. **Event-Driven Bidirectional WebSocket Channel (Socket.IO):** Handles real-time, low-latency, event-driven interactions (sequential partner dispatch countdowns, job acceptance notifications, cancellation alerts, live GPS location telemetry simulation, start OTP prompts, and presence state synchronizations).

```
+-------------------------------------------------------------------------------+
|                       FIXIT NOW SYSTEM ARCHITECTURE                           |
|                                                                               |
|   +-----------------------------------------------------------------------+   |
|   |                  CLIENT TIER (React 19 + Vite SPA)                    |   |
|   |   +-------------------+  +-------------------+  +------------------+  |   |
|   |   |  Customer Portal  |  |  Partner Portal   |  |   Admin Portal   |  |   |
|   |   +-------------------+  +-------------------+  +------------------+  |   |
|   |   | State & Session: AuthContext.jsx | Routing: window.location.hash  |   |   |
|   +-----------------------------------------------------------------------+   |
|               |                                       ^                       |
|               | HTTP REST Requests                    | WebSocket Events      |
|               | (Fetch API via api.js)                | (Socket.IO Client)    |
|               v                                       v                       |
|   +-----------------------------------------------------------------------+   |
|   |                 SERVER TIER (Node.js + Express 4.21)                  |   |
|   |   +---------------------------------------------------------------+   |   |
|   |   | Middleware Pipeline: CORS -> JSON Parser -> Logger -> Auth     |   |   |
|   |   +---------------------------------------------------------------+   |   |
|   |   | Routing Layer: routes/*.routes.js                             |   |   |
|   |   +---------------------------------------------------------------+   |   |
|   |   | Controller Layer: controllers/*.controller.js                 |   |   |
|   |   +---------------------------------------------------------------+   |   |
|   |   | Domain Services Layer: socket, matching, payment, routes, etc.|   |   |
|   |   +---------------------------------------------------------------+   |   |
|   |   | Connection Pool: pg.Pool (db.js) | File Uploads: Multer Disk  |   |   |
|   +-----------------------------------------------------------------------+   |
|               |                                       |                       |
|               | Parameterized SQL Queries             | Local Disk I/O        |
|               v                                       v                       |
|   +---------------------------------------+   +---------------------------+   |
|   |        DATA PERSISTENCE TIER          |   |       STORAGE TIER        |   |
|   |       PostgreSQL 14+ Database         |   |    Local Filesystem       |   |
|   |             (16 Tables)               |   |   server/uploads/{kyc,    |   |
|   |   Raw Parameterized SQL ($1, $2)      |   |        requests}/         |   |
|   +---------------------------------------+   +---------------------------+   |
+-------------------------------------------------------------------------------+
```

### 1.2 Strict Architectural Constraints & Non-Existent Layers
To maintain 100% fidelity to the actual implementation in the codebase, the following architectural boundaries are strictly observed:
- **NO Object-Relational Mapping (ORM) Layer:** There is **no** Prisma, Sequelize, TypeORM, or Mongoose. All database persistence operations are executed through raw, parameterized SQL queries (`$1, $2, ...`) using the official `pg.Pool` connection pool in [`server/src/config/db.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/config/db.js).
- **NO External In-Memory Cache Cluster:** There is **no** Redis, Memcached, or Hazelcast instance. Live runtime states (e.g. active dispatches, 30-second timers, route interpolation intervals) are maintained in-process within JavaScript `Map` structures in [`server/src/services/socket.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/socket.service.js) and backed by database state persistence.
- **NO External Message Broker:** There is **no** RabbitMQ, Apache Kafka, or AWS SQS. Event distribution between server components and connected clients is performed directly through Socket.IO server-side rooms (`partner:<id>`, `customer:<id>`, `request:<id>`, `admin:broadcast`).
- **NO Distributed Microservices or API Gateway:** The backend is a single cohesive Node.js/Express monolith listening on port 5000/5001. All API routes are mounted under `/api` via [`server/src/routes/index.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/index.js).
- **NO Client-Side Routing Library:** The frontend does **not** use `react-router-dom`. Client-side page and portal navigation is handled via hash routing (`window.location.hash`), browser `hashchange` listeners, and React state switching in [`client/src/App.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/App.jsx).

### 1.3 Core Architectural Patterns
1. **Router-Controller-Service-Repository Pattern:**
   - **Router:** Validates HTTP verb, path matching, and applies authentication/role middleware guards ([`server/src/routes/`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes)).
   - **Controller:** Extracts HTTP headers, query params, and body payloads; invokes domain services; handles HTTP status responses ([`server/src/controllers/`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers)).
   - **Domain Service:** Implements algorithmic and business logic (Haversine formula calculations, sequential dispatch loops, Google Routes polyline decoding, token verification, payment attempt lifecycle) ([`server/src/services/`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services)).
   - **Data Access:** Direct execution of SQL queries and transactions via `db.query()` and `db.getClient()` ([`server/src/config/db.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/config/db.js)).
2. **Atomic Concurrency Mutex Pattern (Double-Accept Prevention):**
   - Concurrency is protected at both the database and service levels. Database partial unique index `idx_requests_active_partner` on `requests (partner_id)` prevents a partner from holding more than one active job.
   - Acceptance uses atomic conditional updates:
     ```sql
     UPDATE requests
     SET partner_id = $1, status = 'accepted', accepted_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND partner_id IS NULL AND status = 'searching'
     RETURNING *;
     ```
   - If two partners accept simultaneously, exactly one row update succeeds; the second receives 0 updated rows and returns HTTP 409 Conflict.
3. **Startup Recovery Pattern:**
   - On server process boot in [`server/src/server.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/server.js), three recovery tasks execute before listening:
     - `cleanupOrphanedSearchingRequests()`: Transitions dangling `'searching'` requests left from a previous crash to `'timed_out'`.
     - `resumeActiveTrips()`: Resumes movement telemetry simulation for any requests in `'partner_on_way'` status.
     - `recoverPaymentAttemptsOnStartup()`: Cleans up pending/expired payment attempts.

---

## 2. Component Catalog & Responsibilities

### 2.1 Architecture Diagram
The diagram below maps the physical codebase files and directories into their respective architectural layers:

```mermaid
graph TD
    subgraph Client ["Frontend Client (client/src/)"]
        App["App.jsx (Hash Router & Shell)"] --> AuthCtx["context/AuthContext.jsx"]
        App --> CustPortal["pages/customer/CustomerPortal.jsx"]
        App --> PartPortal["pages/partner/PartnerPortal.jsx"]
        App --> AdmPortal["pages/admin/AdminPortal.jsx"]
        App --> Landing["pages/LandingPage.jsx"]

        CustPortal --> CustViews["pages/customer/* Views<br/>(CreateRequest, LiveTracking, RateAndPay)"]
        PartPortal --> PartViews["pages/partner/* Views<br/>(Dashboard, ActiveJob, KycUpload, Plans)"]
        AdmPortal --> AdmViews["pages/admin/* Views<br/>(Dashboard, KycReview, Plans, Services)"]

        CustViews --> ApiClient["services/api.js (Fetch Wrapper)"]
        PartViews --> ApiClient
        AdmViews --> ApiClient

        CustViews --> SocketClient["services/socketService.js"]
        PartViews --> SocketClient
        AdmViews --> SocketClient

        CustViews --> MapComp["components/tracking/RouteTrackingMap.jsx"]
        PartViews --> MapComp
        PartViews --> QrModal["components/partner/QrPaymentModal.jsx"]
    end

    subgraph Network ["Network Transport"]
        ApiClient -->|HTTP REST /api/*| ExpressApp["server/src/app.js"]
        SocketClient <-->|WebSocket Events| SocketSvc["server/src/services/socket.service.js"]
    end

    subgraph Server ["Backend Server (server/src/)"]
        ServerBoot["server.js (Bootstrap)"] --> ExpressApp
        ServerBoot --> SocketSvc

        ExpressApp --> Middleware["middleware/*<br/>(auth, errorHandler, logger, upload)"]
        Middleware --> Routes["routes/*.routes.js<br/>(auth, customer, partner, request, admin)"]
        Routes --> Controllers["controllers/*.controller.js<br/>(auth, request, partner, payment, admin)"]

        Controllers --> SocketSvc
        Controllers --> MatchSvc["services/matching.service.js"]
        Controllers --> PaySvc["services/payment.service.js"]
        Controllers --> RouteSvc["services/routes.service.js"]
        Controllers --> TokenSvc["services/token.service.js"]
        Controllers --> OtpSvc["services/otp.service.js"]
        Controllers --> GeoSvc["services/geocoding.service.js"]

        SocketSvc --> MatchSvc
        SocketSvc --> RouteSvc
        SocketSvc --> TokenSvc
    end

    subgraph Storage ["Persistence & Storage (db/, server/uploads/)"]
        Controllers -->|Direct SQL| DbPool["config/db.js (pg.Pool)"]
        SocketSvc -->|Direct SQL| DbPool
        PaySvc -->|Direct SQL| DbPool
        Middleware -->|Multer Disk| LocalUploads["server/uploads/<br/>kyc/ & requests/"]
        DbPool --> Postgres[("PostgreSQL Database<br/>(16 Tables in db/schema.sql)")]
    end
```

---

### 2.2 Presentation Tier (Frontend Client — `client/`)

| Component Name | Physical File Path | Architectural Responsibility |
| :--- | :--- | :--- |
| **Client Main Bootstrapper** | [`client/src/main.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/main.jsx) | Entry point mounting the React root into `#root` DOM node, wrapping with `<AuthProvider>`. |
| **Master View & Hash Router** | [`client/src/App.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/App.jsx) | Handles hash-based routing (`window.location.hash`), role authentication guards, global theme toggling (light/dark), and top-level error boundary (`PortalErrorBoundary`). |
| **Authentication Context** | [`client/src/context/AuthContext.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/context/AuthContext.jsx) | Manages global authentication session (`user`, `token`, `role`), syncs with `localStorage`, and handles logout cleanup. |
| **Central HTTP API Client** | [`client/src/services/api.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/services/api.js) | Standardized `fetch` wrapper supporting `get`, `post`, `put`, `del`, and `postFormData` with automatic `Authorization: Bearer <token>` injection. |
| **Socket.IO Client Service** | [`client/src/services/socketService.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/services/socketService.js) | Singleton connection manager for Socket.IO client, providing event listeners (`incoming_request`, `partner_location`, `request_status_updated`, etc.) and registration emitters. |
| **Customer Portal Coordinator** | [`client/src/pages/customer/CustomerPortal.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/customer/CustomerPortal.jsx) | Coordinates customer portal tabs (dashboard, new request, searching, live tracking, rate & pay, history, profile, addresses). |
| **Partner Portal Coordinator** | [`client/src/pages/partner/PartnerPortal.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/partner/PartnerPortal.jsx) | Coordinates partner portal tabs (dashboard, active job, incoming request popup, KYC upload, plan selection/details, earnings, history, ratings, profile). |
| **Admin Portal Coordinator** | [`client/src/pages/admin/AdminPortal.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/admin/AdminPortal.jsx) | Coordinates administrative sub-views (dashboard, KYC review queue, plans, services, customers, partners, requests, subscriptions, ratings, activity log). |
| **Customer Shell Layout** | [`client/src/components/customer/CustomerLayout.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/components/customer/CustomerLayout.jsx) | Header, active status banners, quick action buttons, and responsive navigation shell for customers. |
| **Partner Shell Layout** | [`client/src/components/partner/PartnerLayout.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/components/partner/PartnerLayout.jsx) | Online/offline toggle switch, subscription status bar, earnings summary, and phone-first navigation shell for partners. |
| **Admin Shell Layout** | [`client/src/components/admin/AdminLayout.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/components/admin/AdminLayout.jsx) | Industrial high-density sidebar navigation, system telemetry badges, and session controls for administrators. |
| **Route Tracking Map** | [`client/src/components/tracking/RouteTrackingMap.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/components/tracking/RouteTrackingMap.jsx) | Google Maps JavaScript API renderer with two-wheeler route polyline display, live marker telemetry, and SVG fallback when offline. |
| **QR Payment Modal** | [`client/src/components/partner/QrPaymentModal.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/components/partner/QrPaymentModal.jsx) | Dynamic UPI QR code generator (`qrcode` library) with real-time payment completion polling and simulated payment triggers. |
| **Domain Services** | [`client/src/services/*.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/services) | Modular domain API clients (`authService`, `customerService`, `partnerService`, `requestService`, `adminService`, `notificationService`, `supportService`, `serviceService`, `healthService`). |
| **Client Utilities** | [`client/src/utils/*.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/utils) | Asynchronous Google Maps script loader ([`googleMapsLoader.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/utils/googleMapsLoader.js)) and vehicle type label formatters ([`vehicleType.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/utils/vehicleType.js)). |

---

### 2.3 Application / Business Tier (Backend Server — `server/`)

| Component Name | Physical File Path | Architectural Responsibility |
| :--- | :--- | :--- |
| **Process Lifecycle Bootstrap** | [`server/src/server.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/server.js) | Initializes database connectivity check, attaches Socket.IO to HTTP server, executes startup recovery scripts, listens on configured port, and manages graceful shutdown. |
| **Express Pipeline Factory** | [`server/src/app.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/app.js) | Configures Express app: CORS, JSON/URL-encoded body parsers, request logger, server-rendered QR pay pages (`/pay/:token`), API router mounting, and 404/error middleware. |
| **Server Configuration** | [`server/src/config/index.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/config/index.js) | Centralized, validated environment configuration loaded from `server/.env` (DB URL, JWT secrets, port, Google Maps API key, UPI ID, dispatch radius). |
| **Database Connection Pool** | [`server/src/config/db.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/config/db.js) | Manages PostgreSQL `pg.Pool` (max 20 clients, 30s idle timeout), provides `query()` wrapper, `getClient()` for transactions, and `testConnection()`. |
| **Auth & RBAC Middleware** | [`server/src/middleware/auth.middleware.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/middleware/auth.middleware.js) | Verifies Bearer JWT tokens, enforces `session_version` matching for partners to prevent concurrent reuse after logout, and enforces role access guards. |
| **Error Handling Middleware** | [`server/src/middleware/errorHandler.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/middleware/errorHandler.js) | Translates PostgreSQL error codes (`23505` conflict, `23503` foreign key, `23514` check constraint) and Multer file upload errors into normalized JSON responses. |
| **HTTP Request Logger** | [`server/src/middleware/logger.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/middleware/logger.js) | Logs method, URL, status code, and response duration for incoming HTTP traffic. |
| **File Upload Middleware** | [`server/src/middleware/upload.middleware.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/middleware/upload.middleware.js) | Multer disk storage engine enforcing file type whitelists (PDF for KYC documents, JPEG/PNG for photos) and size caps (5MB docs, 2MB photos). |
| **API Route Handlers** | [`server/src/routes/*.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes) | Route endpoints for `auth`, `customer`, `partner`, `request`, `admin`, `service`, `notification`, `support`, and `health`. |
| **Domain Controllers** | [`server/src/controllers/*.controller.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers) | HTTP request extraction, business rule validation, response formatting, and audit activity logging. |
| **Socket & Dispatch Service** | [`server/src/services/socket.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/socket.service.js) | Manages Socket.IO server, partner dispatch queue, 30-second sequential offer loop, cancellation cascade, and live movement simulation interval. |
| **Partner Matching Service** | [`server/src/services/matching.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/matching.service.js) | Computes Haversine distances, queries eligible candidates from PostgreSQL, validates 6-point eligibility checklist, and sorts nearest-first. |
| **Payment Service** | [`server/src/services/payment.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/payment.service.js) | Creates UPI payment attempts, generates standard UPI URIs, validates payment tokens, and manages transaction commitments for subscriptions. |
| **Routes & Polyline Service** | [`server/src/services/routes.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/routes.service.js) | Integrates with Google Routes API v2 (`computeRoutes`) with `TWO_WHEELER` mode, decodes 5-bit polylines, interpolates GPS positions, and provides straight-line fallbacks. |
| **Token & Password Service** | [`server/src/services/token.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/token.service.js) | Bcrypt password hashing/comparison (10 salt rounds) and JWT signing/verification (`jsonwebtoken`). |
| **OTP Generation Service** | [`server/src/services/otp.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/otp.service.js) | Generates cryptographically secure 6-digit numeric OTPs, stores them in `otps` table with 10-minute expiry, and handles one-time verification. |
| **Geocoding Service** | [`server/src/services/geocoding.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/geocoding.service.js) | Coordinates forward and reverse geocoding via Google Maps Geocoding API with Nominatim/OpenStreetMap fallback. |

---

### 2.4 Persistence & Storage Tier (Database & Disk — `db/`, `server/uploads/`)

#### Relational Database Engine
PostgreSQL (version 14+) managed via parameterized queries. Schema defined in [`db/schema.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/schema.sql) and [`db/migrations/003_payment_attempts.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/migrations/003_payment_attempts.sql).

| Table Name | Entity Scope & Key Columns | Architectural Function |
| :--- | :--- | :--- |
| `admins` | `id, email, password_hash, role` | Administrative credentials and access control. |
| `services` | `id, name, description, icon, is_active` | Service catalog categories offered to customers. |
| `customers` | `id, name, email, phone, password_hash` | Customer profile and credentials. |
| `saved_addresses` | `id, customer_id, label, address, latitude, longitude, is_default` | Customer bookmarked locations for fast booking. |
| `partners` | `id, name, email, phone, password_hash, service_id, vehicle, vehicle_type, kyc_status, online, latitude, longitude, session_version` | Service provider profile, verification state, live dispatch coordinates, and active session version. |
| `kyc_documents` | `id, partner_id, doc_type, file_path, status, rejection_reason` | Onboarding identification files and admin audit status. |
| `plans` | `id, name, price, duration_days, is_active` | Partner subscription pricing tiers. |
| `subscriptions` | `id, partner_id, plan_id, status, start_date, end_date` | Active/expired partner platform access subscriptions. |
| `payment_attempts` | `id, partner_id, plan_id, token, amount, status, expires_at` | Ephemeral QR code scan sessions for subscription purchases. |
| `requests` | `id, customer_id, partner_id, service_id, status, service_otp, total_amount, latitude, longitude, route_geometry` | Core service order lifecycle entity, coordinates, and OTP. |
| `request_status_logs` | `id, request_id, status, note, created_at` | Immutable audit trail of every status transition. |
| `payments` | `id, request_id, amount, payment_method, status` | Customer job settlement records (Cash, QR, Online). |
| `ratings` | `id, request_id, customer_id, partner_id, stars, comment` | Service quality ratings and customer reviews. |
| `notifications` | `id, recipient_type, recipient_id, title, message, is_read` | In-app notification center alerts. |
| `activity_logs` | `id, actor, action, details, created_at` | Administrative governance and security audit log. |
| `otps` | `id, target, code, purpose, expires_at, verified` | Password reset verification codes. |

#### File Storage System
- **KYC Documents:** Saved to local filesystem at `server/uploads/kyc/` outside of any public web root. Accessed exclusively via authenticated streaming endpoint `GET /api/partner/kyc/document/:docId` with role ownership checks.
- **Request Issue Photos:** Saved to local filesystem at `server/uploads/requests/` and streamed via authenticated endpoint `GET /api/requests/:id/photo`.

---

## 3. End-to-End Data Flows

### 3.1 Data Flow 1: Authentication, JWT Issuance & Session Invalidation

```mermaid
sequenceDiagram
    autonumber
    actor User as Customer / Partner / Admin
    participant React as client (App.jsx / AuthContext)
    participant AuthService as client/services/authService.js
    participant AuthRoute as server/routes/auth.routes.js
    participant AuthCtrl as server/controllers/auth.controller.js
    participant TokenSvc as server/services/token.service.js
    participant DB as PostgreSQL (customers / partners / admins)

    User->>React: Enters credentials & submits form
    React->>AuthService: customerLogin() / partnerLogin() / loginAdmin()
    AuthService->>AuthRoute: POST /api/auth/{customer,partner}/login or /api/admin/login
    AuthRoute->>AuthCtrl: loginCustomer() / loginPartner() / loginAdmin()
    AuthCtrl->>DB: SELECT id, password_hash, session_version FROM {table} WHERE email = $1
    DB-->>AuthCtrl: User record with hashed password
    AuthCtrl->>TokenSvc: comparePassword(enteredPassword, password_hash)
    TokenSvc-->>AuthCtrl: true (bcrypt match)
    AuthCtrl->>TokenSvc: generateToken({ id, email, role, session_version })
    TokenSvc-->>AuthCtrl: Signed JWT token (7d expiry)
    AuthCtrl-->>AuthService: HTTP 200 { status: 'success', token, user }
    AuthService->>React: setSession(token, user, role) -> localStorage.setItem('fixit_token')
    React-->>User: Redirects to Customer/Partner/Admin Portal view
```

#### Detailed Execution Steps:
1. **Submission:** User enters email and password into [`CustomerAuthView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/customer/CustomerAuthView.jsx), [`PartnerAuthView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/partner/PartnerAuthView.jsx), or [`AdminLoginView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/admin/AdminLoginView.jsx).
2. **Transport:** Invokes [`authService.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/services/authService.js) which posts JSON to Express endpoints via [`api.js: post()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/services/api.js).
3. **Verification:** [`auth.controller.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/auth.controller.js) queries user row by lowercase trimmed email. Calls `comparePassword()` in [`token.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/token.service.js) using `bcrypt.compare`.
4. **Token Generation:** Signs JWT containing `{ id, email, role, session_version }` using `jwtSecret` from [`config/index.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/config/index.js).
5. **Session Invalidation Check (Partner Logout Protection):** When a partner logs out, [`partner.controller.js: logoutPartner()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/partner.controller.js) executes:
   ```sql
   UPDATE partners SET online = false, session_version = COALESCE(session_version, 0) + 1 WHERE id = $1;
   ```
   [`auth.middleware.js: authenticateToken()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/middleware/auth.middleware.js) compares the token's `session_version` against the database; any outdated token is instantly rejected with HTTP 401.

---

### 3.2 Data Flow 2: Service Booking, 2.0 km Haversine Filtering & Sequential Dispatch Cascade

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer
    participant React as CreateRequestView.jsx
    participant ReqCtrl as server/controllers/request.controller.js
    participant MatchSvc as server/services/matching.service.js
    participant SocketSvc as server/services/socket.service.js
    participant DB as PostgreSQL (requests, partners)
    actor Partner as Eligible Partner

    Customer->>React: Selects service, enters address & confirms booking
    React->>ReqCtrl: POST /api/requests { service_id, address, latitude, longitude }
    ReqCtrl->>DB: INSERT INTO requests (customer_id, service_id, status='searching', ...) RETURNING *
    DB-->>ReqCtrl: Created request record (id: req_123)
    ReqCtrl->>MatchSvc: findEligiblePartnersFromDb(serviceId, lat, lon, 2.0)
    MatchSvc->>DB: Query partners: online=true, kyc='verified', active subscription, no active job
    DB-->>MatchSvc: Candidate partners with lat/lon
    MatchSvc->>MatchSvc: calculateHaversineDistance() <= 2.0 km -> Sort nearest-first
    MatchSvc-->>ReqCtrl: [Partner_A (0.4km), Partner_B (1.2km)]
    ReqCtrl->>SocketSvc: startRequestMatching(request, eligiblePartners)
    ReqCtrl-->>React: HTTP 201 { status: 'success', request: req_123 }
    React-->>Customer: Displays SearchingView.jsx with radar animation

    Note over SocketSvc,Partner: Sequential Dispatch Loop (Offer 1)
    SocketSvc->>Partner: Emit 'incoming_request' to room `partner:Partner_A` (30s countdown)
    Partner-->>Customer: Popup displays service, address, distance (0.4km), and timer
```

#### Detailed Execution Steps:
1. **Request Insertion:** [`request.controller.js: createRequest()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/request.controller.js) inserts a new row into `requests` with status `'searching'`.
2. **Candidate Query:** Calls `findEligiblePartnersFromDb()` in [`matching.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/matching.service.js). PostgreSQL query filters:
   - `p.online = true`
   - `p.kyc_status = 'verified'`
   - Active, unexpired subscription in `subscriptions` table
   - `p.service_id = $requested_service_id`
   - Excludes partners with active requests (`status IN ('accepted', 'partner_on_way', 'partner_arrived', 'service_started')`)
3. **Haversine Calculation:** Loops through candidates and calculates distance via `calculateHaversineDistance()`:
   $$\text{Haversine Distance } d = 2 R \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)} \right)$$
   Where $R = 6371\text{ km}$. Only partners with $d \le 2.0\text{ km}$ are retained, sorted ascending by distance.
4. **Dispatch Initiation:** [`socket.service.js: startRequestMatching()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/socket.service.js) registers an in-memory dispatch record in `activeDispatches` Map, sets a 30-second timer, and emits `incoming_request` to the nearest partner's private Socket room (`partner:<id>`).
5. **Cascade on Decline or Timeout:** If Partner A declines via `handlePartnerDecline()` or the 30s timer expires in `offerNextPartner()`, the system cancels the offer to Partner A, emits `request_dismiss`, and immediately advances the offer to Partner B.
6. **Exhaustion Handling:** If all eligible partners decline or time out, `handleMatchingTimeout()` updates request status to `'timed_out'`, inserts a log in `request_status_logs`, and emits `all_partners_busy` to `customer:<id>`.

---

### 3.3 Data Flow 3: Partner Job Acceptance, Atomic Concurrency Lock & Live Route Telemetry

```mermaid
sequenceDiagram
    autonumber
    actor Partner as Partner A
    participant PartPopup as IncomingRequestPopup.jsx
    participant SocketSvc as server/services/socket.service.js
    participant RouteSvc as server/services/routes.service.js
    participant DB as PostgreSQL
    participant CustView as LiveTrackingView.jsx
    actor Customer as Customer

    Partner->>PartPopup: Clicks "Accept Order"
    PartPopup->>SocketSvc: Socket emit 'respond_to_request' { requestId, decision: 'accept' }
    SocketSvc->>DB: Atomic Update: UPDATE requests SET partner_id=A, status='accepted' WHERE id=123 AND partner_id IS NULL AND status='searching'
    DB-->>SocketSvc: 1 Row Updated (Lock Acquired)
    SocketSvc->>RouteSvc: computeTwoWheelerRoute({ origin, destination })
    RouteSvc-->>SocketSvc: { distanceKm: 0.8, etaMinutes: 6, points: [[lat, lon], ...] }
    SocketSvc->>DB: UPDATE requests SET route_geometry=$points, route_distance_km=0.8
    SocketSvc->>CustView: Emit 'request_accepted' to `customer:Cust_ID` (Partner details, vehicle, route)
    SocketSvc->>PartPopup: Emit 'request_confirmed' (Transits to ActiveJobView.jsx)

    Note over SocketSvc,CustView: Telemetry Simulation Loop (Status: partner_on_way)
    SocketSvc->>SocketSvc: startMovementSimulation() (1-second tick interval)
    loop Every 1000ms
        SocketSvc->>SocketSvc: interpolatePositionAlongPolyline(points, distanceCovered)
        SocketSvc->>CustView: Emit 'partner_location' { lat, lng, remainingDistanceKm, etaMinutes, progress }
        SocketSvc->>PartPopup: Emit 'partner_location' { lat, lng, remainingDistanceKm, etaMinutes, progress }
    end
```

#### Detailed Execution Steps:
1. **Acceptance Submission:** Partner clicks accept on [`IncomingRequestPopup.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/partner/IncomingRequestPopup.jsx).
2. **Concurrency Mutex Update:** [`socket.service.js: handlePartnerAccept()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/socket.service.js) executes an atomic parameterized update on PostgreSQL. If another partner managed to claim the job milliseconds earlier, the update returns 0 rows; the call gracefully rejects with a notification that the request was taken.
3. **Route Computation:** Invokes `computeTwoWheelerRoute()` in [`routes.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/routes.service.js). Calls Google Routes API v2 (`https://routes.googleapis.com/directions/v2:computeRoutes`) with field mask `routes.distanceMeters,routes.polyline.encodedPolyline` and `travelMode: 'TWO_WHEELER'`. Decodes the polyline into `[lat, lon]` pairs via pure JavaScript bit-shifting (`decodePolyline()`). If the API fails or is offline, falls back to `getStraightLineFallbackRoute()` without throwing.
4. **Room Joining & Notification:** Both customer and partner sockets join the shared room `request:<requestId>`. The server broadcasts `request_accepted` and `request_confirmed`.
5. **Live Movement Simulation:** When the partner changes status to `'partner_on_way'`, [`socket.service.js: startMovementSimulation()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/socket.service.js) calculates travel speed based on vehicle type (40 km/h for two-wheelers, 35 km/h for cars), computes fractional progress along the polyline via `interpolatePositionAlongPolyline()`, and broadcasts `partner_location` ticks every 1000ms to update the map markers in real time.
6. **Arrival Event:** When progress reaches 100%, the simulation halts, invokes `notifyPartnerArrived()`, transitions request status to `'partner_arrived'` (Step 2), and generates a 4-digit numeric start OTP stored in `requests.service_otp`.

---

### 3.4 Data Flow 4: On-Site Execution, Start OTP Verification, Completion & Payment Settlement

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer
    actor Partner as Partner
    participant PartJob as ActiveJobView.jsx
    participant ReqCtrl as server/controllers/request.controller.js
    participant PayCtrl as server/controllers/payment.controller.js
    participant DB as PostgreSQL
    participant SocketSvc as server/services/socket.service.js

    Customer-->>Partner: Verbally communicates 4-digit Service OTP
    Partner->>PartJob: Enters OTP & taps "Verify & Begin Service"
    PartJob->>ReqCtrl: POST /api/requests/:id/verify-otp { otp: '4821' }
    ReqCtrl->>DB: SELECT service_otp FROM requests WHERE id = $1
    ReqCtrl->>ReqCtrl: Compare OTP with database record
    ReqCtrl->>DB: UPDATE requests SET status = 'service_started', service_started_at = NOW()
    ReqCtrl->>SocketSvc: notifyRequestStatusUpdate(id, 'service_started', 3)
    ReqCtrl-->>PartJob: HTTP 200 { status: 'success', step: 3 }

    Note over Partner,PartJob: Partner completes physical repair
    Partner->>PartJob: Taps "Work Completed"
    PartJob->>ReqCtrl: PUT /api/requests/:id/status { status: 'service_completed' }
    ReqCtrl->>DB: UPDATE requests SET status = 'service_completed', completed_at = NOW()
    ReqCtrl->>SocketSvc: notifyRequestStatusUpdate(id, 'service_completed', 4)

    Customer->>PayCtrl: POST /api/requests/:id/pay { paymentMethod: 'razorpay' / 'cash' / 'upi' }
    PayCtrl->>DB: INSERT INTO payments (request_id, amount, payment_method, status='completed')
    PayCtrl->>DB: UPDATE requests SET status = 'paid', payment_status = 'paid'
    PayCtrl->>SocketSvc: notifyRequestStatusUpdate(id, 'paid', 5)
    PayCtrl-->>Customer: HTTP 200 { status: 'success', receipt }
```

#### Detailed Execution Steps:
1. **Start OTP Verification:** Upon partner arrival, customer's [`LiveTrackingView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/customer/LiveTrackingView.jsx) displays the secure 4-digit `service_otp`. The partner inputs this code into [`ActiveJobView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/partner/ActiveJobView.jsx), triggering `POST /api/requests/:id/verify-otp`. [`request.controller.js: verifyRequestOtp()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/request.controller.js) validates the OTP, updates status to `'service_started'`, and emits status update step 3.
2. **Work Completion:** Once repair work finishes, partner clicks complete. `PUT /api/requests/:id/status` updates status to `'service_completed'` (Step 4).
3. **Payment Processing:** Customer is presented with [`RateAndPayView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/customer/RateAndPayView.jsx). Customer submits payment via `POST /api/requests/:id/pay` handled by [`payment.controller.js: processPayment()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/payment.controller.js):
   - Supports Cash on Delivery, UPI QR code, and simulated Razorpay payment gateway options.
   - Inserts record into `payments` table and updates `requests.status = 'paid'`.
4. **Rating & Feedback:** Customer submits 1–5 stars and comment via `POST /api/requests/:id/rate` ([`request.controller.js: rateRequest()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/request.controller.js)). Inserts into `ratings` table and re-aggregates `partners.rating` and `partners.rating_count`. If skipped, `skipRequestRating()` records the dismissal.

---

### 3.5 Data Flow 5: Partner KYC Multi-Document Submission & Admin Audit Decision

```mermaid
sequenceDiagram
    autonumber
    actor Partner as Partner
    participant KycView as KycUploadView.jsx
    participant UploadMw as server/middleware/upload.middleware.js
    participant PartCtrl as server/controllers/partner.controller.js
    participant Disk as server/uploads/kyc/
    participant DB as PostgreSQL (kyc_documents, partners, activity_logs)
    participant AdmView as AdminKycReviewView.jsx
    actor Admin as Admin

    Partner->>KycView: Attaches ID doc (PDF), photo (JPEG), trade certificate (PDF)
    KycView->>UploadMw: POST /api/partner/kyc (multipart/form-data)
    UploadMw->>UploadMw: Validate MIME types (PDF/JPG) & sizes (<= 5MB)
    UploadMw->>Disk: Writes sanitized files to server/uploads/kyc/
    UploadMw->>PartCtrl: uploadPartnerKyc(req, res)
    PartCtrl->>DB: INSERT INTO kyc_documents (partner_id, doc_type, file_path, status='pending')
    PartCtrl->>DB: UPDATE partners SET kyc_status = 'submitted'
    PartCtrl-->>KycView: HTTP 200 { status: 'submitted' }

    Admin->>AdmView: Opens KYC Review Queue
    AdmView->>DB: GET /api/admin/kyc?status=pending
    DB-->>AdmView: List of pending dossiers
    Admin->>AdmView: Approves partner OR rejects with reason
    AdmView->>PartCtrl: PUT /api/admin/kyc/:partnerId/decision { decision: 'verified'/'rejected', rejection_reason }
    PartCtrl->>DB: UPDATE partners SET kyc_status = $decision
    PartCtrl->>DB: UPDATE kyc_documents SET status = $decision
    PartCtrl->>DB: INSERT INTO activity_logs (actor='admin', action='KYC_DECISION', ...)
    PartCtrl-->>AdmView: HTTP 200 { status: 'updated' }
```

#### Detailed Execution Steps:
1. **Multipart File Handling:** In [`KycUploadView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/partner/KycUploadView.jsx), the partner uploads required files. [`upload.middleware.js: partnerKycUploadFields`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/middleware/upload.middleware.js) intercepts the request, verifies MIME types and 5MB caps, hashes file names with crypto random bytes, and writes files directly to `server/uploads/kyc/`.
2. **Metadata Registration:** [`partner.controller.js: uploadPartnerKyc()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/partner.controller.js) records file paths and document types in `kyc_documents` and updates `partners.kyc_status = 'submitted'`.
3. **Admin Dossier Inspection:** The administrator logs into [`AdminPortal.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/admin/AdminPortal.jsx) and opens [`AdminKycReviewView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/admin/AdminKycReviewView.jsx). Files are retrieved via authenticated stream endpoint `GET /api/partner/kyc/document/:docId` handled by `serveKycDocument()`.
4. **Audit Decision:** Admin submits decision via `PUT /api/admin/kyc/:partnerId/decision` ([`admin.controller.js: adminReviewKycDecision()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/admin.controller.js)).
   - If rejected, a rejection reason is strictly required by validation.
   - Updates `partners.kyc_status` to `'verified'` or `'rejected'`.
   - Records an immutable security audit entry into `activity_logs`.
   - Broadcasts real-time Socket event `kyc_status_updated` to the partner.
5. **Strict Immutability Rule:** Administrators are strictly prohibited from mutating or deleting customer or partner profile records. Any attempt to `PUT/PATCH/DELETE` customer/partner data routes through `rejectCustomerPartnerMutation()` in [`admin.controller.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/admin.controller.js), returning HTTP 403 Forbidden.

---

### 3.6 Data Flow 6: Partner Subscription Billing, Dynamic QR Payment & Plan Price Governance

```mermaid
sequenceDiagram
    autonumber
    actor Partner as Partner
    participant PlanView as PlanSelectionView.jsx
    participant QrModal as QrPaymentModal.jsx
    participant PaySvc as server/services/payment.service.js
    participant PayCtrl as server/controllers/payment.controller.js
    participant DB as PostgreSQL (plans, subscriptions, payment_attempts)

    Partner->>PlanView: Selects subscription tier (e.g. Pro Monthly, ₹499)
    PlanView->>QrModal: Opens payment dialog
    QrModal->>PayCtrl: POST /api/partner/payment-attempt { planId: 2 }
    PayCtrl->>PaySvc: createPaymentAttempt(partnerId, planId)
    PaySvc->>PaySvc: Generates crypto token & UPI URI (upi://pay?pa=...&am=499)
    PaySvc->>DB: INSERT INTO payment_attempts (partner_id, plan_id, token, amount, status='pending')
    PaySvc-->>QrModal: { token: 'tok_abc', qrPayload: 'upi://...', payUrl: 'http://.../pay/tok_abc' }
    QrModal->>QrModal: Renders dynamic SVG QR Code via qrcode library

    alt Option A: Partner Scans via Mobile Device
        actor Mobile as Partner Mobile UPI App
        Mobile->>PayCtrl: GET /pay/:token
        PayCtrl->>PayCtrl: renderPayPage() (Lightweight Mobile Web Interface)
        Mobile->>PayCtrl: POST /pay/:token/complete
        PayCtrl->>PaySvc: completePaymentAndCreateSubscription(attemptId)
    else Option B: Partner Clicks "Simulate Successful Payment"
        Partner->>PayCtrl: POST /api/partner/subscribe { planId: 2 }
        PayCtrl->>PaySvc: completePaymentAndCreateSubscription(attemptId)
    end

    PaySvc->>DB: UPDATE subscriptions SET status='active', start_date=NOW(), end_date=NOW()+INTERVAL '30 days'
    PaySvc->>DB: UPDATE payment_attempts SET status='completed'
    PaySvc-->>QrModal: Payment confirmed -> Subscription unlocked!
```

#### Detailed Execution Steps:
1. **Plan Selection:** In [`PlanSelectionView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/partner/PlanSelectionView.jsx), the partner views available tiers loaded from `GET /api/plans` (Standard 30 Days, Pro 90 Days, Annual 365 Days).
2. **Payment Attempt Creation:** Triggered by [`QrPaymentModal.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/components/partner/QrPaymentModal.jsx) calling `POST /api/partner/payment-attempt`. [`payment.service.js: createPaymentAttempt()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/payment.service.js) generates a cryptographic URL-safe scan token, creates a record in `payment_attempts` with a 15-minute expiry, and constructs a standard NPCI-compliant UPI URI (`upi://pay?pa=...&am=...&tn=...`).
3. **Mobile Scan & Render:** If scanned on mobile, [`app.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/app.js) routes `GET /pay/:token` through `payRateLimiter` to `renderPayPage()` in [`payment.controller.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/payment.controller.js). This serves a dedicated, mobile-optimized HTML checkout page allowing direct UPI app launch or instant test completion.
4. **Subscription Activation:** Upon payment completion, `completePaymentAndCreateSubscription()`:
   - Updates `payment_attempts.status = 'completed'`.
   - Expires any prior active subscriptions for this partner.
   - Inserts or activates a record in `subscriptions` with `start_date = CURRENT_TIMESTAMP` and `end_date = CURRENT_TIMESTAMP + plan.duration_days`.
   - Allows partner to toggle `online = true`, entering the dispatch radar.
5. **Business Rule BR-2 Governance:** When an administrator updates plan pricing via `PUT /api/admin/plans/:id` ([`admin.controller.js: updatePlanPrice()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/admin.controller.js)), the price change updates the `plans` table only. Existing rows in `subscriptions` remain completely untouched, ensuring price updates apply strictly to future subscriptions.

---

## 4. Technology Stack & Configuration

### 4.1 Frontend Client Stack
*Verified directly against [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json).*

| Technology | Verified Version | Architectural Role |
| :--- | :--- | :--- |
| **React** | `^19.2.8` | Declarative component UI library, Hooks (`useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`). |
| **React DOM** | `^19.2.8` | Browser DOM rendering engine for React tree. |
| **Vite** | `^8.3.0` | Development server with Hot Module Replacement (HMR) and optimized Rollup production bundler. |
| **Socket.IO Client** | `^4.8.4` | WebSocket client library handling reconnects, heartbeats, and room event listeners. |
| **Recharts** | `^3.10.1` | Responsive SVG chart library powering analytics in `AdminDashboard.jsx` and `EarningsView.jsx`. |
| **QRCode** | `^1.5.4` | Client-side 2D barcode canvas and SVG generator for UPI payment dynamic QR codes. |
| **Tailwind CSS** | `^3.4.19` | Utility-first CSS design system supporting customized light/dark brutalist theme tokens. |
| **PostCSS** | `^8.5.30` | CSS transformation pipeline processing Tailwind directives. |
| **Autoprefixer** | `^10.6.1` | Vendor-prefix parser ensuring cross-browser CSS compatibility. |
| **Oxlint** | `^1.81.0` | High-performance Rust-based linter for frontend code quality. |

---

### 4.2 Backend Server Stack
*Verified directly against [`server/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/package.json).*

| Technology | Verified Version | Architectural Role |
| :--- | :--- | :--- |
| **Node.js** | `>=18.0.0` (v24 tested) | V8 JavaScript server runtime environment executing ES Modules (`"type": "module"`). |
| **Express** | `^4.21.2` | Minimalist web application framework for routing, middleware pipelines, and HTTP controllers. |
| **Socket.IO Server** | `^4.8.4` | Real-time WebSocket engine enabling rooms, presence management, and low-latency dispatches. |
| **pg (node-postgres)** | `^8.23.1` | Non-blocking PostgreSQL client and connection pooling engine (`Pool`). |
| **bcrypt** | `^6.0.0` | Native cryptographic password hashing using salted Blowfish key derivation. |
| **jsonwebtoken** | `^9.0.3` | HMAC-SHA256 token signing and verification for stateless RBAC authentication. |
| **multer** | `^2.4.0` | Streaming `multipart/form-data` parser and disk storage manager for file uploads. |
| **cors** | `^2.8.5` | Cross-Origin Resource Sharing middleware permitting Vite client communication. |
| **dotenv** | `^16.4.7` | Environment configuration injector loading `.env` variables into `process.env`. |

---

### 4.3 Database & Storage Infrastructure
- **PostgreSQL 14+ Relational Database:** Managed with raw SQL schemas, foreign keys with cascading constraints, and partial indexes (`idx_requests_active_partner`).
- **Local File System Storage:** Storage directory trees at `server/uploads/kyc/` and `server/uploads/requests/`.

---

### 4.4 External Third-Party APIs
- **Google Maps JavaScript API (`geometry` library):** Client-side interactive map rendering, marker management, and polyline visualization in [`RouteTrackingMap.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/components/tracking/RouteTrackingMap.jsx).
- **Google Routes API v2 (`computeRoutes`):** Server-side two-wheeler directions and polyline geometry generation in [`routes.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/routes.service.js).
- **Google Maps Geocoding API:** Server-side address coordinate lookup in [`geocoding.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/geocoding.service.js).
- **OpenStreetMap Nominatim API:** Secondary geocoding fallback when Google Geocoding API key is unconfigured.
- **National Payments Corporation of India (NPCI) UPI Protocol:** Standardized `upi://pay` URI parameters for mobile payment app interoperability.
- **Razorpay Payment Gateway API:** Integrated with simulated mock fallback for non-production development environments.

---

### 4.5 Runtime Configuration Variables
*Loaded via [`server/src/config/index.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/config/index.js) from `server/.env`.*

| Environment Variable | Default Value in Code | Purpose |
| :--- | :--- | :--- |
| `PORT` | `5000` | HTTP and WebSocket listener port. |
| `NODE_ENV` | `development` | Runtime mode (`development`, `production`, `test`). |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS client origin. |
| `DATABASE_URL` | `postgresql://fixitnow:CCA142005@localhost:5432/fix_it_now` | PostgreSQL connection pool URI. |
| `JWT_SECRET` | `fixitnow-default-jwt-secret-key-change-in-prod` | Secret key for signing and verifying JWT tokens. |
| `JWT_EXPIRES_IN` | `7d` | Lifetime of issued authentication tokens. |
| `ADMIN_EMAIL` | `admin@fixitnow.com` | Primary administrative login identity. |
| `ADMIN_PASSWORD` | `admin@123` | Default administrative account password. |
| `MATCHING_RADIUS_KM` | `2.0` | Maximum great-circle radius for partner dispatch matching. |
| `PUBLIC_BASE_URL` | `http://localhost:5001` | Publicly accessible server URL for mobile QR checkout pages. |
| `UPI_ID` | `fixitnow@demo` | Destination UPI VPA for subscription QR payments. |
| `GOOGLE_MAPS_API_KEY`| `''` (empty string) | Server API key for Google Routes and Geocoding APIs. |
| `TWO_WHEELER_SPEED_KMH` | `40` | Simulated transit speed for bike/scooter partners. |
| `CAR_SPEED_KMH` | `35` | Simulated transit speed for car/four-wheeler partners. |
| `OTHER_SPEED_KMH` | `30` | Default transit speed for other transportation modes. |

---

## 5. Verification Pass & Mismatch Resolution

### 5.1 Component Import & Call Traceability Matrix
Every file, component, route, and function cited in this architectural document has been verified against active workspace code:

| Calling Component | Cited Symbol / Target | Target File Location | Code Trace Verification |
| :--- | :--- | :--- | :--- |
| [`client/src/App.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/App.jsx) | `useAuth()` | [`client/src/context/AuthContext.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/context/AuthContext.jsx) | Verified: Imports `useAuth`, checks role & session |
| [`client/src/App.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/App.jsx) | `CustomerPortal` | [`client/src/pages/customer/CustomerPortal.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/customer/CustomerPortal.jsx) | Verified: Rendered when `currentView === 'customer'` |
| [`client/src/App.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/App.jsx) | `PartnerPortal` | [`client/src/pages/partner/PartnerPortal.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/partner/PartnerPortal.jsx) | Verified: Rendered when `currentView === 'partner'` |
| [`client/src/App.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/App.jsx) | `AdminPortal` | [`client/src/pages/admin/AdminPortal.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/admin/AdminPortal.jsx) | Verified: Rendered when `currentView === 'admin'` |
| [`client/src/context/AuthContext.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/context/AuthContext.jsx) | `post()` | [`client/src/services/api.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/services/api.js) | Verified: Used in partner logout API calls |
| [`client/src/pages/customer/LiveTrackingView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/customer/LiveTrackingView.jsx) | `RouteTrackingMap` | [`client/src/components/tracking/RouteTrackingMap.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/components/tracking/RouteTrackingMap.jsx) | Verified: Embedded for live route and marker rendering |
| [`client/src/components/tracking/RouteTrackingMap.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/components/tracking/RouteTrackingMap.jsx) | `loadGoogleMaps()` | [`client/src/utils/googleMapsLoader.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/utils/googleMapsLoader.js) | Verified: Dynamically injects script tag with geometry lib |
| [`server/src/server.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/server.js) | `initSocketServer()` | [`server/src/services/socket.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/socket.service.js) | Verified: Attaches `Server` to `httpServer` instance |
| [`server/src/server.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/server.js) | `testConnection()` | [`server/src/config/db.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/config/db.js) | Verified: Queries PostgreSQL version on boot |
| [`server/src/server.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/server.js) | `cleanupOrphanedSearchingRequests()` | [`server/src/services/socket.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/socket.service.js) | Verified: Cleans dangling `'searching'` requests on boot |
| [`server/src/server.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/server.js) | `resumeActiveTrips()` | [`server/src/services/socket.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/socket.service.js) | Verified: Resumes active trips for `'partner_on_way'` on boot |
| [`server/src/app.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/app.js) | `renderPayPage()` | [`server/src/controllers/payment.controller.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/payment.controller.js) | Verified: Mounted at `/pay/:token` for mobile scan checkout |
| [`server/src/app.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/app.js) | `routes` | [`server/src/routes/index.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/index.js) | Verified: Mounted at `/api` root |
| [`server/src/routes/request.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/request.routes.js) | `createRequest()` | [`server/src/controllers/request.controller.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/request.controller.js) | Verified: Handles `POST /api/requests` |
| [`server/src/routes/request.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/request.routes.js) | `verifyRequestOtp()` | [`server/src/controllers/request.controller.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/request.controller.js) | Verified: Handles `POST /api/requests/:id/verify-otp` |
| [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js) | `rejectCustomerPartnerMutation()` | [`server/src/controllers/admin.controller.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/admin.controller.js) | Verified: Enforces HTTP 403 on customer/partner mutations |
| [`server/src/controllers/request.controller.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/request.controller.js) | `findEligiblePartnersFromDb()` | [`server/src/services/matching.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/matching.service.js) | Verified: Called in `createRequest` to find partners within 2km |
| [`server/src/controllers/request.controller.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/request.controller.js) | `startRequestMatching()` | [`server/src/services/socket.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/socket.service.js) | Verified: Initiates sequential countdown offers |
| [`server/src/controllers/request.controller.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/request.controller.js) | `startMovementSimulation()` | [`server/src/services/socket.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/socket.service.js) | Verified: Called when partner status changes to `'partner_on_way'` |
| [`server/src/services/socket.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/socket.service.js) | `computeTwoWheelerRoute()` | [`server/src/services/routes.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/routes.service.js) | Verified: Generates polyline upon partner acceptance |
| [`server/src/services/socket.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/socket.service.js) | `calculateHaversineDistance()` | [`server/src/services/matching.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/matching.service.js) | Verified: Reused for step distance validation |

---

### 5.2 Discovered Architectural Mismatches & Verified Resolutions
During our code audit, the following architectural nuances and potential discrepancies were identified, verified, and correctly documented:

1. **Routing Mechanism:**
   - *Initial Assumption:* The React SPA might be assumed to use standard `react-router-dom` (`<BrowserRouter>`, `<Routes>`, `<Route>`).
   - *Code Reality:* `package.json` contains no `react-router-dom`. Routing is implemented entirely using native **hash routing** (`window.location.hash`), browser `hashchange` listeners, and state switching inside [`client/src/App.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/App.jsx).
   - *Resolution in Architecture:* The document accurately describes the hash routing architecture and explicitly lists the absence of `react-router-dom`.

2. **Mobile Payment Rendering Layer:**
   - *Initial Assumption:* All payment interfaces are rendered through the client-side React SPA.
   - *Code Reality:* QR code scans on mobile devices resolve directly to Express server route `/pay/:token` handled by `renderPayPage()` in [`server/src/controllers/payment.controller.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/payment.controller.js). This renders a server-generated standalone HTML page allowing UPI app invocation without downloading the desktop client bundle.
   - *Resolution in Architecture:* Formally documented in Section 1.1, Section 2.3, and Data Flow 6 as a specialized server-rendered checkout endpoint.

3. **Multi-Route Mounting for Partner Resources:**
   - *Initial Assumption:* Partner endpoints are mounted strictly under `/api/partner`.
   - *Code Reality:* [`server/src/routes/index.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/index.js) mounts `partnerRoutes` under three aliases:
     - `router.use('/partner', partnerRoutes)`
     - `router.use('/partners', partnerRoutes)`
     - `router.use('/plans', partnerRoutes)`
   - *Resolution in Architecture:* Documented in Section 2.3 and Section 5.1, noting that public plan access `GET /api/plans` is mapped to `partnerRoutes: getSubscriptionPlans()`.

4. **Two-Wheeler Route Polyline Decoding:**
   - *Initial Assumption:* Decoding Google Maps polylines requires `@googlemaps/polyline-codec` or similar NPM packages.
   - *Code Reality:* [`server/src/services/routes.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/routes.service.js) implements pure JavaScript bitwise functions `decodePolyline()` and `encodePolyline()` with 0 external package dependencies.
   - *Resolution in Architecture:* Formally documented in Section 2.3 and Section 4.2.
