package com.shadowbase.controller;

import com.shadowbase.dto.ExecuteSqlRequest;
import com.shadowbase.dto.ExecuteSqlResponse;
import com.shadowbase.service.ProductionDatabaseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/production")
@CrossOrigin(origins = "*")
public class ProductionDatabaseController {

    private final ProductionDatabaseService productionService;

    public ProductionDatabaseController(ProductionDatabaseService productionService) {
        this.productionService = productionService;
    }

    /**
     * Endpoint to spin up the Mock Production Database with WAL logical replication enabled.
     * POST http://localhost:8081/api/production/start
     */
    @PostMapping("/start")
    public ResponseEntity<Map<String, String>> startProduction() {
        return ResponseEntity.ok(productionService.startProductionDatabase());
    }

    /**
     * Endpoint to get Production DB status and CDC event counter metrics.
     * GET http://localhost:8081/api/production/status
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, String>> getStatus() {
        return ResponseEntity.ok(productionService.getProductionDetails());
    }

    /**
     * Endpoint to simulate live production SQL transactions (INSERT/UPDATE/DELETE).
     * POST http://localhost:8081/api/production/transaction
     */
    @PostMapping("/transaction")
    public ResponseEntity<ExecuteSqlResponse> executeTransaction(@RequestBody ExecuteSqlRequest request) {
        return ResponseEntity.ok(productionService.executeProductionTransaction(request.getSql()));
    }

    /**
     * Endpoint to stop Production DB.
     * DELETE http://localhost:8081/api/production
     */
    @DeleteMapping
    public ResponseEntity<String> stopProduction() {
        boolean stopped = productionService.stopProductionDatabase();
        if (stopped) {
            return ResponseEntity.ok("Production DB stopped.");
        }
        return ResponseEntity.notFound().build();
    }
}
