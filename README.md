# ShadowBase 

> **Zero-Downtime Schema Migration Sandbox**
> 
> *Test risky database migrations safely against live production traffic patterns before touching production.*

---

[![Java](https://img.shields.io/badge/Java-21-orange.svg?style=flat-square&logo=openjdk)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen.svg?style=flat-square&logo=springboot)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Testcontainers-2496ED.svg?style=flat-square&logo=docker)](https://testcontainers.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat-square&logo=react)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## Overview

Dropping a database column or altering a type in production is terrifying. Even when unit tests pass, legacy services or un-indexed background queries can break instantly once live traffic hits the updated schema.

**ShadowBase** solves this by creating an **on-demand, isolated database sandbox environment**. It spins up disposable PostgreSQL clones, captures live production SQL traffic via Change Data Capture (**Debezium + Kafka WAL replication**), replays traffic against candidate schemas in real-time, and surfaces breaking queries in a React + Monaco Editor dashboard.

---

## Architecture & System Workflow

```
                                    +-----------------------------------------+
                                    |        ShadowBase Architecture          |
                                    +-----------------------------------------+

  +-----------------------+           CDC WAL Events          +----------------------------------+
  |  Mock Production DB   |---------------------------------->|       ShadowBase Replayer        |
  | (wal_level = logical) |                                   |    (CdcStreamReplayerService)    |
  +-----------------------+                                   +----------------+-----------------+
                                                                               |
                                                                               | Replays SQL
                                                                               v
  +-----------------------+           AST Pre-Flight          +----------------------------------+
  |  Monaco UI Dashboard  |---------------------------------->|   Shadow DB Sandbox Container    |
  |  (React + Monaco IDE) |   Flags High-Risk Statements      | (Ephemeral Testcontainers Clone) |
  +-----------+-----------+                                   +----------------+-----------------+
              ^                                                                |
              |                                                                | Intercepts Exception
              +----------------------------------------------------------------+
                                Surfacing Breaking Queries & Errors
```

### Flow Breakdown:
1. **Production Replication:** Production PostgreSQL streams Write-Ahead Logs (`wal_level=logical`) to Debezium & Kafka.
2. **Pre-Flight AST Parsing:** DDL migration scripts pass through **JSqlParser** to detect high-risk operations (`DROP COLUMN`, `TRUNCATE`).
3. **Ephemeral Sandboxing:** **Testcontainers** boots clean PostgreSQL instances (`postgres:15-alpine`) on demand in $<4$ seconds.
4. **Traffic Replay:** `CdcStreamReplayerService` streams production transactions onto the candidate schema clone concurrently.
5. **Exception Detection:** If a query breaks against the altered schema, ShadowBase catches the `PSQLException` and logs the exact query and stack trace to the Monaco UI.

---

## Key Features

-  **Ephemeral Database Sandboxes:** Spins up programmatically isolated PostgreSQL containers using the Testcontainers Java API.
- **Live CDC Traffic Streaming:** Captures 100% of production SQL mutations at the storage layer without locks or API overhead.
- **Real-Time Stream Replayer:** Executes incoming transactions concurrently against active sandboxes and captures breaking query exceptions.
- **Static AST Risk Guardrails:** Parses raw SQL scripts into Abstract Syntax Trees using **JSqlParser** to flag destructive schema changes prior to execution.
- **Monaco Editor Dashboard:** IDE-style browser interface with syntax highlighting, live metrics, and real-time exception logs.

---

## Getting Started

### Prerequisites
Before running ShadowBase, ensure you have the following installed locally:
- **Java 21 JDK** or later
- **Node.js v18+** & `npm`
- **Docker Desktop** *(Required for Testcontainers and PostgreSQL container execution)*
- **Maven 3.9+** *(or use the included `./mvnw` wrapper)*

---

## Git Workflow & Pulling Latest Code

If you are contributing to or syncing the latest codebase, use the standard Git workflow below:

### 1. Clone the Repository
```bash
git clone https://github.com/Infotact-Solutions/ShadowBase.git
cd ShadowBase
```

### 2. Pulling the Latest Changes
To fetch and merge updates from the remote repository:
```bash
# Ensure you are on the main branch
git checkout main

# Pull the latest commits
git pull origin main
```

### 3. Creating a Feature Branch for Contributions
```bash
# Create and switch to your feature branch
git checkout -b feature/your-feature-name

# Keep your branch up to date with main
git fetch origin
git rebase origin/main
```

---

## Local Installation & Running

### Step 1: Start the Backend (Spring Boot 3)
```bash
# Navigate to the backend directory
cd backend

# Build and run using the Maven wrapper
./mvnw clean install
./mvnw spring-boot:run
```
> The backend REST API will start on **`http://localhost:8081`**.

### Step 2: Start the Frontend (React + Vite)
Open a new terminal window:
```bash
# Navigate to the frontend directory
cd frontend

# Install node dependencies
npm install

# Start the Vite development server
npm run dev
```
> The frontend application will start on **`http://localhost:5173`**.

---

## REST API Reference

ShadowBase exposes RESTful APIs for managing database containers, traffic replay, CDC metrics, and AST analysis.

### Production Database Controller (`/api/production`)

| Method | Endpoint | Description | Request Body | Sample Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/production/start` | Spins up Mock Production Postgres container (`wal_level=logical`) | None | `{"status": "ONLINE", "jdbcUrl": "jdbc:postgresql://..."}` |
| `GET` | `/api/production/status` | Checks production DB online status and CDC event counter | None | `{"status": "ONLINE", "cdcEventsCaptured": "15"}` |
| `POST` | `/api/production/transaction` | Simulates a live production transaction (`INSERT/UPDATE/DELETE`) | `{"sql": "INSERT INTO users..."}` | `{"success": true, "message": "Transaction applied..."}` |
| `DELETE`| `/api/production` | Stops and destroys the production database container | None | `"Production DB stopped."` |

---

### Shadow Container Controller (`/api/containers`)

| Method | Endpoint | Description | Request Body | Sample Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/containers/start` | Launches an isolated PostgreSQL shadow sandbox via Testcontainers | None | `{"environmentId": "uuid...", "jdbcUrl": "..."}` |
| `POST` | `/api/containers/{id}/execute` | Executes DDL migration or DML query on a specific sandbox | `{"sql": "ALTER TABLE..."}` | `{"success": true, "message": "SQL statement executed."}` |
| `POST` | `/api/containers/{id}/seed` | Seeds the shadow container with initial table schemas | None | `{"success": true, "message": "Returned 2 row(s)."}` |
| `DELETE`| `/api/containers/{id}` | Destroys the specified sandbox container | None | `true` |

---

### CDC Stream Controller (`/api/cdc`)

| Method | Endpoint | Description | Request Body | Sample Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/cdc/stats` | Fetches traffic replayer metrics (captured, success, failures) | None | `{"totalEventsCaptured": 15, "totalReplayedFailures": 1}` |
| `GET` | `/api/cdc/exceptions` | Fetches audit logs of breaking schema queries & stack traces | None | `[{"sql": "...", "error": "PSQLException..."}]` |

---

### AST Static Analysis Controller (`/api/ast`)

| Method | Endpoint | Description | Request Body | Sample Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/ast/analyze` | Performs pre-flight JSqlParser AST risk check on migration scripts | `{"sql": "ALTER TABLE..."}` | `{"hasRisk": true, "riskLevel": "HIGH", "warnings": [...]}` |

---

## Repository Structure

```
ShadowBase/
├── backend/                                  # Spring Boot 3 Backend
│   ├── src/main/java/com/shadowbase/
│   │   ├── controller/                      # REST API Endpoints
│   │   │   ├── DatabaseEnvironmentController.java
│   │   │   ├── ProductionDatabaseController.java
│   │   │   ├── CdcStreamController.java
│   │   │   └── SqlAstAnalysisController.java
│   │   ├── dto/                             # Data Transfer Objects
│   │   └── service/                         # Core Business Logic & Engines
│   │       ├── DatabaseContainerService.java # Testcontainers Manager
│   │       ├── ProductionDatabaseService.java# Mock Prod DB & WAL Stream
│   │       ├── CdcStreamReplayerService.java # Traffic Replayer Engine
│   │       └── SqlAstAnalysisService.java   # JSqlParser AST Engine
│   ├── pom.xml                               # Java 21 & Maven Dependencies
│   └── mvnw                                  # Maven Wrapper Script
├── frontend/                                 # React + Vite Frontend
│   ├── src/
│   │   ├── App.jsx                           # Main Application & Monaco UI
│   │   └── main.jsx
│   ├── package.json                          # Node Dependencies
│   └── vite.config.js                        # Vite Server Config
├── docs/                                     # Architecture & Phase Specs
└── README.md                                 # Project Documentation
```

---

## Contributing

Contributions are welcome! Please follow these steps to contribute:
1. Fork the Repository.
2. Create a Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## License

Distributed under the **MIT License**. See `LICENSE` for more information.

Developed as an individual internship project at **Infotact Solutions**.
