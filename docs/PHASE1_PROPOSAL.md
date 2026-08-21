# ShadowBase: Zero-Downtime Schema Migration Sandbox

## Overview

This project builds a zero-downtime schema migration sandbox. It allows developers and database admins to spin up a temporary database clone, shadow live SQL traffic using Debezium, and apply schema changes to the clone to safely test migrations before they hit production.

## Architecture & Technology Stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3 |
| Container Engine | Testcontainers (Java API) — dynamically spin up Dockerized PostgreSQL databases |
| Change Data Capture | Debezium / Kafka — intercept live database transactions |
| Stream Replayer | Java Stream API — replay intercepted SQL queries against the isolated "Shadow" database |
| Frontend | React, Microsoft Monaco Editor for syntax-highlighted SQL editing |

## Proposed Changes

We will build this incrementally, step-by-step, ensuring the team understands each concept before moving on. We'll follow standard Spring Boot MVC architecture (Controller → Service → Repository).

## Phase 1: Project Initialization & Container Engine (Week 1 Focus)

Our first major goal is to create the backend container engine and the frontend UI scaffolding.

### Backend Implementation Steps

1. Initialize a new Spring Boot 3 project with Java 21.
2. Add dependencies for Web, JPA, PostgreSQL, Testcontainers.
3. Build a `DatabaseContainerService` to programmatically spin up, seed, and destroy Docker databases using the Testcontainers API.
4. Build a REST Controller (`DatabaseEnvironmentController`) to expose these actions to the frontend.

### Frontend Implementation Steps

1. Initialize a new React project using Vite.
2. Set up basic routing and layout.
3. Integrate `@monaco-editor/react` to provide a syntax-highlighted IDE-like environment in the browser.
4. Build a UI to communicate with our backend to start/stop shadow database environments.
