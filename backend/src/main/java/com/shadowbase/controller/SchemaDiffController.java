package com.shadowbase.controller;

import com.shadowbase.dto.SchemaDiffResponse;
import com.shadowbase.dto.SchemaDiffResponse.TableSchemaSummary;
import com.shadowbase.service.SchemaDiffService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schema")
@CrossOrigin(origins = "*")
public class SchemaDiffController {

    private final SchemaDiffService schemaDiffService;

    public SchemaDiffController(SchemaDiffService schemaDiffService) {
        this.schemaDiffService = schemaDiffService;
    }

    /**
     * GET /api/schema/inspect/{environmentId}
     * Inspects active container database schema and returns all tables and columns.
     */
    @GetMapping("/inspect/{environmentId}")
    public ResponseEntity<List<TableSchemaSummary>> inspectSchema(@PathVariable String environmentId) {
        return ResponseEntity.ok(schemaDiffService.inspectCurrentSchema(environmentId));
    }

    /**
     * POST /api/schema/snapshot/{environmentId}
     * Captures a baseline schema snapshot for visual diff comparisons.
     */
    @PostMapping("/snapshot/{environmentId}")
    public ResponseEntity<String> captureSnapshot(@PathVariable String environmentId) {
        schemaDiffService.captureBaselineSnapshot(environmentId);
        return ResponseEntity.ok("Baseline schema snapshot captured for environment " + environmentId);
    }

    /**
     * GET /api/schema/diff/{environmentId}
     * Returns visual DDL schema diff comparing baseline snapshot vs current DB schema.
     */
    @GetMapping("/diff/{environmentId}")
    public ResponseEntity<SchemaDiffResponse> getSchemaDiff(@PathVariable String environmentId) {
        return ResponseEntity.ok(schemaDiffService.compareSchemaDiff(environmentId));
    }
}
