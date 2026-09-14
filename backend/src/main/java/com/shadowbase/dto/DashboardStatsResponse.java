package com.shadowbase.dto;

import java.util.List;
import java.util.Map;

public class DashboardStatsResponse {
    private long totalShadowDatabases;
    private long activeShadowDatabases;
    private long totalMigrationsTested;
    private long successfulMigrations;
    private long failedMigrations;
    private long highRiskMigrations;
    private long cdcEventsCaptured;
    private boolean productionDbOnline;
    private String systemHealth; // HEALTHY, DEGRADED, OFFLINE
    private List<Map<String, Object>> recentActivities;

    public DashboardStatsResponse() {}

    public DashboardStatsResponse(long totalShadowDatabases, long activeShadowDatabases,
                                  long totalMigrationsTested, long successfulMigrations,
                                  long failedMigrations, long highRiskMigrations,
                                  long cdcEventsCaptured, boolean productionDbOnline,
                                  String systemHealth, List<Map<String, Object>> recentActivities) {
        this.totalShadowDatabases = totalShadowDatabases;
        this.activeShadowDatabases = activeShadowDatabases;
        this.totalMigrationsTested = totalMigrationsTested;
        this.successfulMigrations = successfulMigrations;
        this.failedMigrations = failedMigrations;
        this.highRiskMigrations = highRiskMigrations;
        this.cdcEventsCaptured = cdcEventsCaptured;
        this.productionDbOnline = productionDbOnline;
        this.systemHealth = systemHealth;
        this.recentActivities = recentActivities;
    }

    public long getTotalShadowDatabases() { return totalShadowDatabases; }
    public void setTotalShadowDatabases(long totalShadowDatabases) { this.totalShadowDatabases = totalShadowDatabases; }

    public long getActiveShadowDatabases() { return activeShadowDatabases; }
    public void setActiveShadowDatabases(long activeShadowDatabases) { this.activeShadowDatabases = activeShadowDatabases; }

    public long getTotalMigrationsTested() { return totalMigrationsTested; }
    public void setTotalMigrationsTested(long totalMigrationsTested) { this.totalMigrationsTested = totalMigrationsTested; }

    public long getSuccessfulMigrations() { return successfulMigrations; }
    public void setSuccessfulMigrations(long successfulMigrations) { this.successfulMigrations = successfulMigrations; }

    public long getFailedMigrations() { return failedMigrations; }
    public void setFailedMigrations(long failedMigrations) { this.failedMigrations = failedMigrations; }

    public long getHighRiskMigrations() { return highRiskMigrations; }
    public void setHighRiskMigrations(long highRiskMigrations) { this.highRiskMigrations = highRiskMigrations; }

    public long getCdcEventsCaptured() { return cdcEventsCaptured; }
    public void setCdcEventsCaptured(long cdcEventsCaptured) { this.cdcEventsCaptured = cdcEventsCaptured; }

    public boolean isProductionDbOnline() { return productionDbOnline; }
    public void setProductionDbOnline(boolean productionDbOnline) { this.productionDbOnline = productionDbOnline; }

    public String getSystemHealth() { return systemHealth; }
    public void setSystemHealth(String systemHealth) { this.systemHealth = systemHealth; }

    public List<Map<String, Object>> getRecentActivities() { return recentActivities; }
    public void setRecentActivities(List<Map<String, Object>> recentActivities) { this.recentActivities = recentActivities; }
}
