package com.shadowbase.service;

import com.shadowbase.dto.ExecuteSqlResponse;
import org.springframework.stereotype.Service;
import org.testcontainers.containers.PostgreSQLContainer;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class ProductionDatabaseService {

    private PostgreSQLContainer<?> productionContainer;
    private final AtomicLong cdcEventCounter = new AtomicLong(0);

    /**
     * Starts the Mock Production Database with PostgreSQL Write-Ahead Logging (wal_level=logical) enabled.
     */
    public synchronized Map<String, String> startProductionDatabase() {
        if (productionContainer != null && productionContainer.isRunning()) {
            return getProductionDetails();
        }

        // Configure PostgreSQL container specifically for Change Data Capture (Debezium WAL logical replication)
        productionContainer = new PostgreSQLContainer<>("postgres:15-alpine")
                .withDatabaseName("prod_db")
                .withUsername("prod_user")
                .withPassword("prod_pass")
                .withCommand("postgres", "-c", "wal_level=logical");

        productionContainer.start();
        cdcEventCounter.set(0);

        // Seed initial production schema
        seedProductionSchema();

        return getProductionDetails();
    }

    public Map<String, String> getProductionDetails() {
        if (productionContainer == null || !productionContainer.isRunning()) {
            return Map.of("status", "OFFLINE");
        }
        return Map.of(
                "status", "ONLINE",
                "jdbcUrl", productionContainer.getJdbcUrl(),
                "username", productionContainer.getUsername(),
                "password", productionContainer.getPassword(),
                "walLevel", "logical",
                "cdcEventsCaptured", String.valueOf(cdcEventCounter.get())
        );
    }

    public ExecuteSqlResponse executeProductionTransaction(String sql) {
        if (productionContainer == null || !productionContainer.isRunning()) {
            return new ExecuteSqlResponse(false, "Production DB is offline", "Start Production DB first", 0, null, null);
        }

        try (Connection conn = DriverManager.getConnection(
                productionContainer.getJdbcUrl(),
                productionContainer.getUsername(),
                productionContainer.getPassword());
             Statement stmt = conn.createStatement()) {

            boolean isResultSet = stmt.execute(sql);
            int updateCount = stmt.getUpdateCount();

            // Increment CDC event counter
            cdcEventCounter.incrementAndGet();

            return new ExecuteSqlResponse(
                    true,
                    "Transaction applied to Production DB (CDC WAL event captured).",
                    null,
                    updateCount >= 0 ? updateCount : 1,
                    null,
                    null
            );
        } catch (Exception e) {
            return new ExecuteSqlResponse(false, "Production Transaction Failed: " + e.getMessage(), e.toString(), 0, null, null);
        }
    }

    private void seedProductionSchema() {
        String initSql = """
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL
            );
            INSERT INTO users (name, email) VALUES ('Prod User 1', 'prod1@company.com') ON CONFLICT DO NOTHING;
            """;
        executeProductionTransaction(initSql);
    }

    public synchronized boolean stopProductionDatabase() {
        if (productionContainer != null && productionContainer.isRunning()) {
            productionContainer.stop();
            productionContainer = null;
            return true;
        }
        return false;
    }

    public long getCdcEventCount() {
        return cdcEventCounter.get();
    }
}
