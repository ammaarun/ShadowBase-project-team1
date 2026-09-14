package com.shadowbase.repository;

import com.shadowbase.entity.MigrationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MigrationRecordRepository extends JpaRepository<MigrationRecord, Long> {

    List<MigrationRecord> findAllByOrderByCreatedTimestampDesc();

    List<MigrationRecord> findByStatusOrderByCreatedTimestampDesc(String status);

    List<MigrationRecord> findByRiskLevelOrderByCreatedTimestampDesc(String riskLevel);

    List<MigrationRecord> findBySqlScriptContainingIgnoreCaseOrAffectedTableContainingIgnoreCaseOrderByCreatedTimestampDesc(String sqlQuery, String tableQuery);
}
