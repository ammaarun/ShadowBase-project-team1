package com.shadowbase.controller;

import com.shadowbase.dto.MigrationRecordDto;
import com.shadowbase.service.MigrationHistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/migrations/history")
@CrossOrigin(origins = "*")
public class MigrationHistoryController {

    private final MigrationHistoryService historyService;

    public MigrationHistoryController(MigrationHistoryService historyService) {
        this.historyService = historyService;
    }

    /**
     * GET /api/migrations/history
     * Query params: status (optional), riskLevel (optional), search (optional)
     */
    @GetMapping
    public ResponseEntity<List<MigrationRecordDto>> getHistory(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String riskLevel,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(historyService.getAllHistory(status, riskLevel, search));
    }

    /**
     * GET /api/migrations/history/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<MigrationRecordDto> getRecordById(@PathVariable Long id) {
        MigrationRecordDto record = historyService.getRecordById(id);
        if (record == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(record);
    }

    /**
     * DELETE /api/migrations/history
     */
    @DeleteMapping
    public ResponseEntity<String> clearHistory() {
        historyService.clearHistory();
        return ResponseEntity.ok("Migration history cleared.");
    }
}
