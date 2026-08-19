package com.shadowbase.controller;

import com.shadowbase.service.CdcStreamReplayerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cdc")
@CrossOrigin(origins = "*")
public class CdcStreamController {

    private final CdcStreamReplayerService replayerService;

    public CdcStreamController(CdcStreamReplayerService replayerService) {
        this.replayerService = replayerService;
    }

    /**
     * Endpoint to fetch CDC streaming metrics (replayed success vs failure counts).
     * GET http://localhost:8081/api/cdc/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(replayerService.getCdcStats());
    }

    /**
     * Endpoint to fetch shadow traffic exception logs generated when production CDC traffic breaks on the new schema.
     * GET http://localhost:8081/api/cdc/exceptions
     */
    @GetMapping("/exceptions")
    public ResponseEntity<List<Map<String, Object>>> getExceptions() {
        return ResponseEntity.ok(replayerService.getShadowExceptionsLog());
    }
}
