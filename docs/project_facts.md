# Project Facts: FixIt Now

This document contains facts verified strictly from the codebase of **FixIt Now**. Every fact is cited with the exact file path where it is declared or implemented. No speculation or unverified claims are included.

---

## 1. Project Name & Description

- **Root Project Name:** `fixit-now`
  - *Source:* [`package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/package.json#L2)
- **Root Project Version:** `1.0.0`
  - *Source:* [`package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/package.json#L3)
- **Root Description:** `"FixIt Now - On-demand home-services marketplace with customer, partner, and admin portals"`
  - *Source:* [`package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/package.json#L5)
- **Client Workspace Name:** `client` (Version: `0.0.0`, Private: `true`)
  - *Source:* [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json#L2-L4)
- **Server Workspace Name:** `server` (Version: `1.0.0`, Description: `"FixIt Now - Node.js Express REST API"`)
  - *Source:* [`server/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/package.json#L2-L4)
- **Documentation Title:** `"FixIt Now — On-Demand Home-Services Marketplace"`
  - *Source:* [`README.md`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/README.md#L1)

---

## 2. Tech Stack and Versions

### Runtime & Engines
- **Node.js:** `"v18+ recommended; tested on v24"`
  - *Source:* [`README.md`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/README.md#L85)
- **npm:** `"v9+ recommended; tested on v11"`
  - *Source:* [`README.md`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/README.md#L86)
- **Module System:** ECMAScript Modules (`"type": "module"`)
  - *Source:* [`package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/package.json#L4), [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json#L5), [`server/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/package.json#L5)

### Frontend Tech Stack
- **UI Library:** React `^19.2.8`
  - *Source:* [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json#L14)
- **DOM Renderer:** React DOM `^19.2.8`
  - *Source:* [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json#L15)
- **Build Tool & Dev Server:** Vite `^8.3.0`
  - *Source:* [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json#L27), [`client/vite.config.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/vite.config.js#L1-L17)
- **Vite React Plugin:** `@vitejs/plugin-react` `^6.1.1`
  - *Source:* [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json#L22)
- **Styling Framework:** Tailwind CSS `^3.4.19`
  - *Source:* [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json#L26), [`client/tailwind.config.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/tailwind.config.js#L1-L34)
- **CSS Preprocessor / Postprocessing:** PostCSS `^8.5.30`, Autoprefixer `^10.6.1`
  - *Source:* [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json#L23-L25), [`client/postcss.config.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/postcss.config.js#L1-L6)
- **Data Visualization / Charts:** Recharts `^3.10.1`
  - *Source:* [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json#L16)
- **QR Code Generation:** qrcode `^1.5.4`
  - *Source:* [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json#L13)
- **Real-Time Client:** Socket.IO Client `^4.8.4`
  - *Source:* [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json#L17)
- **Client Linter:** Oxlint `^1.81.0`
  - *Source:* [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json#L24), [`client/.oxlintrc.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/.oxlintrc.json#L1-L10)
- **Type Definitions:** `@types/react` `^19.2.18`, `@types/react-dom` `^19.2.7`
  - *Source:* [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json#L20-L21)

### Backend Tech Stack
- **Web Framework:** Express `^4.21.2`
  - *Source:* [`server/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/package.json#L28)
- **Real-Time Server:** Socket.IO `^4.8.4`
  - *Source:* [`server/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/package.json#L32), [`server/src/services/socket.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/socket.service.js#L12)
- **Database Driver:** `pg` (node-postgres) `^8.23.1`
  - *Source:* [`server/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/package.json#L31), [`package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/package.json#L29), [`server/src/config/db.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/config/db.js#L6)
- **Authentication & Cryptography:**
  - `bcrypt` `^6.0.0`
    - *Source:* [`server/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/package.json#L25), [`package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/package.json#L27)
  - `jsonwebtoken` `^9.0.3`
    - *Source:* [`server/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/package.json#L29), [`server/src/services/token.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/token.service.js#L6)
- **File Upload Handler:** `multer` `^2.4.0`
  - *Source:* [`server/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/package.json#L30), [`server/src/middleware/upload.middleware.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/middleware/upload.middleware.js#L6)
- **Cross-Origin Resource Sharing:** `cors` `^2.8.5`
  - *Source:* [`server/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/package.json#L26), [`server/src/app.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/app.js#L12)
- **Environment Management:** `dotenv` `^16.4.7` (server), `dotenv` `^18.0.8` (root)
  - *Source:* [`server/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/package.json#L27), [`package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/package.json#L28)

### Root Code Quality & Formatting
- **Linter:** ESLint `^9.20.0` with `@eslint/js` `^9.20.0`, `eslint-plugin-react` `^7.37.4`, `eslint-plugin-react-hooks` `^5.1.0`, `globals` `^15.14.0`
  - *Source:* [`package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/package.json#L19-L23), [`eslint.config.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/eslint.config.js#L1-L61)
- **Code Formatter:** Prettier `^3.5.1`
  - *Source:* [`package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/package.json#L24), [`.prettierrc`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/.prettierrc#L1-L10), [`.prettierignore`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/.prettierignore#L1-L9)

---

## 3. Folder Structure

```
c:\Users\chris\OneDrive\Desktop\Mini Project FixIt Now\
├── .env.example
├── .git/
├── .gitignore
├── .prettierignore
├── .prettierrc
├── README.md
├── eslint.config.js
├── package.json
├── package-lock.json
│
├── client/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── .oxlintrc.json
│   ├── README.md
│   ├── dist/
│   ├── index.html
│   ├── node_modules/
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.js
│   ├── public/
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src/
│       ├── App.css
│       ├── App.jsx
│       ├── index.css
│       ├── main.jsx
│       ├── assets/
│       ├── components/
│       │   ├── admin/
│       │   │   └── AdminLayout.jsx
│       │   ├── customer/
│       │   │   └── CustomerLayout.jsx
│       │   ├── partner/
│       │   │   ├── PartnerLayout.jsx
│       │   │   └── QrPaymentModal.jsx
│       │   └── tracking/
│       │       └── RouteTrackingMap.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── mockData/
│       ├── pages/
│       │   ├── LandingPage.jsx
│       │   ├── admin/
│       │   │   ├── AdminActivityLogView.jsx
│       │   │   ├── AdminCustomersView.jsx
│       │   │   ├── AdminDashboard.jsx
│       │   │   ├── AdminKycReviewView.jsx
│       │   │   ├── AdminLoginView.jsx
│       │   │   ├── AdminPartnersView.jsx
│       │   │   ├── AdminPlansView.jsx
│       │   │   ├── AdminPortal.jsx
│       │   │   ├── AdminRatingsView.jsx
│       │   │   ├── AdminRequestsView.jsx
│       │   │   ├── AdminServicesView.jsx
│       │   │   └── AdminSubscriptionsView.jsx
│       │   ├── common/
│       │   │   ├── NotificationsView.jsx
│       │   │   └── SupportView.jsx
│       │   ├── customer/
│       │   │   ├── CreateRequestView.jsx
│       │   │   ├── CustomerAuthView.jsx
│       │   │   ├── CustomerDashboard.jsx
│       │   │   ├── CustomerPortal.jsx
│       │   │   ├── CustomerProfileView.jsx
│       │   │   ├── LiveTrackingView.jsx
│       │   │   ├── RateAndPayView.jsx
│       │   │   ├── RequestHistoryView.jsx
│       │   │   ├── SavedAddressesView.jsx
│       │   │   └── SearchingView.jsx
│       │   └── partner/
│       │       ├── ActiveJobView.jsx
│       │       ├── EarningsView.jsx
│       │       ├── IncomingRequestPopup.jsx
│       │       ├── KycUploadView.jsx
│       │       ├── PartnerAuthView.jsx
│       │       ├── PartnerDashboard.jsx
│       │       ├── PartnerHistoryView.jsx
│       │       ├── PartnerPortal.jsx
│       │       ├── PartnerProfileView.jsx
│       │       ├── PartnerRatingsView.jsx
│       │       ├── PlanDetailsView.jsx
│       │       └── PlanSelectionView.jsx
│       ├── services/
│       │   ├── adminService.js
│       │   ├── api.js
│       │   ├── authService.js
│       │   ├── customerService.js
│       │   ├── healthService.js
│       │   ├── notificationService.js
│       │   ├── partnerService.js
│       │   ├── requestService.js
│       │   ├── serviceService.js
│       │   ├── socketService.js
│       │   └── supportService.js
│       └── utils/
│           ├── googleMapsLoader.js
│           └── vehicleType.js
│
├── server/
│   ├── .env
│   ├── .env.example
│   ├── node_modules/
│   ├── package.json
│   ├── package-lock.json
│   ├── test_change3.js
│   ├── test_change4.js
│   ├── scratch/
│   ├── scripts/
│   │   ├── test-phase3-auth.js
│   │   ├── test-phase5-admin.js
│   │   ├── test-phase5-e2e-kyc-unlock.js
│   │   └── test-phase6-matching.js
│   ├── test/
│   │   ├── demo-checklist.test.js
│   │   └── matching.test.js
│   ├── tests/
│   │   ├── bugs/
│   │   ├── concurrency/
│   │   │   └── concurrency.test.js
│   │   ├── fix1_skip_rating.test.js
│   │   ├── fix2_blank_screen_view_issue.test.js
│   │   ├── fix2_vehicle_type.test.js
│   │   ├── fix3_issue_photo.test.js
│   │   ├── fix3_vehicle_types.test.js
│   │   ├── fix4_review_waiting.test.js
│   │   ├── kyc/
│   │   ├── logout/
│   │   ├── partner_flow_fixes.test.js
│   │   ├── payment/
│   │   │   └── payment.test.js
│   │   ├── ratings/
│   │   ├── routes_geocoding.test.js
│   │   └── terms/
│   ├── uploads/
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/
│       │   ├── db.js
│       │   └── index.js
│       ├── controllers/
│       │   ├── admin.controller.js
│       │   ├── auth.controller.js
│       │   ├── customer.controller.js
│       │   ├── health.controller.js
│       │   ├── notification.controller.js
│       │   ├── partner.controller.js
│       │   ├── payment.controller.js
│       │   ├── request.controller.js
│       │   ├── service.controller.js
│       │   └── support.controller.js
│       ├── middleware/
│       │   ├── auth.middleware.js
│       │   ├── errorHandler.js
│       │   ├── logger.js
│       │   └── upload.middleware.js
│       ├── routes/
│       │   ├── admin.routes.js
│       │   ├── auth.routes.js
│       │   ├── customer.routes.js
│       │   ├── health.routes.js
│       │   ├── index.js
│       │   ├── notification.routes.js
│       │   ├── partner.routes.js
│       │   ├── request.routes.js
│       │   ├── service.routes.js
│       │   └── support.routes.js
│       └── services/
│           ├── geocoding.service.js
│           ├── matching.service.js
│           ├── otp.service.js
│           ├── payment.service.js
│           ├── routes.service.js
│           ├── socket.service.js
│           └── token.service.js
│
├── db/
│   ├── README.md
│   ├── demo-seed.js
│   ├── migrate.js
│   ├── migrate_phase4.js
│   ├── schema.sql
│   ├── seed.js
│   ├── seed.sql
│   └── migrations/
│       ├── 001_broadcast_concurrency.sql
│       ├── 002_terms_and_conditions.sql
│       ├── 003_payment_attempts.sql
│       ├── 004_ratings_and_reviews.sql
│       ├── 005_route_tracking.sql
│       ├── 006_partner_session_version.sql
│       ├── 007_terminal_completed_status.sql
│       ├── 008_partner_vehicle_type.sql
│       ├── 009_partner_vehicle_type_others.sql
│       ├── 010_request_rating_status.sql
│       └── 011_partner_vehicle_types_car_bike.sql
│
├── docs/
│   ├── DESIGN.md
│   ├── PLAN.md
│   └── SRS.md
│
├── scripts/
│   └── verify-partner-toggle-kyc.js
│
└── scratch/
    ├── check_constraint.js
    ├── inspect_requests.js
    └── test-render-tracking.js
```

---

## 4. List of Modules

### Server Core & Configuration Modules
- **Express App Configuration:** [`server/src/app.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/app.js)
- **HTTP & Socket Server Entry Point:** [`server/src/server.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/server.js)
- **Database Connection Pool (`pg.Pool`):** [`server/src/config/db.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/config/db.js)
- **Environment & App Configuration:** [`server/src/config/index.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/config/index.js)

### Server Middleware Modules
- **Authentication & RBAC Middleware:** [`server/src/middleware/auth.middleware.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/middleware/auth.middleware.js)
- **Central Error & 404 Handlers:** [`server/src/middleware/errorHandler.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/middleware/errorHandler.js)
- **HTTP Request Logger:** [`server/src/middleware/logger.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/middleware/logger.js)
- **Multer Upload Middleware:** [`server/src/middleware/upload.middleware.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/middleware/upload.middleware.js)

### Server Controller Modules
- **Admin Controller:** [`server/src/controllers/admin.controller.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/admin.controller.js)
- **Auth Controller:** [`server/src/controllers/auth.controller.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/auth.controller.js)
- **Customer Controller:** [`server/src/controllers/customer.controller.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/customer.controller.js)
- **Health Controller:** [`server/src/controllers/health.controller.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/health.controller.js)
- **Notification Controller:** [`server/src/controllers/notification.controller.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/notification.controller.js)
- **Partner Controller:** [`server/src/controllers/partner.controller.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/partner.controller.js)
- **Payment Controller:** [`server/src/controllers/payment.controller.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/payment.controller.js)
- **Request Controller:** [`server/src/controllers/request.controller.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/request.controller.js)
- **Service Controller:** [`server/src/controllers/service.controller.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/service.controller.js)
- **Support Controller:** [`server/src/controllers/support.controller.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/support.controller.js)

### Server Service Modules
- **Geocoding Service (Google Geocoding & Fallbacks):** [`server/src/services/geocoding.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/geocoding.service.js)
- **Matching Service (Haversine & Partner Dispatch Calculation):** [`server/src/services/matching.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/matching.service.js)
- **OTP Service:** [`server/src/services/otp.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/otp.service.js)
- **Payment Service:** [`server/src/services/payment.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/payment.service.js)
- **Routes Service (Google Routes API v2, Polyline & Telemetry):** [`server/src/services/routes.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/routes.service.js)
- **Socket.IO Real-Time Dispatch Service:** [`server/src/services/socket.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/socket.service.js)
- **Token Service (JWT Sign & Verify):** [`server/src/services/token.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/token.service.js)

### Server Route Modules
- **Master Route Aggregator:** [`server/src/routes/index.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/index.js)
- **Admin Routes:** [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js)
- **Auth Routes:** [`server/src/routes/auth.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/auth.routes.js)
- **Customer Routes:** [`server/src/routes/customer.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/customer.routes.js)
- **Health Routes:** [`server/src/routes/health.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/health.routes.js)
- **Notification Routes:** [`server/src/routes/notification.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/notification.routes.js)
- **Partner Routes:** [`server/src/routes/partner.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/partner.routes.js)
- **Request Routes:** [`server/src/routes/request.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/request.routes.js)
- **Service Routes:** [`server/src/routes/service.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/service.routes.js)
- **Support Routes:** [`server/src/routes/support.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/support.routes.js)

### Database Management Modules
- **Schema Migration Runner:** [`db/migrate.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/migrate.js)
- **Phase 4 KYC Schema Migration Runner:** [`db/migrate_phase4.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/migrate_phase4.js)
- **Database Baseline Seed Runner:** [`db/seed.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/seed.js)
- **Demo Seed Runner:** [`db/demo-seed.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/demo-seed.js)

### Client Core & State Modules
- **React Root Mount:** [`client/src/main.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/main.jsx)
- **Main App Shell & Role Guard:** [`client/src/App.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/App.jsx)
- **Authentication Context & Provider:** [`client/src/context/AuthContext.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/context/AuthContext.jsx)

### Client Service Connectors
- **HTTP Fetch & JWT Interceptor:** [`client/src/services/api.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/services/api.js)
- **Admin Service Connector:** [`client/src/services/adminService.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/services/adminService.js)
- **Auth Service Connector:** [`client/src/services/authService.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/services/authService.js)
- **Customer Service Connector:** [`client/src/services/customerService.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/services/customerService.js)
- **Health Diagnostic Connector:** [`client/src/services/healthService.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/services/healthService.js)
- **Notification Service Connector:** [`client/src/services/notificationService.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/services/notificationService.js)
- **Partner Service Connector:** [`client/src/services/partnerService.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/services/partnerService.js)
- **Request Service Connector:** [`client/src/services/requestService.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/services/requestService.js)
- **Service Categories Connector:** [`client/src/services/serviceService.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/services/serviceService.js)
- **Socket.IO Client Service:** [`client/src/services/socketService.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/services/socketService.js)
- **Support Service Connector:** [`client/src/services/supportService.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/services/supportService.js)

### Client Utilities
- **Google Maps JS API Dynamic Loader:** [`client/src/utils/googleMapsLoader.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/utils/googleMapsLoader.js)
- **Vehicle Type Label Formatter:** [`client/src/utils/vehicleType.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/utils/vehicleType.js)

---

## 5. Every API Endpoint and Frontend Screen

### Backend API Endpoints

#### Server-Level Endpoints
| HTTP Method | Route Path | Controller / Handler Function | Source File |
| :--- | :--- | :--- | :--- |
| `GET` | `/pay/:token/status` | `getPayTokenStatus` | [`server/src/app.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/app.js#L55), [`server/src/controllers/payment.controller.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/payment.controller.js#L442) |
| `GET` | `/pay/:token` | `payRateLimiter`, `renderPayPage` | [`server/src/app.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/app.js#L56), [`server/src/controllers/payment.controller.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/payment.controller.js#L490) |

#### Health Endpoint (`/api/health`)
| HTTP Method | Route Path | Controller / Handler Function | Source File |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | `getHealth` | [`server/src/routes/health.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/health.routes.js#L7), [`server/src/controllers/health.controller.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/health.controller.js#L14) |

#### Authentication Endpoints (`/api/auth`)
| HTTP Method | Route Path | Auth / Role Middleware | Controller / Handler Function | Source File |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/customer/register` | None | `registerCustomer` | [`server/src/routes/auth.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/auth.routes.js#L26) |
| `POST` | `/api/auth/customer/login` | None | `loginCustomer` | [`server/src/routes/auth.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/auth.routes.js#L27) |
| `POST` | `/api/auth/customer/forgot-password` | None | `forgotPasswordCustomer` | [`server/src/routes/auth.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/auth.routes.js#L28) |
| `POST` | `/api/auth/customer/reset-password` | None | `resetPasswordCustomer` | [`server/src/routes/auth.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/auth.routes.js#L29) |
| `POST` | `/api/auth/partner/register` | None | `registerPartner` | [`server/src/routes/auth.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/auth.routes.js#L34) |
| `POST` | `/api/auth/partner/login` | None | `loginPartner` | [`server/src/routes/auth.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/auth.routes.js#L35) |
| `POST` | `/api/auth/partner/forgot-password` | None | `forgotPasswordPartner` | [`server/src/routes/auth.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/auth.routes.js#L36) |
| `POST` | `/api/auth/partner/reset-password` | None | `resetPasswordPartner` | [`server/src/routes/auth.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/auth.routes.js#L37) |
| `POST` | `/api/auth/partner/logout` | `authenticateToken` | `logoutPartner` | [`server/src/routes/auth.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/auth.routes.js#L38) |
| `GET` | `/api/auth/me` | `authenticateToken` | `getCurrentUser` | [`server/src/routes/auth.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/auth.routes.js#L43) |

#### Admin Endpoints (`/api/admin`)
| HTTP Method | Route Path | Auth / Role Middleware | Controller / Handler Function | Source File |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/login` | None | `loginAdmin` | [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js#L40) |
| `GET` | `/api/admin/dashboard` | `authenticateToken`, `requireRole('admin')` | `getAdminDashboard` | [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js#L51) |
| `GET` | `/api/admin/analytics` | `authenticateToken`, `requireRole('admin')` | `getAdminAnalytics` | [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js#L52) |
| `GET` | `/api/admin/kyc` | `authenticateToken`, `requireRole('admin')` | `getAdminKycList` | [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js#L57) |
| `PUT` | `/api/admin/kyc/:partnerId/decision` | `authenticateToken`, `requireRole('admin')` | `adminReviewKycDecision` | [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js#L58) |
| `GET` | `/api/admin/plans` | `authenticateToken`, `requireRole('admin')` | `getAdminPlans` | [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js#L63) |
| `PUT` | `/api/admin/plans/:id` | `authenticateToken`, `requireRole('admin')` | `updatePlanPrice` | [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js#L64) |
| `GET` | `/api/admin/services` | `authenticateToken`, `requireRole('admin')` | `getAdminServices` | [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js#L69) |
| `POST` | `/api/admin/services` | `authenticateToken`, `requireRole('admin')` | `createServiceCategory` | [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js#L70) |
| `PUT` | `/api/admin/services/:id` | `authenticateToken`, `requireRole('admin')` | `updateServiceCategory` | [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js#L71) |
| `PUT` | `/api/admin/services/:id/toggle` | `authenticateToken`, `requireRole('admin')` | `toggleServiceActive` | [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js#L72) |
| `PUT` | `/api/admin/customers/:id?` | `authenticateToken`, `requireRole('admin')` | `rejectCustomerPartnerMutation` (403 Immutability) | [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js#L78) |
| `PATCH` | `/api/admin/customers/:id?` | `authenticateToken`, `requireRole('admin')` | `rejectCustomerPartnerMutation` (403 Immutability) | [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js#L79) |
| `DELETE` | `/api/admin/customers/:id?` | `authenticateToken`, `requireRole('admin')` | `rejectCustomerPartnerMutation` (403 Immutability) | [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js#L80) |
| `POST` | `/api/admin/customers` | `authenticateToken`, `requireRole('admin')` | `rejectCustomerPartnerMutation` (403 Immutability) | [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js#L81) |
| `PUT` | `/api/admin/partners/:id?` | `authenticateToken`, `requireRole('admin')` | `rejectCustomerPartnerMutation` (403 Immutability) | [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js#L83) |
| `PATCH` | `/api/admin/partners/:id?` | `authenticateToken`, `requireRole('admin')` | `rejectCustomerPartnerMutation` (403 Immutability) | [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js#L84) |
| `DELETE` | `/api/admin/partners/:id?` | `authenticateToken`, `requireRole('admin')` | `rejectCustomerPartnerMutation` (403 Immutability) | [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js#L85) |
| `POST` | `/api/admin/partners` | `authenticateToken`, `requireRole('admin')` | `rejectCustomerPartnerMutation` (403 Immutability) | [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js#L86) |
| `GET` | `/api/admin/customers` | `authenticateToken`, `requireRole('admin')` | `getAdminCustomers` | [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js#L91) |
| `GET` | `/api/admin/partners` | `authenticateToken`, `requireRole('admin')` | `getAdminPartners` | [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js#L92) |
| `GET` | `/api/admin/requests` | `authenticateToken`, `requireRole('admin')` | `getAdminRequests` | [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js#L93) |
| `GET` | `/api/admin/subscriptions` | `authenticateToken`, `requireRole('admin')` | `getAdminSubscriptions` | [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js#L94) |
| `GET` | `/api/admin/ratings` | `authenticateToken`, `requireRole('admin')` | `getAdminRatings` | [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js#L95) |
| `GET` | `/api/admin/activity-log` | `authenticateToken`, `requireRole('admin')` | `getAdminActivityLog` | [`server/src/routes/admin.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/admin.routes.js#L96) |

#### Services Endpoints (`/api/services`)
| HTTP Method | Route Path | Auth / Role Middleware | Controller / Handler Function | Source File |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/services` | None | `getActiveServices` | [`server/src/routes/service.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/service.routes.js#L12), [`server/src/controllers/service.controller.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/service.controller.js#L8) |

#### Partner & Plans Endpoints (`/api/partner`, `/api/partners`, `/api/plans`)
*(Note: [`server/src/routes/index.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/index.js#L27-L29) mounts partner routes on `/partner`, `/partners`, and `/plans`)*

| HTTP Method | Route Path | Auth / Role Middleware | Controller / Handler Function | Source File |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/partner/plans` *(also `/api/plans/plans`)* | None | `getSubscriptionPlans` | [`server/src/routes/partner.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/partner.routes.js#L55) |
| `GET` | `/api/partner/subscription` | `authenticateToken`, `requireRole('partner')` | `getPartnerSubscription` | [`server/src/routes/partner.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/partner.routes.js#L60) |
| `POST` | `/api/partner/subscribe` | `authenticateToken`, `requireRole('partner')` | `subscribePlan` | [`server/src/routes/partner.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/partner.routes.js#L67) |
| `POST` | `/api/partner/payment-attempt` | `authenticateToken`, `requireRole('partner')` | `createPaymentAttemptHandler` | [`server/src/routes/partner.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/partner.routes.js#L75) |
| `GET` | `/api/partner/payment-attempt/active` | `authenticateToken`, `requireRole('partner')` | `getActivePaymentAttemptHandler` | [`server/src/routes/partner.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/partner.routes.js#L82) |
| `GET` | `/api/partner/payment-attempt/:id` | `authenticateToken`, `requireRole('partner')` | `getPaymentAttemptByIdHandler` | [`server/src/routes/partner.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/partner.routes.js#L89) |
| `GET` | `/api/partner/kyc` | `authenticateToken`, `requireRole('partner')` | `getPartnerKyc` | [`server/src/routes/partner.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/partner.routes.js#L99) |
| `POST` | `/api/partner/kyc` | `authenticateToken`, `requireRole('partner')`, `partnerKycUploadFields` (Multer) | `uploadPartnerKyc` | [`server/src/routes/partner.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/partner.routes.js#L106) |
| `GET` | `/api/partner/kyc/document/:docId` | `authenticateToken` | `serveKycDocument` | [`server/src/routes/partner.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/partner.routes.js#L115) |
| `GET` | `/api/partner/dashboard` | `authenticateToken`, `requireRole('partner')` | `getPartnerDashboard` | [`server/src/routes/partner.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/partner.routes.js#L124) |
| `PUT` | `/api/partner/online` | `authenticateToken`, `requireRole('partner')` | `togglePartnerOnline` | [`server/src/routes/partner.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/partner.routes.js#L131) |
| `POST` | `/api/partner/logout` | `authenticateToken`, `requireRole('partner')` | `logoutPartner` | [`server/src/routes/partner.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/partner.routes.js#L138) |
| `GET` | `/api/partner/ratings` | `optionalPartnerAuth` | `getPartnerRatings` | [`server/src/routes/partner.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/partner.routes.js#L145) |
| `GET` | `/api/partner/earnings` | `authenticateToken`, `requireRole('partner')` | `getPartnerEarnings` | [`server/src/routes/partner.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/partner.routes.js#L151) |
| `GET` | `/api/partner/profile` | `authenticateToken`, `requireRole('partner')` | `getPartnerProfile` | [`server/src/routes/partner.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/partner.routes.js#L161) |
| `PUT` | `/api/partner/profile` | `authenticateToken`, `requireRole('partner')` | `updatePartnerProfile` | [`server/src/routes/partner.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/partner.routes.js#L168) |
| `PUT` | `/api/partner/kyc/:partnerId/decision` | `authenticateToken`, `requireRole('admin')` | `reviewPartnerKyc` | [`server/src/routes/partner.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/partner.routes.js#L178) |

#### Customer Portal Endpoints (`/api/customer`)
| HTTP Method | Route Path | Auth / Role Middleware | Controller / Handler Function | Source File |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/customer/profile` | `authenticateToken`, `requireRole('customer')` | `getCustomerProfile` | [`server/src/routes/customer.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/customer.routes.js#L24) |
| `PUT` | `/api/customer/profile` | `authenticateToken`, `requireRole('customer')` | `updateCustomerProfile` | [`server/src/routes/customer.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/customer.routes.js#L25) |
| `GET` | `/api/customer/addresses` | `authenticateToken`, `requireRole('customer')` | `getSavedAddresses` | [`server/src/routes/customer.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/customer.routes.js#L28) |
| `POST` | `/api/customer/addresses` | `authenticateToken`, `requireRole('customer')` | `addSavedAddress` | [`server/src/routes/customer.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/customer.routes.js#L29) |
| `PUT` | `/api/customer/addresses/:id` | `authenticateToken`, `requireRole('customer')` | `updateSavedAddress` | [`server/src/routes/customer.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/customer.routes.js#L30) |
| `DELETE` | `/api/customer/addresses/:id` | `authenticateToken`, `requireRole('customer')` | `deleteSavedAddress` | [`server/src/routes/customer.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/customer.routes.js#L31) |

#### Request Lifecycle Endpoints (`/api/requests`)
| HTTP Method | Route Path | Auth / Role Middleware | Controller / Handler Function | Source File |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/requests` | `authenticateToken`, `requireRole('customer')`, `requestPhotoUpload` (Multer) | `createRequest` | [`server/src/routes/request.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/request.routes.js#L26) |
| `GET` | `/api/requests` | `authenticateToken` | `getRequestHistory` | [`server/src/routes/request.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/request.routes.js#L35) |
| `GET` | `/api/requests/history` | `authenticateToken` | `getRequestHistory` | [`server/src/routes/request.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/request.routes.js#L41) |
| `GET` | `/api/requests/:id` | `authenticateToken` | `getRequestById` | [`server/src/routes/request.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/request.routes.js#L48) |
| `POST` | `/api/requests/:id/cancel` | `authenticateToken` | `cancelRequest` | [`server/src/routes/request.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/request.routes.js#L55) |
| `POST` | `/api/requests/:id/respond` | `authenticateToken`, `requireRole('partner')` | `respondToRequest` | [`server/src/routes/request.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/request.routes.js#L62) |
| `PUT` | `/api/requests/:id/status` | `authenticateToken`, `requireRole('partner')` | `updateRequestStatus` | [`server/src/routes/request.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/request.routes.js#L70) |
| `POST` | `/api/requests/:id/verify-otp` | `authenticateToken`, `requireRole('partner')` | `verifyRequestOtp` | [`server/src/routes/request.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/request.routes.js#L78) |
| `POST` | `/api/requests/:id/rate` | `authenticateToken`, `requireRole('customer')` | `rateRequest` | [`server/src/routes/request.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/request.routes.js#L86) |
| `POST` | `/api/requests/:id/skip-rating` | `authenticateToken`, `requireRole('customer')` | `skipRequestRating` | [`server/src/routes/request.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/request.routes.js#L94) |
| `POST` | `/api/requests/:id/pay` | `authenticateToken` | `processPayment` | [`server/src/routes/request.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/request.routes.js#L102) |
| `GET` | `/api/requests/:id/receipt` | `authenticateToken` | `getPaymentReceipt` | [`server/src/routes/request.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/request.routes.js#L109) |
| `GET` | `/api/requests/:id/photo` | `authenticateToken` | `getRequestPhoto` | [`server/src/routes/request.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/request.routes.js#L116) |

#### Notification Endpoints (`/api/notifications`)
| HTTP Method | Route Path | Auth / Role Middleware | Controller / Handler Function | Source File |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | `authenticateToken` | `getNotifications` | [`server/src/routes/notification.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/notification.routes.js#L18) |
| `PUT` | `/api/notifications/:id/read` | `authenticateToken` | `markAsRead` | [`server/src/routes/notification.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/notification.routes.js#L19) |
| `PUT` | `/api/notifications/read-all` | `authenticateToken` | `markAllAsRead` | [`server/src/routes/notification.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/notification.routes.js#L20) |

#### Support Endpoints (`/api/support`)
| HTTP Method | Route Path | Auth / Role Middleware | Controller / Handler Function | Source File |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/support/faqs` | None | `getSupportFaqs` | [`server/src/routes/support.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/support.routes.js#L15) |
| `POST` | `/api/support/ticket` | `authenticateToken` | `submitSupportTicket` | [`server/src/routes/support.routes.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/routes/support.routes.js#L16) |

---

### Socket.IO Real-Time Events
- *Server Implementation File:* [`server/src/services/socket.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/socket.service.js)
- *Client Connector File:* [`client/src/services/socketService.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/services/socketService.js)

#### Events Received by Server (from Client)
- `register_partner` (line 52)
- `register_customer` (line 139)
- `join_request` (line 149)
- `partner_respond` (line 163)
- `customer_cancel` (line 179)
- `partner_request_otp` (line 188)
- `register_admin` (line 194)
- `join_admin` (line 198)
- `disconnect` (line 203)

#### Events Emitted by Server (to Client)
- `auth_error` (lines 65, 80, 88)
- `logged_out` (lines 81, 259)
- `registered` (lines 97, 145, 196)
- `incoming_request` (lines 113, 399)
- `joined_request` (line 159)
- `response_error` (lines 168, 174)
- `cancel_error` (line 183)
- `otp_prompt_customer` (lines 190, 1212, 1215)
- `joined_admin` (line 200)
- `request_dismiss` (lines 228, 258)
- `kyc:status_updated` (line 229)
- `all_partners_busy` (lines 324, 325, 888, 889, 1002, 1003)
- `searching_update` (lines 415, 416)
- `request_accepted` (lines 745, 746)
- `request_confirmed` (line 762)
- `request_taken` (lines 778, 782)
- `request_declined_ack` (line 827)
- `request_timeout` (line 893)
- `request_cancelled` (lines 956, 957, 960, 964)
- `partner_location` / `partner_location_update` (lines 1104, 1105, 1107, 1108, 1111, 1112, 1176, 1177, 1179, 1180, 1183, 1184)
- `partner_arrived` (lines 1205, 1207, 1211, 1214)
- `request_status_updated` (lines 1274, 1277, 1281)

---

### Frontend Screens & Views

#### 1. Public & Landing Screens
- **Landing Page & Service Showcase:** [`client/src/pages/LandingPage.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/LandingPage.jsx)
  - Hash route: `#/` or empty hash (`client/src/App.jsx` line 218)
- **Customer Authentication (Login / Register / Forgot Password):** [`client/src/pages/customer/CustomerAuthView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/customer/CustomerAuthView.jsx)
  - Hash routes: `#/customer/login`, `#/customer/register`, `#/customer/forgot-password` (`client/src/App.jsx` lines 240-246)
- **Partner Authentication (Login / Register / Forgot Password):** [`client/src/pages/partner/PartnerAuthView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/partner/PartnerAuthView.jsx)
  - Hash routes: `#/partner/login`, `#/partner/register`, `#/partner/forgot-password` (`client/src/App.jsx` lines 255-263)
- **Admin Login Screen:** [`client/src/pages/admin/AdminLoginView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/admin/AdminLoginView.jsx)
  - Hash route: `#/admin/login` (`client/src/App.jsx` line 220)

#### 2. Customer Portal Screens
- **Portal Orchestrator & Role Guard:** [`client/src/pages/customer/CustomerPortal.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/customer/CustomerPortal.jsx)
- **Customer Portal Layout:** [`client/src/components/customer/CustomerLayout.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/components/customer/CustomerLayout.jsx)
- **Customer Dashboard:** [`client/src/pages/customer/CustomerDashboard.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/customer/CustomerDashboard.jsx)
  - Tab: `dashboard` (`#/customer/dashboard`)
- **Create Service Request:** [`client/src/pages/customer/CreateRequestView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/customer/CreateRequestView.jsx)
  - Tab: `new-request` (`#/customer/new-request`)
- **Searching for Nearest Partner:** [`client/src/pages/customer/SearchingView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/customer/SearchingView.jsx)
  - Tab: `searching` (`#/customer/searching`)
- **Live Real-Time Tracking & OTP Verification View:** [`client/src/pages/customer/LiveTrackingView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/customer/LiveTrackingView.jsx)
  - Tab: `tracking` (`#/customer/tracking`)
- **Rating, Review & Payment View:** [`client/src/pages/customer/RateAndPayView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/customer/RateAndPayView.jsx)
  - Tab: `rate-receipt` (`#/customer/rate-receipt`)
- **Customer Request History:** [`client/src/pages/customer/RequestHistoryView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/customer/RequestHistoryView.jsx)
  - Tab: `history` (`#/customer/history`)
- **Customer Profile View:** [`client/src/pages/customer/CustomerProfileView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/customer/CustomerProfileView.jsx)
  - Tab: `profile` (`#/customer/profile`)
- **Saved Addresses View:** [`client/src/pages/customer/SavedAddressesView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/customer/SavedAddressesView.jsx)
  - Tab: `addresses` (`#/customer/addresses`)

#### 3. Partner Portal Screens
- **Portal Orchestrator & Role Guard:** [`client/src/pages/partner/PartnerPortal.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/partner/PartnerPortal.jsx)
- **Partner Portal Layout:** [`client/src/components/partner/PartnerLayout.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/components/partner/PartnerLayout.jsx)
- **Partner Dashboard & Online/Offline Switcher:** [`client/src/pages/partner/PartnerDashboard.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/partner/PartnerDashboard.jsx)
  - Tab: `dashboard` (`#/partner/dashboard`)
- **Active Job Navigation & Service Progression:** [`client/src/pages/partner/ActiveJobView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/partner/ActiveJobView.jsx)
  - Tab: `active-job` (`#/partner/active-job`)
- **Partner Earnings Breakdown:** [`client/src/pages/partner/EarningsView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/partner/EarningsView.jsx)
  - Tab: `earnings` (`#/partner/earnings`)
- **Partner Job History:** [`client/src/pages/partner/PartnerHistoryView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/partner/PartnerHistoryView.jsx)
  - Tab: `history` (`#/partner/history`)
- **Partner Ratings & Customer Reviews:** [`client/src/pages/partner/PartnerRatingsView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/partner/PartnerRatingsView.jsx)
  - Tab: `ratings` (`#/partner/ratings`)
- **Subscription Plan Details & Renewal:** [`client/src/pages/partner/PlanDetailsView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/partner/PlanDetailsView.jsx)
  - Tab: `plan` (`#/partner/plan`)
- **Subscription Plan Selection (Quarterly / Half-Yearly / Yearly):** [`client/src/pages/partner/PlanSelectionView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/partner/PlanSelectionView.jsx)
  - Tab: `plan-selection` (`#/partner/plan-selection`)
- **KYC Document Upload View:** [`client/src/pages/partner/KycUploadView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/partner/KycUploadView.jsx)
  - Tab: `kyc` (`#/partner/kyc`)
- **Partner Profile Management:** [`client/src/pages/partner/PartnerProfileView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/partner/PartnerProfileView.jsx)
  - Tab: `profile` (`#/partner/profile`)
- **Incoming Request Offer Countdown Modal (30s Ring):** [`client/src/pages/partner/IncomingRequestPopup.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/partner/IncomingRequestPopup.jsx)
- **QR Code Subscription Payment Modal:** [`client/src/components/partner/QrPaymentModal.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/components/partner/QrPaymentModal.jsx)

#### 4. Admin Portal Screens
- **Portal Orchestrator & Role Guard:** [`client/src/pages/admin/AdminPortal.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/admin/AdminPortal.jsx)
- **Admin Portal Layout:** [`client/src/components/admin/AdminLayout.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/components/admin/AdminLayout.jsx)
- **Admin Dashboard & System Overview:** [`client/src/pages/admin/AdminDashboard.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/admin/AdminDashboard.jsx)
  - Tab: `dashboard` (`#/admin/dashboard`)
- **Admin KYC Review & Decision Queue:** [`client/src/pages/admin/AdminKycReviewView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/admin/AdminKycReviewView.jsx)
  - Tab: `kyc` (`#/admin/kyc`)
- **Subscription Plan Pricing Management:** [`client/src/pages/admin/AdminPlansView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/admin/AdminPlansView.jsx)
  - Tab: `plans` (`#/admin/plans`)
- **Service Categories Management:** [`client/src/pages/admin/AdminServicesView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/admin/AdminServicesView.jsx)
  - Tab: `services` (`#/admin/services`)
- **Customer List (Read-Only Monitoring):** [`client/src/pages/admin/AdminCustomersView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/admin/AdminCustomersView.jsx)
  - Tab: `customers` (`#/admin/customers`)
- **Partner List (Read-Only Monitoring):** [`client/src/pages/admin/AdminPartnersView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/admin/AdminPartnersView.jsx)
  - Tab: `partners` (`#/admin/partners`)
- **Requests & Work Orders Monitoring:** [`client/src/pages/admin/AdminRequestsView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/admin/AdminRequestsView.jsx)
  - Tab: `requests` (`#/admin/requests`)
- **Partner Subscriptions List:** [`client/src/pages/admin/AdminSubscriptionsView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/admin/AdminSubscriptionsView.jsx)
  - Tab: `subscriptions` (`#/admin/subscriptions`)
- **Ratings & Reviews Monitoring:** [`client/src/pages/admin/AdminRatingsView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/admin/AdminRatingsView.jsx)
  - Tab: `ratings` (`#/admin/ratings`)
- **Admin System Activity & Audit Logs:** [`client/src/pages/admin/AdminActivityLogView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/admin/AdminActivityLogView.jsx)
  - Tab: `activity-log` (`#/admin/activity-log`)

#### 5. Common Shared Views
- **In-App Notifications Screen:** [`client/src/pages/common/NotificationsView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/common/NotificationsView.jsx)
- **Help Center, FAQ & Ticket Submission Screen:** [`client/src/pages/common/SupportView.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/common/SupportView.jsx)

#### 6. Embedded Map Tracking Components
- **Interactive Route Tracking Canvas:** [`client/src/components/tracking/RouteTrackingMap.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/components/tracking/RouteTrackingMap.jsx)

---

## 6. Database Tables / Models

FixIt Now uses a relational PostgreSQL database without an ORM layer (e.g. no Prisma, Sequelize, or TypeORM). Database schema DDL and migrations are written in pure SQL and executed via `pg` (`Pool`).

### Database Tables (Total: 16 Verified Tables)

1. **`admins`**
   - *Columns:* `id SERIAL PRIMARY KEY`, `email VARCHAR(255) NOT NULL UNIQUE`, `password_hash VARCHAR(255) NOT NULL`, `name VARCHAR(150) NOT NULL DEFAULT 'Platform Admin'`, `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`, `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
   - *Primary Source:* [`db/schema.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/schema.sql#L13-L20)

2. **`services`**
   - *Columns:* `id SERIAL PRIMARY KEY`, `name VARCHAR(100) NOT NULL UNIQUE`, `slug VARCHAR(100) NOT NULL UNIQUE`, `description TEXT`, `base_price_estimate NUMERIC(10, 2) DEFAULT 0.00`, `active BOOLEAN DEFAULT TRUE`, `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`, `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
   - *Primary Source:* [`db/schema.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/schema.sql#L25-L34)

3. **`customers`**
   - *Columns:* `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `name VARCHAR(150) NOT NULL`, `email VARCHAR(255) NOT NULL UNIQUE`, `password_hash VARCHAR(255) NOT NULL`, `phone VARCHAR(30) NOT NULL`, `address TEXT NOT NULL`, `latitude DOUBLE PRECISION`, `longitude DOUBLE PRECISION`, `photo_url TEXT`, `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`, `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
   - *Altered / Added Columns:*
     - `terms_accepted_at TIMESTAMP WITH TIME ZONE`
     - `terms_version VARCHAR(20)`
   - *Primary Source:* [`db/schema.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/schema.sql#L39-L51), [`db/migrations/002_terms_and_conditions.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/migrations/002_terms_and_conditions.sql#L4-L6)

4. **`saved_addresses`**
   - *Columns:* `id SERIAL PRIMARY KEY`, `customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE`, `label VARCHAR(50) NOT NULL`, `address TEXT NOT NULL`, `latitude DOUBLE PRECISION NOT NULL`, `longitude DOUBLE PRECISION NOT NULL`, `is_default BOOLEAN DEFAULT FALSE`, `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
   - *Primary Source:* [`db/schema.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/schema.sql#L56-L65)

5. **`partners`**
   - *Columns:* `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `name VARCHAR(150) NOT NULL`, `email VARCHAR(255) NOT NULL UNIQUE`, `password_hash VARCHAR(255) NOT NULL`, `phone VARCHAR(30) NOT NULL`, `address TEXT NOT NULL`, `service_id INTEGER NOT NULL REFERENCES services(id)`, `online BOOLEAN DEFAULT FALSE`, `latitude DOUBLE PRECISION`, `longitude DOUBLE PRECISION`, `kyc_status VARCHAR(20) DEFAULT 'not_submitted' CHECK (kyc_status IN ('not_submitted', 'pending', 'verified', 'rejected'))`, `rejection_reason TEXT`, `rating NUMERIC(3, 2)` (default dropped in migration 004), `total_jobs INTEGER DEFAULT 0`, `photo_url TEXT`, `badge VARCHAR(100)`, `vehicle VARCHAR(100)`, `session_version INTEGER NOT NULL DEFAULT 0`, `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`, `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
   - *Altered / Added Columns & Constraints:*
     - `terms_accepted_at TIMESTAMP WITH TIME ZONE` ([`db/migrations/002_terms_and_conditions.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/migrations/002_terms_and_conditions.sql#L8-L10))
     - `terms_version VARCHAR(20)` ([`db/migrations/002_terms_and_conditions.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/migrations/002_terms_and_conditions.sql#L8-L10))
     - `rating` default `5.00` dropped to allow `NULL` for unrated partners ([`db/migrations/004_ratings_and_reviews.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/migrations/004_ratings_and_reviews.sql#L8-L9))
     - `session_version INT NOT NULL DEFAULT 0` ([`db/migrations/006_partner_session_version.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/migrations/006_partner_session_version.sql#L4-L5))
     - `vehicle_type TEXT CHECK (vehicle_type IN ('bike_scooter', 'car'))` ([`db/migrations/008_partner_vehicle_type.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/migrations/008_partner_vehicle_type.sql#L7), updated in [`db/migrations/011_partner_vehicle_types_car_bike.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/migrations/011_partner_vehicle_types_car_bike.sql#L4-L5))
   - *Primary Source:* [`db/schema.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/schema.sql#L70-L91)

6. **`kyc_documents`**
   - *Columns:* `id SERIAL PRIMARY KEY`, `partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE`, `document_type VARCHAR(50) NOT NULL`, `file_path TEXT NOT NULL`, `file_name VARCHAR(255)`, `original_name VARCHAR(255)`, `file_type VARCHAR(50) NOT NULL`, `file_size INTEGER`, `status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected'))`, `reviewer_notes TEXT`, `reviewed_at TIMESTAMP WITH TIME ZONE`, `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
   - *Primary Source:* [`db/schema.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/schema.sql#L96-L109), [`db/migrate_phase4.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/migrate_phase4.js#L19-L22)

7. **`plans`**
   - *Columns:* `id SERIAL PRIMARY KEY`, `name VARCHAR(50) NOT NULL UNIQUE CHECK (name IN ('quarterly', 'half-yearly', 'yearly'))`, `duration_months INTEGER NOT NULL`, `price NUMERIC(10, 2) NOT NULL`, `active BOOLEAN DEFAULT TRUE`, `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`, `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
   - *Primary Source:* [`db/schema.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/schema.sql#L114-L122)

8. **`subscriptions`**
   - *Columns:* `id SERIAL PRIMARY KEY`, `partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE`, `plan_id INTEGER NOT NULL REFERENCES plans(id)`, `price_paid NUMERIC(10, 2) NOT NULL`, `start_date TIMESTAMP WITH TIME ZONE NOT NULL`, `end_date TIMESTAMP WITH TIME ZONE NOT NULL`, `status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled'))`, `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
   - *Altered / Added Columns:*
     - `payment_attempt_id UUID UNIQUE REFERENCES payment_attempts(id)` ([`db/migrations/003_payment_attempts.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/migrations/003_payment_attempts.sql#L20))
   - *Primary Source:* [`db/schema.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/schema.sql#L127-L136)

9. **`payment_attempts`**
   - *Columns:* `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE`, `plan_id INTEGER NOT NULL REFERENCES plans(id)`, `amount NUMERIC(10, 2) NOT NULL`, `status VARCHAR(20) NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'processing', 'paid', 'expired', 'cancelled'))`, `token_hash VARCHAR(64) NOT NULL UNIQUE`, `expires_at TIMESTAMP WITH TIME ZONE NOT NULL`, `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`, `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
   - *Primary Source:* [`db/migrations/003_payment_attempts.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/migrations/003_payment_attempts.sql#L4-L14)

10. **`requests`**
    - *Columns:* `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `customer_id UUID NOT NULL REFERENCES customers(id)`, `partner_id UUID REFERENCES partners(id)`, `service_id INTEGER NOT NULL REFERENCES services(id)`, `problem VARCHAR(200) NOT NULL`, `description TEXT NOT NULL`, `address TEXT NOT NULL`, `latitude DOUBLE PRECISION NOT NULL`, `longitude DOUBLE PRECISION NOT NULL`, `photo_url TEXT`, `status VARCHAR(30) NOT NULL DEFAULT 'searching'`, `cancel_reason TEXT`, `service_otp VARCHAR(6) NOT NULL`, `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`, `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
    - *Status Constraints:* Check constraint includes: `'requested'`, `'searching'`, `'accepted'`, `'partner_on_way'`, `'partner_arrived'`, `'service_started'`, `'service_completed'`, `'payment_completed'`, `'completed'`, `'cancelled'` ([`db/migrations/007_terminal_completed_status.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/migrations/007_terminal_completed_status.sql#L5-L18))
    - *Altered / Added Columns:*
      - `route_geometry JSONB` ([`db/migrations/005_route_tracking.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/migrations/005_route_tracking.sql#L5))
      - `route_distance_km NUMERIC(8, 2)` ([`db/migrations/005_route_tracking.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/migrations/005_route_tracking.sql#L6))
      - `speed_kmh NUMERIC(5, 2)` ([`db/migrations/005_route_tracking.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/migrations/005_route_tracking.sql#L7))
      - `trip_started_at TIMESTAMP WITH TIME ZONE` ([`db/migrations/005_route_tracking.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/migrations/005_route_tracking.sql#L8))
      - `vehicle_type TEXT` ([`db/migrations/008_partner_vehicle_type.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/migrations/008_partner_vehicle_type.sql#L8))
      - `rating_status VARCHAR(20) DEFAULT NULL CHECK (rating_status IS NULL OR rating_status IN ('submitted', 'skipped'))` ([`db/migrations/010_request_rating_status.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/migrations/010_request_rating_status.sql#L4-L6))
    - *Partial Unique Index:* `idx_requests_active_partner` ensures one active job per partner (`accepted`, `partner_on_way`, `partner_arrived`, `service_started`) ([`db/migrations/001_broadcast_concurrency.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/migrations/001_broadcast_concurrency.sql#L24-L25))
    - *Primary Source:* [`db/schema.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/schema.sql#L141-L168)

11. **`request_status_logs`**
    - *Columns:* `id SERIAL PRIMARY KEY`, `request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE`, `status VARCHAR(30) NOT NULL`, `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
    - *Primary Source:* [`db/schema.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/schema.sql#L173-L178)

12. **`payments`**
    - *Columns:* `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE`, `amount NUMERIC(10, 2) NOT NULL`, `status VARCHAR(20) DEFAULT 'proceed' CHECK (status IN ('proceed', 'waiting', 'successful', 'failed'))`, `receipt_no VARCHAR(50) UNIQUE`, `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
    - *Primary Source:* [`db/schema.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/schema.sql#L183-L190)

13. **`ratings`**
    - *Columns:* `id SERIAL PRIMARY KEY`, `request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE`, `partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE`, `stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5)`, `comment TEXT`, `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
    - *Altered / Added Columns:*
      - `review_line VARCHAR(255)` ([`db/migrations/004_ratings_and_reviews.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/migrations/004_ratings_and_reviews.sql#L5))
      - `feedback TEXT` ([`db/migrations/004_ratings_and_reviews.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/migrations/004_ratings_and_reviews.sql#L6))
    - *Primary Source:* [`db/schema.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/schema.sql#L195-L202)

14. **`notifications`**
    - *Columns:* `id SERIAL PRIMARY KEY`, `recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('customer', 'partner', 'admin'))`, `recipient_id UUID`, `title VARCHAR(150) NOT NULL`, `message TEXT NOT NULL`, `read_flag BOOLEAN DEFAULT FALSE`, `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
    - *Primary Source:* [`db/schema.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/schema.sql#L207-L215)

15. **`activity_logs`**
    - *Columns:* `id SERIAL PRIMARY KEY`, `actor VARCHAR(100) NOT NULL`, `action VARCHAR(200) NOT NULL`, `details JSONB`, `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
    - *Primary Source:* [`db/schema.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/schema.sql#L220-L226)

16. **`otps`**
    - *Columns:* `id SERIAL PRIMARY KEY`, `target VARCHAR(255) NOT NULL`, `code VARCHAR(10) NOT NULL`, `purpose VARCHAR(50) NOT NULL CHECK (purpose IN ('forgot_password', 'service_otp'))`, `expires_at TIMESTAMP WITH TIME ZONE NOT NULL`, `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
    - *Primary Source:* [`db/schema.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/schema.sql#L231-L238)

---

## 7. External Libraries Used

### Production Libraries (Dependencies)
| Package | Version Range | Used In | Declared In |
| :--- | :--- | :--- | :--- |
| `bcrypt` | `^6.0.0` | Password hashing & comparison | [`server/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/package.json#L25), [`package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/package.json#L27) |
| `cors` | `^2.8.5` | Cross-origin resource sharing | [`server/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/package.json#L26) |
| `dotenv` | `^16.4.7` / `^18.0.8` | Environment variables loading | [`server/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/package.json#L27), [`package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/package.json#L28) |
| `express` | `^4.21.2` | REST API HTTP server | [`server/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/package.json#L28) |
| `jsonwebtoken` | `^9.0.3` | JWT generation & verification | [`server/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/package.json#L29) |
| `multer` | `^2.4.0` | Multipart form-data / image uploads | [`server/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/package.json#L30) |
| `pg` | `^8.23.1` | PostgreSQL connection pool & queries | [`server/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/package.json#L31), [`package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/package.json#L29) |
| `qrcode` | `^1.5.4` | Canvas QR code generation for payments | [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json#L13) |
| `react` | `^19.2.8` | Frontend component framework | [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json#L14) |
| `react-dom` | `^19.2.8` | React DOM binding | [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json#L15) |
| `recharts` | `^3.10.1` | Analytics charts & metrics | [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json#L16) |
| `socket.io` | `^4.8.4` | Server real-time WebSocket communication | [`server/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/package.json#L32) |
| `socket.io-client`| `^4.8.4` | Browser real-time WebSocket communication | [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json#L17) |

### Development & Tooling Libraries (devDependencies)
| Package | Version Range | Used In | Declared In |
| :--- | :--- | :--- | :--- |
| `@eslint/js` | `^9.20.0` | ESLint JavaScript recommended rules | [`package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/package.json#L19) |
| `eslint` | `^9.20.0` | Code linter | [`package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/package.json#L20) |
| `eslint-plugin-react` | `^7.37.4` | React lint rules | [`package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/package.json#L21) |
| `eslint-plugin-react-hooks` | `^5.1.0` | React Hooks lint rules | [`package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/package.json#L22) |
| `globals` | `^15.14.0` | Standard environment globals for ESLint | [`package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/package.json#L23) |
| `prettier` | `^3.5.1` | Code formatting | [`package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/package.json#L24) |
| `@types/react` | `^19.2.18` | React TypeScript definitions | [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json#L20) |
| `@types/react-dom` | `^19.2.7` | React DOM TypeScript definitions | [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json#L21) |
| `@vitejs/plugin-react` | `^6.1.1` | Vite React fast refresh plugin | [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json#L22) |
| `autoprefixer` | `^10.6.1` | CSS vendor prefixer | [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json#L23) |
| `oxlint` | `^1.81.0` | Fast Rust-based JS/JSX linter | [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json#L24) |
| `postcss` | `^8.5.30` | CSS transformation pipeline | [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json#L25) |
| `tailwindcss` | `^3.4.19` | Utility-first CSS framework | [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json#L26) |
| `vite` | `^8.3.0` | Frontend bundler and dev server | [`client/package.json`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/package.json#L27) |

### External Third-Party APIs / Web Services (Called via HTTP/Script at Runtime)
1. **Google Maps JavaScript API**
   - *URL:* `https://maps.googleapis.com/maps/api/js`
   - *Source File:* [`client/src/utils/googleMapsLoader.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/utils/googleMapsLoader.js#L37)
2. **Google Geocoding API**
   - *URL:* `https://maps.googleapis.com/maps/api/geocode/json`
   - *Source File:* [`server/src/services/geocoding.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/geocoding.service.js#L56)
3. **Google Routes API v2**
   - *URL:* `https://routes.googleapis.com/directions/v2:computeRoutes`
   - *Source File:* [`server/src/services/routes.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/routes.service.js#L273)
4. **OpenStreetMap Nominatim API (Fallback / Secondary)**
   - *Configured Header:* `NOMINATIM_USER_AGENT`
   - *Source File:* [`server/src/config/index.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/config/index.js#L29-L30), [`server/.env.example`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/.env.example#L28)
