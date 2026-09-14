package com.shadowbase.dto;

import com.shadowbase.entity.MigrationRecord;
import java.time.format.DateTimeFormatter;

public class MigrationRecordDto {
    private Long id;
    private String migrationId;
    private String sqlScript;
    private String migrationType;
    private String status;
    private String riskLevel;
    private int riskScore;
    private String affectedTable;
    private long executionTimeMs;
    private String createdTimestamp;
    private String errorMessage;

    public MigrationRecordDto() {}

    public MigrationRecordDto(MigrationRecord entity) {
        this.id = entity.getId();
        this.migrationId = entity.getMigrationId();
        this.sqlScript = entity.getSqlScript();
        this.migrationType = entity.getMigrationType();
        this.status = entity.getStatus();
        this.riskLevel = entity.getRiskLevel();
        this.riskScore = entity.getRiskScore();
        this.affectedTable = entity.getAffectedTable();
        this.executionTimeMs = entity.getExecutionTimeMs();
        this.createdTimestamp = entity.getCreatedTimestamp() != null
                ? entity.getCreatedTimestamp().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                : "";
        this.errorMessage = entity.getErrorMessage();
    }

    public Long getId() { return id; }
    public String getMigrationId() { return migrationId; }
    public String getSqlScript() { return sqlScript; }
    public String getMigrationType() { return migrationType; }
    public String getStatus() { return status; }
    public String getRiskLevel() { return riskLevel; }
    public int getRiskScore() { return riskScore; }
    public String getAffectedTable() { return affectedTable; }
    public long getExecutionTimeMs() { return executionTimeMs; }
    public String getCreatedTimestamp() { return createdTimestamp; }
    public String getErrorMessage() { return errorMessage; }
}
