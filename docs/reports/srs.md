# Software Requirements Specification (SRS) for FixIt Now

**Standard:** IEEE Std 830-1998 Format  
**Product:** FixIt Now — On-Demand Home-Services Marketplace  
**Version:** 1.0.0  
**Status:** Approved & Code-Grounded  
**Date:** 2026-10-27  

---

## Table of Contents
1. [Introduction](#1-introduction)
   - 1.1 [Purpose](#11-purpose)
   - 1.2 [Document Conventions](#12-document-conventions)
   - 1.3 [Intended Audience and Reading Suggestions](#13-intended-audience-and-reading-suggestions)
   - 1.4 [Product Scope](#14-product-scope)
   - 1.5 [References](#15-references)
2. [Overall Description](#2-overall-description)
   - 2.1 [Product Perspective](#21-product-perspective)
   - 2.2 [Product Functions](#22-product-functions)
   - 2.3 [User Classes and Characteristics](#23-user-classes-and-characteristics)
   - 2.4 [Operating Environment](#24-operating-environment)
   - 2.5 [Design and Implementation Constraints](#25-design-and-implementation-constraints)
   - 2.6 [User Documentation](#26-user-documentation)
   - 2.7 [Assumptions and Dependencies](#27-assumptions-and-dependencies)
3. [External Interface Requirements](#3-external-interface-requirements)
   - 3.1 [User Interfaces](#31-user-interfaces)
   - 3.2 [Hardware Interfaces](#32-hardware-interfaces)
   - 3.3 [Software Interfaces](#33-software-interfaces)
   - 3.4 [Communications Interfaces](#34-communications-interfaces)
4. [System Features / Functional Requirements](#4-system-features--functional-requirements)
   - 4.1 [Module 1: Authentication & Identity Management (FR1–FR14)](#41-module-1-authentication--identity-management)
   - 4.2 [Module 2: Customer Portal & Profile Management (FR15–FR21)](#42-module-2-customer-portal--profile-management)
   - 4.3 [Module 3: Request Lifecycle, Dispatch & Concurrency (FR22–FR39)](#43-module-3-request-lifecycle-dispatch--concurrency)
   - 4.4 [Module 4: Rating, Payment & Settlement (FR40–FR44)](#44-module-4-rating-payment--settlement)
   - 4.5 [Module 5: Partner Portal, KYC & Subscriptions (FR45–FR58)](#45-module-5-partner-portal-kyc--subscriptions)
   - 4.6 [Module 6: Administrator Portal & Platform Governance (FR59–FR75)](#46-module-6-administrator-portal--platform-governance)
   - 4.7 [Module 7: Notifications, Support & System Health (FR76–FR81)](#47-module-7-notifications-support--system-health)
   - 4.8 [Module 8: Frontend Routing, State & Role Security (FR82–FR85)](#48-module-8-frontend-routing-state--role-security)
5. [Non-Functional Requirements](#5-non-functional-requirements)
   - 5.1 [Performance Requirements](#51-performance-requirements)
   - 5.2 [Safety & Reliability Requirements](#52-safety--reliability-requirements)
   - 5.3 [Security & Role-Based Access Control](#53-security--role-based-access-control)
   - 5.4 [Software Quality Attributes](#54-software-quality-attributes)
6. [Future Scope (Out of Scope / Non-Implemented)](#6-future-scope)
7. [Verification Pass & Traceability Matrix](#7-verification-pass--traceability-matrix)

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) provides a comprehensive, rigorous specification of the software requirements for **FixIt Now**, a web-based on-demand home services marketplace. It is authored in accordance with the **IEEE Std 830-1998 Recommended Practice for Software Requirements Specifications**. Every requirement in this document describes an operational feature that is grounded directly in the codebase.

### 1.2 Document Conventions
- **Requirement Tagging:** All Functional Requirements are designated with unique identifier tags: `FR1`, `FR2`, `FR3`, etc.
- **Code Grounding:** Each functional requirement explicitly cites the implementing source file and function using the format:  
  `FR[n] → <source_file_path>: <function_name>()`
- **Typographic Conventions:** Bold text indicates UI controls or entities; monospaced font denotes routes, database tables, column names, and code identifiers.

### 1.3 Intended Audience and Reading Suggestions
This document is prepared for software engineers, QA automation testers, academic evaluators, and system architects. Readers seeking specific functional behaviors should proceed to [Section 4](#4-system-features--functional-requirements), while architects and security auditors should review [Section 3](#3-external-interface-requirements) and [Section 5](#5-non-functional-requirements).

### 1.4 Product Scope
FixIt Now connects homeowners needing immediate repair work (electricians, plumbers, carpenters, AC repair specialists, and appliance technicians) with verified, local tradespeople within a strict **2 km** geographical radius. The platform operates on a **zero-commission model** supported exclusively by partner subscription fees (`quarterly`, `half-yearly`, and `yearly`). Service bookings are strictly immediate (no future scheduling), matching is carried out sequentially via real-time WebSocket dispatches, and in-flight partner movement is tracked on an interactive route map.

### 1.5 References
1. IEEE Std 830-1998: *IEEE Recommended Practice for Software Requirements Specifications*.
2. Repository Codebase & Facts: [`project_facts.md`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/project_facts.md).
3. Design System Specification: [`docs/DESIGN.md`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/docs/DESIGN.md).
4. Project Plan & Architecture: [`docs/PLAN.md`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/docs/PLAN.md).
5. Baseline Data Schema: [`db/schema.sql`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/schema.sql).

---

## 2. Overall Description

### 2.1 Product Perspective
FixIt Now is a modular client-server web application consisting of:
- **Frontend Single-Page Application (SPA):** Built with React 19, Tailwind CSS, and Vite, delivering distinct portal interfaces for Visitors, Customers, Partners, and Administrators.
- **Backend Application Server:** An Express 4.x REST API executing on Node.js (tested on v24), coupled with a Socket.IO real-time engine.
- **Relational Persistence Layer:** PostgreSQL database managing 16 relational tables with spatial coordinate indexing.
- **Geospatial & Navigation Services:** Google Geocoding API and Google Routes API v2, backed by OpenStreetMap Nominatim and procedural straight-line fallbacks.

### 2.2 Product Functions
- **Role-Based Authentication & Recovery:** User registration, password validation, JWT issuance, OTP-based password recovery, and session version invalidation.
- **Customer Job Booking & Management:** Immediate work order creation, issue photo upload, saved address book, and cancelation.
- **Rapid Geospatial Matching:** Haversine distance filtering (<2 km), sequential offer dispatch with 30-second countdown rings, and single-active-job concurrency protection.
- **Real-Time Work Order Lifecycle & Telemetry:** Partner arrival OTP confirmation, turn-by-turn road polyline simulation, and automated status transitions.
- **Partner KYC & Subscription Lifecycle:** Multi-document PDF/image upload, admin decision workflows, tenure tracking, and QR code simulated UPI payments.
- **Platform Administration & Auditing:** Real-time analytics, KYC reviews, service catalog maintenance, subscription pricing rules, immutable customer/partner records, and system activity logs.

### 2.3 User Classes and Characteristics
| User Class | Description | Authentication & Portal Route |
| :--- | :--- | :--- |
| **Visitor** | Unauthenticated public visitor exploring the marketplace. | Unauthenticated; access restricted to [`LandingPage.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/LandingPage.jsx) (`#/`). |
| **Customer** | Authenticated homeowner seeking immediate trade repairs. | Customer JWT; access restricted to [`CustomerPortal.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/customer/CustomerPortal.jsx) (`#/customer/*`). |
| **Partner** | Certified tradesperson offering exactly one service category. | Partner JWT; access restricted to [`PartnerPortal.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/partner/PartnerPortal.jsx) (`#/partner/*`). |
| **Administrator** | Pre-created platform operator overseeing governance. | Admin JWT; access restricted to [`AdminPortal.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/admin/AdminPortal.jsx) (`#/admin/*`). |

### 2.4 Operating Environment
- **Server:** Node.js (v18+, tested on v24), PostgreSQL 13+ with `pgcrypto` and `uuid-ossp` extensions enabled.
- **Client:** Modern evergreen web browsers (Chromium 120+, Firefox 120+, Safari 17+, Edge 120+) supporting ES2021, WebSockets, LocalStorage, and Canvas API.
- **Host Connectivity:** Localhost or private LAN with IPv4 binding on `0.0.0.0` for mobile camera QR payment testing.

### 2.5 Design and Implementation Constraints
1. **Immediate Service Only:** No advance calendar scheduling or multi-day slot booking is permitted.
2. **Fixed Dispatch Radius:** Dispatch calculations strictly enforce a maximum 2.0 km Haversine distance radius (`server/src/config/index.js` line 37).
3. **Single Service Specialty:** A partner can offer exactly one service category (`service_id`) linked via foreign key.
4. **Partner Concurrency Constraint:** A partner cannot hold more than one active job concurrently, enforced by database partial index `idx_requests_active_partner`.
5. **Customer/Partner Record Immutability:** Administrators cannot alter customer or partner personal data (server returns HTTP 403 via `rejectCustomerPartnerMutation`).
6. **Zero Job Commissions:** The platform charges 0% commission on service jobs; revenue is derived solely from partner subscription plans.
7. **Work Order Aesthetic Standards:** 100% square corners (`border-radius: 0`), paper background `#FBFAF6`, ink borders `2px solid #111418`, signal accent `#FF5B14`, and hard offset shadows (`9px 9px 0 #111418`).

### 2.6 User Documentation
System capabilities, setup instructions, network configuration, and diagnostic tools are documented in [`README.md`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/README.md) and [`db/README.md`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/db/README.md).

### 2.7 Assumptions and Dependencies
1. Users possess an active internet connection supporting persistent WebSockets.
2. Address strings provide identifiable area or street names; in cases of geocoding failure, fallback zone coordinates prevent booking blockage.
3. Node.js backend maintains persistent in-memory dispatch maps (`activeDispatches`) synchronized with database state.

---

## 3. External Interface Requirements

### 3.1 User Interfaces
- **Visual Design:** Strict tradesperson "Work Order" motif governed by [`docs/DESIGN.md`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/docs/DESIGN.md) featuring Bricolage Grotesque headings, DM Sans body copy, and DM Mono uppercase labels.
- **Landing Interface:** [`client/src/pages/LandingPage.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/pages/LandingPage.jsx) presenting brand values, service cards, step-by-step workflow, and role selection.
- **Customer Views:** Dashboard, service booking form, searching radar screen, live route tracking canvas, rating modal, and saved address manager.
- **Partner Views:** Dashboard, job offer modal (30s countdown), turn-by-turn active job view, earnings breakdown, subscription status, QR payment modal, and KYC upload panel.
- **Admin Views:** Metric dashboard, interactive charts (Recharts), KYC document reviewer, subscription pricing manager, service category editor, read-only customer/partner lists, and activity logs.

### 3.2 Hardware Interfaces
- **Camera / Mobile Device:** Support for smartphone camera optical scanning of QR codes rendered by [`client/src/components/partner/QrPaymentModal.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/components/partner/QrPaymentModal.jsx) to test subscription payments over local LAN.

### 3.3 Software Interfaces
1. **PostgreSQL Relational Database:** Accessed via Node.js connection pool `pg.Pool` ([`server/src/config/db.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/config/db.js)).
2. **Google Geocoding API:** Forward geocoding of raw address strings into latitude/longitude with country restriction `components=country:IN` ([`server/src/services/geocoding.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/geocoding.service.js#L56)).
3. **Google Routes API v2:** Computes road polyline geometries and driving/two-wheeler distances ([`server/src/services/routes.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/routes.service.js#L273)).
4. **Google Maps JavaScript API:** Loaded client-side via [`client/src/utils/googleMapsLoader.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/utils/googleMapsLoader.js) to render maps in [`RouteTrackingMap.jsx`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/components/tracking/RouteTrackingMap.jsx).
5. **OpenStreetMap Nominatim API:** Configured user-agent fallback geocoding service ([`server/src/config/index.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/config/index.js#L29-L30)).

### 3.4 Communications Interfaces
- **HTTP/1.1 REST Protocol:** JSON payloads transmitted over HTTP/HTTPS with CORS configuration ([`server/src/app.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/app.js#L24-L43)).
- **WebSocket Protocol (Socket.IO):** Bi-directional, full-duplex communication over port 5001 for dispatch offers, GPS simulations, and instant status updates ([`server/src/services/socket.service.js`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/socket.service.js)).

---

## 4. System Features / Functional Requirements

### 4.1 Module 1: Authentication & Identity Management

#### FR1: Customer Registration
- **Description:** The system shall register a new customer with their full name, email, password, phone, street address, and explicit agreement to Terms and Conditions. Addresses are automatically geocoded to latitude and longitude.
- **Input:** `name`, `email`, `password`, `phone`, `address`, `terms_accepted: true`.
- **Processing:** Validates required fields, checks email uniqueness in `customers`, validates password complexity, geocodes address, hashes password with bcrypt (10 rounds), records acceptance timestamp and terms version (`v1.0`), and inserts record into `customers`.
- **Output:** HTTP 201 with JWT token, user object, and customer role.
- **Code Location:** [`server/src/controllers/auth.controller.js: registerCustomer()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/auth.controller.js#L29)

#### FR2: Password Complexity Enforcement
- **Description:** The system shall enforce that all customer and partner passwords contain at least 6 characters, at least one letter, at least one number, and at least one special character (`[!@#$%^&*(),.?":{}|<>]`).
- **Input:** Plaintext password string.
- **Processing:** Evaluates length and regular expression patterns against complexity criteria.
- **Output:** Boolean `valid` flag and localized descriptive error string.
- **Code Location:** [`server/src/services/token.service.js: validatePassword()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/token.service.js#L26)

#### FR3: Customer Login
- **Description:** The system shall authenticate returning customers using email and password, issuing a signed JWT token valid for 7 days.
- **Input:** `email`, `password`.
- **Processing:** Queries `customers` by normalized lowercase email; verifies bcrypt password hash; packages user payload into JWT.
- **Output:** HTTP 200 with JWT token, customer profile, and role `customer`.
- **Code Location:** [`server/src/controllers/auth.controller.js: loginCustomer()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/auth.controller.js#L162)

#### FR4: Customer Forgot Password OTP Dispatch
- **Description:** The system shall generate a secure 6-digit numeric OTP valid for 10 minutes when a customer requests password recovery.
- **Input:** Customer `email`.
- **Processing:** Checks `customers` table for account existence; generates 6-digit cryptographic OTP; removes expired OTPs; records OTP in `otps` table with `purpose = 'forgot_password'`.
- **Output:** HTTP 200 with dispatch confirmation (in development/demo, prints OTP to server console).
- **Code Location:** [`server/src/controllers/auth.controller.js: forgotPasswordCustomer()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/auth.controller.js#L235)

#### FR5: Customer Password Reset Execution
- **Description:** The system shall reset a customer's password upon submission of a valid, unexpired OTP and new compliant password.
- **Input:** `email`, `otp`, `new_password`.
- **Processing:** Validates OTP code and expiration against `otps`; validates new password complexity; hashes new password with bcrypt; updates `customers.password_hash`; deletes consumed OTP.
- **Output:** HTTP 200 with password update confirmation.
- **Code Location:** [`server/src/controllers/auth.controller.js: resetPasswordCustomer()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/auth.controller.js#L273)

#### FR6: Partner Registration
- **Description:** The system shall register a partner with their personal details, chosen single service category, vehicle type (`bike_scooter` or `car`), address coordinates, and Terms and Conditions acceptance.
- **Input:** `name`, `email`, `password`, `phone`, `address`, `service_id`, `vehicle_type`, `terms_accepted: true`.
- **Processing:** Validates service existence in `services`; validates vehicle classification; geocodes location; hashes password; initializes partner with `online = false` and `kyc_status = 'not_submitted'`.
- **Output:** HTTP 201 with JWT token, partner object, and role `partner`.
- **Code Location:** [`server/src/controllers/auth.controller.js: registerPartner()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/auth.controller.js#L338)

#### FR7: Partner Login
- **Description:** The system shall authenticate partners via email and password, returning active subscription tenure and KYC verification state.
- **Input:** `email`, `password`.
- **Processing:** Verifies bcrypt hash; checks `subscriptions` for active plan; checks `kyc_documents` and `partners.kyc_status`; generates signed JWT containing `session_version`.
- **Output:** HTTP 200 with JWT, profile, KYC status, and active subscription details.
- **Code Location:** [`server/src/controllers/auth.controller.js: loginPartner()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/auth.controller.js#L524)

#### FR8: Partner Forgot Password OTP Dispatch
- **Description:** The system shall generate and store a 6-digit password reset OTP for registered partners.
- **Input:** Partner `email`.
- **Processing:** Verifies partner existence in `partners`; creates unexpired record in `otps`.
- **Output:** HTTP 200 confirmation.
- **Code Location:** [`server/src/controllers/auth.controller.js: forgotPasswordPartner()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/auth.controller.js#L617)

#### FR9: Partner Password Reset Execution
- **Description:** The system shall reset a partner's password using a verified OTP and complexity-validated new password.
- **Input:** `email`, `otp`, `new_password`.
- **Processing:** Validates OTP; updates `partners.password_hash`; deletes OTP entry.
- **Output:** HTTP 200 confirmation.
- **Code Location:** [`server/src/controllers/auth.controller.js: resetPasswordPartner()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/auth.controller.js#L655)

#### FR10: Administrator Authentication
- **Description:** The system shall authenticate platform administrators at a dedicated route using pre-seeded administrative credentials.
- **Input:** `email`, `password`.
- **Processing:** Queries `admins` table by email; verifies bcrypt password hash against stored hash; signs administrative JWT token with `role: 'admin'`.
- **Output:** HTTP 200 with admin token and administrative user payload.
- **Code Location:** [`server/src/controllers/auth.controller.js: loginAdmin()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/auth.controller.js#L720)

#### FR11: Active User Session Verification (`/api/auth/me`)
- **Description:** The system shall verify active JWT tokens and return the current user profile, subscription tenure, and system role.
- **Input:** Bearer JWT in request header.
- **Processing:** Decodes and verifies token signature; loads user profile from role-specific database table (`customers`, `partners`, or `admins`).
- **Output:** HTTP 200 with verified user details and active role.
- **Code Location:** [`server/src/controllers/auth.controller.js: getCurrentUser()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/auth.controller.js#L793)

#### FR12: Partner Logout & Session Version Invalidation
- **Description:** The system shall log out a partner, set their status to offline, increment their `session_version` in the database, and emit a socket event to immediately invalidate all other active sessions and sockets.
- **Input:** Authenticated partner request.
- **Processing:** Sets `partners.online = false`; increments `partners.session_version = session_version + 1`; dismisses pending dispatches; emits `logged_out` to `partner:${id}` room.
- **Output:** HTTP 200 with logout confirmation.
- **Code Location:** [`server/src/controllers/partner.controller.js: logoutPartner()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/partner.controller.js#L1324)

#### FR13: JWT Authentication Middleware
- **Description:** The system shall intercept incoming requests, extract the Bearer token, verify cryptographic signature and expiration, and for partners, ensure the token's `session_version` matches the database.
- **Input:** HTTP `Authorization` header (`Bearer <token>`) or `x-access-token`.
- **Processing:** Verifies token with `jwtSecret`; checks partner session version; attaches decoded user to `req.user`.
- **Output:** Passes control to `next()`, or returns HTTP 401 Unauthorized on invalid/missing tokens.
- **Code Location:** [`server/src/middleware/auth.middleware.js: authenticateToken()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/middleware/auth.middleware.js#L18)

#### FR14: Role-Based Access Control (RBAC) Middleware
- **Description:** The system shall restrict endpoints to authorized roles (`customer`, `partner`, or `admin`), preventing unauthorized cross-portal access.
- **Input:** Required role strings (`...allowedRoles`) and populated `req.user`.
- **Processing:** Compares `req.user.role` with allowed roles.
- **Output:** Passes control to `next()`, or returns HTTP 403 Forbidden with an access violation message.
- **Code Location:** [`server/src/middleware/auth.middleware.js: requireRole()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/middleware/auth.middleware.js#L82)

---

### 4.2 Module 2: Customer Portal & Profile Management

#### FR15: Customer Profile Retrieval
- **Description:** The system shall fetch the profile details, contact information, coordinates, and photo of the authenticated customer.
- **Input:** Authenticated customer user ID (`req.user.id`).
- **Processing:** Queries `customers` table excluding password hash.
- **Output:** HTTP 200 with customer profile object.
- **Code Location:** [`server/src/controllers/customer.controller.js: getCustomerProfile()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/customer.controller.js#L12)

#### FR16: Customer Profile Update
- **Description:** The system shall allow customers to update their name, phone, address, and profile photo, automatically re-geocoding coordinates if the address changed.
- **Input:** `name`, `phone`, `address`, `photo_url`.
- **Processing:** Validates phone format; re-geocodes address if modified; updates `customers` record.
- **Output:** HTTP 200 with updated customer profile.
- **Code Location:** [`server/src/controllers/customer.controller.js: updateCustomerProfile()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/customer.controller.js#L39)

#### FR17: Saved Address Book Retrieval
- **Description:** The system shall return all saved addresses (e.g. Home, Office) registered to the customer.
- **Input:** Customer user ID (`req.user.id`).
- **Processing:** Queries `saved_addresses` table ordered by `is_default DESC, created_at DESC`.
- **Output:** HTTP 200 with list of saved addresses.
- **Code Location:** [`server/src/controllers/customer.controller.js: getSavedAddresses()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/customer.controller.js#L104)

#### FR18: Add Saved Address
- **Description:** The system shall save a new labeled address for a customer, converting the text address to geographic coordinates.
- **Input:** `label`, `address`, `is_default`.
- **Processing:** Geocodes address string; manages default flag exclusivity; inserts into `saved_addresses`.
- **Output:** HTTP 201 with created address record.
- **Code Location:** [`server/src/controllers/customer.controller.js: addSavedAddress()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/customer.controller.js#L156)

#### FR19: Update Saved Address
- **Description:** The system shall update an existing saved address label, text, default status, and re-geocode coordinates.
- **Input:** Address `id`, `label`, `address`, `is_default`.
- **Processing:** Verifies ownership by customer; re-geocodes address if changed; updates `saved_addresses`.
- **Output:** HTTP 200 with updated address object.
- **Code Location:** [`server/src/controllers/customer.controller.js: updateSavedAddress()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/customer.controller.js#L214)

#### FR20: Delete Saved Address
- **Description:** The system shall delete a saved address from the customer's address book.
- **Input:** Address `id`.
- **Processing:** Verifies ownership and deletes row from `saved_addresses`.
- **Output:** HTTP 200 deletion confirmation.
- **Code Location:** [`server/src/controllers/customer.controller.js: deleteSavedAddress()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/customer.controller.js#L271)

#### FR21: Public Service Catalog Retrieval
- **Description:** The system shall retrieve all active marketplace service categories along with their baseline price estimates.
- **Input:** None (public endpoint).
- **Processing:** Queries `services` table where `active = true` ordered by `name ASC`.
- **Output:** HTTP 200 with active service categories.
- **Code Location:** [`server/src/controllers/service.controller.js: getActiveServices()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/service.controller.js#L12)

---

### 4.3 Module 3: Request Lifecycle, Dispatch & Concurrency

#### FR22: Create Service Request
- **Description:** The system shall create an immediate service request, accept an optional issue photo via Multer, generate a secure 6-digit service OTP, geocode the job location, and initiate real-time matching.
- **Input:** `service_id`, `problem`, `description`, `address`, optional multipart photo file.
- **Processing:** Validates customer has no existing active job; geocodes location; generates 6-digit OTP; inserts request with `status = 'searching'`; logs initial status; searches for eligible partners within 2 km; starts sequential offer loop.
- **Output:** HTTP 201 with created request object, OTP, and dispatch status.
- **Code Location:** [`server/src/controllers/request.controller.js: createRequest()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/request.controller.js#L37)

#### FR23: Cancel Service Request
- **Description:** The system shall allow a customer or admin to cancel a request with a specified reason, halting active dispatch timers and notifying assigned/offered partners via WebSocket.
- **Input:** Request `id`, `cancel_reason`.
- **Processing:** Verifies request is not in a terminal state (`completed`, `cancelled`); updates `status = 'cancelled'`; cancels dispatch timeout timers; broadcasts `request_cancelled` via Socket.IO.
- **Output:** HTTP 200 with cancellation details.
- **Code Location:** [`server/src/controllers/request.controller.js: cancelRequest()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/request.controller.js#L522)

#### FR24: Get Request Details by ID
- **Description:** The system shall return complete work order details including customer, assigned partner, road route geometry, remaining distance, ETA, and audit status log.
- **Input:** Request `id`.
- **Processing:** Checks user authorization (must be owning customer, assigned partner, or admin); queries request with joined service, partner, and customer entities.
- **Output:** HTTP 200 with full work-order payload.
- **Code Location:** [`server/src/controllers/request.controller.js: getRequestById()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/request.controller.js#L220)

#### FR25: Get Request History
- **Description:** The system shall return the historical list of past and active service requests for the authenticated customer or partner, with status filtering support.
- **Input:** Query parameter `status` (`'all'`, `'active'`, `'completed'`, `'cancelled'`).
- **Processing:** Queries `requests` filtered by `customer_id` or `partner_id` ordered by `created_at DESC`.
- **Output:** HTTP 200 with list of matching historical requests.
- **Code Location:** [`server/src/controllers/request.controller.js: getRequestHistory()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/request.controller.js#L414)

#### FR26: Secure Request Issue Photo Retrieval
- **Description:** The system shall securely serve customer-uploaded issue photos, restricting access to the owning customer, assigned partner, and administrators.
- **Input:** Request `id`.
- **Processing:** Verifies caller authorization against request record; checks file existence in `uploads/requests/`; serves binary stream.
- **Output:** Image binary stream with appropriate `Content-Type` header.
- **Code Location:** [`server/src/controllers/request.controller.js: getRequestPhoto()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/request.controller.js#L1210)

#### FR27: Address Geocoding with Fallback
- **Description:** The system shall geocode address strings using Google Geocoding API, falling back to area-based queries, and finally to simulated local zone coordinates if external services fail.
- **Input:** Raw address text string.
- **Processing:** Queries in-memory cache; invokes Google Geocoding API with `country:IN`; on failure, attempts area-level query; on total failure, returns predefined Bangalore zone coordinates.
- **Output:** Object `{ lat, lon, precision, source, formatted_address }`.
- **Code Location:** [`server/src/services/geocoding.service.js: geocodeAddress()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/geocoding.service.js#L230)

#### FR28: Haversine Spatial Distance Calculation
- **Description:** The system shall compute great-circle distance between two geographic coordinates using the Haversine formula on a spherical earth of radius 6,371 km.
- **Input:** `lat1`, `lon1`, `lat2`, `lon2`.
- **Processing:** Computes trigonometric formula in radians.
- **Output:** Distance in kilometers rounded to three decimal places.
- **Code Location:** [`server/src/services/matching.service.js: calculateHaversineDistance()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/matching.service.js#L34)

#### FR29: Eligible Dispatch Partner Search
- **Description:** The system shall query the database for partners who match the requested service, are online, have verified KYC, hold an active subscription, have no active concurrent job, and reside within 2.0 km.
- **Input:** `service_id`, `customer_lat`, `customer_lon`.
- **Processing:** Executes SQL query with joins on `services` and `subscriptions`; evaluates active subscription date range; calculates Haversine distance; filters `<= 2.0 km`; sorts ascending by distance.
- **Output:** Array of eligible partner records with calculated `distance_km`.
- **Code Location:** [`server/src/services/matching.service.js: findEligiblePartnersFromDb()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/matching.service.js#L231)

#### FR30: Real-Time Sequential Offer Loop
- **Description:** The system shall offer an incoming request to eligible partners sequentially. The nearest partner is offered the request with a 30-second countdown ring. If declined or timed out, the system cascades automatically to the next nearest eligible partner.
- **Input:** Request object, array of eligible partners.
- **Processing:** Initializes dispatch state in `activeDispatches`; emits `incoming_request` to nearest partner room (`partner:${id}`); sets 30-second timer; updates customer room with searching progress; cascades on timeout.
- **Output:** Socket events emitted to partner and customer rooms.
- **Code Location:** [`server/src/services/socket.service.js: startRequestMatching()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/socket.service.js#L283)

#### FR31: Partner Job Offer Acceptance
- **Description:** The system shall process a partner's acceptance of an offered job, enforcing concurrency locks so that only one partner can claim the request and dismissing the offer from any other partner.
- **Input:** `requestId`, `partnerId`, `token`.
- **Processing:** Checks database if request is still `searching`; verifies partner is eligible and holds no active job; updates `requests.partner_id`, `requests.status = 'accepted'`, and freezes `requests.vehicle_type`; calculates route via Google Routes API; dismisses other offers; notifies customer.
- **Output:** Emits `request_accepted` to customer and `request_confirmed` to partner.
- **Code Location:** [`server/src/services/socket.service.js: handlePartnerAccept()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/socket.service.js#L500)

#### FR32: Partner Job Offer Decline
- **Description:** The system shall acknowledge a partner's decline of an offer, mark them declined in the dispatch state, and immediately cascade the offer to the next eligible partner.
- **Input:** `requestId`, `partnerId`, `reason`.
- **Processing:** Adds `partnerId` to `declinedPartnerIds`; clears active timer; invokes next partner dispatch or triggers timeout if none remain.
- **Output:** Emits `request_declined_ack` to partner and advances queue.
- **Code Location:** [`server/src/services/socket.service.js: handlePartnerDecline()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/socket.service.js#L820)

#### FR33: Matching Timeout Handling
- **Description:** The system shall transition a request to a terminal state when all eligible partners within 2 km have declined or timed out, displaying "All partners busy, try again later".
- **Input:** Request ID.
- **Processing:** Updates database `requests.status = 'cancelled'`, `cancel_reason = 'All partners busy'`; emits `all_partners_busy` to customer and cleans up dispatch map.
- **Output:** Emits `all_partners_busy` event to `customer:${id}` room.
- **Code Location:** [`server/src/services/socket.service.js: handleMatchingTimeout()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/socket.service.js#L851)

#### FR34: Partner Status Progression
- **Description:** The system shall allow an assigned partner to advance work order status through the prescribed sequence: `partner_on_way`, `partner_arrived`, `service_completed`, and `completed`.
- **Input:** Request `id`, target `status`.
- **Processing:** Validates status sequence transitions; updates database `requests.status`; logs status to `request_status_logs`; triggers location simulation if advancing to `partner_on_way`; broadcasts update via Socket.IO.
- **Output:** HTTP 200 with updated status.
- **Code Location:** [`server/src/controllers/request.controller.js: updateRequestStatus()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/request.controller.js#L612)

#### FR35: Road Route Computation via Google Routes API v2
- **Description:** The system shall compute actual road routes and encoded polylines between partner and customer using Google Routes API v2, with fallback to straight-line geometry.
- **Input:** `startLat`, `startLon`, `endLat`, `endLon`, `vehicleType`.
- **Processing:** Selects travel mode (`TWO_WHEELER` for bike/scooter, `DRIVE` for car); calls Google Routes API v2 endpoint; decodes encoded polyline; calculates cumulative distance.
- **Output:** Object `{ geometry: [[lat, lng]], distanceKm, speedKmh, travelMode, source }`.
- **Code Location:** [`server/src/services/routes.service.js: computeTwoWheelerRoute()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/routes.service.js#L252)

#### FR36: Pure Function ETA Computation
- **Description:** The system shall calculate ETA in whole minutes using remaining road distance and vehicle travel speed: `ETA = ceil((remainingDistanceKm / speedKmh) * 60)`.
- **Input:** `remainingDistanceKm`, `speedKmh`, `vehicleType`.
- **Processing:** Resolves speed profile (default 40 km/h for two-wheeler, 35 km/h for car); computes ceiling of time.
- **Output:** Integer ETA in minutes (minimum 0).
- **Code Location:** [`server/src/services/routes.service.js: calculateEta()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/routes.service.js#L156)

#### FR37: Turn-by-Turn Partner Location Telemetry Simulation
- **Description:** The system shall simulate partner movement along the route geometry at 1-second intervals, broadcasting updated coordinates, covered distance, and ETA countdown to both customer and partner.
- **Input:** `requestId`, `routeGeometry`, `speedKmh`.
- **Processing:** Increments covered distance every 1000ms; interpolates lat/lng along polyline segments; computes remaining ETA; emits `partner_location` event.
- **Output:** Emits `partner_location` and `partner_location_update` events via Socket.IO.
- **Code Location:** [`server/src/services/socket.service.js: startMovementSimulation()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/socket.service.js#L1027)

#### FR38: Partner Arrival Notification & Customer OTP Prompt
- **Description:** The system shall emit an arrival notification when the partner reaches the customer's location or marks arrived, immediately prompting the customer with their 6-digit service OTP.
- **Input:** `requestId`.
- **Processing:** Halts movement simulation; emits `partner_arrived` event; emits `otp_prompt_customer` with `serviceOtp`.
- **Output:** Socket events delivered to customer and partner channels.
- **Code Location:** [`server/src/services/socket.service.js: notifyPartnerArrived()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/services/socket.service.js#L1145)

#### FR39: 6-Digit Service Start OTP Verification
- **Description:** The system shall require the partner to enter the customer's 6-digit service OTP before starting the job. A matching OTP transitions the request to `service_started`.
- **Input:** Request `id`, partner-provided `otp`.
- **Processing:** Compares entered OTP with `requests.service_otp`; on match, updates status to `service_started`; logs transition; emits `request_status_updated`.
- **Output:** HTTP 200 with service started confirmation.
- **Code Location:** [`server/src/controllers/request.controller.js: verifyRequestOtp()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/request.controller.js#L837)

---

### 4.4 Module 4: Rating, Payment & Settlement

#### FR40: Customer Rating and Review Submission
- **Description:** The system shall allow a customer to submit a 1 to 5 star rating, a short review headline, and detailed feedback comment for a completed service. Submitting updates the partner's cumulative rating.
- **Input:** Request `id`, `stars` (1–5), `review_line`, `comment`.
- **Processing:** Validates stars range; inserts record into `ratings`; marks `requests.rating_status = 'submitted'`; recalculates partner average rating and updates `partners.rating`.
- **Output:** HTTP 201 with rating confirmation.
- **Code Location:** [`server/src/controllers/request.controller.js: rateRequest()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/request.controller.js#L925)

#### FR41: Customer Rating Skip
- **Description:** The system shall allow a customer to skip rating a completed service, updating `requests.rating_status = 'skipped'` so the prompt is not shown again.
- **Input:** Request `id`.
- **Processing:** Updates `requests.rating_status = 'skipped'`.
- **Output:** HTTP 200 with skip confirmation.
- **Code Location:** [`server/src/controllers/request.controller.js: skipRequestRating()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/request.controller.js#L1096)

#### FR42: Customer Simulated Payment Processing
- **Description:** The system shall simulate payment settlement between customer and partner across states: `proceed`, `waiting`, and `successful`. On success, it creates a digital receipt record and marks the request `payment_completed`.
- **Input:** Request `id`, `amount`, `payment_method`.
- **Processing:** Verifies request completion; generates unique receipt number (`REC-XXXX`); creates entry in `payments` table with `status = 'successful'`; updates request status to `payment_completed`.
- **Output:** HTTP 200 with payment receipt payload.
- **Code Location:** [`server/src/controllers/payment.controller.js: processPayment()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/payment.controller.js#L580)

#### FR43: Work Order Payment Receipt Retrieval
- **Description:** The system shall retrieve the itemized digital receipt for a paid work order, including labor charges, tax breakdown, receipt number, and payment timestamp.
- **Input:** Request `id`.
- **Processing:** Queries `payments` joined with `requests`, `services`, and `partners`.
- **Output:** HTTP 200 with complete receipt details.
- **Code Location:** [`server/src/controllers/payment.controller.js: getPaymentReceipt()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/payment.controller.js#L786)

#### FR44: Partner Earnings Ledger Calculation
- **Description:** The system shall calculate the partner's total gross earnings, total completed jobs, and detailed job ledger from settled payments.
- **Input:** Authenticated partner user ID.
- **Processing:** Sums settled amounts in `payments` for requests where `partner_id = partner.id`; retrieves recent earnings entries.
- **Output:** HTTP 200 with earnings summary and itemized job ledger.
- **Code Location:** [`server/src/controllers/partner.controller.js: getPartnerEarnings()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/partner.controller.js#L1095)

---

### 4.5 Module 5: Partner Portal, KYC & Subscriptions

#### FR45: Subscription Plans Retrieval
- **Description:** The system shall retrieve the list of active partner subscription plans (`quarterly`, `half-yearly`, `yearly`), verifying that longer plans have lower monthly cost equivalents.
- **Input:** None (public/authenticated).
- **Processing:** Queries `plans` where `active = true` ordered by `duration_months ASC`.
- **Output:** HTTP 200 with subscription plan list and pricing.
- **Code Location:** [`server/src/controllers/partner.controller.js: getSubscriptionPlans()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/partner.controller.js#L27)

#### FR46: Partner Active Subscription Status
- **Description:** The system shall retrieve the partner's active subscription status, plan name, days remaining, and expiry date.
- **Input:** Authenticated partner ID.
- **Processing:** Queries `subscriptions` joined with `plans` where `status = 'active'` and `end_date > NOW()`.
- **Output:** HTTP 200 with subscription tenure details, or `null` if expired/unsubscribed.
- **Code Location:** [`server/src/controllers/partner.controller.js: getPartnerSubscription()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/partner.controller.js#L57)

#### FR47: Partner Subscription Activation & Renewal
- **Description:** The system shall subscribe or renew a partner to a selected plan, calculating start and end dates and recording payment details.
- **Input:** `plan_id`, optional `payment_attempt_id`.
- **Processing:** Validates plan; computes `end_date = NOW() + INTERVAL 'N months'`; creates row in `subscriptions`.
- **Output:** HTTP 201 with created subscription details.
- **Code Location:** [`server/src/controllers/partner.controller.js: subscribePlan()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/partner.controller.js#L122)

#### FR48: QR Code Subscription Payment Attempt Creation
- **Description:** The system shall create an idempotent payment attempt record with a cryptographic token hash and 15-minute expiration for phone camera scanning.
- **Input:** `plan_id`.
- **Processing:** Validates plan; creates token hash; stores record in `payment_attempts` with `status = 'created'`; constructs URL for QR rendering.
- **Output:** HTTP 201 with `payment_attempt_id`, token, and scan URL.
- **Code Location:** [`server/src/controllers/payment.controller.js: createPaymentAttemptHandler()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/payment.controller.js#L81)

#### FR49: QR Code Mobile Web Simulator Page Rendering
- **Description:** The system shall render a mobile-optimized server-side HTML page when the QR code is scanned by a smartphone camera, allowing the user to tap "CONFIRM DEMO PAYMENT".
- **Input:** URL parameter `:token`.
- **Processing:** Validates token against `payment_attempts`; renders tradesperson-styled HTML page with plan details and "PAY NOW" button; on POST, transitions status to `paid` and activates partner subscription.
- **Output:** Server-rendered HTML page (`text/html`).
- **Code Location:** [`server/src/controllers/payment.controller.js: renderPayPage()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/payment.controller.js#L201)

#### FR50: QR Code Payment Token Status Polling
- **Description:** The system shall provide a polling endpoint allowing the partner's browser to check within 2.5 seconds whether a scanned QR payment attempt has been completed.
- **Input:** URL parameter `:token`.
- **Processing:** Queries `payment_attempts` by `token_hash`; checks if status is `paid`.
- **Output:** HTTP 200 with `{ status: 'paid' | 'created' | 'expired' }`.
- **Code Location:** [`server/src/controllers/payment.controller.js: getPayTokenStatus()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/payment.controller.js#L158)

#### FR51: Partner KYC Verification Status & Document List
- **Description:** The system shall return the partner's current KYC state (`not_submitted`, `pending`, `verified`, `rejected`), rejection reason, and list of uploaded documents.
- **Input:** Authenticated partner ID.
- **Processing:** Queries `partners.kyc_status`, `partners.rejection_reason`, and joined `kyc_documents`.
- **Output:** HTTP 200 with KYC status payload.
- **Code Location:** [`server/src/controllers/partner.controller.js: getPartnerKyc()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/partner.controller.js#L214)

#### FR52: Partner KYC Multi-Document Multipart Upload
- **Description:** The system shall accept multipart file uploads for Aadhaar card, trade certificate, and passport photo using Multer, storing metadata and transitioning partner status to `pending`.
- **Input:** Multipart form files (`aadhaar`, `trade_cert`, `photo`).
- **Processing:** Validates file MIME types (PDF, PNG, JPEG) and sizes (max 10MB); saves files to `uploads/kyc/`; inserts rows in `kyc_documents`; updates `partners.kyc_status = 'pending'`; emits real-time event to admin.
- **Output:** HTTP 200 with uploaded document records and status `pending`.
- **Code Location:** [`server/src/controllers/partner.controller.js: uploadPartnerKyc()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/partner.controller.js#L273)

#### FR53: Secure KYC Document File Serving
- **Description:** The system shall securely serve uploaded KYC files to the owning partner or platform administrator, preventing unauthorized access.
- **Input:** Document `docId`.
- **Processing:** Verifies caller is either owner partner or admin; verifies file existence on disk; streams file.
- **Output:** Binary file stream.
- **Code Location:** [`server/src/controllers/partner.controller.js: serveKycDocument()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/partner.controller.js#L509)

#### FR54: Partner Online/Offline Duty Toggle
- **Description:** The system shall allow a partner to toggle their online duty status, enforcing that only partners with verified KYC and active subscriptions can go online.
- **Input:** `online` boolean.
- **Processing:** Validates `kyc_status === 'verified'`; validates active subscription; updates `partners.online`. If toggling offline, dismisses any active dispatch offers.
- **Output:** HTTP 200 with updated online state.
- **Code Location:** [`server/src/controllers/partner.controller.js: togglePartnerOnline()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/partner.controller.js#L827)

#### FR55: Partner Dashboard Overview
- **Description:** The system shall compile and return the partner's dashboard metrics: online status, KYC status, active job summary, today's earnings, and total jobs completed.
- **Input:** Authenticated partner ID.
- **Processing:** Aggregates counts and earnings from `requests` and `payments`.
- **Output:** HTTP 200 with dashboard summary metrics.
- **Code Location:** [`server/src/controllers/partner.controller.js: getPartnerDashboard()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/partner.controller.js#L603)

#### FR56: Partner Ratings & Reviews History
- **Description:** The system shall retrieve the customer reviews, star ratings, and feedback comments left for the authenticated partner.
- **Input:** Authenticated partner ID.
- **Processing:** Queries `ratings` joined with `requests` and `customers` ordered by `created_at DESC`.
- **Output:** HTTP 200 with list of ratings and customer feedback.
- **Code Location:** [`server/src/controllers/partner.controller.js: getPartnerRatings()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/partner.controller.js#L1010)

#### FR57: Partner Profile Details Retrieval
- **Description:** The system shall retrieve the partner's profile information, contact info, assigned service name, vehicle type, and rating.
- **Input:** Authenticated partner ID.
- **Processing:** Queries `partners` joined with `services`.
- **Output:** HTTP 200 with partner profile.
- **Code Location:** [`server/src/controllers/partner.controller.js: getPartnerProfile()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/partner.controller.js#L1202)

#### FR58: Partner Profile Update
- **Description:** The system shall allow partners to update their phone, address, vehicle type (`bike_scooter` or `car`), and profile photo.
- **Input:** `phone`, `address`, `vehicle_type`, `photo_url`.
- **Processing:** Validates vehicle classification; geocodes new address if modified; updates `partners` record.
- **Output:** HTTP 200 with updated partner profile.
- **Code Location:** [`server/src/controllers/partner.controller.js: updatePartnerProfile()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/partner.controller.js#L1238)

---

### 4.6 Module 6: Administrator Portal & Platform Governance

#### FR59: Admin Dashboard Overview
- **Description:** The system shall compile and return administrative dashboard metrics including total customers, total partners, active jobs, pending KYC count, and revenue.
- **Input:** Authenticated administrator request.
- **Processing:** Queries aggregate counts across `customers`, `partners`, `requests`, `kyc_documents`, and `subscriptions`.
- **Output:** HTTP 200 with administrative overview statistics.
- **Code Location:** [`server/src/controllers/admin.controller.js: getAdminDashboard()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/admin.controller.js#L318)

#### FR60: Platform Analytics Calculation
- **Description:** The system shall compute platform analytics metrics including requests over time, top service categories, completion versus cancellation rates, partner and customer growth curves, and subscription revenue.
- **Input:** Authenticated administrator request.
- **Processing:** Aggregates time-series data using PostgreSQL date truncations and group-by queries.
- **Output:** HTTP 200 with analytics metrics payload.
- **Code Location:** [`server/src/controllers/admin.controller.js: getAdminAnalytics()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/admin.controller.js#L339)

#### FR61: Read-Only Customer Directory Monitoring
- **Description:** The system shall provide administrators with a read-only paginated list of all registered customers.
- **Input:** Query parameters `page`, `limit`, `search`.
- **Processing:** Queries `customers` table with optional text filtering.
- **Output:** HTTP 200 with customer directory list.
- **Code Location:** [`server/src/controllers/admin.controller.js: getAdminCustomers()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/admin.controller.js#L360)

#### FR62: Read-Only Partner Directory Monitoring
- **Description:** The system shall provide administrators with a read-only list of all registered partners with their service specialty, KYC status, and duty state.
- **Input:** Query parameters `service_id`, `kyc_status`, `online`.
- **Processing:** Queries `partners` joined with `services` and `plans`.
- **Output:** HTTP 200 with partner directory list.
- **Code Location:** [`server/src/controllers/admin.controller.js: getAdminPartners()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/admin.controller.js#L381)

#### FR63: Customer & Partner Record Immutability Enforcement
- **Description:** The system shall strictly forbid and reject any administrative request to update, edit, modify, or delete customer or partner records, returning an HTTP 403 Forbidden status.
- **Input:** Any `PUT`, `PATCH`, `POST`, or `DELETE` request sent by admin to `/api/admin/customers/*` or `/api/admin/partners/*`.
- **Processing:** Intercepts request and immediately halts execution.
- **Output:** HTTP 403 Forbidden with message: `"Admins are not permitted to edit, update, or delete customer or partner data."`
- **Code Location:** [`server/src/controllers/admin.controller.js: rejectCustomerPartnerMutation()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/admin.controller.js#L437)

#### FR64: Platform Service Requests Audit Monitoring
- **Description:** The system shall provide administrators with a read-only list of all service requests across the platform with filtering by status and service category.
- **Input:** Query parameters `status`, `service_id`.
- **Processing:** Queries `requests` joined with `customers`, `partners`, and `services`.
- **Output:** HTTP 200 with list of requests.
- **Code Location:** [`server/src/controllers/admin.controller.js: getAdminRequests()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/admin.controller.js#L447)

#### FR65: Partner Subscriptions Audit Monitoring
- **Description:** The system shall provide administrators with an audit list of all partner subscriptions, plan durations, prices paid, and validity dates.
- **Input:** Authenticated administrator request.
- **Processing:** Queries `subscriptions` joined with `partners` and `plans`.
- **Output:** HTTP 200 with subscription audit list.
- **Code Location:** [`server/src/controllers/admin.controller.js: getAdminSubscriptions()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/admin.controller.js#L513)

#### FR66: Customer Ratings & Feedback Audit Monitoring
- **Description:** The system shall provide administrators with a consolidated log of all customer star ratings and review comments.
- **Input:** Authenticated administrator request.
- **Processing:** Queries `ratings` joined with `customers`, `partners`, and `requests`.
- **Output:** HTTP 200 with ratings audit records.
- **Code Location:** [`server/src/controllers/admin.controller.js: getAdminRatings()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/admin.controller.js#L556)

#### FR67: Platform Audit Activity Log Retrieval
- **Description:** The system shall retrieve the administrative activity log recording platform events (KYC reviews, pricing updates, category modifications).
- **Input:** Authenticated administrator request.
- **Processing:** Queries `activity_logs` ordered by `created_at DESC`.
- **Output:** HTTP 200 with list of logged activity events.
- **Code Location:** [`server/src/controllers/admin.controller.js: getAdminActivityLog()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/admin.controller.js#L598)

#### FR68: Platform Audit Event Logging Service
- **Description:** The system shall provide an audit logging utility that records the actor, action description, and JSON details into the `activity_logs` table.
- **Input:** `actor`, `action`, `details`.
- **Processing:** Inserts row into `activity_logs`.
- **Output:** Database insert confirmation.
- **Code Location:** [`server/src/controllers/admin.controller.js: logActivity()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/admin.controller.js#L23)

#### FR69: Admin Partner KYC Applications Queue
- **Description:** The system shall list all partner KYC submissions awaiting review or filtered by review state (`pending`, `verified`, `rejected`).
- **Input:** Query parameter `status`.
- **Processing:** Queries `partners` and joins uploaded `kyc_documents`.
- **Output:** HTTP 200 with list of KYC applicant records.
- **Code Location:** [`server/src/controllers/partner.controller.js: getAdminKycList()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/partner.controller.js#L907)

#### FR70: Admin KYC Decision Review
- **Description:** The system shall record an administrator's decision to verify or reject a partner's KYC submission, enforcing a mandatory rejection reason if rejected, logging the action, and notifying the partner.
- **Input:** Partner `partnerId`, `decision` (`'verified'` | `'rejected'`), `rejection_reason`.
- **Processing:** Validates rejection reason presence if rejected; updates `partners.kyc_status` and `partners.rejection_reason`; updates `kyc_documents.status`; logs action via `logActivity`; emits real-time notification to partner.
- **Output:** HTTP 200 with review decision confirmation.
- **Code Location:** [`server/src/controllers/admin.controller.js: adminReviewKycDecision()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/admin.controller.js#L889)

#### FR71: Subscription Plan Price Configuration
- **Description:** The system shall allow administrators to modify subscription plan prices, enforcing Business Rule 2 (BR-2): the new price applies only to future subscriptions, while existing subscriptions remain unchanged.
- **Input:** Plan `id`, `price`.
- **Processing:** Validates positive numeric price; updates `plans.price`; logs event to `activity_logs`. Existing active records in `subscriptions` remain unaffected.
- **Output:** HTTP 200 with updated plan details.
- **Code Location:** [`server/src/controllers/admin.controller.js: updatePlanPrice()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/admin.controller.js#L642)

#### FR72: Admin Service Categories Listing
- **Description:** The system shall provide administrators with a complete list of all service categories including active and inactive categories.
- **Input:** Authenticated administrator request.
- **Processing:** Queries `services` table ordered by `name ASC`.
- **Output:** HTTP 200 with all service categories.
- **Code Location:** [`server/src/controllers/admin.controller.js: getAdminServices()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/admin.controller.js#L704)

#### FR73: Create Service Category
- **Description:** The system shall allow administrators to add a new service category with name, slug, description, and base price estimate.
- **Input:** `name`, `slug`, `description`, `base_price_estimate`.
- **Processing:** Validates name and slug uniqueness; inserts row into `services`; logs event to `activity_logs`.
- **Output:** HTTP 201 with created service category.
- **Code Location:** [`server/src/controllers/admin.controller.js: createServiceCategory()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/admin.controller.js#L724)

#### FR74: Update Service Category Metadata
- **Description:** The system shall allow administrators to update the title, description, and base price estimate of an existing service category.
- **Input:** Service `id`, `name`, `description`, `base_price_estimate`.
- **Processing:** Updates fields in `services`; records audit log entry.
- **Output:** HTTP 200 with updated service object.
- **Code Location:** [`server/src/controllers/admin.controller.js: updateServiceCategory()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/admin.controller.js#L788)

#### FR75: Toggle Service Category Active State
- **Description:** The system shall allow administrators to activate or deactivate a service category. Deactivated services are hidden from public customer booking.
- **Input:** Service `id`.
- **Processing:** Toggles `services.active = NOT active`; logs action in `activity_logs`.
- **Output:** HTTP 200 with toggled service state.
- **Code Location:** [`server/src/controllers/admin.controller.js: toggleServiceActive()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/admin.controller.js#L845)

---

### 4.7 Module 7: Notifications, Support & System Health

#### FR76: User In-App Notifications Retrieval
- **Description:** The system shall retrieve notifications for the authenticated user based on their user ID and role (`customer`, `partner`, `admin`).
- **Input:** Authenticated user request.
- **Processing:** Queries `notifications` table where `recipient_type = req.user.role` and `recipient_id = req.user.id` ordered by `created_at DESC`.
- **Output:** HTTP 200 with notification list.
- **Code Location:** [`server/src/controllers/notification.controller.js: getNotifications()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/notification.controller.js#L30)

#### FR77: Single Notification Mark-As-Read
- **Description:** The system shall mark a specific notification as read.
- **Input:** Notification `id`.
- **Processing:** Updates `notifications.read_flag = true` for matching user notification.
- **Output:** HTTP 200 with updated notification.
- **Code Location:** [`server/src/controllers/notification.controller.js: markAsRead()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/notification.controller.js#L62)

#### FR78: Bulk All Notifications Mark-As-Read
- **Description:** The system shall mark all unread notifications for the user as read in a single batch operation.
- **Input:** Authenticated user request.
- **Processing:** Updates `notifications.read_flag = true` where `read_flag = false` for the user.
- **Output:** HTTP 200 with updated count.
- **Code Location:** [`server/src/controllers/notification.controller.js: markAllAsRead()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/notification.controller.js#L93)

#### FR79: Support Ticket Submission & Logging
- **Description:** The system shall allow authenticated users to submit a support ticket with category, subject, and description, recording it in the audit log.
- **Input:** `category`, `subject`, `description`.
- **Processing:** Validates fields; logs ticket event into `activity_logs` with actor details; creates confirmation notification.
- **Output:** HTTP 201 with ticket submission reference.
- **Code Location:** [`server/src/controllers/support.controller.js: submitSupportTicket()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/support.controller.js#L9)

#### FR80: Frequently Asked Questions (FAQ) Knowledge Base
- **Description:** The system shall provide a structured knowledge base of FAQs categorized for Customers, Partners, and General inquiries.
- **Input:** None (public/authenticated).
- **Processing:** Returns structured collection of verified FAQ items.
- **Output:** HTTP 200 with categorized FAQ dictionary.
- **Code Location:** [`server/src/controllers/support.controller.js: getSupportFaqs()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/support.controller.js#L65)

#### FR81: Comprehensive Diagnostic System Health Ping
- **Description:** The system shall perform a database connection test, query baseline entity counts (`services`, `plans`, `partners`, `admins`), and return server uptime, API version, and environment status.
- **Input:** None (public diagnostic endpoint).
- **Processing:** Executes `SELECT current_database(), current_user, version()` and counts baseline records.
- **Output:** HTTP 200 (or 503 if DB disconnected) with comprehensive JSON health payload.
- **Code Location:** [`server/src/controllers/health.controller.js: getHealth()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/server/src/controllers/health.controller.js#L9)

---

### 4.8 Module 8: Frontend Routing, State & Role Security

#### FR82: Role-Based Route Guarding & Cross-Portal Access Redirection
- **Description:** The frontend application shall inspect browser URL hash transitions, verify user session role, and redirect unauthorized users away from portals they do not own (e.g. Partners cannot view Customer or Admin portals; Customers cannot view Partner or Admin portals).
- **Input:** URL hash changes (`hashchange` event).
- **Processing:** Evaluates `isAuthenticated` and `role` against destination portal prefix; redirects unauthorized access to the user's appropriate portal dashboard with a transient warning notification banner.
- **Output:** Navigation to authorized hash view.
- **Code Location:** [`client/src/App.jsx: App()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/App.jsx#L62)

#### FR83: Recoverable Portal Error Boundary
- **Description:** The frontend shall wrap portal views with an error boundary that catches rendering anomalies, displays a themed tradesperson ticket with error stack trace, and provides a one-click recovery button to return safely to the dashboard.
- **Input:** Uncaught component rendering exceptions.
- **Processing:** Captures error in `componentDidCatch`; displays styled "RECOVERABLE PORTAL INTERFACE" ticket.
- **Output:** Safe recovery UI preventing application crash.
- **Code Location:** [`client/src/App.jsx: PortalErrorBoundary`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/App.jsx#L12)

#### FR84: Global Authentication State & Session Token Synchronization
- **Description:** The frontend shall maintain persistent reactive authentication state across page reloads using browser `localStorage`, synchronizing JWT tokens, user profiles, and roles.
- **Input:** Login, logout, and token refresh events.
- **Processing:** Reads and writes `fixit_token`, `fixit_user`, and `fixit_role` to `localStorage`; exposes `useAuth()` hook for components.
- **Output:** Synchronized React context state.
- **Code Location:** [`client/src/context/AuthContext.jsx: AuthProvider()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/context/AuthContext.jsx#L16)

#### FR85: Dynamic Google Maps JavaScript API Loading
- **Description:** The client shall dynamically inject and load the Google Maps JavaScript API script with geometry libraries on demand, deduplicating multiple script tags and resolving a singleton promise.
- **Input:** Google Maps public browser API key.
- **Processing:** Checks `window.google.maps`; appends script tag with `async` and `defer` if absent; attaches load and error listeners.
- **Output:** Promise resolving to `window.google.maps`.
- **Code Location:** [`client/src/utils/googleMapsLoader.js: loadGoogleMaps()`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/client/src/utils/googleMapsLoader.js#L9)

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements
- **NFR-P1 (Matching Latency):** Spatial database filtering and eligible partner discovery shall complete within 500 milliseconds for requests within a 2 km radius.
- **NFR-P2 (Real-Time Propagation):** Real-time status updates and simulation ticks emitted via Socket.IO shall reach clients within 1000 milliseconds on a standard broadband/4G connection.
- **NFR-P3 (Connection Pool Health):** The PostgreSQL connection pool shall maintain up to 20 concurrent connections with a 5-second connection timeout, failing fast if the database is unreachable (`server/src/config/db.js` line 13-16).
- **NFR-P4 (Telemetry Precision):** Location simulation updates shall calculate polyline positions and broadcast coordinates at 1.0-second intervals (`server/src/services/socket.service.js` line 1083).

### 5.2 Safety & Reliability Requirements
- **NFR-R1 (Geocoding Fault Tolerance):** Any failure, rate-limiting, or timeout in external geocoding services (Google Maps / Nominatim) shall never throw an unhandled 500 exception or block job booking. The system shall gracefully fall back to default Bangalore zone coordinates.
- **NFR-R2 (Polyline Fallback):** If Google Routes API v2 is unreachable, the system shall automatically fall back to a straight-line coordinate route (`getStraightLineFallbackRoute`) without disrupting the work order.
- **NFR-R3 (Crash Recovery):** Server restart shall automatically clean up orphaned searching requests via `cleanupOrphanedSearchingRequests()` and resume in-flight trips via `resumeActiveTrips()`.

### 5.3 Security & Role-Based Access Control
- **NFR-S1 (Password Storage):** All passwords shall be cryptographically hashed using `bcrypt` with a minimum work factor of 10 salt rounds before storage (`server/src/services/token.service.js`).
- **NFR-S2 (Session Tokens):** Session tokens shall be signed with HMAC-SHA256 JWT tokens containing user ID, role, and session version, expiring after 7 days (`server/src/config/index.js`).
- **NFR-S3 (Document Upload Safety):** File uploads via Multer shall strictly enforce MIME-type whitelisting (PDF for KYC documents; JPEG/PNG for photos) and a maximum file size of 10 MB per file (`server/src/middleware/upload.middleware.js`).
- **NFR-S4 (Role Segregation):** All protected backend routes shall mandate JWT authentication and role authorization via `authenticateToken` and `requireRole`. Cross-portal access between customer, partner, and admin is blocked at both client and server layers.
- **NFR-S5 (Partner Concurrency Guarantee):** A database-level partial unique index (`idx_requests_active_partner`) ensures a partner can never accept more than one active job concurrently across the entire database.

### 5.4 Software Quality Attributes
- **NFR-Q1 (Design System Compliance):** The frontend shall conform strictly to the tradesperson work order design tokens in [`docs/DESIGN.md`](file:///c:/Users/chris/OneDrive/Desktop/Mini%20Project%20FixIt%20Now/docs/DESIGN.md), featuring square corners (`border-radius: 0`), paper background `#FBFAF6`, ink border `2px solid #111418`, signal accent `#FF5B14`, and hard offset shadows.
- **NFR-Q2 (Auditability):** All sensitive platform changes (KYC approval/rejection, plan price changes, service category changes, support tickets) shall be logged in the `activity_logs` table with timestamp, actor email, and JSON payload.
- **NFR-Q3 (Code Quality):** Code formatting and linting shall be validated using ESLint 9 (`eslint.config.js`), Prettier 3 (`.prettierrc`), and Oxlint (`client/.oxlintrc.json`).

---

## 6. Future Scope

The following features represent sensible future capabilities that are **not** implemented in the current codebase and are intentionally excluded from the functional requirements:
1. **Real Payment Gateway Integration:** Replacement of the simulated payment settlement and QR code confirmation flow with live payment gateway webhooks (e.g., Razorpay, Cashfree, or Stripe).
2. **Native Mobile GPS Driver App:** Native Android and iOS mobile applications with background GPS geolocation transmission (e.g., via React Native or Flutter) to replace the server-side polyline distance interpolation simulation.
3. **Advance Appointment Scheduling:** A calendar booking engine allowing customers to select future dates and specific timeslots instead of immediate on-demand dispatches.
4. **Multi-Service Partner Registration:** Allowing experienced tradespeople to register and receive job offers across multiple certified trade categories simultaneously.
5. **Push Notifications (FCM / APNs):** System-level mobile push notifications to alert offline partners of dispatch offers when their browser is minimized or closed.
6. **In-App Real-Time Chat & VoIP:** In-app encrypted messaging and masked voice calling between customer and assigned partner during transit.

---

## 7. Verification Pass & Traceability Matrix

Every requirement listed in Section 4 was independently verified by opening and inspecting the cited codebase files.

| Requirement ID | Feature Description | Cited Code Location | Verified (Yes/No) |
| :--- | :--- | :--- | :---: |
| **FR1** | Customer Registration & Validation | `server/src/controllers/auth.controller.js: registerCustomer()` | **Yes** |
| **FR2** | Password Complexity Enforcement | `server/src/services/token.service.js: validatePassword()` | **Yes** |
| **FR3** | Customer Login & JWT Issuance | `server/src/controllers/auth.controller.js: loginCustomer()` | **Yes** |
| **FR4** | Customer Forgot Password OTP Dispatch | `server/src/controllers/auth.controller.js: forgotPasswordCustomer()` | **Yes** |
| **FR5** | Customer Password Reset Execution | `server/src/controllers/auth.controller.js: resetPasswordCustomer()` | **Yes** |
| **FR6** | Partner Registration & Vehicle Type | `server/src/controllers/auth.controller.js: registerPartner()` | **Yes** |
| **FR7** | Partner Login & Status Check | `server/src/controllers/auth.controller.js: loginPartner()` | **Yes** |
| **FR8** | Partner Forgot Password OTP Dispatch | `server/src/controllers/auth.controller.js: forgotPasswordPartner()` | **Yes** |
| **FR9** | Partner Password Reset Execution | `server/src/controllers/auth.controller.js: resetPasswordPartner()` | **Yes** |
| **FR10** | Administrator Login | `server/src/controllers/auth.controller.js: loginAdmin()` | **Yes** |
| **FR11** | User Session Verification (`/api/auth/me`) | `server/src/controllers/auth.controller.js: getCurrentUser()` | **Yes** |
| **FR12** | Partner Logout & Session Version Bump | `server/src/controllers/partner.controller.js: logoutPartner()` | **Yes** |
| **FR13** | JWT Authentication Middleware | `server/src/middleware/auth.middleware.js: authenticateToken()` | **Yes** |
| **FR14** | Role-Based Access Control Middleware | `server/src/middleware/auth.middleware.js: requireRole()` | **Yes** |
| **FR15** | Customer Profile Retrieval | `server/src/controllers/customer.controller.js: getCustomerProfile()` | **Yes** |
| **FR16** | Customer Profile Update & Geocoding | `server/src/controllers/customer.controller.js: updateCustomerProfile()` | **Yes** |
| **FR17** | Saved Address Book Retrieval | `server/src/controllers/customer.controller.js: getSavedAddresses()` | **Yes** |
| **FR18** | Add Saved Address | `server/src/controllers/customer.controller.js: addSavedAddress()` | **Yes** |
| **FR19** | Update Saved Address | `server/src/controllers/customer.controller.js: updateSavedAddress()` | **Yes** |
| **FR20** | Delete Saved Address | `server/src/controllers/customer.controller.js: deleteSavedAddress()` | **Yes** |
| **FR21** | Public Service Catalog Retrieval | `server/src/controllers/service.controller.js: getActiveServices()` | **Yes** |
| **FR22** | Create Service Request with Issue Photo | `server/src/controllers/request.controller.js: createRequest()` | **Yes** |
| **FR23** | Cancel Service Request | `server/src/controllers/request.controller.js: cancelRequest()` | **Yes** |
| **FR24** | Get Request Details by ID | `server/src/controllers/request.controller.js: getRequestById()` | **Yes** |
| **FR25** | Get Request History | `server/src/controllers/request.controller.js: getRequestHistory()` | **Yes** |
| **FR26** | Secure Issue Photo Retrieval | `server/src/controllers/request.controller.js: getRequestPhoto()` | **Yes** |
| **FR27** | Address Geocoding with Fallback | `server/src/services/geocoding.service.js: geocodeAddress()` | **Yes** |
| **FR28** | Haversine Distance Calculation | `server/src/services/matching.service.js: calculateHaversineDistance()` | **Yes** |
| **FR29** | Eligible Partner Search & Filtering | `server/src/services/matching.service.js: findEligiblePartnersFromDb()` | **Yes** |
| **FR30** | Real-Time Sequential Offer Loop | `server/src/services/socket.service.js: startRequestMatching()` | **Yes** |
| **FR31** | Partner Job Offer Acceptance | `server/src/services/socket.service.js: handlePartnerAccept()` | **Yes** |
| **FR32** | Partner Job Offer Decline | `server/src/services/socket.service.js: handlePartnerDecline()` | **Yes** |
| **FR33** | Matching Timeout Handling | `server/src/services/socket.service.js: handleMatchingTimeout()` | **Yes** |
| **FR34** | Partner Status Progression Sequence | `server/src/controllers/request.controller.js: updateRequestStatus()` | **Yes** |
| **FR35** | Road Routing via Google Routes API v2 | `server/src/services/routes.service.js: computeTwoWheelerRoute()` | **Yes** |
| **FR36** | Pure Function ETA Calculation | `server/src/services/routes.service.js: calculateEta()` | **Yes** |
| **FR37** | Partner Location Telemetry Simulation | `server/src/services/socket.service.js: startMovementSimulation()` | **Yes** |
| **FR38** | Partner Arrival & OTP Prompt | `server/src/services/socket.service.js: notifyPartnerArrived()` | **Yes** |
| **FR39** | 6-Digit Service OTP Verification | `server/src/controllers/request.controller.js: verifyRequestOtp()` | **Yes** |
| **FR40** | Customer Rating & Review Submission | `server/src/controllers/request.controller.js: rateRequest()` | **Yes** |
| **FR41** | Customer Rating Skip | `server/src/controllers/request.controller.js: skipRequestRating()` | **Yes** |
| **FR42** | Simulated Payment Settlement | `server/src/controllers/payment.controller.js: processPayment()` | **Yes** |
| **FR43** | Digital Work Order Receipt Retrieval | `server/src/controllers/payment.controller.js: getPaymentReceipt()` | **Yes** |
| **FR44** | Partner Earnings Ledger Calculation | `server/src/controllers/partner.controller.js: getPartnerEarnings()` | **Yes** |
| **FR45** | Subscription Plans Retrieval | `server/src/controllers/partner.controller.js: getSubscriptionPlans()` | **Yes** |
| **FR46** | Partner Subscription Status & Expiry | `server/src/controllers/partner.controller.js: getPartnerSubscription()` | **Yes** |
| **FR47** | Partner Subscription Activation | `server/src/controllers/partner.controller.js: subscribePlan()` | **Yes** |
| **FR48** | QR Code Payment Attempt Creation | `server/src/controllers/payment.controller.js: createPaymentAttemptHandler()` | **Yes** |
| **FR49** | QR Code Mobile Simulator Page | `server/src/controllers/payment.controller.js: renderPayPage()` | **Yes** |
| **FR50** | QR Payment Token Status Polling | `server/src/controllers/payment.controller.js: getPayTokenStatus()` | **Yes** |
| **FR51** | Partner KYC Verification Status | `server/src/controllers/partner.controller.js: getPartnerKyc()` | **Yes** |
| **FR52** | Partner KYC Multipart File Upload | `server/src/controllers/partner.controller.js: uploadPartnerKyc()` | **Yes** |
| **FR53** | Secure KYC Document File Serving | `server/src/controllers/partner.controller.js: serveKycDocument()` | **Yes** |
| **FR54** | Partner Online/Offline Duty Toggle | `server/src/controllers/partner.controller.js: togglePartnerOnline()` | **Yes** |
| **FR55** | Partner Dashboard Overview | `server/src/controllers/partner.controller.js: getPartnerDashboard()` | **Yes** |
| **FR56** | Partner Ratings & Reviews History | `server/src/controllers/partner.controller.js: getPartnerRatings()` | **Yes** |
| **FR57** | Partner Profile Details Retrieval | `server/src/controllers/partner.controller.js: getPartnerProfile()` | **Yes** |
| **FR58** | Partner Profile Update | `server/src/controllers/partner.controller.js: updatePartnerProfile()` | **Yes** |
| **FR59** | Admin Dashboard Overview Metrics | `server/src/controllers/admin.controller.js: getAdminDashboard()` | **Yes** |
| **FR60** | Platform Analytics Calculation | `server/src/controllers/admin.controller.js: getAdminAnalytics()` | **Yes** |
| **FR61** | Read-Only Customer Directory | `server/src/controllers/admin.controller.js: getAdminCustomers()` | **Yes** |
| **FR62** | Read-Only Partner Directory | `server/src/controllers/admin.controller.js: getAdminPartners()` | **Yes** |
| **FR63** | Customer/Partner Record Immutability | `server/src/controllers/admin.controller.js: rejectCustomerPartnerMutation()` | **Yes** |
| **FR64** | Service Requests Audit Monitoring | `server/src/controllers/admin.controller.js: getAdminRequests()` | **Yes** |
| **FR65** | Partner Subscriptions Audit Monitoring | `server/src/controllers/admin.controller.js: getAdminSubscriptions()` | **Yes** |
| **FR66** | Customer Ratings Audit Monitoring | `server/src/controllers/admin.controller.js: getAdminRatings()` | **Yes** |
| **FR67** | Activity Audit Log Retrieval | `server/src/controllers/admin.controller.js: getAdminActivityLog()` | **Yes** |
| **FR68** | Activity Audit Event Logging Service | `server/src/controllers/admin.controller.js: logActivity()` | **Yes** |
| **FR69** | Admin Partner KYC Queue Listing | `server/src/controllers/partner.controller.js: getAdminKycList()` | **Yes** |
| **FR70** | Admin KYC Review Decision Execution | `server/src/controllers/admin.controller.js: adminReviewKycDecision()` | **Yes** |
| **FR71** | Subscription Plan Price Configuration | `server/src/controllers/admin.controller.js: updatePlanPrice()` | **Yes** |
| **FR72** | Admin Service Categories Listing | `server/src/controllers/admin.controller.js: getAdminServices()` | **Yes** |
| **FR73** | Create Service Category | `server/src/controllers/admin.controller.js: createServiceCategory()` | **Yes** |
| **FR74** | Update Service Category Metadata | `server/src/controllers/admin.controller.js: updateServiceCategory()` | **Yes** |
| **FR75** | Toggle Service Category Active State | `server/src/controllers/admin.controller.js: toggleServiceActive()` | **Yes** |
| **FR76** | In-App Notifications Retrieval | `server/src/controllers/notification.controller.js: getNotifications()` | **Yes** |
| **FR77** | Single Notification Mark-As-Read | `server/src/controllers/notification.controller.js: markAsRead()` | **Yes** |
| **FR78** | Bulk Notifications Mark-As-Read | `server/src/controllers/notification.controller.js: markAllAsRead()` | **Yes** |
| **FR79** | Support Ticket Submission & Logging | `server/src/controllers/support.controller.js: submitSupportTicket()` | **Yes** |
| **FR80** | FAQ Knowledge Base Retrieval | `server/src/controllers/support.controller.js: getSupportFaqs()` | **Yes** |
| **FR81** | Diagnostic System Health Ping | `server/src/controllers/health.controller.js: getHealth()` | **Yes** |
| **FR82** | Role-Based Route Guarding & Redirection | `client/src/App.jsx: App()` | **Yes** |
| **FR83** | Recoverable Portal Error Boundary | `client/src/App.jsx: PortalErrorBoundary` | **Yes** |
| **FR84** | Global Auth State & Token Sync | `client/src/context/AuthContext.jsx: AuthProvider()` | **Yes** |
| **FR85** | Google Maps JS Dynamic Loader | `client/src/utils/googleMapsLoader.js: loadGoogleMaps()` | **Yes** |
