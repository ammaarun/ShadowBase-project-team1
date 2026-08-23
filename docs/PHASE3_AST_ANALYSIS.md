# ShadowBase Phase 3 Documentation: Pre-flight AST Analysis & Developer DX Polish

## 1. Overview & Objectives
Phase 3 of **ShadowBase** implements the **Abstract Syntax Tree (AST) Pre-Flight Static Analysis Engine** and completes the Developer Experience (DX) workflow.

Before a candidate migration script is executed against any database clone, ShadowBase performs static code analysis on the Abstract Syntax Tree (AST) using **JSqlParser**. It inspects statement nodes for high-risk breaking operations—such as `DROP COLUMN` or `DROP TABLE`—giving developers real-time visual warnings directly inside their code editor before executing any database changes.

```
┌────────────────────────┐         Post JSON SQL         ┌────────────────────────────────┐
│ React Monaco SQL IDE   ├───────────────────────────────►│  SqlAstAnalysisController      │
│  (Real-Time onChange)  │                                │  (POST /api/ast/analyze)       │
└───────────▲────────────┘                                └──────────────┬─────────────────┘
            │                                                            │
            │ Renders AST Risk Banner                                    │ AST Parsing
            │ (Red HIGH / Yellow MED / Green LOW)                        ▼
┌───────────┴────────────┐                                ┌────────────────────────────────┐
│   AST Alert Banner     │◄───────────────────────────────┤   SqlAstAnalysisService        │
│   & .sql Script Export │       AstAnalysisResponse      │  (JSqlParser 4.9 AST Nodes)    │
└────────────────────────┘                                └────────────────────────────────┘
```

---

## 2. Key Backend Components

### A. JSqlParser AST Static Analysis Engine
- **File**: `src/main/java/com/shadowbase/service/SqlAstAnalysisService.java`
- **Description**: Parses raw DDL migration scripts into typed AST statement nodes using `CCJSqlParserUtil.parseStatements(sql)`. Inspects statement types:
  - `Alter`: Checks `AlterExpression` for `DROP` column operations or column data type modifications.
  - `Drop`: Detects destructive table drop operations (`DROP TABLE`).
- **Data Transfer Object**: `src/main/java/com/shadowbase/dto/AstAnalysisResponse.java`
  - `hasRisk`: `boolean` flag indicating risk presence.
  - `riskLevel`: `"HIGH"`, `"MEDIUM"`, `"LOW"`.
  - `warnings`: Detailed list of AST risk warnings.
  - `statementsParsed`: Count of parsed statements.
- **REST Controller**: `src/main/java/com/shadowbase/controller/SqlAstAnalysisController.java`
- **Endpoint**:
  - `POST /api/ast/analyze`: Pre-flight endpoint returning AST risk analysis before execution.

---

## 3. Key Frontend Components

- **File**: `frontend/src/App.jsx`
- **Description**:
  - **Real-Time `onChange` AST Hook**: Triggered as the developer types inside Microsoft Monaco Editor, invoking `/api/ast/analyze`.
  - **Pre-flight AST Risk Banner**: Color-coded alert component rendered above the editor:
    - 🔴 **HIGH RISK BANNER** (Red): Rendered when destructive `DROP` operations are detected.
    - 🟡 **MEDIUM RISK BANNER** (Yellow): Rendered when data types are modified.
    - 🟢 **LOW RISK BANNER** (Green): Rendered when clean migration DDL passes AST analysis.
  - **Script Export Feature (`exportMigrationScript()`)**: Generates a downloadable `.sql` Blob file locally.

---

## 4. Empirical Verification & Test Results

### Case A: Clean DDL Migration
- **Script**: `ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);`
- **AST Result (`POST /api/ast/analyze`)**:
  ```json
  {
      "hasRisk": false,
      "riskLevel": "LOW",
      "warnings": [
          "✅ AST Analysis Passed: Clean migration script. No destructive operations detected."
      ],
      "statementsParsed": 1
  }
  ```

### Case B: High-Risk Destructive DDL Migration
- **Script**: `ALTER TABLE users DROP COLUMN email;`
- **AST Result (`POST /api/ast/analyze`)**:
  ```json
  {
      "hasRisk": true,
      "riskLevel": "HIGH",
      "warnings": [
          "⚠️ HIGH RISK AST WARNING: Migration drops column/constraint from table 'users'. Production traffic querying this column will throw exceptions!"
      ],
      "statementsParsed": 1
  }
  ```
