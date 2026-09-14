package com.shadowbase.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "migration_history")
public class MigrationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String migrationId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String sqlScript;

    private String migrationType; // DDL, DML, ALTER, DROP, CREATE

    @Column(nullable = false)
    private String status; // SUCCESS, FAILED, BLOCKED, ANALYZED

    private String riskLevel; // LOW, MEDIUM, HIGH, CRITICAL

    private int riskScore; // 0 - 100

    private String affectedTable;

    private long executionTimeMs;

    private LocalDateTime createdTimestamp;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    public MigrationRecord() {}

    public MigrationRecord(String migrationId, String sqlScript, String migrationType,
                           String status, String riskLevel, int riskScore,
                           String affectedTable, long executionTimeMs, String errorMessage) {
        this.migrationId = migrationId;
        this.sqlScript = sqlScript;
        this.migrationType = migrationType;
        this.status = status;
        this.riskLevel = riskLevel;
        this.riskScore = riskScore;
        this.affectedTable = affectedTable;
        this.executionTimeMs = executionTimeMs;
        this.createdTimestamp = LocalDateTime.now();
        this.errorMessage = errorMessage;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMigrationId() { return migrationId; }
    public void setMigrationId(String migrationId) { this.migrationId = migrationId; }

    public String getSqlScript() { return sqlScript; }
    public void setSqlScript(String sqlScript) { this.sqlScript = sqlScript; }

    public String getMigrationType() { return migrationType; }
    public void setMigrationType(String migrationType) { this.migrationType = migrationType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public int getRiskScore() { return riskScore; }
    public void setRiskScore(int riskScore) { this.riskScore = riskScore; }

    public String getAffectedTable() { return affectedTable; }
    public void setAffectedTable(String affectedTable) { this.affectedTable = affectedTable; }

    public long getExecutionTimeMs() { return executionTimeMs; }
    public void setExecutionTimeMs(long executionTimeMs) { this.executionTimeMs = executionTimeMs; }

    public LocalDateTime getCreatedTimestamp() { return createdTimestamp; }
    public void setCreatedTimestamp(LocalDateTime createdTimestamp) { this.createdTimestamp = createdTimestamp; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}
