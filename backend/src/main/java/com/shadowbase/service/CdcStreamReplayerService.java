package com.shadowbase.service;

import com.shadowbase.dto.ExecuteSqlResponse;
import org.springframework.stereotype.Service;
import org.testcontainers.containers.PostgreSQLContainer;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class CdcStreamReplayerService {

    private final DatabaseContainerService shadowContainerService;
    private boolean autoReplayEnabled = true;

    private final AtomicLong totalEventsCaptured = new AtomicLong(0);
    private final AtomicLong totalReplayedSuccess = new AtomicLong(0);
    private final AtomicLong totalReplayedFailures = new AtomicLong(0);

    private final List<Map<String, Object>> shadowExceptionsLog = Collections.synchronizedList(new ArrayList<>());

    public CdcStreamReplayerService(DatabaseContainerService shadowContainerService) {
        this.shadowContainerService = shadowContainerService;
    }

    /**
     * Intercepts a production CDC WAL event and replays it against all active Shadow sandbox containers.
     */
    public List<ExecuteSqlResponse> shadowTransaction(String sql) {
        totalEventsCaptured.incrementAndGet();
        List<ExecuteSqlResponse> replayResults = new ArrayList<>();

        if (!autoReplayEnabled) {
            return replayResults;
        }

        // Replay against all active shadow containers
        Map<String, PostgreSQLContainer<?>> activeEnvs = shadowContainerService.getActiveContainers();
        for (String envId : activeEnvs.keySet()) {
            ExecuteSqlResponse result = shadowContainerService.executeSql(envId, sql);
            
            if (result.isSuccess()) {
                totalReplayedSuccess.incrementAndGet();
            } else {
                totalReplayedFailures.incrementAndGet();
                shadowExceptionsLog.add(Map.of(
                        "timestamp", new Date().toString(),
                        "environmentId", envId,
                        "sql", sql,
                        "error", result.getMessage(),
                        "details", result.getErrorDetails() != null ? result.getErrorDetails() : ""
                ));
            }
            replayResults.add(result);
        }

        return replayResults;
    }

    public Map<String, Object> getCdcStats() {
        return Map.of(
                "autoReplayEnabled", autoReplayEnabled,
                "totalEventsCaptured", totalEventsCaptured.get(),
                "totalReplayedSuccess", totalReplayedSuccess.get(),
                "totalReplayedFailures", totalReplayedFailures.get(),
                "exceptionsCount", shadowExceptionsLog.size()
        );
    }

    public List<Map<String, Object>> getShadowExceptionsLog() {
        synchronized (shadowExceptionsLog) {
            return new ArrayList<>(shadowExceptionsLog);
        }
    }

    public void setAutoReplayEnabled(boolean enabled) {
        this.autoReplayEnabled = enabled;
    }
}
