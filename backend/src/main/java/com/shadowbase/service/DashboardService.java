package com.shadowbase.service;

import com.shadowbase.dto.DashboardStatsResponse;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class DashboardService {

    private final DatabaseContainerService containerService;
    private final ProductionDatabaseService productionDatabaseService;
    private final CdcStreamReplayerService cdcStreamReplayerService;

    private final AtomicLong totalCreatedContainers = new AtomicLong(0);
    private final AtomicLong totalMigrationsTested = new AtomicLong(0);
    private final AtomicLong successfulMigrations = new AtomicLong(0);
    private final AtomicLong failedMigrations = new AtomicLong(0);
    private final AtomicLong highRiskMigrations = new AtomicLong(0);

    private final List<Map<String, Object>> recentActivities = new CopyOnWriteArrayList<>();

    public DashboardService(DatabaseContainerService containerService,
                            ProductionDatabaseService productionDatabaseService,
                            CdcStreamReplayerService cdcStreamReplayerService) {
        this.containerService = containerService;
        this.productionDatabaseService = productionDatabaseService;
        this.cdcStreamReplayerService = cdcStreamReplayerService;

        recordActivity("SYSTEM", "SUCCESS", "ShadowBase SaaS Engine Initialized");
    }

    public synchronized void recordActivity(String action, String status, String details) {
        Map<String, Object> activity = new LinkedHashMap<>();
        activity.put("id", UUID.randomUUID().toString().substring(0, 8));
        activity.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss")));
        activity.put("action", action);
        activity.put("status", status);
        activity.put("details", details);

        recentActivities.add(0, activity); // Add to top
        if (recentActivities.size() > 20) {
            recentActivities.remove(recentActivities.size() - 1);
        }
    }

    public void incrementCreatedContainers() {
        totalCreatedContainers.incrementAndGet();
        recordActivity("CONTAINER_START", "SUCCESS", "Provisioned isolated PostgreSQL Testcontainer sandbox");
    }

    public void recordMigrationExecution(boolean success, boolean isHighRisk, String summary) {
        totalMigrationsTested.incrementAndGet();
        if (success) {
            successfulMigrations.incrementAndGet();
        } else {
            failedMigrations.incrementAndGet();
        }
        if (isHighRisk) {
            highRiskMigrations.incrementAndGet();
        }

        recordActivity(
                "MIGRATION_EXECUTE",
                success ? "SUCCESS" : "FAILED",
                summary + (isHighRisk ? " [HIGH RISK]" : "")
        );
    }

    public DashboardStatsResponse getDashboardStats() {
        long activeCount = containerService.getActiveContainers().size();
        long totalContainers = Math.max(totalCreatedContainers.get(), activeCount);
        
        Map<String, Object> cdcStats = cdcStreamReplayerService.getCdcStats();
        long cdcEvents = (long) cdcStats.getOrDefault("totalEventsCaptured", 0L);
        boolean prodOnline = "ONLINE".equals(productionDatabaseService.getProductionDetails().get("status"));

        String health = "HEALTHY";
        if (failedMigrations.get() > 0 || (long) cdcStats.getOrDefault("totalReplayedFailures", 0L) > 0) {
            health = "DEGRADED";
        }

        return new DashboardStatsResponse(
                totalContainers,
                activeCount,
                totalMigrationsTested.get(),
                successfulMigrations.get(),
                failedMigrations.get(),
                highRiskMigrations.get(),
                cdcEvents,
                prodOnline,
                health,
                new ArrayList<>(recentActivities)
        );
    }
}
