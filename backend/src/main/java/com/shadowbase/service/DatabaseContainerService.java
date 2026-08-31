package com.shadowbase.service;

import com.shadowbase.dto.ExecuteSqlResponse;
import org.springframework.stereotype.Service;
import org.testcontainers.containers.PostgreSQLContainer;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DatabaseContainerService {

    // A map to keep track of all running shadow databases by a unique ID
    private final Map<String, PostgreSQLContainer<?>> activeContainers = new ConcurrentHashMap<>();

    /**
     * Spins up a new isolated PostgreSQL Docker container on the fly.
     * 
     * @return A map containing connection details to the new database.
     */
    public Map<String, String> startShadowDatabase() {
        String environmentId = UUID.randomUUID().toString();

        PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
                .withDatabaseName("shadow_db")
                .withUsername("shadow_user")
                .withPassword("shadow_pass");

        postgres.start();
        activeContainers.put(environmentId, postgres);

        return Map.of(
                "environmentId", environmentId,
                "jdbcUrl", postgres.getJdbcUrl(),
                "username", postgres.getUsername(),
                "password", postgres.getPassword()
        );
    }

    public Map<String, PostgreSQLContainer<?>> getActiveContainers() {
        return Collections.unmodifiableMap(activeContainers);
    }

    /**
     * Executes DDL/DML and SELECT queries against the specific running shadow container.
     */
    public ExecuteSqlResponse executeSql(String environmentId, String sql) {
        PostgreSQLContainer<?> postgres = activeContainers.get(environmentId);
        if (postgres == null) {
            return new ExecuteSqlResponse(false, "Failed to execute SQL", "Environment not found: " + environmentId, 0, null, null);
        }

        try (Connection conn = DriverManager.getConnection(
                postgres.getJdbcUrl(),
                postgres.getUsername(),
                postgres.getPassword());
             Statement stmt = conn.createStatement()) {

            boolean hasResultSet = stmt.execute(sql);

            if (hasResultSet) {
                try (ResultSet rs = stmt.getResultSet()) {
                    ResultSetMetaData md = rs.getMetaData();
                    int columnCount = md.getColumnCount();
                    List<String> columns = new ArrayList<>();
                    for (int i = 1; i <= columnCount; i++) {
                        columns.add(md.getColumnName(i));
                    }

                    List<Map<String, Object>> data = new ArrayList<>();
                    while (rs.next()) {
                        Map<String, Object> row = new LinkedHashMap<>();
                        for (int i = 1; i <= columnCount; i++) {
                            Object val = rs.getObject(i);
                            row.put(md.getColumnName(i), val != null ? val.toString() : "null");
                        }
                        data.add(row);
                    }

                    return new ExecuteSqlResponse(
                            true,
                            "Query executed successfully. Returned " + data.size() + " row(s).",
                            null,
                            data.size(),
                            columns,
                            data
                    );
                }
            } else {
                int updateCount = stmt.getUpdateCount();
                return new ExecuteSqlResponse(
                        true,
                        "SQL statement executed successfully.",
                        null,
                        updateCount >= 0 ? updateCount : 0,
                        null,
                        null
                );
            }

        } catch (Exception e) {
            return new ExecuteSqlResponse(
                    false,
                    "SQL Execution Exception: " + e.getMessage(),
                    e.toString(),
                    0,
                    null,
                    null
            );
        }
    }

    /**
     * Seeds the shadow database container with a mock production schema and sample records.
     */
    public ExecuteSqlResponse seedShadowDatabase(String environmentId) {
        String seedSql = """
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id),
                amount DECIMAL(10,2) NOT NULL,
                status VARCHAR(20) DEFAULT 'PENDING'
            );

            INSERT INTO users (name, email) VALUES 
                ('Alice Johnson', 'alice@example.com'),
                ('Bob Smith', 'bob@example.com')
            ON CONFLICT DO NOTHING;
            """;

        return executeSql(environmentId, seedSql);
    }

    /**
     * Stops and removes a running shadow database container.
     */
    public boolean destroyShadowDatabase(String environmentId) {
        PostgreSQLContainer<?> postgres = activeContainers.remove(environmentId);
        if (postgres != null) {
            postgres.stop();
            return true;
        }
        return false;
    }
}
