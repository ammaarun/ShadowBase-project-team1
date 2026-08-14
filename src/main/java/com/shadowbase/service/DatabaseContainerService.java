package com.shadowbase.service;

import org.springframework.stereotype.Service;
import org.testcontainers.containers.PostgreSQLContainer;

import java.util.Map;
import java.util.UUID;
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
        // Generate a unique ID for this database environment
        String environmentId = UUID.randomUUID().toString();

        // Initialize a new PostgreSQL container using the official Docker image
        PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
                .withDatabaseName("shadow_db")
                .withUsername("shadow_user")
                .withPassword("shadow_pass");

        // Start the container (this communicates with the local Docker daemon)
        postgres.start();

        // Store the reference so we can stop it later
        activeContainers.put(environmentId, postgres);

        // Return the connection details so the frontend (or other services) can connect to it
        return Map.of(
                "environmentId", environmentId,
                "jdbcUrl", postgres.getJdbcUrl(),
                "username", postgres.getUsername(),
                "password", postgres.getPassword()
        );
    }

    /**
     * Stops and removes a running shadow database.
     * 
     * @param environmentId The ID of the environment to destroy.
     * @return true if stopped successfully, false if not found.
     */
    public boolean destroyShadowDatabase(String environmentId) {
        PostgreSQLContainer<?> postgres = activeContainers.remove(environmentId);
        if (postgres != null) {
            postgres.stop(); // Stops and removes the Docker container
            return true;
        }
        return false;
    }
}
