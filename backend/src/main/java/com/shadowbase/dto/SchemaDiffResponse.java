package com.shadowbase.dto;

import java.util.List;

public class SchemaDiffResponse {
    private String environmentId;
    private boolean hasChanges;
    private int totalAdditions;
    private int totalRemovals;
    private int totalModifications;
    private List<SchemaDiffItem> diffItems;
    private List<TableSchemaSummary> currentSchema;

    public SchemaDiffResponse() {}

    public SchemaDiffResponse(String environmentId, boolean hasChanges, int totalAdditions,
                              int totalRemovals, int totalModifications,
                              List<SchemaDiffItem> diffItems, List<TableSchemaSummary> currentSchema) {
        this.environmentId = environmentId;
        this.hasChanges = hasChanges;
        this.totalAdditions = totalAdditions;
        this.totalRemovals = totalRemovals;
        this.totalModifications = totalModifications;
        this.diffItems = diffItems;
        this.currentSchema = currentSchema;
    }

    public String getEnvironmentId() { return environmentId; }
    public boolean isHasChanges() { return hasChanges; }
    public int getTotalAdditions() { return totalAdditions; }
    public int getTotalRemovals() { return totalRemovals; }
    public int getTotalModifications() { return totalModifications; }
    public List<SchemaDiffItem> getDiffItems() { return diffItems; }
    public List<TableSchemaSummary> getCurrentSchema() { return currentSchema; }

    public static class SchemaDiffItem {
        private String changeType; // ADDED_COLUMN, REMOVED_COLUMN, MODIFIED_COLUMN, ADDED_TABLE, REMOVED_TABLE
        private String tableName;
        private String columnName;
        private String oldDefinition;
        private String newDefinition;
        private String riskImpact; // LOW, MEDIUM, HIGH, CRITICAL

        public SchemaDiffItem() {}

        public SchemaDiffItem(String changeType, String tableName, String columnName,
                              String oldDefinition, String newDefinition, String riskImpact) {
            this.changeType = changeType;
            this.tableName = tableName;
            this.columnName = columnName;
            this.oldDefinition = oldDefinition;
            this.newDefinition = newDefinition;
            this.riskImpact = riskImpact;
        }

        public String getChangeType() { return changeType; }
        public String getTableName() { return tableName; }
        public String getColumnName() { return columnName; }
        public String getOldDefinition() { return oldDefinition; }
        public String getNewDefinition() { return newDefinition; }
        public String getRiskImpact() { return riskImpact; }
    }

    public static class ColumnInfo {
        private String columnName;
        private String dataType;
        private boolean nullable;

        public ColumnInfo() {}

        public ColumnInfo(String columnName, String dataType, boolean nullable) {
            this.columnName = columnName;
            this.dataType = dataType;
            this.nullable = nullable;
        }

        public String getColumnName() { return columnName; }
        public String getDataType() { return dataType; }
        public boolean isNullable() { return nullable; }
    }

    public static class TableSchemaSummary {
        private String tableName;
        private List<ColumnInfo> columns;

        public TableSchemaSummary() {}

        public TableSchemaSummary(String tableName, List<ColumnInfo> columns) {
            this.tableName = tableName;
            this.columns = columns;
        }

        public String getTableName() { return tableName; }
        public List<ColumnInfo> getColumns() { return columns; }
    }
}
