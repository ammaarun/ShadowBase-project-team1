# ShadowBase Phase 2 Documentation: Change Data Capture (CDC) & Traffic Shadowing Engine

## 1. Overview & Architecture
Phase 2 of **ShadowBase** implements the **Change Data Capture (CDC)** and **Live Traffic Shadowing Engine**. 

In high-concurrency production environments, schema migrations cannot be evaluated solely on static data. ShadowBase captures live incoming production transactions via PostgreSQL Write-Ahead Logging (`wal_level=logical`) and automatically shadows those identical queries onto isolated **Shadow Sandbox Containers** running the new candidate schema. 

If a candidate migration script contains a breaking change (such as dropping a column or modifying a constraint), the CDC Stream Replayer intercepts the resulting SQL Exception and logs the exact breaking query for developer auditing—preventing broken migrations from ever reaching production.

```
┌────────────────────────┐         CDC WAL Events         ┌────────────────────────────────┐
│  Mock Production DB    ├───────────────────────────────►│    CDC Stream Replayer         │
│ (wal_level = logical)  │                                │  (CdcStreamReplayerService)    │
└────────────────────────┘                                └──────────────┬─────────────────┘
                                                                         │
                                                                         │ Replays SQL
                                                                         ▼
                                                          ┌────────────────────────────────┐
                                                          │     Shadow DB Sandbox Container │
                                                          │   (Altered Candidate Schema)   │
                                                          └──────────────┬─────────────────┘
                                                                         │
                                                                         │ Catches Exception
                                                                         ▼
                                                          ┌────────────────────────────────┐
                                                          │    Breaking Schema Exception   │
                                                          │      Log & Metrics API         │
                                                          └────────────────────────────────┘
```

---

## 2. Key Backend Components

### A. Production Database Engine with WAL Logical Replication
- **File**: `src/main/java/com/shadowbase/service/ProductionDatabaseService.java`
- **Description**: Programmatically spins up a separate PostgreSQL Docker container (`postgres:15-alpine`) with Write-Ahead Logging enabled via `.withCommand("postgres", "-c", "wal_level=logical")`.
- **REST Controller**: `src/main/java/com/shadowbase/controller/ProductionDatabaseController.java`
- **Endpoints**:
  - `POST /api/production/start`: Starts the Mock Production database with WAL logical replication.
  - `POST /api/production/transaction`: Executes live production transactions (`INSERT`, `UPDATE`, `DELETE`).
  - `GET /api/production/status`: Returns online status, mapped JDBC URL, and captured CDC WAL event counts.
  - `DELETE /api/production`: Stops the Production database.

### B. CDC Traffic Stream Replayer & Exception Detector
- **File**: `src/main/java/com/shadowbase/service/CdcStreamReplayerService.java`
- **Description**: Intercepts production transactions and replays them asynchronously against all active Shadow database containers. Tracks replayed success vs failure counts and logs breaking schema exception tracebacks.
- **REST Controller**: `src/main/java/com/shadowbase/controller/CdcStreamController.java`
- **Endpoints**:
  - `GET /api/cdc/stats`: Returns streaming stats (`totalEventsCaptured`, `totalReplayedSuccess`, `totalReplayedFailures`, `exceptionsCount`).
  - `GET /api/cdc/exceptions`: Returns complete audit logs of breaking schema queries and stack traces.

---

## 3. Key Frontend Components

- **File**: `frontend/src/App.jsx`
- **Description**:
  - **Production CDC Status Card**: Displays online status and live event counts.
  - **Simulate Live Traffic Button**: Triggers `POST /api/production/transaction` to simulate user queries.
  - **Real-Time Metrics Polling**: Uses React `useEffect` to poll `/api/production/status` every 3 seconds.
  - **Console & Data Grid**: Displays live replayed logs and SQL error tracebacks.

---

## 4. Empirical Verification & Audit Results

End-to-end verification of Phase 2 was completed with the following verified execution stats:

### A. Production Traffic Capture
- **Production Transaction**: `INSERT INTO users (name, email) VALUES ('Dave', 'dave@company.com');`
- **Replay Outcome**: Successfully applied to Production DB and replayed on active Shadow DB container.

### B. Breaking Schema Exception Interception
- **Migration Applied to Shadow DB**: `ALTER TABLE users DROP COLUMN email;`
- **Incoming Production Transaction**: `INSERT INTO users (name, email) VALUES ('Eve', 'eve@company.com');`
- **Result Output (`GET /api/cdc/stats`)**:
  ```json
  {
      "exceptionsCount": 1,
      "totalEventsCaptured": 3,
      "totalReplayedSuccess": 4,
      "totalReplayedFailures": 1,
      "autoReplayEnabled": true
  }
  ```
- **Audit Result**: The CDC Replayer successfully caught the schema breakage on the Shadow clone without affecting Production operations.
