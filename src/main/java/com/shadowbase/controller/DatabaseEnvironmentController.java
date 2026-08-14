package com.shadowbase.controller;

import com.shadowbase.service.DatabaseContainerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/environments")
@CrossOrigin(origins = "*") // Allows our future React frontend to call this API without CORS errors
public class DatabaseEnvironmentController {

    private final DatabaseContainerService containerService;

    // Constructor Injection: Spring Boot automatically provides the DatabaseContainerService
    public DatabaseEnvironmentController(DatabaseContainerService containerService) {
        this.containerService = containerService;
    }

    /**
     * Endpoint to spin up a new shadow database.
     * POST http://localhost:8080/api/environments/start
     */
    @PostMapping("/start")
    public ResponseEntity<Map<String, String>> startEnvironment() {
        Map<String, String> connectionDetails = containerService.startShadowDatabase();
        return ResponseEntity.ok(connectionDetails);
    }

    /**
     * Endpoint to destroy an existing shadow database.
     * DELETE http://localhost:8080/api/environments/{environmentId}
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
