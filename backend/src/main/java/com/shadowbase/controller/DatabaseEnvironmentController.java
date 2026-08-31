package com.shadowbase.controller;

import com.shadowbase.dto.ExecuteSqlRequest;
import com.shadowbase.dto.ExecuteSqlResponse;
import com.shadowbase.service.DatabaseContainerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/environments")
@CrossOrigin(origins = "*") // Allows our React frontend to call these APIs without CORS errors
public class DatabaseEnvironmentController {

    private final DatabaseContainerService containerService;

    // Constructor Injection: Spring Boot automatically provides the DatabaseContainerService
    public DatabaseEnvironmentController(DatabaseContainerService containerService) {
        this.containerService = containerService;
    }

    /**
     * Endpoint to spin up a new shadow database.
     * POST http://localhost:8081/api/environments/start
     */
    @PostMapping("/start")
    public ResponseEntity<Map<String, String>> startEnvironment() {
        Map<String, String> connectionDetails = containerService.startShadowDatabase();
        return ResponseEntity.ok(connectionDetails);
    }

    /**
     * Endpoint to execute migration SQL scripts against an active shadow database container.
     * POST http://localhost:8081/api/environments/{environmentId}/execute
     */
    @PostMapping("/{environmentId}/execute")
    public ResponseEntity<ExecuteSqlResponse> executeSql(
            @PathVariable String environmentId,
            @RequestBody ExecuteSqlRequest request) {
        ExecuteSqlResponse response = containerService.executeSql(environmentId, request.getSql());
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint to seed mock production schema and sample data into the container.
     * POST http://localhost:8081/api/environments/{environmentId}/seed
     */
    @PostMapping("/{environmentId}/seed")
    public ResponseEntity<ExecuteSqlResponse> seedEnvironment(@PathVariable String environmentId) {
        ExecuteSqlResponse response = containerService.seedShadowDatabase(environmentId);
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint to destroy an existing shadow database.
     * DELETE http://localhost:8081/api/environments/{environmentId}
     */
    @DeleteMapping("/{environmentId}")
    public ResponseEntity<String> stopEnvironment(@PathVariable String environmentId) {
        boolean destroyed = containerService.destroyShadowDatabase(environmentId);
        
        if (destroyed) {
            return ResponseEntity.ok("Environment " + environmentId + " successfully destroyed.");
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
