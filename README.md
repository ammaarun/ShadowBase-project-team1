# ShadowBase-project-team1
Zero-Downtime Schema Migration Sandbox
Added Spring Boot skeleton with Web, JPA, Lombok, Validation, MySQL dependencies.

ShadowBase: Zero-Downtime Schema Migration Sandbox
📌 Overview
ShadowBase is a sandbox for safe schema migrations. It spins up temporary PostgreSQL clones, shadows live SQL traffic with Debezium/Kafka, and lets you test schema changes before production.

⚙️ Tech Stack
Backend: Java 21, Spring Boot 3

Database: PostgreSQL via Testcontainers

CDC: Debezium + Kafka

Replay Engine: Java Stream API

Frontend: React + Monaco Editor

🚀 Phase 1 (Current)
Spring Boot backend with REST APIs (DatabaseContainerService, DatabaseEnvironmentController)

React frontend scaffold with Monaco SQL editor

Start/stop shadow DB environments from UI

🛠️ Setup
Backend
bash
./mvnw spring-boot:run
Frontend
bash
cd frontend
npm install
npm run dev
📖 References
Spring Boot Docs (spring.io in Bing)

Testcontainers

Debezium

📅 Roadmap
Phase 2: Kafka + Debezium CDC

Phase 3: SQL replay engine

Phase 4: Migration testing workflows

shadowbase/
├── backend/
│   ├── src/
│   └── pom.xml
├── frontend/
│   ├── src/
│   └── package.json
└── README.md
