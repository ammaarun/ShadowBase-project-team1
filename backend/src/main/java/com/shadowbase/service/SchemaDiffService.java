package com.shadowbase.service;

import com.shadowbase.dto.SchemaDiffResponse;
import com.shadowbase.dto.SchemaDiffResponse.ColumnInfo;
import com.shadowbase.dto.SchemaDiffResponse.SchemaDiffItem;
import com.shadowbase.dto.SchemaDiffResponse.TableSchemaSummary;
import org.springframework.stereotype.Service;
import org.testcontainers.containers.PostgreSQLContainer;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SchemaDiffService {

    private final DatabaseContainerService containerService;
    // Map of environmentId -> Baseline Schema Snapshot (Table Name -> Map of Column Name -> DataType)
    private final Map<String, Map<String, Map<String, String>>> baselineSnapshots = new ConcurrentHashMap<>();

    public SchemaDiffService(DatabaseContainerService containerService) {
        this.containerService = containerService;
    }

    /**
     * Inspects active shadow database container and returns full schema hierarchy.
     */
    public List<TableSchemaSummary> inspectCurrentSchema(String environmentId) {
        PostgreSQLContainer<?> postgres = containerService.getActiveContainers().get(environmentId);
        if (postgres == null) {
            return Collections.emptyList();
        }

        Map<String, List<ColumnInfo>> tableColumnsMap = new LinkedHashMap<>();

        String query = """
            SELECT table_name, column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position;
            """;

        try (Connection conn = DriverManager.getConnection(
                postgres.getJdbcUrl(),
                postgres.getUsername(),
                postgres.getPassword());
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(query)) {

            while (rs.next()) {
                String tableName = rs.getString("table_name");
                String columnName = rs.getString("column_name");
                String dataType = rs.getString("data_type");
                boolean isNullable = "YES".equalsIgnoreCase(rs.getString("is_nullable"));

                tableColumnsMap.computeIfAbsent(tableName, k -> new ArrayList<>())
                        .add(new ColumnInfo(columnName, dataType, isNullable));
            }
        } catch (Exception e) {
            System.err.println("Error inspecting schema: " + e.getMessage());
        }

        List<TableSchemaSummary> result = new ArrayList<>();
        for (Map.Entry<String, List<ColumnInfo>> entry : tableColumnsMap.entrySet()) {
            result.add(new TableSchemaSummary(entry.getKey(), entry.getValue()));
        }
        return result;
    }

    /**
     * Saves a baseline snapshot of the container's current schema.
     */
    public void captureBaselineSnapshot(String environmentId) {
        List<TableSchemaSummary> currentSchema = inspectCurrentSchema(environmentId);
        Map<String, Map<String, String>> snapshot = new LinkedHashMap<>();

        for (TableSchemaSummary table : currentSchema) {
            Map<String, String> cols = new LinkedHashMap<>();
            for (ColumnInfo col : table.getColumns()) {
                cols.put(col.getColumnName(), col.getDataType());
            }
            snapshot.put(table.getTableName(), cols);
        }

        baselineSnapshots.put(environmentId, snapshot);
    }

    /**
     * Compares the baseline schema snapshot vs the current database schema to produce a visual diff.
     */
    public SchemaDiffResponse compareSchemaDiff(String environmentId) {
        List<TableSchemaSummary> currentSchemaSummaries = inspectCurrentSchema(environmentId);
        Map<String, Map<String, String>> baseline = baselineSnapshots.get(environmentId);

        // If no baseline captured yet, treat empty or initial baseline as snapshot
        if (baseline == null) {
            captureBaselineSnapshot(environmentId);
            baseline = baselineSnapshots.get(environmentId);
        }

        Map<String, Map<String, String>> currentMap = new LinkedHashMap<>();
        for (TableSchemaSummary table : currentSchemaSummaries) {
            Map<String, String> cols = new LinkedHashMap<>();
            for (ColumnInfo col : table.getColumns()) {
                cols.put(col.getColumnName(), col.getDataType());
            }
            currentMap.put(table.getTableName(), cols);
        }

        List<SchemaDiffItem> diffItems = new ArrayList<>();
        int additions = 0;
        int removals = 0;
        int modifications = 0;

        // 1. Check for Added/Removed/Modified Tables & Columns
        for (String tableName : currentMap.keySet()) {
            if (!baseline.containsKey(tableName)) {
                // Whole new table added
                additions++;
                diffItems.add(new SchemaDiffItem(
                        "ADDED_TABLE",
                        tableName,
                        null,
                        null,
                        "CREATE TABLE " + tableName,
                        "LOW"
                ));
            } else {
                Map<String, String> baseCols = baseline.get(tableName);
                Map<String, String> currCols = currentMap.get(tableName);

                for (Map.Entry<String, String> colEntry : currCols.entrySet()) {
                    String colName = colEntry.getKey();
                    String currType = colEntry.getValue();

                    if (!baseCols.containsKey(colName)) {
                        additions++;
                        diffItems.add(new SchemaDiffItem(
                                "ADDED_COLUMN",
                                tableName,
                                colName,
                                null,
                                colName + " " + currType.toUpperCase(),
                                "LOW"
                        ));
                    } else if (!baseCols.get(colName).equalsIgnoreCase(currType)) {
                        modifications++;
                        diffItems.add(new SchemaDiffItem(
                                "MODIFIED_COLUMN",
                                tableName,
                                colName,
                                colName + " " + baseCols.get(colName).toUpperCase(),
                                colName + " " + currType.toUpperCase(),
                                "MEDIUM"
                        ));
                    }
                }
            }
        }

        // 2. Check for Removed Tables & Columns
        for (String tableName : baseline.keySet()) {
            if (!currentMap.containsKey(tableName)) {
                removals++;
                diffItems.add(new SchemaDiffItem(
                        "REMOVED_TABLE",
                        tableName,
                        null,
                        "DROP TABLE " + tableName,
                        null,
                        "CRITICAL"
                ));
            } else {
                Map<String, String> baseCols = baseline.get(tableName);
                Map<String, String> currCols = currentMap.get(tableName);

                for (String colName : baseCols.keySet()) {
                    if (!currCols.containsKey(colName)) {
                        removals++;
                        diffItems.add(new SchemaDiffItem(
                                "REMOVED_COLUMN",
                                tableName,
                                colName,
                                colName + " " + baseCols.get(colName).toUpperCase(),
                                null,
                                "HIGH"
                        ));
                    }
                }
            }
        }

        boolean hasChanges = !diffItems.isEmpty();

        return new SchemaDiffResponse(
                environmentId,
                hasChanges,
                additions,
                removals,
                modifications,
                diffItems,
                currentSchemaSummaries
        );
    }
}
