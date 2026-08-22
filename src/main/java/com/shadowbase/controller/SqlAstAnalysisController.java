package com.shadowbase.controller;

import com.shadowbase.dto.AstAnalysisResponse;
import com.shadowbase.dto.ExecuteSqlRequest;
import com.shadowbase.service.SqlAstAnalysisService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ast")
@CrossOrigin(origins = "*")
public class SqlAstAnalysisController {

    private final SqlAstAnalysisService astService;

    public SqlAstAnalysisController(SqlAstAnalysisService astService) {
        this.astService = astService;
    }

    /**
     * Pre-flight AST static analysis endpoint for DDL migration scripts.
     * POST http://localhost:8081/api/ast/analyze
     */
    @PostMapping("/analyze")
    public ResponseEntity<AstAnalysisResponse> analyzeScript(@RequestBody ExecuteSqlRequest request) {
        return ResponseEntity.ok(astService.analyzeScript(request.getSql()));
    }
}
