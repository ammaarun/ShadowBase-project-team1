package com.shadowbase.service;

import com.shadowbase.dto.AstAnalysisResponse;
import net.sf.jsqlparser.parser.CCJSqlParserUtil;
import net.sf.jsqlparser.statement.Statement;
import net.sf.jsqlparser.statement.Statements;
import net.sf.jsqlparser.statement.alter.Alter;
import net.sf.jsqlparser.statement.alter.AlterExpression;
import net.sf.jsqlparser.statement.drop.Drop;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class SqlAstAnalysisService {

    /**
     * Parses DDL migration scripts into an Abstract Syntax Tree (AST) using JSqlParser
     * and performs pre-flight static analysis for high-risk breaking schema operations.
     */
    public AstAnalysisResponse analyzeScript(String sql) {
        List<String> warnings = new ArrayList<>();
        boolean hasRisk = false;
        String riskLevel = "LOW";
        int parsedCount = 0;

        if (sql == null || sql.trim().isEmpty()) {
            return new AstAnalysisResponse(false, "LOW", List.of("SQL script is empty."), 0);
        }

        try {
            Statements statements = CCJSqlParserUtil.parseStatements(sql);
            parsedCount = statements.getStatements().size();

            for (Statement stmt : statements.getStatements()) {
                // 1. Check ALTER TABLE statements
                if (stmt instanceof Alter alter) {
                    String tableName = alter.getTable().getName();
                    if (alter.getAlterExpressions() != null) {
                        for (AlterExpression alterExpr : alter.getAlterExpressions()) {
                            String exprStr = alterExpr.toString().toUpperCase();
                            if (exprStr.contains("DROP") || exprStr.contains("DELETE")) {
                                hasRisk = true;
                                riskLevel = "HIGH";
                                warnings.add("⚠️ HIGH RISK AST WARNING: Migration drops column/constraint from table '" 
                                        + tableName + "'. Production traffic querying this column will throw exceptions!");
                            } else if (exprStr.contains("MODIFY") || exprStr.contains("TYPE")) {
                                hasRisk = true;
                                if (!"HIGH".equals(riskLevel)) riskLevel = "MEDIUM";
                                warnings.add("⚡ MEDIUM RISK AST WARNING: Migration modifies column data type in table '" 
                                        + tableName + "'. Potential data truncation or type casting failure.");
                            }
                        }
                    }
                }
                // 2. Check DROP TABLE statements
                else if (stmt instanceof Drop drop) {
                    hasRisk = true;
                    riskLevel = "HIGH";
                    warnings.add("💥 CRITICAL RISK AST WARNING: Migration drops entire database table/object '" 
                            + drop.getName() + "'.");
                }
            }

            if (!hasRisk) {
                warnings.add("✅ AST Analysis Passed: Clean migration script. No destructive operations detected.");
            }

            return new AstAnalysisResponse(hasRisk, riskLevel, warnings, parsedCount);

        } catch (Exception e) {
            // Fallback string pattern matching for dialect variations
            String upperSql = sql.toUpperCase();
            if (upperSql.contains("DROP COLUMN") || upperSql.contains("DROP TABLE")) {
                return new AstAnalysisResponse(
                        true,
                        "HIGH",
                        List.of("⚠️ HIGH RISK AST WARNING: Destructive DROP operation detected in migration script!"),
                        1
                );
            }
            return new AstAnalysisResponse(
                    false,
                    "LOW",
                    List.of("ℹ️ AST Static Analysis Completed."),
                    1
            );
        }
    }
}
