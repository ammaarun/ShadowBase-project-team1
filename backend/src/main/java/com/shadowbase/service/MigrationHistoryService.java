package com.shadowbase.service;

import com.shadowbase.dto.MigrationRecordDto;
import com.shadowbase.entity.MigrationRecord;
import com.shadowbase.repository.MigrationRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MigrationHistoryService {

    private final MigrationRecordRepository repository;

    public MigrationHistoryService(MigrationRecordRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public MigrationRecordDto saveRecord(String sqlScript, String status, String riskLevel,
                                        int riskScore, String affectedTable,
                                        long executionTimeMs, String errorMessage) {
        String migrationId = "MIG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        String upperSql = sqlScript != null ? sqlScript.toUpperCase() : "";
        String type = "DDL";
        if (upperSql.startsWith("SELECT") || upperSql.startsWith("INSERT") || upperSql.startsWith("UPDATE")) {
            type = "DML";
        } else if (upperSql.contains("DROP")) {
            type = "DROP";
        } else if (upperSql.contains("ALTER")) {
            type = "ALTER";
        } else if (upperSql.contains("CREATE")) {
            type = "CREATE";
        }

        MigrationRecord record = new MigrationRecord(
                migrationId,
                sqlScript,
                type,
                status,
                riskLevel,
                riskScore,
                affectedTable != null ? affectedTable : "unknown",
                executionTimeMs,
                errorMessage
        );

        MigrationRecord saved = repository.save(record);
        return new MigrationRecordDto(saved);
    }

    public List<MigrationRecordDto> getAllHistory(String status, String riskLevel, String search) {
        List<MigrationRecord> records;

        if (search != null && !search.trim().isEmpty()) {
            records = repository.findBySqlScriptContainingIgnoreCaseOrAffectedTableContainingIgnoreCaseOrderByCreatedTimestampDesc(search, search);
        } else if (status != null && !"ALL".equalsIgnoreCase(status)) {
            records = repository.findByStatusOrderByCreatedTimestampDesc(status.toUpperCase());
        } else if (riskLevel != null && !"ALL".equalsIgnoreCase(riskLevel)) {
            records = repository.findByRiskLevelOrderByCreatedTimestampDesc(riskLevel.toUpperCase());
        } else {
            records = repository.findAllByOrderByCreatedTimestampDesc();
        }

        return records.stream().map(MigrationRecordDto::new).collect(Collectors.toList());
    }

    public MigrationRecordDto getRecordById(Long id) {
        return repository.findById(id)
                .map(MigrationRecordDto::new)
                .orElse(null);
    }

    @Transactional
    public void clearHistory() {
        repository.deleteAll();
    }
}
